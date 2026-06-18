import os
import sys
import joblib
from catboost import CatBoostClassifier

# Make sure we can import preprocess
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from preprocess import preprocess_data

def train_models():
    print("Starting data preprocessing...")
    # Get preprocessed X and y
    X_c, y_c, X_p, y_p = preprocess_data(csv_path="backend/citylearn_cleaned_data.csv", save_encoder=True)
    
    print("\nTraining CatBoost model for 'requires_road_closure'...")
    # Initialize CatBoost for road closure prediction
    # Highly imbalanced (8% True), so we use auto_class_weights='Balanced'
    closure_model = CatBoostClassifier(
        iterations=300,
        learning_rate=0.05,
        depth=6,
        auto_class_weights='Balanced',
        random_seed=42,
        verbose=50
    )
    
    closure_model.fit(X_c, y_c)
    
    print("\nTraining CatBoost model for 'priority'...")
    # Initialize CatBoost for priority prediction (62% High, 38% Low)
    priority_model = CatBoostClassifier(
        iterations=300,
        learning_rate=0.05,
        depth=6,
        random_seed=42,
        verbose=50
    )
    
    priority_model.fit(X_p, y_p)
    
    # Save the models
    os.makedirs("backend/ml_artifacts", exist_ok=True)
    
    closure_model_path = "backend/ml_artifacts/closure_model.joblib"
    priority_model_path = "backend/ml_artifacts/priority_model.joblib"
    
    joblib.dump(closure_model, closure_model_path)
    joblib.dump(priority_model, priority_model_path)
    
    print(f"\nSuccessfully trained and saved:")
    print(f" - Road Closure model to: {closure_model_path}")
    print(f" - Priority model to: {priority_model_path}")

if __name__ == '__main__':
    train_models()
