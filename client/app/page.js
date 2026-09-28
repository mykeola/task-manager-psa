'use client';

import React from 'react';
import { useAuth } from '../lib/authContext';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  FolderKanban,
  ArrowRight,
  Cpu,
  Lock,
  BarChart2
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-5xl mx-auto text-center">
      {/* Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-semibold mb-8">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>PSA Prototype: AI/ML + Software Project Management + Cybersecurity</span>
      </div>

      {/* Hero Title */}
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl leading-[1.1]">
        Multi-Tenant Task SaaS with{' '}
        <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
          Integrated AI Scheduling
        </span>
      </h1>

      <p className="text-base text-zinc-400 mt-6 max-w-2xl leading-relaxed">
        Engineered three-tier platform integrating Desharnais-trained ML duration estimation,
        Monte Carlo completion-date forecasting, and strict defense-in-depth tenant isolation.
      </p>

      {/* Action CTA */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
        {user ? (
          <a
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
          >
            <span>Open Workspace Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <>
            <a
              href="/login"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
            >
              <span>Sign In to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/register"
              className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-sm transition-all"
            >
              <span>Create Organization</span>
            </a>
          </>
        )}
      </div>

      {/* Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">AI / ML Microservice</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Python FastAPI microservice delivering real-time task duration estimates and 10,000-run Monte Carlo project completion forecasting.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Project Management</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Interactive Kanban board, story-point allocation, and team velocity tracking with automatic status transition workflows.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Cybersecurity & IDOR Defense</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Strict tenant-scoping middleware, defense-in-depth repository safety net, JWT token validation, and audited SuperAdmin access.
          </p>
        </div>
      </div>
    </main>
  );
}
