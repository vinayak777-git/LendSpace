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
  User as UserIcon,
  Phone,
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
  ArrowLeftRight,
  School,
  Briefcase,
  Layers,
  Check,
  Info,
  Sliders,
  Wrench,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AppRole } from '../types';

const INSTITUTIONS = [
  'Stanford Robotics & Fabrication Institute',
  'MIT Media Lab & Prototyping Consortium',
  'Berkeley Advanced Bioengineering Center',
  'Caltech Materials & Optics Foundry',
  'Carnegie Mellon Autonomous Systems Hub',
  'Other / Regional Research Entity',
];

const USER_INTENTS = [
  'Projects & Prototyping',
  'Academic Research',
  'Startup MVP Build',
  'Coursework & Labs',
  'Media & Content Creation',
];

const BOOKER_NEED_CATEGORIES = [
  '3D Printers',
  'Laser Cutters',
  'Electronics & PCB Benches',
  'Meeting & Studio Space',
  'Cleanrooms & Wet Labs',
  'High-End GPU Nodes',
  'Cameras & Studio Equipment',
  'Hand Tools & Power Kits',
];

const BOOKER_USAGE_TIMELINES = [
  '2-3 times per week',
  'Daily intensive sprint',
  'Weekly regular access',
  'One-off prototype build',
  'Ongoing startup / thesis research',
];

const OWNER_ORG_TYPES = [
  'College',
  'Lab',
  'Makerspace',
  'Community org',
  'Small business',
];

const OWNER_RESOURCE_CATEGORIES = [
  '3D Printers',
  'Laser Cutters',
  'CNC Mills',
  'VR Suites',
  'Chemistry Hoods',
  'Electronics Benches',
  'Autoclaves & Bio-Analyzers',
];

const signUpSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid academic/institutional email'),
    phone: z.string().min(6, 'Please enter a valid phone number (at least 6 digits)'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    institution: z.string().min(1, 'Please select your institution'),
    // Booker fields
    department: z.string().optional(),
    projectPurpose: z.string().optional(),
    usageTimeline: z.string().optional(),
    specialRequirements: z.string().optional(),
    studentId: z.string().optional(),
    // Owner fields
    orgType: z.string().optional(),
    jobTitle: z.string().optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms of service and privacy notice',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    currentUser,
    selectedRole,
    setRole,
    signUp,
    intendedRoute,
    setIntendedRoute,
    darkMode,
    toggleDarkMode,
  } = useAuthStore();

  const roleParam = searchParams.get('role') as AppRole | null;
  const emailParam = searchParams.get('email') || '';

  const activeRole: AppRole =
    roleParam === 'user' || roleParam === 'owner'
      ? roleParam
      : selectedRole || 'user';

  // If role neither in URL nor store, redirect to /get-started
  useEffect(() => {
    if (!roleParam && !selectedRole) {
      navigate('/get-started?mode=signup', { replace: true });
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState(false);
  const [isSuccessModal, setIsSuccessModal] = useState(false);

  // Extra state: Multi-select chips
  const [selectedIntents, setSelectedIntents] = useState<string[]>(['Projects & Prototyping']);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([
    '3D Printers',
    'Laser Cutters',
  ]);
  const [selectedOwnerCategories, setSelectedOwnerCategories] = useState<string[]>([
    '3D Printers',
    'Laser Cutters',
  ]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: emailParam,
      phone: '',
      password: '',
      confirmPassword: '',
      institution: INSTITUTIONS[0],
      department: '',
      projectPurpose: '',
      usageTimeline: BOOKER_USAGE_TIMELINES[0],
      specialRequirements: '',
      studentId: '',
      orgType: OWNER_ORG_TYPES[0],
      jobTitle: '',
      termsAccepted: false as unknown as true,
    },
  });

  const enteredEmail = watch('email');
  const watchedPassword = watch('password') || '';

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 15;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;
    return Math.min(score, 100);
  };

  const strengthScore = calculatePasswordStrength(watchedPassword);
  const getStrengthLabel = (score: number) => {
    if (score < 30) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (score < 60) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
    if (score < 80) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' };
    return { label: 'Strong & Secure', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };
  const strengthInfo = getStrengthLabel(strengthScore);

  const toggleIntent = (intent: string) => {
    if (selectedIntents.includes(intent)) {
      if (selectedIntents.length > 1) {
        setSelectedIntents(selectedIntents.filter((i) => i !== intent));
      }
    } else {
      setSelectedIntents([...selectedIntents, intent]);
    }
  };

  const toggleNeedCategory = (need: string) => {
    if (selectedNeeds.includes(need)) {
      if (selectedNeeds.length > 1) {
        setSelectedNeeds(selectedNeeds.filter((n) => n !== need));
      }
    } else {
      setSelectedNeeds([...selectedNeeds, need]);
    }
  };

  const toggleOwnerCategory = (cat: string) => {
    if (selectedOwnerCategories.includes(cat)) {
      if (selectedOwnerCategories.length > 1) {
        setSelectedOwnerCategories(selectedOwnerCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedOwnerCategories([...selectedOwnerCategories, cat]);
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signUp({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: activeRole,
        institution: data.institution,
        department: data.department,
        studentId: data.studentId,
        useIntents: selectedIntents,
        primaryNeeds: selectedNeeds,
        projectPurpose: data.projectPurpose,
        usageTimeline: data.usageTimeline,
        specialRequirements: data.specialRequirements,
        orgType: data.orgType,
        jobTitle: data.jobTitle,
        resourceCategories: selectedOwnerCategories,
      });

      setIsSuccessModal(true);
      // Wait 1.8 seconds to display success banner, then redirect
      setTimeout(() => {
        if (intendedRoute) {
          const dest = intendedRoute;
          setIntendedRoute(null);
          navigate(dest);
        } else {
          navigate(activeRole === 'owner' ? '/owner' : '/app');
        }
      }, 1600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create account';
      setAuthError(message);
      setIsSubmitting(false);
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
              to={`/get-started?mode=signup&email=${encodeURIComponent(enteredEmail || '')}`}
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
        {/* Left Panel: Role Context */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
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
                  <span>Joining as Resource Booker</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Joining as Resource Owner / Custodian</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {activeRole === 'user'
                ? 'Find and book the equipment you need.'
                : 'Share your resources safely, stay in control.'}
            </h1>

            <p className="text-sm text-slate-300">
              {activeRole === 'user'
                ? 'Create your LendSpace account to reserve cleanrooms, 3D printing labs, and specialized test gear across member departments.'
                : 'Register your lab or makerspace to optimize machine utilization, track maintenance logs, and manage requests with human oversight.'}
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

            {/* Platform Advantages */}
            <div className={`space-y-6 ${mobileAccordionOpen ? 'block' : 'hidden lg:block'}`}>
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
                        <strong className="text-white">Zero Badge Policy:</strong> No certificates, safety badges, or faculty PI approvals required to reserve equipment.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Just Basic Details:</strong> Share your contact info and project requirements, and start using tools immediately.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Direct Reservation:</strong> Instant slot reservation across 3D printers, laser cutters, cleanrooms, and studio labs.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Transparent &amp; Fair:</strong> Clear rental prices, live schedules, and fair allocation buffers.
                      </div>
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Misuse and damage:</strong> Before/after photographic check-in records and deposit escrow guarantees.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Unclear custody:</strong> Live dashboard showing exact borrower identity, return deadlines, and supervisors.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">No condition records:</strong> Standardized digital checklists with timestamped photo uploads.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Scheduling conflicts:</strong> Automated buffer intervals prevent booking overlaps and allow reset time.
                      </div>
                    </li>
                  </ul>
                )}
              </div>

              {/* 3-Step Lifecycle */}
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {activeRole === 'user' ? 'How booking works' : 'How listing works'}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {activeRole === 'user' ? (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">STEP 1</span>
                        <span className="text-xs font-semibold text-white block">Tell Us Needs</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Basic info &amp; tools</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">STEP 2</span>
                        <span className="text-xs font-semibold text-white block">Discover</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Find labs &amp; gear</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">STEP 3</span>
                        <span className="text-xs font-semibold text-white block">Direct Reserve</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Zero badge barriers</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-teal-400 block mb-0.5">STEP 1</span>
                        <span className="text-xs font-semibold text-white block">List & Set</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Usage conditions</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-teal-400 block mb-0.5">STEP 2</span>
                        <span className="text-xs font-semibold text-white block">Review</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">1-click approve</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <span className="text-[10px] font-bold text-teal-400 block mb-0.5">STEP 3</span>
                        <span className="text-xs font-semibold text-white block">Track & Return</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Condition signoff</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between relative z-10">
            <span>Academic Trust & Fair Sharing Protocol</span>
            <span className="font-semibold text-slate-300">LendSpace</span>
          </div>
        </div>

        {/* Right Panel: Role-Aware Registration Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-xl w-full mx-auto space-y-6">
            {/* Form Mode Tabs: Sign In / Create Account */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex gap-4 text-sm font-semibold">
                <Link
                  to={`/auth/sign-in?role=${activeRole}&email=${encodeURIComponent(enteredEmail || '')}`}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <span className="text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 pb-3 -mb-3.5">
                  Create Account
                </span>
              </div>

              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Registering as: <strong className="capitalize">{activeRole}</strong>
              </span>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Create your LendSpace account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Join our verified institutional community to {activeRole === 'user' ? 'reserve high-demand lab spaces' : 'list equipment and track bookings'}.
              </p>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1">
                  <p className="font-semibold">Registration Issue</p>
                  <p className="mt-0.5">{authError}</p>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="e.g. Dr. Priya Sharma"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                        errors.name
                          ? 'border-rose-400 focus:ring-rose-400/30'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/30 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Academic / Work Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="e.g. p.sharma@stanford.edu"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                        errors.email
                          ? 'border-rose-400 focus:ring-rose-400/30'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/30 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Phone Number & Institution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="e.g. +91 98765 43210"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                        errors.phone
                          ? 'border-rose-400 focus:ring-rose-400/30'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/30 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Institution or Organization *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <School className="w-4 h-4" />
                    </div>
                    <select
                      {...register('institution')}
                      className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    >
                      {INSTITUTIONS.map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.institution && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{errors.institution.message}</p>
                  )}
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password with Strength Meter */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="Min 8 characters"
                      className={`w-full pl-9 pr-10 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                        errors.password
                          ? 'border-rose-400 focus:ring-rose-400/30'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/30 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength Bar */}
                  {watchedPassword.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strengthInfo.color}`}
                          style={{ width: `${strengthScore}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Strength:</span>
                        <span className={`font-semibold ${strengthInfo.text}`}>
                          {strengthInfo.label}
                        </span>
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder="Re-type password"
                      className={`w-full pl-9 pr-10 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                        errors.confirmPassword
                          ? 'border-rose-400 focus:ring-rose-400/30'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500/30 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* ROLE SPECIFIC EXTRAS */}
              {activeRole === 'user' ? (
                /* BOOKER GENERAL DETAILS & REQUIREMENTS */
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <Sliders className="w-4 h-4" />
                    <span>Your Project &amp; Resource Requirements</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Department / Major
                      </label>
                      <input
                        type="text"
                        {...register('department')}
                        placeholder="e.g. Mechanical &amp; Automation"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Expected Usage Frequency
                      </label>
                      <select
                        {...register('usageTimeline')}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      >
                        {BOOKER_USAGE_TIMELINES.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Multi-select chips for Equipment/Spaces needed */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      What equipment or spaces do you need? <span className="text-slate-400 font-normal">(Select multiple)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {BOOKER_NEED_CATEGORIES.map((cat) => {
                        const isSelected = selectedNeeds.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleNeedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline-block mr-1 stroke-[3]" />}
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Project Purpose / Requirements input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Project Purpose &amp; Requirements
                    </label>
                    <input
                      type="text"
                      {...register('projectPurpose')}
                      placeholder="e.g. Prototyping a drone chassis and testing micro-controllers for semester project"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  {/* Zero-barrier Callout */}
                  <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>No badges or approvals required:</strong> Completing your basic details and requirements gives you instant access to view and reserve spaces and equipment across LendSpace.
                    </p>
                  </div>
                </div>
              ) : (
                /* OWNER EXTRAS */
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Organisation / Facility Type
                      </label>
                      <select
                        {...register('orgType')}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      >
                        {OWNER_ORG_TYPES.map((org) => (
                          <option key={org} value={org}>
                            {org}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Job Title / Role
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          {...register('jobTitle')}
                          placeholder="e.g. Lab Director, Lead Technician"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resource categories chips */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Resource categories you plan to list <span className="text-slate-400 font-normal">(Select multiple)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {OWNER_RESOURCE_CATEGORIES.map((cat) => {
                        const isSelected = selectedOwnerCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleOwnerCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline-block mr-1 stroke-[3]" />}
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Terms and Privacy Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    {...register('termsAccepted')}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span>
                    I agree to the LendSpace{' '}
                    <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: By joining LendSpace you agree to adhere to equipment care standards, fair usage quotas, and prompt return protocols.'); }} className="text-emerald-600 dark:text-emerald-400 underline">
                      Terms of Service
                    </a>{' '}
                    and acknowledge the institutional{' '}
                    <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy: All equipment reservation history and condition logs are stored securely for safety, audit trails, and departmental resource planning.'); }} className="text-emerald-600 dark:text-emerald-400 underline">
                      Privacy Policy
                    </a>.
                  </span>
                </label>
                {errors.termsAccepted && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                    {errors.termsAccepted.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete {activeRole === 'user' ? 'Booker' : 'Owner'} Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Privacy Transparency Callout */}
            <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                🔒 Privacy &amp; Data Transparency:
              </span>
              <p>
                We only collect your name, institution email, and department to verify booking credentials, maintain transparent equipment custody logs, and enforce safety quotas. We never sell your personal data.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Account Created Success Overlay */}
      {isSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Account Created!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Welcome to LendSpace. Redirecting you to your{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {activeRole === 'owner' ? 'Owner Portal' : 'Discovery Dashboard'}
                </span>...
              </p>
            </div>
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto pt-2" />
          </div>
        </div>
      )}
    </div>
  );
};
