import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Layers,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  Download,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';

const COLORS = ['#059669', '#0d9488', '#10b981', '#14b8a6', '#0ea5e9', '#f59e0b'];

export const OwnerAnalyticsPage: React.FC = () => {
  const { resources, bookings } = useAppStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'term'>('30d');

  // Chart 1: Utilization by Resource
  const resourceUtilization = resources.map((r) => {
    const resBookings = bookings.filter((b) => b.resourceId === r.id);
    const hours = resBookings.reduce((sum, b) => {
      const h = (new Date(b.end).getTime() - new Date(b.start).getTime()) / (1000 * 60 * 60);
      return sum + Math.max(1, h);
    }, 0);
    return {
      name: r.title.length > 18 ? r.title.slice(0, 18) + '...' : r.title,
      hours: Math.round(hours) || 6,
      rate: Math.min(100, Math.round(((hours || 6) / 40) * 100)),
    };
  });

  // Chart 2: Hourly Demand Distribution (Peak hours)
  const hourlyPeakData = [
    { hour: '08:00', bookings: 2 },
    { hour: '10:00', bookings: 7 },
    { hour: '12:00', bookings: 11 },
    { hour: '14:00', bookings: 18 },
    { hour: '16:00', bookings: 15 },
    { hour: '18:00', bookings: 9 },
    { hour: '20:00', bookings: 3 },
  ];

  // Chart 3: Weekly Reservation Volume Trend
  const weeklyTrends = [
    { week: 'Week 1', completed: 18, cancelled: 2 },
    { week: 'Week 2', completed: 24, cancelled: 3 },
    { week: 'Week 3', completed: 32, cancelled: 4 },
    { week: 'Week 4', completed: 41, cancelled: 2 },
  ];

  // Chart 4: Department Distribution
  const departmentShare = [
    { name: 'Electrical & Comp Eng', value: 38 },
    { name: 'Mechanical & Robotics', value: 28 },
    { name: 'Biomedical & Wet Lab', value: 16 },
    { name: 'Industrial Design', value: 12 },
    { name: 'Civil & Material Science', value: 6 },
  ];

  const totalSessions = bookings.length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
  const cancellationRate = totalSessions > 0 ? Math.round((cancelledCount / totalSessions) * 100) : 6;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Facility Telemetry & Demand Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Analytics & Utilization
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Data insights on makerspace capacity utilization, peak operational hours, and departmental allocation.
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              timeRange === '7d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              timeRange === '30d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('term')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              timeRange === 'term' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Fall Term 2026
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Hours Reserved</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">184 hrs</div>
          <span className="text-[11px] text-emerald-600 font-medium">+14% vs last month</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Avg Session Duration</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">2.8 hrs</div>
          <span className="text-[11px] text-slate-400">Within fair-use guidelines</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Peak Demand Window</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">2 PM - 5 PM</div>
          <span className="text-[11px] text-slate-400">Tuesday & Wednesday</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Cancellation Rate</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {cancellationRate}%
          </div>
          <span className="text-[11px] text-slate-400">92% auto-promoted to waitlist</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Utilization by Resource */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Capacity Utilization by Facility (%)
            </h3>
            <span className="text-[11px] text-slate-400">Standard 40h workweek</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceUtilization} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Capacity']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="rate" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hourly Demand */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Peak Traffic by Hour of Day
            </h3>
            <span className="text-[11px] text-slate-400">Active concurrent checkouts</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyPeakData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="bookings" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Weekly Reservation Volumes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Weekly Reservation Growth
            </h3>
            <span className="text-[11px] text-slate-400">Completed vs Cancelled</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Area type="monotone" dataKey="cancelled" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Departmental Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Departmental Usage Distribution
            </h3>
            <span className="text-[11px] text-slate-400">Share of reserved hours</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentShare}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${(name || '').slice(0, 10)} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {departmentShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
