import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RotateCcw, ShieldCheck, Heart, Database, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const { users, currentUser, switchUser, resetDemoData } = useAppStore();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900">
                Lend<span className="text-emerald-600">Space</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                Frontend-Only Architecture
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              A high-trust makerspace and specialized lab reservation platform. Employs pure-function eligibility validation, fair-use allocation algorithms, before/after condition verification, and tamper-evident audit logging.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>All application states and audit records are persisted in browser localStorage.</span>
            </div>
          </div>

          {/* Quick Role Switcher */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Role & Portal Modes
            </h4>
            <div className="space-y-2">
              <Link
                to="/app"
                className="w-full text-left text-xs p-2.5 rounded-xl border flex items-center justify-between transition-colors bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              >
                <div>
                  <span className="block font-bold">🔍 Booker Portal</span>
                  <span className="text-[10px] text-slate-500 font-normal">Look for available spaces & reserve</span>
                </div>
              </Link>

              <Link
                to="/owner"
                className="w-full text-left text-xs p-2.5 rounded-xl border flex items-center justify-between transition-colors bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              >
                <div>
                  <span className="block font-bold">🏢 Owner Portal</span>
                  <span className="text-[10px] text-slate-500 font-normal">Manage listings & resolve requests</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Platform Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Environment Controls
            </h4>
            <button
              onClick={() => setShowConfirmReset(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
            <div className="text-[11px] text-slate-400 leading-snug">
              Resets all 8 resources, bookings, waitlists, incidents, and credentials to clean initial seed states.
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link to="/audit" className="text-slate-500 hover:text-emerald-600 font-medium">
                System Audit Log
              </Link>
              <Link to="/profile" className="text-slate-500 hover:text-emerald-600 font-medium">
                Privacy Notice
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>&copy; {new Date().getFullYear()} LendSpace Makerspace Initiative. Built for university laboratory sharing.</span>
          <span className="flex items-center gap-1">
            Engineered with React 18, Vite, TypeScript & Tailwind CSS
          </span>
        </div>
      </div>

      {/* Confirmation Dialog for Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-slate-900 mb-2">
              Reset Demo Environment?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              This will overwrite your browser's localStorage and restore original seed bookings, incidents, and initial credential statuses.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setShowConfirmReset(false);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
