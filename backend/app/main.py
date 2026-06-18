import os
import math
import logging
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Import schemas
from app.schemas import EventInput, ClosureResponse, PriorityResponse, ManpowerResponse

# Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("citylearn.api_new")

# Coordinates for Bangalore center
BANGALORE_LAT = 12.9716
BANGALORE_LON = 77.5946

# Global variables to store loaded models
closure_model = None
priority_model = None
ordinal_encoder = None

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
    corridor = clean_str(payload.corridor, 'corridor')
    police_station = clean_str(payload.police_station, 'police_station')
    zone = clean_str(payload.zone, 'zone')
    junction = clean_str(payload.junction, 'junction')
    weekday_cleaned = clean_str(weekday, 'weekday')
    season_cleaned = clean_str(season, 'season')

    # Convert coordinates
    latitude = float(payload.latitude) if payload.latitude is not None else BANGALORE_LAT
    longitude = float(payload.longitude) if payload.longitude is not None else BANGALORE_LON

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML artifacts on startup
    global closure_model, priority_model, ordinal_encoder
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    closure_path = os.path.join(BASE_DIR, "ml_artifacts", "closure_model.joblib")
    priority_path = os.path.join(BASE_DIR, "ml_artifacts", "priority_model.joblib")
    encoder_path = os.path.join(BASE_DIR, "ml_artifacts", "ordinal_encoder.joblib")

    logger.info("Loading ML models and encoder...")
    try:
        closure_model = joblib.load(closure_path)
        priority_model = joblib.load(priority_path)
        ordinal_encoder = joblib.load(encoder_path)
        logger.info("Successfully loaded CatBoost models and OrdinalEncoder.")
    except Exception as e:
        logger.error(f"Error loading ML artifacts: {e}")
        raise e
    yield

app = FastAPI(
    title="CityLearn Traffic Intelligence Backend API (FastAPI + CatBoost)",
    description="ML models for road closure & priority predictions, and rule-based manpower scoring.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict/closure", response_model=ClosureResponse)
def predict_closure(payload: EventInput):
    """Predicts whether the event requires a road closure, along with probability."""
    try:
        features = prepare_features(payload)
        pred = closure_model.predict([features])[0]
        proba = closure_model.predict_proba([features])[0]
        # pred is 1 (True) or 0 (False)
        predicted_bool = bool(pred)
        # Probability of True (index 1)
        probability = float(proba[1])
        return {
            "predicted_road_closure": predicted_bool,
            "probability": probability
        }
    except Exception as e:
        logger.error(f"Road closure prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/priority", response_model=PriorityResponse)
def predict_priority(payload: EventInput):
    """Predicts the event priority (High/Low), along with probability."""
    try:
        features = prepare_features(payload)
        pred = priority_model.predict([features])[0]
        proba = priority_model.predict_proba([features])[0]
        # 1 -> High, 0 -> Low
        predicted_priority = "High" if pred == 1 else "Low"
        probability = float(proba[1]) if pred == 1 else float(proba[0])
        return {
            "predicted_priority": predicted_priority,
            "probability": probability
        }
    except Exception as e:
        logger.error(f"Priority prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/manpower", response_model=ManpowerResponse)
def predict_manpower(payload: EventInput):
    """Calculates a rule-based manpower and diversion score using exact feature weights."""
    try:
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
        lat = float(payload.latitude) if payload.latitude is not None else BANGALORE_LAT
        lon = float(payload.longitude) if payload.longitude is not None else BANGALORE_LON
        dist = haversine_distance(lat, lon, BANGALORE_LAT, BANGALORE_LON)
        if dist < 5:
            s_loc = 100
        elif dist < 10:
            s_loc = 80
        elif dist < 20:
            s_loc = 50
        else:
            s_loc = 30

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
            # Predict it if not provided
            features = prepare_features(payload)
            rc = bool(closure_model.predict([features])[0])
        s_rc = 100 if rc else 0

        # 5. Corridor (7% weight)
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
        s_comm = score_remainder(payload.comment)

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
        if final_score >= 80:
            recommended_manpower = 10
        elif final_score >= 60:
            recommended_manpower = 6
        elif final_score >= 40:
            recommended_manpower = 3
        else:
            recommended_manpower = 1

        # Suggested diversion
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
