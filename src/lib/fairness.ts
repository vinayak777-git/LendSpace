import { User, Resource, Booking, FairnessCheckResult, ScoreBreakdown, WaitlistEntry } from '../types';

/**
 * Pure function rule engine for fairness and allocation scoring.
 */

export function calculatePriorityScore(
  user: User,
  purpose: string,
  isAcademic: boolean = false,
  waitingHours: number = 0
): { score: number; breakdown: ScoreBreakdown } {
  // 1. Purpose Weight
  const pLower = (purpose || '').toLowerCase();
  let purposeWeight = 15; // default
  if (pLower.includes('capstone') || pLower.includes('thesis') || pLower.includes('dissertation')) {
    purposeWeight = 35;
  } else if (pLower.includes('coursework') || pLower.includes('lab') || pLower.includes('assignment') || pLower.includes('project')) {
    purposeWeight = 25;
  } else if (pLower.includes('competition') || pLower.includes('hackathon') || pLower.includes('robotics')) {
    purposeWeight = 20;
  } else if (pLower.includes('hobby') || pLower.includes('personal') || pLower.includes('fun')) {
    purposeWeight = 10;
  }

  // 2. Recent Hours Score (fewer hours = higher priority; max 40 pts)
  const hoursUsed = user.usageStats?.hoursThisWeek || 0;
  const recentHoursScore = Math.max(0, 40 - Math.round(hoursUsed * 4));

  // 3. Academic link score (+15 points if verified course project or thesis)
  const academicLinkScore = isAcademic ? 15 : 0;

  // 4. Waiting time (+3 points per hour spent waiting in queue, capped at 30)
  const waitingTimeScore = Math.min(30, Math.round(waitingHours * 3));

  // 5. Late return penalty (-15 points per late return)
  const lateCount = user.usageStats?.lateReturnsCount || 0;
  const latePenalty = lateCount * 15;

  const total = Math.max(
    5,
    purposeWeight + recentHoursScore + academicLinkScore + waitingTimeScore - latePenalty
  );

  return {
    score: total,
    breakdown: {
      purposeWeight,
      recentHoursScore,
      academicLinkScore,
      waitingTimeScore,
      latePenalty,
      total,
    },
  };
}

export function checkFairness(
  user: User,
  resource: Resource,
  requestedHours: number,
  allBookings: Booking[],
  purpose: string = '',
  isAcademic: boolean = false
): FairnessCheckResult {
  const reasons: string[] = [];
  const userHoursThisWeek = user.usageStats?.hoursThisWeek || 0;
  const maxWeeklyHours = resource.maxHoursPerWeekPerUser || 12;

  // 1. Weekly Hour Cap Check
  const willExceedWeeklyCap = userHoursThisWeek + requestedHours > maxWeeklyHours;
  if (willExceedWeeklyCap) {
    reasons.push(
      `Exceeds weekly cap: You have used ${userHoursThisWeek}h of your ${maxWeeklyHours}h weekly limit for this resource.`
    );
  }

  // 2. Max Booking Duration Check
  const maxBookingHours = resource.maxHoursPerBooking || 4;
  if (requestedHours > maxBookingHours) {
    reasons.push(
      `Exceeds single session limit: Max allowed session duration is ${maxBookingHours}h (requested ${requestedHours}h).`
    );
  }

  // 3. Active Pending Request Cap (Max 1 pending request per scarce/high-demand resource)
  const userPendingForThis = allBookings.filter(
    (b) =>
      b.userId === user.id &&
      b.resourceId === resource.id &&
      (b.status === 'pending' || b.status === 'waitlisted')
  );

  const activePendingCount = userPendingForThis.length;
  const maxActivePending = resource.demandLevel === 'high' ? 1 : 2;

  if (activePendingCount >= maxActivePending) {
    reasons.push(
      `Pending request cap reached: High-demand resources allow at most ${maxActivePending} active pending/waitlisted request at a time.`
    );
  }

  // 4. Cooldown Check (if user completed a 3h+ booking on a high demand resource in the last 18 hours)
  const userRecentBookings = allBookings.filter(
    (b) =>
      b.userId === user.id &&
      b.resourceId === resource.id &&
      (b.status === 'returned' || b.status === 'checked_in')
  );

  let cooldownActive = false;
  let cooldownEndsAt: string | undefined;

  if (resource.demandLevel === 'high' && resource.cooldownHours) {
    const now = Date.now();
    for (const b of userRecentBookings) {
      const endTime = new Date(b.end).getTime();
      const bDurationHours = (endTime - new Date(b.start).getTime()) / (1000 * 60 * 60);
      if (bDurationHours >= 2) {
        const cooldownMs = resource.cooldownHours * 60 * 60 * 1000;
        if (now < endTime + cooldownMs) {
          cooldownActive = true;
          cooldownEndsAt = new Date(endTime + cooldownMs).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          reasons.push(
            `Cooldown in effect: A ${resource.cooldownHours}h fairness cooldown is active until ${cooldownEndsAt} following your previous high-usage booking.`
          );
          break;
        }
      }
    }
  }

  // Calculate score
  const { score: priorityScore, breakdown: scoreBreakdown } = calculatePriorityScore(
    user,
    purpose,
    isAcademic,
    0
  );

  const allowed = !willExceedWeeklyCap && !cooldownActive && activePendingCount < maxActivePending;

  let warning: string | undefined;
  if (allowed && userHoursThisWeek + requestedHours >= maxWeeklyHours * 0.75) {
    warning = `Heads up: You will have used ${userHoursThisWeek + requestedHours}h of your ${maxWeeklyHours}h limit after this booking.`;
  }

  return {
    allowed,
    userHoursThisWeek,
    maxWeeklyHours,
    cooldownActive,
    cooldownEndsAt,
    activePendingCount,
    maxActivePending,
    priorityScore,
    scoreBreakdown,
    reasons,
    warning,
  };
}

/**
 * Sorts waitlist entries in descending order of priority score
 */
export function rankWaitlist(entries: WaitlistEntry[]): WaitlistEntry[] {
  const sorted = [...entries].sort((a, b) => b.priorityScore - a.priorityScore);
  return sorted.map((entry, idx) => ({
    ...entry,
    position: idx + 1,
  }));
}

export const evaluateFairness = checkFairness;
