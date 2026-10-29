import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { bookingService } from '../services/bookingService';
import { checkEligibility } from '../lib/eligibility';
import { checkConflicts } from '../lib/conflicts';
import { calculatePriorityScore } from '../lib/fairness';
import { StatusBadge } from '../components/common/Badge';
import { Booking, Resource, User } from '../types';
import {
  ClipboardList,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Columns,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  Calendar,
  User as UserIcon,
  X,
} from 'lucide-react';

export const ManagerReviewQueuePage: React.FC = () => {
  const { bookings, resources, users, currentUser, refreshAll, showToast } = useAppStore();

  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'waitlist'>('approve');
  const [reviewReason, setReviewReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Competing requests comparison state
  const [competingSlotKey, setCompetingSlotKey] = useState<string | null>(null);

  // Filter only pending requests (excluding demo seed bookings)
  const pendingBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status === 'pending' &&
        !b.id.startsWith('book-10') &&
        !['user-aarav', 'user-maya'].includes(b.userId)
    );
  }, [bookings]);

  // Group pending bookings by resource & start time to detect competing requests
  const competingGroups = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    bookings
      .filter(
        (b) =>
          (b.status === 'pending' || b.status === 'waitlisted' || b.status === 'approved') &&
          !b.id.startsWith('book-10') &&
          !['user-aarav', 'user-maya'].includes(b.userId)
      )
      .forEach((b) => {
        const key = `${b.resourceId}_${b.start.substring(0, 13)}`; // match same resource & hour
        if (!groups[key]) groups[key] = [];
        groups[key].push(b);
      });

    // Only return groups with >= 2 requests
    const filtered: Record<string, Booking[]> = {};
    Object.entries(groups).forEach(([k, list]) => {
      if (list.length >= 2) filtered[k] = list;
    });
    return filtered;
  }, [bookings]);

  // Quick reason templates
  const reasonTemplates = {
    approve: [
      'Verified prerequisites and approved technician supervision coverage.',
      'Priority academic capstone reservation approved for lab slot.',
      'Prerequisites active; technician will be on duty during operation.',
    ],
    reject: [
      'Slot reserved for scheduled maintenance and optical recalibration.',
      'Missing required faculty advisor sign-off for bio-safety level 1 protocol.',
      'Equipment exceeds maximum single-session duration limit for non-thesis projects.',
    ],
    waitlist: [
      'Slot oversubscribed by higher-priority senior capstone project.',
      'Placed on priority queue; auto-promotes upon any schedule shift.',
      'Queued behind earlier academic reservation; priority score preserved.',
    ],
  };

  const handleOpenReview = (b: Booking, action: 'approve' | 'reject' | 'waitlist') => {
    setSelectedBookingForReview(b);
    setReviewAction(action);
    setReviewReason(reasonTemplates[action][0]);
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview || !currentUser) return;
    setIsSubmitting(true);
    try {
      if (reviewAction === 'approve') {
        await bookingService.approveBooking(
          selectedBookingForReview.id,
          currentUser,
          reviewReason
        );
        showToast('Request approved and notification sent to student.', 'success');
      } else if (reviewAction === 'reject') {
        await bookingService.rejectBooking(
          selectedBookingForReview.id,
          currentUser,
          reviewReason
        );
        showToast('Request rejected with reason.', 'info');
      } else {
        await bookingService.waitlistBooking(
          selectedBookingForReview.id,
          currentUser,
          reviewReason
        );
        showToast('Request placed on waitlist.', 'info');
      }
      setSelectedBookingForReview(null);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Supervision & Triage
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manager Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Evaluate pending reservations, compare competing slot claims, and verify prerequisite compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            {pendingBookings.length} Requests Awaiting Review
          </span>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 shadow-md text-xs flex items-start gap-3 mb-8">
        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white text-sm block">
            Algorithmic Recommendation Engine (Advisory Only)
          </span>
          <p className="text-slate-400 leading-relaxed">
            The AI suggestions generated below are calculated pure-function heuristics evaluating prerequisite badges, weekly cap allowances, and academic weights. <strong>All final decisions rest strictly with human staff and lab technicians.</strong>
          </p>
        </div>
      </div>

      {/* Competing Requests Alert if any */}
      {Object.keys(competingGroups).length > 0 && (
        <div className="mb-8 p-6 rounded-3xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Columns className="w-5 h-5 text-amber-600" />
              <span>Competing Slot Claim Detected ({Object.keys(competingGroups).length} conflicts)</span>
            </div>
            <span className="text-xs text-amber-800 font-medium">
              Multiple students requesting the same equipment window
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(competingGroups).map(([key, groupList]) => {
              const res = resources.find((r) => r.id === groupList[0].resourceId);
              const isComparing = competingSlotKey === key;

              return (
                <div
                  key={key}
                  className="rounded-2xl bg-white border border-amber-200 p-4 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{res?.title}</span>
                      <span className="text-slate-500 ml-2">
                        {new Date(groupList[0].start).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(groupList[0].end).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => setCompetingSlotKey(isComparing ? null : key)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors"
                    >
                      {isComparing ? 'Close Side-by-Side Comparison' : 'Compare Requesters Side-by-Side'}
                    </button>
                  </div>

                  {/* Side-by-Side Competing Table */}
                  {isComparing && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                      {groupList.map((cb) => {
                        const requester = users.find((u) => u.id === cb.userId);
                        const scoreData = calculatePriorityScore(
                          requester!,
                          cb.purpose,
                          cb.academicProject,
                          0
                        );

                        return (
                          <div
                            key={cb.id}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                                  <img src={requester?.avatar} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800 block">{cb.userName || requester?.name || 'Applicant'}</span>
                                  <span className="text-[11px] text-slate-500">{cb.userOrg || requester?.org || 'Academic Department'}</span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                {scoreData.score} pts
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                              "{cb.purpose}"
                            </p>

                            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500">
                              <div>Purpose: +{scoreData.breakdown.purposeWeight} pts</div>
                              <div>Academic: +{scoreData.breakdown.academicLinkScore} pts</div>
                              <div>Prior Hours: +{scoreData.breakdown.recentHoursScore} pts</div>
                              <div>Late Returns: -{scoreData.breakdown.latePenalty} pts</div>
                            </div>

                            <div className="pt-2 flex gap-2">
                              <button
                                onClick={() => handleOpenReview(cb, 'approve')}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                              >
                                Approve This
                              </button>
                              <button
                                onClick={() => handleOpenReview(cb, 'waitlist')}
                                className="flex-1 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300"
                              >
                                Waitlist
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Table of Pending Bookings */}
      {pendingBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-md mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Queue is Clear!</h3>
          <p className="text-xs text-slate-500">
            All submitted makerspace equipment reservations have been reviewed and decided.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-4 px-6">Requester</th>
                  <th className="py-4 px-6">Equipment</th>
                  <th className="py-4 px-6">Time Slot</th>
                  <th className="py-4 px-6">Prerequisites</th>
                  <th className="py-4 px-6">Score & AI Suggestion</th>
                  <th className="py-4 px-6 text-right">Human Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingBookings.map((b) => {
                  const requester = users.find((u) => u.id === b.userId);
                  const resource = resources.find((r) => r.id === b.resourceId);
                  const eligibility = resource && requester ? checkEligibility(requester, resource) : null;
                  const conflicts = resource ? checkConflicts(resource, b.start, b.end, bookings, b.id) : null;
                  const priority = requester
                    ? calculatePriorityScore(requester, b.purpose, b.academicProject, 0)
                    : null;

                  // Rule-based AI suggestion
                  const aiRecommendation = conflicts?.hasConflict
                    ? 'Waitlist (Slot Conflict)'
                    : !eligibility?.isEligible
                    ? 'Reject (Prerequisites Unmet)'
                    : (priority?.score || 0) >= 70
                    ? 'Recommend Approve (High Priority)'
                    : 'Discretionary Review';

                  const aiVariant =
                    aiRecommendation.includes('Approve')
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : aiRecommendation.includes('Waitlist')
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Requester Profile */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0">
                            <img src={requester?.avatar} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{b.userName || requester?.name || 'Applicant'}</span>
                            <span className="text-[11px] text-slate-500">{b.userOrg || requester?.org || 'Academic Department'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Equipment */}
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        <div>{resource?.title}</div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {resource?.location}
                        </div>
                      </td>

                      {/* Time Slot */}
                      <td className="py-4 px-6 text-slate-600">
                        <div className="font-medium text-slate-900">
                          {new Date(b.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Prerequisites Status */}
                      <td className="py-4 px-6">
                        {eligibility?.isEligible ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Pending Prereq</span>
                          </span>
                        )}
                      </td>

                      {/* Score & AI Suggestion */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 block">
                            Priority: {priority?.score || 75} pts
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${aiVariant}`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{aiRecommendation}</span>
                          </span>
                        </div>
                      </td>

                      {/* Decision Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReview(b, 'approve')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReview(b, 'waitlist')}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                          >
                            Waitlist
                          </button>
                          <button
                            onClick={() => handleOpenReview(b, 'reject')}
                            className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 font-semibold text-xs hover:bg-rose-50"
                          >
                            Reject
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

      {/* Decision Rationale Modal */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Mandatory Decision Rationale
                </span>
                <h3 className="font-extrabold text-slate-900 text-base capitalize">
                  {reviewAction} Reservation #{selectedBookingForReview.id.substring(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBookingForReview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-500">
                To maintain transparency, your written justification will be recorded in the audit log and displayed to the student.
              </p>

              {/* Quick-pick templates */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Quick-Pick Template
                </label>
                <div className="space-y-1.5">
                  {reasonTemplates[reviewAction].map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReviewReason(tmpl)}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs transition-colors"
                    >
                      "{tmpl}"
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Final Decision Rationale (Editable)
                </label>
                <textarea
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedBookingForReview(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold shadow-md capitalize ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : reviewAction === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isSubmitting ? 'Recording...' : `Confirm ${reviewAction}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
