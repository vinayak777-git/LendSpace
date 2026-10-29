import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  PlusCircle,
  FileText,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  LogOut,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

export const OwnerDashboardPlaceholder: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser: authUser, isPendingVerification, signOut } = useAuthStore();
  const { currentUser: appUser, resources } = useAppStore();

  const user = authUser || appUser;
  const userName = user?.name || 'Resource Custodian';
  const userEmail = user?.email || 'owner@institution.edu';

  const myResourceCount = resources.length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                LendSpace
              </span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Owner Hub
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/discover"
              className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <Compass className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>

            <Link
              to="/owner"
              className="text-xs sm:text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>Full Management Suite</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Pending Verification Notice Banner */}
        {isPendingVerification && (
          <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500/30 p-5 sm:p-6 shadow-lg shadow-amber-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                      Owner Verification Pending Approval
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      Under Review
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                    Your institutional affiliation is currently being verified by your departmental administrator. You can draft resource listings and configure maintenance rules now; your listings will automatically go live once approved (typically within 24 hours).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right hidden md:block">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-medium">Estimated SLA</span>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 font-mono">&lt; 18 hours</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Hero Card */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>Owner &amp; Custodian Dashboard</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome, {userName}!
            </h1>

            <p className="text-sm sm:text-base text-slate-300">
              You are signed in as <strong className="text-white font-mono">{userEmail}</strong> with{' '}
              <strong className="text-teal-400">Resource Owner &amp; Lab Custodian</strong> privileges. Here you can monitor bookings, review damage logs, verify check-ins, and inspect usage metrics.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/owner"
                className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Open Resource Management Suite</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/incidents"
                className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Damage &amp; Incident Records</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase">Total Listed Items</span>
              <Layers className="w-4 h-4 text-teal-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {myResourceCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              3D printers, laser cutters, cleanrooms
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase">Verification Status</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {isPendingVerification ? 'Pending' : 'Verified'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isPendingVerification ? 'Institutional review active' : 'Full publishing rights active'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase">Pending Requests</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              1 Active
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Awaiting custodian approval
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase">Escrow Held</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              $150.00
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active security deposits protected
            </p>
          </div>
        </div>

        {/* Feature Highlights for Owners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              List New Equipment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add specialized lab gear, define maximum weekly booking limits, set security deposits, and specify required safety certifications.
            </p>
            <Link
              to="/owner"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline pt-2"
            >
              <span>Add Resource</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Condition &amp; Damage Logs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect before-and-after photos uploaded by borrowers, file maintenance tickets, and resolve damage claims with audit transparency.
            </p>
            <Link
              to="/incidents"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline pt-2"
            >
              <span>View Incident Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Audit Trail &amp; History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review immutable timestamps for every approval, key pickup, return condition verification, and supervisor sign-off.
            </p>
            <Link
              to="/audit"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-2"
            >
              <span>Check Audit Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
