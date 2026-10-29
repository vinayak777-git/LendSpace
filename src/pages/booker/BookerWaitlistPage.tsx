import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ListOrdered,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { bookingService } from '../../services/bookingService';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { StatusBadge } from '../../components/shared/StatusBadge';

export const BookerWaitlistPage: React.FC = () => {
  const { bookings, resources, currentUser, refreshAll, showToast } = useAppStore();

  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // Find waitlisted bookings for current user
  const waitlistedBookings = bookings.filter(
    (b) => b.userId === currentUser?.id && b.status === 'waitlisted'
  );

  const handleCancelWaitlist = async () => {
    if (!cancelTargetId) return;
    try {
      if (currentUser) {
        await bookingService.cancelBooking(cancelTargetId, currentUser, 'User left priority waitlist');
        await refreshAll();
        showToast('Removed from waitlist. Next student has been promoted.', 'info');
      }
      setCancelTargetId(null);
    } catch {
      showToast('Failed to cancel waitlist entry.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Active Waitlist Positions
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Transparent queue rankings with objective fairness scoring and automated promotion.
        </p>
      </div>

      {waitlistedBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
          <ListOrdered className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
            You are not on any equipment waitlists
          </h3>
          <p className="text-xs max-w-sm mx-auto">
            When you request a slot that is currently reserved, you will automatically be entered into our priority queue.
          </p>
          <Link
            to="/app/discover"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 underline"
          >
            <span>Browse popular equipment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {waitlistedBookings.map((b) => {
            const res = resources.find((r) => r.id === b.resourceId);
            const breakdown = b.scoreBreakdown || {
              purposeWeight: 35,
              recentHoursScore: 22,
              academicLinkScore: 15,
              waitingTimeScore: 12,
              latePenalty: 0,
              total: b.priorityScore || 84,
            };

            return (
              <div
                key={b.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6"
              >
                {/* Top Row: Resource & Queue Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center font-extrabold text-lg shadow-xs">
                      #{b.waitlistPosition || 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {res?.title || 'Resource'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Requested slot: {new Date(b.start).toLocaleDateString([], { month: 'short', day: 'numeric' })} from{' '}
                        {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status="waitlisted" />
                    <button
                      type="button"
                      onClick={() => setCancelTargetId(b.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                    >
                      Leave Waitlist
                    </button>
                  </div>
                </div>

                {/* Score & "Why this rank?" Card */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      <Sparkles className="w-4 h-4" />
                      <span>Why This Rank? Priority Score Breakdown</span>
                    </div>
                    <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 rounded-full">
                      Total Score: {breakdown.total}/100
                    </span>
                  </div>

                  {/* 4 Score Pillars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Purpose Weight</span>
                      <strong className="text-slate-900 dark:text-white text-sm">+{breakdown.purposeWeight} pts</strong>
                      <span className="text-[10px] text-slate-500 block">High-impact project</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Low Weekly Usage</span>
                      <strong className="text-slate-900 dark:text-white text-sm">+{breakdown.recentHoursScore} pts</strong>
                      <span className="text-[10px] text-slate-500 block">Only 4.5h used this week</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Academic Course</span>
                      <strong className="text-slate-900 dark:text-white text-sm">+{breakdown.academicLinkScore} pts</strong>
                      <span className="text-[10px] text-slate-500 block">Accredited Capstone</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Waiting Time</span>
                      <strong className="text-slate-900 dark:text-white text-sm">+{breakdown.waitingTimeScore} pts</strong>
                      <span className="text-[10px] text-slate-500 block">Queued yesterday</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 pt-1">
                    <Info className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Automated Promotion Rule:</strong> If the primary reservation is cancelled or finishes early, position #1 is instantly promoted, approved, and notified via notification bell and email.
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Leave Waitlist Dialog */}
      <ConfirmDialog
        isOpen={!!cancelTargetId}
        title="Leave Waitlist?"
        description="Leaving this waitlist will forfeit your queue position #1 and auto-promote subsequent students."
        confirmText="Yes, Leave Queue"
        variant="warning"
        onConfirm={handleCancelWaitlist}
        onClose={() => setCancelTargetId(null)}
      />
    </div>
  );
};
