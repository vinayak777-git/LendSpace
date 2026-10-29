import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Calculator,
  Save,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { logEvent } from '../../services/auditService';

export const OwnerFairUsePage: React.FC = () => {
  const { showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  // Fair-Use Configuration State
  const [weeklyCapHours, setWeeklyCapHours] = useState(12);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14);
  const [maxStrikes, setMaxStrikes] = useState(3);
  const [autoWaitlistPromotion, setAutoWaitlistPromotion] = useState(true);

  // Scoring Weights
  const [academicWeight, setAcademicWeight] = useState(25);
  const [badgeWeight, setBadgeWeight] = useState(15);
  const [usagePenaltyWeight, setUsagePenaltyWeight] = useState(5);
  const [waitBoostWeight, setWaitBoostWeight] = useState(10);

  // Interactive Live Simulator State
  const [simAcademic, setSimAcademic] = useState(true);
  const [simHoursUsed, setSimHoursUsed] = useState(4);
  const [simHasBadge, setSimHasBadge] = useState(true);
  const [simWaitDays, setSimWaitDays] = useState(2);

  // Live calculation based on weights
  const simScore = Math.max(
    0,
    Math.min(
      100,
      50 +
        (simAcademic ? academicWeight : 0) +
        (simHasBadge ? badgeWeight : 0) -
        simHoursUsed * usagePenaltyWeight +
        simWaitDays * waitBoostWeight
    )
  );

  const handleSavePolicy = async () => {
    try {
      await logEvent(
        {
          id: authUser?.id || 'owner-1',
          name: authUser?.name || 'Owner',
          role: authUser?.role || 'owner',
        },
        'FAIR_USE_POLICY_UPDATED',
        'policy-fair-use',
        'policy',
        `Updated fair-use rules: Weekly Cap ${weeklyCapHours}h, Cooldown ${cooldownHours}h, Academic Weight +${academicWeight}pts.`
      );
      showToast('Fair-use governance parameters saved and applied campus-wide.', 'success');
    } catch {
      showToast('Failed to save policy.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 mb-2">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>Campus Anti-Monopolization Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Fair-Use & Allocation Rules
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Configure hourly quotas, priority weighting algorithms, and automated waitlist promotion parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSavePolicy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
        >
          <Save className="w-4 h-4" />
          <span>Save Policy Parameters</span>
        </button>
      </div>

      {/* 2-Column Grid: Governance Controls on Left, Interactive Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Policy Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Quota Caps */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              1. Individual Quotas & Cooldown Windows
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Weekly Hour Cap Per Student
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={4}
                    max={30}
                    value={weeklyCapHours}
                    onChange={(e) => setWeeklyCapHours(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="w-12 text-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 py-1 rounded-lg">
                    {weeklyCapHours} hrs
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Students cannot book more than {weeklyCapHours} hours across equipment per calendar week.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cooldown Between Reservations
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={48}
                    step={6}
                    value={cooldownHours}
                    onChange={(e) => setCooldownHours(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="w-12 text-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 py-1 rounded-lg">
                    {cooldownHours} hrs
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Enforces mandatory spacing before the same student can book the same tool again.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Advance Booking Window (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={maxAdvanceDays}
                  onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Late Return / Violation Strike Threshold
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={maxStrikes}
                  onChange={(e) => setMaxStrikes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Priority Algorithm Weights */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              2. Priority Score Weighting Factors (Base: 50 pts)
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Capstone / Accredited Research Project Boost</span>
                  <span className="text-emerald-600 font-extrabold">+{academicWeight} pts</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={academicWeight}
                  onChange={(e) => setAcademicWeight(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Safety Qualification Badge Holder Bonus</span>
                  <span className="text-teal-600 font-extrabold">+{badgeWeight} pts</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={badgeWeight}
                  onChange={(e) => setBadgeWeight(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Usage Degradation Penalty (Per hour booked this week)</span>
                  <span className="text-rose-600 font-extrabold">-{usagePenaltyWeight} pts/hr</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={usagePenaltyWeight}
                  onChange={(e) => setUsagePenaltyWeight(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Priority Score Simulator */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Interactive Priority Simulator</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
            <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Calculated Priority Score
              </span>
              <div className="text-4xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {simScore}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">out of 100 max</span>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">Academic Capstone Project?</span>
                <input
                  type="checkbox"
                  checked={simAcademic}
                  onChange={(e) => setSimAcademic(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">Verified Safety Badge?</span>
                <input
                  type="checkbox"
                  checked={simHasBadge}
                  onChange={(e) => setSimHasBadge(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <div>
                <span className="text-slate-700 dark:text-slate-300 block mb-1">
                  Hours Booked Already This Week: {simHoursUsed}h
                </span>
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={simHoursUsed}
                  onChange={(e) => setSimHoursUsed(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <span className="text-slate-700 dark:text-slate-300 block mb-1">
                  Days Waiting in Queue: {simWaitDays}d
                </span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={simWaitDays}
                  onChange={(e) => setSimWaitDays(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            {/* Breakdown table */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Base Neutral Score:</span>
                <span>50 pts</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Academic Boost:</span>
                <span className={simAcademic ? 'text-emerald-600 font-bold' : ''}>
                  +{simAcademic ? academicWeight : 0} pts
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Badge Bonus:</span>
                <span className={simHasBadge ? 'text-teal-600 font-bold' : ''}>
                  +{simHasBadge ? badgeWeight : 0} pts
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Usage Penalty:</span>
                <span className="text-rose-600 font-bold">
                  -{simHoursUsed * usagePenaltyWeight} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
