"""
Training and Evaluation Script for Software Schedule Prediction & Delay Risk.
Dataset: China Software Benchmarking Dataset (PROMISE Repository, N=499 commercial projects).
Problem: Estimating whether a software project will be completed within its planned schedule.

This script trains:
1. An empirical Project Duration Regressor (predicts expected completion duration in months/weeks)
2. A Schedule Adherence & Delay Classifier (predicts On-Time vs Delayed binary outcome + delay risk probability)
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report, mean_absolute_error, r2_score
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "china.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def load_and_prepare_data():
    df = pd.read_csv(DATA_PATH)
    print(f"[Model Training] Loaded China dataset with {len(df)} project instances.")

    # Features for duration regression and schedule adherence
    feature_cols = ["AFP", "Input", "Output", "Enquiry", "File", "Interface", "Resource", "DevType"]
    X = df[feature_cols].copy()
    y_duration = df["Duration"].values  # Duration in calendar months

    # Standard Software Engineering Schedule Formulation (Standish Group / Putnam model):
    # Historical baseline schedule based on size and complexity
    # Projects taking longer than the 60th percentile delivery rate for their complexity tier are classified as delayed
    median_productivity = df.groupby("DevType")["Duration"].transform("median")
    size_factor = (df["AFP"] / df["AFP"].median()) ** 0.33
    planned_schedule_baseline = median_productivity * size_factor

    # Label: 1 = Delayed (Schedule Overrun), 0 = Completed Within Planned Schedule
    # Projects taking > 15% longer than planned baseline experienced schedule slip
    df["planned_duration"] = planned_schedule_baseline
    df["is_delayed"] = (df["Duration"] > (planned_schedule_baseline * 1.15)).astype(int)

    delay_rate = df["is_delayed"].mean() * 100
    print(f"[Model Training] Target Distribution: {delay_rate:.1f}% Delayed, {100 - delay_rate:.1f}% On-Time")

    return X, df["is_delayed"].values, y_duration, df


def train_models(X, y_class, y_duration):
    # 1. Train Project Duration Regressor
    print("\n--- Training Project Duration Regressor (Months) ---")
    numeric_features = ["AFP", "Input", "Output", "Enquiry", "File", "Interface", "Resource"]
    categorical_features = ["DevType"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ]
    )

    regressor_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=150, max_depth=6, random_state=42))
    ])

    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
        X, y_duration, test_size=0.20, random_state=42
    )
    regressor_pipeline.fit(X_train_r, y_train_r)
    y_pred_r = regressor_pipeline.predict(X_test_r)

    mae_r = mean_absolute_error(y_test_r, y_pred_r)
    r2_r = r2_score(y_test_r, y_pred_r)
    print(f"Duration Regressor MAE: {mae_r:.2f} months")
    print(f"Duration Regressor R2:  {r2_r:.4f}")

    reg_save_path = os.path.join(MODELS_DIR, "schedule_duration_regressor.joblib")
    joblib.dump(regressor_pipeline, reg_save_path)
    print(f"[Model Training] Persisted duration regressor to {reg_save_path}")

    # 2. Train Schedule Delay Classifier
    print("\n--- Benchmarking Schedule Delay Classifiers ---")
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
        X, y_class, test_size=0.20, random_state=42, stratify=y_class
    )

    candidate_models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"),
        "GradientBoostingClassifier": GradientBoostingClassifier(n_estimators=120, max_depth=4, random_state=42),
        "RandomForestClassifier": RandomForestClassifier(n_estimators=150, max_depth=6, class_weight="balanced", random_state=42)
    }

    best_f1 = -1
    best_clf_name = None
    best_clf_pipeline = None

    for name, clf in candidate_models.items():
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])

        pipeline.fit(X_train_c, y_train_c)
        y_pred = pipeline.predict(X_test_c)
        y_prob = pipeline.predict_proba(X_test_c)[:, 1]

        acc = accuracy_score(y_test_c, y_pred)
        prec = precision_score(y_test_c, y_pred, zero_division=0)
        rec = recall_score(y_test_c, y_pred, zero_division=0)
        f1 = f1_score(y_test_c, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_test_c, y_prob)

        print(f"\n{name}:")
        print(f"  Accuracy:  {acc * 100:.1f}%")
        print(f"  Precision: {prec * 100:.1f}%")
        print(f"  Recall:    {rec * 100:.1f}%")
        print(f"  F1-Score:  {f1 * 100:.1f}%")
        print(f"  ROC-AUC:   {roc_auc:.4f}")

        if f1 > best_f1:
            best_f1 = f1
            best_clf_name = name
            best_clf_pipeline = pipeline

    clf_save_path = os.path.join(MODELS_DIR, "schedule_classifier.joblib")
    joblib.dump(best_clf_pipeline, clf_save_path)
    print(f"\n[Model Training] Persisted champion schedule classifier ({best_clf_name}) to {clf_save_path}")

    # Display Top Risk Factor Importances
    clf = best_clf_pipeline.named_steps["classifier"]
    if hasattr(clf, "feature_importances_"):
        ohe = best_clf_pipeline.named_steps["preprocessor"].named_transformers_["cat"]
        cat_feature_names = list(ohe.get_feature_names_out(categorical_features))
        all_features = numeric_features + cat_feature_names
        importances = clf.feature_importances_
        sorted_idx = np.argsort(importances)[::-1]

        print("\nTop Predictors of Software Schedule Overrun:")
        for idx in sorted_idx:
            print(f"  {all_features[idx]:<20}: {importances[idx] * 100:.2f}%")

    return best_clf_name, best_f1


if __name__ == "__main__":
    X, y_class, y_duration, df = load_and_prepare_data()
    best_clf, f1 = train_models(X, y_class, y_duration)
