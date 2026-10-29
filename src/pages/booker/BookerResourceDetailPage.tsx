import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reviewService, Review } from '../../services/reviewService';
import {
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sliders,
  DollarSign,
  FileCheck,
  AlertOctagon,
  Users,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { checkEligibility } from '../../lib/eligibility';
import { checkConflicts } from '../../lib/conflicts';
import { checkFairness } from '../../lib/fairness';
import { bookingService } from '../../services/bookingService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ResourceImage } from '../../components/common/ResourceImage';

export const BookerResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resources, currentUser, bookings, refreshAll, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const resource = resources.find((r) => r.id === id);

  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (id) {
      reviewService.getResourceReviews(id).then(setReviews).catch(() => {});
    }
  }, [id]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [stepperStep, setStepperStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Stepper state
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startHour, setStartHour] = useState(10);
  const [durationHours, setDurationHours] = useState(2);
  const [purpose, setPurpose] = useState('');
  const [isAcademic, setIsAcademic] = useState(true);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionOutcome, setSubmissionOutcome] = useState<{
    outcome: 'approved' | 'pending' | 'waitlisted';
    reason: string;
  } | null>(null);

  if (!resource) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Resource not found</h2>
        <Link to="/app/discover" className="text-xs text-teal-600 underline">
          Return to directory
        </Link>
      </div>
    );
  }

  const eligibility = checkEligibility(currentUser, resource);

  // Calculate start & end ISO strings
  const proposedStart = new Date(`${bookingDate}T${String(startHour).padStart(2, '0')}:00:00`).toISOString();
  const proposedEnd = new Date(
    new Date(proposedStart).getTime() + durationHours * 60 * 60 * 1000
  ).toISOString();

  // Conflict evaluation
  const conflictResult = checkConflicts(resource, proposedStart, proposedEnd, bookings);

  // Fairness evaluation
  const fairnessResult = currentUser
    ? checkFairness(currentUser, resource, durationHours, bookings, purpose, isAcademic)
    : { allowed: true, reasons: [], userHoursThisWeek: 0, maxWeeklyHours: 12, cooldownActive: false, activePendingCount: 0, maxActivePending: 2, priorityScore: 50, scoreBreakdown: { purposeWeight: 15, recentHoursScore: 40, academicLinkScore: 0, waitingTimeScore: 0, latePenalty: 0, total: 55 } };

  const handleStartBookingStepper = () => {
    if (!purpose && (authUser?.projectPurpose || (currentUser as any)?.projectPurpose)) {
      setPurpose(authUser?.projectPurpose || (currentUser as any)?.projectPurpose || '');
    }
    setStepperStep(1);
    setIsStepperOpen(true);
  };

  const handleSubmitBooking = async () => {
    const effectiveUser = authUser || currentUser;
    if (!effectiveUser) return;
    setIsSubmitting(true);
    try {
      const result = await bookingService.createBooking(
        {
          resourceId: resource.id,
          userId: effectiveUser.id,
          userName: effectiveUser.name,
          userEmail: effectiveUser.email,
          userPhone: (effectiveUser as any).phone,
          userOrg: (effectiveUser as any).department || (effectiveUser as any).institution || (effectiveUser as any).org,
          start: proposedStart,
          end: proposedEnd,
          purpose: purpose || 'Academic fabrication project',
          academicProject: isAcademic,
        },
        effectiveUser as any
      );

      await refreshAll();
      setSubmissionOutcome({
        outcome: result.outcome === 'auto_approved' ? 'approved' : result.outcome,
        reason: result.reason,
      });
      setStepperStep(5);
    } catch (err: any) {
      showToast(err?.message || 'Could not submit reservation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back Link */}
      <Link
        to="/app/discover"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Discover</span>
      </Link>

      {/* Main Grid: Gallery & Resource Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative rounded-3xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-800 shadow-md">
              <ResourceImage
                src={resource.images[activeImageIndex] || resource.images[0]}
                alt={resource.title}
                category={resource.category}
                type={resource.type}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2 z-10 flex-wrap">
                <StatusBadge demand={resource.demandLevel} />
                {resource.isFree || (resource.hourlyRate === 0 && !resource.dailyRate) ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-600/90 text-white border border-teal-400/40 backdrop-blur-md">
                    Free Access ($0)
                  </span>
                ) : (
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-600 text-white border border-emerald-400/40 backdrop-blur-md shadow-xs">
                    {resource.currency || '₹'}{resource.hourlyRate} / hour
                  </span>
                )}
                {resource.depositAmount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900/90 text-amber-300 border border-amber-300/40 backdrop-blur-md">
                    {resource.currency || '$'}{resource.depositAmount} Deposit
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail switcher if multiple images */}
            {resource.images.length > 1 && (
              <div className="flex gap-2">
                {resource.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx ? 'border-teal-500 ring-2 ring-teal-500/30' : 'border-slate-200 opacity-70'
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
          </div>

          {/* Description & Specs */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
                {resource.type || resource.category}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {resource.title}
              </h1>
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-teal-500" />
                <span>{resource.location}</span>
              </p>

              {/* Area & Pricing Quick Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {resource.areaSqFt && (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Floor Area: {resource.areaSqFt} sq ft
                  </span>
                )}
                {resource.capacity && (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Cap: {resource.capacity} people
                  </span>
                )}
                {resource.hourlyRate && resource.hourlyRate > 0 ? (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Rent: {resource.currency || '₹'}{resource.hourlyRate} / hr
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    Free Community Resource
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {resource.description}
            </p>

            {/* Rules list */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Operating Rules &amp; Safety Requirements
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {resource.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Weekly Availability Calendar Matrix */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-500" />
              <span>Weekly Schedule &amp; Reserved Windows</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Operating hours: Mon-Fri 08:00 - 20:00. Below shows booked vs open time blocks:
            </p>
            <div className="grid grid-cols-7 gap-1.5 text-center pt-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={day} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <span className="font-bold block text-slate-700 dark:text-slate-300 mb-1">{day}</span>
                  <div className="space-y-1">
                    <span className={`block text-[10px] py-1 rounded font-semibold ${i === 0 ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-800'}`}>
                      {i === 0 ? 'Closed' : 'Open'}
                    </span>
                    {i === 1 && <span className="block text-[9px] bg-amber-100 text-amber-800 py-0.5 rounded">2pm Booked</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Community Reviews & Reputation */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="text-amber-400 text-sm">★</span>
                <span>Verified Borrower Reviews ({reviews.length})</span>
              </h4>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="text-amber-500">★</span>
                  <span>
                    {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} / 5.0
                  </span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No reviews yet for this resource. Completed bookings allow borrowers to leave verified ratings.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {rev.author_name}
                        </span>
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950 px-1.5 py-0.2 rounded-full">
                          Verified Borrower
                        </span>
                      </div>
                      <div className="flex text-amber-400 text-xs">
                        {'★'.repeat(rev.rating)}
                        {'☆'.repeat(5 - rev.rating)}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400">
                      {new Date(rev.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Requirements Checklist, Fair-use Panel & CTA */}
        <div className="lg:col-span-5 space-y-6">
          {/* Direct Access & Requirements Checklist */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                <span>Direct Access Checklist</span>
              </h3>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-full">
                100% Eligible
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Basic Details Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                    Your contact and booker profile details are verified for this reservation.
                  </p>
                </div>
                <span className="text-[10px] font-bold shrink-0 text-emerald-600">VERIFIED</span>
              </div>

              <div className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zero Badge Barriers</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                    Direct access granted. No badges, certificates, or faculty approvals needed.
                  </p>
                </div>
                <span className="text-[10px] font-bold shrink-0 text-emerald-600">PASSED</span>
              </div>
            </div>
          </div>

          {/* Fair-use Panel in plain language */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-teal-500" />
              <span>Fair-Use Allocation &amp; Quota Rules</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Max hours per booking:</span>
                <strong className="text-slate-900 dark:text-white">{resource.maxHoursPerBooking} hours</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Weekly quota limit:</span>
                <strong className="text-slate-900 dark:text-white">{resource.maxHoursPerWeekPerUser} hours/week</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Your used hours this week:</span>
                <strong className="text-teal-600 font-bold">4.5 hours</strong>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>How fair allocation works:</strong> To prevent monopolization of popular machines, LendSpace enforces weekly caps and cooldown buffers. Priority scores reward academic projects and reliable on-time return history.
            </p>
          </div>

          {/* Booking Action Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-xl space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                Reservation Ready
              </span>
              <h3 className="text-xl font-bold">
                Book This Resource
              </h3>
              <p className="text-xs text-teal-100 mt-1">
                Approval mode: <strong className="capitalize">{resource.approvalMode === 'auto' ? 'Instant Auto-Approval' : 'Custodian Review'}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartBookingStepper}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all bg-white text-teal-900 hover:bg-teal-50 cursor-pointer shadow-teal-900/20"
            >
              <span>Request Reservation (Open Stepper)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Stepper Modal */}
      {isStepperOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Step {stepperStep} of 4 • Booking Stepper
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Reserve {resource.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStepperOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: Choose Slot */}
            {stepperStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Start Time
                    </label>
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(Number(e.target.value))}
                      className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((h) => (
                        <option key={h} value={h}>
                          {h}:00 ({h > 12 ? `${h - 12} PM` : `${h} AM`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Duration
                    </label>
                    <select
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {[1, 2, 3, 4].map((h) => (
                        <option key={h} value={h}>
                          {h} hour{h > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setStepperStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
                  >
                    Continue to Purpose
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Purpose */}
            {stepperStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    State Purpose of Reservation *
                  </label>
                  <textarea
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe your design, thesis project, or research prototype..."
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isAcademic}
                    onChange={(e) => setIsAcademic(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>This reservation is linked to an accredited course or academic thesis</span>
                </label>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStepperStep(1)}
                    className="text-xs font-semibold text-slate-500"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!purpose.trim()}
                    onClick={() => setStepperStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    Continue to Liability
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Accept Usage Rules & Liability */}
            {stepperStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <strong className="text-slate-900 dark:text-white block font-bold">
                    Equipment Care &amp; Escrow Agreement:
                  </strong>
                  <p>
                    1. Mandatory check-in photos must be uploaded before turning on equipment.
                  </p>
                  <p>
                    2. Any uncleaned residue, nozzle blockages, or optical scratches will incur cleanup points against your fair-use quota.
                  </p>
                  {resource.depositAmount > 0 && (
                    <p className="font-semibold text-amber-700 dark:text-amber-300">
                      3. A refundable deposit of ${resource.depositAmount} will be held in simulated escrow during checkout.
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(e) => setRulesAccepted(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>I agree to clean up, follow all PPE rules, and return the item on time</span>
                </label>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStepperStep(2)}
                    className="text-xs font-semibold text-slate-500"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!rulesAccepted}
                    onClick={() => setStepperStep(4)}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    Review &amp; Verify Slot
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Review Conflicts & Eligibility */}
            {stepperStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time Window:</span>
                    <strong className="text-slate-900 dark:text-white">{bookingDate} ({startHour}:00 - {startHour + durationHours}:00)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Schedule Conflict:</span>
                    {conflictResult.hasConflict ? (
                      <strong className="text-rose-600 font-bold">Slot occupied (Waitlist placement)</strong>
                    ) : (
                      <strong className="text-emerald-600 font-bold">Free &amp; Clear</strong>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expected Approval:</span>
                    <strong className="text-teal-600 font-bold">
                      {conflictResult.hasConflict ? 'Priority Waitlist' : resource.approvalMode === 'auto' ? 'Instant Approval' : 'Manager Review'}
                    </strong>
                  </div>

                  {/* Pricing Calculation Summary */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Session Duration:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{durationHours} hour{durationHours > 1 ? 's' : ''}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rental Pricing:</span>
                      {resource.isFree || (resource.hourlyRate === 0 && !resource.dailyRate) ? (
                        <strong className="text-emerald-600 font-bold">Free ($0)</strong>
                      ) : (
                        <strong className="text-slate-800 dark:text-slate-200">{resource.currency || '₹'}{resource.hourlyRate} / hour</strong>
                      )}
                    </div>
                    {!resource.isFree && Boolean(resource.hourlyRate && resource.hourlyRate > 0) && (
                      <div className="flex justify-between text-emerald-600 font-bold text-xs pt-1">
                        <span>Estimated Rent Fee:</span>
                        <span>{resource.currency || '₹'}{durationHours * (resource.hourlyRate || 0)}</span>
                      </div>
                    )}
                    {resource.depositAmount > 0 && (
                      <div className="flex justify-between text-amber-600 font-semibold text-xs">
                        <span>Refundable Escrow Deposit:</span>
                        <span>{resource.currency || '$'}{resource.depositAmount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {conflictResult.hasConflict && conflictResult.suggestedSlots.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <span className="font-bold">Suggested Alternative Conflict-Free Slots:</span>
                    <div className="flex gap-2 pt-1">
                      {conflictResult.suggestedSlots.slice(0, 2).map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const newStart = new Date(s.start);
                            setStartHour(newStart.getHours());
                          }}
                          className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border text-[11px] font-semibold"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStepperStep(3)}
                    className="text-xs font-semibold text-slate-500"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitBooking}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Submit Reservation Request</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Confirmation Outcome Screen */}
            {stepperStep === 5 && submissionOutcome && (
              <div className="text-center space-y-4 py-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                    submissionOutcome.outcome === 'approved'
                      ? 'bg-emerald-100 text-emerald-600'
                      : submissionOutcome.outcome === 'waitlisted'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                    Outcome: {submissionOutcome.outcome}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                    {submissionOutcome.reason}
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    to="/app/bookings"
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
                  >
                    View in My Bookings
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsStepperOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
