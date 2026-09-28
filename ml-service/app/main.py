from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import (
    TaskDurationRequest, TaskDurationResponse,
    ProjectForecastRequest, ProjectForecastResponse,
    ScheduleAdherenceRequest, ScheduleAdherenceResponse,
    HealthResponse
)
from app.dependencies import verify_internal_token
from app.services.predictor import predictor
from app.services.monte_carlo import run_monte_carlo_forecast
from app.services.schedule_predictor import schedule_predictor

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure ML model artifacts are loaded into memory on startup."""
    predictor.load_artifacts()
    schedule_predictor.load_models()
    print("[FastAPI ML Service] Initialization complete. Ready for internal RPC calls.")
    yield

app = FastAPI(
    title="PSA Task Effort & Schedule Prediction ML Service",
    description="Internal microservice delivering effort prediction and Monte Carlo schedule forecasting",
    version="1.0.0",
    lifespan=lifespan
)

# Lock down CORS for local service-to-service communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """
    Public health and liveness probe.
    Does not require internal authentication.
    """
    return HealthResponse(
        status="healthy",
        service="psa-task-manager-ml-service",
        model_loaded=(predictor.model is not None),
        preprocessor_loaded=(predictor.preprocessor is not None)
    )

@app.post(
    "/predict/task-duration",
    response_model=TaskDurationResponse,
    dependencies=[Depends(verify_internal_token)],
    tags=["Prediction"]
)
def predict_task_duration(req: TaskDurationRequest):
    """
    Predict software task duration (person-hours and days) from operational attributes.
    Protected by X-Internal-Token header.
    Strictly tenant-agnostic: Receives no tenant or user identifiers.
    """
    return predictor.predict(req)

@app.post(
    "/forecast/project-completion",
    response_model=ProjectForecastResponse,
    dependencies=[Depends(verify_internal_token)],
    tags=["Forecasting"]
)
def forecast_project_completion(req: ProjectForecastRequest):
    """
    Execute Monte Carlo completion forecast from project throughput data.
    Protected by X-Internal-Token header.
    Runs 10,000 resamples returning 50%, 85%, and 95% completion dates.
    """
    return run_monte_carlo_forecast(req)

@app.post(
    "/predict/schedule-adherence",
    response_model=ScheduleAdherenceResponse,
    dependencies=[Depends(verify_internal_token)],
    tags=["Schedule Prediction"]
)
def predict_schedule_adherence(req: ScheduleAdherenceRequest):
    """
    Predict whether a software project will be completed within its planned schedule.
    Trained on China Software Benchmark Dataset (N=499).
    Protected by X-Internal-Token header.
    Returns On-Time/Delayed classification, delay probability, slip, and key risk factors.
    """
    return schedule_predictor.predict_schedule_adherence(req)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

