import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Check,
  Eye,
  ShieldCheck,
  Users,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { resourceService } from '../../services/resourceService';
import { Resource } from '../../types';
import { ResourceImage } from '../../components/common/ResourceImage';

const STORAGE_KEY = 'LENDSPACE_DRAFT_SPACE';

const STEPS = [
  { id: 1, name: 'Basics & Capacity' },
  { id: 2, name: 'Availability' },
  { id: 3, name: 'Access Conditions' },
  { id: 4, name: 'Room Rules' },
  { id: 5, name: 'Fair-Use' },
  { id: 6, name: 'Approval Mode' },
  { id: 7, name: 'Condition Checklist' },
  { id: 8, name: 'Review & Publish' },
];

export const OwnerAddSpacePage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAll, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Space Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'space' as const,
    category: 'Makerspace Collaborative Zone',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    location: 'Design Studio 305',
    building: 'Engineering Hall',
    capacity: 25,
    areaSqFt: 850,
    roomLayout: 'Conference & Workshop Workbenches',
    amenities: ['4K Projector', 'Whiteboards', 'High-Speed Wi-Fi', 'Power Drops'],
    // Pricing & Area Rent
    isFree: false,
    pricingModel: 'hourly' as 'free' | 'hourly' | 'daily',
    hourlyRate: 450,
    dailyRate: 3200,
    currency: '₹',
    // Availability
    openHour: 7,
    closeHour: 22,
    minBookingHours: 1,
    maxBookingHours: 6,
    bufferMinutes: 30,
    // Access conditions
    requiresBadge: false,
    requiredBadgeName: '',
    requiresFacultyApproval: true,
    requiresSupervision: false,
    depositAmount: 0,
    whoMayBook: 'institution' as 'anyone' | 'verified' | 'institution',
    // Rules
    rules: [
      'Return chairs and tables to original grid configuration',
      'Erase all dry-erase whiteboards before leaving',
      'No uncovered drinks or hot meals in studio space',
      'Dispose of paper and 3D printing scrap in designated recycling bins',
    ],
    newRuleText: '',
    requiredPPE: ['None mandatory (Clean studio)'],
    safetyNotes: 'Emergency exits located on east wall. Keep corridor clear at all times.',
    // Fair Use
    weeklyCapHours: 15,
    cooldownHours: 12,
    maxAdvanceDays: 21,
    enableWaitlist: true,
    // Approval mode
    approvalMode: 'manual' as 'auto' | 'manual',
    reviewerName: 'Dr. Ramesh Rao (Owner)',
    // Checklist
    checklistItems: [
      'Tables and seating clean and returned to default setup',
      'Projector powered off and HDMI adapters in designated dock',
      'Lighting and HVAC controls set back to eco-mode',
      'Studio door locked upon exit',
    ],
    newChecklistItem: '',
  });

  // Load draft
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

  // Autosave
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
      showToast('Please provide a space title.', 'error');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const newResource: Omit<Resource, 'id'> = {
        title: formData.title,
        type: 'space',
        category: 'spaces',
        description: formData.description || 'Collaborative workspace for interdisciplinary team projects.',
        images: [formData.imageUrl],
        location: `${formData.building}, ${formData.location}`,
        building: formData.building,
        capacity: Number(formData.capacity),
        areaSqFt: Number(formData.areaSqFt),
        roomLayout: formData.roomLayout,
        amenities: formData.amenities,
        isFree: formData.isFree,
        pricingModel: formData.isFree ? 'free' : formData.pricingModel,
        hourlyRate: formData.isFree ? 0 : Number(formData.hourlyRate),
        dailyRate: formData.isFree ? 0 : Number(formData.dailyRate),
        currency: formData.currency,
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
        requirements: [],
        rules: formData.rules,
        depositAmount: Number(formData.depositAmount),
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
        whoMayBook: 'institution_only',
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
      showToast(`Space "${formData.title}" published successfully!`, 'success');
      navigate('/owner/listings');
    } catch {
      showToast('Failed to publish space.', 'error');
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
            <span className="text-slate-800 dark:text-slate-200 font-semibold">Add Space</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Register New Collaborative Space or Room
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Draft saved at {savedAt}
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
                className="flex items-center gap-2 text-left"
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

      {/* 2-Column: Form on Left, Live Preview Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          {/* STEP 1: BASICS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                1. Space Identity & Capacity
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Space Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Design Thinking Collaboration Studio"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room Type / Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Makerspace Collaborative Zone">Makerspace Collaborative Zone</option>
                    <option value="Conference & Seminar Hall">Conference & Seminar Hall</option>
                    <option value="Wet Lab & Chemistry Bench">Wet Lab & Chemistry Bench</option>
                    <option value="Studio & Presentation Bay">Studio & Presentation Bay</option>
                    <option value="Clean Room & Assembly">Clean Room & Assembly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Safe Occupancy / Capacity (persons)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Space Floor Area (Square Feet)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      value={formData.areaSqFt}
                      onChange={(e) => setFormData({ ...formData, areaSqFt: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      sq ft
                    </span>
                  </div>
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
                    placeholder="e.g. Engineering Hall"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room Number / Wing
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Room 305 East"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Layout Features
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail seating configurations, power distribution, smart display capabilities..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Photo URL
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
                2. Operational Windows & Duration Constraints
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Time (Hour)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.openHour}
                    onChange={(e) => setFormData({ ...formData, openHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Closing Time (Hour)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.closeHour}
                    onChange={(e) => setFormData({ ...formData, closeHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Min Hours
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
                    Max Hours
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
                    Turnaround Buffer (mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
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
                3. Access Eligibility & Permissions
              </h2>

              <div className="space-y-3">
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
                      Ideal for research conference rooms or departmental facilities.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresBadge}
                    onChange={(e) => setFormData({ ...formData, requiresBadge: e.target.checked })}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Require Lab Safety Orientation Badge
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Users must have completed facility orientation.
                    </span>
                  </div>
                </label>
              </div>

              {/* AREA RENT & PRICING BLOCK */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Space Rental Pricing & Area Rent
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Determine if users pay an hourly/daily rate for the space or book for free.
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
                      onClick={() => setFormData({ ...formData, isFree: false, hourlyRate: formData.hourlyRate || 450 })}
                      className={`px-2 py-1 rounded text-[11px] font-bold ${
                        !formData.isFree ? 'bg-emerald-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      Paid Rent
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
                        Hourly Area Rent *
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
                        Daily Rent (Optional)
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

                    <div className="sm:col-span-3 text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg border border-emerald-200/40">
                      Estimated rate: <strong>{formData.currency}{formData.hourlyRate}/hr</strong> for a {formData.areaSqFt} sq ft area (~{formData.currency}{(formData.hourlyRate / (formData.areaSqFt || 1)).toFixed(2)}/sq ft/hr).
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/40">
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Refundable Escrow Deposit
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {formData.currency}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.depositAmount}
                      onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                      className="w-full pl-6 pr-10 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ROOM RULES */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                4. Room Etiquette & Safety Notes
              </h2>

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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.newRuleText}
                  onChange={(e) => setFormData({ ...formData, newRuleText: e.target.value })}
                  placeholder="Add a room regulation..."
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
          )}

          {/* STEP 5: FAIR-USE */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                5. Fair-Use Allotment
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Advance Booking (days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxAdvanceDays}
                    onChange={(e) => setFormData({ ...formData, maxAdvanceDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: APPROVAL MODE */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                6. Approval Policy
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setFormData({ ...formData, approvalMode: 'auto' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.approvalMode === 'auto'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Instant Auto-Approval (Recommended for spaces)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Students can immediately reserve available slots if no conflict exists.
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, approvalMode: 'manual' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.approvalMode === 'manual'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Manual Faculty Approval
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Every session requires lab manager or faculty review.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: CONDITION CHECKLIST */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                7. Room Check-In & Handover Checklist
              </h2>

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
                  placeholder="e.g. AV remote controls present in cradle..."
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
                8. Review Space Listing
              </h2>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Ready to Open for Reservations</span>
                </div>
                <p>
                  This space will be visible on the discovery catalog and open for scheduling by faculty and students.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Title:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.title || 'Untitled'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Capacity:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.capacity} persons</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Location:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formData.building}, {formData.location}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Approval Mode:</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {formData.approvalMode === 'auto' ? 'Instant Auto-Approve' : 'Manual Review'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < 8 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(8, prev + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublish}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Space'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Preview Card on Right */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Eye className="w-4 h-4 text-emerald-500" />
            <span>Live Catalog Preview</span>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
            <div className="relative h-44 overflow-hidden">
              <ResourceImage
                src={formData.imageUrl}
                alt="Preview"
                category={formData.category}
                type="space"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                  Live
                </span>
              </div>
              <div className="absolute top-3 right-3 z-10">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white uppercase border border-white/10">
                  Space
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {formData.title || 'Untitled Space'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {formData.building || 'Campus Hall'}, {formData.location || 'Room'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] flex-wrap">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>Cap: {formData.capacity}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Max {formData.maxBookingHours}h/session
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {formData.description || 'Describe the seating setup, amenities, and collaborative environment...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
