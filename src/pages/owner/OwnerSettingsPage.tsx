import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Clock,
  Bell,
  ShieldCheck,
  Save,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { logEvent } from '../../services/auditService';

export const OwnerSettingsPage: React.FC = () => {
  const { showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [facilityName, setFacilityName] = useState('Center for Prototyping & Advanced Fabrication');
  const [department, setDepartment] = useState('College of Engineering');
  const [custodianEmail, setCustodianEmail] = useState('makerspace-head@university.edu');
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('20:00');
  const [weekendAccess, setWeekendAccess] = useState(true);

  // Notification toggles
  const [notifyOnNewBooking, setNotifyOnNewBooking] = useState(true);
  const [notifyOnOverdue, setNotifyOnOverdue] = useState(true);
  const [notifyOnDispute, setNotifyOnDispute] = useState(true);

  // Financial Escrow
  const [escrowHoldDays, setEscrowHoldDays] = useState(3);
  const [autoReleaseClean, setAutoReleaseClean] = useState(true);
  const [autoPauseOnCriticalDamage, setAutoPauseOnCriticalDamage] = useState(true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logEvent(
        {
          id: authUser?.id || 'owner-1',
          name: authUser?.name || 'Owner',
          role: authUser?.role || 'owner',
        },
        'FACILITY_SETTINGS_UPDATED',
        'facility-config',
        'settings',
        `Updated settings for ${facilityName}: Operating ${openingTime}-${closingTime}, Escrow Hold ${escrowHoldDays}d.`
      );
      showToast('Facility settings saved and operating policies updated.', 'success');
    } catch {
      showToast('Failed to save settings.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 mb-2">
            <Settings className="w-3.5 h-3.5 text-emerald-600" />
            <span>Facility Operational Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Facility & Governance Settings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Configure laboratory operating hours, notification alerts, and security deposit escrow rules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Section 1: Facility Identity */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Facility Identity & Custodian Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Facility / Lab Name
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Host Department / Institute
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary Custodian Contact Email
            </label>
            <input
              type="email"
              value={custodianEmail}
              onChange={(e) => setCustodianEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Section 2: Operating Hours */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Default Facility Operating Hours
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Facility Opens
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Facility Closes
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={weekendAccess}
              onChange={(e) => setWeekendAccess(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Allow Weekend Reservations (Saturday & Sunday)
              </span>
              <span className="text-[11px] text-slate-500">
                Authorized students with keycard clearance can schedule weekend self-service access.
              </span>
            </div>
          </label>
        </div>

        {/* Section 3: Escrow & Damage Safety */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Security Deposit Escrow & Damage Protection
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Escrow Hold Duration After Return (Days)
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={escrowHoldDays}
                onChange={(e) => setEscrowHoldDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2 pt-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReleaseClean}
                  onChange={(e) => setAutoReleaseClean(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  Auto-release deposit immediately upon clean manager return sign-off
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPauseOnCriticalDamage}
                  onChange={(e) => setAutoPauseOnCriticalDamage(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  Auto-pause equipment listing if critical safety incident is logged
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Notification Alerts */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Bell className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Notification Triggers
            </h2>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                Notify custodian on new pending reservation requests
              </span>
              <input
                type="checkbox"
                checked={notifyOnNewBooking}
                onChange={(e) => setNotifyOnNewBooking(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                Instant high-priority notification when equipment is 30 mins overdue
              </span>
              <input
                type="checkbox"
                checked={notifyOnOverdue}
                onChange={(e) => setNotifyOnOverdue(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                Notify on new safety dispute or damaged equipment check-in
              </span>
              <input
                type="checkbox"
                checked={notifyOnDispute}
                onChange={(e) => setNotifyOnDispute(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
