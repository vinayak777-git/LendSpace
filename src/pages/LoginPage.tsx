import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  UserPlus,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Hero */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Makerspace & Research Lab Sharing Platform</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Welcome to <span className="text-emerald-600">LendSpace</span>
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed font-medium">
          Choose your account portal to sign in or create a new account.
        </p>
      </div>

      {/* Looker vs Owner Cards */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* BOOKER / LOOKER CARD */}
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-white hover:border-emerald-600 hover:shadow-2xl transition-all duration-200 p-8 flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-xs">
              <Compass className="w-7 h-7" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Booker Portal</h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Explorer / Borrower
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Search and reserve lab spaces, 3D printers, laser cutters, and specialized research facilities.
            </p>

            <div className="space-y-3 text-xs text-slate-700 mb-6">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Search available makerspace equipment and rooms</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Verify prerequisite safety badges and weekly caps</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Perform check-in safety checklists & return reports</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/auth/sign-in?role=user')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <span>Sign In as Booker</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/auth/sign-up?role=user')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-2xl border border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/60 text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New Booker Account</span>
            </button>
          </div>
        </div>

        {/* OWNER CARD */}
        <div className="rounded-3xl border-2 border-rose-500/40 bg-white hover:border-rose-600 hover:shadow-2xl transition-all duration-200 p-8 flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Owner Portal</h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Host / Lab Director
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Oversee lab spaces, review equipment damages, inspect condition evidence, and resolve incidents.
            </p>

            <div className="space-y-3 text-xs text-slate-700 mb-6">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold text-rose-950">
                  See reported damages, delays, and before/after photos
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold text-rose-950">
                  Resolve incident claims with formal reasons & penalties
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>Manage space availability, pause toggles & review queue</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/auth/sign-in?role=owner')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-rose-600 transition-colors shadow-lg"
            >
              <span>Sign In as Owner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/auth/sign-up?role=owner')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-2xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/60 text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Owner Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Informational Footer */}
      <div className="max-w-4xl w-full bg-slate-900 text-slate-300 rounded-2xl p-6 shadow-xl border border-slate-800 text-xs">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white text-sm block">
              Production Database & Authentication Architecture
            </span>
            <p className="text-slate-400 leading-relaxed">
              LendSpace uses database-backed persistence with Argon2 password hashing and JWT role-based access control. All user accounts and bookings are securely isolated per user and owner authorization rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
