import { Booking, ConflictCheckResult, Resource } from '../types';

/**
 * Pure function rule engine for booking conflict detection and alternative slot suggestion.
 */
export function checkConflicts(
  resource: Resource,
  requestedStart: string | Date,
  requestedEnd: string | Date,
  allBookings: Booking[],
  excludeBookingId?: string
): ConflictCheckResult {
  const reqStart = new Date(requestedStart).getTime();
  const reqEnd = new Date(requestedEnd).getTime();

  // Active blocking statuses
  const blockingStatuses = new Set(['approved', 'checked_in', 'overdue']);

  // Find overlapping bookings for this resource
  const relevantBookings = allBookings.filter(
    (b) =>
      b.resourceId === resource.id &&
      b.id !== excludeBookingId &&
      blockingStatuses.has(b.status)
  );

  let conflictingBooking: Booking | undefined;
  for (const b of relevantBookings) {
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();

    // Overlap condition: reqStart < bEnd && reqEnd > bStart
    if (reqStart < bEnd && reqEnd > bStart) {
      conflictingBooking = b;
      break;
    }
  }

  // Also check if requested time is within resource availability windows
  const reqStartDate = new Date(requestedStart);
  const dayOfWeek = reqStartDate.getDay();
  const startHour = reqStartDate.getHours();
  const endHour = new Date(requestedEnd).getHours() + (new Date(requestedEnd).getMinutes() > 0 ? 1 : 0);

  const windowForDay = resource.availabilityWindows.find((w) => w.dayOfWeek === dayOfWeek);
  const outsideWindow =
    !windowForDay || startHour < windowForDay.startHour || endHour > windowForDay.endHour;

  const reasons: string[] = [];
  if (conflictingBooking) {
    const bStartStr = new Date(conflictingBooking.start).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const bEndStr = new Date(conflictingBooking.end).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    reasons.push(
      `Slot overlaps with an existing confirmed reservation (${bStartStr} - ${bEndStr}).`
    );
  }

  if (outsideWindow) {
    const windowDesc = windowForDay
      ? `${windowForDay.startHour}:00 - ${windowForDay.endHour}:00`
      : 'Closed on this day';
    reasons.push(
      `Requested time is outside operational hours (${windowDesc}).`
    );
  }

  const hasConflict = !!conflictingBooking || outsideWindow;

  // Generate 3 suggested alternative slots if there is a conflict
  const suggestedSlots: { start: string; end: string; label: string }[] = [];
  if (hasConflict) {
    const durationMs = reqEnd - reqStart;
    const baseDate = new Date(requestedStart);

    // Try slot 2 hours after conflicting booking ends or later today
    const candidateOffsets = [2, 3, 4, 24, 26]; // in hours

    for (const offset of candidateOffsets) {
      if (suggestedSlots.length >= 3) break;
      const candStart = new Date(baseDate.getTime() + offset * 60 * 60 * 1000);
      candStart.setMinutes(0, 0, 0);
      const candEnd = new Date(candStart.getTime() + durationMs);

      // Check operational window
      const candDay = candStart.getDay();
      const candStartHour = candStart.getHours();
      const candEndHour = candEnd.getHours();
      const candWin = resource.availabilityWindows.find((w) => w.dayOfWeek === candDay);

      if (candWin && candStartHour >= candWin.startHour && candEndHour <= candWin.endHour) {
        // Check if overlaps any booking
        const overlaps = relevantBookings.some((b) => {
          const bs = new Date(b.start).getTime();
          const be = new Date(b.end).getTime();
          return candStart.getTime() < be && candEnd.getTime() > bs;
        });

        if (!overlaps) {
          const dayLabel =
            candStart.toDateString() === baseDate.toDateString()
              ? 'Today'
              : candStart.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
          const timeLabel = `${candStart.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })} - ${candEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

          suggestedSlots.push({
            start: candStart.toISOString(),
            end: candEnd.toISOString(),
            label: `${dayLabel}, ${timeLabel}`,
          });
        }
      }
    }
  }

  return {
    hasConflict,
    conflictingBooking,
    reasons,
    suggestedSlots,
  };
}
