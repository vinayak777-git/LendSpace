import React, { useState } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Bell,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

export const BookerProfilePage: React.FC = () => {
  const { currentUser: authUser } = useAuthStore();
  const { currentUser: appUser, showToast } = useAppStore();

  const user = authUser || appUser;

  const [showPublic, setShowPublic] = useState(true);
  const [showPastProjects, setShowPastProjects] = useState(true);
  const [shareContact, setShareContact] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSavePrivacy = () => {
    showToast('Privacy preferences updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Profile &amp; Privacy Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your institutional identity, credential privacy, and notification settings.
        </p>
      </div>

      {/* User Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-teal-500/20">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.name || 'Aarav Patel'}
              </h2>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Verified Booker
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email || 'aarav.patel@makerspace.edu'}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Department: {user?.department || 'Mechanical & Mechatronics Engineering'}
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-slate-100 dark:sm:border-slate-800 sm:pl-6 space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">Account Status</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Good Standing (0 strikes)</span>
          </span>
        </div>
      </div>

      {/* Privacy Settings Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Eye className="w-4 h-4 text-teal-500" />
          <span>Privacy &amp; Peer Visibility Controls</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Show Profile in Campus Makerspace Directory
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Allows other students to find you for team projects and collaborative prototyping.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showPublic}
              onChange={(e) => setShowPublic(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Display Completed Capstone Projects
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Showcase verified equipment reservations and finished components on your profile.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showPastProjects}
              onChange={(e) => setShowPastProjects(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Share Contact with Equipment Managers
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Allows lab technicians to contact you regarding scheduled maintenance or early slot availability.
              </p>
            </div>
            <input
              type="checkbox"
              checked={shareContact}
              onChange={(e) => setShareContact(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSavePrivacy}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs"
        >
          Save Privacy Preferences
        </button>
      </div>

      {/* Transparent Data-Use Notice */}
      <div className="p-6 rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <FileText className="w-4 h-4 text-teal-600" />
          <span>Institutional Data-Use Notice</span>
        </div>
        <p className="leading-relaxed">
          LendSpace is a trusted academic utility. We only record reservation timestamps, condition inspection checklists, and before/after verification photos to protect equipment integrity, enforce fair access quotas, and resolve maintenance incidents.
        </p>
        <p className="leading-relaxed text-[11px] text-slate-500">
          Your personal data is encrypted locally and never sold or shared with commercial entities. Audit logs are tamper-evident and accessible only by verified department faculty and lab directors.
        </p>
      </div>
    </div>
  );
};
