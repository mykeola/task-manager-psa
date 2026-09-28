'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../../lib/api';
import { useAuth } from '../../../../lib/authContext';
import { KanbanBoard } from '../../../../components/KanbanBoard';
import { TaskModal } from '../../../../components/TaskModal';
import { ForecastView } from '../../../../components/ForecastView';
import {
  FolderKanban,
  Sparkles,
  TrendingUp,
  Plus,
  ArrowLeft,
  Loader2,
  Calendar,
  Layers,
  Clock
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id;
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'forecast'
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [error, setError] = useState('');

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes, usersRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?project=${projectId}`),
        api.get('/users')
      ]);

      if (projRes.data?.success) setProject(projRes.data.data);
      if (tasksRes.data?.success) setTasks(tasksRes.data.data);
      if (usersRes.data?.success) setMembers(usersRes.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (projectId) {
      fetchProjectData();
    }
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Optimistic status update handler
  const handleStatusChange = async (taskId, newStatus) => {
    const previousTasks = [...tasks];

    // 1. Optimistic Update (Snappy UI)
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    // 2. Server Sync
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (err) {
      console.error('[ProjectDetail] Status update sync failed:', err.message);
      // Rollback to previous state on failure
      setTasks(previousTasks);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-zinc-400">Loading project and task board...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-4">
        <p className="text-sm text-red-400">{error || 'Project not found.'}</p>
        <a
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-xs text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation & Project Header */}
      <div className="space-y-3">
        <a
          href="/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Projects</span>
        </a>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-white">{project.name}</h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{project.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-800 flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'kanban'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Kanban Board ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('forecast')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'forecast'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Monte Carlo Forecast</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'kanban' ? (
        <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
      ) : (
        <ForecastView projectId={projectId} />
      )}

      {/* Create Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        projectId={projectId}
        onTaskCreated={handleTaskCreated}
        members={members}
      />
    </div>
  );
}
