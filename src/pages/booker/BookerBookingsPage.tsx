import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  RotateCcw,
  AlertOctagon,
  XCircle,
  Plus,
  ArrowRight,
  MapPin,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { bookingService } from '../../services/bookingService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Timeline } from '../../components/shared/Timeline';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { ReviewModal } from '../../components/common/ReviewModal';
import { Booking, BookingStatus } from '../../types';

export const BookerBookingsPage: React.FC = () => {
  const { bookings, resources, currentUser, refreshAll, showToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'upcoming' | 'pending' | 'waitlisted' | 'active' | 'past' | 'cancelled'
  >('upcoming');

  const [selectedBookingForHistory, setSelectedBookingForHistory] = useState<Booking | null>(null);
  const [cancelDialogBooking, setCancelDialogBooking] = useState<Booking | null>(null);
  const [extensionModalBooking, setExtensionModalBooking] = useState<Booking | null>(null);
  const [reviewModalBooking, setReviewModalBooking] = useState<{ id: string; title: string } | null>(null);
  const [extensionMinutes, setExtensionMinutes] = useState(60);
  const [extensionReason, setExtensionReason] = useState('');

  // Filter bookings for current user
  const myBookings = bookings.filter((b) => b.userId === currentUser?.id);

  const tabBookings = myBookings.filter((b) => {
    switch (activeTab) {
      case 'upcoming':
        return b.status === 'approved';
      case 'pending':
        return b.status === 'pending';
      case 'waitlisted':
        return b.status === 'waitlisted';
      case 'active':
        return b.status === 'checked_in' || b.status === 'overdue';
      case 'past':
        return b.status === 'returned';
      case 'cancelled':
        return b.status === 'cancelled' || b.status === 'rejected';
      default:
        return true;
    }
  });

  const handleCancelBooking = async () => {
    if (!cancelDialogBooking || !currentUser) return;
    try {
      await bookingService.cancelBooking(cancelDialogBooking.id, currentUser, 'User cancelled reservation from bookings manager');
      await refreshAll();
      showToast('Booking successfully cancelled.', 'info');
      setCancelDialogBooking(null);
    } catch {
      showToast('Failed to cancel booking.', 'error');
    }
  };

  const handleRequestExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionModalBooking || !currentUser) return;
    try {
      await bookingService.requestExtension(extensionModalBooking.id, extensionMinutes, extensionReason, currentUser);
      await refreshAll();
      showToast('Extension request submitted to custodian.', 'success');
      setExtensionModalBooking(null);
      setExtensionReason('');
    } catch {
      showToast('Could not submit extension request.', 'error');
    }
  };

  const tabs: { id: typeof activeTab; label: string; count: number }[] = [
    { id: 'upcoming', label: 'Upcoming', count: myBookings.filter((b) => b.status === 'approved').length },
    { id: 'pending', label: 'Pending', count: myBookings.filter((b) => b.status === 'pending').length },
    { id: 'waitlisted', label: 'Waitlisted', count: myBookings.filter((b) => b.status === 'waitlisted').length },
    { id: 'active', label: 'Active Sessions', count: myBookings.filter((b) => b.status === 'checked_in' || b.status === 'overdue').length },
    { id: 'past', label: 'Past / Completed', count: myBookings.filter((b) => b.status === 'returned').length },
    { id: 'cancelled', label: 'Cancelled / Rejected', count: myBookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            My Reservations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track upcoming time slots, submit pre-use checklists, request extensions, or cancel bookings.
          </p>
        </div>
        <Link
          to="/app/discover"
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 inline-flex items-center gap-1.5 self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Reservation</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex items-center gap-2 pb-3 px-1 text-xs font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === tab.id
                  ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {tabBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-2">
          <CalendarCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-xs">No {activeTab} reservations found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tabBookings.map((b) => {
            const res = resources.find((r) => r.id === b.resourceId);

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {res?.title || 'Lab Equipment'}
                    </h3>
                    <StatusBadge status={b.status} size="sm" />
                    {(b as any).paymentStatus && (b as any).paymentStatus !== 'none' && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          (b as any).paymentStatus === 'held'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : (b as any).paymentStatus === 'released'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        Escrow: {(b as any).paymentStatus}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {b.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Scheduled Slot:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                      {new Date(b.start).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })} •{' '}
                      {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Purpose:</span>
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-1">
                      {b.purpose}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Custodian Reason / Notes:</span>
                    <p className="text-slate-700 dark:text-slate-300 italic line-clamp-1">
                      {b.decisionReason || 'Standard booking rules apply.'}
                    </p>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForHistory(b)}
                    className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                  >
                    View Status Timeline &amp; History
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Check-in CTA */}
                    {b.status === 'approved' && (
                      <Link
                        to={`/app/checkin-return?bookingId=${b.id}&mode=checkin`}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-xs"
                      >
                        Start Check-in
                      </Link>
                    )}

                    {/* Return CTA */}
                    {(b.status === 'checked_in' || b.status === 'overdue') && (
                      <>
                        <button
                          type="button"
                          onClick={() => setExtensionModalBooking(b)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Request Extension
                        </button>
                        <Link
                          to={`/app/checkin-return?bookingId=${b.id}&mode=return`}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-xs"
                        >
                          Return Equipment
                        </Link>
                      </>
                    )}

                    {/* Review CTA */}
                    {b.status === 'returned' && (
                      <button
                        type="button"
                        onClick={() => setReviewModalBooking({ id: b.id, title: res?.title || 'Resource' })}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs flex items-center gap-1"
                      >
                        <span>★</span> Leave Review
                      </button>
                    )}

                    {/* Report Issue CTA */}
                    <Link
                      to={`/app/incidents?bookingId=${b.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:text-rose-600"
                    >
                      Report Issue
                    </Link>

                    {/* Cancel CTA */}
                    {(b.status === 'approved' || b.status === 'pending' || b.status === 'waitlisted') && (
                      <button
                        type="button"
                        onClick={() => setCancelDialogBooking(b)}
                        className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline Modal */}
      {selectedBookingForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Booking Timeline
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBookingForHistory(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <Timeline booking={selectedBookingForHistory} />
          </div>
        </div>
      )}

      {/* Extension Modal */}
      {extensionModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <form
            onSubmit={handleRequestExtension}
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Request Booking Extension
            </h3>
            <p className="text-xs text-slate-500">
              Extensions depend on subsequent slot reservations and manager approval.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Additional Duration</label>
              <select
                value={extensionMinutes}
                onChange={(e) => setExtensionMinutes(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value={30}>+30 Minutes</option>
                <option value={60}>+1 Hour</option>
                <option value={120}>+2 Hours</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Reason for Extension</label>
              <input
                type="text"
                required
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="e.g. Slower print speed, extra calibration cycle..."
                className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExtensionModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
              >
                Submit Extension
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!cancelDialogBooking}
        title="Cancel Reservation?"
        description="Cancelling this booking will immediately release your slot and automatically promote the next student on the waitlist."
        confirmText="Yes, Cancel Booking"
        variant="danger"
        onConfirm={handleCancelBooking}
        onClose={() => setCancelDialogBooking(null)}
      />

      {/* Verified Review Dialog */}
      {reviewModalBooking && (
        <ReviewModal
          isOpen={true}
          onClose={() => setReviewModalBooking(null)}
          bookingId={reviewModalBooking.id}
          resourceTitle={reviewModalBooking.title}
          onSuccess={() => {
            showToast('Review and rating submitted successfully!', 'success');
            refreshAll();
          }}
        />
      )}
    </div>
  );
};
