import pytest
from fastapi.testclient import TestClient
import numpy as np
import pandas as pd
from app.main import app
from app.config import settings
from app.services.predictor import predictor
from app.services.monte_carlo import run_monte_carlo_forecast
from app.schemas import ProjectForecastRequest

client = TestClient(app)

VALID_TOKEN = settings.INTERNAL_SERVICE_TOKEN
HEADERS = {"X-Internal-Token": VALID_TOKEN}

# -------------------------------------------------------------
# 1. Health Endpoint Tests (Public Access)
# -------------------------------------------------------------
def test_health_check_public_access():
    """Verify health probe is publicly accessible without credentials."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "psa-task-manager-ml-service"
    assert data["model_loaded"] is True
    assert data["preprocessor_loaded"] is True

# -------------------------------------------------------------
# 2. Service Authentication Tests (X-Internal-Token)
# -------------------------------------------------------------
def test_predict_endpoint_missing_token():
    """Verify endpoint rejects requests missing X-Internal-Token with 401."""
    payload = {
        "team_exp": 3.0,
        "manager_exp": 4.0,
        "transactions": 50.0,
        "entities": 10.0,
        "points_adjust": 60.0,
        "envergure": 25.0,
        "language": 1
    }
    response = client.post("/predict/task-duration", json=payload)
    assert response.status_code == 401
    assert "Missing X-Internal-Token" in response.json()["detail"]

def test_predict_endpoint_invalid_token():
    """Verify endpoint rejects requests with incorrect token with 401."""
    payload = {
        "team_exp": 3.0,
        "manager_exp": 4.0,
        "transactions": 50.0,
        "entities": 10.0,
        "points_adjust": 60.0,
        "envergure": 25.0,
        "language": 1
    }
    bad_headers = {"X-Internal-Token": "invalid_spoofed_token_999"}
    response = client.post("/predict/task-duration", json=payload, headers=bad_headers)
    assert response.status_code == 401
    assert "Invalid internal service token" in response.json()["detail"]

def test_forecast_endpoint_missing_token():
    """Verify forecast endpoint rejects unauthenticated calls with 401."""
    payload = {
        "remaining_tasks": 20,
        "historical_throughput": [3, 4, 5],
        "simulation_runs": 1000
    }
    response = client.post("/forecast/project-completion", json=payload)
    assert response.status_code == 401

# -------------------------------------------------------------
# 3. Model Inference & Duration Estimation Tests
# -------------------------------------------------------------
def test_predict_task_duration_valid():
    """Verify valid prediction response schema, bounds, and confidence intervals."""
    payload = {
        "team_exp": 3.0,
        "manager_exp": 4.0,
        "transactions": 60.0,
        "entities": 12.0,
        "points_adjust": 80.0,
        "envergure": 30.0,
        "language": 1
    }
    response = client.post("/predict/task-duration", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    
    assert "predicted_duration_hours" in data
    assert "predicted_duration_days" in data
    assert "confidence_range_hours" in data
    
    hours = data["predicted_duration_hours"]
    days = data["predicted_duration_days"]
    conf = data["confidence_range_hours"]
    
    assert hours > 0.0
    assert days > 0.0
    assert conf["min_hours"] <= hours <= conf["max_hours"]
    assert conf["min_hours"] >= 1.0
    assert data["model_version"] == "1.0.0-desharnais"

def test_predict_validation_ranges():
    """Verify Pydantic input validation blocks negative features."""
    invalid_payload = {
        "team_exp": -5.0,  # Negative experience is invalid
        "transactions": 50.0,
        "entities": 10.0,
        "points_adjust": 60.0,
        "envergure": 25.0,
        "language": 1
    }
    response = client.post("/predict/task-duration", json=invalid_payload, headers=HEADERS)
    assert response.status_code == 422  # Unprocessable entity

# -------------------------------------------------------------
# 4. Monte Carlo Forecasting Tests
# -------------------------------------------------------------
def test_monte_carlo_forecast_valid():
    """Verify Monte Carlo simulation executes correctly and respects percentile ordering."""
    payload = {
        "remaining_tasks": 25,
        "historical_throughput": [3.0, 5.0, 4.0, 6.0, 2.0, 5.0],
        "simulation_runs": 10000,
        "start_date": "2026-03-01"
    }
    response = client.post("/forecast/project-completion", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    
    assert data["remaining_tasks"] == 25
    assert data["simulation_runs"] == 10000
    p50 = data["percentile_50_weeks"]
    p85 = data["percentile_85_weeks"]
    p95 = data["percentile_95_weeks"]
    
    # Statistical invariant: 50th percentile must be <= 85th <= 95th
    assert p50 <= p85 <= p95
    assert p50 > 0
    assert len(data["forecast_date_50"]) == 10  # YYYY-MM-DD
    assert len(data["forecast_date_85"]) == 10
    assert len(data["forecast_date_95"]) == 10

def test_monte_carlo_unit_function():
    """Unit test the core simulation function with deterministic conditions."""
    req = ProjectForecastRequest(
        remaining_tasks=10,
        historical_throughput=[5.0, 5.0, 5.0],
        simulation_runs=2000,
        start_date="2026-01-01"
    )
    res = run_monte_carlo_forecast(req)
    # With constant throughput of 5 tasks/week, 10 tasks always takes exactly 2 weeks
    assert res.percentile_50_weeks == 2.0
    assert res.percentile_85_weeks == 2.0
    assert res.percentile_95_weeks == 2.0
    assert res.forecast_date_50 == "2026-01-15"

# -------------------------------------------------------------
# 5. China Dataset Schedule Adherence & Delay Prediction Tests
# -------------------------------------------------------------
def test_schedule_adherence_missing_token():
    payload = {
        "planned_duration_weeks": 6.0,
        "story_points": 40.0,
        "team_size": 3,
        "complexity": "medium"
    }
    response = client.post("/predict/schedule-adherence", json=payload)
    assert response.status_code == 401

def test_schedule_adherence_on_time_scenario():
    """Generous planned schedule and small scope should predict On-Time with Low Risk."""
    payload = {
        "planned_duration_weeks": 20.0,
        "story_points": 20.0,
        "team_size": 5,
        "complexity": "low",
        "development_type": "NewDev"
    }
    response = client.post("/predict/schedule-adherence", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["completed_within_planned_schedule"] is True
    assert data["delay_probability"] < 0.50
    assert data["risk_level"] in ["Low", "Medium"]
    assert data["schedule_slip_weeks"] == 0.0
    assert "China" in data["dataset_source"]

def test_schedule_adherence_delayed_scenario():
    """Aggressive 2-week schedule with 100 story points and 1 dev should predict Delay with High Risk."""
    payload = {
        "planned_duration_weeks": 2.0,
        "story_points": 100.0,
        "team_size": 1,
        "complexity": "high",
        "development_type": "NewDev"
    }
    response = client.post("/predict/schedule-adherence", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["completed_within_planned_schedule"] is False
    assert data["delay_probability"] > 0.60
    assert data["risk_level"] == "High"
    assert data["schedule_slip_weeks"] > 0.0
    assert len(data["key_risk_factors"]) >= 2

