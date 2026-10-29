import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Compass,
  CalendarCheck,
  Clock,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  AlertOctagon,
  Bell,
  User as UserIcon,
  RotateCcw,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  ListOrdered,
  Layers,
  ArrowRightLeft,
  Building,
  Sliders,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { resetToSeedData } from '../../services/storage';
import { BookerRequirementsModal } from '../booker/BookerRequirementsModal';

export const BookerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser: authUser, darkMode, toggleDarkMode, signOut } = useAuthStore();
  const { currentUser: appUser, notifications, refreshAll, showToast } = useAppStore();

  const user = authUser || appUser;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(() => {
    if (authUser && !authUser.hasCompletedRequirementsOnboarding && !localStorage.getItem(`lendspace_booker_onboarded_${authUser.id}`)) {
      return true;
    }
    return false;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleResetData = () => {
    if (window.confirm('Reset all demo data back to initial seeds? This will refresh all bookings and resources.')) {
      resetToSeedData();
      refreshAll();
      showToast('Demo data successfully restored to initial state.', 'success');
    }
  };

  const navItems = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/app/discover', label: 'Discover', icon: Compass },
    { to: '/app/bookings', label: 'My Bookings', icon: CalendarCheck },
    { to: '/app/waitlist', label: 'Waitlist', icon: ListOrdered },
    { to: '/app/checkin-return', label: 'Check-in / Return', icon: RotateCcw },
    { to: '/app/requirements', label: 'My Requirements', icon: Sliders },
    { to: '/app/incidents', label: 'Incidents', icon: AlertOctagon },
    { to: '/app/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/app/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* Desktop Sidebar (Teal Accent) */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 h-screen z-30">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-200/80 dark:border-slate-800">
            <Link to="/app" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Lend<span className="text-teal-600 dark:text-teal-400">Space</span>
                </span>
                <span className="block text-[10px] font-bold text-teal-600 dark:text-teal-400 tracking-wider uppercase">
                  Booker Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-xs border border-teal-200/60 dark:border-teal-800/60'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white bg-teal-600">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
          <Link
            to="/owner"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Switch to Owner Portal</span>
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
        {/* Topbar (Teal accent) */}
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>BOOKER PORTAL</span>
              <span className="text-teal-400 dark:text-teal-600">•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                {user?.role || 'Student'}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsRequirementsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Requirements</span>
            </button>

            <Link
              to="/app/notifications"
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile Tag */}
            <Link
              to="/app/profile"
              className="flex items-center gap-2 py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-teal-300 transition-colors shadow-xs"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[120px] truncate">
                {user?.name || 'Aarav Patel'}
              </span>
            </Link>
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
          <div className="relative w-64 max-w-xs bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between shadow-2xl z-10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  LendSpace Booker
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
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white bg-teal-600">
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
                to="/owner"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              >
                <span>Switch to Owner Portal</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Booker Onboarding / Requirements Modal */}
      <BookerRequirementsModal
        isOpen={isRequirementsModalOpen}
        onClose={() => setIsRequirementsModalOpen(false)}
      />
    </div>
  );
};
