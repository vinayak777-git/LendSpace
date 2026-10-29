import { Incident, IncidentPenalty, IncidentSeverity, IncidentType, User } from '../types';
import { getItem, setItem, initStorage } from './storage';
import { logEvent } from './auditService';
import { notificationService } from './notificationService';
import { bookingService } from './bookingService';
import { resourceService } from './resourceService';

initStorage();

export const incidentService = {
  async getIncidents(filters?: {
    resourceId?: string;
    bookingId?: string;
    status?: Incident['status'];
  }): Promise<Incident[]> {
    let list = getItem<Incident[]>('INCIDENTS', []);
    if (filters) {
      if (filters.resourceId) list = list.filter((i) => i.resourceId === filters.resourceId);
      if (filters.bookingId) list = list.filter((i) => i.bookingId === filters.bookingId);
      if (filters.status) list = list.filter((i) => i.status === filters.status);
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getIncidentById(id: string): Promise<Incident | null> {
    const list = getItem<Incident[]>('INCIDENTS', []);
    return list.find((i) => i.id === id) || null;
  },

  async createIncident(
    params: {
      bookingId: string;
      resourceId: string;
      type: IncidentType;
      severity: IncidentSeverity;
      description: string;
      photos?: string[];
    },
    actor: User
  ): Promise<Incident> {
    const list = getItem<Incident[]>('INCIDENTS', []);
    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      bookingId: params.bookingId,
      resourceId: params.resourceId,
      reporterId: actor.id,
      type: params.type,
      severity: params.severity,
      description: params.description,
      status: 'open',
      photos: params.photos || [],
      createdAt: new Date().toISOString(),
    };

    list.unshift(newIncident);
    setItem('INCIDENTS', list);

    // If linked to a booking, mark the booking disputed
    const booking = await bookingService.getBookingById(params.bookingId);
    if (booking && booking.status !== 'returned' && booking.status !== 'cancelled') {
      const allBookings = getItem<any[]>('BOOKINGS', []);
      const idx = allBookings.findIndex((b) => b.id === booking.id);
      if (idx !== -1) {
        allBookings[idx].status = 'disputed';
        allBookings[idx].decisionReason = `Dispute filed: ${params.type.toUpperCase()} (${params.severity}) - ${params.description}`;
        setItem('BOOKINGS', allBookings);
      }
    }

    const res = await resourceService.getResourceById(params.resourceId);

    await logEvent(
      { id: actor.id, name: actor.name, role: actor.role },
      'INCIDENT_REPORTED',
      newIncident.id,
      'incident',
      `Filed ${params.severity} severity ${params.type} incident: ${params.description}`,
      { bookingId: params.bookingId, resourceTitle: res?.title }
    );

    // Notify lab manager
    await notificationService.addNotification({
      userId: 'user-kiran',
      type: 'incident_update',
      title: `⚠️ New Incident: ${params.type.toUpperCase()}`,
      message: `A new ${params.severity} severity issue was reported for "${res?.title || 'Resource'}". Review required.`,
      link: '/incidents',
    });

    return newIncident;
  },

  async resolveIncident(
    incidentId: string,
    params: {
      resolution: string;
      penalty: IncidentPenalty;
      resolutionReason: string;
    },
    actor: User
  ): Promise<Incident> {
    const list = getItem<Incident[]>('INCIDENTS', []);
    const incident = list.find((i) => i.id === incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.status = 'resolved';
    incident.resolution = params.resolution;
    incident.penalty = params.penalty;
    incident.resolutionReason = params.resolutionReason;
    incident.reviewedBy = actor.id;
    incident.reviewedAt = new Date().toISOString();

    setItem('INCIDENTS', list);

    const booking = await bookingService.getBookingById(incident.bookingId);
    const res = await resourceService.getResourceById(incident.resourceId);

    await logEvent(
      { id: actor.id, name: actor.name, role: actor.role },
      'INCIDENT_RESOLVED',
      incident.id,
      'incident',
      `Incident resolved with penalty [${params.penalty}]: ${params.resolutionReason}`,
      { resolution: params.resolution, penalty: params.penalty }
    );

    if (booking) {
      await notificationService.addNotification({
        userId: booking.userId,
        type: 'incident_update',
        title: `Incident Resolved: ${incident.type.toUpperCase()}`,
        message: `Manager ${actor.name} resolved the incident for ${res?.title || 'equipment'}. Outcome: ${params.resolution}. Reason: ${params.resolutionReason}`,
        link: '/incidents',
      });
    }

    return incident;
  },

  async dismissIncident(
    incidentId: string,
    reason: string,
    actor: User
  ): Promise<Incident> {
    const list = getItem<Incident[]>('INCIDENTS', []);
    const incident = list.find((i) => i.id === incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.status = 'dismissed';
    incident.resolution = 'Dismissed without fault or penalty.';
    incident.penalty = 'none';
    incident.resolutionReason = reason;
    incident.reviewedBy = actor.id;
    incident.reviewedAt = new Date().toISOString();

    setItem('INCIDENTS', list);

    await logEvent(
      { id: actor.id, name: actor.name, role: actor.role },
      'INCIDENT_DISMISSED',
      incident.id,
      'incident',
      reason || 'Incident dismissed after review; no violation found.'
    );

    return incident;
  },
};
