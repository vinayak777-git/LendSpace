import React, { useState } from 'react';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Camera,
  Star,
  User as UserIcon,
  X,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { bookingService } from '../../services/bookingService';
import { incidentService } from '../../services/incidentService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Booking } from '../../types';

export const OwnerActiveUsagePage: React.FC = () => {
  const { bookings, resources, users, refreshAll, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [inspectBooking, setInspectBooking] = useState<Booking | null>(null);
  const [managerNotes, setManagerNotes] = useState('All components clean, calibrated, and safely docked in storage.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Damage reporting sub-state
  const [reportDamageModal, setReportDamageModal] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageSeverity, setDamageSeverity] = useState<'minor' | 'moderate' | 'critical'>('minor');

  const now = new Date().getTime();

  const isSuperAdmin = (authUser?.role as string) === 'admin';
  const ownerResources = isSuperAdmin
    ? resources
    : resources.filter((r) => r.ownerId === authUser?.id || r.managerIds?.includes(authUser?.id || ''));
  const ownerResourceIds = new Set(ownerResources.map((r) => r.id));

  // Active checkouts (checked_in) or returned (awaiting manager signoff) - real owner resources only
  const activeUsageBookings = bookings.filter((b) => {
    if (!isSuperAdmin && !ownerResourceIds.has(b.resourceId)) return false;
    if (
      b.id.startsWith('book-10') ||
      b.userId === 'user-aarav' ||
      b.userId === 'user-maya' ||
      b.userId === 'user-meera' ||
      b.userName === 'Aarav Patel' ||
      b.userName === 'Maya Sen'
    ) {
      return false;
    }
    return b.status === 'checked_in' || b.status === 'returned';
  });

  const handleConfirmReturn = async (isClean: boolean) => {
    if (!inspectBooking) return;
    const actorUser = users.find((u) => u.id === authUser?.id) || users[0];
    setIsSubmitting(true);
    try {
      await bookingService.confirmReturn(
        inspectBooking.id,
        actorUser,
        isClean,
        managerNotes
      );
      await refreshAll();
      showToast(
        isClean ? 'Return verified as clean and closed.' : 'Minor issue logged with manager notes.',
        'success'
      );
      setInspectBooking(null);
    } catch {
      showToast('Failed to confirm return.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportDamage = async () => {
    if (!inspectBooking) return;
    if (!damageDescription.trim()) {
      showToast('Please provide a description of the damage.', 'error');
      return;
    }

    const actorUser = users.find((u) => u.id === authUser?.id) || users[0];
    setIsSubmitting(true);
    try {
      await incidentService.createIncident(
        {
          bookingId: inspectBooking.id,
          resourceId: inspectBooking.resourceId,
          type: 'damage',
          severity: damageSeverity,
          description: damageDescription,
          photos: inspectBooking.returnReport?.photos || [],
        },
        actorUser
      );
      await refreshAll();
      showToast('Incident created and reservation marked as disputed.', 'warning');
      setReportDamageModal(false);
      setInspectBooking(null);
      setDamageDescription('');
    } catch {
      showToast('Failed to file incident report.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 mb-2">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Physical Handover & Equipment Custody</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Active Usage & Return Inspection
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Monitor currently borrowed equipment, detect overdue sessions, and verify return condition checklists.
        </p>
      </div>

      {/* Main List */}
      {activeUsageBookings.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Active Checkouts
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            All equipment is presently docked in storage or awaiting upcoming reservations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeUsageBookings.map((b) => {
            const res = resources.find((r) => r.id === b.resourceId);
            const user = users.find((u) => u.id === b.userId);
            const isOverdue = b.status === 'checked_in' && new Date(b.end).getTime() < now;

            return (
              <div
                key={b.id}
                className={`rounded-2xl bg-white dark:bg-slate-900 border p-5 space-y-4 shadow-xs flex flex-col justify-between ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <StatusBadge status={b.status} type="booking" />
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase animate-pulse">
                        Overdue Return
                      </span>
                    )}
                  </div>

                  {/* Title & User */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {res?.title || 'Resource'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Borrower: <span className="font-semibold text-slate-800 dark:text-slate-200">{b.userName || user?.name || 'Borrower'}</span> ({b.userOrg || user?.department || user?.org || 'Dept'})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Contact: {b.userPhone || user?.phone || b.userEmail || user?.email || 'N/A'}
                    </p>
                  </div>

                  {/* Scheduled Times */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Due Back:</span>
                      <span className={`font-bold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheduled Date:</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {new Date(b.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Check-in info summary */}
                  {b.checkInReport && (
                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Check-In Safety Rating:</span>{' '}
                      {b.checkInReport.rating}/5 stars •{' '}
                      {b.checkInReport.checklist.filter((c) => c.passed).length}/{b.checkInReport.checklist.length} items verified
                    </div>
                  )}
                </div>

                {/* Inspect / Confirm Return Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setInspectBooking(b);
                      setManagerNotes('All components clean, calibrated, and safely docked in storage.');
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                      b.status === 'returned'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : isOverdue
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>
                      {b.status === 'returned' ? 'Inspect & Confirm Return' : 'Inspect Usage State'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Return Modal with BEFORE vs AFTER comparison */}
      {inspectBooking && !reportDamageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Inspection: {resources.find((r) => r.id === inspectBooking.resourceId)?.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Side-by-side comparison of Check-In (Before) vs Return (After) condition reports
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before vs After Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BEFORE */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <span>1. Check-In Baseline (Before)</span>
                  <span className="text-[10px] text-slate-400">
                    {inspectBooking.checkInReport?.submittedAt
                      ? new Date(inspectBooking.checkInReport.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Initial'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {inspectBooking.checkInReport?.checklist ? (
                    inspectBooking.checkInReport.checklist.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300">{item.item}</span>
                        <span className={item.passed ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                          {item.passed ? '✓ Pass' : '✗ Issue'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs italic">No check-in report attached</p>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Student Notes:</span>{' '}
                  {inspectBooking.checkInReport?.notes || 'Clean check-in.'}
                </div>
              </div>

              {/* AFTER */}
              <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-3">
                <div className="flex items-center justify-between font-bold text-xs text-emerald-950 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-900 pb-1.5">
                  <span>2. Return Handover (After)</span>
                  <span className="text-[10px] text-emerald-500">
                    {inspectBooking.returnReport?.submittedAt
                      ? new Date(inspectBooking.returnReport.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Pending return'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {inspectBooking.returnReport?.checklist ? (
                    inspectBooking.returnReport.checklist.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300">{item.item}</span>
                        <span className={item.passed ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                          {item.passed ? '✓ Pass' : '✗ Damaged / Missing'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs italic">
                      Borrower has not yet submitted final return checklist.
                    </p>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Return Notes:</span>{' '}
                  {inspectBooking.returnReport?.notes || 'No return notes.'}
                </div>
              </div>
            </div>

            {/* Manager Sign-off Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Custodian Verification Notes
              </label>
              <textarea
                rows={2}
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Action Buttons: Clean Return / Minor Issue / Report Damage */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReportDamageModal(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-rose-600 border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                Report Damage or File Dispute
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmReturn(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                >
                  Log Minor Issue
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmReturn(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-colors"
                >
                  ✓ Clean Return (Close Session)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Damage Modal */}
      {reportDamageModal && inspectBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" />
                <span>File Damage Dispute</span>
              </h3>
              <button
                type="button"
                onClick={() => setReportDamageModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Severity Assessment
              </label>
              <select
                value={damageSeverity}
                onChange={(e) => setDamageSeverity(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="minor">Minor (Scratches / Cosmetically flawed)</option>
                <option value="moderate">Moderate (Component replacement required)</option>
                <option value="critical">Critical (Inoperable / Safety Hazard)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Damage Description & Evidence Notes *
              </label>
              <textarea
                rows={3}
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                placeholder="Detail what broken components, cracks, or burnt circuits were observed..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReportDamageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleReportDamage}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20"
              >
                {isSubmitting ? 'Filing...' : 'Submit Damage Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
