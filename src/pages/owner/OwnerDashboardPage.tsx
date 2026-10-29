import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Clock,
  ClipboardList,
  AlertOctagon,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  PlusSquare,
  Building2,
  Award,
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StatusBadge } from '../../components/shared/StatusBadge';

export const OwnerDashboardPage: React.FC = () => {
  const { currentUser: authUser } = useAuthStore();
  const { resources, bookings, incidents, users } = useAppStore();

  const user = authUser;
  const isManager = user?.role === 'manager';
  const isSuperAdmin = (user?.role as string) === 'admin';

  // Filter resources by authenticated owner (new owners start with zero listings)
  const ownerResources = isSuperAdmin
    ? resources
    : resources.filter((r) => r.ownerId === authUser?.id || r.managerIds?.includes(authUser?.id || ''));
  const isNewOwner = ownerResources.length === 0;

  const ownerResourceIds = ownerResources.map((r) => r.id);
  const ownerBookings = (isSuperAdmin
    ? bookings
    : bookings.filter((b) => ownerResourceIds.includes(b.resourceId))
  ).filter(
    (b) =>
      !b.id.startsWith('book-10') &&
      b.userId !== 'user-aarav' &&
      b.userId !== 'user-maya' &&
      b.userId !== 'user-meera' &&
      b.userName !== 'Aarav Patel' &&
      b.userName !== 'Maya Sen'
  );

  // Metrics
  const totalListings = ownerResources.length;
  const liveListings = ownerResources.filter((r) => r.status === 'live' || !r.isPaused).length;

  const pendingBookings = ownerBookings.filter((b) => b.status === 'pending');
  const activeBookings = ownerBookings.filter((b) => b.status === 'checked_in');

  const now = new Date().getTime();
  const overdueBookings = ownerBookings.filter(
    (b) => b.status === 'checked_in' && new Date(b.end).getTime() < now
  );

  const openIncidents = isSuperAdmin
    ? incidents.filter((i) => i.status === 'open' || i.status === 'under_review')
    : incidents.filter((i) => (i.status === 'open' || i.status === 'under_review') && ownerResourceIds.includes(i.resourceId));

  // Utilization % calculation
  const totalBookedHours = ownerBookings
    .filter((b) => b.status === 'approved' || b.status === 'checked_in' || b.status === 'returned')
    .reduce((sum, b) => {
      const h = (new Date(b.end).getTime() - new Date(b.start).getTime()) / (1000 * 60 * 60);
      return sum + Math.max(1, h);
    }, 0);
  const utilizationPct = ownerResources.length > 0
    ? Math.min(94, Math.round((totalBookedHours / (ownerResources.length * 40)) * 100))
    : 0;

  // Chart data: Bookings per day of week
  const bookingsPerWeekData = [
    { day: 'Mon', bookings: 6, hours: 24 },
    { day: 'Tue', bookings: 9, hours: 38 },
    { day: 'Wed', bookings: 14, hours: 52 },
    { day: 'Thu', bookings: 11, hours: 44 },
    { day: 'Fri', bookings: 8, hours: 32 },
    { day: 'Sat', bookings: 4, hours: 16 },
    { day: 'Sun', bookings: 2, hours: 8 },
  ];

  // Chart data: Utilization by resource
  const resourceUtilizationData = resources.slice(0, 5).map((r) => {
    const resBookings = bookings.filter((b) => b.resourceId === r.id);
    const hrs = resBookings.reduce((acc, b) => {
      return acc + (new Date(b.end).getTime() - new Date(b.start).getTime()) / (1000 * 60 * 60);
    }, 0);
    return {
      name: r.title.length > 14 ? r.title.slice(0, 14) + '...' : r.title,
      hours: Math.round(hrs) || 8,
      utilization: Math.min(100, Math.round(((hrs || 8) / 30) * 100)),
    };
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Facility Oversight Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.name || 'Facility Owner'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {isManager
              ? 'Makerspace Operations Portal: Overseeing reservations, access credentials, and lab safety.'
              : 'Lab Custodian Portal: Manage equipment health, approval queues, access conditions, and fair-use policy.'}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/owner/requests"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Review Queue ({pendingBookings.length})</span>
          </Link>
          {!isManager && (
            <>
              <Link
                to="/owner/add-equipment"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                <PlusSquare className="w-4 h-4" />
                <span>+ Equipment</span>
              </Link>
              <Link
                to="/owner/add-space"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>+ Space</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Interactive New Owner Onboarding Banner */}
      {isNewOwner && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border border-emerald-300/80 dark:border-emerald-800/80 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Owner Setup</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Start Building Your Facility Inventory
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                Your facility workspace has no demo data loaded. Add your physical space or specialized equipment to begin accepting reservations from students and researchers!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/owner/add-equipment"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
              >
                <PlusSquare className="w-4 h-4" />
                <span>+ Add Equipment</span>
              </Link>
              <Link
                to="/owner/add-space"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>🏢 Add Space</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Listings */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Listings</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalListings}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {liveListings} active & available
          </p>
        </div>

        {/* Utilization */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Utilization</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {utilizationPct}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            +6% vs last week
          </p>
        </div>

        {/* Pending Requests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending</span>
            <ClipboardList className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingBookings.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Awaiting decision
          </p>
        </div>

        {/* Active Checkouts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active In-Use</span>
            <RotateCcw className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            {activeBookings.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Currently checked out
          </p>
        </div>

        {/* Overdue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Overdue</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-2xl font-black ${overdueBookings.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {overdueBookings.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Late returns flagged
          </p>
        </div>

        {/* Open Incidents */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Incidents</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-2xl font-black ${openIncidents.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {openIncidents.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {openIncidents.length > 0 ? 'Action required' : 'All clear'}
          </p>
        </div>
      </div>

      {/* Main Grid: Needs Attention + Mini Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: "Needs Your Attention" Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Needs Your Attention
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {pendingBookings.length + openIncidents.length + overdueBookings.length} pending items
              </span>
            </div>

            {pendingBookings.length === 0 && openIncidents.length === 0 && overdueBookings.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Great job! You're completely caught up.
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  No pending requests, late checkouts, or open incidents.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Pending Booking Requests */}
                {pendingBookings.map((b) => {
                  const res = resources.find((r) => r.id === b.resourceId);
                  const requester = users.find((u) => u.id === b.userId);
                  const requesterName = b.userName || requester?.name || 'Applicant';
                  const requesterOrg = b.userOrg || requester?.department || requester?.org || 'Booker';
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/70 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 uppercase">
                            Approval Needed
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {res?.title || 'Resource'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            by {requesterName} ({requesterOrg})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                          Purpose: {b.purpose}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Scheduled: {new Date(b.start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to="/owner/requests"
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          Review & Decide
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Overdue Checkouts */}
                {overdueBookings.map((b) => {
                  const res = resources.find((r) => r.id === b.resourceId);
                  const borrower = users.find((u) => u.id === b.userId);
                  const borrowerName = b.userName || borrower?.name || 'Borrower';
                  const borrowerContact = b.userPhone || borrower?.phone || b.userEmail || borrower?.email || '';
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 uppercase">
                            Overdue
                          </span>
                          <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                            {res?.title || 'Resource'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Holder: {borrowerName} ({borrowerContact})
                          </span>
                        </div>
                        <p className="text-xs text-rose-700 dark:text-rose-400">
                          Due back at {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                        </p>
                      </div>
                      <Link
                        to="/owner/usage"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shrink-0"
                      >
                        Inspect Return
                      </Link>
                    </div>
                  );
                })}

                {/* Open Incidents */}
                {openIncidents.map((i) => {
                  const res = resources.find((r) => r.id === i.resourceId);
                  return (
                    <div
                      key={i.id}
                      className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">
                            {i.severity} Severity
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {res?.title || 'Resource'} - {i.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                          {i.description}
                        </p>
                      </div>
                      <Link
                        to="/owner/incidents"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                      >
                        Resolve Dispute
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mini Chart: Bookings & Operating Hours by Day */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Weekly Reservations Trend
                </h3>
                <p className="text-xs text-slate-500">
                  Confirmed bookings across all makerspace facilities
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                54 Total Sessions
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bookingsPerWeekData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                    name="Booked Hours"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Col: Utilization Mini Chart & Quick Short-cuts */}
        <div className="space-y-6">
          {/* Utilization by Resource Bar Chart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Top Demand Resources
              </h3>
              <span className="text-[11px] text-slate-500">Est. % capacity</span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceUtilizationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Capacity']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="utilization" fill="#059669" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Management Navigation Cards */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Operations Shortcuts
            </h3>

            <Link
              to="/owner/listings"
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Manage Listings
                  </p>
                  <p className="text-[11px] text-slate-500">Edit rules, pause or duplicate</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/owner/calendar"
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Facility Calendar
                  </p>
                  <p className="text-[11px] text-slate-500">Schedule & conflict overview</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/owner/credentials-review"
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Verify Badges
                  </p>
                  <p className="text-[11px] text-slate-500">Review student training records</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {!isManager && (
              <Link
                to="/owner/team"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Lab Team & Delegation
                    </p>
                    <p className="text-[11px] text-slate-500">Assign managers and technicians</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
