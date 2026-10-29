import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Sliders,
  Phone,
  Mail,
  User as UserIcon,
  School,
  Building,
  ArrowRight,
  Check,
  X,
  ShieldCheck,
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

interface BookerRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookerRequirementsModal: React.FC<BookerRequirementsModalProps> = ({
  isOpen,
  onClose,
}) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !authUser) return null;

  const toggleNeed = (need: string) => {
    if (selectedNeeds.includes(need)) {
      if (selectedNeeds.length > 1) {
        setSelectedNeeds(selectedNeeds.filter((n) => n !== need));
      }
    } else {
      setSelectedNeeds([...selectedNeeds, need]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      updateBookerRequirements({
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        primaryNeeds: selectedNeeds,
        projectPurpose: projectPurpose.trim() || 'General academic & fabrication projects',
        usageTimeline,
        specialRequirements: specialRequirements.trim() || undefined,
      });

      localStorage.setItem(`lendspace_booker_onboarded_${authUser.id}`, 'true');
      showToast('Requirements saved! You have instant reservation access to all basic spaces & tools.', 'success');
      onClose();
    } catch {
      showToast('Could not save requirements.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Welcome to LendSpace • Zero-Barrier Reservation</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tell us about your requirements
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            We do not require badges, safety certificates, or supervisor approvals. Just confirm your basic details and tell us what you need so you can start reserving right away.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Skip for now"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Basic Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-teal-500" />
              <span>Basic Contact &amp; Affiliation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled
                  value={authUser.name}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={authUser.email}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Department / Program
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Mechanical &amp; Automation"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Resource Needs */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              What spaces or equipment do you require? <span className="text-slate-400 font-normal lowercase">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {RESOURCE_NEED_OPTIONS.map((need) => {
                const isSelected = selectedNeeds.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => toggleNeed(need)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline-block mr-1 stroke-[3]" />}
                    {need}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Project Purpose & Timeline */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Project Requirements &amp; Purpose
              </label>
              <textarea
                rows={2}
                value={projectPurpose}
                onChange={(e) => setProjectPurpose(e.target.value)}
                placeholder="Briefly describe what you are building, testing, or need equipment for..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Usage Frequency &amp; Timeline
                </label>
                <select
                  value={usageTimeline}
                  onChange={(e) => setUsageTimeline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  {TIMELINE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Special Notes or Tools Needed <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="e.g. Specific filament, ESD matting, evening slots"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>
          </div>

          {/* Policy Guarantee Banner */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 text-xs text-teal-800 dark:text-teal-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Instant Reservation Granted</p>
              <p className="text-[11px] leading-relaxed text-teal-700 dark:text-teal-300">
                You will not be asked for badges, certificates, or faculty sign-offs. Your basic details and requirements are all that is needed to reserve spaces and equipment.
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all disabled:opacity-70"
            >
              <span>Save Requirements &amp; Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

