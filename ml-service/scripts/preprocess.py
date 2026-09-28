"""
Desharnais Dataset Preprocessing Pipeline
Project: AI-Powered Task Management SaaS (PSA)
Handles missing values (4 incomplete projects), categorical one-hot encoding,
feature scaling (StandardScaler), and 80/20 train/test splitting.
Serializes fitted preprocessor artifacts to ml-service/models/preprocessor.joblib.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

# Define canonical features mapped from Desharnais to Task Management operational attributes
NUMERIC_FEATURES = ['TeamExp', 'ManagerExp', 'Transactions', 'Entities', 'PointsAdjust', 'Envergure']
CATEGORICAL_FEATURES = ['Language']
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = 'Effort'

def load_data(csv_path='ml-service/data/desharnais.csv'):
    """Load cleaned CSV dataset."""
    if not os.path.exists(csv_path):
        from eda import load_desharnais_data
        return load_desharnais_data()
    return pd.read_csv(csv_path)

def create_preprocessor_pipeline():
    """
    Construct a scikit-learn ColumnTransformer pipeline:
    - Numeric: Median imputation (for TeamExp and ManagerExp) + StandardScaler
    - Categorical: OneHotEncoder with handle_unknown='ignore'
    """
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, NUMERIC_FEATURES),
            ('cat', categorical_transformer, CATEGORICAL_FEATURES)
        ],
        remainder='drop'
    )
    return preprocessor

def run_preprocessing(test_size=0.2, random_state=42, output_dir='ml-service/models'):
    """
    Execute end-to-end preprocessing, serialize preprocessor, and export train/test splits.
    """
    os.makedirs(output_dir, exist_ok=True)
    df = load_data()
    
    print("\n=======================================================")
    print("        PREPROCESSING PIPELINE EXECUTION               ")
    print("=======================================================")
    print(f"Total raw observations: {len(df)}")
    
    # Audit missing values
    missing_mask = df[FEATURE_COLUMNS].isnull().any(axis=1)
    incomplete_count = missing_mask.sum()
    print(f"Incomplete projects identified: {incomplete_count} (Rows {df[missing_mask].index.tolist()})")
    print("Strategy: Imputing missing values with column medians (preserving total sample size for small N=81)")

    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].values
    
    # Train / Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )
    print(f"Training split: {len(X_train)} samples ({100*(1-test_size):.0f}%)")
    print(f"Testing split:  {len(X_test)} samples ({100*test_size:.0f}%)")
    
    # Fit preprocessor on training data only (preventing data leakage)
    preprocessor = create_preprocessor_pipeline()
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)
    
    # Extract feature names after one-hot encoding
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['onehot']
    cat_features_encoded = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    transformed_feature_names = NUMERIC_FEATURES + cat_features_encoded
    print(f"Transformed feature dimension: {len(transformed_feature_names)} features -> {transformed_feature_names}")
    
    # Save fitted preprocessor and metadata
    preprocessor_path = os.path.join(output_dir, 'preprocessor.joblib')
    joblib.dump(preprocessor, preprocessor_path)
    print(f"[Serialized] Preprocessor saved to {preprocessor_path}")
    
    # Save splits for model training
    train_data = {
        'X_train': X_train,
        'y_train': y_train,
        'X_test': X_test,
        'y_test': y_test,
        'X_train_transformed': X_train_transformed,
        'X_test_transformed': X_test_transformed,
        'feature_names': transformed_feature_names,
        'raw_feature_names': FEATURE_COLUMNS
    }
    splits_path = os.path.join(output_dir, 'processed_splits.joblib')
    joblib.dump(train_data, splits_path)
    print(f"[Serialized] Processed splits saved to {splits_path}")
    
    return train_data

if __name__ == '__main__':
    run_preprocessing()
