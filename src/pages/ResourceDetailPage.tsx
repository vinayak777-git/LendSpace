import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { checkEligibility } from '../lib/eligibility';
import { DemandBadge } from '../components/common/Badge';
import { ResourceImage } from '../components/common/ResourceImage';
import { BookingRequestModal } from '../components/booking/BookingRequestModal';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
  Lock,
  Sparkles,
  UserCheck,
  FileCheck,
  Upload,
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { resources, currentUser, bookings, refreshAll } = useAppStore();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const resource = useMemo(() => {
    return resources.find((r) => r.id === id);
  }, [resources, id]);

  const eligibility = useMemo(() => {
    if (!resource) return null;
    return checkEligibility(currentUser, resource);
  }, [currentUser, resource]);

  // Bookings for this resource to render weekly calendar
  const resourceBookings = useMemo(() => {
    if (!resource) return [];
    return bookings.filter(
      (b) =>
        b.resourceId === resource.id &&
        (b.status === 'approved' || b.status === 'checked_in' || b.status === 'pending')
    );
  }, [bookings, resource]);

  // Generate 7 days for the weekly calendar
  const calendarDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      days.push(d);
    }
    return days;
  }, []);

  if (!resource) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Resource Not Found</h2>
        <p className="text-sm text-slate-500 mb-4">The equipment or space you requested does not exist.</p>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discover</span>
        </Link>
      </div>
    );
  }

  const hoursUsedThisWeek = currentUser?.usageStats?.hoursThisWeek || 0;
  const maxWeeklyHours = resource.maxHoursPerWeekPerUser || 12;
  const queueLength = bookings.filter(
    (b) => b.resourceId === resource.id && b.status === 'waitlisted'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Equipment</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Gallery, Overview, Checklist, Calendar */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Visual Header */}
          <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="relative h-72 sm:h-96 w-full overflow-hidden">
              <ResourceImage
                src={resource.images && resource.images[activeImageIdx]}
                alt={resource.title}
                category={resource.category}
                type={resource.type}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none z-2" />

              {/* Badges on image */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <DemandBadge demand={resource.demandLevel} />
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                  {resource.depositAmount > 0
                    ? `$${resource.depositAmount} Deposit Required`
                    : 'No Deposit ($0)'}
                </span>
              </div>

              {/* Title & Location on image overlay */}
              <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  {resource.category.replace('_', ' ')}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2 drop-shadow">
                  {resource.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-200 drop-shadow">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{resource.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Max {resource.maxHoursPerBooking}h / session</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail switcher if multiple images */}
            {resource.images && resource.images.length > 1 && (
              <div className="flex gap-2 p-3 bg-slate-50 border-t border-slate-100">
                {resource.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIdx === idx ? 'border-emerald-500 scale-105' : 'border-transparent opacity-70'
                    }`}
                  >
                    <ResourceImage
                      src={img}
                      category={resource.category}
                      type={resource.type}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                About this Equipment & Facility
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">{resource.description}</p>
            </div>
          </div>

          {/* Operational Rules & Conditions */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Standard Operational Protocols & Lab Rules</span>
            </h3>
            <div className="space-y-2.5">
              {resource.rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 border border-emerald-200 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Availability Calendar Visualizer */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span>7-Day Availability & Schedule Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual representation of confirmed bookings, maintenance windows, and free time slots.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Booked / Active
                </span>
              </div>
            </div>

            {/* Day columns */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const dayNum = day.getDay();
                const dayStr = day.toDateString();
                const dayBookings = resourceBookings.filter((b) => {
                  return new Date(b.start).toDateString() === dayStr;
                });

                const window = resource.availabilityWindows.find((w) => w.dayOfWeek === dayNum);
                const isClosed = !window;

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-2.5 text-center border text-xs flex flex-col justify-between min-h-[140px] ${
                      idx === 0
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">
                        {format(day, 'EEE')}
                      </div>
                      <div className="text-[13px] font-extrabold text-slate-900 my-0.5">
                        {format(day, 'd')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isClosed ? 'Closed' : `${window.startHour}:00 - ${window.endHour}:00`}
                      </div>
                    </div>

                    <div className="my-2 space-y-1">
                      {isClosed ? (
                        <div className="text-[10px] text-slate-400 py-2">Closed</div>
                      ) : dayBookings.length > 0 ? (
                        dayBookings.map((b) => (
                          <div
                            key={b.id}
                            className="p-1 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold truncate border border-amber-300"
                            title={`${new Date(b.start).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} - ${new Date(b.end).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`}
                          >
                            {new Date(b.start).toLocaleTimeString([], { hour: 'numeric' })} -{' '}
                            {new Date(b.end).toLocaleTimeString([], { hour: 'numeric' })}
                          </div>
                        ))
                      ) : (
                        <div className="p-1.5 rounded bg-emerald-100/70 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                          Vacant All Day
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium">
                      {idx === 0 ? 'Today' : format(day, 'MMM d')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Requirements Checklist, Fair-use Panel & Action Button */}
        <div className="space-y-6">
          {/* Action Card with Booking Trigger */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="text-xs text-slate-400 font-medium">Approval Mode</span>
                <div className="font-bold text-slate-900 text-sm capitalize">
                  {resource.approvalMode} {resource.supervisionRequired ? '+ Supervision' : ''}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Security Deposit</span>
                <div className="font-bold text-emerald-600 text-sm">
                  {resource.depositAmount > 0 ? `$${resource.depositAmount}` : 'Free ($0)'}
                </div>
              </div>
            </div>

            {/* Live Requirements Checklist */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                <span>Prerequisites Checklist</span>
                <span className="text-[11px] font-normal text-slate-400">
                  for {currentUser?.name.split(' ')[0]}
                </span>
              </h4>

              {resource.requirements.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No prerequisites required. Open access for all campus members.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {resource.requirements.map((req) => {
                    const isMet = eligibility?.metRequirements.some((m) => m.id === req.id);

                    return (
                      <div
                        key={req.id}
                        className={`p-3 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                          isMet
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50/70 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {isMet ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold block text-slate-800">{req.label}</span>
                            {req.description && (
                              <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                                {req.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {!isMet && req.type === 'credential' && (
                          <Link
                            to="/profile"
                            className="shrink-0 text-[11px] font-bold text-amber-800 underline hover:text-amber-900"
                          >
                            Upload Badge
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fair Use Allocation Panel */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Fair-Use Allowance
                </span>
                <span className="text-slate-500 font-medium">
                  {hoursUsedThisWeek}h / {maxWeeklyHours}h weekly
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    hoursUsedThisWeek / maxWeeklyHours >= 1
                      ? 'bg-rose-500'
                      : hoursUsedThisWeek / maxWeeklyHours > 0.7
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (hoursUsedThisWeek / maxWeeklyHours) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Active waitlist queue:</span>
                <span className="font-semibold text-slate-800">{queueLength} waiting</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-200 pt-2">
                Allocation rules prioritize academic capstones, lower recent weekly usage, and proactive returns. Cooldown periods apply after extended runs on high-demand equipment.
              </p>
            </div>

            {/* Primary Action Button */}
            {resource.isPaused ? (
              <button
                disabled
                className="w-full py-3.5 rounded-2xl bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Resource Currently Paused for Maintenance</span>
              </button>
            ) : !eligibility?.isEligible ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-3.5 rounded-2xl bg-slate-100 border border-slate-300 text-slate-400 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Request Booking (Ineligible)</span>
                </button>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  <strong>Action needed:</strong> {eligibility?.actionNeeded || eligibility?.reasons[0]}
                  <div className="mt-1">
                    <Link to="/profile" className="font-bold underline text-amber-900">
                      Submit missing credential on your profile →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Request Booking Slot</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingRequestModal
          resource={resource}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={() => {
            refreshAll();
          }}
        />
      )}
    </div>
  );
};
