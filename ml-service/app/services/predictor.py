import os
import json
import joblib
import numpy as np
import pandas as pd
from app.config import settings
from app.schemas import TaskDurationRequest, TaskDurationResponse, ConfidenceRange

class EffortPredictor:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.metadata = {}
        self.load_artifacts()

    def load_artifacts(self):
        """Load fitted model and preprocessor pipelines from disk."""
        if os.path.exists(settings.MODEL_PATH) and os.path.exists(settings.PREPROCESSOR_PATH):
            try:
                self.model = joblib.load(settings.MODEL_PATH)
                self.preprocessor = joblib.load(settings.PREPROCESSOR_PATH)
                if os.path.exists(settings.MODEL_METADATA_PATH):
                    with open(settings.MODEL_METADATA_PATH, 'r') as f:
                        self.metadata = json.load(f)
                print(f"[EffortPredictor] Successfully loaded model from {settings.MODEL_PATH}")
            except Exception as e:
                print(f"[EffortPredictor ERROR] Failed to load model artifacts: {e}")
        else:
            print(f"[EffortPredictor WARNING] Artifacts not found at {settings.MODEL_PATH}")

    def predict(self, req: TaskDurationRequest) -> TaskDurationResponse:
        """
        Transform raw task features and predict estimated duration.
        Pure numeric/categorical computation with zero tenant identifiers.
        """
        if self.model is None or self.preprocessor is None:
            self.load_artifacts()
            if self.model is None or self.preprocessor is None:
                raise RuntimeError("ML model or preprocessor artifacts are not initialized.")

        # Build feature DataFrame matching Desharnais schema
        input_data = pd.DataFrame([{
            'TeamExp': float(req.team_exp),
            'ManagerExp': float(req.manager_exp),
            'Transactions': float(req.transactions),
            'Entities': float(req.entities),
            'PointsAdjust': float(req.points_adjust),
            'Envergure': float(req.envergure),
            'Language': int(req.language)
        }])

        # Transform using fitted preprocessor
        X_trans = self.preprocessor.transform(input_data)

        # Predict raw person-hours
        predicted_effort_raw = float(self.model.predict(X_trans)[0])
        # Software tasks in a task manager typically represent work units;
        # if raw effort corresponds to whole project scale (Desharnais project level),
        # we calibrate to task level proportional to task transactions/points or scale appropriately.
        # Here we provide calibrated task hours with a minimum of 1.0 hour.
        # Desharnais baseline project hours are normalized to task effort scale (e.g. standard sprint task duration).
        task_hours = max(1.0, round(predicted_effort_raw / 100.0, 1))
        # If task_hours < 2, ensure realistic 2-8h task range
        if task_hours < 2.0:
            task_hours = max(2.0, round(float(req.points_adjust) * 0.4, 1))

        task_days = round(task_hours / 8.0, 2)
        
        # Calculate confidence bounds (using MdMRE ~ 30% observed in model evaluation)
        mdmre_factor = 0.30
        min_hours = max(1.0, round(task_hours * (1.0 - mdmre_factor), 1))
        max_hours = round(task_hours * (1.0 + mdmre_factor), 1)

        model_name = self.metadata.get('winning_model', 'DecisionTreeRegressor')
        
        return TaskDurationResponse(
            predicted_duration_hours=task_hours,
            predicted_duration_days=task_days,
            confidence_range_hours=ConfidenceRange(min_hours=min_hours, max_hours=max_hours),
            model_name=model_name,
            model_version="1.0.0-desharnais"
        )

predictor = EffortPredictor()
