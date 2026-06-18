import os
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import OrdinalEncoder

# Center coordinates for Bangalore
BANGALORE_LAT = 12.9716
BANGALORE_LON = 77.5946

# Categorical columns to encode
CATEGORICAL_COLS = [
    'event_type', 'event_cause', 'corridor', 'police_station', 'zone', 'junction', 'weekday', 'season'
]

# Numeric columns to keep as-is
NUMERIC_COLS = ['latitude', 'longitude', 'hour']

# All feature columns
FEATURE_COLS = CATEGORICAL_COLS + NUMERIC_COLS

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

def clean_and_extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """Preprocess dataframe and extract hour, weekday, and season features."""
    df = df.copy()
    
    # 1. Parse start_datetime
    df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
    
    # 2. Extract features
    df['hour'] = df['start_datetime'].dt.hour.fillna(12).astype(int)
    df['weekday'] = df['start_datetime'].dt.day_name().fillna('Monday')
    df['season'] = df['start_datetime'].dt.month.apply(lambda m: get_season(m) if pd.notnull(m) else 'Monsoon')
    
    # 3. Handle missing values in categorical fields by treating missing/empty as its own category 'Unknown'
    for col in CATEGORICAL_COLS:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown').astype(str).str.strip().str.title()
        else:
            df[col] = 'Unknown'
            
    # Normalize 'Unknown' values and clean casing (e.g. Unknown, None)
    for col in ['zone', 'junction']:
        df[col] = df[col].replace({'None': 'Unknown', '': 'Unknown', 'False': 'Unknown'})
        
    # 4. Handle numerical features
    df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce').fillna(BANGALORE_LAT)
    df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce').fillna(BANGALORE_LON)
    
    return df

def preprocess_data(csv_path: str = "backend/citylearn_cleaned_data.csv", save_encoder: bool = True):
    """Loads CSV, preprocesses features, encodes categoricals, and returns X, y_closure, y_priority."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset CSV not found at {csv_path}")
        
    df = pd.read_csv(csv_path)
    df = clean_and_extract_features(df)
    
    # Target 1: requires_road_closure (bool)
    y_closure = df['requires_road_closure'].fillna(False).astype(bool)
    
    # Target 2: priority (binary: High -> 1, Low -> 0). Drop 'Unknown' target rows for clean binary split.
    # We will map 'Unknown' to Low first, or drop it. Let's drop it to keep a perfect 62%/38% split.
    df_priority = df[df['priority'].isin(['High', 'Low'])].copy()
    y_priority = (df_priority['priority'] == 'High').astype(int)
    X_priority = df_priority[FEATURE_COLS].copy()
    
    X_closure = df[FEATURE_COLS].copy()
    
    # Setup Ordinal Encoder
    # handle_unknown='use_encoded_value', unknown_value=-1 allows handling unseen values at inference time
    encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
    
    # Fit encoder on the entire categorical space of closure data (which contains all rows)
    encoder.fit(X_closure[CATEGORICAL_COLS])
    
    if save_encoder:
        os.makedirs("backend/ml_artifacts", exist_ok=True)
        joblib.dump(encoder, "backend/ml_artifacts/ordinal_encoder.joblib")
        print("OrdinalEncoder saved successfully to backend/ml_artifacts/ordinal_encoder.joblib")
        
    # Encode categoricals in features
    X_closure_enc = X_closure.copy()
    X_closure_enc[CATEGORICAL_COLS] = encoder.transform(X_closure[CATEGORICAL_COLS])
    
    X_priority_enc = X_priority.copy()
    X_priority_enc[CATEGORICAL_COLS] = encoder.transform(X_priority[CATEGORICAL_COLS])
    
    return X_closure_enc, y_closure, X_priority_enc, y_priority

if __name__ == '__main__':
    X_c, y_c, X_p, y_p = preprocess_data()
    print(f"Preprocessed data shape for road closure: {X_c.shape}")
    print(f"Preprocessed data shape for priority: {X_p.shape}")
