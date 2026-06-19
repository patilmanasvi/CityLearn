from pydantic import BaseModel, Field
from typing import Optional

class EventInput(BaseModel):
    id: Optional[int] = None
    event_type: str = Field(..., description="E.g., unplanned, planned")
    event_cause: Optional[str] = "Unknown"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attendance: Optional[int] = None
    duration: Optional[int] = None
    start_datetime: str
    corridor: Optional[str] = "Unknown"
    police_station: Optional[str] = "Unknown"
    zone: Optional[str] = "Unknown"
    junction: Optional[str] = "Unknown"
    direction: Optional[str] = "Unknown"
    veh_type: Optional[str] = "Unknown"
    priority: Optional[str] = None
    requires_road_closure: Optional[bool] = None
    closure_status: Optional[str] = None
    description: Optional[str] = ""
    comment: Optional[str] = ""
    city: Optional[str] = "Unknown"
    state: Optional[str] = "Unknown"
    country: Optional[str] = "Unknown"

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 9999,
                "event_type": "unplanned",
                "event_cause": "accident",
                "latitude": 12.9539,
                "longitude": 77.5852,
                "start_datetime": "2024-03-07 17:01:48.111000+00:00",
                "corridor": "Lalbagh Road",
                "police_station": "Wilson Garden",
                "zone": "South",
                "junction": "Lalbagh Main Gate Junction",
                "description": "Two vehicles collided causing a blockade near the main gate.",
                "comment": "Minor injuries reported."
            }
        }
    }

class ClosureResponse(BaseModel):
    predicted_road_closure: bool
    probability: float

class PriorityResponse(BaseModel):
    predicted_priority: str
    probability: float

class ManpowerResponse(BaseModel):
    manpower_diversion_score: float
    recommended_manpower: int
    suggested_diversion: str
    recommended_action: str
