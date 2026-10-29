import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileText,
  User as UserIcon,
  X,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { incidentService } from '../../services/incidentService';
import { Incident, IncidentPenalty } from '../../types';

export const OwnerIncidentsPage: React.FC = () => {
  const { incidents, resources, users, bookings, refreshAll, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [penaltyType, setPenaltyType] = useState<IncidentPenalty>('deposit_deduction');
  const [resolutionText, setResolutionText] = useState('Deducted replacement parts cost from security deposit; warning issued.');
  const [resolutionReason, setResolutionReason] = useState('Documented component burnout due to unapproved material usage.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const filteredIncidents = incidents.filter((i) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return i.status === 'open' || i.status === 'under_review';
    if (statusFilter === 'resolved') return i.status === 'resolved' || i.status === 'dismissed';
    return true;
  });

  const handleOpenResolve = (incident: Incident) => {
    setSelectedIncident(incident);
    setPenaltyType(incident.severity === 'critical' ? 'temporary_suspension' : 'deposit_deduction');
    setResolutionModalOpen(true);
  };

  const handleConfirmResolve = async () => {
    if (!selectedIncident) return;
    const actorUser = users.find((u) => u.id === authUser?.id) || users[0];
    setIsSubmitting(true);
    try {
      await incidentService.resolveIncident(
        selectedIncident.id,
        {
          resolution: resolutionText,
          penalty: penaltyType,
          resolutionReason,
        },
        actorUser
      );
      await refreshAll();
      showToast('Incident successfully resolved and penalties applied.', 'success');
      setResolutionModalOpen(false);
      setSelectedIncident(null);
    } catch {
      showToast('Failed to resolve incident.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async (incident: Incident) => {
    if (window.confirm('Dismiss this incident without penalties or fault?')) {
      const actorUser = users.find((u) => u.id === authUser?.id) || users[0];
      try {
        await incidentService.dismissIncident(
          incident.id,
          'Dismissed after custodian inspection: Normal wear & tear within lab operating tolerance.',
          actorUser
        );
        await refreshAll();
        showToast('Incident dismissed without fault.', 'info');
      } catch {
        showToast('Failed to dismiss incident.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900 mb-2">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Dispute & Safety Incident Oversight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Incident Reports
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review equipment damage claims, late turnaround penalties, and safety protocol violations.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Reports ({incidents.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              statusFilter === 'open'
                ? 'bg-rose-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Open / Review ({incidents.filter((i) => i.status === 'open' || i.status === 'under_review').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              statusFilter === 'resolved'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Resolved ({incidents.filter((i) => i.status === 'resolved' || i.status === 'dismissed').length})
          </button>
        </div>
      </div>

      {/* Incident Cards */}
      {filteredIncidents.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No incidents found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            All equipment operates within normal safe parameters with no open violations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => {
            const res = resources.find((r) => r.id === incident.resourceId);
            const reporter = users.find((u) => u.id === incident.reporterId);
            const booking = bookings.find((b) => b.id === incident.bookingId);
            const borrower = booking ? users.find((u) => u.id === booking.userId) : null;

            const isOpen = incident.status === 'open' || incident.status === 'under_review';

            return (
              <div
                key={incident.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        incident.severity === 'critical'
                          ? 'bg-rose-600 text-white'
                          : incident.severity === 'moderate'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {incident.severity} Severity
                    </span>

                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Type: {incident.type}
                    </span>

                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {res?.title || 'Resource'}
                    </span>

                    <span className="text-xs text-slate-400">
                      • Reported {new Date(incident.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  {/* Status */}
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      isOpen
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    }`}
                  >
                    {incident.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Auto-generated AI Summary Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Generated Summary & Context</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    A {incident.severity} severity {incident.type} was reported during reservation #{incident.bookingId.slice(0, 8)}.
                    Borrower {borrower?.name || 'Student'} ({borrower?.department || borrower?.org || 'Engineering'}) was the active custodian.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    "{incident.description}"
                  </p>
                </div>

                {/* Resolution Details if already resolved */}
                {incident.resolution && (
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs space-y-1">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                      Resolution Record [Penalty: {incident.penalty}]:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">
                      {incident.resolution} — {incident.resolutionReason}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Reviewed on {incident.reviewedAt ? new Date(incident.reviewedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                )}

                {/* Open Actions */}
                {isOpen && (
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDismiss(incident)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Dismiss (No Fault)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenResolve(incident)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
                    >
                      Resolve & Issue Penalty
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Incident Modal */}
      {resolutionModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Resolve Dispute & Select Penalty</span>
              </h3>
              <button
                type="button"
                onClick={() => setResolutionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Penalty Policy
              </label>
              <select
                value={penaltyType}
                onChange={(e) => setPenaltyType(e.target.value as IncidentPenalty)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="none">None (Formal Written Warning Only)</option>
                <option value="warning">Strike Added to Fair-Use Record</option>
                <option value="deposit_deduction">Deduct Repair Cost from Escrow Deposit</option>
                <option value="temporary_suspension">30-Day Facility Suspension</option>
                <option value="ban">Permanent Maker Lab Revocation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Resolution Terms & Student Notification Text
              </label>
              <input
                type="text"
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Audit Log Reason
              </label>
              <textarea
                rows={2}
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResolutionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmResolve}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                {isSubmitting ? 'Applying...' : 'Enforce Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
