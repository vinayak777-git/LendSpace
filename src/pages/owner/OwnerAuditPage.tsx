import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Clock,
  User as UserIcon,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const OwnerAuditPage: React.FC = () => {
  const { auditEvents } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = auditEvents.filter((event) => {
    const actorName = event.actorName || event.actor?.name || event.actorId || 'System';
    const matchesSearch =
      actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.targetId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      selectedActionFilter === 'all' ||
      (selectedActionFilter === 'booking' && event.targetType === 'booking') ||
      (selectedActionFilter === 'resource' && event.targetType === 'resource') ||
      (selectedActionFilter === 'credential' && event.targetType === 'credential') ||
      (selectedActionFilter === 'incident' && event.targetType === 'incident');

    return matchesSearch && matchesAction;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lendspace_audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('VERIFIED')) {
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300';
    }
    if (action.includes('REJECTED') || action.includes('CANCELLED') || action.includes('DISMISSED')) {
      return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300';
    }
    if (action.includes('WAITLIST')) {
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300';
    }
    return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 mb-2">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable Regulatory Compliance Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Security & Operational Audit Log
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Every booking approval, qualification check, return inspection, and incident resolution is chronologically logged.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportJSON}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export Audit Log (.JSON)</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor name, action, target ID, or logged reason..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedActionFilter}
          onChange={(e) => setSelectedActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="all">All Event Types</option>
          <option value="booking">Booking Reservations</option>
          <option value="resource">Resource Listings</option>
          <option value="credential">Safety Qualifications</option>
          <option value="incident">Incidents & Disputes</option>
        </select>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Logged Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEvents.map((event) => (
                <tr
                  key={event.id}
                  onClick={() =>
                    setExpandedEventId(expandedEventId === event.id ? null : event.id)
                  }
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {event.actorName || event.actor?.name || event.actorId}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {event.actorRole || event.actor?.role || 'staff'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${getActionBadgeColor(
                        event.action
                      )}`}
                    >
                      {event.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase text-[10px]">
                      {event.targetType}:
                    </span>{' '}
                    {event.targetId}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    <p className="line-clamp-2">{event.reason}</p>
                    {expandedEventId === event.id && event.metadata && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                        {JSON.stringify(event.metadata, null, 2)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
