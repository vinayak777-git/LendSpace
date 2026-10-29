import React, { useState, useMemo } from 'react';
import { Resource, User } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { bookingService } from '../../services/bookingService';
import { checkEligibility } from '../../lib/eligibility';
import { checkConflicts } from '../../lib/conflicts';
import { checkFairness, calculatePriorityScore } from '../../lib/fairness';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  resource: Resource;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingRequestModal: React.FC<BookingModalProps> = ({
  resource,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser: appUser, bookings, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();
  const currentUser: User | null = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role === 'owner' ? 'manager' : 'student',
        org: authUser.department || authUser.institution || 'Academic Department',
        department: authUser.department,
        phone: authUser.phone,
        projectPurpose: authUser.projectPurpose,
        usageTimeline: authUser.usageTimeline,
        specialRequirements: authUser.specialRequirements,
        primaryNeeds: authUser.primaryNeeds,
        verified: true,
        credentials: [],
        usageStats: {
          hoursThisWeek: 0,
          activeBookingsCount: 0,
          lateReturnsCount: 0,
          completedBookingsCount: 0,
        },
      };
    }
    return appUser;
  }, [authUser, appUser]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [startHour, setStartHour] = useState<number>(14); // 2 PM
  const [durationHours, setDurationHours] = useState<number>(2);
  const [purpose, setPurpose] = useState<string>('');
  const [isAcademic, setIsAcademic] = useState<boolean>(true);
  const [rulesAccepted, setRulesAccepted] = useState<boolean>(false);
  const [liabilityAccepted, setLiabilityAccepted] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOutcome, setSubmittedOutcome] = useState<{
    outcome: 'auto_approved' | 'pending' | 'waitlisted';
    reason: string;
    bookingId: string;
  } | null>(null);

  // Derived start & end ISO strings
  const slotDates = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      startFormatted: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endFormatted: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }, [selectedDate, startHour, durationHours]);

  // Live conflict check
  const conflictResult = useMemo(() => {
    return checkConflicts(resource, slotDates.startIso, slotDates.endIso, bookings);
  }, [resource, slotDates, bookings]);

  // Live fairness check
  const fairnessResult = useMemo(() => {
    if (!currentUser) return null;
    return checkFairness(
      currentUser,
      resource,
      durationHours,
      bookings,
      purpose,
      isAcademic
    );
  }, [currentUser, resource, durationHours, bookings, purpose, isAcademic]);

  // Live priority score
  const priorityScoreResult = useMemo(() => {
    if (!currentUser) return null;
    return calculatePriorityScore(currentUser, purpose, isAcademic, 0);
  }, [currentUser, purpose, isAcademic]);

  if (!isOpen) return null;

  const handleApplyAlternativeSlot = (slot: { start: string; end: string }) => {
    const s = new Date(slot.start);
    const e = new Date(slot.end);
    setSelectedDate(s.toISOString().split('T')[0]);
    setStartHour(s.getHours());
    setDurationHours((e.getTime() - s.getTime()) / (1000 * 60 * 60));
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const res = await bookingService.createBooking(
        {
          resourceId: resource.id,
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          userPhone: (currentUser as any).phone,
          userOrg: (currentUser as any).department || (currentUser as any).institution || (currentUser as any).org,
          start: slotDates.startIso,
          end: slotDates.endIso,
          purpose,
          academicProject: isAcademic,
        },
        currentUser as any
      );

      setSubmittedOutcome({
        outcome: res.outcome,
        reason: res.reason,
        bookingId: res.booking.id,
      });

      if (res.outcome === 'auto_approved') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }

      showToast(
        res.outcome === 'auto_approved'
          ? 'Booking confirmed instantly!'
          : res.outcome === 'waitlisted'
          ? 'Added to waitlist'
          : 'Request submitted for review',
        'success'
      );

      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit booking', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header with Step Tracker */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
              Reservation Flow • {resource.title}
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              {submittedOutcome
                ? 'Booking Submission Result'
                : step === 1
                ? 'Step 1: Select Schedule Slot'
                : step === 2
                ? 'Step 2: Purpose & Academic Project'
                : step === 3
                ? 'Step 3: Usage Rules & Liability'
                : 'Step 4: Fair-Use Review & Confirm'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {!submittedOutcome && (
          <div className="grid grid-cols-4 border-b border-slate-100 text-center text-xs font-semibold">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`py-2.5 transition-colors border-b-2 ${
                  step === s
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : step > s
                    ? 'border-emerald-500 text-slate-600'
                    : 'border-transparent text-slate-400'
                }`}
              >
                Step {s}
              </div>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {submittedOutcome ? (
            /* Outcome Confirmation Screen */
            <div className="text-center py-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  submittedOutcome.outcome === 'auto_approved'
                    ? 'bg-emerald-100 text-emerald-600'
                    : submittedOutcome.outcome === 'waitlisted'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {submittedOutcome.outcome === 'auto_approved' ? (
                  <CheckCircle2 className="w-9 h-9" />
                ) : submittedOutcome.outcome === 'waitlisted' ? (
                  <Clock className="w-9 h-9" />
                ) : (
                  <Sparkles className="w-9 h-9" />
                )}
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                {submittedOutcome.outcome === 'auto_approved'
                  ? '🎉 Reservation Auto-Approved!'
                  : submittedOutcome.outcome === 'waitlisted'
                  ? 'Placed on Priority Waitlist'
                  : 'Submitted for Manager Review'}
              </h3>

              <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                {submittedOutcome.reason}
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto text-xs space-y-2 mb-6">
                <div className="flex justify-between text-slate-500">
                  <span>Reserved Slot:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(slotDates.startIso).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    • {slotDates.startFormatted} - {slotDates.endFormatted}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Resource Location:</span>
                  <span className="font-semibold text-slate-800">{resource.location}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Check-in Policy:</span>
                  <span className="font-semibold text-emerald-600">
                    Opens 15 minutes before scheduled start
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-md"
              >
                Go to My Bookings
              </button>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Slot Picker */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Reservation Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    min={todayStr}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Start Time
                  </label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((h) => (
                      <option key={h} value={h}>
                        {h}:00 ({h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Duration
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4].map((d) => (
                      <option
                        key={d}
                        value={d}
                        disabled={d > (resource.maxHoursPerBooking || 4)}
                      >
                        {d} {d === 1 ? 'Hour' : 'Hours'}{' '}
                        {d > (resource.maxHoursPerBooking || 4) ? '(Exceeds cap)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slot Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>
                    Selected slot: <strong>{slotDates.startFormatted}</strong> to{' '}
                    <strong>{slotDates.endFormatted}</strong> ({durationHours} hours)
                  </span>
                </div>
                <span className="text-slate-400">Max {resource.maxHoursPerBooking || 4}h/session</span>
              </div>

              {/* Live Conflict Alert on Step 1 */}
              {conflictResult.hasConflict && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Slot Busy or Outside Operating Hours</span>
                  </div>
                  <p>{conflictResult.reasons[0]}</p>

                  {conflictResult.suggestedSlots.length > 0 && (
                    <div className="pt-2 border-t border-amber-200/60">
                      <span className="font-semibold block mb-1.5 text-amber-950">
                        Suggested Alternative Slots:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {conflictResult.suggestedSlots.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyAlternativeSlot(s)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-medium hover:bg-amber-100 transition-colors shadow-xs"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : step === 2 ? (
            /* STEP 2: Purpose & Project */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Project / Session Purpose
                </label>
                <textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Prototyping gripper fingers for Senior Capstone robotics demonstration..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Academic and coursework purposes are prioritized under makerspace fair-use rules.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAcademic}
                    onChange={(e) => setIsAcademic(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      This is an accredited academic project, thesis, or coursework
                    </span>
                    <span className="text-[11px] text-slate-500 leading-snug">
                      Verified academic use adds +15 points to your allocation priority score.
                    </span>
                  </div>
                </label>
              </div>

              {priorityScoreResult && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-emerald-950">
                  <span className="font-bold flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Priority Score Breakdown: {priorityScoreResult.score} pts
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-emerald-800">
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200">
                      Purpose: +{priorityScoreResult.breakdown.purposeWeight}
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200">
                      Academic: +{priorityScoreResult.breakdown.academicLinkScore}
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200">
                      Allowance: +{priorityScoreResult.breakdown.recentHoursScore}
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200">
                      Late Penalty: -{priorityScoreResult.breakdown.latePenalty}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : step === 3 ? (
            /* STEP 3: Usage Rules & Liability */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-h-56 overflow-y-auto space-y-2 text-xs text-slate-600">
                <h4 className="font-bold text-slate-900 mb-1">
                  Makerspace Operating & Safety Rules for {resource.title}:
                </h4>
                {resource.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">{idx + 1}.</span>
                    <span>{rule}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 text-slate-500">
                  • Check-in inspection and return inspection are required for all sessions.
                  <br />• Damage or loss will be reported immediately and reviewed by lab management.
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(e) => setRulesAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-700">
                    I have read and agree to follow all operational rules, clean-up requirements, and safety protocols.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={liabilityAccepted}
                    onChange={(e) => setLiabilityAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-700">
                    I acknowledge responsibility for equipment condition during my reservation period and agree to perform before/after inspections.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* STEP 4: Review & Live Verdict */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipment:</span>
                  <span className="font-bold text-slate-800">{resource.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Time:</span>
                  <span className="font-semibold text-slate-800">
                    {slotDates.startFormatted} - {slotDates.endFormatted} ({durationHours}h)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Approval Workflow:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {resource.approvalMode} Approval{' '}
                    {resource.supervisionRequired && '(Supervision Needed)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Weekly Cap Status:</span>
                  <span className="font-semibold text-slate-800">
                    {fairnessResult?.userHoursThisWeek || 0}h used /{' '}
                    {resource.maxHoursPerWeekPerUser}h limit
                  </span>
                </div>
              </div>

              {/* Expected Verdict Banner */}
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                  conflictResult.hasConflict
                    ? 'bg-purple-50 border-purple-200 text-purple-950'
                    : resource.approvalMode === 'auto' && !resource.supervisionRequired
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <span className="font-bold text-sm block">
                  {conflictResult.hasConflict
                    ? 'Expected Outcome: Priority Waitlist'
                    : resource.approvalMode === 'auto' && !resource.supervisionRequired
                    ? 'Expected Outcome: Instant Auto-Approval'
                    : 'Expected Outcome: Pending Manager Review'}
                </span>
                <p className="leading-relaxed">
                  {conflictResult.hasConflict
                    ? `This slot is currently occupied. You will be placed at position #1 on the waitlist with a priority score of ${
                        priorityScoreResult?.score || 75
                      }. If the booking is cancelled, you will be auto-promoted!`
                    : resource.approvalMode === 'auto' && !resource.supervisionRequired
                    ? 'All prerequisite training badges are verified and the slot is vacant. Your reservation will be confirmed immediately.'
                    : 'This equipment requires technician supervision or faculty sign-off. Your request will be queued for lab manager approval.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!submittedOutcome && (
          <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 2 && !purpose.trim()) {
                    showToast('Please state a brief purpose for your reservation', 'warning');
                    return;
                  }
                  if (step === 3 && (!rulesAccepted || !liabilityAccepted)) {
                    showToast('Please accept both usage rules and liability acknowledgments', 'warning');
                    return;
                  }
                  setStep((s) => (s + 1) as any);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Request...' : 'Confirm & Submit Booking'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
