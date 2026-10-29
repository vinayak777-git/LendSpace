import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { checkEligibility } from '../lib/eligibility';
import { DemandBadge } from '../components/common/Badge';
import { ResourceImage } from '../components/common/ResourceImage';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Clock,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  Filter,
  Check,
  Layers,
  Cpu,
  Camera,
  Users,
  Flame,
  Server,
  Zap,
  Printer,
  FlaskConical,
  X,
  Calendar,
  Building2,
} from 'lucide-react';
import { ResourceCategory } from '../types';

export const DiscoverPage: React.FC = () => {
  const { resources, currentUser, bookings } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [naturalQuery, setNaturalQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyEligible, setOnlyEligible] = useState<boolean>(false);
  const [depositFilter, setDepositFilter] = useState<'all' | 'free' | 'deposit'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'deposit-asc' | 'demand'>('recommended');

  // Sample natural language search prompts
  const samplePrompts = [
    'I need to 3D print a prototype Friday',
    'Laser cut an acrylic chassis tomorrow',
    'GPU node for deep learning PyTorch',
    'Quiet sprint meeting space for 6 people',
    'Soldering station for SMD boards',
    'Oscilloscope for frequency debugging',
  ];

  // Natural language query processor
  const parsedNaturalIntent = useMemo(() => {
    const q = (naturalQuery || searchQuery).toLowerCase().trim();
    if (!q) return null;

    const matches: {
      resourceIds: string[];
      intentReason: string;
    } = { resourceIds: [], intentReason: '' };

    if (q.includes('3d') || q.includes('print') || q.includes('filament') || q.includes('prusa')) {
      matches.resourceIds.push('res-prusa-mk4');
      matches.intentReason = "Smart match: Detected intent '3D print / rapid prototype' → matched Prusa MK4";
    }
    if (q.includes('laser') || q.includes('acrylic') || q.includes('cut') || q.includes('engrave')) {
      matches.resourceIds.push('res-laser-60w');
      matches.intentReason = "Smart match: Detected material cutting/engraving intent → matched 60W CO2 Laser";
    }
    if (q.includes('gpu') || q.includes('deep learning') || q.includes('pytorch') || q.includes('model') || q.includes('training')) {
      matches.resourceIds.push('res-gpu-workstation');
      matches.intentReason = "Smart match: Detected high-performance computing / AI model training intent → matched RTX 4090 Node";
    }
    if (q.includes('camera') || q.includes('photo') || q.includes('video') || q.includes('film')) {
      matches.resourceIds.push('res-sony-camera-kit');
      matches.intentReason = "Smart match: Detected media documentation intent → matched Sony Alpha 7 IV Kit";
    }
    if (q.includes('meeting') || q.includes('room') || q.includes('space') || q.includes('sprint') || q.includes('whiteboard')) {
      matches.resourceIds.push('res-room-b12');
      matches.intentReason = "Smart match: Detected collaborative space / sprint session intent → matched Studio B12";
    }
    if (q.includes('wet') || q.includes('bio') || q.includes('chemical') || q.includes('pipette')) {
      matches.resourceIds.push('res-wet-lab-bench');
      matches.intentReason = "Smart match: Detected bio-chemical laboratory intent → matched BSL-1 Wet Lab Bench";
    }
    if (q.includes('solder') || q.includes('iron') || q.includes('flux') || q.includes('pcb')) {
      matches.resourceIds.push('res-soldering-station');
      matches.intentReason = "Smart match: Detected electronics assembly / soldering intent → matched Hakko Station";
    }
    if (q.includes('oscilloscope') || q.includes('circuit') || q.includes('waveform') || q.includes('signal')) {
      matches.resourceIds.push('res-oscilloscope-bench');
      matches.intentReason = "Smart match: Detected electronics debugging / DSO waveform capture intent → matched Keysight DSO";
    }

    return matches.resourceIds.length > 0 ? matches : null;
  }, [naturalQuery, searchQuery]);

  // Filtered and sorted resources
  const filteredResources = useMemo(() => {
    const list = resources.filter((res) => {
      // 1. Natural Language / Smart Match Priority
      if (parsedNaturalIntent && parsedNaturalIntent.resourceIds.length > 0) {
        if (!parsedNaturalIntent.resourceIds.includes(res.id)) {
          const textMatches =
            res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.location.toLowerCase().includes(searchQuery.toLowerCase());
          if (!textMatches) return false;
        }
      } else if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          res.title.toLowerCase().includes(q) ||
          res.description.toLowerCase().includes(q) ||
          res.location.toLowerCase().includes(q) ||
          res.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && res.category !== selectedCategory) {
        return false;
      }

      // 3. Deposit Filter
      if (depositFilter === 'free' && res.depositAmount > 0) return false;
      if (depositFilter === 'deposit' && res.depositAmount === 0) return false;

      // 4. Eligibility Filter
      if (onlyEligible && currentUser) {
        const eligibility = checkEligibility(currentUser, res);
        if (!eligibility.isEligible) return false;
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'deposit-asc') {
        return a.depositAmount - b.depositAmount;
      }
      if (sortBy === 'demand') {
        const priority: Record<string, number> = { high: 3, medium: 2, low: 1 };
        return (priority[b.demandLevel] || 0) - (priority[a.demandLevel] || 0);
      }
      return 0; // recommended order
    });
  }, [
    resources,
    parsedNaturalIntent,
    searchQuery,
    selectedCategory,
    depositFilter,
    onlyEligible,
    currentUser,
    sortBy,
  ]);

  const categories = [
    { id: 'all', label: 'All Equipment', icon: Layers },
    { id: '3d_printer', label: '3D Printers', icon: Printer },
    { id: 'laser_cutter', label: 'Laser Cutters', icon: Flame },
    { id: 'electronics', label: 'Electronics & DSO', icon: Cpu },
    { id: 'photography', label: 'Cameras & Media', icon: Camera },
    { id: 'spaces', label: 'Sprint Rooms', icon: Users },
    { id: 'wet_lab', label: 'Wet Labs', icon: FlaskConical },
    { id: 'computing', label: 'GPU Workstations', icon: Server },
    { id: 'soldering', label: 'Soldering', icon: Zap },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner - Redesigned to match Landing Page aesthetic */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden border border-slate-800">
        {/* Radiant Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-3">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Campus Makerspace &amp; Equipment Directory</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Discover &amp; Reserve Makerspace Resources
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Instant eligibility verification, automated conflict resolution, and fair weekly quotas built for academic innovation and research.
          </p>
        </div>

        {/* Natural Language Search Bar with Glassmorphic Backdrop */}
        <div className="mt-8 relative z-10 max-w-4xl">
          <div className="relative rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-md p-1.5 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400 transition-all shadow-inner">
            <div className="flex items-center">
              <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-emerald-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={naturalQuery}
                onChange={(e) => {
                  setNaturalQuery(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                placeholder='Search gear or describe intent: e.g. "I need to 3D print a prototype Friday" or "Laser cut acrylic"...'
                className="w-full py-2.5 px-2 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
              />
              {naturalQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setNaturalQuery('');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors mr-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-300 scrollbar-none">
            <span className="shrink-0 font-semibold text-emerald-400 text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Suggestions:
            </span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNaturalQuery(p);
                  setSearchQuery(p);
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white text-[11px] font-medium transition-all"
              >
                &ldquo;{p}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Intent Match Alert Banner */}
      {parsedNaturalIntent && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-sm block text-emerald-950 dark:text-emerald-100">
                Smart Intent Match Active
              </span>
              <p className="text-emerald-800 dark:text-emerald-300">
                {parsedNaturalIntent.intentReason}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setNaturalQuery('');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 pt-1"
          >
            Reset search
          </button>
        </div>
      )}

      {/* Filter & Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-colors">
        {/* Horizontal Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters & Results Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* "I'm eligible" checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyEligible}
                onChange={(e) => setOnlyEligible(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Show only equipment I&apos;m eligible for</span>
              </span>
            </label>

            {/* Deposit segment pill */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDepositFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  depositFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Deposits
              </button>
              <button
                type="button"
                onClick={() => setDepositFilter('free')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  depositFilter === 'free'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Free ($0)
              </button>
              <button
                type="button"
                onClick={() => setDepositFilter('deposit')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  depositFilter === 'deposit'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Deposit Required
              </button>
            </div>
          </div>

          {/* Right: Sort By & Resource Count */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="recommended">Recommended</option>
                <option value="demand">Highest Demand First</option>
                <option value="deposit-asc">Deposit: Low to High</option>
              </select>
            </div>

            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-slate-900 dark:text-white">{filteredResources.length}</strong> available resources
            </div>
          </div>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No matching resources found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try adjusting your natural language query, category filter, or unchecking &ldquo;Show only equipment I&apos;m eligible for&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setNaturalQuery('');
              setSelectedCategory('all');
              setOnlyEligible(false);
              setDepositFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((res) => {
            const eligibility = checkEligibility(currentUser, res);

            // Next slot text and status indicator
            const nextSlotText = res.isPaused
              ? 'Maintenance Pause'
              : res.demandLevel === 'high'
              ? 'High demand • Next slot today 6 PM'
              : 'Available today • Walk-in or reserve';

            return (
              <div
                key={res.id}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image Preview with Non-Overlapping Overlays */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <ResourceImage
                      src={res.images && res.images[0]}
                      alt={res.title}
                      category={res.category}
                      type={res.type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Top Row: Demand Badge (Left) & Deposit Badge (Right) */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                      <DemandBadge demand={res.demandLevel} compact />

                      {res.depositAmount > 0 ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-900/90 text-amber-300 border border-amber-300/40 shadow-xs backdrop-blur-md">
                          ${res.depositAmount} Deposit
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-600/90 text-white border border-emerald-400/40 shadow-xs backdrop-blur-md">
                          Free ($0)
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Location & Category */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs drop-shadow pointer-events-none">
                      <div className="flex items-center gap-1 font-medium truncate max-w-[180px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{res.location}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-slate-300 border border-white/10">
                        {res.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {res.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {res.description}
                      </p>
                    </div>

                    {/* Status & Next Slot */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          res.isPaused
                            ? 'bg-rose-500'
                            : res.demandLevel === 'high'
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span className="truncate font-medium">{nextSlotText}</span>
                    </div>

                    {/* Eligibility Status Pill */}
                    <div>
                      {eligibility.score === 'green' && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>You&apos;re certified &amp; eligible</span>
                        </div>
                      )}
                      {eligibility.score === 'amber' && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">Missing 1 requirement (Safety 101)</span>
                        </div>
                      )}
                      {eligibility.score === 'red' && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span className="truncate">Faculty supervisor clearance needed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-5 pt-0">
                  <Link
                    to={`/resource/${res.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm group-hover:shadow-md"
                  >
                    <span>View &amp; Reserve Resource</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
