import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional
from app.schemas import ProjectForecastRequest, ProjectForecastResponse

def run_monte_carlo_forecast(req: ProjectForecastRequest) -> ProjectForecastResponse:
    """
    Simulate project completion timeframe using historical throughput resampling.
    Vectorized Monte Carlo algorithm with 10,000+ simulation iterations.
    Calculates 50%, 85%, and 95% confidence estimates.
    """
    throughput_samples = np.array(req.historical_throughput, dtype=np.float64)
    if len(throughput_samples) == 0 or np.all(throughput_samples <= 0):
        # Fallback default if throughput is zero
        throughput_samples = np.array([3.0, 4.0, 5.0])

    remaining = req.remaining_tasks
    runs = req.simulation_runs

    # Simulation: for each run, draw weekly throughput samples until sum >= remaining
    # Vectorized max-week estimate to allocate sample matrix
    avg_throughput = max(0.5, float(np.mean(throughput_samples)))
    expected_weeks = int(np.ceil(remaining / avg_throughput))
    max_weeks_cap = max(52, expected_weeks * 4)

    # Randomly draw matrix of shape (runs, max_weeks_cap) from historical throughput
    random_samples = np.random.choice(throughput_samples, size=(runs, max_weeks_cap), replace=True)
    
    # Cumulative sum along time axis
    cumulative_progress = np.cumsum(random_samples, axis=1)

    # Find the first week index where cumulative progress >= remaining_tasks
    # argmax on boolean returns the first True index
    completion_mask = cumulative_progress >= remaining
    
    # If in some run max_weeks_cap wasn't enough (rare), cap it
    has_completed = np.any(completion_mask, axis=1)
    weeks_to_complete = np.where(
        has_completed,
        np.argmax(completion_mask, axis=1) + 1,  # 1-indexed weeks
        max_weeks_cap
    )

    # Compute percentiles
    p50_weeks = float(np.percentile(weeks_to_complete, 50))
    p85_weeks = float(np.percentile(weeks_to_complete, 85))
    p95_weeks = float(np.percentile(weeks_to_complete, 95))

    # Calculate target calendar dates
    if req.start_date:
        try:
            base_date = datetime.strptime(req.start_date, "%Y-%m-%d")
        except ValueError:
            base_date = datetime.utcnow()
    else:
        base_date = datetime.utcnow()

    date_50 = (base_date + timedelta(days=int(p50_weeks * 7))).strftime("%Y-%m-%d")
    date_85 = (base_date + timedelta(days=int(p85_weeks * 7))).strftime("%Y-%m-%d")
    date_95 = (base_date + timedelta(days=int(p95_weeks * 7))).strftime("%Y-%m-%d")

    return ProjectForecastResponse(
        remaining_tasks=remaining,
        simulation_runs=runs,
        percentile_50_weeks=round(p50_weeks, 1),
        percentile_85_weeks=round(p85_weeks, 1),
        percentile_95_weeks=round(p95_weeks, 1),
        forecast_date_50=date_50,
        forecast_date_85=date_85,
        forecast_date_95=date_95,
        average_weekly_throughput=round(avg_throughput, 2),
        throughput_sample_size=len(throughput_samples)
    )
