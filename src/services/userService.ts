import { User } from '../types';
import { getItem, setItem, initStorage, KEYS } from './storage';
import { logEvent } from './auditService';
import { notificationService } from './notificationService';

initStorage();

export const userService = {
  async getUsers(): Promise<User[]> {
    const users = getItem<User[]>('USERS', []);
    try {
      const authUserStr = localStorage.getItem('lendspace_auth_user_v1');
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        if (authUser && authUser.id && !users.some((u) => u.id === authUser.id)) {
          users.unshift({
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            phone: authUser.phone,
            role: authUser.role === 'owner' ? 'manager' : 'student',
            org: authUser.department || authUser.institution || 'Academic Department',
            department: authUser.department,
            verified: true,
            credentials: [],
            usageStats: {
              hoursThisWeek: 0,
              activeBookingsCount: 0,
              lateReturnsCount: 0,
              completedBookingsCount: 0,
            },
          });
        }
      }
    } catch {
      // ignore
    }
    return users;
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const authUserStr = localStorage.getItem('lendspace_auth_user_v1');
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        if (authUser && authUser.id === id) {
          return {
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            phone: authUser.phone,
            role: authUser.role === 'owner' ? 'manager' : 'student',
            org: authUser.department || authUser.institution || 'Academic Department',
            department: authUser.department,
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
      }
    } catch {
      // ignore
    }

    const users = getItem<User[]>('USERS', []);
    return users.find((u) => u.id === id) || null;
  },

  async getCurrentUser(): Promise<User> {
    try {
      const authUserStr = localStorage.getItem('lendspace_auth_user_v1');
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        if (authUser && authUser.id) {
          return {
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            phone: authUser.phone,
            role: authUser.role === 'owner' ? 'manager' : 'student',
            org: authUser.department || authUser.institution || 'Academic Department',
            department: authUser.department,
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
      }
    } catch {
      // ignore
    }

    const currentId = localStorage.getItem(KEYS.CURRENT_USER_ID);
    const users = getItem<User[]>('USERS', []);
    if (currentId) {
      const found = users.find((u) => u.id === currentId);
      if (found) return found;
    }
    return users[0] || ({} as User);
  },

  async setCurrentUser(userId: string): Promise<User> {
    const users = getItem<User[]>('USERS', []);
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    localStorage.setItem(KEYS.CURRENT_USER_ID, userId);
    return user;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const users = getItem<User[]>('USERS', []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');

    const updated = { ...users[idx], ...updates };
    users[idx] = updated;
    setItem('USERS', users);
    return updated;
  },

  async verifyCredential(
    userId: string,
    credentialId: string,
    actor: { id: string; name: string; role: string },
    reason: string
  ): Promise<User> {
    const users = getItem<User[]>('USERS', []);
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const cred = user.credentials.find((c) => c.id === credentialId);
    if (!cred) throw new Error('Credential not found');

    cred.status = 'verified';
    cred.verifiedAt = new Date().toISOString();
    delete cred.rejectedReason;

    // Check if user should now be marked verified overall
    user.verified = user.credentials.some((c) => c.status === 'verified');

    setItem('USERS', users);

    await logEvent(
      actor,
      'CREDENTIAL_VERIFIED',
      credentialId,
      'credential',
      reason || 'Manager verified certificate documentation.',
      { targetUserId: userId, credentialName: cred.name }
    );

    await notificationService.addNotification({
      userId,
      type: 'approved',
      title: 'Credential Approved!',
      message: `Your credential "${cred.name}" has been verified by ${actor.name}. You are now eligible to reserve associated equipment.`,
      link: '/profile',
    });

    return user;
  },

  async rejectCredential(
    userId: string,
    credentialId: string,
    actor: { id: string; name: string; role: string },
    reason: string
  ): Promise<User> {
    const users = getItem<User[]>('USERS', []);
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const cred = user.credentials.find((c) => c.id === credentialId);
    if (!cred) throw new Error('Credential not found');

    cred.status = 'expired';
    cred.rejectedReason = reason;

    setItem('USERS', users);

    await logEvent(
      actor,
      'CREDENTIAL_REJECTED',
      credentialId,
      'credential',
      reason,
      { targetUserId: userId, credentialName: cred.name }
    );

    await notificationService.addNotification({
      userId,
      type: 'rejected',
      title: 'Credential Review Update',
      message: `Your credential "${cred.name}" was not approved: ${reason}`,
      link: '/profile',
    });

    return user;
  },

  async uploadCredential(
    userId: string,
    credData: { type: string; name: string; docUrl?: string }
  ): Promise<User> {
    const users = getItem<User[]>('USERS', []);
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const newCred = {
      id: `cred-${Date.now()}`,
      type: credData.type,
      name: credData.name,
      status: 'pending' as const,
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      docUrl: credData.docUrl || 'uploaded_certificate.pdf',
    };

    user.credentials.push(newCred);
    setItem('USERS', users);

    await logEvent(
      { id: user.id, name: user.name, role: user.role },
      'CREDENTIAL_SUBMITTED',
      newCred.id,
      'credential',
      `User submitted document for ${newCred.name}.`
    );

    return user;
  },

  async updatePrivacySettings(
    userId: string,
    privacySettings: User['privacySettings']
  ): Promise<User> {
    return this.updateUser(userId, { privacySettings });
  },
};
