'use client';

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { X, Sparkles, Loader2, AlertCircle, Clock } from 'lucide-react';

export function TaskModal({ isOpen, onClose, projectId, onTaskCreated, members = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    taskType: 'feature',
    storyPoints: 3,
    assignee: '',
    teamExp: 2.5,
    managerExp: 3.0,
    transactions: 36,
    entities: 6
  });

  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debounced live prediction preview call to backend
  useEffect(() => {
    if (!isOpen) return;

    let timeoutId = setTimeout(async () => {
      setLoadingPrediction(true);
      try {
        const res = await api.post('/tasks/predict-preview', {
          storyPoints: Number(formData.storyPoints),
          mlFeatures: {
            teamExp: Number(formData.teamExp),
            managerExp: Number(formData.managerExp),
            transactions: Number(formData.transactions),
            entities: Number(formData.entities),
            pointsAdjust: Number(formData.storyPoints) * 10.0,
            envergure: 25.0,
            language: 1
          }
        });
        if (res.data?.success) {
          setPrediction(res.data.data);
        }
      } catch (err) {
        console.warn('[TaskModal] Prediction preview fetch error:', err.message);
      } finally {
        setLoadingPrediction(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId); // Cleanup debounce timer
  }, [isOpen, formData.storyPoints, formData.teamExp, formData.managerExp, formData.transactions, formData.entities]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-scale transactions and entities with story points if modified
      if (name === 'storyPoints') {
        const pts = Number(value) || 1;
        updated.transactions = pts * 12;
        updated.entities = Math.max(2, pts * 2);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Task title is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        project: projectId,
        priority: formData.priority,
        taskType: formData.taskType,
        storyPoints: Number(formData.storyPoints),
        assignee: formData.assignee || null,
        mlFeatures: {
          teamExp: Number(formData.teamExp),
          managerExp: Number(formData.managerExp),
          transactions: Number(formData.transactions),
          entities: Number(formData.entities),
          pointsAdjust: Number(formData.storyPoints) * 10.0,
          envergure: 25.0,
          language: 1
        }
      };

      const res = await api.post('/tasks', payload);
      if (res.data?.success) {
        onTaskCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Create Intelligent Task</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-center space-x-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Task Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Implement resilient token refresh rotation"
              required
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Provide technical context or acceptance criteria..."
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Priority & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Task Type</label>
              <select
                name="taskType"
                value={formData.taskType}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="feature">Feature</option>
                <option value="bug">Bug Fix</option>
                <option value="refactor">Refactor</option>
                <option value="documentation">Documentation</option>
              </select>
            </div>
          </div>

          {/* Assignee & Story Points */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Assignee</label>
              <select
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Story Points ({formData.storyPoints} pts)
              </label>
              <input
                type="range"
                name="storyPoints"
                min="1"
                max="13"
                value={formData.storyPoints}
                onChange={handleChange}
                className="w-full accent-indigo-500 mt-2 cursor-pointer"
              />
            </div>
          </div>

          {/* ML Operational Feature Tuning */}
          <details className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 text-xs">
            <summary className="font-semibold text-zinc-400 cursor-pointer hover:text-zinc-200">
              Advanced ML Features (Desharnais Inputs)
            </summary>
            <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-zinc-800">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Team Exp (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  name="teamExp"
                  value={formData.teamExp}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Manager Exp (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  name="managerExp"
                  value={formData.managerExp}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Transactions / Actions</label>
                <input
                  type="number"
                  name="transactions"
                  value={formData.transactions}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Entities / Models</label>
                <input
                  type="number"
                  name="entities"
                  value={formData.entities}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs"
                />
              </div>
            </div>
          </details>

          {/* Live ML Prediction Preview Card */}
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                Live ML Schedule Prediction
              </span>
              {loadingPrediction && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
            </div>

            {prediction ? (
              <div className="space-y-1">
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-black text-white">
                    {prediction.predicted_duration_hours} hrs
                  </span>
                  <span className="text-xs text-indigo-300">
                    (~{prediction.predicted_duration_days} working days)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>
                    Confidence Band: {prediction.confidence_range_hours?.min_hours}h – {prediction.confidence_range_hours?.max_hours}h
                  </span>
                  <span className="font-mono text-[10px] text-indigo-400/90">{prediction.model_name}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Calculating duration estimate...</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors flex items-center space-x-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
