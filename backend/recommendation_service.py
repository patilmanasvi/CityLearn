import logging
from typing import Any, Dict
from collections import Counter
from similarity_service import get_similarity_service
from prediction_service import get_prediction_service
from fingerprint_engine import fingerprint_from_api_payload

logger = logging.getLogger("citylearn.recommendation_service")

class RecommendationService:
    def __init__(self) -> None:
        self.similarity_svc = get_similarity_service()
        self.prediction_svc = get_prediction_service()

    def generate_recommendations(self, event_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Retrieves similar historical events and structures an optimization plan.
        """
        # Ensure similarity service index is loaded
        if self.similarity_svc.index_size() == 0:
            logger.info("Initializing similarity index from dataset...")
            # Similarity service expects fingerprints built from dataset
            # But wait, similarity_service has a CLI block or we can call build_index inside main lifespan
            pass
            
        # Get query fingerprint
        query_fp = fingerprint_from_api_payload(event_payload)
        
        # Predict closure, priority and manpower score
        predictions = self.prediction_svc.predict(event_payload)
        pred_closure = predictions["predicted_road_closure"]
        pred_priority = predictions["predicted_priority"]
        manpower_score = predictions["manpower_diversion_score"]
        manpower_count = predictions["recommended_manpower"]
        
        # Update query fingerprint with predicted fields if not originally provided
        if event_payload.get('requires_road_closure') is None:
            query_fp['requires_road_closure'] = pred_closure
        if event_payload.get('priority') is None:
            query_fp['priority'] = 3 if pred_priority == "High" else 1

        # Search for similar events (retrieve top 5)
        sim_response = self.similarity_svc.find_similar_events(query_fp, top_k=5)
        events = sim_response.similar_events

        if not events:
            # Fallback if no events found
            return {
                "similar_events_found": 0,
                "match_confidence": "0.0%",
                "best_historical_match": "0.0%",
                "road_closure_probability": "100.0%" if pred_closure else "0.0%",
                "recommended_police_station": event_payload.get('police_station', 'City Market'),
                "recommended_corridor": event_payload.get('corridor', 'Mysore Road'),
                "common_cause": event_payload.get('event_cause', 'others'),
                "expected_congestion": "High" if pred_priority == "High" else "Low",
                "recommended_barricades": 2 if pred_closure else 0,
                "recommended_manpower": manpower_count,
                "suggested_diversion": predictions["suggested_diversion"],
                "recommended_action": predictions["recommended_action"]
            }

        # Analyze similar events
        scores = [e.similarity_score for e in events]
        best_score = max(scores)
        avg_score = sum(scores) / len(scores)

        closures = [e.requires_road_closure for e in events]
        road_closure_prob = sum(1 for c in closures if c) / len(closures)

        # Majority votes
        stations = [e.police_station for e in events if e.police_station and e.police_station != "Unknown"]
        corridors = [e.corridor for e in events if e.corridor and e.corridor != "Unknown"]
        causes = [e.fingerprint_text.split("Cause: ")[1].split(".")[0].strip().lower() 
                  for e in events if "Cause: " in e.fingerprint_text]

        rec_station = Counter(stations).most_common(1)[0][0] if stations else event_payload.get('police_station', 'Unknown')
        rec_corridor = Counter(corridors).most_common(1)[0][0] if corridors else event_payload.get('corridor', 'Unknown')
        common_cause = Counter(causes).most_common(1)[0][0] if causes else event_payload.get('event_cause', 'others')

        # Format percentages
        match_confidence_str = f"{avg_score:.1f}%"
        best_historical_match_str = f"{best_score:.1f}%"
        road_closure_prob_str = f"{road_closure_prob * 100:.1f}%"

        # Expected Congestion
        if road_closure_prob >= 0.6 or pred_priority == "High":
            expected_congestion = "Severe"
        elif road_closure_prob >= 0.3:
            expected_congestion = "Moderate"
        else:
            expected_congestion = "Low"

        # Barricades
        if pred_closure:
            recommended_barricades = 3 if manpower_score >= 75 else 2
        else:
            recommended_barricades = 0

        # Suggested diversion and recommended action
        suggested_diversion = predictions["suggested_diversion"]
        recommended_action = predictions["recommended_action"]

        return {
            "similar_events_found": len(events),
            "match_confidence": match_confidence_str,
            "best_historical_match": best_historical_match_str,
            "road_closure_probability": road_closure_prob_str,
            "recommended_police_station": rec_station,
            "recommended_corridor": rec_corridor,
            "common_cause": common_cause,
            "expected_congestion": expected_congestion,
            "recommended_barricades": recommended_barricades,
            "recommended_manpower": manpower_count,
            "suggested_diversion": suggested_diversion,
            "recommended_action": recommended_action
        }

_recommendation_service = None

def get_recommendation_service() -> RecommendationService:
    global _recommendation_service
    if _recommendation_service is None:
        _recommendation_service = RecommendationService()
    return _recommendation_service
