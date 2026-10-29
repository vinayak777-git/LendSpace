import {
  INITIAL_USERS,
  INITIAL_RESOURCES,
  INITIAL_BOOKINGS,
  INITIAL_INCIDENTS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_NOTIFICATIONS,
} from '../data/seedData';
import {
  User,
  Resource,
  Booking,
  Incident,
  AuditEvent,
  Notification,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'lendspace_users_v1',
  RESOURCES: 'lendspace_resources_v1',
  BOOKINGS: 'lendspace_bookings_v1',
  INCIDENTS: 'lendspace_incidents_v1',
  AUDIT: 'lendspace_audit_v1',
  NOTIFICATIONS: 'lendspace_notifications_v1',
  CURRENT_USER_ID: 'lendspace_current_user_id_v1',
};

// Initialize localStorage with seed data if not already present
export function initStorage(): void {
  // Purge demo seed bookings from localStorage so they never pollute owner reservation requests
  try {
    const rawBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (rawBookings) {
      const parsedBookings = JSON.parse(rawBookings) as Booking[];
      const cleaned = parsedBookings.filter(
        (b) =>
          !b.id.startsWith('book-10') &&
          b.userId !== 'user-aarav' &&
          b.userId !== 'user-maya' &&
          b.userId !== 'user-meera' &&
          b.userName !== 'Aarav Patel' &&
          b.userName !== 'Maya Sen'
      );
      if (cleaned.length !== parsedBookings.length) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(cleaned));
      }
    }
  } catch {
    // continue
  }

  // Migrate if old sharespace keys exist
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const oldUsers = localStorage.getItem('sharespace_users_v1');
    if (oldUsers) {
      localStorage.setItem(STORAGE_KEYS.USERS, oldUsers);
      localStorage.setItem(STORAGE_KEYS.RESOURCES, localStorage.getItem('sharespace_resources_v1') || '');
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, localStorage.getItem('sharespace_bookings_v1') || '');
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, localStorage.getItem('sharespace_incidents_v1') || '');
      localStorage.setItem(STORAGE_KEYS.AUDIT, localStorage.getItem('sharespace_audit_v1') || '');
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, localStorage.getItem('sharespace_notifications_v1') || '');
      const oldCur = localStorage.getItem('sharespace_current_user_id_v1');
      if (oldCur) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, oldCur);
      }
      return;
    }
    resetToSeedData();
    return;
  }

  // Ensure existing stored resources are enriched with pricing & area fields
  try {
    const existingResStr = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    if (existingResStr) {
      const existingRes = JSON.parse(existingResStr) as Resource[];
      let hasUpdates = false;
      const enriched = existingRes.map((r) => {
        const seed = INITIAL_RESOURCES.find((s) => s.id === r.id);
        if (r.hourlyRate === undefined) {
          hasUpdates = true;
          return {
            ...r,
            hourlyRate: seed?.hourlyRate ?? (r.type === 'space' ? 450 : 120),
            dailyRate: seed?.dailyRate ?? (r.type === 'space' ? 3200 : 800),
            pricingModel: seed?.pricingModel ?? 'hourly',
            currency: seed?.currency ?? '₹',
            isFree: seed?.isFree ?? false,
            areaSqFt: seed?.areaSqFt ?? (r.type === 'space' ? 850 : undefined),
            amenities: seed?.amenities ?? (r.type === 'space' ? ['High-Speed Wi-Fi', 'Presentation Display', 'Power Drops'] : undefined),
            roomLayout: seed?.roomLayout ?? (r.type === 'space' ? 'Modular Workshop' : undefined),
          };
        }
        return r;
      });
      if (hasUpdates) {
        localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(enriched));
      }
    }
  } catch {
    // continue
  }
}

export function resetToSeedData(): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(INITIAL_RESOURCES));
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([])); // Clean bookings: zero demo requests
  localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(INITIAL_INCIDENTS));
  localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_EVENTS));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
}

export function getItem<T>(key: keyof typeof STORAGE_KEYS, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading key ${key} from localStorage:`, e);
    return fallback;
  }
}

export function setItem<T>(key: keyof typeof STORAGE_KEYS, val: T): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving key ${key} to localStorage:`, e);
  }
}

export const KEYS = STORAGE_KEYS;
