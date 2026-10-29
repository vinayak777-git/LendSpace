import { Credential, User } from '../types';
import { getItem, setItem } from './storage';
import { logEvent } from './auditService';

const delay = (ms: number = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export const credentialService = {
  async getUserCredentials(userId: string): Promise<Credential[]> {
    await delay(300);
    const users = getItem<User[]>('USERS', []);
    const user = users.find((u) => u.id === userId);
    return user ? user.credentials : [];
  },

  async getAllPendingCredentials(): Promise<{ user: User; credential: Credential }[]> {
    await delay(300);
    const users = getItem<User[]>('USERS', []);
    const pendingList: { user: User; credential: Credential }[] = [];

    users.forEach((u) => {
      u.credentials.forEach((c) => {
        if (c.status === 'pending') {
          pendingList.push({ user: u, credential: c });
        }
      });
    });

    return pendingList;
  },

  async submitCredential(
    userId: string,
    type: string,
    name: string,
    docUrl: string = 'mock_certificate.pdf'
  ): Promise<Credential> {
    await delay(450);
    const users = getItem<User[]>('USERS', []);
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = users[userIndex];
    const newCred: Credential = {
      id: `cred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      name,
      status: 'pending',
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      docUrl,
    };

    user.credentials.push(newCred);
    users[userIndex] = user;
    setItem('USERS', users);

    await logEvent(
      { id: user.id, name: user.name, role: user.role },
      'CREDENTIAL_SUBMITTED',
      newCred.id,
      'credential',
      `Submitted prerequisite qualification document: ${name}`,
      { credentialType: type, docUrl }
    );

    return newCred;
  },

  async reviewCredential(
    userId: string,
    credentialId: string,
    status: 'verified' | 'expired',
    reviewer: { id: string; name: string; role: string },
    rejectedReason?: string
  ): Promise<Credential> {
    await delay(450);
    const users = getItem<User[]>('USERS', []);
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = users[userIndex];
    const credIndex = user.credentials.findIndex((c) => c.id === credentialId);
    if (credIndex === -1) throw new Error('Credential not found');

    user.credentials[credIndex].status = status;
    if (status === 'verified') {
      user.credentials[credIndex].verifiedAt = new Date().toISOString();
      user.credentials[credIndex].rejectedReason = undefined;
    } else {
      user.credentials[credIndex].rejectedReason = rejectedReason || 'Documentation did not meet lab standards';
    }

    users[userIndex] = user;
    setItem('USERS', users);

    await logEvent(
      reviewer,
      status === 'verified' ? 'CREDENTIAL_VERIFIED' : 'CREDENTIAL_REJECTED',
      credentialId,
      'credential',
      status === 'verified'
        ? `Approved badge for ${user.name}`
        : `Rejected badge: ${rejectedReason}`,
      { studentId: userId, studentName: user.name }
    );

    return user.credentials[credIndex];
  },
};
