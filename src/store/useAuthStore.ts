import { create } from 'zustand';
import { AuthUser, AppRole } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  currentUser: AuthUser | null;
  selectedRole: AppRole | null;
  intendedRoute: string | null;
  isPendingVerification: boolean;
  isLoading: boolean;
  darkMode: boolean;

  // Actions
  initAuth: () => Promise<void>;
  setRole: (role: AppRole | null) => void;
  setIntendedRoute: (route: string | null) => void;
  signIn: (email: string, password: string, expectedRole?: AppRole) => Promise<AuthUser>;
  signUp: (data: {
    name: string;
    email: string;
    password: string;
    role: AppRole;
    phone?: string;
    institution: string;
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
  }) => Promise<AuthUser>;
  updateBookerRequirements: (reqs: {
    phone?: string;
    department?: string;
    institution?: string;
    primaryNeeds?: string[];
    projectPurpose?: string;
    usageTimeline?: string;
    specialRequirements?: string;
  }) => void;
  signOut: () => Promise<void>;
  toggleDarkMode: () => void;
  setPendingVerification: (val: boolean) => void;
}

const STORAGE_ROLE_KEY = 'lendspace_selected_role_v1';
const STORAGE_DARK_MODE_KEY = 'lendspace_dark_mode_v1';

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  selectedRole: (localStorage.getItem(STORAGE_ROLE_KEY) as AppRole) || null,
  intendedRoute: null,
  isPendingVerification: false,
  isLoading: true,
  darkMode: localStorage.getItem(STORAGE_DARK_MODE_KEY) === 'true',

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      const role = (localStorage.getItem(STORAGE_ROLE_KEY) as AppRole) || (user?.role || null);
      const isDark = localStorage.getItem(STORAGE_DARK_MODE_KEY) === 'true';

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      set({
        currentUser: user,
        selectedRole: role,
        isPendingVerification: user?.role === 'owner' && user.isVerifiedOwner === false,
        darkMode: isDark,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setRole: (role: AppRole | null) => {
    if (role) {
      localStorage.setItem(STORAGE_ROLE_KEY, role);
    } else {
      localStorage.removeItem(STORAGE_ROLE_KEY);
    }
    set({ selectedRole: role });
  },

  setIntendedRoute: (route: string | null) => {
    set({ intendedRoute: route });
  },

  signIn: async (email: string, password: string, expectedRole?: AppRole) => {
    set({ isLoading: true });
    try {
      const user = await authService.signIn(email, password, expectedRole);
      localStorage.setItem(STORAGE_ROLE_KEY, user.role);
      set({
        currentUser: user,
        selectedRole: user.role,
        isPendingVerification: user.role === 'owner' && user.isVerifiedOwner === false,
        isLoading: false,
      });
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signUp: async (data) => {
    set({ isLoading: true });
    try {
      const user = await authService.signUp(data);
      localStorage.setItem(STORAGE_ROLE_KEY, user.role);
      set({
        currentUser: user,
        selectedRole: user.role,
        isPendingVerification: user.role === 'owner' && user.isVerifiedOwner === false,
        isLoading: false,
      });
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({
      currentUser: null,
      intendedRoute: null,
      isPendingVerification: false,
    });
  },

  updateBookerRequirements: (reqs) => {
    const user = get().currentUser;
    if (!user) return;
    const updatedUser: AuthUser = {
      ...user,
      ...reqs,
      hasCompletedRequirementsOnboarding: true,
    };
    try {
      localStorage.setItem(`lendspace_booker_reqs_${user.id}`, JSON.stringify(updatedUser));
      localStorage.setItem('lendspace_auth_user_v1', JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
    set({ currentUser: updatedUser });
  },

  toggleDarkMode: () => {
    const nextDark = !get().darkMode;
    localStorage.setItem(STORAGE_DARK_MODE_KEY, String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ darkMode: nextDark });
  },

  setPendingVerification: (val: boolean) => {
    set({ isPendingVerification: val });
  },
}));
