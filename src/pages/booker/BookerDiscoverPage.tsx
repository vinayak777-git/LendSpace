import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Clock,
  ArrowRight,
  Filter,
  Layers,
  LayoutGrid,
  List,
  Printer,
  Flame,
  Cpu,
  Camera,
  Users,
  FlaskConical,
  Server,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { checkEligibility } from '../../lib/eligibility';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ResourceType, ResourceCategory } from '../../types';
import { ResourceImage } from '../../components/common/ResourceImage';

export const BookerDiscoverPage: React.FC = () => {
  const { resources, currentUser } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [naturalQuery, setNaturalQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyEligible, setOnlyEligible] = useState<boolean>(false);
  const [depositFilter, setDepositFilter] = useState<'all' | 'free' | 'deposit'>('all');
  const [onlyAvailableToday, setOnlyAvailableToday] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const samplePrompts = [
    'I need to 3D print a prototype Friday',
    'Laser cut an acrylic chassis tomorrow',
    'GPU node for deep learning PyTorch',
    'Quiet sprint meeting space for 6 people',
    'Soldering station for SMD boards',
  ];

  // Natural language query processor
  const parsedNaturalIntent = useMemo(() => {
    const q = (naturalQuery || searchQuery).toLowerCase().trim();
    if (!q) return null;

    const matches: { resourceIds: string[]; intentReason: string } = {
      resourceIds: [],
      intentReason: '',
    };

    if (q.includes('3d') || q.includes('print') || q.includes('filament') || q.includes('prusa')) {
      matches.resourceIds.push('res-prusa-mk4');
      matches.intentReason = "Detected intent '3D print / rapid prototype' → matched Prusa MK4 (Requires 3D Printing Lv1 Badge)";
    }
    if (q.includes('laser') || q.includes('acrylic') || q.includes('cut') || q.includes('engrave')) {
      matches.resourceIds.push('res-laser-60w');
      matches.intentReason = "Detected intent 'material cutting & engraving' → matched 60W CO2 Laser (Requires technician supervision)";
    }
    if (q.includes('gpu') || q.includes('deep learning') || q.includes('pytorch') || q.includes('model') || q.includes('training')) {
      matches.resourceIds.push('res-gpu-workstation');
      matches.intentReason = "Detected intent 'high-performance ML computing' → matched RTX 4090 Dual Node (Weekly fair-use capped)";
    }
    if (q.includes('camera') || q.includes('photo') || q.includes('video') || q.includes('film')) {
      matches.resourceIds.push('res-sony-camera-kit');
      matches.intentReason = "Detected intent 'cinematic media capture' → matched Sony Alpha 7 IV Kit ($75 refundable deposit)";
    }
    if (q.includes('meeting') || q.includes('room') || q.includes('space') || q.includes('sprint') || q.includes('whiteboard')) {
      matches.resourceIds.push('res-room-b12', 'res-seminar-hall');
      matches.intentReason = "Detected intent 'collaborative meeting or sprint room' → matched Studio B12 and Seminar Hall";
    }
    if (q.includes('wet') || q.includes('bio') || q.includes('chemical') || q.includes('pipette')) {
      matches.resourceIds.push('res-wet-lab-bench');
      matches.intentReason = "Detected intent 'bio-chemical lab experimentation' → matched BSL-1 Wet Lab (Requires Faculty PI signoff)";
    }
    if (q.includes('solder') || q.includes('iron') || q.includes('pcb')) {
      matches.resourceIds.push('res-soldering-station');
      matches.intentReason = "Detected intent 'electronics soldering' → matched Hakko FX-888D Station";
    }

    return matches.resourceIds.length > 0 ? matches : null;
  }, [naturalQuery, searchQuery]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      // Natural language match
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

      // Type filter
      if (selectedType !== 'all' && res.type !== selectedType) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && res.category !== selectedCategory) {
        return false;
      }

      // Deposit filter
      if (depositFilter === 'free' && res.depositAmount > 0) return false;
      if (depositFilter === 'deposit' && res.depositAmount === 0) return false;

      // Available today
      if (onlyAvailableToday && res.demandLevel === 'high') {
        // demo filter condition
      }

      // Eligibility
      if (onlyEligible && currentUser) {
        const eligibility = checkEligibility(currentUser, res);
        if (!eligibility.isEligible) return false;
      }

      return true;
    });
  }, [
    resources,
    parsedNaturalIntent,
    searchQuery,
    selectedType,
    selectedCategory,
    depositFilter,
    onlyAvailableToday,
    onlyEligible,
    currentUser,
  ]);

  const resourceTypes: { id: string; label: string }[] = [
    { id: 'all', label: 'All Types' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'space', label: 'Spaces & Rooms' },
    { id: 'device', label: 'Devices & Nodes' },
    { id: 'tool', label: 'Tools & Kits' },
    { id: 'lab', label: 'Wet Labs' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Search & Smart Match Box */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Discover Resources &amp; Spaces
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Find spaces and equipment matching your project requirements. Zero badges or supervisor approvals needed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">View:</span>
            <div className="flex rounded-xl bg-white/10 p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Smart-match Search Input */}
        <div className="relative">
          <div className="flex items-center rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md px-3.5 py-1 focus-within:ring-2 focus-within:ring-teal-400">
            <Search className="w-4 h-4 text-teal-400 shrink-0 mr-2" />
            <input
              type="text"
              value={naturalQuery}
              onChange={(e) => {
                setNaturalQuery(e.target.value);
                setSearchQuery(e.target.value);
              }}
              placeholder='Describe what you need: e.g. "I need to 3D print a prototype Friday" or "Laser cut acrylic"...'
              className="w-full py-2.5 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            {naturalQuery && (
              <button
                type="button"
                onClick={() => {
                  setNaturalQuery('');
                  setSearchQuery('');
                }}
                className="text-xs text-slate-300 hover:text-white px-2 py-0.5 bg-white/10 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-300 scrollbar-none">
            <span className="text-[11px] text-teal-400 font-semibold shrink-0">Try intent:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNaturalQuery(p);
                  setSearchQuery(p);
                }}
                className="shrink-0 px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-slate-200"
              >
                &ldquo;{p}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visible "Why this matched" line */}
      {parsedNaturalIntent && (
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 flex items-start gap-3 shadow-xs">
          <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="block text-sm font-bold text-teal-950 dark:text-teal-100">
              Smart Intent Match: Why this matched
            </strong>
            <p className="mt-0.5 text-teal-800 dark:text-teal-300">
              {parsedNaturalIntent.intentReason}
            </p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {resourceTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedType === t.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Secondary Toggles & Deposit Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Access: No Badges Required</span>
            </div>

            {/* Deposit segment */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setDepositFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  depositFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All Deposits
              </button>
              <button
                type="button"
                onClick={() => setDepositFilter('free')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  depositFilter === 'free'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Free ($0)
              </button>
              <button
                type="button"
                onClick={() => setDepositFilter('deposit')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  depositFilter === 'deposit'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Deposit Required
              </button>
            </div>
          </div>

          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{filteredResources.length}</strong> resources
          </span>
        </div>
      </div>

      {/* Grid or List of Resources */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((res) => {
            const eligibility = checkEligibility(currentUser, res);

            return (
              <div
                key={res.id}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative h-44 w-full overflow-hidden">
                    <ResourceImage
                      src={res.images && res.images[0]}
                      alt={res.title}
                      category={res.category}
                      type={res.type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none z-2" />

                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <StatusBadge demand={res.demandLevel} size="sm" />
                      <div className="flex items-center gap-1.5">
                        {res.isFree || (res.hourlyRate === 0 && !res.dailyRate) ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-600/90 text-white border border-teal-400/40 backdrop-blur-md">
                            Free ($0)
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600/95 text-white border border-emerald-400/40 backdrop-blur-md shadow-xs">
                            {res.currency || '₹'}{res.hourlyRate}/hr
                          </span>
                        )}
                        {res.depositAmount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 border border-amber-300/30 backdrop-blur-md">
                            +{res.currency || '$'}{res.depositAmount} dep
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs drop-shadow pointer-events-none">
                      <div className="flex items-center gap-1 font-medium truncate max-w-[180px]">
                        <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">{res.location}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-slate-300 border border-white/10">
                        {res.areaSqFt ? `${res.areaSqFt} sq ft • ` : ''}{res.type || res.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                        {res.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {res.description}
                      </p>
                    </div>

                    {/* Eligibility Chip: All authenticated bookers are ready to reserve */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>Ready to reserve</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    to={`/app/resource/${res.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow-xs"
                  >
                    <span>View &amp; Reserve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredResources.map((res) => {
            const eligibility = checkEligibility(currentUser, res);

            return (
              <div
                key={res.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-teal-500/50 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                    <ResourceImage
                      src={res.images && res.images[0]}
                      alt={res.title}
                      category={res.category}
                      type={res.type}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {res.title}
                      </h3>
                      <StatusBadge demand={res.demandLevel} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {res.location} • {res.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready to reserve</span>
                  </span>
                  <Link
                    to={`/app/resource/${res.id}`}
                    className="py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>Reserve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
