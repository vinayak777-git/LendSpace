import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusSquare,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  Layers,
  ShieldCheck,
  Clock,
  Sliders,
  FileText,
  Eye,
  Save,
  Check,
  Info,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { resourceService } from '../../services/resourceService';
import { Resource } from '../../types';
import { ResourceImage } from '../../components/common/ResourceImage';

const STORAGE_KEY = 'LENDSPACE_DRAFT_EQUIPMENT';

const STEPS = [
  { id: 1, name: 'Basics' },
  { id: 2, name: 'Availability' },
  { id: 3, name: 'Access Conditions' },
  { id: 4, name: 'Usage Rules' },
  { id: 5, name: 'Fair-Use' },
  { id: 6, name: 'Approval Mode' },
  { id: 7, name: 'Condition Checklist' },
  { id: 8, name: 'Review & Publish' },
];

export const OwnerAddEquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAll, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'equipment' as const,
    category: 'Rapid Prototyping',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    location: 'Makerspace Lab 102',
    building: 'Engineering Hall',
    assetTag: 'EQ-2026-99',
    serialNumber: 'SN-MK4-98421',
    initialCondition: 'excellent' as 'excellent' | 'good' | 'fair',
    // Availability
    openHour: 8,
    closeHour: 20,
    minBookingHours: 1,
    maxBookingHours: 4,
    bufferMinutes: 15,
    blackoutDates: '',
    // Access conditions
    requiresBadge: true,
    requiredBadgeName: 'Laser Safety Level 1',
    requiresSupervision: false,
    requiresFacultyApproval: false,
    depositAmount: 0,
    // Pricing & Equipment Rent
    isFree: false,
    pricingModel: 'hourly' as 'free' | 'hourly' | 'daily',
    hourlyRate: 150,
    dailyRate: 1000,
    currency: '₹',
    whoMayBook: 'verified' as 'anyone' | 'verified' | 'institution',
    // Rules & Safety
    rules: [
      'Clean print bed after every print job',
      'No flammable polymers without supervision',
      'Report extrusion jams immediately',
    ],
    newRuleText: '',
    requiredPPE: ['Safety Glasses', 'Closed-toe Shoes'],
    safetyNotes: 'Extreme heat at nozzle (250°C). Keep workspace clear of flammable solvent wipes.',
    // Fair Use
    weeklyCapHours: 12,
    cooldownHours: 24,
    maxAdvanceDays: 14,
    enableWaitlist: true,
    // Approval mode
    approvalMode: 'manual' as 'auto' | 'manual',
    reviewerName: 'Dr. Ramesh Rao (Owner)',
    // Condition checklist
    checklistItems: [
      'Power cable and grounding plug intact',
      'Extrusion nozzle clear of clogs and burn residue',
      'Heat bed PEI sheet free of deep scratches or gouges',
      'Emergency stop switch functional and unobstructed',
    ],
    newChecklistItem: '',
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Autosave draft
  const saveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  const handlePublish = async () => {
    if (!formData.title) {
      showToast('Please provide an equipment title.', 'error');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const newResource: Omit<Resource, 'id'> = {
        title: formData.title,
        type: 'equipment',
        category: formData.category as any,
        description: formData.description || 'Precision lab instrument for academic prototyping.',
        images: [formData.imageUrl],
        location: `${formData.building}, Room ${formData.location}`,
        building: formData.building,
        assetTag: formData.assetTag,
        condition: formData.initialCondition,
        status: authUser?.role === 'owner' ? 'live' : 'pending_verification',
        demandLevel: 'high',
        ownerId: authUser?.id || 'owner-1',
        managerIds: ['user-kiran'],
        availabilityWindows: [
          { dayOfWeek: 1, startHour: 8, endHour: 20 },
          { dayOfWeek: 2, startHour: 8, endHour: 20 },
          { dayOfWeek: 3, startHour: 8, endHour: 20 },
          { dayOfWeek: 4, startHour: 8, endHour: 20 },
          { dayOfWeek: 5, startHour: 8, endHour: 20 },
        ],
        requirements: formData.requiresBadge
          ? [
              {
                id: `req-${Date.now()}`,
                type: 'credential',
                credentialType: formData.requiredBadgeName,
                label: formData.requiredBadgeName,
              },
            ]
          : [],
        rules: formData.rules,
        depositAmount: Number(formData.depositAmount),
        isFree: formData.isFree,
        pricingModel: formData.isFree ? 'free' : formData.pricingModel,
        hourlyRate: formData.isFree ? 0 : Number(formData.hourlyRate),
        dailyRate: formData.isFree ? 0 : Number(formData.dailyRate),
        currency: formData.currency,
        maxHoursPerBooking: Number(formData.maxBookingHours),
        maxHoursPerWeekPerUser: Number(formData.weeklyCapHours),
        minBookingHours: Number(formData.minBookingHours),
        maxBookingHours: Number(formData.maxBookingHours),
        bufferMinutes: Number(formData.bufferMinutes),
        weeklyCapHours: Number(formData.weeklyCapHours),
        cooldownHours: Number(formData.cooldownHours),
        maxAdvanceDays: Number(formData.maxAdvanceDays),
        depositRequired: Number(formData.depositAmount),
        approvalMode: formData.approvalMode,
        supervisionRequired: formData.requiresSupervision,
        facultyApprovalRequired: formData.requiresFacultyApproval,
        whoMayBook: 'anyone_verified',
        safetyRules: formData.rules,
        requiredPPE: formData.requiredPPE,
        checkInChecklist: formData.checklistItems,
        requiredCredentials: formData.requiresBadge ? [formData.requiredBadgeName] : [],
        isPaused: false,
        cooldownPeriodHours: Number(formData.cooldownHours),
      };

      await resourceService.createResource(newResource, {
        id: authUser?.id || 'owner-1',
        name: authUser?.name || 'Owner',
        role: authUser?.role || 'owner',
      });

      localStorage.removeItem(STORAGE_KEY);
      await refreshAll();
      showToast(`Equipment "${formData.title}" published successfully!`, 'success');
      navigate('/owner/listings');
    } catch {
      showToast('Failed to publish equipment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link to="/owner/listings" className="hover:text-emerald-600 transition-colors">
              Listings
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">Add Equipment</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Register New Lab Equipment
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Draft autosaved at {savedAt}
            </span>
          )}
          <button
            type="button"
            onClick={saveDraft}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Save Draft
          </button>
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
        <div className="flex items-center min-w-[700px] justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className="flex items-center gap-2 text-left group"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {step.name}
                </span>
                {idx < STEPS.length - 1 && (
                  <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Layout: Form on Left, Live Preview Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Step Form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          {/* STEP 1: BASICS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                1. Equipment Basics & Identity
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Equipment Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Prusa MK4 3D Printer #3"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Rapid Prototyping">Rapid Prototyping</option>
                    <option value="Subtractive Manufacturing">Subtractive Manufacturing</option>
                    <option value="Electronics & Soldering">Electronics & Soldering</option>
                    <option value="High-Performance Computing">High-Performance Computing</option>
                    <option value="Optical & Photography">Optical & Photography</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Asset Tag / Inventory ID
                  </label>
                  <input
                    type="text"
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    placeholder="e.g. EQ-2026-99"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Building
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    placeholder="e.g. Maker Hall"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Bay
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Room 204, Bay B"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Specifications
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail capabilities, supported materials, build volume, and primary use cases..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Photo URL or Mock Image
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 2: AVAILABILITY */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                2. Operational Windows & Slot Constraints
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operating Hours Start
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.openHour}
                    onChange={(e) => setFormData({ ...formData, openHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <span className="text-[10px] text-slate-400">08:00 AM standard</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operating Hours End
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.closeHour}
                    onChange={(e) => setFormData({ ...formData, closeHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <span className="text-[10px] text-slate-400">20:00 (8 PM) closing</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Min Duration (hrs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.minBookingHours}
                    onChange={(e) => setFormData({ ...formData, minBookingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Duration (hrs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxBookingHours}
                    onChange={(e) => setFormData({ ...formData, maxBookingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Buffer Time (mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={formData.bufferMinutes}
                    onChange={(e) => setFormData({ ...formData, bufferMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACCESS CONDITIONS */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                3. Access Prerequisites & Security
              </h2>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresBadge}
                    onChange={(e) => setFormData({ ...formData, requiresBadge: e.target.checked })}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Require Safety Certification Badge
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Students must hold an approved training badge before submitting a booking.
                    </span>
                    {formData.requiresBadge && (
                      <input
                        type="text"
                        value={formData.requiredBadgeName}
                        onChange={(e) => setFormData({ ...formData, requiredBadgeName: e.target.value })}
                        placeholder="Badge Name (e.g. 3D Printing Level 1)"
                        className="mt-2 w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresSupervision}
                    onChange={(e) => setFormData({ ...formData, requiresSupervision: e.target.checked })}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Staff / Technician Supervision Required
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Cannot be operated without a lab tech present on the premises.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresFacultyApproval}
                    onChange={(e) => setFormData({ ...formData, requiresFacultyApproval: e.target.checked })}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Faculty / PI Sign-Off Required
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Requires departmental research project advisor sign-off.
                    </span>
                  </div>
                </label>
              </div>

              {/* EQUIPMENT USAGE PRICING BLOCK */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Equipment Usage Fee & Rent
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Charge an hourly machine usage fee (for consumables / maintenance) or provide free.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isFree: true, hourlyRate: 0, dailyRate: 0 })}
                      className={`px-2 py-1 rounded text-[11px] font-bold ${
                        formData.isFree ? 'bg-emerald-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      Free
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isFree: false, hourlyRate: formData.hourlyRate || 150 })}
                      className={`px-2 py-1 rounded text-[11px] font-bold ${
                        !formData.isFree ? 'bg-emerald-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      Paid Rate
                    </button>
                  </div>
                </div>

                {!formData.isFree && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="₹">₹ (INR)</option>
                        <option value="$">$ (USD)</option>
                        <option value="€">€ (EUR)</option>
                        <option value="£">£ (GBP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Hourly Usage Fee *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">
                          {formData.currency}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                          className="w-full pl-6 pr-10 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                          /hr
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Daily Cap / Rate (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">
                          {formData.currency}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={formData.dailyRate}
                          onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                          className="w-full pl-6 pr-10 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                          /day
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Refundable Security Deposit ({formData.currency})
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <span className="text-[10px] text-slate-400">
                  Set to 0 if no deposit is needed. Deposit held in institutional escrow.
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: USAGE RULES */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                4. Operational Rules & Personal Protective Equipment (PPE)
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Safety Rules Checklist
                </label>
                <div className="space-y-2">
                  {formData.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <span>{rule}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            rules: formData.rules.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-slate-400 hover:text-rose-500 text-xs font-bold ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={formData.newRuleText}
                    onChange={(e) => setFormData({ ...formData, newRuleText: e.target.value })}
                    placeholder="Add a new safety requirement..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.newRuleText) {
                        setFormData({
                          ...formData,
                          rules: [...formData.rules, formData.newRuleText],
                          newRuleText: '',
                        });
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    + Add Rule
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Safety Notes & Hazards Warning
                </label>
                <textarea
                  rows={2}
                  value={formData.safetyNotes}
                  onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          )}

          {/* STEP 5: FAIR-USE */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                5. Fair-Use Quotas & Queue Rules
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Weekly Hours Cap Per Student
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.weeklyCapHours}
                    onChange={(e) => setFormData({ ...formData, weeklyCapHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <span className="text-[10px] text-slate-400">Prevents individual monopolization</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Booking Cooldown Buffer (hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.cooldownHours}
                    onChange={(e) => setFormData({ ...formData, cooldownHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <span className="text-[10px] text-slate-400">Wait between consecutive sessions</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableWaitlist}
                    onChange={(e) => setFormData({ ...formData, enableWaitlist: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Enable Automated Waitlist Promotion
                    </span>
                    <span className="text-[11px] text-slate-500">
                      When a session is cancelled, the highest priority waitlisted requester is auto-promoted.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: APPROVAL MODE */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                6. Reservation Review Workflow
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setFormData({ ...formData, approvalMode: 'manual' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.approvalMode === 'manual'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Manual Review (Recommended)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Every reservation request lands in your Review Queue for manual inspection and approval.
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, approvalMode: 'auto' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.approvalMode === 'auto'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Instant Auto-Approval
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Automatically approves reservations immediately if student has badge and slot is vacant.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: CONDITION CHECKLIST */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                7. Check-in & Return Inspection Checklist
              </h2>
              <p className="text-xs text-slate-500">
                Define the mandatory condition verification points students must inspect before and after usage:
              </p>

              <div className="space-y-2">
                {formData.checklistItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          checklistItems: formData.checklistItems.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-rose-500 text-xs font-bold ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.newChecklistItem}
                  onChange={(e) => setFormData({ ...formData, newChecklistItem: e.target.value })}
                  placeholder="e.g. Lens free from dust and optical scratches..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (formData.newChecklistItem) {
                      setFormData({
                        ...formData,
                        checklistItems: [...formData.checklistItems, formData.newChecklistItem],
                        newChecklistItem: '',
                      });
                    }
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  + Add Check
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: REVIEW & PUBLISH */}
          {currentStep === 8 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                8. Final Review & Verification
              </h2>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Ready for Student Discovery</span>
                </div>
                <p>
                  Upon publishing, this equipment will immediately be listed in the Booker Portal discovery feed.
                  All safety rules and condition checklists will be enforced on checkout.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Title:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.title || 'Untitled'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Location:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formData.building}, Room {formData.location}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Approval Workflow:</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {formData.approvalMode === 'manual' ? 'Manual Custodian Review' : 'Instant Auto-Approve'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Weekly Fair-Use Cap:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formData.weeklyCapHours} hours per student
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < 8 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(8, prev + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublish}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Listing'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Col: Live Preview Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Eye className="w-4 h-4 text-emerald-500" />
            <span>Live Student Catalog Preview</span>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
            <div className="relative h-44 overflow-hidden">
              <ResourceImage
                src={formData.imageUrl}
                alt="Preview"
                category={formData.category}
                type="equipment"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                  Live
                </span>
              </div>
              <div className="absolute top-3 right-3 z-10">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white uppercase border border-white/10">
                  Equipment
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {formData.title || 'Untitled Equipment'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {formData.building || 'Main Lab'}, Room {formData.location || 'Bay'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] flex-wrap">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Tag: {formData.assetTag || 'N/A'}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Max {formData.maxBookingHours}h/session
                </span>
              </div>

              {formData.requiresBadge && (
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Requires {formData.requiredBadgeName}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {formData.description || 'Provide a description to showcase to students...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
