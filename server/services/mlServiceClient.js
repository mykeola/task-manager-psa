import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'psa_internal_ml_service_token_secure_2026';

const apiClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': INTERNAL_SERVICE_TOKEN
  }
});

/**
 * ML Service Client (Internal Microservice RPC)
 * 
 * TENANT PRIVACY PRESERVATION:
 * This client strictly adheres to tenant-agnostic data segregation.
 * Only sanitized, numeric/categorical task parameters are passed over the network.
 * No organizationId, userId, or tenant-identifiable metadata is ever transmitted.
 */
export const mlServiceClient = {
  /**
   * Health Check Probe
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.warn('[ML Service Client] Health check failed:', error.message);
      return { status: 'unavailable', error: error.message };
    }
  },

  /**
   * Predict Task Duration (Hours & Days)
   * Dispatches task features to Python FastAPI service.
   */
  async predictTaskDuration(features = {}) {
    try {
      const teamExp = Number(features.teamExp ?? 2.0);
      const managerExp = Number(features.managerExp ?? 3.0);
      const transactions = Number(features.transactions ?? 40.0);
      const entities = Number(features.entities ?? 8.0);
      const pointsAdjust = Number(
        features.pointsAdjust != null
          ? features.pointsAdjust
          : features.storyPoints != null
          ? features.storyPoints * 10
          : 50.0
      );
      const envergure = Number(features.envergure ?? 25.0);
      const language = Number(features.language ?? 1);

      const payload = {
        team_exp: isNaN(teamExp) ? 2.0 : teamExp,
        manager_exp: isNaN(managerExp) ? 3.0 : managerExp,
        transactions: isNaN(transactions) ? 40.0 : transactions,
        entities: isNaN(entities) ? 8.0 : entities,
        points_adjust: isNaN(pointsAdjust) ? 50.0 : pointsAdjust,
        envergure: isNaN(envergure) ? 25.0 : envergure,
        language: [1, 2, 3].includes(language) ? language : 1
      };

      const response = await apiClient.post('/predict/task-duration', payload);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[ML Service Client Error] Failed to fetch task prediction:', error.message);
      
      // Fallback Heuristic: If ML service is temporarily down, ensure task creation doesn't crash.
      // 1 story point ~ 4 hours baseline
      const fallbackHours = Math.max(2.0, (features.storyPoints || 3) * 4.0);
      return {
        success: false,
        fallback: true,
        data: {
          predicted_duration_hours: fallbackHours,
          predicted_duration_days: Number((fallbackHours / 8.0).toFixed(2)),
          confidence_range_hours: {
            min_hours: Math.max(1.0, Number((fallbackHours * 0.7).toFixed(1))),
            max_hours: Number((fallbackHours * 1.3).toFixed(1))
          },
          model_name: 'FallbackHeuristic',
          model_version: 'fallback-0.1'
        }
      };
    }
  },

  /**
   * Monte Carlo Project Completion Forecast
   * Dispatches project throughput array to Python FastAPI simulation engine.
   */
  async forecastProjectCompletion({ remainingTasks, historicalThroughput, simulationRuns = 10000, startDate = null }) {
    try {
      const payload = {
        remaining_tasks: Number(remainingTasks),
        historical_throughput: historicalThroughput.map(Number),
        simulation_runs: Number(simulationRuns),
        start_date: startDate
      };

      const response = await apiClient.post('/forecast/project-completion', payload);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[ML Service Client Error] Monte Carlo forecast failed:', error.message);
      throw new Error(`ML Forecasting service unavailable: ${error.message}`);
    }
  },

  /**
   * Predict Schedule Adherence (China Benchmark Model N=499)
   * Predicts whether project will complete within planned schedule (On-Time vs Delayed),
   * delay probability, schedule slip, and key risk factors.
   */
  async predictScheduleAdherence({
    plannedDurationWeeks,
    storyPoints = 40,
    teamSize = 3,
    complexity = 'medium',
    developmentType = 'NewDev'
  }) {
    try {
      const payload = {
        planned_duration_weeks: Math.max(0.5, Number(plannedDurationWeeks || 6)),
        story_points: Math.max(1, Number(storyPoints || 40)),
        team_size: Math.max(1, Number(teamSize || 3)),
        complexity: ['low', 'medium', 'high'].includes(complexity?.toLowerCase()) ? complexity.toLowerCase() : 'medium',
        development_type: ['NewDev', 'Maint'].includes(developmentType) ? developmentType : 'NewDev'
      };

      const response = await apiClient.post('/predict/schedule-adherence', payload);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[ML Service Client Error] Schedule adherence prediction failed:', error.message);
      const planned = Number(plannedDurationWeeks) || 6;
      const points = Number(storyPoints) || 40;
      const team = Math.max(1, Number(teamSize) || 3);
      const estimatedWeeks = (points * 4.0) / (team * 25);
      const isDelayed = planned < estimatedWeeks;
      const slip = Math.max(0, Number((estimatedWeeks - planned).toFixed(1)));
      return {
        success: false,
        fallback: true,
        data: {
          completed_within_planned_schedule: !isDelayed,
          delay_probability: isDelayed ? 0.75 : 0.25,
          confidence_level: 0.85,
          predicted_duration_weeks: Number(estimatedWeeks.toFixed(1)),
          planned_duration_weeks: planned,
          schedule_slip_weeks: slip,
          risk_level: isDelayed ? 'High' : 'Low',
          key_risk_factors: isDelayed
            ? ['High backlog scope relative to planned delivery window', 'Team capacity constraints']
            : ['Backlog scope and team size are balanced for planned timeline'],
          model_name: 'FallbackHeuristic (Putnam-SLIM)',
          dataset_source: 'Fallback Benchmark Formula'
        }
      };
    }
  }
};

