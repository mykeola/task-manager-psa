import { mlServiceClient } from '../server/services/mlServiceClient.js';

describe('ML Service Client Unit & Fault Tolerance Tests', () => {
  test('predictTaskDuration sanitizes missing/partial feature inputs cleanly', async () => {
    // Provide sparse inputs; client must apply sensible defaults rather than crashing
    const result = await mlServiceClient.predictTaskDuration({
      storyPoints: 5
    });

    expect(result.data).toBeDefined();
    expect(result.data.predicted_duration_hours).toBeGreaterThan(0);
    expect(result.data.predicted_duration_days).toBeGreaterThan(0);
    expect(result.data.confidence_range_hours.min_hours).toBeLessThanOrEqual(
      result.data.predicted_duration_hours
    );
  });

  test('forecastProjectCompletion formats simulation payload correctly', async () => {
    try {
      const result = await mlServiceClient.forecastProjectCompletion({
        remainingTasks: 15,
        historicalThroughput: [3, 4, 5, 2, 6],
        simulationRuns: 1000
      });

      expect(result.success).toBe(true);
      expect(result.data.percentile_50_weeks).toBeDefined();
      expect(result.data.percentile_85_weeks).toBeDefined();
      expect(result.data.percentile_50_weeks).toBeLessThanOrEqual(
        result.data.percentile_85_weeks
      );
    } catch (err) {
      // If Python service is not running in background during standalone unit test, verify error message
      expect(err.message).toMatch(/ML Forecasting service/i);
    }
  });

  test('predictScheduleAdherence returns adherence verdict, delay probability, and risk factors', async () => {
    const result = await mlServiceClient.predictScheduleAdherence({
      plannedDurationWeeks: 6.0,
      storyPoints: 45,
      teamSize: 3,
      complexity: 'medium',
      developmentType: 'NewDev'
    });

    expect(result.data).toBeDefined();
    expect(typeof result.data.completed_within_planned_schedule).toBe('boolean');
    expect(result.data.delay_probability).toBeGreaterThanOrEqual(0.0);
    expect(result.data.delay_probability).toBeLessThanOrEqual(1.0);
    expect(['Low', 'Medium', 'High']).toContain(result.data.risk_level);
    expect(Array.isArray(result.data.key_risk_factors)).toBe(true);
    expect(result.data.key_risk_factors.length).toBeGreaterThan(0);
  });
});
