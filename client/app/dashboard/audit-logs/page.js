'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../lib/authContext';
import { ShieldAlert, Loader2, RefreshCw } from 'lucide-react';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('[AuditLogsPage] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Security & Compliance Audit Logs</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable audit trail of actions performed within your organization boundary.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Trail</span>
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs">
            No audit records currently logged for this organization.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-800 font-semibold">
                <tr>
                  <th className="px-6 py-3">Timestamp (UTC)</th>
                  <th className="px-6 py-3">Actor / User</th>
                  <th className="px-6 py-3">Action Identifier</th>
                  <th className="px-6 py-3">Target Entity</th>
                  <th className="px-6 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-3 text-zinc-400 text-[11px]">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="px-6 py-3 text-white font-sans font-medium">
                      {log.user?.name || log.user?.email || 'System'}
                      <span className="text-[10px] text-zinc-500 block font-mono font-normal">
                        {log.user?.role || 'internal'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 text-[11px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-300 text-[11px]">
                      {log.targetType} {log.targetId && `(${log.targetId.substring(0, 8)}...)`}
                    </td>
                    <td className="px-6 py-3 text-zinc-500 text-[11px]">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
