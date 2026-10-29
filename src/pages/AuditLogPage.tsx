import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { AuditEvent } from '../types';
import {
  History,
  Download,
  Filter,
  Search,
  Sparkles,
  User as UserIcon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { auditEvents } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTargetId = searchParams.get('targetId') || '';
  const [targetIdFilter, setTargetIdFilter] = useState(initialTargetId);
  const [actorFilter, setActorFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique actors and actions for filter dropdowns
  const actors = useMemo(() => {
    const map = new Map<string, string>();
    auditEvents.forEach((e) => map.set(e.actorId, e.actorName));
    return Array.from(map.entries());
  }, [auditEvents]);

  const actions = useMemo(() => {
    return Array.from(new Set(auditEvents.map((e) => e.action)));
  }, [auditEvents]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return auditEvents.filter((e) => {
      if (targetIdFilter && e.targetId !== targetIdFilter) return false;
      if (actorFilter !== 'all' && e.actorId !== actorFilter) return false;
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          e.action.toLowerCase().includes(q) ||
          e.reason.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q) ||
          e.targetId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [auditEvents, targetIdFilter, actorFilter, actionFilter, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Target Type', 'Target ID', 'Reason'];
    const rows = filteredEvents.map((e) => [
      `"${e.timestamp}"`,
      `"${e.actorName}"`,
      `"${e.actorRole}"`,
      `"${e.action}"`,
      `"${e.targetType}"`,
      `"${e.targetId}"`,
      `"${e.reason.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lendspace_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            System Governance & Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Activity History & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable, timestamped record of every reservation decision, check-in inspection, return verification, and policy enforcement event.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Target ID filter banner if present */}
      {targetIdFilter && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>
              Filtering audit history specifically for entity ID: <strong>{targetIdFilter}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setTargetIdFilter('');
              setSearchParams({});
            }}
            className="flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950"
          >
            <X className="w-4 h-4" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* Filter controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm mb-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {/* Search bar */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, reason keywords, or user..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actor filter */}
          <div>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Actors</option>
              {actors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Action filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Action Types</option>
              {actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No audit records matched your filter criteria.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const dateStr = new Date(evt.timestamp).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'medium',
              });

              return (
                <div key={evt.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                        {evt.actorName.charAt(0)}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span>{evt.actorName}</span>
                          <span className="capitalize text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                            {evt.actorRole}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{dateStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800">
                        {evt.action}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {evt.targetType}#{evt.targetId.substring(0, 10)}
                      </span>
                    </div>
                  </div>

                  {/* Written Justification / Reason */}
                  <div className="mt-2 text-xs text-slate-600 pl-10 space-y-1">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">Rationale: </strong>
                      {evt.reason}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
