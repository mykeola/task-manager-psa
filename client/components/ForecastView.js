'use client';

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  Sparkles,
  Calendar,
  TrendingUp,
  ShieldAlert,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sliders,
  Save,
  Check,
  Minus,
  Plus
} from 'lucide-react';

export function ForecastView({ projectId }) {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Interactive Manager Planned Schedule State
  const [targetWeeks, setTargetWeeks] = useState(6);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const fetchForecast = async (plannedWeeksOverride) => {
    const isOverride = plannedWeeksOverride !== undefined;
    if (isOverride) {
      setIsEvaluating(true);
    } else {
      setLoading(true);
    }
    setError('');
    setSaveSuccessMessage('');

    try {
      const queryParam = plannedWeeksOverride !== undefined ? `?plannedWeeks=${plannedWeeksOverride}` : '';
      const res = await api.get(`/projects/${projectId}/forecast${queryParam}`);
      if (res.data?.success) {
        setForecastData(res.data.data);
        if (!isOverride) {
          setTargetWeeks(res.data.data.plannedDurationWeeks || 6);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load schedule prediction & Monte Carlo forecast.');
    } finally {
      if (isOverride) {
        setIsEvaluating(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (projectId) {
      fetchForecast();
    }
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const handleEvaluateCustomWeeks = (val) => {
    const num = Math.max(1, Math.min(104, Number(val)));
    setTargetWeeks(num);
    fetchForecast(num);
  };

  const handleStepWeeks = (delta) => {
    const nextVal = Math.max(1, Math.min(104, Math.round((targetWeeks + delta) * 10) / 10));
    setTargetWeeks(nextVal);
    fetchForecast(nextVal);
  };

  const handleSaveAsTarget = async () => {
    setIsSavingTarget(true);
    setSaveSuccessMessage('');
    try {
      const res = await api.put(`/projects/${projectId}`, {
        plannedDurationWeeks: Number(targetWeeks)
      });
      if (res.data?.success) {
        setSaveSuccessMessage(`Saved ${targetWeeks} weeks as official project target schedule.`);
        setTimeout(() => setSaveSuccessMessage(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update project target schedule.');
    } finally {
      setIsSavingTarget(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        <p className="text-xs text-zinc-400">Running China Benchmark ($N=499$) Inference & 10,000 Monte Carlo simulations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/30 border border-red-800/60 rounded-2xl p-6 text-center space-y-3">
        <p className="text-xs text-red-300">{error}</p>
        <button
          onClick={() => fetchForecast()}
          className="px-4 py-1.5 bg-red-900/60 hover:bg-red-800 text-white rounded-xl text-xs font-semibold"
        >
          Retry Simulation
        </button>
      </div>
    );
  }

  if (!forecastData || !forecastData.forecast) {
    return null;
  }

  const {
    forecast,
    remainingTasks,
    totalStoryPoints,
    officialPlannedWeeks,
    throughputSample,
    scheduleAdherence
  } = forecastData;

  const isOnSchedule = scheduleAdherence?.completed_within_planned_schedule ?? true;
  const delayProbPercent = Math.round((scheduleAdherence?.delay_probability ?? 0.25) * 100);
  const predictedWeeks = scheduleAdherence?.predicted_duration_weeks || 7.5;
  const varianceWeeks = Math.round((predictedWeeks - targetWeeks) * 10) / 10;
  const hasBuffer = varianceWeeks <= 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-900/40 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Schedule Adherence & Monte Carlo Simulator</span>
          </div>
          <h3 className="text-lg font-bold text-white">Software Schedule Adherence & Delivery Forecast</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Empirically calibrated against the PROMISE China Software Benchmark Dataset ($N=499$) with 10,000 stochastic Monte Carlo resamples.
          </p>
        </div>
        <button
          onClick={() => fetchForecast()}
          disabled={isEvaluating}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>Reset to Project Baseline</span>
        </button>
      </div>

      {/* INTERACTIVE MANAGER TARGET SCHEDULE CONTROLLER (WHAT-IF SCENARIO ANALYZER) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Manager Schedule Target & What-If Analyzer
              </h4>
            </div>
            <p className="text-xs text-zinc-400">
              Input or adjust your planned timeline in weeks to test whether project scope will be concluded within that schedule.
            </p>
          </div>

          {/* Stepper & Preset Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Presets */}
            <div className="flex items-center space-x-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {[4, 6, 8, 10, 12].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleEvaluateCustomWeeks(preset)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    targetWeeks === preset
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {preset}w
                </button>
              ))}
            </div>

            {/* Stepper */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => handleStepWeeks(-1)}
                disabled={targetWeeks <= 1 || isEvaluating}
                className="px-2.5 py-2 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
                title="Decrease 1 week"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center px-2 py-1">
                <input
                  type="number"
                  min="1"
                  max="104"
                  step="0.5"
                  value={targetWeeks}
                  onChange={(e) => handleEvaluateCustomWeeks(e.target.value)}
                  className="w-12 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-400 font-semibold pr-1">wks</span>
              </div>

              <button
                type="button"
                onClick={() => handleStepWeeks(1)}
                disabled={targetWeeks >= 104 || isEvaluating}
                className="px-2.5 py-2 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
                title="Increase 1 week"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Save Target Button */}
            <button
              type="button"
              onClick={handleSaveAsTarget}
              disabled={isSavingTarget}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {isSavingTarget ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save as Target</span>
            </button>
          </div>
        </div>

        {saveSuccessMessage && (
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* SCHEDULE ADHERENCE & DELAY PREDICTION CARD (Problem Statement Classifier) */}
      {scheduleAdherence && (
        <div className={`border rounded-2xl p-6 relative overflow-hidden transition-all ${
          isOnSchedule
            ? 'bg-gradient-to-br from-emerald-950/20 via-zinc-900 to-zinc-900 border-emerald-800/40'
            : 'bg-gradient-to-br from-rose-950/25 via-zinc-900 to-zinc-900 border-rose-800/50'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  AI Schedule Adherence Verdict
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 font-mono text-zinc-300">
                  China Benchmark (N=499)
                </span>
                {isEvaluating && (
                  <span className="text-[10px] text-indigo-400 animate-pulse font-semibold">
                    Recalculating...
                  </span>
                )}
              </div>
              <h4 className="text-xl font-black text-white flex items-center gap-2">
                {isOnSchedule ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Project Expected to Complete Within Planned Schedule</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                    <span>Project at High Risk of Schedule Overrun</span>
                  </>
                )}
              </h4>
            </div>

            {/* Delay Risk Meter Badge */}
            <div className={`px-4 py-2 rounded-xl border flex items-center space-x-3 shrink-0 ${
              isOnSchedule
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-200'
                : 'bg-rose-950/70 border-rose-700/60 text-rose-200'
            }`}>
              <Clock className="w-4 h-4" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Delay Risk Probability</p>
                <p className="text-base font-black leading-none mt-0.5">{delayProbPercent}%</p>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Grid: Manager Target vs AI Prediction */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            {/* Manager Planned Target */}
            <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
              <p className="text-[11px] text-zinc-400 font-medium">Manager Target</p>
              <p className="text-base font-bold text-white mt-0.5">{targetWeeks} Weeks</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Official: {officialPlannedWeeks || 6}w
              </p>
            </div>

            {/* AI Predicted Duration */}
            <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
              <p className="text-[11px] text-zinc-400 font-medium">AI Estimated Duration</p>
              <p className="text-base font-bold text-indigo-300 mt-0.5">{predictedWeeks} Weeks</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                China Model Regressor
              </p>
            </div>

            {/* Comparison Variance / Buffer */}
            <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
              <p className="text-[11px] text-zinc-400 font-medium">Schedule Variance</p>
              <p className={`text-base font-bold mt-0.5 ${hasBuffer ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hasBuffer ? `+${Math.abs(varianceWeeks)}w Buffer` : `-${varianceWeeks}w Deficit`}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                {hasBuffer ? 'Safe Contingency' : 'Anticipated Slip'}
              </p>
            </div>

            {/* Backlog Scope */}
            <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
              <p className="text-[11px] text-zinc-400 font-medium">Backlog Scope</p>
              <p className="text-base font-bold text-amber-300 mt-0.5">{totalStoryPoints || 45} Story Points</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                {remainingTasks} tasks pending
              </p>
            </div>
          </div>

          {/* Software Project Management (SPM) Actionable Guidance */}
          <div className={`p-3.5 rounded-xl border text-xs mb-4 ${
            hasBuffer
              ? 'bg-emerald-950/25 border-emerald-800/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
          }`}>
            <span className="font-bold uppercase tracking-wider block mb-1">
              {hasBuffer ? 'SPM Schedule Recommendation (Feasible Target)' : 'SPM Critical Path Warning (Overrun Expected)'}
            </span>
            {hasBuffer ? (
              <p className="leading-relaxed">
                Your planned schedule of <strong>{targetWeeks} weeks</strong> accommodates the empirical backlog requirements ({predictedWeeks} weeks needed). This provides a <strong>{Math.abs(varianceWeeks)} week buffer</strong> against technical debt, defect triage, or review bottlenecks.
              </p>
            ) : (
              <p className="leading-relaxed">
                Your planned schedule of <strong>{targetWeeks} weeks</strong> is shorter than the empirical benchmark prediction of <strong>{predictedWeeks} weeks</strong>. To prevent project failure, the project manager should: (1) Negotiate a revised delivery date of at least <strong>{predictedWeeks} weeks</strong>, (2) De-scope non-critical user stories to reduce story points, or (3) Add developer capacity.
              </p>
            )}
          </div>

          {/* Explainable Key Risk Factors */}
          {scheduleAdherence.key_risk_factors?.length > 0 && (
            <div className="bg-zinc-950/60 rounded-xl border border-zinc-800/60 p-3.5 space-y-1.5">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                <span>Explainable AI (XAI) Key Risk Drivers:</span>
              </p>
              <ul className="space-y-1 pl-1">
                {scheduleAdherence.key_risk_factors.map((factor, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start space-x-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Confidence Percentile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 50% Median (Coin-flip) */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-blue-400 uppercase tracking-wider">50% Probability</span>
            <span className="text-[11px] text-zinc-500 font-mono">P50 Median</span>
          </div>
          <div className="space-y-1 my-3">
            <p className="text-3xl font-black text-white">{forecast.percentile_50_weeks} wks</p>
            <p className="text-xs font-semibold text-blue-300 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Target: {forecast.forecast_date_50}
            </p>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2.5">
            50% chance of finishing on or before this date. Standard internal target for high-velocity teams.
          </p>
        </div>

        {/* 85% Recommended Commitment (Industry Standard) */}
        <div className="bg-indigo-950/20 border-2 border-indigo-600/50 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-indigo-950/30">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-indigo-300 uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              85% Recommended
            </span>
            <span className="text-[11px] text-indigo-400 font-mono">P85 Target</span>
          </div>
          <div className="space-y-1 my-3">
            <p className="text-3xl font-black text-white">{forecast.percentile_85_weeks} wks</p>
            <p className="text-xs font-semibold text-indigo-300 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Target: {forecast.forecast_date_85}
            </p>
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed border-t border-indigo-900/50 pt-2.5">
            The gold-standard agile commitment target. Provides robust defense against unexpected blockers.
          </p>
        </div>

        {/* 95% High Certainty */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-amber-400 uppercase tracking-wider">95% High Certainty</span>
            <span className="text-[11px] text-zinc-500 font-mono">P95 Buffer</span>
          </div>
          <div className="space-y-1 my-3">
            <p className="text-3xl font-black text-white">{forecast.percentile_95_weeks} wks</p>
            <p className="text-xs font-semibold text-amber-300 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Target: {forecast.forecast_date_95}
            </p>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2.5">
            Includes high contingency buffer. Recommended for hard contract delivery dates or SLAs.
          </p>
        </div>
      </div>

      {/* Simulation Diagnostics Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>Simulation Parameters & Velocity Distribution</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <p className="text-zinc-500 text-[11px]">Remaining Backlog</p>
            <p className="text-base font-bold text-white mt-0.5">{remainingTasks} tasks</p>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <p className="text-zinc-500 text-[11px]">Average Weekly Velocity</p>
            <p className="text-base font-bold text-white mt-0.5">{forecast.average_weekly_throughput} tasks/wk</p>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <p className="text-zinc-500 text-[11px]">Historical Sample Size</p>
            <p className="text-base font-bold text-white mt-0.5">{throughputSample.length} weeks</p>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <p className="text-zinc-500 text-[11px]">Stochastic Iterations</p>
            <p className="text-base font-bold text-indigo-400 mt-0.5">{forecast.simulation_runs.toLocaleString()} runs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
