import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Compass,
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  HelpCircle,
  Clock,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { AppRole } from '../types';

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid academic/institutional email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    currentUser,
    selectedRole,
    setRole,
    signIn,
    intendedRoute,
    setIntendedRoute,
    darkMode,
    toggleDarkMode,
  } = useAuthStore();

  const roleParam = searchParams.get('role') as AppRole | null;
  const emailParam = searchParams.get('email') || '';

  // Determine current active role
  const activeRole: AppRole =
    roleParam === 'user' || roleParam === 'owner'
      ? roleParam
      : selectedRole || 'user';

  // If role neither in URL nor in store, redirect to /get-started
  useEffect(() => {
    if (!roleParam && !selectedRole) {
      navigate('/get-started?mode=signin', { replace: true });
    } else if (roleParam && roleParam !== selectedRole) {
      setRole(roleParam);
    }
  }, [roleParam, selectedRole, navigate, setRole]);

  // If already logged in, redirect
  useEffect(() => {
    if (currentUser) {
      if (intendedRoute) {
        const dest = intendedRoute;
        setIntendedRoute(null);
        navigate(dest);
      } else {
        navigate(currentUser.role === 'owner' || currentUser.role === 'manager' ? '/owner' : '/app');
      }
    }
  }, [currentUser, intendedRoute, navigate, setIntendedRoute]);

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: emailParam,
      password: '',
      rememberMe: true,
    },
  });

  const enteredEmail = watch('email');

  const onSubmit = async (data: SignInFormData) => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const user = await signIn(data.email, data.password, activeRole);
      // Success redirect
      if (intendedRoute) {
        const dest = intendedRoute;
        setIntendedRoute(null);
        navigate(dest);
      } else {
        navigate(user.role === 'owner' || user.role === 'manager' ? '/owner' : '/app');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      await authService.sendPasswordReset(forgotEmail);
      setForgotSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email';
      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              LendSpace
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to={`/get-started?mode=signin&email=${encodeURIComponent(enteredEmail || '')}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Not your role? Switch</span>
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
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)]">
        {/* Left Panel: Role-Aware Context Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle Ambient Background glow */}
          <div
            className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none ${
              activeRole === 'user' ? 'bg-emerald-500' : 'bg-teal-500'
            }`}
          />

          <div className="space-y-6 relative z-10">
            {/* Role Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-emerald-400 border border-white/10 backdrop-blur-sm">
              {activeRole === 'user' ? (
                <>
                  <Compass className="w-3.5 h-3.5" />
                  <span>Booker Portal Experience</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Equipment Owner Portal Experience</span>
                </>
              )}
            </div>

            {/* Dynamic Headline */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {activeRole === 'user'
                ? 'Find and book the equipment you need.'
                : 'Share your resources safely, stay in control.'}
            </h1>

            <p className="text-sm text-slate-300">
              {activeRole === 'user'
                ? 'Gain reliable access to university autoclaves, CNC mills, and optics labs without bureaucratic gridlock.'
                : 'Monetize or responsibly share idle departmental equipment with immutable check-in audits and automated access rules.'}
            </p>

            {/* Mobile Accordion Toggle */}
            <div className="lg:hidden pt-2">
              <button
                type="button"
                onClick={() => setMobileAccordionOpen(!mobileAccordionOpen)}
                className="w-full flex items-center justify-between py-2 text-xs font-medium text-emerald-400 border-t border-slate-800"
              >
                <span>{mobileAccordionOpen ? 'Hide platform advantages' : 'Show platform advantages & workflow'}</span>
                {mobileAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Content: Visible always on desktop, toggleable on mobile */}
            <div className={`space-y-6 ${mobileAccordionOpen ? 'block' : 'hidden lg:block'}`}>
              {/* Problem Panel */}
              <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-5 space-y-3.5 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {activeRole === 'user'
                      ? 'Common problems we solve for you'
                      : 'Problems owners face & how we solve them'}
                  </span>
                </div>

                {activeRole === 'user' ? (
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Expensive to rent or buy:</strong> Access internal institutional equipment at zero or subsidized academic rates.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Don&apos;t know if eligible:</strong> Automated credential checks verify your prerequisites before you submit.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Unclear approval status:</strong> Live tracking with expected turnaround SLAs and manager notes.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Unfair access to popular tools:</strong> Rolling weekly quotas prevent resource monopolization.
                      </div>
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Misuse & damage risk:</strong> Mandatory photo check-ins and escrow deposit liability agreements.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Unclear who is using what:</strong> Real-time digital custodian board with active borrower badges.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">No condition records:</strong> Timestamped inspection photos logged before and after every return.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Scheduling conflicts:</strong> Automated buffers between bookings ensure time for cleanups.
                      </div>
                    </li>
                  </ul>
                )}
              </div>

              {/* 3-Step Lifecycle Panel */}
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {activeRole === 'user' ? 'How booking works' : 'How listing works'}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {activeRole === 'user' ? (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">STEP 1</span>
                        <span className="text-xs font-semibold text-white block">Discover</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Filter labs & gear</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">STEP 2</span>
                        <span className="text-xs font-semibold text-white block">Eligibility</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Check prerequisites</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">STEP 3</span>
                        <span className="text-xs font-semibold text-white block">Book & Track</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Verified check-in</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-teal-400 block mb-0.5">STEP 1</span>
                        <span className="text-xs font-semibold text-white block">List & Rules</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Set conditions</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-teal-400 block mb-0.5">STEP 2</span>
                        <span className="text-xs font-semibold text-white block">Review</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">1-click approve</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-teal-400 block mb-0.5">STEP 3</span>
                        <span className="text-xs font-semibold text-white block">Track & Return</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Photo verification</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Left Panel Footer */}
          <div className="pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between relative z-10">
            <span>Encrypted local session storage</span>
            <span className="font-semibold text-slate-300">LendSpace Trust Platform</span>
          </div>
        </div>

        {/* Right Panel: Form Area */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-10 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Form Mode Tabs: Sign In / Create Account */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex gap-4 text-sm font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 pb-3 -mb-3.5">
                  Sign In
                </span>
                <Link
                  to={`/auth/sign-up?role=${activeRole}&email=${encodeURIComponent(enteredEmail || '')}`}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Create Account
                </Link>
              </div>

              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Role: <strong className="capitalize">{activeRole}</strong>
              </span>
            </div>

            {/* Title & Prompt */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Enter your credentials to manage your {activeRole === 'user' ? 'bookings and gear' : 'resources and requests'}.
              </p>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1">
                  <p className="font-semibold">Authentication failed</p>
                  <p className="mt-0.5">{authError}</p>
                </div>
              </div>
            )}

            {/* Sign-In Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    placeholder="name@institution.edu"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-rose-400 focus:ring-rose-400/30'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/30 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(enteredEmail || '');
                      setForgotSuccess(false);
                      setForgotError(null);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    placeholder="Enter your password"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                      errors.password
                        ? 'border-rose-400 focus:ring-rose-400/30'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/30 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to {activeRole === 'user' ? 'Discover' : 'Owner Hub'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Institution SSO Button (Mock) */}
            <div className="space-y-3 pt-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  alert('Institution SSO is currently in demo simulation mode. Please use the demo accounts below or create an account with any .edu email.');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[10px] font-bold">
                  S
                </div>
                <span>Continue with Institution SSO</span>
                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Demo
                </span>
              </button>
            </div>

            {/* Switch Role Footer Link */}
            <div className="text-center pt-2">
              <Link
                to={`/get-started?mode=signin&email=${encodeURIComponent(enteredEmail || '')}`}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                <span>Need to manage resources instead of booking?</span>
                <span className="font-semibold underline">Switch role here</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Reset your password
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="font-bold text-sm">Reset link dispatched!</span>
                  </div>
                  <p>
                    A simulated password reset instructions link has been sent to{' '}
                    <strong className="font-mono">{forgotEmail}</strong>. Check your institutional inbox.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
                >
                  Close & Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendPasswordReset} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enter your registered email address and we&apos;ll send you a verified link to choose a new password.
                </p>

                {forgotError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {forgotError}
                  </p>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. yourname@university.edu"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
                  >
                    {forgotLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Reset Email</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
