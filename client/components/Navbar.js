'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/authContext';
import { RoleBadge } from './Badge';
import {
  Building2,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Plus,
  Check,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';

export function Navbar() {
  const { user, logout, isSuperAdmin, switchOrganization, createOrganization } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [switching, setSwitching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const currentOrgId = user.organization?._id || user.organization?.id || (typeof user.organization === 'string' ? user.organization : null);
  const memberships = user.memberships || [];

  const handleSwitch = async (orgId) => {
    if (orgId === currentOrgId) {
      setDropdownOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await switchOrganization(orgId);
    } catch (err) {
      console.error('Failed to switch organization:', err.message);
    } finally {
      setSwitching(false);
      setDropdownOpen(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);
    setModalError('');
    try {
      await createOrganization(newOrgName.trim());
      setCreateModalOpen(false);
      setNewOrgName('');
    } catch (err) {
      setModalError(err.message || 'Failed to create organization.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-500/20">
              OT
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              OmniTask <span className="text-indigo-400">AI</span>
            </span>
          </div>

          {/* Interactive Workspace / Tenant Switcher */}
          <div className="hidden sm:flex items-center space-x-2 pl-4 border-l border-zinc-800 relative" ref={dropdownRef}>
            {isSuperAdmin && !user.organization ? (
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-950/70 text-rose-300 border border-rose-800/80">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Platform SuperAdmin Context
              </span>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  disabled={switching}
                  className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <Building2 className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                  <span className="font-semibold">{user.organization?.name || 'My Organization'}</span>
                  <span className="ml-1.5 text-[10px] text-zinc-500 font-mono">({user.role})</span>
                  {switching ? (
                    <Loader2 className="w-3 h-3 ml-2 animate-spin text-zinc-400" />
                  ) : (
                    <ChevronDown className={`w-3 h-3 ml-2 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-zinc-500 border-b border-zinc-800/80 mb-1">
                      Switch Organization / Workspace
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {memberships.map((m, idx) => {
                        const org = m.organization;
                        if (!org) return null;
                        const orgId = org.id || org._id;
                        const isActive = String(orgId) === String(currentOrgId);

                        return (
                          <button
                            key={orgId || idx}
                            type="button"
                            onClick={() => handleSwitch(orgId)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                              isActive
                                ? 'bg-indigo-950/40 text-white border border-indigo-800/40 font-semibold'
                                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <Building2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                              <div className="truncate">
                                <p className="truncate leading-none">{org.name}</p>
                                <span className="text-[10px] text-zinc-500 capitalize">{m.role}</span>
                              </div>
                            </div>
                            {isActive && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-zinc-800/80 pt-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          setCreateModalOpen(true);
                        }}
                        className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-semibold text-indigo-400 hover:bg-indigo-950/30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Organization</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 text-right">
            <div>
              <p className="text-xs font-semibold text-zinc-200">{user.name}</p>
              <p className="text-[11px] text-zinc-500 font-mono">{user.email}</p>
            </div>
            <RoleBadge role={user.role} />
          </div>

          <button
            onClick={logout}
            title="Sign out of your session"
            className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CREATE NEW ORGANIZATION MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Create New Organization</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-center space-x-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Organization / Company Name *
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Labs, Apex Engineering"
                  required
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  You will automatically become the Admin of this workspace and can invite your own team.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
