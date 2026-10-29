import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  PlusSquare,
  Building2,
  Copy,
  PauseCircle,
  PlayCircle,
  Trash2,
  Edit3,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { resourceService } from '../../services/resourceService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Resource } from '../../types';
import { ResourceImage } from '../../components/common/ResourceImage';

export const OwnerListingsPage: React.FC = () => {
  const { resources, bookings, refreshAll, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  // Action Handlers
  const handleTogglePause = async (resource: Resource) => {
    const actionWord = resource.isPaused ? 'resume' : 'pause';
    setConfirmDialog({
      isOpen: true,
      title: `${resource.isPaused ? 'Resume' : 'Pause'} Listing: ${resource.title}`,
      description: resource.isPaused
        ? 'Resuming this listing will make it visible to students and reopen reservations.'
        : 'Pausing will hide this resource from student bookings and prevent new requests. Existing confirmed sessions will remain intact.',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await resourceService.togglePause(
            resource.id,
            { id: authUser?.id || 'owner-1', name: authUser?.name || 'Owner', role: authUser?.role || 'owner' },
            `Owner toggled status to ${actionWord}`
          );
          await refreshAll();
          showToast(`Successfully ${actionWord}d "${resource.title}".`, 'success');
        } catch {
          showToast('Failed to update resource status.', 'error');
        }
      },
    });
  };

  const handleDuplicate = async (resource: Resource) => {
    try {
      const copy = await resourceService.duplicateResource(resource.id, {
        id: authUser?.id || 'owner-1',
        name: authUser?.name || 'Owner',
        role: authUser?.role || 'owner',
      });
      await refreshAll();
      showToast(`Created duplicate: "${copy.title}" (saved as Draft).`, 'success');
    } catch {
      showToast('Failed to duplicate resource.', 'error');
    }
  };

  const handleArchive = (resource: Resource) => {
    setConfirmDialog({
      isOpen: true,
      title: `Archive Listing: ${resource.title}`,
      description:
        'Are you sure you want to archive this resource? It will be removed from the active catalog. Historical booking logs will be preserved in audit records.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await resourceService.archiveResource(resource.id, {
            id: authUser?.id || 'owner-1',
            name: authUser?.name || 'Owner',
            role: authUser?.role || 'owner',
          });
          await refreshAll();
          showToast(`Archived "${resource.title}".`, 'info');
        } catch {
          showToast('Failed to archive resource.', 'error');
        }
      },
    });
  };

  // Filter resources by authenticated owner (new owners start with zero listings)
  const isSuperAdmin = (authUser?.role as string) === 'admin';
  const ownerListings = isSuperAdmin
    ? resources
    : resources.filter((r) => r.ownerId === authUser?.id || r.managerIds?.includes(authUser?.id || ''));

  const isNewOwner = ownerListings.length === 0 && !searchQuery && selectedType === 'all' && selectedStatus === 'all';

  // Filter resources
  const filteredResources = ownerListings.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.assetTag && r.assetTag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'all' || r.type === selectedType;

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'paused' && r.isPaused) ||
      (selectedStatus === 'live' && !r.isPaused && (r.status === 'live' || !r.status)) ||
      (selectedStatus === 'draft' && r.status === 'draft') ||
      (selectedStatus === 'pending_verification' && r.status === 'pending_verification');

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Resource Listings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Oversee all lab equipment, physical rooms, and specialized tool inventory.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/owner/add-equipment"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <PlusSquare className="w-4 h-4" />
            <span>Add Equipment</span>
          </Link>
          <Link
            to="/owner/add-space"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            <span>Add Space</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by equipment title, asset tag, room, or category..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="equipment">Equipment Only</option>
            <option value="space">Spaces / Rooms</option>
            <option value="device">Devices & Sensors</option>
            <option value="tool">Bench Tools</option>
            <option value="lab">Specialized Labs</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="live">Live & Available</option>
            <option value="paused">Paused / Maintenance</option>
            <option value="draft">Drafts</option>
            <option value="pending_verification">Pending Verification</option>
          </select>

          {/* Grid / Table toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Listings Content */}
      {isNewOwner ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm space-y-8 animate-fadeIn">
          {/* Welcome Intro */}
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clean Facility Workspace • No Demo Data</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome, {authUser?.name || 'Partner'}! Let&apos;s build your facility inventory.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              You are running an authentic, dedicated facility account. Because you just created your owner account, your inventory is currently fresh and empty. Add your physical space or equipment below to start accepting reservations from students, faculty, and research teams.
            </p>
          </div>

          {/* Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Add Equipment */}
            <div className="group p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <PlusSquare className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Machinery, Tools &amp; Devices
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    Add Your Equipment
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  List 3D printers, laser cutters, CNC mills, testing devices, or bench instruments. Configure custom rental rates (₹ / $), safety prerequisites, and check-in inspection checklists.
                </p>
                <div className="space-y-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Hourly machine usage rent or free coursework access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Safety badge &amp; technician supervision controls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Digital escrow deposits &amp; condition checklists</span>
                  </div>
                </div>
              </div>

              <Link
                to="/owner/add-equipment"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.01]"
              >
                <PlusSquare className="w-4 h-4" />
                <span>+ Add Your First Equipment</span>
              </Link>
            </div>

            {/* Card 2: Add Space */}
            <div className="group p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500 dark:hover:border-teal-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Rooms, Studios &amp; Laboratories
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    Add Your Space or Room
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  List collaboration studios, research labs, sprint rooms, seminar halls, or workshop areas. Configure floor area (sq ft), capacity, amenities, and hourly/daily area rent.
                </p>
                <div className="space-y-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>Area rent per hour or full-day booking fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>Floor area (sq ft), room layout &amp; occupancy capacity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>Custom included amenities (Displays, Wi-Fi, HVAC)</span>
                  </div>
                </div>
              </div>

              <Link
                to="/owner/add-space"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/20 transition-all hover:scale-[1.01]"
              >
                <Building2 className="w-4 h-4" />
                <span>🏢 Add Your First Space</span>
              </Link>
            </div>
          </div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Layers className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No listings found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or filter selections.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            // Find next booking
            const nowTime = new Date().getTime();
            const futureBookings = bookings
              .filter(
                (b) =>
                  b.resourceId === resource.id &&
                  (b.status === 'approved' || b.status === 'checked_in') &&
                  new Date(b.end).getTime() > nowTime
              )
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

            const nextBooking = futureBookings[0];

            return (
              <div
                key={resource.id}
                className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Status Overlay */}
                  <div className="relative h-44 overflow-hidden">
                    <ResourceImage
                      src={resource.images && resource.images[0]}
                      alt={resource.title}
                      category={resource.category}
                      type={resource.type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Status Pill */}
                    <div className="absolute top-3 left-3 z-10">
                      <StatusBadge
                        status={
                          resource.isPaused
                            ? 'paused'
                            : resource.status || 'live'
                        }
                        type="resource"
                      />
                    </div>

                    {/* Demand Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/85 text-white shadow-xs uppercase tracking-wide border border-white/10 backdrop-blur-xs">
                        {resource.demandLevel} Demand
                      </span>
                    </div>

                    {/* Type badge on bottom-left */}
                    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs uppercase">
                        {resource.type || 'equipment'}
                      </span>
                    </div>

                    {/* Rent / Pricing Badge on bottom-right */}
                    <div className="absolute bottom-3 right-3 z-10">
                      {resource.isFree || (resource.hourlyRate === 0 && !resource.dailyRate) ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-600 text-white shadow-xs backdrop-blur-xs">
                          Free ($0)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs backdrop-blur-xs flex items-center gap-0.5">
                          <span>{resource.currency || '₹'}{resource.hourlyRate}</span>
                          <span className="text-[8px] font-normal opacity-90">/hr</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {resource.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {resource.location} • {resource.building || 'Main Lab'}
                      </p>
                    </div>

                    {/* Specs / Tags & Area */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600 dark:text-slate-400">
                      {resource.areaSqFt && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[10px]">
                          Area: {resource.areaSqFt} sq ft
                        </span>
                      )}
                      {resource.assetTag && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                          Tag: {resource.assetTag}
                        </span>
                      )}
                      {resource.capacity && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                          Cap: {resource.capacity} people
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px]">
                        Max {resource.maxHoursPerBooking || resource.maxBookingHours || 4}h/slot
                      </span>
                    </div>

                    {/* Next Booking Slot */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Next Reservation
                      </span>
                      {nextBooking ? (
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-700 dark:text-slate-300 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          <span>
                            {new Date(nextBooking.start).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        <p className="text-slate-400 mt-0.5 italic text-[11px]">
                          No upcoming bookings scheduled
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePause(resource)}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        resource.isPaused
                          ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      }`}
                      title={resource.isPaused ? 'Resume Listing' : 'Pause Listing'}
                    >
                      {resource.isPaused ? (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          <span className="text-[11px]">Resume</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-4 h-4" />
                          <span className="text-[11px]">Pause</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(resource)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Duplicate Listing"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArchive(resource)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Archive Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/owner/edit/${resource.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all shadow-2xs"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-600" />
                      <span>Customize</span>
                    </Link>

                    <Link
                      to={`/app/resource/${resource.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <span>Student View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Rent / Rate</th>
                  <th className="py-3 px-4">Demand</th>
                  <th className="py-3 px-4">Max Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredResources.map((resource) => (
                  <tr
                    key={resource.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {resource.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {resource.assetTag ? `Tag: ${resource.assetTag}` : resource.category}
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-300">
                      {resource.type || 'equipment'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {resource.location}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={
                          resource.isPaused
                            ? 'paused'
                            : resource.status || 'live'
                        }
                        type="resource"
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {resource.isFree || (resource.hourlyRate === 0 && !resource.dailyRate) ? (
                        <span className="text-teal-600 dark:text-teal-400">Free</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {resource.currency || '₹'}{resource.hourlyRate}/hr
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-700 dark:text-slate-300">
                      {resource.demandLevel}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {resource.maxHoursPerBooking || resource.maxBookingHours || 4} hours
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/owner/edit/${resource.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Customize Listing"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleTogglePause(resource)}
                          className={`p-1.5 rounded-lg text-xs font-semibold ${
                            resource.isPaused
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={resource.isPaused ? 'Resume' : 'Pause'}
                        >
                          {resource.isPaused ? (
                            <PlayCircle className="w-4 h-4" />
                          ) : (
                            <PauseCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(resource)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(resource)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                          title="Archive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
