import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  User as UserIcon,
  School,
  Clock,
  Layers,
  Check,
  Save,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';

const RESOURCE_NEED_OPTIONS = [
  '3D Printers',
  'Laser Cutters',
  'Electronics & PCB Benches',
  'Meeting & Studio Space',
  'Cleanrooms & Wet Labs',
  'High-End GPU Nodes',
  'Cameras & Studio Equipment',
  'Hand Tools & Power Kits',
];

const TIMELINE_OPTIONS = [
  '2-3 times per week',
  'Daily intensive sprint',
  'Weekly regular access',
  'One-off prototype build',
  'Ongoing startup / research',
];

export const BookerRequirementsPage: React.FC = () => {
  const { currentUser: authUser, updateBookerRequirements } = useAuthStore();
  const { showToast } = useAppStore();

  const [phone, setPhone] = useState(authUser?.phone || '');
  const [department, setDepartment] = useState(authUser?.department || '');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(
    authUser?.primaryNeeds || authUser?.useIntents || ['3D Printers', 'Laser Cutters']
  );
  const [projectPurpose, setProjectPurpose] = useState(
    authUser?.projectPurpose || ''
  );
  const [usageTimeline, setUsageTimeline] = useState(
    authUser?.usageTimeline || TIMELINE_OPTIONS[0]
  );
  const [specialRequirements, setSpecialRequirements] = useState(
    authUser?.specialRequirements || ''
  );
  const [isSaved, setIsSaved] = useState(false);

  const toggleNeed = (need: string) => {
    if (selectedNeeds.includes(need)) {
      if (selectedNeeds.length > 1) {
        setSelectedNeeds(selectedNeeds.filter((n) => n !== need));
      }
    } else {
      setSelectedNeeds([...selectedNeeds, need]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    updateBookerRequirements({
      phone: phone.trim() || undefined,
      department: department.trim() || undefined,
      primaryNeeds: selectedNeeds,
      projectPurpose: projectPurpose.trim() || 'General academic & fabrication projects',
      usageTimeline,
      specialRequirements: specialRequirements.trim() || undefined,
    });

    setIsSaved(true);
    showToast('Your requirements and contact details have been updated.', 'success');
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct Access Profile</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            My Project Requirements &amp; Details
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            LendSpace operates on open, fair-sharing principles. We do not require badges, certification tests, or faculty PI sign-offs. Your basic details and requirements give you direct access to all equipment and spaces.
          </p>
        </div>
      </div>

      {/* Zero-Badge Policy Guarantee Card */}
      <div className="p-5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 shadow-xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            100% Direct Booking Active
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Your registered status enables you to reserve 3D printers, laser cutters, cleanrooms, and studio facilities immediately. Keep your contact details and equipment needs updated below so lab managers can prepare work areas for your sessions.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Contact Details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-teal-500" />
            <span>General Contact Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={authUser?.name || ''}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={authUser?.email || ''}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Department / Field
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <School className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Mechanical &amp; Automation"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Resource Requirements */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-500" />
            <span>Spaces &amp; Equipment Requirements</span>
          </h3>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Select the tools and spaces you primarily plan to use:
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {RESOURCE_NEED_OPTIONS.map((need) => {
                const isSelected = selectedNeeds.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => toggleNeed(need)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 inline-block mr-1 stroke-[3]" />}
                    {need}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Project Purpose / Description
            </label>
            <textarea
              rows={3}
              value={projectPurpose}
              onChange={(e) => setProjectPurpose(e.target.value)}
              placeholder="Tell us what you are working on (e.g. robotics prototype, mechanical capstone, PCB assembly)..."
              className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Anticipated Usage Frequency
              </label>
              <select
                value={usageTimeline}
                onChange={(e) => setUsageTimeline(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                {TIMELINE_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Special Requirements / Assistance
              </label>
              <input
                type="text"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="e.g. Dual-extruder printing, high-temp nozzle, ESD gear"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Requirements successfully saved!</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              Changes take effect immediately on your reservations.
            </span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save My Requirements</span>
          </button>
        </div>
      </form>
    </div>
  );
};

