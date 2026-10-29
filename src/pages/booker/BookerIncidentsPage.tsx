import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  Camera,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { incidentService } from '../../services/incidentService';
import { Incident, IncidentType, IncidentSeverity } from '../../types';

export const BookerIncidentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialBookingId = searchParams.get('bookingId') || '';

  const { incidents, bookings, resources, currentUser, refreshAll, showToast } = useAppStore();

  const [isReportModalOpen, setIsReportModalOpen] = useState(!!initialBookingId);
  const [selectedBookingId, setSelectedBookingId] = useState(initialBookingId);
  const [incidentType, setIncidentType] = useState<IncidentType>('damage');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User's relevant incidents
  const myBookings = bookings.filter((b) => b.userId === currentUser?.id);
  const myBookingIds = myBookings.map((b) => b.id);
  const myIncidents = incidents.filter(
    (inc) => myBookingIds.includes(inc.bookingId) || inc.reporterId === currentUser?.id
  );

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedBookingId) {
      showToast('Please select a linked reservation.', 'error');
      return;
    }
    const b = bookings.find((x) => x.id === selectedBookingId);
    if (!b) return;

    setIsSubmitting(true);
    try {
      await incidentService.createIncident(
        {
          bookingId: selectedBookingId,
          resourceId: b.resourceId,
          type: incidentType,
          severity,
          description,
        },
        currentUser
      );
      await refreshAll();
      showToast('Incident report logged. Lab management has been notified.', 'success');
      setIsReportModalOpen(false);
      setDescription('');
    } catch {
      showToast('Could not report incident.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Incident &amp; Damage Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transparent tracking for machine blockages, maintenance delays, or pre-existing damage reports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 inline-flex items-center gap-1.5 self-start"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Report Issue or Damage</span>
        </button>
      </div>

      {/* Incidents List */}
      {myIncidents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-2">
          <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            No incident reports recorded
          </h3>
          <p className="text-xs max-w-sm mx-auto">
            Your borrowing record is completely clean with zero active disputes, damage claims, or overdue penalties.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myIncidents.map((inc) => {
            const res = resources.find((r) => r.id === inc.resourceId);

            return (
              <div
                key={inc.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        inc.severity === 'critical' || inc.severity === 'high'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                        {inc.type} Report: {res?.title || 'Resource'}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        Incident #{inc.id} • Booking #{inc.bookingId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950'
                      }`}
                    >
                      {inc.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 capitalize">
                      {inc.severity} Severity
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {inc.description}
                </p>

                {/* Resolution Notice */}
                {inc.resolution && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Resolution Sign-off:</span>
                    </div>
                    <p>{inc.resolution}</p>
                    {inc.resolutionReason && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 italic">
                        Note: {inc.resolutionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <form
            onSubmit={handleReportSubmit}
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Report Issue or Incident
              </h3>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Linked Reservation</label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Select booking...</option>
                {myBookings.map((b) => {
                  const res = resources.find((r) => r.id === b.resourceId);
                  return (
                    <option key={b.id} value={b.id}>
                      {res?.title} (#{b.id})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Incident Type</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="damage">Equipment Damage</option>
                  <option value="delay">Overdue / Delay</option>
                  <option value="safety">Safety Hazard</option>
                  <option value="dispute">Usage Dispute</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Description of Occurrence</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred, any part failures, or safety issues..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Submit Incident Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
