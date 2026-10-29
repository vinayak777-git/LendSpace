import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CalendarCheck,
  RotateCcw,
  Clock,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileCheck,
  Layers,
  Bell,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ResourceImage } from '../../components/common/ResourceImage';

export const BookerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser: authUser } = useAuthStore();
  const { currentUser: appUser, bookings, resources, notifications } = useAppStore();

  const user = authUser || appUser;
  const userName = user?.name || 'Booker';
  const userOrg = user?.department || (authUser?.institution) || 'Academic Member';

  // Find user bookings
  const myBookings = bookings.filter((b) => b.userId === user?.id);

  // Active checked in booking
  const activeBooking = myBookings.find((b) => b.status === 'checked_in');
  const activeResource = activeBooking
    ? resources.find((r) => r.id === activeBooking.resourceId)
    : null;

  // Next upcoming booking
  const upcomingBooking = myBookings.find((b) => b.status === 'approved');
  const upcomingResource = upcomingBooking
    ? resources.find((r) => r.id === upcomingBooking.resourceId)
    : null;

  const pendingCount = myBookings.filter((b) => b.status === 'pending').length;
  const waitlistCount = myBookings.filter((b) => b.status === 'waitlisted').length;

  // Fair use stats
  const hoursUsedThisWeek = 4.5;
  const weeklyCap = 16.0;
  const fairUsePercent = Math.min(Math.round((hoursUsedThisWeek / weeklyCap) * 100), 100);

  // Credentials summary
  const verifiedCreds = 2;
  const pendingCreds = 1;
  const expiringCreds = 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Makerspace Resource Booker</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Welcome back, {userName}!
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            Enrolled in <strong className="text-white">{userOrg}</strong>. You have {pendingCount} pending request(s) and {fairUsePercent}% of your weekly booking allowance remaining. Direct booking active — no badges or approvals required.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link
              to="/app/discover"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse Catalog</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/app/bookings"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              My Bookings ({myBookings.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Active Session Callout (if active booking exists) */}
      {activeBooking && activeResource && (
        <div className="rounded-2xl border-2 border-teal-500/40 bg-teal-500/5 dark:bg-teal-950/20 p-5 sm:p-6 shadow-lg shadow-teal-500/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/30">
                <RotateCcw className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Active Session in Progress
                  </span>
                  <StatusBadge status="checked_in" size="sm" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeResource.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Location: <strong className="text-slate-700 dark:text-slate-300">{activeResource.location}</strong> • Purpose: {activeBooking.purpose}
                </p>
              </div>
            </div>

            <Link
              to={`/app/checkin-return?bookingId=${activeBooking.id}&mode=return`}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return Equipment Now</span>
            </Link>
          </div>
        </div>
      )}

      {/* KPI & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Fair-use meter */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Weekly Fair-Use</span>
            <Sliders className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {hoursUsedThisWeek}h
            </span>
            <span className="text-xs text-slate-400">/ {weeklyCap}h cap</span>
          </div>
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${fairUsePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>{fairUsePercent}% used</span>
              <span className="text-teal-600 dark:text-teal-400 font-semibold">Healthy quota</span>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Pending Reviews</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {pendingCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pendingCount > 0 ? 'Awaiting owner review' : 'No queued requests'}
          </p>
        </div>

        {/* Waitlists */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Waitlist Spots</span>
            <CalendarCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {waitlistCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {waitlistCount > 0 ? 'Priority rank #1 active' : 'Not on any waitlists'}
          </p>
        </div>

        {/* Requirements & Direct Access Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">My Requirements</span>
            <Sliders className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              Direct Access
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {authUser?.primaryNeeds?.slice(0, 2).join(', ') || '3D Printers, Laser Cutters'}
          </p>
          <Link
            to="/app/requirements"
            className="inline-block text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline pt-0.5"
          >
            Manage Requirements &rarr;
          </Link>
        </div>
      </div>

      {/* Upcoming Booking & Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Upcoming Booking Card */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <CalendarCheck className="w-4 h-4 text-teal-500" />
              <span>Next Upcoming Reservation</span>
            </div>
            {upcomingBooking && <StatusBadge status={upcomingBooking.status} size="sm" />}
          </div>

          {upcomingBooking && upcomingResource ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                  <ResourceImage
                    src={upcomingResource.images && upcomingResource.images[0]}
                    alt={upcomingResource.title}
                    category={upcomingResource.category}
                    type={upcomingResource.type}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {upcomingResource.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Location: {upcomingResource.location}
                  </p>
                  <p className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold">
                    Scheduled: {new Date(upcomingBooking.start).toLocaleDateString([], { month: 'short', day: 'numeric' })} from{' '}
                    {new Date(upcomingBooking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(upcomingBooking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <strong>Booking Purpose:</strong> {upcomingBooking.purpose}
              </div>

              <div className="flex gap-2 pt-1">
                <Link
                  to={`/app/checkin-return?bookingId=${upcomingBooking.id}&mode=checkin`}
                  className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold text-center transition-colors shadow-xs"
                >
                  Start Pre-Use Check-in
                </Link>
                <Link
                  to={`/app/bookings`}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-center transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <CalendarCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs">No upcoming reservations scheduled.</p>
              <Link
                to="/app/discover"
                className="inline-block text-xs font-semibold text-teal-600 dark:text-teal-400 underline"
              >
                Discover available lab equipment
              </Link>
            </div>
          )}
        </div>

        {/* Notifications & System Announcements */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Bell className="w-4 h-4 text-teal-500" />
              <span>Recent Activity &amp; Alerts</span>
            </div>
            <Link to="/app/notifications" className="text-xs text-teal-600 dark:text-teal-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {notifications.slice(0, 3).map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {notif.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
