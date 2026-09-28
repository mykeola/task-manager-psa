import React from 'react';

export function StatusBadge({ status }) {
  const styles = {
    backlog: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    todo: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    in_progress: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    review: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
    done: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
  };

  const labels = {
    backlog: 'Backlog',
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'In Review',
    done: 'Completed'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || styles.todo
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    low: 'bg-slate-800 text-slate-300 border-slate-700',
    medium: 'bg-sky-950 text-sky-300 border-sky-800',
    high: 'bg-orange-950 text-orange-300 border-orange-800',
    critical: 'bg-red-950 text-red-300 border-red-800'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${
        styles[priority] || styles.medium
      }`}
    >
      {priority}
    </span>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    superadmin: 'bg-rose-900/60 text-rose-200 border-rose-700',
    admin: 'bg-indigo-900/60 text-indigo-200 border-indigo-700',
    manager: 'bg-cyan-900/60 text-cyan-200 border-cyan-700',
    member: 'bg-zinc-800 text-zinc-300 border-zinc-700'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
        styles[role] || styles.member
      }`}
    >
      {role}
    </span>
  );
}
