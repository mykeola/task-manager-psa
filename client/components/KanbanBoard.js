'use client';

import React from 'react';
import { StatusBadge, PriorityBadge } from './Badge';
import { useAuth } from '../lib/authContext';
import { Clock, CheckCircle2, RotateCcw, User, Calendar, ShieldCheck, Send } from 'lucide-react';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'border-zinc-700' },
  { id: 'todo', title: 'To Do', color: 'border-blue-800' },
  { id: 'in_progress', title: 'In Progress', color: 'border-amber-800' },
  { id: 'review', title: 'In Review', color: 'border-purple-800' },
  { id: 'done', title: 'Completed', color: 'border-emerald-800' }
];

export function KanbanBoard({ tasks = [], onStatusChange }) {
  const { user, isManager, isAdmin } = useAuth();
  const getColumnTasks = (status) => tasks.filter((t) => t.status === status);

  const canApprove = isManager || isAdmin;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colTasks = getColumnTasks(col.id);

        return (
          <div
            key={col.id}
            className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-3.5 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-3 mb-3 border-b ${col.color}`}>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold text-zinc-200 tracking-wide">{col.title}</h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {colTasks.length}
                </span>
              </div>
            </div>

            {/* Task Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-zinc-900 rounded-xl text-[11px] text-zinc-600 font-medium">
                  No tasks
                </div>
              ) : (
                colTasks.map((task) => {
                  const assigneeId = task.assignee?._id || task.assignee?.id || task.assignee;
                  const currentUserId = user?.id || user?._id;
                  const isAssignedToMe = assigneeId && String(assigneeId) === String(currentUserId);
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

                  return (
                    <div
                      key={task._id}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 shadow-sm hover:border-zinc-700 transition-all hover:shadow-md group"
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-zinc-800/80 text-zinc-400 rounded">
                          {task.taskType}
                        </span>
                      </div>

                      <h5 className="text-xs font-bold text-white mb-1 leading-snug line-clamp-2">
                        {task.title}
                      </h5>

                      {task.description && (
                        <p className="text-[11px] text-zinc-400 mb-2.5 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Expected Deadline Tag */}
                      {task.dueDate && (
                        <div className={`flex items-center space-x-1.5 text-[10px] font-semibold mb-2.5 px-2 py-1 rounded-md ${
                          isOverdue
                            ? 'bg-red-950/50 text-red-300 border border-red-800/50'
                            : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>Deadline: {new Date(task.dueDate).toLocaleDateString()}</span>
                          {isOverdue && <span className="text-red-400 font-bold ml-1">(Overdue)</span>}
                        </div>
                      )}

                      {/* AI ML Estimate & Story Points */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] mb-2.5">
                        <div className="flex items-center space-x-1 text-indigo-400 font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimatedDuration || 0}h est.</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {task.storyPoints || 1} pts
                        </span>
                      </div>

                      {/* Assignee & Status Quick Select */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <div className="flex items-center space-x-1.5 text-zinc-400 truncate max-w-[110px]">
                          <User className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate">
                            {isAssignedToMe ? (
                              <strong className="text-indigo-300">You</strong>
                            ) : (
                              task.assignee?.name || 'Unassigned'
                            )}
                          </span>
                        </div>

                        {/* Status Shift Selector (Omit 'done' for engineers/members) */}
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task._id, e.target.value)}
                          className="text-[10px] bg-zinc-950 border border-zinc-800 rounded-md px-1.5 py-1 text-zinc-300 hover:border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {COLUMNS.filter((c) => canApprove || c.id !== 'done').map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* QUALITY GATEKEEPING ACTIONS */}
                      {/* 1. If In Progress: Engineer can click 'Request Review' */}
                      {task.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => onStatusChange(task._id, 'review')}
                          className="w-full mt-2.5 py-1.5 px-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-200 text-[10px] font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                        >
                          <Send className="w-3 h-3" />
                          <span>Request Review</span>
                        </button>
                      )}

                      {/* 2. If In Review: Manager/Admin can Approve or Request Rework */}
                      {task.status === 'review' && (
                        canApprove ? (
                          <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-zinc-800/60">
                            <button
                              type="button"
                              onClick={() => onStatusChange(task._id, 'done')}
                              className="py-1 px-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-[10px] font-bold flex items-center justify-center space-x-1 transition-colors"
                              title="Approve and mark completed"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onStatusChange(task._id, 'in_progress')}
                              className="py-1 px-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-800/60 text-[10px] font-bold flex items-center justify-center space-x-1 transition-colors"
                              title="Request changes/rework"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-400" />
                              <span>Rework</span>
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2.5 py-1 px-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-300 text-[10px] font-medium flex items-center justify-center space-x-1.5">
                            <Clock className="w-3 h-3 animate-pulse text-purple-400" />
                            <span>Awaiting Manager Review</span>
                          </div>
                        )
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
