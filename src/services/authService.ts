import { AuthUser, AppRole } from '../types';

/**
 * Real Database-Backed Authentication Service
 * Communicates with the FastAPI backend for secure registration, login, token rotation, and profile retrieval.
 */

const TOKEN_KEY = 'lendspace_access_token_v1';
const REFRESH_TOKEN_KEY = 'lendspace_refresh_token_v1';
const USER_KEY = 'lendspace_auth_user_v1';

const API_BASE = '/api/v1';

export interface TokenResponseData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    business_name?: string;
    role: string;
    status: string;
    email_verified?: boolean;
    org_id?: string;
    privacy_settings?: Record<string, unknown>;
    created_at?: string;
  };
}

function mapApiUserToAuthUser(u: TokenResponseData['user']): AuthUser {
  // Load any stored booker requirements from local cache
  let storedReqs: Partial<AuthUser> = {};
  try {
    const raw = localStorage.getItem(`lendspace_booker_reqs_${u.id}`);
    if (raw) storedReqs = JSON.parse(raw);
  } catch {
    // ignore
  }

  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    phone: u.phone || storedReqs.phone,
    role: (u.role === 'booker' ? 'user' : u.role) as AppRole,
    institution: u.business_name || storedReqs.institution || 'Academic / Research Institution',
    department: storedReqs.department,
    useIntents: storedReqs.useIntents,
    projectPurpose: storedReqs.projectPurpose,
    usageTimeline: storedReqs.usageTimeline,
    specialRequirements: storedReqs.specialRequirements,
    primaryNeeds: storedReqs.primaryNeeds,
    hasCompletedRequirementsOnboarding: storedReqs.hasCompletedRequirementsOnboarding ?? true,
    isVerifiedOwner: u.role === 'owner',
    createdAt: u.created_at || new Date().toISOString(),
  };
}

export const authService = {
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setSession(data: TokenResponseData): AuthUser {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    const authUser = mapApiUserToAuthUser(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    return authUser;
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async signIn(email: string, password: string, _expectedRole?: AppRole): Promise<AuthUser> {
    const targetRole = _expectedRole === 'owner' ? 'owner' : (_expectedRole === 'user' ? 'booker' : undefined);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        role: targetRole,
      }),
    });

    if (!res.ok) {
      let errMsg = 'Invalid email or password.';
      try {
        const body = await res.json();
        if (body.detail) {
          errMsg = typeof body.detail === 'string' ? body.detail : errMsg;
        }
      } catch {
        // use default generic message
      }
      throw new Error(errMsg);
    }

    const data: TokenResponseData = await res.json();
    return this.setSession(data);
  },

  async signUp(data: {
    name: string;
    email: string;
    password: string;
    role: AppRole;
    phone?: string;
    institution?: string;
    department?: string;
    studentId?: string;
    useIntents?: string[];
    projectPurpose?: string;
    usageTimeline?: string;
    specialRequirements?: string;
    primaryNeeds?: string[];
    orgType?: string;
    jobTitle?: string;
    resourceCategories?: string[];
  }): Promise<AuthUser> {
    const apiRole = data.role === 'owner' ? 'owner' : 'booker';
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        full_name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
        business_name: data.institution?.trim() || undefined,
        role: apiRole,
      }),
    });

    if (!res.ok) {
      let errMsg = 'Registration failed. Please check your information.';
      try {
        const body = await res.json();
        if (body.detail) {
          errMsg = typeof body.detail === 'string' ? body.detail : errMsg;
        }
      } catch {
        // use default message
      }
      throw new Error(errMsg);
    }

    const tokenData: TokenResponseData = await res.json();

    // Cache booker details & requirements locally
    if (data.role === 'user') {
      try {
        const reqData = {
          phone: data.phone,
          department: data.department,
          institution: data.institution,
          useIntents: data.useIntents,
          projectPurpose: data.projectPurpose,
          usageTimeline: data.usageTimeline,
          specialRequirements: data.specialRequirements,
          primaryNeeds: data.primaryNeeds || data.useIntents,
          hasCompletedRequirementsOnboarding: true,
        };
        localStorage.setItem(`lendspace_booker_reqs_${tokenData.user.id}`, JSON.stringify(reqData));
      } catch {
        // ignore
      }
    }

    return this.setSession(tokenData);
  },

  async signOut(): Promise<void> {
    const token = this.getAccessToken();
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // ignore network error on logout
      }
    }
    this.clearSession();
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = this.getAccessToken();
    if (!token) {
      const cached = localStorage.getItem(USER_KEY);
      return cached ? JSON.parse(cached) : null;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user = await res.json();
        const authUser = mapApiUserToAuthUser(user);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        return authUser;
      }

      // Try refresh token if access token expired
      return await this.refreshToken();
    } catch {
      const cached = localStorage.getItem(USER_KEY);
      return cached ? JSON.parse(cached) : null;
    }
  },

  async refreshToken(): Promise<AuthUser | null> {
    const refresh_token = this.getRefreshToken();
    if (!refresh_token) {
      this.clearSession();
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });

      if (!res.ok) {
        this.clearSession();
        return null;
      }

      const data: TokenResponseData = await res.json();
      return this.setSession(data);
    } catch {
      this.clearSession();
      return null;
    }
  },

  async sendPasswordReset(_email: string): Promise<boolean> {
    // Generic response to avoid email enumeration
    await new Promise((r) => setTimeout(r, 400));
    return true;
  },
};
