import { Resource } from '../types';
import { apiClient } from './apiClient';
import { logEvent } from './auditService';

function mapApiResourceToFrontend(r: any): Resource {
  return {
    ...r,
    id: r.id,
    title: r.title,
    description: r.description,
    kind: r.kind || 'equipment',
    type: r.kind || 'equipment',
    category: r.category,
    location: r.location,
    building: r.building,
    room: r.room,
    capacity: r.capacity,
    assetTag: r.asset_tag || r.assetTag,
    conditionNotes: r.condition_notes || r.conditionNotes,
    images: r.images || [],
    status: r.status || 'live',
    isPaused: r.status === 'paused',
    approvalMode: r.approval_mode || r.approvalMode || 'manual',
    supervisionRequired: r.supervision_required ?? r.supervisionRequired ?? false,
    depositAmount: r.deposit_amount ?? r.depositAmount ?? 0,
    maxHoursPerBooking: r.max_hours_per_booking ?? r.maxHoursPerBooking ?? 4,
    maxHoursPerWeekPerUser: r.max_hours_per_week_per_user ?? r.maxHoursPerWeekPerUser ?? 12,
    cooldownHours: r.cooldown_hours ?? r.cooldownHours ?? 0,
    maxAdvanceDays: r.max_advance_days ?? r.maxAdvanceDays ?? 14,
    bufferMinutes: r.buffer_minutes ?? r.bufferMinutes ?? 15,
    allowedAudience: r.allowed_audience || r.allowedAudience || 'anyone_verified',
    whoMayBook: r.allowed_audience || r.whoMayBook || 'anyone_verified',
    waitlistEnabled: r.waitlist_enabled ?? r.waitlistEnabled ?? true,
    safetyNotes: r.safety_notes || r.safetyNotes,
    rules: r.usage_rules || r.rules || [],
    usageRules: r.usage_rules || r.rules || [],
    conditionChecklist: r.condition_checklist || r.conditionChecklist || [],
    checklistItems: r.condition_checklist || r.checklistItems || [],
    requirements: (r.requirements || []).map((req: any) => ({
      id: req.id || req.name,
      type: req.type,
      label: req.name || req.label,
      credentialType: req.required_credential_name || req.credentialType,
    })),
    availabilityWindows: (r.availability_windows || []).map((w: any) => ({
      dayOfWeek: w.weekday ?? w.dayOfWeek ?? 1,
      startHour: parseInt(w.start_time?.split(':')[0] || '8', 10),
      endHour: parseInt(w.end_time?.split(':')[0] || '20', 10),
    })),
    hourlyRate: r.hourly_rate ?? r.hourlyRate ?? 0,
    dailyRate: r.daily_rate ?? r.dailyRate ?? 0,
    pricingModel: r.pricing_model || r.pricingModel || 'hourly',
    currency: r.currency || '₹',
    isFree: (r.pricing_model === 'free') || ((r.hourly_rate ?? 0) === 0 && (r.daily_rate ?? 0) === 0),
    areaSqFt: r.area_sq_ft ?? r.areaSqFt,
    ownerId: r.owner_id || r.ownerId,
    managerIds: (r.managers || []).map((m: any) => m.user_id),
    demandLevel: 'medium',
  };
}

function mapFrontendToApiPayload(r: any): any {
  return {
    title: r.title,
    description: r.description || '',
    kind: r.type || r.kind || 'equipment',
    category: r.category || 'general',
    location: r.location || 'Main Campus',
    building: r.building,
    room: r.room,
    capacity: r.capacity,
    asset_tag: r.assetTag,
    condition_notes: r.conditionNotes,
    images: r.images || [],
    status: r.status || (r.isPaused ? 'paused' : 'live'),
    approval_mode: r.approvalMode || 'manual',
    supervision_required: r.supervisionRequired ?? false,
    deposit_amount: r.depositAmount ?? 0,
    max_hours_per_booking: r.maxHoursPerBooking ?? 4,
    max_hours_per_week_per_user: r.maxHoursPerWeekPerUser ?? 12,
    cooldown_hours: r.cooldownHours ?? 0,
    max_advance_days: r.maxAdvanceDays ?? 14,
    buffer_minutes: r.bufferMinutes ?? 15,
    allowed_audience: r.whoMayBook || r.allowedAudience || 'anyone_verified',
    waitlist_enabled: r.waitlistEnabled ?? true,
    safety_notes: r.safetyNotes,
    usage_rules: r.rules || r.usageRules || [],
    condition_checklist: r.checklistItems || r.conditionChecklist || [],
    hourly_rate: r.hourlyRate ?? 0,
    daily_rate: r.dailyRate ?? 0,
    pricing_model: r.pricingModel || (r.isFree ? 'free' : 'hourly'),
    currency: r.currency || '₹',
    area_sq_ft: r.areaSqFt,
    requirements: (r.requirements || []).map((req: any) => ({
      type: req.type || 'training',
      name: req.label || req.type,
      required_credential_name: req.credentialType,
    })),
    availability_windows: (r.availabilityWindows || []).map((w: any) => ({
      weekday: w.dayOfWeek,
      start_time: `${String(w.startHour).padStart(2, '0')}:00`,
      end_time: `${String(w.endHour).padStart(2, '0')}:00`,
    })),
    blackout_dates: [],
    managers: [],
  };
}

export const resourceService = {
  async getResources(filters?: {
    query?: string;
    category?: string;
    kind?: string;
    status?: string;
    owner_id?: string;
  }): Promise<Resource[]> {
    try {
      const data = await apiClient.get<any[]>('/resources/', filters);
      return data.map(mapApiResourceToFrontend);
    } catch (err) {
      console.error('Failed to fetch resources from backend API:', err);
      return [];
    }
  },

  async getResourceById(id: string): Promise<Resource | null> {
    try {
      const data = await apiClient.get<any>(`/resources/${id}`);
      return mapApiResourceToFrontend(data);
    } catch (err) {
      console.error(`Failed to fetch resource ${id} from backend API:`, err);
      return null;
    }
  },

  async createResource(
    data: Omit<Resource, 'id'>,
    actor?: { id: string; name: string; role: string }
  ): Promise<Resource> {
    const payload = mapFrontendToApiPayload(data);
    const created = await apiClient.post<any>('/resources/', payload);
    const mapped = mapApiResourceToFrontend(created);

    if (actor) {
      await logEvent(
        actor,
        'RESOURCE_CREATED',
        mapped.id,
        'resource',
        `Owner registered listing "${mapped.title}" with category ${mapped.category}.`
      );
    }

    return mapped;
  },

  async updateResource(
    id: string,
    updates: Partial<Resource>,
    actor?: { id: string; name: string; role: string },
    reason?: string
  ): Promise<Resource> {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.isPaused !== undefined) payload.status = updates.isPaused ? 'paused' : 'live';
    if (updates.hourlyRate !== undefined) payload.hourly_rate = updates.hourlyRate;
    if (updates.dailyRate !== undefined) payload.daily_rate = updates.dailyRate;
    if (updates.pricingModel !== undefined) payload.pricing_model = updates.pricingModel;
    if (updates.depositAmount !== undefined) payload.deposit_amount = updates.depositAmount;
    if (updates.areaSqFt !== undefined) payload.area_sq_ft = updates.areaSqFt;
    if (updates.capacity !== undefined) payload.capacity = updates.capacity;

    const updated = await apiClient.patch<any>(`/resources/${id}`, payload);
    const mapped = mapApiResourceToFrontend(updated);

    if (actor) {
      await logEvent(
        actor,
        'RESOURCE_UPDATED',
        id,
        'resource',
        reason || `Updated settings for ${mapped.title}.`
      );
    }

    return mapped;
  },

  async togglePause(
    id: string,
    actor: { id: string; name: string; role: string },
    reason?: string
  ): Promise<Resource> {
    const current = await this.getResourceById(id);
    if (!current) throw new Error('Resource not found');
    const newStatus = current.status === 'paused' ? 'live' : 'paused';

    const updated = await apiClient.patch<any>(`/resources/${id}`, { status: newStatus });
    const mapped = mapApiResourceToFrontend(updated);

    await logEvent(
      actor,
      newStatus === 'paused' ? 'RESOURCE_PAUSED' : 'RESOURCE_RESUMED',
      id,
      'resource',
      reason || (newStatus === 'paused' ? 'Resource paused for maintenance.' : 'Resource resumed.')
    );

    return mapped;
  },

  async duplicateResource(
    id: string,
    actor: { id: string; name: string; role: string }
  ): Promise<Resource> {
    const source = await this.getResourceById(id);
    if (!source) throw new Error('Resource not found');

    const duplicateData: Omit<Resource, 'id'> = {
      ...source,
      title: `${source.title} (Copy)`,
      status: 'live',
      isPaused: false,
    };

    return this.createResource(duplicateData, actor);
  },

  async archiveResource(
    id: string,
    actor: { id: string; name: string; role: string }
  ): Promise<void> {
    await apiClient.delete<void>(`/resources/${id}`);
    await logEvent(
      actor,
      'RESOURCE_ARCHIVED',
      id,
      'resource',
      'Owner archived resource listing.'
    );
  },

  async deleteResource(
    id: string,
    actor: { id: string; name: string; role: string }
  ): Promise<void> {
    await apiClient.delete<void>(`/resources/${id}`);
    await logEvent(
      actor,
      'RESOURCE_DELETED',
      id,
      'resource',
      'Owner deleted resource listing.'
    );
  },
};
