import React from 'react';
import { BookingStatus, DemandLevel } from '../../types';

interface StatusBadgeProps {
  status?: BookingStatus | 'live' | 'paused' | 'draft' | 'pending_verification' | string;
  demand?: DemandLevel;
  type?: 'booking' | 'resource' | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  demand,
  className = '',
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (demand) {
    switch (demand) {
      case 'high':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 ${sizeClass} ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>High Demand (Capped)</span>
          </span>
        );
      case 'medium':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 ${sizeClass} ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Moderate Demand</span>
          </span>
        );
      case 'low':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 ${sizeClass} ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Available / Low Demand</span>
          </span>
        );
    }
  }

  switch (status) {
    case 'approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Approved</span>
        </span>
      );
    case 'checked_in':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span>Active Session</span>
        </span>
      );
    case 'returned':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Completed / Returned</span>
        </span>
      );
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Pending Review</span>
        </span>
      );
    case 'waitlisted':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span>Waitlisted</span>
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${sizeClass} ${className}`}
        >
          <span>Cancelled</span>
        </span>
      );
    case 'overdue':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          <span>Overdue</span>
        </span>
      );
    case 'disputed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${sizeClass} ${className}`}
        >
          <span>Disputed</span>
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${sizeClass} ${className}`}
        >
          <span>Rejected</span>
        </span>
      );
    case 'live':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Live / Bookable</span>
        </span>
      );
    case 'paused':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Paused</span>
        </span>
      );
    case 'pending_verification':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 ${sizeClass} ${className}`}
        >
          <span>Pending Verification</span>
        </span>
      );
    case 'draft':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${sizeClass} ${className}`}
        >
          <span>Draft</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${sizeClass} ${className}`}
        >
          <span>{status || 'Unknown'}</span>
        </span>
      );
  }
};
