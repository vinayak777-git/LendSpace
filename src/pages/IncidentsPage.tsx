import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { incidentService } from '../services/incidentService';
import { Incident, IncidentPenalty, IncidentSeverity, IncidentType } from '../types';
import {
  IncidentSeverityBadge,
  IncidentStatusBadge,
} from '../components/common/Badge';
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Columns,
  Sparkles,
  X,
  Plus,
  ArrowRight,
  Info,
  Wrench,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const { incidents, bookings, resources, users, currentUser, switchUser, refreshAll, showToast } =
    useAppStore();

  const [activeTab, setActiveTab] = useState<'all' | 'damage' | 'delay' | 'resolved'>('all');

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolutionOption, setResolutionOption] = useState<IncidentPenalty>('warn');
  const [resolutionSummary, setResolutionSummary] = useState<string>(
    'Written safety counseling issued. No financial penalty applied.'
  );
  const [resolutionReason, setResolutionReason] = useState<string>(
    'First-time minor operational lapse with immediate proactive reporting.'
  );
  const [isResolving, setIsResolving] = useState(false);

  // File new incident dialog
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBookingId, setNewBookingId] = useState<string>('');
  const [newType, setNewType] = useState<IncidentType>('damage');
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('medium');
  const [newDesc, setNewDesc] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageIncidents =
    currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'faculty';

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (activeTab === 'damage') return inc.type === 'damage' && inc.status !== 'resolved';
      if (activeTab === 'delay') return inc.type === 'delay' && inc.status !== 'resolved';
      if (activeTab === 'resolved') return inc.status === 'resolved' || inc.status === 'dismissed';
      return true;
    });
  }, [incidents, activeTab]);

  const counts = useMemo(() => {
    return {
      all: incidents.length,
      damage: incidents.filter((i) => i.type === 'damage' && i.status !== 'resolved').length,
      delay: incidents.filter((i) => i.type === 'delay' && i.status !== 'resolved').length,
      resolved: incidents.filter((i) => i.status === 'resolved' || i.status === 'dismissed').length,
    };
  }, [incidents]);

  const eligibleBookingsForIncident = useMemo(() => {
    return bookings.slice(0, 8);
  }, [bookings]);

  const handleResolve = async () => {
    if (!selectedIncident || !currentUser) return;
    if (!resolutionReason.trim()) {
      showToast('Mandatory written rationale is required before finalizing penalty resolution.', 'warning');
      return;
    }

    setIsResolving(true);
    try {
      await incidentService.resolveIncident(
        selectedIncident.id,
        {
          resolution: resolutionSummary,
          penalty: resolutionOption,
          resolutionReason,
        },
        currentUser
      );
      showToast('Incident marked resolved and notification dispatched.', 'success');
      setSelectedIncident(null);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Resolution failed', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleDismiss = async () => {
    if (!selectedIncident || !currentUser) return;
    if (!resolutionReason.trim()) {
      showToast('Please state a reason for dismissing this incident report.', 'warning');
      return;
    }

    setIsResolving(true);
    try {
      await incidentService.dismissIncident(
        selectedIncident.id,
        resolutionReason,
        currentUser
      );
      showToast('Incident dismissed without fault.', 'info');
      setSelectedIncident(null);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Dismissal failed', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleCreateIncident = async () => {
    if (!currentUser) return;
    if (!newBookingId) {
      showToast('Please select an associated reservation.', 'warning');
      return;
    }
    if (!newDesc.trim()) {
      showToast('Please provide an incident description.', 'warning');
      return;
    }

    const linkedBooking = bookings.find((b) => b.id === newBookingId);
    if (!linkedBooking) return;

    setIsSubmitting(true);
    try {
      await incidentService.createIncident(
        {
          bookingId: linkedBooking.id,
          resourceId: linkedBooking.resourceId,
          type: newType,
          severity: newSeverity,
          description: newDesc,
        },
        currentUser
      );
      showToast('Incident filed successfully. Management review pending.', 'success');
      setIsCreateModalOpen(false);
      setNewDesc('');
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to file incident', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-1">
            Equipment Damage & Disciplinary Triage
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Damages & Incident Resolution
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {canManageIncidents
              ? 'Owner Portal: Review reported damages, inspect before/after checkout evidence, and resolve claims.'
              : 'Report equipment damage, session overruns, or safety hazards observed during lab sessions.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!canManageIncidents && (
            <Link
              to="/owner/incidents"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Owner Incidents Portal</span>
            </Link>
          )}

          <button
            onClick={() => {
              if (eligibleBookingsForIncident.length > 0) {
                setNewBookingId(eligibleBookingsForIncident[0].id);
              }
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Damage / Issue</span>
          </button>
        </div>
      </div>

      {/* Owner Highlight Banner */}
      {canManageIncidents && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-start gap-3 mb-6 shadow-xs animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm text-rose-900 block">
              Space Owner Action Center Active ({currentUser?.name})
            </span>
            <p className="text-rose-800 leading-relaxed">
              As a Space Owner, you have full authority to inspect damage evidence, verify condition reports, and resolve issues with formal warnings, deposit deductions, or access suspensions.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px mb-6 scrollbar-none">
        {(
          [
            { id: 'all', label: 'All Incidents', count: counts.all },
            { id: 'damage', label: '⚠️ Equipment Damages', count: counts.damage },
            { id: 'delay', label: '⏳ Overdue / Delays', count: counts.delay },
            { id: 'resolved', label: '✓ Resolved & Closed', count: counts.resolved },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'border-rose-600 text-rose-700 bg-rose-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>{t.label}</span>
            {t.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === t.id ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-md mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-base mb-1">No incidents in this view</h3>
            <p className="text-xs text-slate-500">All equipment records in this category are clear.</p>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const res = resources.find((r) => r.id === inc.resourceId);
            const reporter = users.find((u) => u.id === inc.reporterId);
            const isSelected = selectedIncident?.id === inc.id;

            return (
              <div
                key={inc.id}
                className={`rounded-3xl bg-white border transition-all p-6 shadow-sm ${
                  isSelected ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <IncidentSeverityBadge severity={inc.severity} />
                      <IncidentStatusBadge status={inc.status} />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {inc.type} Incident
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        Reported {new Date(inc.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {res?.title || 'Equipment Incident'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Reported by <strong>{reporter?.name}</strong> ({reporter?.role}) • Linked Booking #{inc.bookingId.substring(0, 8)}
                      </p>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed font-medium">
                      "{inc.description}"
                    </p>

                    {/* Resolution banner if resolved */}
                    {inc.status === 'resolved' && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Resolution: {inc.resolution}</span>
                          <span className="capitalize px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800 text-[10px] ml-1">
                            Penalty: {inc.penalty?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-emerald-800 text-[11px]">
                          <strong>Owner Written Rationale:</strong> {inc.resolutionReason}
                        </p>
                      </div>
                    )}

                    {/* Dismissed banner if dismissed */}
                    {inc.status === 'dismissed' && (
                      <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <XCircle className="w-4 h-4 text-slate-500" />
                          <span>Dismissed Without Penalty</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Review Note:</strong> {inc.resolutionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Evidence & Action Controls */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
                    {/* Photo Thumbnail if exists */}
                    {inc.photos && inc.photos.length > 0 && (
                      <div className="w-28 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        <img src={inc.photos[0]} alt="Damage Evidence" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* OWNER RESOLVE BUTTON */}
                    {canManageIncidents && (inc.status === 'open' || inc.status === 'under_review') ? (
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Resolve Damage & Penalties</span>
                      </button>
                    ) : (
                      !canManageIncidents &&
                      (inc.status === 'open' || inc.status === 'under_review') && (
                        <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-xl">
                          Under Owner Review
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Dialog for Owner */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                  Owner Damage & Incident Resolution
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Resolve Incident #{selectedIncident.id.substring(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Auto-generated summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Reported Damage Details
                </span>
                <p className="text-slate-600 leading-relaxed">
                  A <strong>{selectedIncident.severity}</strong> severity <strong>{selectedIncident.type}</strong> event was recorded on booking #{selectedIncident.bookingId}. The reporter notes: "{selectedIncident.description}".
                </p>
              </div>

              {/* Penalty Selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Actionable Resolution / Disciplinary Penalty
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'No Penalty' },
                    { id: 'warn', label: 'Formal Warning' },
                    { id: 'deduct_deposit', label: 'Deduct Deposit' },
                    { id: 'suspend_access', label: 'Suspend Access (14d)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setResolutionOption(p.id as IncidentPenalty)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                        resolutionOption === p.id
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Summary Description */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resolution Decision Summary
                </label>
                <input
                  type="text"
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mandatory Owner Written Rationale (Visible to affected user)
                </label>
                <textarea
                  rows={3}
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  placeholder="State the objective findings and rationale for this resolution..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={handleDismiss}
                disabled={isResolving}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Dismiss Without Fault
              </button>
              <button
                onClick={handleResolve}
                disabled={isResolving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md shadow-rose-600/20"
              >
                {isResolving ? 'Resolving...' : 'Confirm Resolution & Penalty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File New Incident Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">File New Incident Report</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Associated Booking / Equipment
                </label>
                <select
                  value={newBookingId}
                  onChange={(e) => setNewBookingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                >
                  {eligibleBookingsForIncident.map((b) => {
                    const r = resources.find((res) => res.id === b.resourceId);
                    return (
                      <option key={b.id} value={b.id}>
                        {r?.title} (#{b.id.substring(0, 8)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Incident Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as IncidentType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="damage">Equipment Damage</option>
                    <option value="delay">Delay / Overdue</option>
                    <option value="dispute">Dispute</option>
                    <option value="safety">Safety Hazard</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Severity
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="low">Low (Minor Wear)</option>
                    <option value="medium">Medium (Repair Needed)</option>
                    <option value="high">High (Broken / Out of Order)</option>
                    <option value="critical">Critical (Safety Danger)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Incident Description
                </label>
                <textarea
                  rows={4}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail what occurred..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIncident}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-sm"
              >
                {isSubmitting ? 'Filing...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
