import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  RotateCcw,
  CheckCircle2,
  Camera,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowLeft,
  FileCheck,
  AlertOctagon,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { bookingService } from '../../services/bookingService';
import { ConditionChecklist } from '../../components/shared/ConditionChecklist';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ChecklistResponse } from '../../types';

export const BookerCheckInReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { bookings, resources, currentUser, refreshAll, showToast } = useAppStore();

  const bookingIdParam = searchParams.get('bookingId');
  const modeParam = searchParams.get('mode') === 'return' ? 'return' : 'checkin';

  // Find target booking
  const booking =
    bookings.find((b) => b.id === bookingIdParam) ||
    bookings.find((b) => (modeParam === 'return' ? b.status === 'checked_in' || b.status === 'overdue' : b.status === 'approved'));

  const resource = booking ? resources.find((r) => r.id === booking.resourceId) : null;
  const checklistItems = resource?.checklistItems || [
    'Machine body clean and unobstructed',
    'Power cabling intact and safely routed',
    'Safety interlock and emergency stop verified',
    'No tool bit or lens damage observed',
  ];

  const [activeMode, setActiveMode] = useState<'checkin' | 'return'>(modeParam);

  const handleCheckInSubmit = async (data: {
    checklist: ChecklistResponse[];
    notes: string;
    photos: string[];
    rating: number;
  }) => {
    if (!booking || !currentUser) return;
    try {
      await bookingService.checkInBooking(
        booking.id,
        {
          checklist: data.checklist,
          notes: data.notes,
          photos: data.photos,
          rating: data.rating,
        },
        currentUser
      );
      await refreshAll();
      showToast('Pre-use check-in submitted! Equipment session is now active.', 'success');
      navigate('/app/bookings');
    } catch {
      showToast('Check-in failed.', 'error');
    }
  };

  const handleReturnSubmit = async (data: {
    checklist: ChecklistResponse[];
    notes: string;
    photos: string[];
    rating: number;
  }) => {
    if (!booking || !currentUser) return;
    try {
      await bookingService.returnBooking(
        booking.id,
        {
          checklist: data.checklist,
          notes: data.notes,
          photos: data.photos,
          rating: data.rating,
        },
        currentUser
      );
      await refreshAll();
      showToast('Return verification submitted! Deposit hold will be released.', 'success');
      navigate('/app/bookings');
    } catch {
      showToast('Return submission failed.', 'error');
    }
  };

  if (!booking || !resource) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
        <RotateCcw className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
          No active or approved reservation found for check-in/return
        </h3>
        <p className="text-xs">
          Please select a booking from your reservations list to begin condition verification.
        </p>
        <Link to="/app/bookings" className="text-xs text-teal-600 font-bold underline inline-block">
          Go to My Bookings
        </Link>
      </div>
    );
  }

  const isOverdue = booking.status === 'overdue' || new Date(booking.end).getTime() < Date.now();

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            to="/app/bookings"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Reservations</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {activeMode === 'checkin' ? 'Pre-Use Check-in Inspection' : 'Return & Condition Verification'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For <strong className="text-slate-800 dark:text-slate-200">{resource.title}</strong> • Booking #{booking.id}
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 self-start">
          <button
            type="button"
            onClick={() => setActiveMode('checkin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeMode === 'checkin'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Check-In
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('return')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeMode === 'return'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Return
          </button>
        </div>
      </div>

      {/* Overdue Warning Callout */}
      {isOverdue && activeMode === 'return' && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3 shadow-xs">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs space-y-0.5">
            <strong className="font-bold text-sm block">Reservation Window Overdue!</strong>
            <p>
              This equipment was scheduled to be returned by{' '}
              <strong>{new Date(booking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.
              Please complete return verification immediately to restore access privileges.
            </p>
          </div>
        </div>
      )}

      {/* BEFORE vs AFTER Comparison on Return Mode */}
      {activeMode === 'return' && booking.checkInReport && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <Sparkles className="w-4 h-4" />
            <span>Before vs. After Condition Comparison</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare initial checkout inspection photos and checklist with current return state:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before (Check-in) Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  BEFORE (Check-in)
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(booking.checkInReport.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                &ldquo;{booking.checkInReport.notes || 'All components in pristine order'}&rdquo;
              </p>
              {booking.checkInReport.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {booking.checkInReport.photos.map((p, idx) => (
                    <img key={idx} src={p} alt="" className="w-full h-24 object-cover rounded-xl border" />
                  ))}
                </div>
              ) : (
                <div className="h-24 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
                  No check-in photo recorded
                </div>
              )}
            </div>

            {/* After (Current Return) Card */}
            <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800 dark:text-teal-200">
                  AFTER (Current Return)
                </span>
                <span className="text-[10px] text-teal-600 font-semibold">
                  Today • Just now
                </span>
              </div>
              <p className="text-xs text-teal-800 dark:text-teal-300">
                Please verify below that all checklist items are cleaned and accounted for.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <ConditionChecklist
          phase={activeMode === 'checkin' ? 'before' : 'after'}
          items={checklistItems}
          initialReport={activeMode === 'return' ? booking.returnReport : booking.checkInReport}
          onSubmit={activeMode === 'checkin' ? handleCheckInSubmit : handleReturnSubmit}
        />
      </div>
    </div>
  );
};
