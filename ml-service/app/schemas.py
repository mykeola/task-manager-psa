from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class TaskDurationRequest(BaseModel):
    team_exp: float = Field(default=2.0, ge=0.0, le=20.0, description="Average team development experience in years")
    manager_exp: float = Field(default=3.0, ge=0.0, le=30.0, description="Project manager experience in years")
    transactions: float = Field(default=50.0, ge=1.0, description="Number of logical transactions / CRUD operations")
    entities: float = Field(default=10.0, ge=1.0, description="Number of data entities / database models affected")
    points_adjust: float = Field(default=60.0, ge=1.0, description="Adjusted function points or complexity size")
    envergure: float = Field(default=25.0, ge=1.0, description="Project scope complexity index (5-50 scale)")
    language: int = Field(default=1, ge=1, le=3, description="Language category (1=Core Fullstack, 2=Python/Data, 3=Other)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "team_exp": 3.0,
                "manager_exp": 4.0,
                "transactions": 45.0,
                "entities": 8.0,
                "points_adjust": 55.0,
                "envergure": 24.0,
                "language": 1
            }
        }
    )

class ConfidenceRange(BaseModel):
    min_hours: float
    max_hours: float

class TaskDurationResponse(BaseModel):
    predicted_duration_hours: float
    predicted_duration_days: float
    confidence_range_hours: ConfidenceRange
    model_name: str
    model_version: str

class ProjectForecastRequest(BaseModel):
    remaining_tasks: int = Field(..., ge=1, description="Number of remaining tasks to complete in the project")
    historical_throughput: List[float] = Field(..., min_length=1, description="Historical array of completed tasks per week/sprint")
    simulation_runs: int = Field(default=10000, ge=1000, le=50000, description="Number of Monte Carlo simulation runs")
    start_date: Optional[str] = Field(default=None, description="Simulation start date (YYYY-MM-DD); defaults to current date")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "remaining_tasks": 24,
                "historical_throughput": [4, 6, 3, 5, 2, 7, 4, 5],
                "simulation_runs": 10000,
                "start_date": "2026-03-01"
            }
        }
    )

class ProjectForecastResponse(BaseModel):
    remaining_tasks: int
    simulation_runs: int
    percentile_50_weeks: float
    percentile_85_weeks: float
    percentile_95_weeks: float
    forecast_date_50: str
    forecast_date_85: str
    forecast_date_95: str
    average_weekly_throughput: float
    throughput_sample_size: int

class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
    preprocessor_loaded: bool
    schedule_model_loaded: Optional[bool] = True

class ScheduleAdherenceRequest(BaseModel):
    planned_duration_weeks: float = Field(..., ge=0.5, description="Planned project schedule in weeks")
    story_points: float = Field(default=40.0, ge=1.0, description="Total project story points / function points")
    team_size: int = Field(default=3, ge=1, description="Number of engineers on project team")
    complexity: str = Field(default="medium", description="Technical complexity: low, medium, high")
    development_type: str = Field(default="NewDev", description="NewDev or Maint")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "planned_duration_weeks": 6.0,
                "story_points": 50.0,
                "team_size": 2,
                "complexity": "high",
                "development_type": "NewDev"
            }
        }
    )

class ScheduleAdherenceResponse(BaseModel):
    completed_within_planned_schedule: bool
    delay_probability: float
    confidence_level: float
    predicted_duration_weeks: float
    planned_duration_weeks: float
    schedule_slip_weeks: float
    risk_level: str
    key_risk_factors: List[str]
    model_name: str
    dataset_source: str

