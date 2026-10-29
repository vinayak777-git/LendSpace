import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, UserCheck, Sparkles, Compass, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { AppRole } from '../../types';

interface AccessDeniedPageProps {
  requiredPortal: 'Booker' | 'Owner';
  targetRole: AppRole;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  requiredPortal,
  targetRole,
}) => {
  const { currentUser: authUser } = useAuthStore();

  const userRole = authUser?.role || 'user';
  const isOwnerTryingToBook = userRole === 'owner' || userRole === 'manager';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md shadow-amber-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <span>Portal Access Notice</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            This area is for {requiredPortal}s
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            You are currently signed in with <strong className="capitalize text-slate-800 dark:text-slate-200">{userRole}</strong> permissions. To access this workspace, please switch to your designated portal.
          </p>
        </div>

        {/* Action Button to own portal */}
        <div className="space-y-3 pt-2">
          {isOwnerTryingToBook ? (
            <Link
              to="/owner"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Go to Owner Portal (/owner)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/app"
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Go to Booker Portal (/app)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Switch Account */}
          <div className="pt-2">
            <Link
              to={`/auth/sign-in?role=${targetRole}`}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sign in with a {requiredPortal} account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
