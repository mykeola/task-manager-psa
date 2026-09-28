'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../lib/authContext';
import {
  ServerCog,
  Building2,
  Users,
  FolderKanban,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Search
} from 'lucide-react';

export default function SuperAdminPage() {
  const { isSuperAdmin } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [platformLogs, setPlatformLogs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgProjects, setOrgProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPlatformData = async () => {
    try {
      setLoading(true);
      const [orgsRes, logsRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/audit-logs')
      ]);

      if (orgsRes.data?.success) setOrgs(orgsRes.data.data);
      if (logsRes.data?.success) setPlatformLogs(logsRes.data.data);
    } catch (err) {
      console.error('[SuperAdmin] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isSuperAdmin) {
      fetchPlatformData();
    }
    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin]);

  // Handle organization suspension / activation
  const handleToggleStatus = async (orgId, currentStatus) => {
    setUpdatingId(orgId);
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.patch(`/organizations/${orgId}/status`, { status: newStatus });
      if (res.data?.success) {
        setOrgs((prev) =>
          prev.map((o) => (o._id === orgId ? { ...o, status: newStatus } : o))
        );
        // Refresh audit logs to display the newly logged admin action
        const logsRes = await api.get('/audit-logs');
        if (logsRes.data?.success) setPlatformLogs(logsRes.data.data);
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Privileged Cross-Tenant Drill-Down
  // Triggers the audited SuperAdmin endpoint (written to AuditLog)
  const handleDrillDown = async (org) => {
    setSelectedOrg(org);
    setLoadingDrilldown(true);
    try {
      // Passes organizationId query parameter; tenantScope middleware intercepts & logs audit event
      const res = await api.get(`/projects?organizationId=${org._id}`);
      if (res.data?.success) {
        setOrgProjects(res.data.data);
      }
      // Re-fetch audit logs to show the recorded SUPERADMIN_TENANT_DRILLDOWN event!
      const logsRes = await api.get('/audit-logs');
      if (logsRes.data?.success) setPlatformLogs(logsRes.data.data);
    } catch (err) {
      console.error('[DrillDown Error]', err.message);
    } finally {
      setLoadingDrilldown(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-red-950/30 border border-red-800 rounded-2xl text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-red-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Platform Access Prohibited</h2>
        <p className="text-xs text-red-300">
          SuperAdmin role verification failed. This incident will be logged.
        </p>
      </div>
    );
  }

  const filteredOrgs = orgs.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Platform Header */}
      <div className="bg-gradient-to-r from-rose-950/50 via-zinc-900 to-zinc-900 border border-rose-900/50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Root Administration</span>
          </div>
          <h1 className="text-2xl font-black text-white">Multi-Tenant Fleet Governance</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            SuperAdmin platform view. All tenant queries and cross-tenant drill-downs are cryptographically audit-logged.
          </p>
        </div>
        <button
          onClick={fetchPlatformData}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* Fleet KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Tenants</p>
          <p className="text-3xl font-black text-white mt-1">{orgs.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Active multi-tenant containers</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Suspended Tenants</p>
          <p className="text-3xl font-black text-amber-400 mt-1">
            {orgs.filter((o) => o.status === 'suspended').length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Blocked from API & UI access</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Platform Audit Records</p>
          <p className="text-3xl font-black text-rose-400 mt-1">{platformLogs.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Central security compliance trail</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Organizations Fleet ({filteredOrgs.length})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-800 font-semibold">
                <tr>
                  <th className="px-6 py-3">Organization Name</th>
                  <th className="px-6 py-3">Slug Identifier</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Members</th>
                  <th className="px-6 py-3">Projects</th>
                  <th className="px-6 py-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {filteredOrgs.map((org) => (
                  <tr key={org._id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-white flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-zinc-500" />
                      <span>{org.name}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-zinc-400">{org.slug}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          org.status === 'active'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                            : 'bg-red-950/70 text-red-300 border-red-800'
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-zinc-200">{org.userCount || 0}</td>
                    <td className="px-6 py-3.5 font-semibold text-zinc-200">{org.projectCount || 0}</td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleDrillDown(org)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Data</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(org._id, org.status)}
                        disabled={updatingId === org._id}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          org.status === 'active'
                            ? 'bg-red-950/60 text-red-300 hover:bg-red-900 border border-red-800/80'
                            : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/80'
                        }`}
                      >
                        {updatingId === org._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                        ) : org.status === 'active' ? (
                          'Suspend'
                        ) : (
                          'Activate'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drilldown Inspection Panel */}
      {selectedOrg && (
        <div className="bg-zinc-900 border-2 border-indigo-900/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Audited Cross-Tenant Drilldown
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Data Inspection: {selectedOrg.name} ({selectedOrg.slug})
              </h3>
            </div>
            <button
              onClick={() => setSelectedOrg(null)}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1 bg-zinc-800 rounded-lg"
            >
              Close View
            </button>
          </div>

          <p className="text-xs text-zinc-400">
            Notice: Accessing this tenant's workspace generated a <code className="text-rose-400">SUPERADMIN_TENANT_DRILLDOWN</code> audit event in the platform compliance trail.
          </p>

          {loadingDrilldown ? (
            <div className="h-24 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : orgProjects.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-4">No projects registered under this tenant.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {orgProjects.map((p) => (
                <div key={p._id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                  <div className="flex items-center justify-between font-bold text-white mb-1">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{p.status}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] line-clamp-1">{p.description || 'No description'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Platform-Wide Audit Trail */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Platform-Wide Governance & Cross-Tenant Audit Stream</span>
          </h3>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950 text-zinc-500 border-b border-zinc-800 sticky top-0">
              <tr>
                <th className="px-6 py-2.5">Time (UTC)</th>
                <th className="px-6 py-2.5">Actor</th>
                <th className="px-6 py-2.5">Action</th>
                <th className="px-6 py-2.5">Target</th>
                <th className="px-6 py-2.5">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-[11px] text-zinc-400">
              {platformLogs.slice(0, 30).map((log) => (
                <tr key={log._id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-2">
                    {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                  </td>
                  <td className="px-6 py-2 text-white font-sans">{log.user?.email || 'Unknown'}</td>
                  <td className="px-6 py-2 text-indigo-300 font-bold">{log.action}</td>
                  <td className="px-6 py-2 text-zinc-400">
                    {log.targetType} ({log.targetId || 'Platform'})
                  </td>
                  <td className="px-6 py-2 text-zinc-500">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
