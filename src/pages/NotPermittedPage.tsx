import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';

interface NotPermittedProps {
  requiredRole?: string;
}

export const NotPermittedPage: React.FC<NotPermittedProps> = ({ requiredRole }) => {
  const { currentUser, users, switchUser } = useAppStore();

  const suggestedUser = users.find((u) =>
    requiredRole ? u.role === requiredRole : u.role === 'manager' || u.role === 'admin'
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 mb-2">
          Access Restricted by Role
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          You are currently viewing LendSpace as <strong className="text-slate-800">{currentUser?.name}</strong> (<span className="capitalize">{currentUser?.role}</span>). This administration or review route requires elevated permissions ({requiredRole ? requiredRole.toUpperCase() : 'MANAGEMENT/ADMIN'}).
        </p>

        {suggestedUser && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left mb-6">
            <p className="text-xs font-semibold text-slate-700 mb-1">
              Want to test this feature right now?
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Switch to <strong>{suggestedUser.name}</strong> ({suggestedUser.role}) with 1 click:
            </p>
            <button
              onClick={() => switchUser(suggestedUser.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>Switch to {suggestedUser.name}</span>
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/discover"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Discover</span>
          </Link>
          <Link
            to="/bookings"
            className="flex-1 flex items-center justify-center py-2 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};
