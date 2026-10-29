import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { RoleSelectionModal } from '../common/RoleSelectionModal';
import { WalletModal } from '../common/WalletModal';
import {
  Compass,
  CalendarCheck,
  ShieldAlert,
  ClipboardList,
  AlertOctagon,
  History,
  Settings,
  Bell,
  Clock,
  User as UserIcon,
  Sparkles,
  Layers,
  Menu,
  X,
  ArrowRightLeft,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser: appUser,
    switchUser,
    notifications,
    bookings,
    incidents,
    simulateTimePassing,
  } = useAppStore();

  const {
    currentUser: authUser,
    darkMode,
    toggleDarkMode,
  } = useAuthStore();

  const currentUser = authUser || appUser;

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const isOwner =
    currentUser?.role === 'owner' ||
    currentUser?.role === 'faculty' ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'admin';

  const isLooker = !isOwner;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingRequestsCount = bookings.filter((b) => b.status === 'pending').length;
  const openIncidentsCount = incidents.filter(
    (i) => i.status === 'open' || i.status === 'under_review'
  ).length;

  const handleSimulate = async () => {
    setIsSimulating(true);
    await simulateTimePassing();
    setIsSimulating(false);
  };

  const handleQuickToggleMode = () => {
    if (isLooker) {
      navigate('/owner');
    } else {
      navigate('/app');
    }
  };

  // Nav links tailored to Looker vs Owner
  const navLinks = isOwner
    ? [
        {
          to: '/discover',
          label: 'Browse Catalog',
          icon: Compass,
        },
        {
          to: '/owner',
          label: 'Manage Spaces',
          icon: Layers,
        },
        {
          to: '/review',
          label: 'Review Queue',
          icon: ClipboardList,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
          badgeColor: 'bg-amber-500',
        },
        {
          to: '/incidents',
          label: 'Damages & Incidents',
          icon: AlertOctagon,
          badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
          badgeColor: 'bg-rose-500',
        },
        {
          to: '/audit',
          label: 'Audit Trail',
          icon: History,
        },
      ]
    : [
        {
          to: '/discover',
          label: 'Discover Spaces',
          icon: Compass,
        },
        {
          to: '/bookings',
          label: 'My Bookings',
          icon: CalendarCheck,
        },
        {
          to: '/incidents',
          label: 'Report Issue',
          icon: AlertOctagon,
        },
        {
          to: '/profile',
          label: 'My Credentials',
          icon: UserIcon,
        },
      ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & Navigation */}
            <div className="flex items-center gap-6 xl:gap-8">
              <Link to="/discover" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                    LendSpace
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                    Makerspace
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                        isActive
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                      {link.badge !== undefined && (
                        <span
                          className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full text-white ${
                            link.badgeColor || 'bg-amber-500'
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Controls: Credits, Dev simulation, Bell, Theme, Persona Pill */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Built-in Platform Credits & Escrow Ledger Pill */}
              <button
                type="button"
                onClick={() => setIsWalletOpen(true)}
                title="View platform credits & append-only escrow ledger"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-teal-500/30 bg-teal-50/80 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors shadow-xs"
              >
                <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                  ₹
                </span>
                <span>Credits</span>
              </button>

              {/* Simulate Time Passing Dev Control */}
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                title="Simulate 3 hours passing (triggers automated reminders & status updates)"
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                <Clock className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Advancing...' : '⚡ +3h'}</span>
              </button>

              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* User Persona & Role Selector Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="flex items-center gap-2 py-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs group"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-xs ${
                      isOwner
                        ? 'bg-gradient-to-tr from-teal-600 to-emerald-500'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                    }`}
                  >
                    {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[120px]">
                      {currentUser?.name || 'My Profile'}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5 capitalize">
                      {isOwner ? 'Resource Owner' : 'Booker (User)'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors ml-0.5" />
                </button>

                {/* Quick Toggle Mode Pill */}
                <button
                  type="button"
                  onClick={handleQuickToggleMode}
                  title={isLooker ? 'Switch to Owner Portal' : 'Switch to Booker Portal'}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isLooker ? 'Switch to Owner' : 'Switch to Booker'}</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-4 space-y-2 animate-fadeIn">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 pt-1">
              Menu Navigation
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-amber-500">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsRoleModalOpen(true);
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Switch Role / Persona
              </button>
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400"
              >
                {isSimulating ? 'Advancing...' : '⚡ Simulate +3h'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      {/* Built-in Wallet & Escrow Ledger Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />
    </>
  );
};
