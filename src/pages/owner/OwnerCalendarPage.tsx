import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Clock,
  User as UserIcon,
  AlertTriangle,
  X,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Booking, Resource } from '../../types';

export const OwnerCalendarPage: React.FC = () => {
  const { bookings, resources, users } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [selectedResourceId, setSelectedResourceId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 28)); // Late Oct 2026
  const [activeModalBooking, setActiveModalBooking] = useState<Booking | null>(null);

  const isSuperAdmin = (authUser?.role as string) === 'admin';
  const ownerResources = isSuperAdmin
    ? resources
    : resources.filter((r) => r.ownerId === authUser?.id || r.managerIds?.includes(authUser?.id || ''));
  const ownerResourceIds = new Set(ownerResources.map((r) => r.id));

  // Filter bookings: owner resources only and exclude demo seed data
  const filteredBookings = bookings.filter((b) => {
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
    if (selectedResourceId === 'all') return true;
    return b.resourceId === selectedResourceId;
  });

  // Calculate week days (7 days starting Monday)
  const getWeekDates = (base: Date) => {
    const startOfWeek = new Date(base);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDates(currentDate);

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  // Conflict detection for calendar
  const isConflictSlot = (booking: Booking) => {
    const start = new Date(booking.start).getTime();
    const end = new Date(booking.end).getTime();

    return filteredBookings.some((other) => {
      if (other.id === booking.id || other.resourceId !== booking.resourceId) return false;
      if (other.status === 'cancelled' || other.status === 'rejected') return false;
      const oStart = new Date(other.start).getTime();
      const oEnd = new Date(other.end).getTime();
      return (start < oEnd && end > oStart);
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Master Schedule & Resource Availability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Facility Calendar
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track reservations across labs, detect timetable overlaps, and inspect active slots.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'week'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Week View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Month View
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Date Navigation Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevPeriod}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[160px] text-center">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              day: viewMode === 'week' ? 'numeric' : undefined,
            })}
          </span>
          <button
            type="button"
            onClick={nextPeriod}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentDate(new Date(2026, 9, 28))}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100"
          >
            Today
          </button>
        </div>

        {/* Resource Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">Filter Equipment/Space:</span>
          <select
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Resources (Campus Catalog)</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Week Grid */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-center py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          {weekDays.map((d, i) => (
            <div key={i}>
              <span className="block text-[10px] text-slate-400 uppercase">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full ${
                  d.getDate() === 28
                    ? 'bg-emerald-600 text-white font-extrabold'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {d.getDate()}
              </span>
            </div>
          ))}
        </div>

        {/* Day Slots */}
        <div className="grid grid-cols-7 min-h-[500px] divide-x divide-slate-100 dark:divide-slate-800">
          {weekDays.map((dayDate, dayIdx) => {
            const dayStart = new Date(dayDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayDate);
            dayEnd.setHours(23, 59, 59, 999);

            const dayBookings = filteredBookings.filter((b) => {
              const bStart = new Date(b.start).getTime();
              return bStart >= dayStart.getTime() && bStart <= dayEnd.getTime();
            });

            return (
              <div key={dayIdx} className="p-2 space-y-2 bg-slate-50/20 dark:bg-slate-900/20">
                {dayBookings.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-700 italic">
                    Free
                  </div>
                ) : (
                  dayBookings.map((b) => {
                    const res = resources.find((r) => r.id === b.resourceId);
                    const user = users.find((u) => u.id === b.userId);
                    const hasConflict = isConflictSlot(b);

                    return (
                      <div
                        key={b.id}
                        onClick={() => setActiveModalBooking(b)}
                        className={`p-2 rounded-xl text-left cursor-pointer border transition-all hover:scale-[1.02] shadow-xs ${
                          hasConflict
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                            : b.status === 'checked_in'
                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200'
                            : b.status === 'approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {hasConflict && (
                          <div className="flex items-center gap-1 text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Conflict!</span>
                          </div>
                        )}

                        <div className="text-[10px] font-bold truncate">
                          {res?.title || 'Resource'}
                        </div>
                        <div className="text-[9px] opacity-75">
                          {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[9px] font-semibold mt-1 truncate">
                          👤 {b.userName || user?.name || 'Applicant'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Details Modal */}
      {activeModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <span>Reservation Detail</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Resource:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {resources.find((r) => r.id === activeModalBooking.resourceId)?.title}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold">Reserved By:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeModalBooking.userName || users.find((u) => u.id === activeModalBooking.userId)?.name || 'Applicant'} (
                  {activeModalBooking.userOrg || users.find((u) => u.id === activeModalBooking.userId)?.department || users.find((u) => u.id === activeModalBooking.userId)?.org || 'Dept'})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold">Scheduled Window:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(activeModalBooking.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} -{' '}
                  {new Date(activeModalBooking.end).toLocaleTimeString([], { timeStyle: 'short' })}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold">Purpose:</span>
                <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">
                  "{activeModalBooking.purpose}"
                </p>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold">Status:</span>
                <div className="mt-1">
                  <StatusBadge status={activeModalBooking.status} type="booking" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
