import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  PlusSquare,
  Building2,
  ClipboardList,
  Calendar,
  RotateCcw,
  AlertOctagon,
  Award,
  Users,
  Sliders,
  BarChart3,
  History,
  Bell,
  Settings,
  Sparkles,
  ArrowRightLeft,
  Clock,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { resetToSeedData } from '../../services/storage';

export const OwnerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser: authUser, darkMode, toggleDarkMode, signOut } = useAuthStore();
  const { currentUser: appUser, bookings, incidents, simulateTimePassing, refreshAll, showToast } = useAppStore();

  const user = authUser || appUser;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const isManagerOnly = user?.role === 'manager';

  const pendingRequestsCount = bookings.filter((b) => b.status === 'pending').length;
  const openIncidentsCount = incidents.filter(
    (i) => i.status === 'open' || i.status === 'under_review'
  ).length;

  const handleSimulate = async () => {
    setIsSimulating(true);
    await simulateTimePassing();
    setIsSimulating(false);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data back to initial seeds? This will restore all equipment and bookings.')) {
      resetToSeedData();
      refreshAll();
      showToast('Demo data successfully restored to initial state.', 'success');
    }
  };

  // Sidebar items
  const allNavItems = [
    { to: '/owner', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/owner/listings', label: 'My Listings', icon: Layers },
    { to: '/owner/add-equipment', label: 'Add Equipment', icon: PlusSquare },
    { to: '/owner/add-space', label: 'Add Space', icon: Building2 },
    {
      to: '/owner/requests',
      label: 'Requests',
      icon: ClipboardList,
      badge: pendingRequestsCount,
      badgeColor: 'bg-amber-500',
    },
    { to: '/owner/calendar', label: 'Calendar', icon: Calendar },
    { to: '/owner/usage', label: 'Active Usage & Returns', icon: RotateCcw },
    {
      to: '/owner/incidents',
      label: 'Incidents',
      icon: AlertOctagon,
      badge: openIncidentsCount,
      badgeColor: 'bg-rose-500',
    },
    { to: '/owner/credentials-review', label: 'Credentials Review', icon: Award },
    { to: '/owner/team', label: 'Team', icon: Users, ownerOnly: true },
    { to: '/owner/fair-use', label: 'Fair-Use Rules', icon: Sliders, ownerOnly: true },
    { to: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/owner/audit', label: 'Audit Log', icon: History },
    { to: '/owner/settings', label: 'Settings', icon: Settings, ownerOnly: true },
  ];

  // Restricted menu for managers
  const navItems = allNavItems.filter((item) => {
    if (isManagerOnly && item.ownerOnly) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* Desktop Sidebar (Indigo Accent) */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 h-screen z-30">
        <div className="overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-200/80 dark:border-slate-800">
            <Link to="/owner" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Lend<span className="text-emerald-600 dark:text-emerald-400">Space</span>
                </span>
                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                  {isManagerOnly ? 'Manager Portal' : 'Owner Portal'}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="p-3.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs border border-emerald-200/60 dark:border-emerald-800/60'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                        item.badgeColor || 'bg-emerald-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5 shrink-0 bg-white/50 dark:bg-slate-900/50">
          <Link
            to="/app"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Switch to Booker Portal</span>
          </Link>

          <div className="flex items-center justify-end text-xs text-slate-500 pt-1">
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
              className="text-[11px] text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (Emerald / Teal accent) */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Portal Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>OWNER PORTAL</span>
              <span className="text-emerald-400 dark:text-emerald-600">•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                {isManagerOnly ? 'Lab Manager' : user?.jobTitle || 'Faculty Custodian'}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Dev time simulator */}
            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating}
              title="Simulate 3 hours passing"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              <Clock className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Advancing...' : '⚡ +3h'}</span>
            </button>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile Tag */}
            <div className="flex items-center gap-2 py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white">
                {user?.name ? user.name.charAt(0) : 'O'}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[120px] truncate">
                {user?.name || 'Dr. Ramesh Rao'}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Portal Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-xs bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  LendSpace Owner
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white bg-emerald-600">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Link
                to="/app"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              >
                <span>Switch to Booker Portal</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
