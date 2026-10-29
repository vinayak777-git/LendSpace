import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { resourceService } from '../services/resourceService';
import { Resource, ResourceCategory, ApprovalMode, DemandLevel } from '../types';
import {
  Layers,
  Plus,
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export const OwnerDashboardPage: React.FC = () => {
  const { resources, bookings, currentUser, refreshAll, showToast } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Resource Form States
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ResourceCategory>('3d_printer');
  const [newDesc, setNewDesc] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDeposit, setNewDeposit] = useState<number>(0);
  const [newMaxHoursBooking, setNewMaxHoursBooking] = useState<number>(4);
  const [newMaxHoursWeek, setNewMaxHoursWeek] = useState<number>(12);
  const [newSupervision, setNewSupervision] = useState<boolean>(false);
  const [newApprovalMode, setNewApprovalMode] = useState<ApprovalMode>('auto');
  const [newDemandLevel, setNewDemandLevel] = useState<DemandLevel>('medium');
  const [newRules, setNewRules] = useState<string>(
    'Clean workspace after use.\nFollow makerspace safety checklist.'
  );

  // Filter resources owned by current user or all if admin
  const myResources = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return resources;
    return resources.filter((r) => r.ownerId === currentUser.id || r.managerIds.includes(currentUser.id));
  }, [resources, currentUser]);

  // Analytics KPIs
  const kpis = useMemo(() => {
    const totalBookings = bookings.length;
    const completed = bookings.filter((b) => b.status === 'returned').length;
    const utilizationRate = Math.min(94, Math.round((completed / (totalBookings || 1)) * 100));
    const avgResponseHours = 1.4;

    return {
      totalBookings,
      utilizationRate,
      activeResources: myResources.filter((r) => !r.isPaused).length,
      avgResponseHours,
    };
  }, [bookings, myResources]);

  // Chart data
  const weeklyTrendData = [
    { day: 'Mon', bookings: 6, hours: 18 },
    { day: 'Tue', bookings: 9, hours: 26 },
    { day: 'Wed', bookings: 12, hours: 34 },
    { day: 'Thu', bookings: 8, hours: 22 },
    { day: 'Fri', bookings: 14, hours: 42 },
    { day: 'Sat', bookings: 10, hours: 28 },
    { day: 'Sun', bookings: 4, hours: 12 },
  ];

  const categoryShareData = [
    { name: '3D Printing', value: 38, color: '#16a34a' },
    { name: 'Laser Cutting', value: 24, color: '#eab308' },
    { name: 'GPU Compute', value: 22, color: '#6366f1' },
    { name: 'Electronics/Photo', value: 16, color: '#0ea5e9' },
  ];

  const handleTogglePause = async (res: Resource) => {
    if (!currentUser) return;
    try {
      const reason = res.isPaused
        ? 'Owner resumed machine availability.'
        : 'Owner paused machine for scheduled maintenance and calibration.';
      await resourceService.togglePause(res.id, currentUser, reason);
      showToast(
        res.isPaused
          ? `Resumed ${res.title} for student reservations.`
          : `Paused ${res.title} for maintenance.`,
        'info'
      );
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle resource status', 'error');
    }
  };

  const handleCreateResource = async () => {
    if (!currentUser) return;
    if (!newTitle.trim() || !newLocation.trim()) {
      showToast('Please provide a title and location for the resource.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await resourceService.createResource(
        {
          title: newTitle,
          category: newCategory,
          description: newDesc || 'High precision campus equipment.',
          location: newLocation,
          ownerId: currentUser.id,
          managerIds: ['user-kiran'],
          images: [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
          ],
          availabilityWindows: [
            { dayOfWeek: 1, startHour: 8, endHour: 20 },
            { dayOfWeek: 2, startHour: 8, endHour: 20 },
            { dayOfWeek: 3, startHour: 8, endHour: 20 },
            { dayOfWeek: 4, startHour: 8, endHour: 20 },
            { dayOfWeek: 5, startHour: 8, endHour: 18 },
          ],
          requirements: newSupervision
            ? [
                {
                  id: `req-${Date.now()}`,
                  type: 'supervision',
                  label: 'Certified Lab Supervision Required',
                },
              ]
            : [],
          rules: newRules.split('\n').filter((r) => r.trim().length > 0),
          depositAmount: Number(newDeposit),
          maxHoursPerBooking: Number(newMaxHoursBooking),
          maxHoursPerWeekPerUser: Number(newMaxHoursWeek),
          supervisionRequired: newSupervision,
          approvalMode: newApprovalMode,
          demandLevel: newDemandLevel,
        },
        currentUser
      );

      showToast(`Resource "${newTitle}" created successfully!`, 'success');
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewLocation('');
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to create resource', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Faculty & Lab Director Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Owner Resource Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor utilization KPIs, calibrate safety requirement rules, and register new shared equipment.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Resource</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lab Utilization
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.utilizationRate}%</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">+8.4% vs last week</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Resources
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {kpis.activeResources} / {myResources.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Available for student booking</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Reservations
            </span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.totalBookings}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across all makerspace facilities</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Avg Review Speed
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.avgResponseHours}h</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Faster than 2h target</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Trend Bar Chart */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Equipment Booking Volume</h3>
              <p className="text-xs text-slate-400">Total reservations logged per operational day</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
              Current Week
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrendData}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="bookings" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Chart */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Utilization by Category</h3>
            <p className="text-xs text-slate-400 mb-4">Proportion of aggregate reservation hours</p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryShareData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={40}
                  >
                    {categoryShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
            {categoryShareData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Managed Resources Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registered Lab Equipment</h3>
            <p className="text-xs text-slate-500">Manage pause toggles, approval rules, and session caps</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-4 px-6">Equipment</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">Approval Mode</th>
                <th className="py-4 px-6">Caps</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myResources.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{res.title}</div>
                    <div className="text-[11px] text-slate-400 capitalize">
                      {res.category.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{res.location}</td>
                  <td className="py-4 px-6">
                    <span className="capitalize font-semibold text-slate-800">
                      {res.approvalMode}
                    </span>
                    {res.supervisionRequired && (
                      <span className="block text-[10px] text-amber-700 font-medium">
                        Supervision Required
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <div>{res.maxHoursPerBooking}h / session</div>
                    <div className="text-[10px] text-slate-400">{res.maxHoursPerWeekPerUser}h / week cap</div>
                  </td>
                  <td className="py-4 px-6">
                    {res.isPaused ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        Paused (Maint.)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleTogglePause(res)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                        res.isPaused
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {res.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{res.isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Equipment Registration
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">Register New Makerspace Resource</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resource Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Formlabs Form 3+ SLA Resin Printer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ResourceCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="3d_printer">3D Printer</option>
                    <option value="laser_cutter">Laser Cutter</option>
                    <option value="electronics">Electronics</option>
                    <option value="photography">Photography / Media</option>
                    <option value="spaces">Sprint Space</option>
                    <option value="wet_lab">Wet Lab</option>
                    <option value="computing">GPU Computing</option>
                    <option value="soldering">Soldering</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Facility Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Fab Wing - Bay 05"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief overview of capabilities..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Approval Mode
                  </label>
                  <select
                    value={newApprovalMode}
                    onChange={(e) => setNewApprovalMode(e.target.value as ApprovalMode)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="auto">Auto-Approve</option>
                    <option value="manual">Manual Review</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Max Hours / Session
                  </label>
                  <input
                    type="number"
                    value={newMaxHoursBooking}
                    onChange={(e) => setNewMaxHoursBooking(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Weekly User Cap (h)
                  </label>
                  <input
                    type="number"
                    value={newMaxHoursWeek}
                    onChange={(e) => setNewMaxHoursWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Security Deposit ($)
                  </label>
                  <input
                    type="number"
                    value={newDeposit}
                    onChange={(e) => setNewDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Demand Level
                  </label>
                  <select
                    value={newDemandLevel}
                    onChange={(e) => setNewDemandLevel(e.target.value as DemandLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="low">Low Demand</option>
                    <option value="medium">Medium Demand</option>
                    <option value="high">High Demand (Cap active)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newSupervision}
                    onChange={(e) => setNewSupervision(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>Requires Technician Supervision during sessions</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operating Rules (1 per line)
                </label>
                <textarea
                  rows={2}
                  value={newRules}
                  onChange={(e) => setNewRules(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateResource}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm"
              >
                {isSubmitting ? 'Registering...' : 'Save & Publish Resource'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
