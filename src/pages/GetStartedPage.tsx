import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
  Clock,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AppRole } from '../types';

export const GetStartedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { selectedRole, setRole, darkMode, toggleDarkMode } = useAuthStore();

  // Mode: signin vs signup
  const initialMode = searchParams.get('mode') === 'signin' ? 'signin' : 'signup';
  const initialRoleParam = searchParams.get('role') as AppRole | null;

  const [activeRole, setActiveRole] = useState<AppRole | null>(
    initialRoleParam === 'user' || initialRoleParam === 'owner'
      ? initialRoleParam
      : selectedRole || null
  );

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);

  useEffect(() => {
    // If URL has specific role or mode, update
    const roleParam = searchParams.get('role') as AppRole | null;
    if (roleParam === 'user' || roleParam === 'owner') {
      setActiveRole(roleParam);
      setRole(roleParam);
    }
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signin' || modeParam === 'signup') {
      setAuthMode(modeParam);
    }
  }, [searchParams, setRole]);

  const handleSelectRole = (role: AppRole) => {
    setActiveRole(role);
    setRole(role);
  };

  const handleContinue = () => {
    if (!activeRole) return;
    setRole(activeRole);
    if (authMode === 'signin') {
      navigate(`/auth/sign-in?role=${activeRole}`);
    } else {
      navigate(`/auth/sign-up?role=${activeRole}`);
    }
  };

  const handleQuickSignIn = () => {
    if (activeRole) {
      setRole(activeRole);
      navigate(`/auth/sign-in?role=${activeRole}`);
    } else {
      setAuthMode('signin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      {/* Minimal Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 group text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to home</span>
          </Link>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              LendSpace
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-3xl w-full mx-auto space-y-8">
          {/* Header Copy */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Role Selection Step
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              How would you like to use LendSpace?
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Select your primary intent to personalize your experience, eligibility checks, and dashboard permissions.
            </p>
          </div>

          {/* Mode Switcher: "I'm creating an account" vs "I'm signing in" */}
          <div className="flex justify-center">
            <div className="bg-slate-200/80 dark:bg-slate-800/90 p-1 rounded-xl inline-flex shadow-inner">
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                I&apos;m creating an account
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  authMode === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                I&apos;m signing in
              </button>
            </div>
          </div>

          {/* Two Large Selectable Radio Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" role="radiogroup" aria-label="Choose your role">
            {/* Card 1: User / Looker */}
            <div
              role="radio"
              aria-checked={activeRole === 'user'}
              tabIndex={0}
              onClick={() => handleSelectRole('user')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleSelectRole('user');
                }
              }}
              className={`relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 flex flex-col justify-between border-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                activeRole === 'user'
                  ? 'bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                  : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Radio indicator */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    activeRole === 'user'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <Compass className="w-6 h-6" />
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    activeRole === 'user'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {activeRole === 'user' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100/70 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Booker / Researcher
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  I want to book resources
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  For students, faculty researchers, makers, and innovators needing specialized equipment.
                </p>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-4 border-t border-slate-100 dark:border-slate-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Browse certified instruments, 3D printers, VR suites, and lab benches</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Transparent eligibility checks and automated booking queues</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Fair access quotas, instant status alerts, and condition handoff logs</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Owner / Resource Manager */}
            <div
              role="radio"
              aria-checked={activeRole === 'owner'}
              tabIndex={0}
              onClick={() => handleSelectRole('owner')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleSelectRole('owner');
                }
              }}
              className={`relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 flex flex-col justify-between border-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                activeRole === 'owner'
                  ? 'bg-white dark:bg-slate-900 border-teal-500 dark:border-teal-500 shadow-xl shadow-teal-500/10 ring-2 ring-teal-500/20'
                  : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Radio indicator */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    activeRole === 'owner'
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                      : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    activeRole === 'owner'
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {activeRole === 'owner' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-teal-100/70 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                  Custodian / Lab Head
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  I own or manage resources
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  For department heads, lab managers, makerspace staff, and certified equipment custodians.
                </p>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-4 border-t border-slate-100 dark:border-slate-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>Safely share idle equipment with automated audit trails and access control</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>Mandatory check-in photos, condition logs, and security deposit escrow</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>Full authority to review requests, enforce quotas, and resolve incidents</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Continue Button */}
          <div className="space-y-4 pt-2">
            <button
              type="button"
              disabled={!activeRole}
              onClick={handleContinue}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                activeRole
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 cursor-pointer transform active:scale-[0.99]'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
              }`}
            >
              <span>
                {activeRole
                  ? `Continue as ${activeRole === 'user' ? 'Resource Booker' : 'Resource Owner'} (${
                      authMode === 'signin' ? 'Sign In' : 'Create Account'
                    })`
                  : 'Select an option above to continue'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Subtext: Already have an account? Sign in */}
            <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {authMode === 'signup' ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={handleQuickSignIn}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Sign in here
                  </button>
                </span>
              ) : (
                <span>
                  Don&apos;t have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Create an account
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Quick FAQ / Safety note */}
          <div className="rounded-xl p-4 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Can I switch my role later?
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Yes. You can switch roles or manage equipment while booking other resources anytime from your profile settings.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
