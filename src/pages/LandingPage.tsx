import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { JadeSky } from '../components/ui/jade-sky';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Clock,
  Layers,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Sun,
  Moon,
  Menu,
  X,
  Calendar,
  Building,
  Award,
  Users,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Eye,
  Sliders,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, currentUser, signOut } = useAuthStore();
  const prefersReducedMotion = useReducedMotion();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAudienceTab, setActiveAudienceTab] = useState<'users' | 'owners'>('users');

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStart = (role?: 'user' | 'owner', mode: 'signin' | 'signup' = 'signup') => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (mode) params.set('mode', mode);
    navigate(`/get-started?${params.toString()}`);
  };

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5 },
      };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* 1. STICKY NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  Lend<span className="text-emerald-600 dark:text-emerald-400">Space</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Campus Sharing
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                How it works
              </button>
              <button
                onClick={() => scrollToSection('for-users')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                For users
              </button>
              <button
                onClick={() => scrollToSection('for-owners')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                For owners
              </button>
              <button
                onClick={() => scrollToSection('fair-access')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Fair access
              </button>
              <button
                onClick={() => scrollToSection('trust-and-safety')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Trust & safety
              </button>
            </nav>

            {/* Actions: Theme Toggle, Sign In, Get Started */}
            <div className="flex items-center gap-3">
              {/* Dark mode button */}
              <button
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {currentUser ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={currentUser.role === 'owner' ? '/owner/dashboard' : '/discover'}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    Open {currentUser.role === 'owner' ? 'Owner Hub' : 'Spaces'}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleStart(undefined, 'signin')}
                    className="hidden sm:inline-flex text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => handleStart(undefined, 'signup')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection('for-users')}
              className="block w-full text-left text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              For users
            </button>
            <button
              onClick={() => scrollToSection('for-owners')}
              className="block w-full text-left text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              For owners
            </button>
            <button
              onClick={() => scrollToSection('fair-access')}
              className="block w-full text-left text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Fair access
            </button>
            <button
              onClick={() => scrollToSection('trust-and-safety')}
              className="block w-full text-left text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Trust & safety
            </button>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => handleStart(undefined, 'signin')}
                className="flex-1 py-2 text-center text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Sign in
              </button>
              <button
                onClick={() => handleStart(undefined, 'signup')}
                className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-emerald-600 text-white"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-200/80 dark:border-slate-800/80">
        <JadeSky className="absolute inset-0 pointer-events-none opacity-45 dark:opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Academic Sharing Protocol</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Unlock underused <span className="text-emerald-600 dark:text-emerald-400">equipment</span> and{' '}
                <span className="text-teal-600 dark:text-teal-400">spaces</span>.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                A trusted, fair, and accountable sharing platform connecting researchers, students, and lab directors to maximize academic resource utilization with zero friction.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => handleStart(undefined, 'signup')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-colors shadow-sm"
                >
                  <span>See how it works</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified Credentials Only</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Before/After Condition Proofs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Fair-Use Allocation Caps</span>
                </div>
              </div>
            </div>

            {/* Right Stylized Card Stack (Zero external images, pure Tailwind + SVG) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                {/* Back Card (Timeline) */}
                <div className="absolute -top-6 -right-4 sm:-right-6 w-full rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 shadow-lg transform rotate-2 pointer-events-none">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-bold">Next Open Schedule</span>
                    <span className="text-emerald-600 font-semibold">Vacant Slot</span>
                  </div>
                  <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>

                {/* Middle Card (Main Resource Card) */}
                <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
                  {/* Mock Resource Visual */}
                  <div className="h-44 w-full rounded-2xl bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-800 p-4 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/20 rounded-full blur-xl" />
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                        High-Demand Tool
                      </span>
                      <span className="text-[10px] font-semibold text-slate-300">Lab Bench 04</span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="font-extrabold text-lg text-white">Prusa MK4 Rapid Prototyping</h3>
                      <p className="text-xs text-slate-300">0.4mm Nextruder • Active Air Filter</p>
                    </div>
                  </div>

                  {/* Requirements & Live Status Badge */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Auto-Approved</div>
                        <div className="text-[10px] text-slate-500">Prerequisite badge verified</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      Available Today
                    </span>
                  </div>

                  {/* Condition Checklist Micro-Timeline */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                      <span>Condition Audit Trail</span>
                      <span className="text-emerald-600 font-bold">100% Passed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Pre-check logged • Post-inspection clean • Deposit $0 held</span>
                    </div>
                  </div>
                </div>

                {/* Front Floating Notification Chip */}
                <div className="absolute -bottom-5 -left-4 sm:-left-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 shadow-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Tamper-Proof Audit</div>
                    <div className="text-[10px] text-slate-500">Logged to permanent ledger</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM STRIP */}
      <section className="py-12 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">73% Idle</span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Equipment Waste
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Specialized 3D printers, laser optics, and wet lab benches sit unutilized up to 18 hours per day.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">4.8x Cost</span>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                Rental Expense
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                External commercial equipment rentals drain student budgets when campus machines already exist.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">Zero Risk</span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Damage Protection
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Mandatory prerequisite certifications, check-in photos, and before/after inspection comparisons.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">Fair Play</span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Equitable Access
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Algorithmic weekly caps, automatic waitlist promotion, and priority scores prevent resource monopolization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. "HOW IT WORKS" (5 Visual Steps) */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Lifecycle Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How LendSpace Works in 5 Simple Steps
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            From equipment listing to verified return, every transition is governed by fair-use rules and transparent records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {[
            {
              step: '01',
              title: 'List & Set Rules',
              desc: 'Owners define equipment availability windows, safety badge requirements, and usage caps.',
              icon: Layers,
            },
            {
              step: '02',
              title: 'Discover & Search',
              desc: 'Users search by keyword or natural language intent with instant prerequisite pass/fail indicators.',
              icon: Compass,
            },
            {
              step: '03',
              title: 'Request & Verify',
              desc: 'Live conflict detection checks schedules; fair-use rules calculate priority scores.',
              icon: FileCheck,
            },
            {
              step: '04',
              title: 'Approve & Check In',
              desc: 'Managers approve requests; users capture pre-use condition checklists and verification photos.',
              icon: ShieldCheck,
            },
            {
              step: '05',
              title: 'Return & Review',
              desc: 'Side-by-side before vs after condition comparison confirms clean return and releases deposit holds.',
              icon: History,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl transition-all duration-200 relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. TWO-AUDIENCE SECTION ("For users" & "For owners") */}
      <section className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Built for Two Essential Roles
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tailored to Your Campus Mission
            </h2>
          </div>

          {/* Audience Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Users */}
            <div
              id="for-users"
              className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 p-8 shadow-sm hover:shadow-2xl transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4">
                  <Compass className="w-3.5 h-3.5" />
                  <span>For Students & Researchers</span>
                </div>

                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
                  Find and book the equipment you need.
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Skip the red tape and uncertain waiting times. Browse all available campus makerspace machinery with transparent prerequisites and instant auto-approval.
                </p>

                {/* Common Problems We Solve Panel */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 mb-6 space-y-3 text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block uppercase tracking-wider text-[11px]">
                    Common Problems We Solve For You:
                  </span>
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span><strong>High Cost:</strong> Renting or purchasing specialized tools outside university.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span><strong>Unknown Eligibility:</strong> Arriving at lab only to find you lack prerequisite certs.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span><strong>Unclear Status:</strong> Emails lost in supervisor inboxes without approval visibility.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span><strong>Hoarding:</strong> Popular tools perpetually booked by the same individuals.</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Instant eligibility evaluation based on training badges</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Fair-use priority scores and automatic waitlist auto-promotion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Photo check-in ensures you are never blamed for pre-existing wear</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStart('user', 'signup')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-colors"
              >
                <span>Get Started as User</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* For Owners */}
            <div
              id="for-owners"
              className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 dark:border-indigo-500/20 p-8 shadow-sm hover:shadow-2xl transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>For Lab Directors & Technicians</span>
                </div>

                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
                  Share your resources safely, stay in control.
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Maintain strict oversight over valuable machines, prevent unauthorized operation, and resolve equipment issues with transparent before/after photographic proof.
                </p>

                {/* Problems Owners Face Panel */}
                <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 mb-6 space-y-3 text-xs">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 block uppercase tracking-wider text-[11px]">
                    Problems Owners Face & How We Solve It:
                  </span>
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong>Misuse & Damage:</strong> Enforce mandatory training certs and technician supervision locks.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong>No Condition Records:</strong> Side-by-side photographic comparison for every checkout.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong>Scheduling Collisions:</strong> Live algorithmic conflict resolution and alternative slots.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong>Lack of Audit Trail:</strong> Immutable timestamped logging of every reservation and penalty.</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>Real-time KPI utilization charts, weekly volume, and response time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>AI advisory suggestions for pending requests, with final human decision</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>Direct incident resolution center with formal warnings and deposit holds</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStart('owner', 'signup')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 transition-colors"
              >
                <span>Get Started as Owner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURE GRID (8 Pillars) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Enterprise-Grade Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Engineered for High-Trust Lab Operations
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Everything institutions need to share expensive machinery safely and equitably.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Eligibility Verification',
              desc: 'Pure-function engine checks user training badges, safety certs, and expiration dates before permitting slots.',
              icon: Award,
            },
            {
              title: 'Adaptive Approval Modes',
              desc: 'Toggle between instant auto-approval for low-risk spaces or manual manager review for laser/wet labs.',
              icon: CheckCircle2,
            },
            {
              title: 'Fair-Use Allocation Caps',
              desc: 'Strict weekly hour quotas and fairness cooldowns prevent scarce resource hoarding across student cohorts.',
              icon: Sliders,
            },
            {
              title: 'Priority Waitlist Scoring',
              desc: 'Academic projects, thesis needs, and low prior usage rank higher on queues with auto-promotion on cancellation.',
              icon: TrendingUp,
            },
            {
              title: 'Before/After Evidence',
              desc: 'Mandatory pre-check condition checklist and side-by-side photographic return inspection.',
              icon: Eye,
            },
            {
              title: 'Incident & Damage Triage',
              desc: 'File damage, delay, or safety hazard reports. Owners resolve claims with formal written rationale and deposit holds.',
              icon: AlertTriangle,
            },
            {
              title: 'Automated Alerts',
              desc: 'Countdown session reminders, waitlist status updates, and automated overdue flags triggered on time passage.',
              icon: Clock,
            },
            {
              title: 'Tamper-Evident Audit Log',
              desc: 'Every actor action, rationale, and timestamp is permanently recorded and exportable to CSV.',
              icon: History,
            },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-emerald-500/40 hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{feat.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. TRUST AND FAIRNESS SECTION */}
      <section
        id="trust-and-safety"
        className="py-16 bg-slate-900 text-slate-200 border-t border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accountability & Human Oversight</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">
                "AI Suggests, People Decide."
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                While LendSpace runs heuristic algorithms to detect schedule conflicts and score academic priority, all disciplinary penalties, equipment rejections, and credential grants are strictly executed by human staff with mandatory written rationales.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1">
                  <span className="font-bold text-white block">Zero External Telemetry</span>
                  <span className="text-slate-400">
                    All session tokens, credentials, and condition photos live privately inside browser memory and localStorage.
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1">
                  <span className="font-bold text-white block">Full Exportable Audit Trail</span>
                  <span className="text-slate-400">
                    Compliance officers and faculty can export complete CSV records of all reservations and safety sign-offs.
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-800/80 rounded-3xl p-6 border border-slate-700 text-xs space-y-4">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                Safety Guarantee Checklist:
              </span>
              <div className="space-y-2.5 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span>Mandatory safety orientation badge before booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span>Pre-session condition photo upload & checklist</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span>Technician supervision required for hazardous tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span>Penalties require documented owner justification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA BANNER */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to share or book makerspace equipment?
          </h2>
          <p className="text-base text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Experience the modern public entry workflow. Select your role to access customized onboarding and discover shared facilities.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleStart(undefined, 'signup')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-900 hover:bg-emerald-50 font-extrabold text-sm shadow-2xl transition-all hover:-translate-y-0.5"
            >
              <span>Get Started with LendSpace</span>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  Lend<span className="text-emerald-600">Space</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  Makerspace Sharing Protocol
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Trusted platform for sharing underused equipment and research spaces in universities, labs, and makerspaces.
              </p>
              <div className="text-[11px] text-slate-400">
                Built for University Innovation & Academic Resource Equity.
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="hover:text-emerald-600">
                    How It Works
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('for-users')} className="hover:text-emerald-600">
                    For Users
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('for-owners')} className="hover:text-emerald-600">
                    For Owners
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('trust-and-safety')} className="hover:text-emerald-600">
                    Trust & Safety
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">
                Access & Security
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/get-started?mode=signin" className="hover:text-emerald-600">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/get-started?mode=signup" className="hover:text-emerald-600">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-emerald-600">
                    Privacy Notice
                  </Link>
                </li>
                <li>
                  <Link to="/audit" className="hover:text-emerald-600">
                    Public Audit Log
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <span>&copy; {new Date().getFullYear()} LendSpace Initiative. All rights reserved.</span>
            <span>Frontend-Only Architecture • Persisted in Browser Memory</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
