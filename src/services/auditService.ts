import { AuditEvent } from '../types';
import { getItem, setItem, initStorage } from './storage';

initStorage();

export const auditService = {
  async getAuditEvents(filters?: {
    actorId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
  }): Promise<AuditEvent[]> {
    let events = getItem<AuditEvent[]>('AUDIT', []);
    if (filters) {
      if (filters.actorId) events = events.filter((e) => e.actorId === filters.actorId);
      if (filters.action) events = events.filter((e) => e.action.toLowerCase().includes(filters.action!.toLowerCase()));
      if (filters.targetType) events = events.filter((e) => e.targetType === filters.targetType);
      if (filters.targetId) events = events.filter((e) => e.targetId === filters.targetId);
    }
    // Return sorted newest first
    return [...events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  async logEvent(
    actor: { id: string; name: string; role: string },
    action: string,
    targetId: string,
    targetType: AuditEvent['targetType'],
    reason: string,
    metadata?: Record<string, any>
  ): Promise<AuditEvent> {
    const events = getItem<AuditEvent[]>('AUDIT', []);
    const newEvent: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      targetId,
      targetType,
      reason,
      metadata,
      timestamp: new Date().toISOString(),
    };

    events.unshift(newEvent);
    setItem('AUDIT', events);
    return newEvent;
  },
};

export const logEvent = auditService.logEvent;
