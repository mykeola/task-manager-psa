'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { LogIn, Loader2, AlertCircle, Sparkles, Shield, User, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white text-base mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            OT
          </div>
          <h2 className="text-xl font-bold text-white">Sign In to OmniTask AI</h2>
          <p className="text-xs text-zinc-400 mt-1">Multi-Tenant Management & ML Prediction Engine</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-center space-x-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@acme.com"
              required
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>Sign In</span>
          </button>
        </form>

        {/* Quick Demo Credentials Switcher */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 text-center">
            Demo Credentials (Seeded Tenants)
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoAccount('superadmin@psa.io', 'AdminPassword123!')}
              className="p-2 bg-zinc-950 hover:bg-zinc-800/80 border border-rose-900/40 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-[11px]">
                <Shield className="w-3 h-3" />
                <span>SuperAdmin</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Platform Wide</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('alice@acme.com', 'Password123!')}
              className="p-2 bg-zinc-950 hover:bg-zinc-800/80 border border-indigo-900/40 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-[11px]">
                <Building2 className="w-3 h-3" />
                <span>Acme Admin</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Org A Admin</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('charlie@acme.com', 'Password123!')}
              className="p-2 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center space-x-1.5 text-zinc-300 font-bold text-[11px]">
                <User className="w-3 h-3 text-zinc-400" />
                <span>Acme Member</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Org A Member</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('tony@stark.com', 'Password123!')}
              className="p-2 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[11px]">
                <Building2 className="w-3 h-3 text-amber-400" />
                <span>Stark Admin</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Org B (Isolated)</p>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Need a new organization?{' '}
          <a href="/register" className="text-indigo-400 font-semibold hover:underline">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
