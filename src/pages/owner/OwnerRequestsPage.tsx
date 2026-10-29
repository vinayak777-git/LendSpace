import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  HelpCircle,
  ArrowRightLeft,
  Calendar,
  X,
  Check,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { bookingService } from '../../services/bookingService';
import { checkEligibility } from '../../lib/eligibility';
import { checkConflicts } from '../../lib/conflicts';
import { Booking, User, Resource } from '../../types';

export const OwnerRequestsPage: React.FC = () => {
  const { bookings, resources, users, refreshAll, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | 'waitlist'>('approve');
  const [decisionReason, setDecisionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Competing requests comparison modal
  const [competingModalResource, setCompetingModalResource] = useState<Resource | null>(null);

  const isSuperAdmin = (authUser?.role as string) === 'admin';
  const ownerResources = isSuperAdmin
    ? resources
    : resources.filter((r) => r.ownerId === authUser?.id || r.managerIds?.includes(authUser?.id || ''));
  const ownerResourceIds = new Set(ownerResources.map((r) => r.id));

  // Filter pending bookings: strictly real requests for this owner's resources, zero demo bookings
  const pendingBookings = bookings.filter((b) => {
    if (b.status !== 'pending') return false;
    // Exclude mock seed bookings and demo accounts
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
    return isSuperAdmin || ownerResourceIds.has(b.resourceId);
  });

  // Quick-pick reason templates
  const reasonTemplates = {
    approve: [
      'Verified qualifications and curriculum alignment',
      'Pre-approved departmental capstone research grant',
      'Satisfies lab orientation; off-peak session approved',
      'High priority academic project deadline confirmed',
    ],
    reject: [
      'Missing prerequisite safety certification badge',
      'Conflicting high-priority scheduled maintenance',
      'Exceeds departmental fair-use weekly allotment',
      'Incomplete project proposal details',
    ],
    waitlist: [
      'Slot currently occupied by active session; queued as backup',
      'Peak demand window; standing by for open cancellation',
      'Pending technician supervision availability confirmation',
    ],
  };

  // Rule-based suggestion calculation
  const getSuggestedDecision = (booking: Booking, user?: User, resource?: Resource) => {
    if (!resource || !user) {
      return { suggestion: 'review' as const, label: 'Manual Review', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' };
    }

    const eligibility = checkEligibility(user, resource);
    const conflicts = checkConflicts(resource, booking.start, booking.end, bookings.filter((b) => b.id !== booking.id));

    if (!eligibility.isEligible) {
      return {
        suggestion: 'reject' as const,
        label: 'Suggest: Reject',
        reason: 'Missing prerequisite requirements',
        color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
      };
    }

    if (conflicts.hasConflict) {
      return {
        suggestion: 'waitlist' as const,
        label: 'Suggest: Waitlist',
        reason: 'Slot has schedule collision with another booking',
        color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      };
    }

    if ((booking.priorityScore || 0) >= 60 || booking.academicProject) {
      return {
        suggestion: 'approve' as const,
        label: 'Suggest: Approve',
        reason: 'High priority academic project & clean record',
        color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      };
    }

    return {
      suggestion: 'approve' as const,
      label: 'Suggest: Approve',
      reason: 'Eligible student with vacant slot',
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    };
  };

  const handleOpenDecision = (booking: Booking, type: 'approve' | 'reject' | 'waitlist') => {
    setSelectedBooking(booking);
    setDecisionType(type);
    setDecisionReason(reasonTemplates[type][0]);
    setDecisionModalOpen(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedBooking) return;
    if (!decisionReason.trim()) {
      showToast('A decision reason is strictly required.', 'error');
      return;
    }

    setIsSubmitting(true);
    const actor = users.find((u) => u.id === authUser?.id) || users[0];

    try {
      if (decisionType === 'approve') {
        await bookingService.approveBooking(selectedBooking.id, actor, decisionReason);
        showToast('Reservation successfully approved and student notified.', 'success');
      } else if (decisionType === 'reject') {
        await bookingService.rejectBooking(selectedBooking.id, actor, decisionReason);
        showToast('Reservation rejected. Notification dispatched with feedback reason.', 'info');
      } else {
        await bookingService.waitlistBooking(selectedBooking.id, actor, decisionReason);
        showToast('Moved request to prioritized waitlist queue.', 'info');
      }

      await refreshAll();
      setDecisionModalOpen(false);
      setSelectedBooking(null);
    } catch {
      showToast('Failed to record decision.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Competing requests logic
  const competingGroups = React.useMemo(() => {
    const groups: { [resourceId: string]: Booking[] } = {};
    pendingBookings.forEach((b) => {
      if (!groups[b.resourceId]) groups[b.resourceId] = [];
      groups[b.resourceId].push(b);
    });
    return Object.entries(groups).filter(([_, list]) => list.length > 1);
  }, [pendingBookings]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 mb-2">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Custodian Review Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reservation Requests
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review applicant qualifications, verify purpose suitability, and issue decisions with audit logs.
          </p>
        </div>

        {/* Competing Requests Alert Banner */}
        {competingGroups.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const res = resources.find((r) => r.id === competingGroups[0][0]);
              if (res) setCompetingModalResource(res);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Compare {competingGroups.length} Competing Slot(s)</span>
          </button>
        )}
      </div>

      {/* Main Queue Table */}
      {pendingBookings.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            All Caught Up!
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            There are no booking requests currently pending review in your queue.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Requester</th>
                  <th className="py-3.5 px-4">Resource & Slot</th>
                  <th className="py-3.5 px-4">Purpose</th>
                  <th className="py-3.5 px-4">Credentials</th>
                  <th className="py-3.5 px-4">Priority Score</th>
                  <th className="py-3.5 px-4">Advisory Recommendation</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingBookings.map((b) => {
                  const requester = users.find((u) => u.id === b.userId);
                  const requesterName = b.userName || requester?.name || 'Applicant';
                  const requesterOrg = b.userOrg || requester?.department || requester?.org || 'Booker';
                  const requesterEmail = b.userEmail || requester?.email || '';
                  const requesterPhone = b.userPhone || requester?.phone || '';
                  const resource = resources.find((r) => r.id === b.resourceId);
                  const suggestion = getSuggestedDecision(b, requester, resource);
                  const eligibility = requester && resource ? checkEligibility(requester, resource) : null;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Requester Profile */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {requesterName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{requesterName}</span>
                              {(b as any).userIsVerified && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {requesterOrg}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{requesterEmail}</span>
                              {requesterPhone && (
                                <>
                                  <span>•</span>
                                  <span>{requesterPhone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Resource & Time */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {resource?.title || 'Resource'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-500" />
                          <span>
                            {new Date(b.start).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Duration:{' '}
                          {(
                            (new Date(b.end).getTime() - new Date(b.start).getTime()) /
                            (1000 * 60 * 60)
                          ).toFixed(1)}{' '}
                          hours
                        </div>
                        {(b as any).paymentStatus && (b as any).paymentStatus !== 'none' && (
                          <div className="mt-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                (b as any).paymentStatus === 'held'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : (b as any).paymentStatus === 'released'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}
                            >
                              Escrow: {(b as any).paymentStatus}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Purpose */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                          {b.purpose}
                        </p>
                        {b.academicProject && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            🎓 Capstone / Research
                          </span>
                        )}
                      </td>

                      {/* Credentials */}
                      <td className="py-4 px-4">
                        {eligibility ? (
                          eligibility.isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              title={eligibility.reasons.join(' • ')}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Missing Reqs</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Priority Score */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {b.priorityScore || 50}
                          </span>
                          <span className="text-[10px] text-slate-400">/ 100</span>
                        </div>
                        {b.scoreBreakdown && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Academics: +{b.scoreBreakdown.academicLinkScore || 0} pts
                          </div>
                        )}
                      </td>

                      {/* Advisory Suggestion */}
                      <td className="py-4 px-4">
                        <div
                          className={`inline-flex flex-col px-2.5 py-1 rounded-xl border text-[11px] font-bold ${suggestion.color}`}
                        >
                          <span>{suggestion.label}</span>
                          <span className="text-[9px] font-normal opacity-80">
                            Rule-based advice only
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDecision(b, 'approve')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDecision(b, 'reject')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDecision(b, 'waitlist')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                          >
                            Waitlist
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decisionModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                Confirm Decision: {decisionType} Request
              </h3>
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Booking ID: <span className="font-mono">{selectedBooking.id}</span>
              </p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                Purpose: "{selectedBooking.purpose}"
              </p>
            </div>

            {/* Quick-Pick Templates */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Quick-Pick Reason Template
              </label>
              <div className="space-y-1.5">
                {reasonTemplates[decisionType].map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDecisionReason(tmpl)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-colors border ${
                      decisionReason === tmpl
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Formal Justification (Sent to Student & Logged to Audit) *
              </label>
              <textarea
                rows={3}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Enter the official reason for this decision..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitDecision}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                  decisionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : decisionType === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {isSubmitting ? 'Recording...' : `Confirm ${decisionType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Competing Requests Side-by-Side Modal */}
      {competingModalResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                  <span>Competing Requests Comparison: {competingModalResource.title}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Side-by-side priority score evaluation for overlapping schedule slots
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompetingModalResource(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingBookings
                .filter((b) => b.resourceId === competingModalResource.id)
                .map((b, idx) => {
                  const requester = users.find((u) => u.id === b.userId);
                  const requesterName = b.userName || requester?.name || 'Applicant';
                  const requesterOrg = b.userOrg || requester?.department || requester?.org || 'Booker';
                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border-2 border-emerald-200/80 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                            #{idx + 1}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white block">
                              {requesterName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {requesterOrg}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {b.priorityScore || 50}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                            Priority Score
                          </span>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-1.5 p-2.5 rounded-lg bg-white dark:bg-slate-800 text-xs border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Academic Project Boost:</span>
                          <span className="font-bold text-emerald-600">
                            +{b.scoreBreakdown?.academicLinkScore || (b.academicProject ? 25 : 0)} pts
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Purpose Relevance Weight:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            +{b.scoreBreakdown?.purposeWeight || 15} pts
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Fair-Use Past Usage:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {requester?.usageStats.hoursThisWeek || 0} hrs this week
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Wait Duration Rank:</span>
                          <span className="font-bold text-emerald-600">Position #{idx + 1}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                        "{b.purpose}"
                      </p>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCompetingModalResource(null);
                            handleOpenDecision(b, 'approve');
                          }}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          Award Slot (Approve)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCompetingModalResource(null);
                            handleOpenDecision(b, 'waitlist');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                        >
                          Queue to Waitlist
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
