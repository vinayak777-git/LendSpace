import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  RotateCcw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Booking } from '../../types';

interface TimelineStep {
  title: string;
  timestamp?: string;
  description?: string;
  status: 'complete' | 'current' | 'upcoming' | 'rejected' | 'disputed';
  actor?: string;
}

interface TimelineProps {
  booking: Booking;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ booking, className = '' }) => {
  // Build dynamic steps from booking state
  const steps: TimelineStep[] = [
    {
      title: 'Booking Requested',
      timestamp: booking.createdAt,
      description: `Purpose: ${booking.purpose}`,
      status: 'complete',
    },
  ];

  if (booking.status === 'rejected') {
    steps.push({
      title: 'Request Declined',
      timestamp: booking.updatedAt,
      description: booking.decisionReason || 'Declined by lab custodian',
      status: 'rejected',
    });
  } else if (booking.status === 'waitlisted') {
    steps.push({
      title: 'Added to Priority Waitlist',
      timestamp: booking.updatedAt,
      description: `Position #${booking.waitlistPosition || 1} • Priority score: ${booking.priorityScore || 85}`,
      status: 'current',
    });
  } else {
    // Approved or further
    steps.push({
      title: 'Request Approved',
      timestamp: booking.status === 'pending' ? undefined : booking.updatedAt,
      description: booking.decisionReason || (booking.status === 'pending' ? 'Awaiting custodian review' : 'Slot reserved'),
      status:
        booking.status === 'pending'
          ? 'current'
          : 'complete',
    });

    if (booking.status !== 'pending' && booking.status !== 'cancelled') {
      steps.push({
        title: 'Check-in & Pre-use Inspection',
        timestamp: booking.checkInReport?.submittedAt,
        description: booking.checkInReport
          ? `Condition rated ${booking.checkInReport.rating}/5 with ${booking.checkInReport.photos.length} photo(s)`
          : 'Complete checklist before taking custody',
        status:
          booking.status === 'checked_in'
            ? 'current'
            : booking.checkInReport
            ? 'complete'
            : 'upcoming',
      });

      steps.push({
        title: 'Return & Condition Verification',
        timestamp: booking.returnReport?.submittedAt,
        description: booking.returnReport
          ? `Returned on time • Manager confirmed condition`
          : booking.status === 'overdue'
          ? 'Return window is overdue!'
          : 'Return by end of booking window',
        status:
          booking.status === 'returned'
            ? 'complete'
            : booking.status === 'overdue'
            ? 'disputed'
            : booking.status === 'checked_in'
            ? 'upcoming'
            : 'upcoming',
      });
    }
  }

  if (booking.status === 'cancelled') {
    steps.push({
      title: 'Booking Cancelled',
      timestamp: booking.cancelledAt || booking.updatedAt,
      description: booking.cancellationReason || 'Cancelled by requester',
      status: 'rejected',
    });
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {steps.map((step, idx) => {
          let dotColor = 'bg-slate-300 dark:bg-slate-700 text-slate-500';
          if (step.status === 'complete') {
            dotColor = 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30';
          } else if (step.status === 'current') {
            dotColor = 'bg-teal-500 text-white ring-4 ring-teal-500/20 animate-pulse';
          } else if (step.status === 'rejected' || step.status === 'disputed') {
            dotColor = 'bg-rose-500 text-white shadow-xs';
          }

          return (
            <div key={idx} className="relative flex items-start gap-3">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${dotColor}`}
              >
                {step.status === 'complete' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {step.status === 'current' && <Clock className="w-3.5 h-3.5" />}
                {step.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                {step.status === 'disputed' && <AlertTriangle className="w-3.5 h-3.5" />}
                {step.status === 'upcoming' && <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h4>
                  {step.timestamp && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(step.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
