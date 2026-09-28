'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import {
  FolderKanban,
  Users,
  ShieldAlert,
  ServerCog,
  BarChart3,
  HelpCircle
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, isSuperAdmin, isAdmin } = useAuth();

  const links = [
    {
      name: 'Projects & Tasks',
      href: '/dashboard',
      icon: FolderKanban,
      match: (p) => p === '/dashboard' || p.startsWith('/dashboard/projects')
    },
    {
      name: 'Team & Members',
      href: '/dashboard/teams',
      icon: Users,
      match: (p) => p.startsWith('/dashboard/teams')
    }
  ];

  if (isAdmin || isSuperAdmin) {
    links.push({
      name: 'Audit & Compliance',
      href: '/dashboard/audit-logs',
      icon: ShieldAlert,
      match: (p) => p.startsWith('/dashboard/audit-logs')
    });
  }

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div className="px-3 py-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Workspace Scope
          </p>
        </div>

        <nav className="space-y-1">
          {links.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>

        {/* SuperAdmin Platform Management Section */}
        {isSuperAdmin && (
          <div className="pt-4 border-t border-zinc-800/80">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-rose-400/90 mb-2">
              Platform Administration
            </p>
            <a
              href="/dashboard/admin"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                pathname.startsWith('/dashboard/admin')
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
                  : 'text-zinc-400 hover:text-rose-300 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <ServerCog className="w-4 h-4 text-rose-400" />
              <span>Tenants & Governance</span>
            </a>
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>ML Scheduling Active</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Effort estimation powered by Desharnais trained ML microservice.
        </p>
      </div>
    </aside>
  );
}
