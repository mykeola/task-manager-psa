'use client';

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { StatCard } from '../../components/StatCard';
import { PriorityBadge, StatusBadge } from '../../components/Badge';
import {
  FolderKanban,
  Plus,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  AlertCircle,
  CheckSquare,
  Calendar,
  Send,
  Play,
  UserCheck
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin, isManager, isEngineer } = useAuth();
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'my-tasks'
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'active',
    plannedDurationWeeks: 6
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      if (res.data?.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('[Dashboard] Failed to fetch projects:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async () => {
    if (!user) return;
    try {
      setTasksLoading(true);
      const currentUserId = user.id || user._id;
      const res = await api.get(`/tasks?assignee=${currentUserId}`);
      if (res.data?.success) {
        setMyTasks(res.data.data);
      }
    } catch (err) {
      console.error('[Dashboard] Failed to fetch assigned tasks:', err.message);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchProjects();
    if (user) {
      fetchMyTasks();
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/projects', newProject);
      if (res.data?.success) {
        setShowCreateModal(false);
        setNewProject({ name: '', description: '', status: 'active', plannedDurationWeeks: 6 });
        fetchProjects();
      }
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      setActionMessage('');
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data?.success) {
        setMyTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
        );
        if (newStatus === 'review') {
          setActionMessage('Task review requested! Your project manager will review and approve.');
        } else if (newStatus === 'in_progress') {
          setActionMessage('Task moved to In Progress.');
        }
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update task status.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Compute aggregated stats
  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + (p.taskStats?.total || 0), 0);
  const completedTasks = projects.reduce((acc, p) => acc + (p.taskStats?.completed || 0), 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeMyTasksCount = myTasks.filter((t) => t.status !== 'done').length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Project Workspaces</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tenant-isolated projects with integrated ML task duration & Monte Carlo forecasting.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          subtitle="Scoped to your organization"
          icon={FolderKanban}
          color="blue"
        />
        <StatCard
          title="Active Backlog"
          value={totalTasks}
          subtitle="Cumulative tracked work items"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="My Deliverables"
          value={activeMyTasksCount}
          subtitle="Tasks assigned to you"
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          subtitle={`${overallProgress}% organizational completion`}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* VIEW SELECTOR TABS (Projects vs My Assigned Tasks) */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'projects'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <FolderKanban className="w-4 h-4 text-indigo-400" />
          <span>All Projects</span>
          <span className="px-1.5 py-0.5 rounded-full bg-zinc-900 text-[10px] text-zinc-400 border border-zinc-800">
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('my-tasks');
            fetchMyTasks();
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'my-tasks'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-purple-400" />
          <span>My Assigned Tasks</span>
          {activeMyTasksCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-bold border border-purple-800/60">
              {activeMyTasksCount}
            </span>
          )}
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* TAB 1: ALL PROJECTS GRID */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-200 tracking-wide">Active Projects</h2>

          {loading ? (
            <div className="h-48 flex items-center justify-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
              <FolderKanban className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-300">No projects found in this organization.</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Create your first project to start creating tasks and forecasting delivery timelines.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => {
                const stats = project.taskStats || { total: 0, completed: 0, progress: 0 };

                return (
                  <div
                    key={project._id}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 shadow-sm transition-all hover:shadow-lg flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {project.status}
                        </span>
                        <a
                          href={`/dashboard/projects/${project._id}`}
                          className="text-zinc-500 group-hover:text-indigo-400 transition-colors p-1"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {project.name}
                      </h3>

                      {project.description && (
                        <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Progress & Stats */}
                    <div className="mt-6 pt-4 border-t border-zinc-800/80 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-400">{stats.completed} of {stats.total} Tasks Completed</span>
                        <span className="text-indigo-400">{stats.progress}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-zinc-500 truncate max-w-[150px]">
                          Owner: {project.owner?.name || 'Admin'}
                        </span>
                        <a
                          href={`/dashboard/projects/${project._id}`}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Open Board →
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ASSIGNED TASKS (DEDICATED ENGINEER WORKSPACE) */}
      {activeTab === 'my-tasks' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Tasks Assigned to You</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Deliverables scheduled for your review. Complete development, then request review for manager approval.
            </p>
          </div>

          {tasksLoading ? (
            <div className="h-48 flex items-center justify-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : myTasks.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
              <CheckSquare className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-300">No tasks currently assigned to you.</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Tasks assigned by your project manager or admin will appear here with expected deadlines.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTasks.map((task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

                return (
                  <div
                    key={task._id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                          {task.description}
                        </p>
                      )}

                      <div className="text-[11px] text-indigo-400 font-semibold mb-2">
                        Project: {task.project?.name || 'Workspace Project'}
                      </div>

                      {/* Expected Deadline */}
                      {task.dueDate ? (
                        <div className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          isOverdue
                            ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                            : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
                        }`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Expected Deadline: {new Date(task.dueDate).toLocaleDateString()}</span>
                          {isOverdue && <span className="text-red-400 font-bold ml-auto">(Overdue)</span>}
                        </div>
                      ) : (
                        <div className="text-[11px] text-zinc-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>No deadline set by manager</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center space-x-1 text-indigo-300">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimatedDuration || 0}h ML est.</span>
                        </span>
                        <span>{task.storyPoints || 1} Story Points</span>
                      </div>

                      {/* Action buttons based on task state */}
                      {task.status === 'todo' && (
                        <button
                          type="button"
                          onClick={() => handleTaskStatusChange(task._id, 'in_progress')}
                          className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Working</span>
                        </button>
                      )}

                      {task.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => handleTaskStatusChange(task._id, 'review')}
                          className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-md shadow-purple-600/20"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Request Review from Manager</span>
                        </button>
                      )}

                      {task.status === 'review' && (
                        <div className="py-1.5 px-3 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-semibold flex items-center justify-center space-x-1.5 text-center">
                          <Clock className="w-3.5 h-3.5 animate-pulse text-purple-400" />
                          <span>Awaiting Review by Manager</span>
                        </div>
                      )}

                      {task.status === 'done' && (
                        <div className="py-1.5 px-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1.5 text-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Approved & Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create New Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-center space-x-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. Core API Modernization"
                  required
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  placeholder="Project goals and technical scope..."
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Planned Schedule (Weeks)</label>
                <input
                  type="number"
                  min="1"
                  max="104"
                  step="0.5"
                  value={newProject.plannedDurationWeeks}
                  onChange={(e) => setNewProject({ ...newProject, plannedDurationWeeks: parseFloat(e.target.value) || 1 })}
                  placeholder="6"
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Baseline timeline evaluated against the China Software Benchmark dataset.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
