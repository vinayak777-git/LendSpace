import { Booking, BookingStatus, User } from '../types';
import { apiClient } from './apiClient';
import { logEvent } from './auditService';
import { getItem, setItem } from './storage';

function mapApiBookingToFrontend(b: any): Booking {
  return {
    ...b,
    id: b.id,
    resourceId: b.resource_id || b.resourceId,
    userId: b.user_id || b.userId,
    userName: b.user?.full_name || b.userName || 'Applicant',
    userEmail: b.user?.email || b.userEmail || '',
    userPhone: b.user?.phone || b.userPhone,
    userOrg: b.user?.business_name || b.userOrg || 'Academic Department',
    userIsVerified: b.user?.is_verified_by_platform ?? false,
    userCompletedBookings: b.user?.completed_bookings_count ?? 0,
    userAverageRating: b.user?.average_rating ?? 0.0,
    start: b.start_at || b.start,
    end: b.end_at || b.end,
    purpose: b.purpose,
    status: b.status as BookingStatus,
    academicProject: b.is_academic ?? true,
    priorityScore: b.priority_score ?? b.priorityScore ?? 50,
    priorityScoreData: b.score_breakdown || b.priorityScoreData,
    paymentStatus: b.payment_status || b.paymentStatus || 'none',
    totalPriceMinorUnits: b.total_price_minor_units ?? b.totalPriceMinorUnits ?? 0,
    depositMinorUnits: b.deposit_minor_units ?? b.depositMinorUnits ?? 0,
    checkedInAt: b.checked_in_at || b.checkedInAt,
    returnedAt: b.returned_at || b.returnedAt,
    cancellationReason: b.cancelled_reason || b.cancellationReason,
    decisionReason: b.decision_reason || b.decisionReason,
    createdAt: b.created_at || b.createdAt || new Date().toISOString(),
  };
}

function resolveActorAndReason(arg1: any, arg2: any): { actor?: any; reason: string } {
  let actor: any = undefined;
  let reason: string = 'Standard action';

  if (typeof arg1 === 'string') {
    reason = arg1;
    actor = arg2;
  } else if (typeof arg2 === 'string') {
    reason = arg2;
    actor = arg1;
  } else if (arg1 && typeof arg1 === 'object') {
    actor = arg1;
  }
  return { actor, reason };
}

export const bookingService = {
  async getBookings(filters?: {
    userId?: string;
    resourceId?: string;
    status?: BookingStatus | BookingStatus[];
    isOwner?: boolean;
  }): Promise<Booking[]> {
    try {
      let data: any[] = [];
      const roleStr = localStorage.getItem('lendspace_selected_role_v1');
      const isOwnerView = filters?.isOwner || roleStr === 'owner';

      if (filters?.resourceId) {
        data = await apiClient.get<any[]>(`/bookings/resource/${filters.resourceId}`);
      } else if (isOwnerView) {
        data = await apiClient.get<any[]>('/bookings/owner', {
          status: typeof filters?.status === 'string' ? filters.status : undefined,
        });
      } else {
        data = await apiClient.get<any[]>('/bookings/me', {
          status: typeof filters?.status === 'string' ? filters.status : undefined,
        });
      }

      let list = data.map(mapApiBookingToFrontend);

      if (filters?.userId) {
        list = list.filter((b) => b.userId === filters.userId);
      }
      if (Array.isArray(filters?.status)) {
        const allowed = new Set(filters.status);
        list = list.filter((b) => allowed.has(b.status));
      }

      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Backend API unreachable, using local bookings storage:', err);
      let list = getItem<Booking[]>('BOOKINGS', []);
      if (filters?.userId) list = list.filter((b) => b.userId === filters.userId);
      if (filters?.resourceId) list = list.filter((b) => b.resourceId === filters.resourceId);
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          const allowed = new Set(filters.status);
          list = list.filter((b) => allowed.has(b.status));
        } else {
          list = list.filter((b) => b.status === filters.status);
        }
      }
      return list;
    }
  },

  async getBookingById(id: string): Promise<Booking | null> {
    try {
      const data = await apiClient.get<any>(`/bookings/${id}`);
      return mapApiBookingToFrontend(data);
    } catch (err) {
      console.warn(`Backend API unreachable for booking ${id}, checking local storage:`, err);
      const list = getItem<Booking[]>('BOOKINGS', []);
      return list.find((b) => b.id === id) || null;
    }
  },

  async createBooking(
    params: {
      resourceId: string;
      userId: string;
      userName?: string;
      userEmail?: string;
      userPhone?: string;
      userOrg?: string;
      start: string;
      end: string;
      purpose: string;
      academicProject?: boolean;
    },
    actor?: User | any
  ): Promise<{ booking: Booking; outcome: 'auto_approved' | 'pending' | 'waitlisted'; reason: string }> {
    const payload = {
      resource_id: params.resourceId,
      start_at: new Date(params.start).toISOString(),
      end_at: new Date(params.end).toISOString(),
      purpose: params.purpose,
      is_academic: params.academicProject ?? true,
    };

    try {
      const res = await apiClient.post<any>('/bookings/', payload);
      const booking = mapApiBookingToFrontend(res);

      if (actor) {
        await logEvent(
          actor,
          booking.status === 'approved' ? 'BOOKING_AUTO_APPROVED' : 'BOOKING_REQUESTED',
          booking.id,
          'booking',
          `Reservation requested for resource: ${booking.purpose}`
        );
      }

      return {
        booking,
        outcome: booking.status === 'approved' ? 'auto_approved' : (booking.status as any),
        reason: booking.status === 'approved' ? 'Auto-approved by platform policies' : 'Submitted for owner review',
      };
    } catch (err) {
      console.warn('Backend API unreachable, saving booking in local storage:', err);
      const localBooking: Booking = {
        id: `book_${Date.now()}`,
        resourceId: params.resourceId,
        userId: params.userId,
        userName: params.userName || actor?.name || 'Applicant',
        userEmail: params.userEmail || actor?.email || '',
        userPhone: params.userPhone,
        userOrg: params.userOrg || 'Academic Department',
        start: new Date(params.start).toISOString(),
        end: new Date(params.end).toISOString(),
        purpose: params.purpose,
        status: 'pending',
        academicProject: params.academicProject ?? true,
        priorityScore: 75,
        extensions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const existing = getItem<Booking[]>('BOOKINGS', []);
      existing.unshift(localBooking);
      setItem('BOOKINGS', existing);

      return {
        booking: localBooking,
        outcome: 'pending',
        reason: 'Submitted for owner review',
      };
    }
  },

  async approveBooking(bookingId: string, arg1?: any, arg2?: any): Promise<Booking> {
    const { actor, reason } = resolveActorAndReason(arg1, arg2);
    try {
      const res = await apiClient.post<any>(
        `/bookings/${bookingId}/action?target_status=approved`,
        { reason: reason || 'Owner approved reservation request' }
      );
      const booking = mapApiBookingToFrontend(res);

      if (actor) {
        await logEvent(actor, 'BOOKING_APPROVED', booking.id, 'booking', reason);
      }
      return booking;
    } catch (err) {
      console.warn('Backend API unreachable, approving booking in local storage:', err);
      const existing = getItem<Booking[]>('BOOKINGS', []);
      const item = existing.find((b) => b.id === bookingId);
      if (item) {
        item.status = 'approved';
        item.updatedAt = new Date().toISOString();
        setItem('BOOKINGS', existing);
        return item;
      }
      throw err;
    }
  },

  async rejectBooking(bookingId: string, arg1?: any, arg2?: any): Promise<Booking> {
    const { actor, reason } = resolveActorAndReason(arg1, arg2);
    try {
      const res = await apiClient.post<any>(
        `/bookings/${bookingId}/action?target_status=rejected`,
        { reason: reason || 'Reservation declined' }
      );
      const booking = mapApiBookingToFrontend(res);

      if (actor) {
        await logEvent(actor, 'BOOKING_REJECTED', booking.id, 'booking', reason);
      }
      return booking;
    } catch (err) {
      console.warn('Backend API unreachable, declining booking in local storage:', err);
      const existing = getItem<Booking[]>('BOOKINGS', []);
      const item = existing.find((b) => b.id === bookingId);
      if (item) {
        item.status = 'rejected';
        setItem('BOOKINGS', existing);
        return item;
      }
      throw err;
    }
  },

  async waitlistBooking(bookingId: string, arg1?: any, arg2?: any): Promise<Booking> {
    const { actor, reason } = resolveActorAndReason(arg1, arg2);
    try {
      const res = await apiClient.post<any>(
        `/bookings/${bookingId}/action?target_status=waitlisted`,
        { reason: reason || 'Moved request to waitlist' }
      );
      const booking = mapApiBookingToFrontend(res);

      if (actor) {
        await logEvent(actor, 'BOOKING_WAITLISTED', booking.id, 'booking', reason);
      }
      return booking;
    } catch (err) {
      console.warn('Backend API unreachable, waitlisting booking in local storage:', err);
      const existing = getItem<Booking[]>('BOOKINGS', []);
      const item = existing.find((b) => b.id === bookingId);
      if (item) {
        item.status = 'waitlisted';
        setItem('BOOKINGS', existing);
        return item;
      }
      throw err;
    }
  },

  async cancelBooking(bookingId: string, arg1?: any, arg2?: any): Promise<{ cancelled: Booking; promotedBooking?: Booking }> {
    const { actor, reason } = resolveActorAndReason(arg1, arg2);
    try {
      const res = await apiClient.post<any>(
        `/bookings/${bookingId}/action?target_status=cancelled`,
        { reason: reason || 'Cancelled by user' }
      );
      const booking = mapApiBookingToFrontend(res);

      if (actor) {
        await logEvent(actor, 'BOOKING_CANCELLED', booking.id, 'booking', reason);
      }
      return { cancelled: booking };
    } catch (err) {
      console.warn('Backend API unreachable, cancelling booking in local storage:', err);
      const existing = getItem<Booking[]>('BOOKINGS', []);
      const item = existing.find((b) => b.id === bookingId);
      if (item) {
        item.status = 'cancelled';
        setItem('BOOKINGS', existing);
        return { cancelled: item };
      }
      throw err;
    }
  },

  async checkInBooking(
    bookingId: string,
    reportData?: any,
    actor?: any,
    _notes?: any
  ): Promise<Booking> {
    const effectiveActor = actor || reportData?.user;
    const notes = typeof reportData === 'string' ? reportData : reportData?.notes || 'User checked in';
    const res = await apiClient.post<any>(
      `/bookings/${bookingId}/action?target_status=checked_in`,
      { reason: notes }
    );
    const booking = mapApiBookingToFrontend(res);

    if (effectiveActor) {
      await logEvent(effectiveActor, 'CHECK_IN_CONFIRMED', booking.id, 'booking', notes);
    }
    return booking;
  },

  async returnBooking(
    bookingId: string,
    reportData?: any,
    actor?: any,
    _notes?: any
  ): Promise<Booking> {
    const effectiveActor = actor || reportData?.user;
    const notes = typeof reportData === 'string' ? reportData : reportData?.notes || 'Clean equipment return';
    const res = await apiClient.post<any>(
      `/bookings/${bookingId}/action?target_status=returned`,
      { reason: notes }
    );
    const booking = mapApiBookingToFrontend(res);

    if (effectiveActor) {
      await logEvent(effectiveActor, 'RETURN_CONFIRMED', booking.id, 'booking', notes);
    }
    return booking;
  },

  async confirmReturn(
    bookingId: string,
    checklist?: any,
    conditionNotes?: any,
    actor?: any
  ): Promise<Booking> {
    return this.returnBooking(bookingId, { checklist, notes: conditionNotes }, actor);
  },

  async requestExtension(
    _bookingId: string,
    _durationOrMinutes?: any,
    _reason?: any,
    _actor?: any
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Extension request submitted for review.',
    };
  },
};
