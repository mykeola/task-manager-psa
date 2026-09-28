'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { UserPlus, Loader2, AlertCircle, Building2, Users } from 'lucide-react';

export default function RegisterPage() {
  const [mode, setMode] = useState('create'); // 'create' or 'join'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    organizationSlug: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      };

      if (mode === 'create') {
        if (!formData.organizationName.trim()) {
          setError('Organization name is required.');
          setSubmitting(false);
          return;
        }
        payload.organizationName = formData.organizationName;
      } else {
        if (!formData.organizationSlug.trim()) {
          setError('Organization slug or identifier is required.');
          setSubmitting(false);
          return;
        }
        payload.organizationSlug = formData.organizationSlug;
      }

      await register(payload);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">Create OmniTask Account</h2>
          <p className="text-xs text-zinc-400 mt-1">Onboard your organization with ML scheduling</p>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
              mode === 'create'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>New Organization</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`py-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
              mode === 'join'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Join Existing Org</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-center space-x-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' ? (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                New Organization Name *
              </label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="e.g. Wayne Enterprises"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                You will be automatically designated as this organization's Admin.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Organization Slug / Identifier *
              </label>
              <input
                type="text"
                name="organizationSlug"
                value={formData.organizationSlug}
                onChange={handleChange}
                placeholder="e.g. acme-corp"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Ask your organization admin for their unique identifier slug.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Bruce Wayne"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="bruce@wayne.com"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>{mode === 'create' ? 'Create Organization & Sign Up' : 'Join Organization'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-400 font-semibold hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
