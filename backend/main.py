import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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

# Pydantic Input/Output Schemas
class EventPayload(BaseModel):
    id: Optional[int] = None
    event_type: str = Field(..., description="E.g., unplanned, planned")
    event_cause: Optional[str] = "Unknown"
    latitude: float
    longitude: float
    start_datetime: str
    corridor: Optional[str] = "Unknown"
    police_station: Optional[str] = "Unknown"
    zone: Optional[str] = "Unknown"
    junction: Optional[str] = "Unknown"
    direction: Optional[str] = "Unknown"
    veh_type: Optional[str] = "Unknown"
    priority: Optional[str] = None
    requires_road_closure: Optional[bool] = None
    description: Optional[str] = ""
    comment: Optional[str] = ""

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 100,
                "event_type": "unplanned",
                "event_cause": "accident",
                "latitude": 13.0400,
                "longitude": 77.5180,
                "start_datetime": "2024-03-07 17:01:48.111000+00:00",
                "corridor": "Tumkur Road",
                "police_station": "Peenya",
                "zone": "Unknown",
                "junction": "Unknown",
                "priority": "High"
            }
        }
    }


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the dataset and build in-memory index + train classifiers
    logger.info("Initializing backend services on startup...")
    try:
        # Load, clean, feature-engineer, and fingerprint Bangalore dataset
        _, fingerprints = load_and_prepare_dataset("citylearn_cleaned_data.csv")
        
        # Build Similarity Index
        sim_svc = get_similarity_service()
        sim_svc.build_index(fingerprints)
        logger.info("Similarity service index built successfully. Total records: %d", sim_svc.index_size())
        
        # Train ML models in-memory
        pred_svc = get_prediction_service()
        pred_svc.train_models()
        logger.info("ML Models successfully trained in-memory.")
    except Exception as e:
        logger.exception("Lifespan startup failure: %s", e)
        
    yield
    # Shutdown: Clean up resources if any (none needed for in-memory)
    logger.info("Shutting down backend services...")


app = FastAPI(
    title="CityLearn Traffic Intelligence Backend API",
    description="ML predictions and similarity matching for traffic operations.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
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


@app.post("/api/fingerprint")
def get_fingerprint(payload: EventPayload):
    """
    Endpoint 1: Returns the canonical Natural Language fingerprint string.
    Useful for explaining how the AI interprets the traffic event.
    """
    try:
        fp = fingerprint_from_api_payload(payload.model_dump())
        # Clean embedding from response (large payload)
        fp_copy = fp.copy()
        fp_copy.pop("embedding", None)
        return fp_copy
    except Exception as e:
        logger.error("Fingerprint generation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/similar-events")
def get_similar_events(payload: EventPayload, top_k: int = 5):
    """
    Endpoint 2: Finds top-K similar historical events using FAISS/TF-IDF lookup.
    """
    try:
        fp = fingerprint_from_api_payload(payload.model_dump())
        sim_svc = get_similarity_service()
        response = sim_svc.find_similar_events(fp, top_k=top_k)
        return sim_svc.response_to_dict(response)
    except Exception as e:
        logger.error("Similar events search failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predictions")
def get_predictions(payload: EventPayload):
    """
    Endpoint 3: Runs ML classifiers to predict road closure & priority, 
    and computes the rule-based manpower/diversion scores.
    """
    try:
        pred_svc = get_prediction_service()
        result = pred_svc.predict(payload.model_dump())
        return result
    except Exception as e:
        logger.error("Event prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/recommendations")
def get_recommendations(payload: EventPayload):
    """
    Endpoint 4: Returns the structured mitigation recommendations 
    integrating similar events analysis and predictions.
    """
    try:
        rec_svc = get_recommendation_service()
        result = rec_svc.generate_recommendations(payload.model_dump())
        return result
    except Exception as e:
        logger.error("Recommendations generation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/learning")
def trigger_learning(payload: EventPayload):
    """
    Endpoint 5: Adds a new (resolved or verified) event to the similarity index.
    """
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
