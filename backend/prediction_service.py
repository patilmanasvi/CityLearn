import os
import math
import logging
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Any, Dict, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

logger = logging.getLogger("citylearn.prediction_service")

# Bangalore center coordinates
BANGALORE_LAT = 12.9716
BANGALORE_LON = 77.5946

# Feature columns used for models
MODEL_FEATURES = [
    'event_type', 'event_cause', 'latitude', 'longitude', 
    'corridor', 'police_station', 'zone', 'junction', 
    'hour', 'weekday', 'is_weekend'
]

class PredictionService:
    def __init__(self, dataset_path: str = "backend/citylearn_cleaned_data.csv"):
        self.dataset_path = dataset_path
        self.closure_model: Optional[Pipeline] = None
        self.priority_model: Optional[Pipeline] = None
        self.is_trained = False

    def train_models(self) -> None:
        """Trains road closure and priority models in-memory on startup."""
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset not found at {self.dataset_path}")
        
        logger.info("Loading dataset for model training from %s...", self.dataset_path)
        df = pd.read_csv(self.dataset_path)

        # ── Preprocessing & Imputation ──────────────────────────────────────
        df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
        
        # Extrapolate missing hour / weekday / is_weekend
        if 'hour' not in df.columns or df['hour'].isnull().any():
            df['hour'] = df['start_datetime'].dt.hour.fillna(12).astype(int)
        else:
            df['hour'] = df['hour'].fillna(12).astype(int)
            
        if 'weekday' not in df.columns or df['weekday'].isnull().any():
            df['weekday'] = df['start_datetime'].dt.strftime('%A').fillna('Monday').astype(str)
        else:
            df['weekday'] = df['weekday'].fillna('Monday').astype(str)
            
        if 'is_weekend' not in df.columns or df['is_weekend'].isnull().any():
            df['is_weekend'] = df['weekday'].isin(['Saturday', 'Sunday']).astype(bool)
        else:
            df['is_weekend'] = df['is_weekend'].fillna(False).astype(bool)

        # Ensure all features exist and handle nulls
        for col in MODEL_FEATURES:
            if col not in df.columns:
                if col in ['latitude', 'longitude']:
                    df[col] = 0.0
                elif col == 'hour':
                    df[col] = 12
                elif col == 'is_weekend':
                    df[col] = False
                else:
                    df[col] = 'Unknown'
            else:
                if col in ['latitude', 'longitude']:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
                elif col == 'hour':
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(12).astype(int)
                elif col == 'is_weekend':
                    df[col] = df[col].fillna(False).astype(bool)
                else:
                    df[col] = df[col].fillna('Unknown').astype(str)

        # Targets
        # Target 1: requires_road_closure (bool)
        y_closure = df['requires_road_closure'].fillna(False).astype(bool)
        # Target 2: priority (binary: High -> 1, Low -> 0)
        y_priority = (df['priority'].astype(str).str.strip().str.lower() == 'high').astype(int)

        X = df[MODEL_FEATURES].copy()

        # ── Preprocessor Pipeline ──────────────────────────────────────────
        categorical_cols = ['event_type', 'event_cause', 'corridor', 'police_station', 'zone', 'junction', 'weekday']
        numerical_cols = ['latitude', 'longitude', 'hour']
        boolean_cols = ['is_weekend']

        preprocessor = ColumnTransformer(
            transformers=[
                ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols),
                ('num', 'passthrough', numerical_cols + boolean_cols)
            ]
        )

        # ── Classifier Pipelines ───────────────────────────────────────────
        # Using class_weight='balanced' to handle the heavy road closure imbalance
        self.closure_model = Pipeline(
            steps=[
                ('preprocessor', preprocessor),
                ('classifier', RandomForestClassifier(
                    n_estimators=50, 
                    max_depth=10, 
                    class_weight='balanced', 
                    random_state=42
                ))
            ]
        )

        self.priority_model = Pipeline(
            steps=[
                ('preprocessor', preprocessor),
                ('classifier', RandomForestClassifier(
                    n_estimators=50, 
                    max_depth=10, 
                    random_state=42
                ))
            ]
        )

        logger.info("Training road closure prediction model...")
        self.closure_model.fit(X, y_closure)

        logger.info("Training priority prediction model...")
        self.priority_model.fit(X, y_priority)

        self.is_trained = True
        logger.info("ML Models successfully trained in-memory! ✓")

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Helper to calculate haversine distance in km."""
        if any(math.isnan(v) for v in [lat1, lon1, lat2, lon2]):
            return 999.0
        R = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def calculate_manpower_score(self, event_data: Dict[str, Any]) -> Tuple[float, int, str, str]:
        """
        Calculates a rule-based manpower/diversion score based on feature weights:
        event_type 15%, location 12%, start_datetime 10%, requires_road_closure 10%, 
        corridor 7%, junction 6%, priority 6%, event_cause 5%, police_station 5%.
        
        Returns:
            Tuple of (score, recommended_manpower, suggested_diversion, recommended_action)
        """
        # 1. event_type (15%)
        et = str(event_data.get('event_type', 'Unknown')).strip().lower()
        s_et = 100 if et == 'unplanned' else (50 if et == 'planned' else 30)
        
        # 2. location (12%)
        lat = float(event_data.get('latitude', 0.0))
        lon = float(event_data.get('longitude', 0.0))
        dist = self._haversine_distance(lat, lon, BANGALORE_LAT, BANGALORE_LON)
        if dist < 5:
            s_loc = 100
        elif dist < 10:
            s_loc = 80
        elif dist < 20:
            s_loc = 50
        else:
            s_loc = 30
            
        # 3. start_datetime (10%)
        # Extract hour from payload or current hour
        hour = 12
        start_dt_val = event_data.get('start_datetime')
        if start_dt_val:
            try:
                # support ISO format
                if isinstance(start_dt_val, str):
                    dt = pd.to_datetime(start_dt_val)
                    hour = dt.hour
                elif isinstance(start_dt_val, (datetime, pd.Timestamp)):
                    hour = start_dt_val.hour
            except Exception:
                pass
        
        if (7 <= hour <= 10) or (16 <= hour <= 20):
            s_dt = 100
        elif 10 < hour < 16:
            s_dt = 60
        else:
            s_dt = 20
            
        # 4. requires_road_closure (10%)
        rc = bool(event_data.get('requires_road_closure', False))
        s_rc = 100 if rc else 0
        
        # 5. corridor (7%)
        corr = str(event_data.get('corridor', 'Unknown')).strip().lower()
        s_corr = 30 if ('non-corridor' in corr or 'unknown' in corr) else 100
        
        # 6. junction (6%)
        junc = str(event_data.get('junction', 'Unknown')).strip().lower()
        s_junc = 30 if (junc == 'unknown' or junc == 'false' or junc == 'none') else 100
        
        # 7. priority (6%)
        prio = str(event_data.get('priority', 'Low')).strip().lower()
        s_prio = 100 if prio == 'high' else (40 if prio == 'low' else 30)
        
        # 8. event_cause (5%)
        cause = str(event_data.get('event_cause', 'Unknown')).strip().lower()
        high_causes = ['accident', 'protest', 'rally', 'water_logging', 'tree_fall', 'hoarding_fall', 'bmtc_breakdown']
        med_causes = ['vehicle_breakdown', 'road_conditions', 'others', 'drainage_overflow']
        s_cause = 100 if cause in high_causes else (60 if cause in med_causes else 30)
        
        # 9. police_station (5%)
        ps = str(event_data.get('police_station', 'Unknown')).strip().lower()
        s_ps = 30 if ('unknown' in ps or 'no police station' in ps) else 100
        
        # Sum of weights: 0.15 + 0.12 + 0.10 + 0.10 + 0.07 + 0.06 + 0.06 + 0.05 + 0.05 = 0.76
        raw_score = (
            0.15 * s_et + 
            0.12 * s_loc + 
            0.10 * s_dt + 
            0.10 * s_rc + 
            0.07 * s_corr + 
            0.06 * s_junc + 
            0.06 * s_prio + 
            0.05 * s_cause + 
            0.05 * s_ps
        )
        
        final_score = round(raw_score / 0.76, 2)
        
        # Recommend manpower
        if final_score >= 80:
            recommended_manpower = 10
        elif final_score >= 60:
            recommended_manpower = 6
        elif final_score >= 40:
            recommended_manpower = 3
        else:
            recommended_manpower = 1
            
        # Suggested diversion
        corridor_name = event_data.get('corridor', 'active corridor')
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
            
        return final_score, recommended_manpower, suggested_diversion, recommended_action

    def predict(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts requires_road_closure, priority and manpower/diversion scores.
        """
        if not self.is_trained:
            self.train_models()

        # Parse start_datetime to fetch helper fields
        start_dt_val = event_data.get('start_datetime')
        hour = 12
        weekday = 'Monday'
        is_weekend = False
        if start_dt_val:
            try:
                dt = pd.to_datetime(start_dt_val)
                hour = dt.hour
                weekday = dt.strftime('%A')
                is_weekend = weekday in ['Saturday', 'Sunday']
            except Exception:
                pass

        # Prepare payload row as DataFrame
        row_dict = {
            'event_type': str(event_data.get('event_type', 'Unplanned')),
            'event_cause': str(event_data.get('event_cause', 'Unknown')),
            'latitude': float(event_data.get('latitude', 0.0)),
            'longitude': float(event_data.get('longitude', 0.0)),
            'corridor': str(event_data.get('corridor', 'Unknown')),
            'police_station': str(event_data.get('police_station', 'Unknown')),
            'zone': str(event_data.get('zone', 'Unknown')),
            'junction': str(event_data.get('junction', 'Unknown')),
            'hour': hour,
            'weekday': weekday,
            'is_weekend': is_weekend
        }
        
        X_pred = pd.DataFrame([row_dict])
        
        # Predict Closure (if not provided)
        closure_val = event_data.get('requires_road_closure')
        if closure_val is None:
            pred_closure = bool(self.closure_model.predict(X_pred)[0])
        else:
            pred_closure = bool(closure_val)
            
        # Predict Priority (if not provided)
        priority_val = event_data.get('priority')
        if priority_val is None or str(priority_val).strip().lower() in ('unknown', ''):
            pred_priority_num = self.priority_model.predict(X_pred)[0]
            pred_priority = "High" if pred_priority_num == 1 else "Low"
        else:
            pred_priority = str(priority_val)

        # Merge predictions back to compute the final score
        score_input = event_data.copy()
        score_input['requires_road_closure'] = pred_closure
        score_input['priority'] = pred_priority
        score_input['start_datetime'] = start_dt_val

        score, manpower, diversion, action = self.calculate_manpower_score(score_input)

        return {
            "event_id": event_data.get('id', -1),
            "predicted_road_closure": pred_closure,
            "predicted_priority": pred_priority,
            "manpower_diversion_score": score,
            "recommended_manpower": manpower,
            "suggested_diversion": diversion,
            "recommended_action": action
        }

# Singleton instance
_prediction_service = None

def get_prediction_service() -> PredictionService:
    global _prediction_service
    if _prediction_service is None:
        _prediction_service = PredictionService()
        _prediction_service.train_models()
    return _prediction_service
