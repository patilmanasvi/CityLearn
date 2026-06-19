import os
import re
import math
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Tuple

import uvicorn
import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Import schemas
from app.schemas import EventInput, ClosureResponse, PriorityResponse, ManpowerResponse

# Import fingerprint, similarity, prediction, and recommendation services
from fingerprint_engine import load_and_prepare_dataset, fingerprint_from_api_payload
from similarity_service import get_similarity_service
from prediction_service import get_prediction_service
from recommendation_service import get_recommendation_service

# Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("citylearn.api")

# Coordinates for Bangalore center
BANGALORE_LAT = 12.9716
BANGALORE_LON = 77.5946

def parse_int_with_commas(s: str) -> int:
    try:
        return int(float(s.replace(',', '')))
    except ValueError:
        return 0

def get_attendance_and_duration(payload: EventInput) -> Tuple[int, int]:
    attendance = payload.attendance
    duration = payload.duration
    comment_str = payload.comment or ""
    
    if attendance is None:
        att_match = re.search(r'(?:attendance\s*(?:estimate)?\s*:\s*|attendance\s+)(\d+(?:,\d+)*)', comment_str, re.IGNORECASE)
        if att_match:
            attendance = parse_int_with_commas(att_match.group(1))
        else:
            att_match2 = re.search(r'(\d+(?:,\d+)*)\s*(?:people|persons|attendees|participants)', comment_str, re.IGNORECASE)
            if att_match2:
                attendance = parse_int_with_commas(att_match2.group(1))
            else:
                attendance = 0
                
    if duration is None:
        dur_match = re.search(r'(?:duration\s*(?:est)?\s*:\s*|duration\s+)(\d+(?:,\d+)*)', comment_str, re.IGNORECASE)
        if dur_match:
            duration = parse_int_with_commas(dur_match.group(1))
        else:
            dur_match2 = re.search(r'(\d+(?:,\d+)*)\s*(?:min|minute|minutes|hr|hour|hours)', comment_str, re.IGNORECASE)
            if dur_match2:
                val = parse_int_with_commas(dur_match2.group(1))
                unit = dur_match2.group(0).lower()
                if 'hr' in unit or 'hour' in unit:
                    duration = val * 60
                else:
                    duration = val
            else:
                duration = 0
                
    return attendance, duration

def get_coordinates(payload: EventInput) -> Tuple[float, float]:
    lat = payload.latitude
    lon = payload.longitude
    comment_str = payload.comment or ""
    
    if lat is None or lon is None:
        lat_match = re.search(r'(?:lat(?:itude)?\s*:\s*|coords?\s+)([-+]?\d*\.\d+|\b[-+]?\d+\b)', comment_str, re.IGNORECASE)
        lon_match = re.search(r'(?:lon(?:gitude)?\s*:\s*|coords?\s+[-+]?\d*\.\d+\s*,\s*|coords?\s+[-+]?\d+\s*,\s*)([-+]?\d*\.\d+|\b[-+]?\d+\b)', comment_str, re.IGNORECASE)
        
        if lat_match and lat is None:
            try:
                lat = float(lat_match.group(1))
            except ValueError:
                pass
        if lon_match and lon is None:
            try:
                lon = float(lon_match.group(1))
            except ValueError:
                pass
                
        if lat is None:
            lat = BANGALORE_LAT
        if lon is None:
            lon = BANGALORE_LON
            
    return lat, lon

# Global variables to store loaded CatBoost models
closure_model = None
priority_model = None
ordinal_encoder = None

dataset_df = None
ml_prediction_requests_count = 0
last_analyzed_event = None
last_analysis_response = None

def get_season(month: int) -> str:
    """Map month index to Bangalore/India season."""
    if month in [12, 1, 2]:
        return 'Winter'
    elif month in [3, 4, 5]:
        return 'Summer'
    elif month in [6, 7, 8, 9]:
        return 'Monsoon'
    else:
        return 'Post-Monsoon'

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the haversine distance in km between two lat/lon pairs."""
    if any(math.isnan(v) for v in [lat1, lon1, lat2, lon2]):
        return 999.0
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def extract_time_features(start_datetime_str: str):
    """Parse start_datetime and return hour, weekday, and season."""
    hour = 12
    weekday = "Monday"
    season = "Monsoon"
    if start_datetime_str:
        try:
            dt = pd.to_datetime(start_datetime_str)
            hour = dt.hour
            weekday = dt.strftime('%A')
            season = get_season(dt.month)
        except Exception:
            pass
    return hour, weekday, season

def prepare_features(payload: EventInput) -> list:
    """Convert input payload to the encoded feature list expected by CatBoost."""
    hour, weekday, season = extract_time_features(payload.start_datetime)
    
    # Preprocess categorical fields (strip, title-case, handle 'Unknown' / 'None')
    def clean_str(val: str, name: str) -> str:
        if val is None:
            return 'Unknown'
        cleaned = str(val).strip().title()
        if name in ['zone', 'junction']:
            if cleaned in ['None', '', 'False']:
                return 'Unknown'
        return cleaned

    event_type = clean_str(payload.event_type, 'event_type')
    event_cause = clean_str(payload.event_cause, 'event_cause')
    
    # Override corridor/zone using structured location if available
    city_val = payload.city if (payload.city and payload.city != "Unknown") else ""
    state_val = payload.state if (payload.state and payload.state != "Unknown") else ""
    country_val = payload.country if (payload.country and payload.country != "Unknown") else ""
    
    if city_val or state_val or country_val:
        parts = [city_val, state_val, country_val]
        corridor_val = ", ".join([p for p in parts if p])
        corridor = clean_str(corridor_val, 'corridor')
        zone = clean_str(state_val if state_val else country_val, 'zone')
    else:
        corridor = clean_str(payload.corridor, 'corridor')
        zone = clean_str(payload.zone, 'zone')
        
    police_station = clean_str(payload.police_station, 'police_station')
    junction = clean_str(payload.junction, 'junction')
    weekday_cleaned = clean_str(weekday, 'weekday')
    season_cleaned = clean_str(season, 'season')

    # Convert coordinates
    latitude, longitude = get_coordinates(payload)

    # Encode categoricals using the loaded OrdinalEncoder
    # OrdinalEncoder expects columns in this order:
    # ['event_type', 'event_cause', 'corridor', 'police_station', 'zone', 'junction', 'weekday', 'season']
    cats_df = pd.DataFrame(
        [[event_type, event_cause, corridor, police_station, zone, junction, weekday_cleaned, season_cleaned]],
        columns=['event_type', 'event_cause', 'corridor', 'police_station', 'zone', 'junction', 'weekday', 'season']
    )
    encoded_cats = ordinal_encoder.transform(cats_df)[0]

    # Feature columns order: CATEGORICAL_COLS + NUMERIC_COLS
    # [event_type_enc, event_cause_enc, corridor_enc, police_station_enc, zone_enc, junction_enc, weekday_enc, season_enc, latitude, longitude, hour]
    features = list(encoded_cats) + [latitude, longitude, hour]
    return features

def event_payload_to_dict(payload: EventInput) -> Dict[str, Any]:
    return payload.model_dump()

def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        val = float(value)
        if math.isnan(val):
            return default
        return val
    except Exception:
        return default

def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except Exception:
        return default

def row_for_event_id(event_id: int) -> Optional[pd.Series]:
    if dataset_df is None or dataset_df.empty:
        return None
    match = dataset_df[dataset_df["id"] == event_id]
    if match.empty:
        return None
    return match.iloc[0]

def format_timestamp(value: Any) -> Optional[str]:
    if value is None or pd.isna(value):
        return None
    try:
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return pd.to_datetime(value).isoformat()
    except Exception:
        return str(value)

def build_similarity_reason(row: Optional[pd.Series], query_fp: Dict[str, Any], score: float) -> str:
    reasons = []
    if row is not None:
        if str(row.get("event_type", "")).lower() == str(query_fp.get("event_type", "")).lower():
            reasons.append("same event type")
        if str(row.get("event_cause", "")).lower() == str(query_fp.get("event_cause", "")).lower():
            reasons.append("matching cause")
        if str(row.get("zone", "")).lower() == str(query_fp.get("zone", "")).lower():
            reasons.append("same zone")
        if str(row.get("corridor", "")).lower() == str(query_fp.get("corridor", "")).lower():
            reasons.append("same corridor")
    if score >= 85:
        reasons.append("high fingerprint similarity")
    if not reasons:
        reasons.append("closest fingerprint match in historical dataset")
    return "Matched on " + ", ".join(reasons) + "."

def build_similar_events(payload: EventInput, top_k: int = 5) -> List[Dict[str, Any]]:
    query_fp = fingerprint_from_api_payload(event_payload_to_dict(payload))
    sim_svc = get_similarity_service()
    response = sim_svc.find_similar_events(query_fp, top_k=top_k)

    events = []
    for matched in response.similar_events:
        row = row_for_event_id(matched.historical_event_id)
        event_name = matched.event_type
        location = matched.corridor
        timestamp = None
        cause = None
        status = None
        duration = matched.resolution_time
        if row is not None:
            event_name = str(row.get("event_type", event_name))
            location = str(row.get("corridor", location))
            timestamp = format_timestamp(row.get("start_datetime"))
            cause = str(row.get("event_cause", "Unknown"))
            status = str(row.get("status", "Unknown"))
            duration = safe_float(row.get("duration_minutes"), safe_float(duration, 0.0))
        events.append({
            "id": matched.historical_event_id,
            "event_name": event_name,
            "event_type": event_name,
            "location": location,
            "timestamp": timestamp,
            "datetime": timestamp,
            "similarity_score": matched.similarity_score,
            "reason_for_match": build_similarity_reason(row, query_fp, matched.similarity_score),
            "why_matched": build_similarity_reason(row, query_fp, matched.similarity_score),
            "cause": cause or "Unknown",
            "priority": "High" if matched.priority >= 3 else "Low",
            "status": status or "Unknown",
            "requires_road_closure": "Yes" if matched.requires_road_closure else "No",
            "resolution_time": duration,
        })
    return events

def build_lessons_learned(payload: EventInput, similar_events: List[Dict[str, Any]]) -> str:
    if not similar_events or dataset_df is None or dataset_df.empty:
        return "No historical matches were available in the dataset for this event input."

    ids = [item["id"] for item in similar_events]
    sub_df = dataset_df[dataset_df["id"].isin(ids)]
    if sub_df.empty:
        return "No historical matches were available in the dataset for this event input."

    closure_ratio = float(sub_df["requires_road_closure"].mean())
    avg_duration = safe_float(sub_df["duration_minutes"].mean(), 0.0)
    top_event = similar_events[0]
    common_corridor = sub_df["corridor"].mode().iloc[0] if "corridor" in sub_df and not sub_df["corridor"].mode().empty else top_event["location"]
    closure_text = "often required closures and early diversion" if closure_ratio >= 0.5 else "were usually handled without full closure"
    duration_text = f"Average resolution across the matched cases was {round(avg_duration)} minutes" if avg_duration > 0 else "Resolution duration was not consistently recorded"
    return (
        f"The closest dataset matches centered on {common_corridor}; they {closure_text}. "
        f"{duration_text}. The strongest match was {top_event['event_name']} at "
        f"{top_event['location']} with {top_event['similarity_score']:.1f}% similarity, so response planning should prioritize the recurring cause, corridor, and closure pattern seen in those records."
    )

def build_predictions(payload: EventInput, similar_events: List[Dict[str, Any]]) -> Dict[str, Any]:
    features = prepare_features(payload)
    closure_pred = bool(closure_model.predict([features])[0])
    closure_proba = closure_model.predict_proba([features])[0]

    priority_pred = int(priority_model.predict([features])[0])
    priority_proba = priority_model.predict_proba([features])[0]
    severity_level = "High" if priority_pred == 1 else "Low"

    attendance, duration = get_attendance_and_duration(payload)
    duration = duration or 0
    attendance = attendance or 0
    closure_conf = float(closure_proba[1] if closure_pred else closure_proba[0])
    priority_conf = float(priority_proba[1] if priority_pred == 1 else priority_proba[0])
    confidence = max(closure_conf, priority_conf)

    top_sim = similar_events[0]["similarity_score"] if similar_events else 0.0
    reliability = round((confidence * 100.0 * 0.6) + (top_sim * 0.4), 1)
    congestion_score = round(min(10.0, 1.0 + (attendance / 15000.0) + (duration / 180.0) + (2.0 if closure_pred else 0.0) + (1.5 if priority_pred == 1 else 0.0)), 1)
    resolution_prediction = int(round((duration if duration > 0 else 60) * (1.15 if closure_pred else 0.85) + (attendance / 2500.0) + (30 if priority_pred == 1 else 0)))

    hour, _, _ = extract_time_features(payload.start_datetime)
    if (7 <= hour <= 10) or (16 <= hour <= 20):
        trend = "Upward Trend"
    elif 10 < hour < 16:
        trend = "Downward Trend"
    else:
        trend = "Stable"
    stability = "Volatile" if severity_level == "High" or congestion_score >= 7 else "Stable"

    return {
        "road_closure_required": closure_pred,
        "road_closure_probability": float(closure_proba[1]),
        "priority": severity_level,
        "priority_probability": priority_conf,
        "congestion_prediction": congestion_score,
        "severity_level": severity_level,
        "resolution_prediction": resolution_prediction,
        "ai_confidence": confidence,
        "reliability_score": reliability,
        "crowd_stability_forecast": stability,
        "predictive_congestion_trend": trend,
    }

def build_recommendations(payload: EventInput, predictions: Dict[str, Any], similar_events: List[Dict[str, Any]]) -> Dict[str, Any]:
    attendance, duration = get_attendance_and_duration(payload)
    attendance = attendance or 0
    duration = duration or 0
    closure_required = bool(predictions["road_closure_required"])
    high_priority = predictions["severity_level"] == "High"
    similar_closures = sum(1 for event in similar_events if event["requires_road_closure"] == "Yes")
    avg_resolution = 0.0
    durations = [safe_float(event.get("resolution_time"), 0.0) for event in similar_events]
    durations = [val for val in durations if val > 0]
    if durations:
        avg_resolution = sum(durations) / len(durations)

    officers = math.ceil(attendance / 5000) + (2 if closure_required else 0) + (2 if high_priority else 0) + (1 if avg_resolution > 150 else 0)
    officers = max(1, officers)
    corridor = payload.corridor if payload.corridor and payload.corridor != "Unknown" else (similar_events[0]["location"] if similar_events else "input corridor")
    zone = payload.zone if payload.zone and payload.zone != "Unknown" else corridor
    similar_count = len(similar_events)
    historical_basis = f"{similar_count} matched historical events" if similar_count else "the current ML output"

    barricade_required = closure_required or similar_closures > (similar_count / 2 if similar_count else 0)
    diversion_required = closure_required or predictions["congestion_prediction"] >= 6.5
    route = f"Divert through adjacent approaches around {corridor}" if diversion_required else f"Keep traffic on {corridor} with signal monitoring"

    return {
        "officer_deployment": {
            "officer_count": officers,
            "deployment_area": zone,
            "reasoning": (
                f"{officers} officers recommended from attendance {attendance}, severity {predictions['severity_level']}, "
                f"closure prediction {predictions['road_closure_probability']:.1%}, and {historical_basis}."
            ),
        },
        "barricade_plan": {
            "required": barricade_required,
            "locations": [corridor],
            "reasoning": (
                f"Barricades are {'required' if barricade_required else 'not required'} because the ML closure prediction is "
                f"{predictions['road_closure_required']} and {similar_closures} of {similar_count} similar dataset events required closure."
            ),
        },
        "diversion_strategy": {
            "required": diversion_required,
            "routes": [route],
            "reasoning": (
                f"Diversion is {'required' if diversion_required else 'not required'} from congestion score "
                f"{predictions['congestion_prediction']}/10 and predicted resolution {predictions['resolution_prediction']} minutes."
            ),
        },
        "impact_score": int(min(100, round(predictions["congestion_prediction"] * 8 + (20 if closure_required else 0) + min(20, attendance / 5000)))),
        "efficiency_gains": int(min(100, round(predictions["reliability_score"] / 5 + officers))),
    }

def build_dashboard_metrics(payload: EventInput, predictions: Dict[str, Any], similar_events: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_events = int(len(dataset_df)) if dataset_df is not None else 0
    resolved_count = 0
    avg_resolution = 0.0
    recent_activities = []
    event_trends = {}
    congestion_matrix = []
    high_risk_zones = {}
    if dataset_df is not None and not dataset_df.empty:
        resolved_count = int(len(dataset_df[dataset_df["status"].astype(str).str.lower() == "resolved"]))
        avg_resolution = safe_float(dataset_df["duration_minutes"].mean(), 0.0)
        event_trends = {str(k): int(v) for k, v in dataset_df["weekday"].value_counts().to_dict().items()}
        high_risk_zones = {str(k): int(v) for k, v in dataset_df["zone"].value_counts().head(5).to_dict().items()}
        hourly_counts = dataset_df["hour"].value_counts().sort_index().to_dict() if "hour" in dataset_df else {}
        congestion_matrix = [int(hourly_counts.get(h, 0)) for h in range(24)]
        recent_df = dataset_df.sort_values(by="start_datetime", ascending=False).head(5)
        for _, r in recent_df.iterrows():
            recent_activities.append({
                "id": safe_int(r.get("id")),
                "event_type": str(r.get("event_type", "Unknown")),
                "time": format_timestamp(r.get("start_datetime")),
                "description": str(r.get("description", "")),
                "corridor": str(r.get("corridor", "")),
            })

    return {
        "total_events": total_events,
        "events_analyzed": ml_prediction_requests_count,
        "predictions_count": ml_prediction_requests_count,
        "similarity_count": len(similar_events),
        "reliability_score": predictions["reliability_score"],
        "active_event_type": payload.event_type,
        "active_location": payload.corridor,
        "active_severity": predictions["severity_level"],
        "active_congestion": predictions["congestion_prediction"],
        "resolved_events_count": resolved_count,
        "avg_resolution_time": round(avg_resolution, 1),
        "high_risk_zones": high_risk_zones,
        "event_trends": event_trends,
        "recent_activities": recent_activities,
        "congestion_matrix": congestion_matrix,
    }

def compose_analysis_response(payload: EventInput) -> Dict[str, Any]:
    similar_events = build_similar_events(payload, top_k=5)
    predictions = build_predictions(payload, similar_events)
    lessons = build_lessons_learned(payload, similar_events)
    recommendations = build_recommendations(payload, predictions, similar_events)
    dashboard_metrics = build_dashboard_metrics(payload, predictions, similar_events)
    return {
        "event_analysis": {
            "input": event_payload_to_dict(payload),
            "event_type": payload.event_type,
            "location": payload.corridor,
            "timestamp": payload.start_datetime,
        },
        "predictions": predictions,
        "similar_events": similar_events,
        "lessons_learned": lessons,
        "recommendations": recommendations,
        "dashboard_metrics": dashboard_metrics,
    }

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    global closure_model, priority_model, ordinal_encoder, dataset_df
    logger.info("Initializing unified backend services on startup...")
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Load CatBoost Models and OrdinalEncoder from ml_artifacts
    closure_path = os.path.join(BASE_DIR, "ml_artifacts", "closure_model.joblib")
    priority_path = os.path.join(BASE_DIR, "ml_artifacts", "priority_model.joblib")
    encoder_path = os.path.join(BASE_DIR, "ml_artifacts", "ordinal_encoder.joblib")

    logger.info("Loading CatBoost ML models and encoder...")
    try:
        closure_model = joblib.load(closure_path)
        priority_model = joblib.load(priority_path)
        ordinal_encoder = joblib.load(encoder_path)
        logger.info("Successfully loaded CatBoost models and OrdinalEncoder.")
    except Exception as e:
        logger.error(f"Error loading CatBoost ML artifacts: {e}")
        raise e

    # 2. Load dataset and build similarity index (for TF-IDF/FAISS search)
    try:
        dataset_path = os.path.join(BASE_DIR, "citylearn_cleaned_data.csv")
        logger.info(f"Loading dataset from {dataset_path} to build similarity index...")
        dataset_df, fingerprints = load_and_prepare_dataset(dataset_path)
        sim_svc = get_similarity_service()
        sim_svc.build_index(fingerprints)
        logger.info(f"Similarity index built successfully. Total records: {sim_svc.index_size()}")
    except Exception as e:
        logger.error(f"Error initializing similarity index: {e}")
        raise e

    # 3. Train in-memory RandomForest models
    try:
        pred_svc = get_prediction_service()
        pred_svc.dataset_path = dataset_path
        pred_svc.train_models()
        logger.info("RandomForest ML Models successfully trained in-memory.")
    except Exception as e:
        logger.error(f"Error training in-memory RandomForest models: {e}")
        raise e
        
    yield
    logger.info("Shutting down backend services...")

app = FastAPI(
    title="CityLearn Traffic Intelligence Unified Backend API",
    description="ML predictions, similarity lookup, and recommendation engine unified services.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the CityLearn Traffic Intelligence API!",
        "status": "online",
        "strategy": get_similarity_service().get_strategy()
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/analyze-event")
def analyze_event(payload: EventInput):
    try:
        global ml_prediction_requests_count, last_analyzed_event, last_analysis_response
        ml_prediction_requests_count += 1
        last_analyzed_event = payload
        response = compose_analysis_response(payload)
        last_analysis_response = response
        return response
    except Exception as e:
        logger.error(f"Unified event analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/last-analysis")
def get_last_analysis():
    if last_analysis_response is None:
        raise HTTPException(status_code=404, detail="No analyzed event is available yet.")
    return last_analysis_response

# --- CatBoost ML Endpoints ---

@app.post("/predict/closure", response_model=ClosureResponse)
def predict_closure(payload: EventInput):
    """Predicts whether the event requires a road closure, along with probability (CatBoost)."""
    try:
        global ml_prediction_requests_count, last_analyzed_event
        ml_prediction_requests_count += 1
        last_analyzed_event = payload
        features = prepare_features(payload)
        pred = closure_model.predict([features])[0]
        proba = closure_model.predict_proba([features])[0]
        predicted_bool = bool(pred)
        probability = float(proba[1])
        return {
            "predicted_road_closure": predicted_bool,
            "probability": probability
        }
    except Exception as e:
        logger.error(f"Road closure CatBoost prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/priority", response_model=PriorityResponse)
def predict_priority(payload: EventInput):
    """Predicts the event priority (High/Low), along with probability (CatBoost)."""
    try:
        global ml_prediction_requests_count, last_analyzed_event
        ml_prediction_requests_count += 1
        last_analyzed_event = payload
        features = prepare_features(payload)
        pred = priority_model.predict([features])[0]
        proba = priority_model.predict_proba([features])[0]
        predicted_priority = "High" if pred == 1 else "Low"
        probability = float(proba[1]) if pred == 1 else float(proba[0])
        return {
            "predicted_priority": predicted_priority,
            "probability": probability
        }
    except Exception as e:
        logger.error(f"Priority CatBoost prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/manpower", response_model=ManpowerResponse)
def predict_manpower(payload: EventInput):
    """Calculates a rule-based manpower and diversion score using exact feature weights (CatBoost-integrated)."""
    try:
        global ml_prediction_requests_count, last_analyzed_event
        ml_prediction_requests_count += 1
        last_analyzed_event = payload
        # 1. Event Type (15% weight)
        et = str(payload.event_type).strip().lower()
        if et in ['unplanned', 'transit surge', 'infrastructure failure']:
            s_et = 100
        elif et == 'public assembly':
            s_et = 80
        elif et in ['planned', 'dynamic maintenance']:
            s_et = 50
        else:
            s_et = 30

        # 2. Location (12% weight)
        lat, lon = get_coordinates(payload)
        dist = haversine_distance(lat, lon, BANGALORE_LAT, BANGALORE_LON)
        if dist <= 5.0:
            s_loc = 100.0
        elif dist <= 15.0:
            s_loc = 90.0
        elif dist <= 50.0:
            s_loc = 75.0
        elif dist <= 200.0:
            s_loc = 60.0
        elif dist <= 1000.0:
            s_loc = 40.0
        elif dist <= 3000.0:
            s_loc = 20.0
        else:
            s_loc = 10.0

        # 3. Start Datetime (10% weight)
        hour, _, _ = extract_time_features(payload.start_datetime)
        if (7 <= hour <= 10) or (16 <= hour <= 20):
            s_dt = 100
        elif 10 < hour < 16:
            s_dt = 60
        else:
            s_dt = 20

        # 4. Requires Road Closure (10% weight)
        rc = payload.requires_road_closure
        if rc is None:
            if payload.closure_status:
                rc = (str(payload.closure_status).strip().lower() in ['full closure', 'partial closure'])
            else:
                # Predict it if not provided
                features = prepare_features(payload)
                rc = bool(closure_model.predict([features])[0])
        s_rc = 100 if rc else 0

        # 5. Corridor (7% weight)
        city_val = payload.city if (payload.city and payload.city != "Unknown") else ""
        state_val = payload.state if (payload.state and payload.state != "Unknown") else ""
        country_val = payload.country if (payload.country and payload.country != "Unknown") else ""
        if city_val or state_val or country_val:
            parts = [city_val, state_val, country_val]
            corr = ", ".join([p for p in parts if p]).strip().lower()
        else:
            corr = str(payload.corridor).strip().lower() if payload.corridor else 'unknown'
            
        if corr in ['unknown', 'none', '', 'non-corridor']:
            s_corr = 30
        else:
            s_corr = 100

        # 6. Junction (6% weight)
        junc = str(payload.junction).strip().lower() if payload.junction else 'unknown'
        if junc in ['unknown', 'none', 'false', '0', '']:
            s_junc = 30
        else:
            s_junc = 100

        # 7. Priority (6% weight)
        prio = payload.priority
        if prio is None or str(prio).strip().lower() in ['unknown', 'none', '']:
            # Predict it if not provided
            features = prepare_features(payload)
            pred_p = priority_model.predict([features])[0]
            prio = "High" if pred_p == 1 else "Low"
        
        prio_cleaned = str(prio).strip().lower()
        if prio_cleaned == 'high':
            s_prio = 100
        elif prio_cleaned == 'low':
            s_prio = 40
        else:
            s_prio = 30

        # 8. Event Cause (5% weight)
        cause = str(payload.event_cause).strip().lower() if payload.event_cause else 'unknown'
        high_causes = ['accident', 'protest', 'rally', 'water_logging', 'tree_fall', 'hoarding_fall', 'bmtc_breakdown']
        med_causes = ['vehicle_breakdown', 'road_conditions', 'others', 'drainage_overflow']
        if cause in high_causes:
            s_cause = 100
        elif cause in med_causes:
            s_cause = 60
        else:
            s_cause = 30

        # 9. Police Station (5% weight)
        ps = str(payload.police_station).strip().lower() if payload.police_station else 'unknown'
        if ps in ['unknown', 'none', 'no police station', '']:
            s_ps = 30
        else:
            s_ps = 100

        # 10. Remainder Columns (24% total weight)
        # Split equally between the remaining fields: direction, veh_type, description, comment (6% each)
        def score_remainder(val) -> float:
            if val is None:
                return 0.0
            cleaned = str(val).strip().lower()
            if cleaned in ['unknown', 'none', '']:
                return 0.0
            return 100.0

        s_dir = score_remainder(payload.direction)
        s_vt = score_remainder(payload.veh_type)
        s_desc = score_remainder(payload.description)
        
        # Calculate dynamic comment / attendance & duration score
        attendance, duration = get_attendance_and_duration(payload)
        attendance_score = min(100.0, (attendance / 100000.0) * 100.0)
        duration_score = min(100.0, (duration / 480.0) * 100.0)
        s_comm = 0.5 * attendance_score + 0.5 * duration_score

        # Sum of weights: 0.15 + 0.12 + 0.10 + 0.10 + 0.07 + 0.06 + 0.06 + 0.05 + 0.05 + 4 * 0.06 = 1.00
        raw_score = (
            0.15 * s_et + 
            0.12 * s_loc + 
            0.10 * s_dt + 
            0.10 * s_rc + 
            0.07 * s_corr + 
            0.06 * s_junc + 
            0.06 * s_prio + 
            0.05 * s_cause + 
            0.05 * s_ps +
            0.06 * s_dir +
            0.06 * s_vt +
            0.06 * s_desc +
            0.06 * s_comm
        )
        
        final_score = round(raw_score, 2)

        # Personnel recommendation
        attendance, duration = get_attendance_and_duration(payload)
        recommended_manpower = math.ceil(attendance / 5000) + (2 if rc else 0) + (2 if prio_cleaned == 'high' else 0)
        recommended_manpower = max(1, recommended_manpower)

        # Suggested diversion
        # Override corridor name with structured location if available
        city_val = payload.city if (payload.city and payload.city != "Unknown") else ""
        state_val = payload.state if (payload.state and payload.state != "Unknown") else ""
        country_val = payload.country if (payload.country and payload.country != "Unknown") else ""
        if city_val or state_val or country_val:
            parts = [city_val, state_val, country_val]
            corridor_name = ", ".join([p for p in parts if p])
        else:
            corridor_name = payload.corridor if payload.corridor and payload.corridor != "Unknown" else "active corridor"
        if final_score >= 75 and rc:
            suggested_diversion = f"Critical: Full diversion required around {corridor_name}"
        elif final_score >= 50:
            suggested_diversion = f"Moderate: Consider diversion around {corridor_name}"
        else:
            suggested_diversion = "No diversion required. Monitor traffic flow."

        # Recommended action
        if final_score >= 80:
            recommended_action = "Deploy emergency response team, set up barricades, and initiate dynamic traffic light control."
        elif final_score >= 60:
            recommended_action = "Dispatch traffic police officers and monitor congestion on adjacent routes."
        elif final_score >= 40:
            recommended_action = "Alert nearest police station and keep monitoring the status."
        else:
            recommended_action = "Normal monitoring. No immediate dispatch needed."

        return {
            "manpower_diversion_score": final_score,
            "recommended_manpower": recommended_manpower,
            "suggested_diversion": suggested_diversion,
            "recommended_action": recommended_action
        }
    except Exception as e:
        logger.error(f"Manpower score calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Legacy / Similarity / Recommendation Endpoints ---

@app.post("/api/fingerprint")
def get_fingerprint(payload: EventInput):
    """Returns the canonical Natural Language fingerprint string."""
    try:
        fp = fingerprint_from_api_payload(payload.model_dump())
        fp_copy = fp.copy()
        fp_copy.pop("embedding", None)
        return fp_copy
    except Exception as e:
        logger.error("Fingerprint generation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/similar-events")
def get_similar_events(payload: EventInput, top_k: int = 5):
    """Finds top-K similar historical events using FAISS/TF-IDF lookup."""
    try:
        fp = fingerprint_from_api_payload(payload.model_dump())
        sim_svc = get_similarity_service()
        response = sim_svc.find_similar_events(fp, top_k=top_k)
        return sim_svc.response_to_dict(response)
    except Exception as e:
        logger.error("Similar events search failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predictions")
def get_predictions(payload: EventInput):
    """Runs in-memory ML classifiers to predict road closure, priority, and manpower scores."""
    try:
        pred_svc = get_prediction_service()
        result = pred_svc.predict(payload.model_dump())
        return result
    except Exception as e:
        logger.error("Event prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations")
def get_recommendations(payload: EventInput):
    """Returns the structured mitigation recommendations integrating similar events analysis."""
    try:
        rec_svc = get_recommendation_service()
        result = rec_svc.generate_recommendations(payload.model_dump())
        return result
    except Exception as e:
        logger.error("Recommendations generation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/learning")
def trigger_learning(payload: EventInput):
    """Adds a new (resolved or verified) event to the similarity index."""
    try:
        fp = fingerprint_from_api_payload(payload.model_dump())
        sim_svc = get_similarity_service()
        sim_svc.add_fingerprint(fp)
        return {
            "status": "success",
            "message": "Event successfully added to similarity index",
            "event_id": fp.get("event_id"),
            "total_indexed_events": sim_svc.index_size()
        }
    except Exception as e:
        logger.error("Online learning loop execution failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

# --- Unified Analytics & Dashboard Endpoints ---

@app.get("/api/dashboard-metrics")
def get_dashboard_metrics():
    try:
        if dataset_df is None or dataset_df.empty:
            return {
                "total_events": 0,
                "events_analyzed": ml_prediction_requests_count,
                "event_types_distribution": {},
                "high_risk_zones": {},
                "high_risk_junctions": {},
                "road_closure_stats": {},
                "priority_distribution": {},
                "resolved_events_count": 0,
                "avg_resolution_time": 0,
                "recent_activities": [],
                "event_trends": {},
                "congestion_matrix": []
            }
            
        total = len(dataset_df)
        
        # 1. Distributions
        types_dist = dataset_df["event_type"].value_counts().to_dict()
        prio_dist = dataset_df["priority"].value_counts().to_dict()
        prio_dist_clean = {}
        for k, v in prio_dist.items():
            if str(k) in ['3', '4', '5'] or k in [3, 4, 5]:
                prio_dist_clean["High"] = prio_dist_clean.get("High", 0) + v
            else:
                prio_dist_clean["Low"] = prio_dist_clean.get("Low", 0) + v
                
        rc_counts = dataset_df["requires_road_closure"].value_counts().to_dict()
        rc_dist = {str(k): v for k, v in rc_counts.items()}
        
        # 2. Risk Areas
        zones = dataset_df["zone"].value_counts().head(5).to_dict()
        junctions = dataset_df["junction"].value_counts().head(5).to_dict()
        
        # 3. Resolutions
        resolved_count = len(dataset_df[dataset_df["status"].str.lower() == "resolved"])
        avg_res = dataset_df["duration_minutes"].mean()
        if math.isnan(avg_res) or avg_res <= 0:
            avg_res = 120.0
            
        # 4. Recent Activities
        recent_df = dataset_df.sort_values(by="start_datetime", ascending=False).head(5)
        activities = []
        for _, r in recent_df.iterrows():
            time_str = "12:00"
            if pd.notnull(r["start_datetime"]):
                try:
                    time_str = r["start_datetime"].strftime("%H:%M")
                except Exception:
                    pass
            activities.append({
                "id": int(r["id"]),
                "event_type": str(r["event_type"]),
                "time": time_str,
                "description": str(r["description"]),
                "corridor": str(r["corridor"])
            })
            
        # 5. Trends
        trends = dataset_df["weekday"].value_counts().to_dict()
        
        # 6. Congestion Matrix
        hourly_counts = dataset_df["hour"].value_counts().sort_index().to_dict()
        matrix = [int(hourly_counts.get(h, 0)) for h in range(24)]
        
        return {
            "total_events": total,
            "events_analyzed": ml_prediction_requests_count,
            "event_types_distribution": types_dist,
            "high_risk_zones": zones,
            "high_risk_junctions": junctions,
            "road_closure_stats": rc_dist,
            "priority_distribution": prio_dist_clean,
            "resolved_events_count": resolved_count,
            "avg_resolution_time": round(avg_res, 1),
            "recent_activities": activities,
            "event_trends": trends,
            "congestion_matrix": matrix
        }
    except Exception as e:
        logger.error(f"Dashboard metrics endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/last-analyzed-event")
def get_last_analyzed_event():
    global last_analyzed_event
    if last_analyzed_event is not None:
        return last_analyzed_event
    raise HTTPException(status_code=404, detail="No analyzed event is available yet.")

@app.post("/api/similar-events-detail")
def get_similar_events_detail(payload: EventInput, top_k: int = 5):
    try:
        fp = fingerprint_from_api_payload(payload.model_dump())
        sim_svc = get_similarity_service()
        res = sim_svc.find_similar_events(fp, top_k=top_k)
        
        enriched_events = []
        for matched in res.similar_events:
            event_id = matched.historical_event_id
            row = dataset_df[dataset_df["id"] == event_id] if dataset_df is not None else pd.DataFrame()
            why_matched = "Matched event type and location proximity"
            start_time_str = "2024-03-07 17:01"
            cause = matched.event_cause
            status = "Resolved"
            
            if not row.empty:
                r = row.iloc[0]
                if pd.notnull(r["start_datetime"]):
                    try:
                        start_time_str = r["start_datetime"].strftime("%Y-%m-%d %H:%M")
                    except Exception:
                        pass
                cause = str(r["event_cause"])
                status = str(r["status"])
                reasons = []
                if str(r["event_type"]).lower() == fp.get("event_type", "").lower():
                    reasons.append("same event type")
                if str(r["event_cause"]).lower() == fp.get("event_cause", "").lower():
                    reasons.append("matching cause")
                if str(r["zone"]).lower() == fp.get("zone", "").lower():
                    reasons.append("same zone")
                if matched.similarity_score > 85:
                    reasons.append("high spatial similarity")
                why_matched = " and ".join(reasons) if reasons else "Matched general traffic pattern"
                why_matched = why_matched[0].upper() + why_matched[1:]
                
            enriched_events.append({
                "id": event_id,
                "event_type": matched.event_type,
                "location": matched.corridor,
                "datetime": start_time_str,
                "cause": cause,
                "priority": "High" if matched.priority >= 3 else "Low",
                "status": status,
                "requires_road_closure": "Yes" if matched.requires_road_closure else "No",
                "similarity_score": matched.similarity_score,
                "why_matched": why_matched
            })
            
        return {"similar_events": enriched_events}
    except Exception as e:
        logger.error(f"Similar events detail endpoint failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lessons-learned")
def get_lessons_learned(payload: EventInput):
    try:
        fp = fingerprint_from_api_payload(payload.model_dump())
        sim_svc = get_similarity_service()
        res = sim_svc.find_similar_events(fp, top_k=5)
        
        similar_ids = [matched.historical_event_id for matched in res.similar_events]
        sub_df = dataset_df[dataset_df["id"].isin(similar_ids)] if dataset_df is not None else pd.DataFrame()
        
        insights = []
        if not sub_df.empty:
            closure_ratio = sub_df["requires_road_closure"].mean()
            if closure_ratio > 0.4:
                insights.append({
                    "title": "Protocol: Dynamic Rerouting Alpha",
                    "text": "Previous similar incidents in this zone frequently required dynamic perimeters and road closures.",
                    "tag": "Retain Strategy",
                    "confidence": "High Confidence"
                })
            else:
                insights.append({
                    "title": "Protocol: Active Monitoring",
                    "text": "Most historical events of this type were resolved without dynamic closures, recommending standard patrol units.",
                    "tag": "Patrol Mode",
                    "confidence": "Medium Confidence"
                })
                
            corridor = str(payload.corridor).strip()
            corr_df = dataset_df[dataset_df["corridor"] == corridor] if dataset_df is not None else pd.DataFrame()
            if len(corr_df) > 2:
                avg_res_time = corr_df["duration_minutes"].mean()
                if avg_res_time > 150:
                    insights.append({
                        "title": "Corridor Latency Alert",
                        "text": f"Events in the '{corridor}' corridor historically have higher resolution times (averaging {round(avg_res_time)} mins).",
                        "tag": "Iterate Strategy",
                        "confidence": "Root Cause: High Density"
                    })
                else:
                    insights.append({
                        "title": "Corridor Flow Optimal",
                        "text": f"Corridor '{corridor}' matches quick-resolution profiles (averaging {round(avg_res_time)} mins).",
                        "tag": "Standard Flow",
                        "confidence": "Low Latency Area"
                    })
            else:
                insights.append({
                    "title": "Unmonitored Sector Protocol",
                    "text": f"Fewer historical data points for '{corridor}' corridor; default fallback to standard sector routing.",
                    "tag": "Default Routing",
                    "confidence": "Adaptive Learning"
                })
                
            closure_events = sub_df[sub_df["requires_road_closure"] == True]
            non_closure = sub_df[sub_df["requires_road_closure"] == False]
            if not closure_events.empty and not non_closure.empty:
                avg_closure = closure_events["duration_minutes"].mean()
                avg_non = non_closure["duration_minutes"].mean()
                if avg_closure < avg_non:
                    insights.append({
                        "title": "Diversion Advantage Detected",
                        "text": "Similar incidents were resolved faster when active diversion perimeters were deployed on adjacent streets.",
                        "tag": "Optimize Strategy",
                        "confidence": "Highly Recommended"
                    })
                else:
                    insights.append({
                        "title": "Perimeter Lock Latency",
                        "text": "Hard perimeters caused secondary delays in adjacent zones; adaptive signal timing adjustments recommended.",
                        "tag": "Deprecate Lock",
                        "confidence": "Signal Adjust Only"
                    })
            else:
                insights.append({
                    "title": "Diversion Vector Analysis",
                    "text": "Deploying active traffic signs and early dynamic diversion is suggested to prevent queue buildup.",
                    "tag": "Deploy Early",
                    "confidence": "Flow Optimization"
                })
        else:
            insights = [
                {
                    "title": "Protocol: Standard Flow Alpha",
                    "text": "No direct matches found. Fallback to standard response patrol recommended.",
                    "tag": "Standard Flow",
                    "confidence": "Standard Confidence"
                }
            ]
            
        return {"insights": insights}
    except Exception as e:
        logger.error(f"Failed to get lessons learned: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predictive-intelligence")
def get_predictive_intelligence(payload: EventInput):
    try:
        features = prepare_features(payload)
        closure_pred = closure_model.predict([features])[0]
        closure_proba = closure_model.predict_proba([features])[0]
        
        priority_pred = priority_model.predict([features])[0]
        priority_proba = priority_model.predict_proba([features])[0]
        
        fp = fingerprint_from_api_payload(payload.model_dump())
        sim_svc = get_similarity_service()
        sim_res = sim_svc.find_similar_events(fp, top_k=1)
        top_sim = sim_res.similar_events[0].similarity_score if sim_res.similar_events else 0.0
        
        attendance, duration = get_attendance_and_duration(payload)
        base_res = 30 + (duration if duration > 0 else 120) * 0.5
        att_factor = (attendance / 2000.0)
        prio_factor = 60.0 if priority_pred == 1 else 0.0
        prediction_resolution = int(base_res + att_factor + prio_factor)
        
        att_score = min(100.0, (attendance / 100000.0) * 100.0)
        dur_score = min(100.0, ((duration or 0.0) / 480.0) * 100.0)
        s_comm = 0.5 * att_score + 0.5 * dur_score
        congestion_val = round((s_comm * 0.08) + 2.0, 1)
        
        severity_level = "High" if priority_pred == 1 else "Low"
        ai_confidence = float(max(closure_proba[1] if closure_pred else closure_proba[0], 
                                  priority_proba[1] if priority_pred else priority_proba[0]))
        
        intelligence_reliability = round(top_sim * 0.9 + 10.0, 1)
        
        hour, _, _ = extract_time_features(payload.start_datetime)
        if (7 <= hour <= 10) or (16 <= hour <= 20):
            trend = "Upward Trend"
        elif 10 < hour < 16:
            trend = "Downward Trend"
        else:
            trend = "Stable"
            
        et = str(payload.event_type).strip().lower()
        if et in ['public assembly', 'transit surge'] and attendance > 5000:
            stability = "Volatile"
        else:
            stability = "Stable"
            
        return {
            "transit_node_beta_congestion": congestion_val,
            "prediction_resolution": prediction_resolution,
            "severity_level": severity_level,
            "ai_confidence": ai_confidence,
            "intelligence_reliability": intelligence_reliability,
            "predictive_congestion_trend": trend,
            "crowd_stability_forecast": stability
        }
    except Exception as e:
        logger.error(f"Predictive intelligence failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/strategic-recommendations")
def get_strategic_recommendations(payload: EventInput):
    try:
        features = prepare_features(payload)
        prio_pred = priority_model.predict([features])[0]
        prio = "High" if prio_pred == 1 else "Low"
        
        closure_pred = closure_model.predict([features])[0]
        rc = payload.requires_road_closure
        if rc is None:
            if payload.closure_status:
                rc = (str(payload.closure_status).strip().lower() in ['full closure', 'partial closure'])
            else:
                rc = bool(closure_pred)
                
        attendance, duration = get_attendance_and_duration(payload)
        
        officers = math.ceil(attendance / 5000) + (2 if rc else 0) + (2 if prio == "High" else 0)
        officers = max(1, officers)
        
        zone = payload.zone if payload.zone and payload.zone != "Unknown" else payload.corridor
        corridor = payload.corridor if payload.corridor and payload.corridor != "Unknown" else payload.zone
        
        reason_deployment = f"Recommended {officers} officers because similar {prio.lower()} priority events in this zone required additional manpower."
        
        barricades_required = "Required" if rc else "Not Required"
        location_barricade = corridor
        reason_barricade = f"Road closure status is active. Barricades are needed at major intersections along {corridor} to block incoming traffic flow." if rc else f"Standard monitoring. No major road closures required along {corridor}."
        
        diversion_required = "Active" if rc else "Monitor Flow"
        suggested_route = f"Reroute through adjacent approaches around {corridor}"
        reason_diversion = f"Corridor saturation predicted. Diverting traffic from {corridor} will mitigate bottlenecking at major junctions." if rc else f"Normal traffic levels. Keep signaling timing optimized at {corridor} junctions."
        
        impact_score = int(min(100.0, (attendance / 100000.0) * 40.0 + (duration / 480.0) * 30.0 + (30 if rc else 0)))
        impact_score = max(10, impact_score)
        efficiency_gains = int(10 + (officers * 0.8) + (5 if rc else 0))
        
        return {
            "recommended_manpower": officers,
            "deployment_area": zone,
            "deployment_reason": reason_deployment,
            
            "barricades_required": barricades_required,
            "barricade_location": location_barricade,
            "barricade_reason": reason_barricade,
            
            "diversion_required": diversion_required,
            "suggested_route": suggested_route,
            "diversion_reason": reason_diversion,
            
            "impact_score": impact_score,
            "efficiency_gains": efficiency_gains
        }
    except Exception as e:
        logger.error(f"Strategic recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
