import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Building2,
  PlusSquare,
  Sparkles,
  Sliders,
  DollarSign,
  ShieldCheck,
  Clock,
  FileText,
  CheckCircle2,
  Trash2,
  Plus,
  X,
  ExternalLink,
  Layers,
  AlertCircle,
  Users,
  Maximize2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { resourceService } from '../../services/resourceService';
import { Resource, ResourceType, ResourceCategory } from '../../types';
import { ResourceImage } from '../../components/common/ResourceImage';

const AVAILABLE_AMENITIES = [
  '4K Presentation Display',
  'Movable Whiteboards',
  'High-Speed Wi-Fi',
  'Modular Rolling Desks',
  'Video Conferencing Bar',
  '3-Phase Power Outlets',
  'Air Conditioning / HVAC',
  'Audio & Wireless Mics',
  'Fume Hood / Exhaust',
  'Sink & Running Water',
  'Emergency Eye Wash Station',
  'Compressed Air Line',
];

export const OwnerEditResourcePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshAll, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [resource, setResource] = useState<Resource | null>(null);
  const [activeTab, setActiveTab] = useState<'basics' | 'space' | 'pricing' | 'schedule' | 'access' | 'rules'>('basics');
  const [isSaving, setIsSaving] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [customAmenity, setCustomAmenity] = useState('');

  // Editable Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '' as ResourceCategory,
    type: 'equipment' as ResourceType,
    description: '',
    location: '',
    building: '',
    room: '',
    imageUrl: '',
    capacity: 10,
    areaSqFt: 500,
    roomLayout: 'Workshop Benches',
    amenities: [] as string[],
    assetTag: '',
    // Pricing & Rent
    isFree: false,
    pricingModel: 'hourly' as 'free' | 'hourly' | 'daily' | 'flat',
    hourlyRate: 150,
    dailyRate: 1000,
    depositAmount: 0,
    currency: '₹',
    // Availability & Fair-Use
    openHour: 8,
    closeHour: 20,
    minBookingHours: 1,
    maxBookingHours: 4,
    weeklyCapHours: 12,
    bufferMinutes: 15,
    cooldownHours: 2,
    maxAdvanceDays: 14,
    enableWaitlist: true,
    // Access & Badges
    approvalMode: 'auto' as 'auto' | 'manual',
    supervisionRequired: false,
    requiresFacultyApproval: false,
    requiresBadge: false,
    requiredBadgeName: '',
    whoMayBook: 'anyone_verified',
    // Rules & Checklist
    rules: [] as string[],
    checklistItems: [] as string[],
    safetyNotes: '',
  });

  useEffect(() => {
    if (!id) return;
    const fetchResource = async () => {
      const res = await resourceService.getResourceById(id);
      if (res) {
        setResource(res);
        setFormData({
          title: res.title,
          category: res.category,
          type: res.type || 'equipment',
          description: res.description,
          location: res.location,
          building: res.building || 'Main Facility',
          room: res.room || '',
          imageUrl: (res.images && res.images[0]) || '',
          capacity: res.capacity || 10,
          areaSqFt: res.areaSqFt || (res.type === 'space' ? 850 : 250),
          roomLayout: res.roomLayout || 'Workshop Benches',
          amenities: res.amenities || ['High-Speed Wi-Fi', 'Presentation Display', 'Power Drops'],
          assetTag: res.assetTag || '',
          isFree: res.isFree ?? (res.hourlyRate === 0),
          pricingModel: res.pricingModel || (res.isFree ? 'free' : 'hourly'),
          hourlyRate: res.hourlyRate ?? 150,
          dailyRate: res.dailyRate ?? 1000,
          depositAmount: res.depositAmount || 0,
          currency: res.currency || '₹',
          openHour: res.availabilityWindows?.[0]?.startHour ?? 8,
          closeHour: res.availabilityWindows?.[0]?.endHour ?? 20,
          minBookingHours: res.minBookingHours || 1,
          maxBookingHours: res.maxHoursPerBooking || res.maxBookingHours || 4,
          weeklyCapHours: res.maxHoursPerWeekPerUser || res.weeklyCapHours || 12,
          bufferMinutes: res.bufferMinutes || 15,
          cooldownHours: res.cooldownHours || 2,
          maxAdvanceDays: res.maxAdvanceDays || 14,
          enableWaitlist: true,
          approvalMode: res.approvalMode || 'auto',
          supervisionRequired: res.supervisionRequired || false,
          requiresFacultyApproval: res.facultyApprovalRequired || false,
          requiresBadge: res.requirements?.some((r) => r.type === 'credential') || false,
          requiredBadgeName: res.requirements?.find((r) => r.type === 'credential')?.label || '',
          whoMayBook: res.whoMayBook || 'anyone_verified',
          rules: res.rules || [],
          checklistItems: res.checklistItems || [],
          safetyNotes: res.safetyNotes || '',
        });
      }
    };
    fetchResource();
  }, [id]);

  if (!resource) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="font-semibold">Loading resource details...</p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedData: Partial<Resource> = {
        title: formData.title.trim(),
        category: formData.category,
        type: formData.type,
        description: formData.description.trim(),
        location: formData.location.trim(),
        building: formData.building.trim(),
        room: formData.room.trim(),
        images: formData.imageUrl ? [formData.imageUrl] : resource.images,
        capacity: Number(formData.capacity),
        areaSqFt: Number(formData.areaSqFt),
        roomLayout: formData.roomLayout,
        amenities: formData.amenities,
        assetTag: formData.assetTag.trim() || undefined,
        // Pricing
        isFree: formData.isFree,
        pricingModel: formData.isFree ? 'free' : formData.pricingModel,
        hourlyRate: formData.isFree ? 0 : Number(formData.hourlyRate),
        dailyRate: formData.isFree ? 0 : Number(formData.dailyRate),
        depositAmount: Number(formData.depositAmount),
        currency: formData.currency,
        // Schedule & Availability
        availabilityWindows: [
          { dayOfWeek: 1, startHour: Number(formData.openHour), endHour: Number(formData.closeHour) },
          { dayOfWeek: 2, startHour: Number(formData.openHour), endHour: Number(formData.closeHour) },
          { dayOfWeek: 3, startHour: Number(formData.openHour), endHour: Number(formData.closeHour) },
          { dayOfWeek: 4, startHour: Number(formData.openHour), endHour: Number(formData.closeHour) },
          { dayOfWeek: 5, startHour: Number(formData.openHour), endHour: Number(formData.closeHour) },
          { dayOfWeek: 6, startHour: Number(formData.openHour), endHour: Number(formData.closeHour) },
        ],
        minBookingHours: Number(formData.minBookingHours),
        maxHoursPerBooking: Number(formData.maxBookingHours),
        maxBookingHours: Number(formData.maxBookingHours),
        maxHoursPerWeekPerUser: Number(formData.weeklyCapHours),
        weeklyCapHours: Number(formData.weeklyCapHours),
        bufferMinutes: Number(formData.bufferMinutes),
        cooldownHours: Number(formData.cooldownHours),
        maxAdvanceDays: Number(formData.maxAdvanceDays),
        approvalMode: formData.approvalMode,
        supervisionRequired: formData.supervisionRequired,
        facultyApprovalRequired: formData.requiresFacultyApproval,
        whoMayBook: formData.whoMayBook,
        rules: formData.rules,
        checklistItems: formData.checklistItems,
        safetyNotes: formData.safetyNotes.trim() || undefined,
      };

      await resourceService.updateResource(
        resource.id,
        updatedData,
        {
          id: authUser?.id || 'owner-1',
          name: authUser?.name || 'Owner',
          role: authUser?.role || 'owner',
        },
        `Owner customized and updated listing details for ${formData.title}.`
      );

      await refreshAll();
      showToast(`Successfully updated "${formData.title}" with new rates and settings!`, 'success');
      navigate('/owner/listings');
    } catch {
      showToast('Failed to save listing changes. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addRule = () => {
    if (!newRuleText.trim()) return;
    setFormData({ ...formData, rules: [...formData.rules, newRuleText.trim()] });
    setNewRuleText('');
  };

  const removeRule = (idx: number) => {
    setFormData({ ...formData, rules: formData.rules.filter((_, i) => i !== idx) });
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setFormData({ ...formData, checklistItems: [...formData.checklistItems, newChecklistItem.trim()] });
    setNewChecklistItem('');
  };

  const removeChecklistItem = (idx: number) => {
    setFormData({ ...formData, checklistItems: formData.checklistItems.filter((_, i) => i !== idx) });
  };

  const toggleAmenity = (item: string) => {
    if (formData.amenities.includes(item)) {
      setFormData({ ...formData, amenities: formData.amenities.filter((a) => a !== item) });
    } else {
      setFormData({ ...formData, amenities: [...formData.amenities, item] });
    }
  };

  const addCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    if (!formData.amenities.includes(customAmenity.trim())) {
      setFormData({ ...formData, amenities: [...formData.amenities, customAmenity.trim()] });
    }
    setCustomAmenity('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/owner/listings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Listings</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Customize Listing: {resource.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              {formData.type}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure rates, rental pricing, area square footage, access conditions, and operational rules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to={`/app/resource/${resource.id}`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4 text-emerald-600" />
            <span>Preview Student View</span>
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('basics')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'basics'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Basics & Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('space')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'space'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Maximize2 className="w-4 h-4" />
          <span>2. Area & Specifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pricing'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>3. Pricing & Rent (Area Rent)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'schedule'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>4. Availability & Hours</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'access'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>5. Access & Badges</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rules'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>6. Rules & Checklist</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: BASICS */}
        {activeTab === 'basics' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Core Listing Information</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Resource Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Resource Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="equipment">Equipment (Machines / Instruments)</option>
                  <option value="space">Physical Space / Room / Studio</option>
                  <option value="device">Device / Digital Rig</option>
                  <option value="tool">Bench Tool / Handheld</option>
                  <option value="lab">Specialized Laboratory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ResourceCategory })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description & Capabilities *
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Location / Wing
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Building & Room Number
                </label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="e.g. Engineering Hall - Room 302"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                {formData.imageUrl && (
                  <div className="mt-3 w-48 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPACE & AREA SPECIFICATIONS */}
        {activeTab === 'space' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-emerald-600" />
              <span>Physical Space & Dimension Specs</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Floor Area (Square Feet)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    value={formData.areaSqFt}
                    onChange={(e) => setFormData({ ...formData, areaSqFt: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    sq ft
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Occupant Capacity
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    people
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Room Configuration / Layout
                </label>
                <input
                  type="text"
                  value={formData.roomLayout}
                  onChange={(e) => setFormData({ ...formData, roomLayout: e.target.value })}
                  placeholder="e.g. Conference, Open Studio, Workshop"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {formData.type === 'equipment' && (
                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Hardware Asset Tag
                    </label>
                    <input
                      type="text"
                      value={formData.assetTag}
                      onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                      placeholder="e.g. TAG-2026-MK4"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Amenities Customizer */}
              <div className="md:col-span-3 space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Included Amenities & Room Features
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_AMENITIES.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {amenity}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    placeholder="Add custom amenity (e.g. VR Headset Station)..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRICING & AREA RENT (NEW & HIGH PRIORITY) */}
        {activeTab === 'pricing' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 space-y-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Rental Pricing & Area Rates</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure whether this space or equipment is rented out with an hourly or daily fee, or provided free of charge.
                </p>
              </div>

              {/* Free vs Paid Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isFree: true, hourlyRate: 0, dailyRate: 0 })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formData.isFree
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Free of Charge
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isFree: false, hourlyRate: formData.hourlyRate || 250 })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !formData.isFree
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Paid Rental
                </button>
              </div>
            </div>

            {formData.isFree ? (
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Free Student & Academic Access
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Users can book this space or equipment without any rental fee. You can still require a refundable security deposit below if needed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
                {/* Currency */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Currency Symbol
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="₹">₹ (INR - Indian Rupee)</option>
                    <option value="$">$ (USD - US Dollar)</option>
                    <option value="€">€ (EUR - Euro)</option>
                    <option value="£">£ (GBP - British Pound)</option>
                  </select>
                </div>

                {/* Hourly Rent Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hourly Rental Rate *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">
                      {formData.currency}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                      required
                      className="w-full pl-8 pr-12 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      / hour
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Bookers are billed based on reserved time slot duration.
                  </p>
                </div>

                {/* Daily Rent Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full-Day Rental Rate (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">
                      {formData.currency}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formData.dailyRate}
                      onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                      className="w-full pl-8 pr-12 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      / day
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Applied automatically when booking an all-day or extended session.
                  </p>
                </div>

                {/* Space Cost Calculation Preview */}
                {formData.type === 'space' && formData.areaSqFt > 0 && (
                  <div className="md:col-span-3 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300/60 dark:border-emerald-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Area Rent Calculation:</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {formData.currency}{formData.hourlyRate}/hour for a {formData.areaSqFt} sq ft space (approx. {formData.currency}{(formData.hourlyRate / (formData.areaSqFt || 1)).toFixed(2)}/sq ft/hr).
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300">
                      {formData.currency}{formData.hourlyRate} / hr
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Refundable Security Deposit */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Refundable Security Deposit
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  {formData.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                  className="w-full pl-8 pr-16 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                  Escrow
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Held temporarily in digital escrow during reservation and released immediately after post-session condition inspection passes.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: SCHEDULE & AVAILABILITY */}
        {activeTab === 'schedule' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Operating Hours & Fair-Use Limits</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Opening Hour (24h)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.openHour}
                  onChange={(e) => setFormData({ ...formData, openHour: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Closing Hour (24h)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.closeHour}
                  onChange={(e) => setFormData({ ...formData, closeHour: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Min Booking (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minBookingHours}
                  onChange={(e) => setFormData({ ...formData, minBookingHours: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Max Booking (Hours/Slot)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxBookingHours}
                  onChange={(e) => setFormData({ ...formData, maxBookingHours: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Weekly Cap (Hours/User)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.weeklyCapHours}
                  onChange={(e) => setFormData({ ...formData, weeklyCapHours: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Buffer Between Slots (Mins)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.bufferMinutes}
                  onChange={(e) => setFormData({ ...formData, bufferMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cooldown Between Sessions
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.cooldownHours}
                  onChange={(e) => setFormData({ ...formData, cooldownHours: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Max Advance Booking (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxAdvanceDays}
                  onChange={(e) => setFormData({ ...formData, maxAdvanceDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ACCESS PERMISSIONS & BADGES */}
        {activeTab === 'access' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Access Control & Safety Prerequisites</span>
            </h2>

            <div className="space-y-4">
              {/* Approval Mode */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Reservation Approval Mode
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="approvalMode"
                      value="auto"
                      checked={formData.approvalMode === 'auto'}
                      onChange={() => setFormData({ ...formData, approvalMode: 'auto' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Instant Auto-Approval (When eligible & slot free)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="approvalMode"
                      value="manual"
                      checked={formData.approvalMode === 'manual'}
                      onChange={() => setFormData({ ...formData, approvalMode: 'manual' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Manual Owner Approval Required</span>
                  </label>
                </div>
              </div>

              {/* Badges and Supervisions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresBadge}
                    onChange={(e) => setFormData({ ...formData, requiresBadge: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Requires Safety Badge / Certification
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Only bookers who have completed credential verification can book.
                    </p>
                    {formData.requiresBadge && (
                      <input
                        type="text"
                        value={formData.requiredBadgeName}
                        onChange={(e) => setFormData({ ...formData, requiredBadgeName: e.target.value })}
                        placeholder="Required badge name (e.g. Laser Safety Level 1)"
                        className="mt-2 w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600"
                      />
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.supervisionRequired}
                    onChange={(e) => setFormData({ ...formData, supervisionRequired: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Technician Supervision Mandatory
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Session is only permitted when an authorized staff member is on-duty.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RULES & CHECKLIST */}
        {activeTab === 'rules' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Usage Rules & Inspection Checklist</span>
            </h2>

            {/* Custom Rules */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Custom Operational & Space Rules ({formData.rules.length})
              </label>
              <div className="space-y-2">
                {formData.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{rule}</span>
                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRule(); } }}
                  placeholder="Add a new rule (e.g. Return tables to default arrangement)..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addRule}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-emerald-600 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>
            </div>

            {/* Return / Inspection Checklist */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Post-Session Condition Inspection Items ({formData.checklistItems.length})
              </label>
              <p className="text-[11px] text-slate-500">
                Bookers and inspectors verify these items before session sign-off and deposit return.
              </p>

              <div className="space-y-2">
                {formData.checklistItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-slate-800 dark:text-slate-200">✓ {item}</span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
                  placeholder="Add inspection checklist item (e.g. HDMI cable coiled)..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-emerald-600 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <Link
            to="/owner/listings"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm shadow-emerald-600/20 hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save & Publish Updates'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

