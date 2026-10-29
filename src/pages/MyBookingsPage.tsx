import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { bookingService } from '../services/bookingService';
import { incidentService } from '../services/incidentService';
import { StatusBadge } from '../components/common/Badge';
import { CheckInModal } from '../components/inspection/CheckInModal';
import { ReturnModal } from '../components/inspection/ReturnModal';
import { Booking, IncidentSeverity, IncidentType, Resource } from '../types';
import {
  CalendarCheck,
  Clock,
  Sparkles,
  AlertTriangle,
  PlayCircle,
  RotateCcw,
  Ban,
  PlusCircle,
  HelpCircle,
  MapPin,
  CheckCircle2,
  FileText,
  ChevronRight,
  X,
  History,
  AlertOctagon,
} from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const { bookings, resources, currentUser, refreshAll, showToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'upcoming' | 'pending' | 'waitlisted' | 'active' | 'past' | 'cancelled'
  >('upcoming');

  // Modal states
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<Booking | null>(null);
  const [selectedBookingForReturn, setSelectedBookingForReturn] = useState<Booking | null>(null);
  const [selectedBookingForExtension, setSelectedBookingForExtension] = useState<Booking | null>(null);
  const [selectedBookingForIncident, setSelectedBookingForIncident] = useState<Booking | null>(null);

  // Extension form
  const [extensionMinutes, setExtensionMinutes] = useState<number>(30);
  const [extensionReason, setExtensionReason] = useState<string>('Need additional time to complete print job cleanly.');

  // Incident form
  const [incidentType, setIncidentType] = useState<IncidentType>('damage');
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity>('medium');
  const [incidentDesc, setIncidentDesc] = useState<string>('');
  const [isSubmittingIncident, setIsSubmittingIncident] = useState<boolean>(false);

  // Filter bookings for current user
  const userBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter((b) => b.userId === currentUser.id);
  }, [bookings, currentUser]);

  // Tab filtering
  const filteredBookings = useMemo(() => {
    return userBookings.filter((b) => {
      if (activeTab === 'upcoming') return b.status === 'approved';
      if (activeTab === 'pending') return b.status === 'pending';
      if (activeTab === 'waitlisted') return b.status === 'waitlisted';
      if (activeTab === 'active') return b.status === 'checked_in' || b.status === 'overdue' || b.status === 'disputed';
      if (activeTab === 'past') return b.status === 'returned';
      if (activeTab === 'cancelled') return b.status === 'cancelled' || b.status === 'rejected';
      return true;
    });
  }, [userBookings, activeTab]);

  const counts = useMemo(() => {
    return {
      upcoming: userBookings.filter((b) => b.status === 'approved').length,
      pending: userBookings.filter((b) => b.status === 'pending').length,
      waitlisted: userBookings.filter((b) => b.status === 'waitlisted').length,
      active: userBookings.filter(
        (b) => b.status === 'checked_in' || b.status === 'overdue' || b.status === 'disputed'
      ).length,
      past: userBookings.filter((b) => b.status === 'returned').length,
      cancelled: userBookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length,
    };
  }, [userBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to cancel this reservation? If any users are on the waitlist, the top candidate will be automatically promoted.')) {
      return;
    }

    try {
      const res = await bookingService.cancelBooking(
        bookingId,
        currentUser,
        'User voluntarily cancelled reservation slot.'
      );
      if (res.promotedBooking) {
        showToast(
          `Booking cancelled. Auto-promotion engine automatically confirmed reservation for waitlisted student!`,
          'success'
        );
      } else {
        showToast('Reservation cancelled.', 'info');
      }
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel', 'error');
    }
  };

  const handleRequestExtension = async () => {
    if (!selectedBookingForExtension || !currentUser) return;
    try {
      await bookingService.requestExtension(
        selectedBookingForExtension.id,
        extensionMinutes,
        extensionReason,
        currentUser
      );
      showToast(`+${extensionMinutes} min extension requested for review.`, 'success');
      setSelectedBookingForExtension(null);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to request extension', 'error');
    }
  };

  const handleReportIncident = async () => {
    if (!selectedBookingForIncident || !currentUser) return;
    if (!incidentDesc.trim()) {
      showToast('Please provide a description of the issue or damage.', 'warning');
      return;
    }
    setIsSubmittingIncident(true);
    try {
      await incidentService.createIncident(
        {
          bookingId: selectedBookingForIncident.id,
          resourceId: selectedBookingForIncident.resourceId,
          type: incidentType,
          severity: incidentSeverity,
          description: incidentDesc,
        },
        currentUser
      );
      showToast('Incident reported. Lab management has been notified.', 'success');
      setSelectedBookingForIncident(null);
      setIncidentDesc('');
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit incident report', 'error');
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Personal Reservations Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Makerspace Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your active sessions, upcoming reservations, waitlist rankings, and before/after inspection records.
          </p>
        </div>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Find & Reserve More Equipment</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px mb-8 scrollbar-none">
        {(
          [
            { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
            { id: 'active', label: 'Active Sessions', count: counts.active },
            { id: 'pending', label: 'Pending Review', count: counts.pending },
            { id: 'waitlisted', label: 'Waitlist', count: counts.waitlisted },
            { id: 'past', label: 'Past & Returned', count: counts.past },
            { id: 'cancelled', label: 'Cancelled / Rejected', count: counts.cancelled },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>{t.label}</span>
            {t.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === t.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-md mx-auto">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            No {activeTab} bookings
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            You currently have no equipment reservations in this tab.
          </p>
          <Link
            to="/discover"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            Browse Available Equipment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const resource = resources.find((r) => r.id === b.resourceId);
            const startD = new Date(b.start);
            const endD = new Date(b.end);

            return (
              <div
                key={b.id}
                className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status={b.status} />
                    <span className="text-xs font-bold text-slate-400">#{b.id.substring(0, 8)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Reserved {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                      <Link to={`/resource/${b.resourceId}`}>{resource?.title || 'Resource'}</Link>
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <strong>
                          {startD.toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </strong>{' '}
                        • {startD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {resource?.location}
                      </span>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-2xl">
                    <span className="font-semibold text-slate-800">Purpose: </span>
                    <span>{b.purpose}</span>
                    {b.academicProject && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Academic Project
                      </span>
                    )}
                  </div>

                  {/* Decision Reason or Status explanation */}
                  {b.decisionReason && (
                    <div className="text-xs text-slate-500 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Status Rationale:</strong> {b.decisionReason}
                      </span>
                    </div>
                  )}

                  {/* Waitlist Breakdown Panel if waitlisted */}
                  {b.status === 'waitlisted' && b.scoreBreakdown && (
                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-purple-600" />
                          Why are you ranked #{b.waitlistPosition || 1}? Priority Score: {b.priorityScore} pts
                        </span>
                        <span className="text-[11px] text-purple-700">Auto-promotes on cancellation</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-white border border-purple-200">
                          <span className="text-slate-500 block">Purpose Need:</span>
                          <span className="font-bold text-slate-800">+{b.scoreBreakdown.purposeWeight} pts</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-purple-200">
                          <span className="text-slate-500 block">Academic Link:</span>
                          <span className="font-bold text-slate-800">+{b.scoreBreakdown.academicLinkScore} pts</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-purple-200">
                          <span className="text-slate-500 block">Low Prior Hours:</span>
                          <span className="font-bold text-slate-800">+{b.scoreBreakdown.recentHoursScore} pts</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-purple-200">
                          <span className="text-slate-500 block">Late Penalty:</span>
                          <span className="font-bold text-rose-700">-{b.scoreBreakdown.latePenalty} pts</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Lifecycle Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                  {/* Action: Check In */}
                  {b.status === 'approved' && (
                    <button
                      onClick={() => setSelectedBookingForCheckIn(b)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Start Check-In Inspection</span>
                    </button>
                  )}

                  {/* Action: Return */}
                  {(b.status === 'checked_in' || b.status === 'overdue' || b.status === 'disputed') && (
                    <button
                      onClick={() => setSelectedBookingForReturn(b)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-md"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Perform Return & Checkout</span>
                    </button>
                  )}

                  {/* Action: Request Extension */}
                  {(b.status === 'checked_in' || b.status === 'approved') && (
                    <button
                      onClick={() => setSelectedBookingForExtension(b)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Request Extension</span>
                    </button>
                  )}

                  {/* Action: Report Issue */}
                  {b.status !== 'cancelled' && b.status !== 'rejected' && (
                    <button
                      onClick={() => setSelectedBookingForIncident(b)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Report Damage / Issue</span>
                    </button>
                  )}

                  {/* Action: Cancel */}
                  {(b.status === 'approved' || b.status === 'pending' || b.status === 'waitlisted') && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel Booking</span>
                    </button>
                  )}

                  {/* View Audit Trail Link */}
                  <Link
                    to={`/audit?targetId=${b.id}`}
                    className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-800 transition-colors pt-1"
                  >
                    <History className="w-3 h-3" />
                    <span>View Booking Audit History</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Check In Modal */}
      {selectedBookingForCheckIn && (
        <CheckInModal
          booking={selectedBookingForCheckIn}
          resource={resources.find((r) => r.id === selectedBookingForCheckIn.resourceId)!}
          isOpen={!!selectedBookingForCheckIn}
          onClose={() => setSelectedBookingForCheckIn(null)}
          onSuccess={() => refreshAll()}
        />
      )}

      {/* Return Modal */}
      {selectedBookingForReturn && (
        <ReturnModal
          booking={selectedBookingForReturn}
          resource={resources.find((r) => r.id === selectedBookingForReturn.resourceId)!}
          isOpen={!!selectedBookingForReturn}
          onClose={() => setSelectedBookingForReturn(null)}
          onSuccess={() => refreshAll()}
        />
      )}

      {/* Extension Modal */}
      {selectedBookingForExtension && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Request Session Extension</h3>
              <button
                onClick={() => setSelectedBookingForExtension(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Additional Duration
                </label>
                <select
                  value={extensionMinutes}
                  onChange={(e) => setExtensionMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={15}>+15 Minutes</option>
                  <option value={30}>+30 Minutes</option>
                  <option value={60}>+60 Minutes (1 Hour)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Reason for Extension
                </label>
                <textarea
                  rows={3}
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explain why extra time is needed..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedBookingForExtension(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestExtension}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
              >
                Submit Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Reporting Modal */}
      {selectedBookingForIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertOctagon className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Report Incident or Damage</h3>
              </div>
              <button
                onClick={() => setSelectedBookingForIncident(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Incident Type
                  </label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="damage">Equipment Damage</option>
                    <option value="delay">Session Delay / Blockage</option>
                    <option value="safety">Safety Hazard</option>
                    <option value="dispute">Equipment Dispute</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Severity Level
                  </label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="low">Low (Cosmetic/Minor)</option>
                    <option value="medium">Medium (Requires Servicing)</option>
                    <option value="high">High (Broken / Out of Order)</option>
                    <option value="critical">Critical (Safety Hazard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Description of Incident
                </label>
                <textarea
                  rows={4}
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Describe what occurred, any strange noises, broken parts, or safety alerts..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedBookingForIncident(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReportIncident}
                disabled={isSubmittingIncident}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                {isSubmittingIncident ? 'Filing Incident...' : 'Submit Incident Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
