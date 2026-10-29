import React from 'react';
import { BookingStatus, DemandLevel, IncidentSeverity, IncidentStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' | 'emerald';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    green: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
    red: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80',
    blue: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80',
    purple: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
    gray: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border backdrop-blur-xs transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  switch (status) {
    case 'approved':
      return <Badge variant="green">Approved</Badge>;
    case 'checked_in':
      return <Badge variant="green" className="animate-pulse">Active Session</Badge>;
    case 'returned':
      return <Badge variant="gray">Completed / Returned</Badge>;
    case 'pending':
      return <Badge variant="amber">Pending Review</Badge>;
    case 'waitlisted':
      return <Badge variant="purple">Waitlisted</Badge>;
    case 'cancelled':
      return <Badge variant="gray">Cancelled</Badge>;
    case 'overdue':
      return <Badge variant="red" className="animate-pulse">Overdue</Badge>;
    case 'disputed':
      return <Badge variant="red">Disputed / Under Review</Badge>;
    case 'rejected':
      return <Badge variant="red">Rejected</Badge>;
    default:
      return <Badge variant="gray">{status}</Badge>;
  }
};

export const DemandBadge: React.FC<{ demand: DemandLevel; compact?: boolean }> = ({ demand, compact }) => {
  switch (demand) {
    case 'high':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/90 text-white shadow-xs backdrop-blur-md border border-rose-400/40">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span>{compact ? 'High Demand' : 'High Demand (Capped)'}</span>
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-white shadow-xs backdrop-blur-md border border-amber-300/40">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>Moderate Demand</span>
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600/90 text-white shadow-xs backdrop-blur-md border border-emerald-400/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
          <span>{compact ? 'Available' : 'Available / Low Demand'}</span>
        </span>
      );
    default:
      return null;
  }
};

export const IncidentSeverityBadge: React.FC<{ severity: IncidentSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'critical':
      return <Badge variant="red">Critical</Badge>;
    case 'high':
      return <Badge variant="red">High</Badge>;
    case 'medium':
      return <Badge variant="amber">Medium</Badge>;
    case 'low':
      return <Badge variant="blue">Low</Badge>;
    default:
      return null;
  }
};

export const IncidentStatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  switch (status) {
    case 'open':
      return <Badge variant="red">Open</Badge>;
    case 'under_review':
      return <Badge variant="amber">Under Review</Badge>;
    case 'resolved':
      return <Badge variant="green">Resolved</Badge>;
    case 'dismissed':
      return <Badge variant="gray">Dismissed</Badge>;
    default:
      return null;
  }
};
