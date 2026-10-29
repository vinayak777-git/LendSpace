import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';
import { Toast } from './components/common/Toast';
import { RoleRoute } from './components/auth/RoleRoute';

// Layouts
import { BookerLayout } from './components/layout/BookerLayout';
import { OwnerLayout } from './components/layout/OwnerLayout';

// Public & Auth Pages (DO NOT rebuild or restyle)
import { LandingPage } from './pages/LandingPage';
import { GetStartedPage } from './pages/GetStartedPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';

// Portal 1: Booker Pages
import { BookerDashboardPage } from './pages/booker/BookerDashboardPage';
import { BookerDiscoverPage } from './pages/booker/BookerDiscoverPage';
import { BookerResourceDetailPage } from './pages/booker/BookerResourceDetailPage';
import { BookerBookingsPage } from './pages/booker/BookerBookingsPage';
import { BookerWaitlistPage } from './pages/booker/BookerWaitlistPage';
import { BookerCheckInReturnPage } from './pages/booker/BookerCheckInReturnPage';
import { BookerCredentialsPage } from './pages/booker/BookerCredentialsPage';
import { BookerRequirementsPage } from './pages/booker/BookerRequirementsPage';
import { BookerIncidentsPage } from './pages/booker/BookerIncidentsPage';
import { BookerProfilePage } from './pages/booker/BookerProfilePage';

// Portal 2: Owner Pages
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { OwnerListingsPage } from './pages/owner/OwnerListingsPage';
import { OwnerAddEquipmentPage } from './pages/owner/OwnerAddEquipmentPage';
import { OwnerAddSpacePage } from './pages/owner/OwnerAddSpacePage';
import { OwnerEditResourcePage } from './pages/owner/OwnerEditResourcePage';
import { OwnerRequestsPage } from './pages/owner/OwnerRequestsPage';
import { OwnerCalendarPage } from './pages/owner/OwnerCalendarPage';
import { OwnerActiveUsagePage } from './pages/owner/OwnerActiveUsagePage';
import { OwnerIncidentsPage } from './pages/owner/OwnerIncidentsPage';
import { OwnerCredentialsReviewPage } from './pages/owner/OwnerCredentialsReviewPage';
import { OwnerTeamPage } from './pages/owner/OwnerTeamPage';
import { OwnerFairUsePage } from './pages/owner/OwnerFairUsePage';
import { OwnerAnalyticsPage } from './pages/owner/OwnerAnalyticsPage';
import { OwnerAuditPage } from './pages/owner/OwnerAuditPage';
import { OwnerSettingsPage } from './pages/owner/OwnerSettingsPage';

// Notifications & Shared
import { NotificationsPage } from './pages/NotificationsPage';
import { AccessDeniedPage } from './pages/shared/AccessDeniedPage';

const AppLayout: React.FC = () => {
  const { isLoading: isAppLoading } = useAppStore();
  const { isLoading: isAuthLoading } = useAuthStore();

  const isLoading = isAppLoading && isAuthLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Initializing LendSpace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-teal-500 selection:text-white transition-colors duration-300">
      <main className="flex-1">
        <Routes>
          {/* Public Landing & Onboarding */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/sign-up" element={<SignUpPage />} />

          {/* Legacy route redirects */}
          <Route path="/login" element={<Navigate to="/get-started?mode=signin" replace />} />
          <Route path="/discover" element={<Navigate to="/app/discover" replace />} />
          <Route path="/bookings" element={<Navigate to="/app/bookings" replace />} />
          <Route path="/resource/:id" element={<Navigate to="/app/discover" replace />} />
          <Route path="/owner/dashboard" element={<Navigate to="/owner" replace />} />

          {/* PORTAL 1: BOOKER PORTAL (Teal Accent, Protected by RoleRoute: role = 'user') */}
          <Route
            path="/app"
            element={
              <RoleRoute allowedRoles={['user']} requiredPortalName="Booker">
                <BookerLayout />
              </RoleRoute>
            }
          >
            <Route index element={<BookerDashboardPage />} />
            <Route path="discover" element={<BookerDiscoverPage />} />
            <Route path="resource/:id" element={<BookerResourceDetailPage />} />
            <Route path="bookings" element={<BookerBookingsPage />} />
            <Route path="waitlist" element={<BookerWaitlistPage />} />
            <Route path="checkin-return" element={<BookerCheckInReturnPage />} />
            <Route path="requirements" element={<BookerRequirementsPage />} />
            <Route path="credentials" element={<BookerRequirementsPage />} />
            <Route path="incidents" element={<BookerIncidentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<BookerProfilePage />} />
          </Route>

          {/* PORTAL 2: OWNER PORTAL (Indigo Accent, Protected by RoleRoute: role = 'owner' | 'manager') */}
          <Route
            path="/owner"
            element={
              <RoleRoute allowedRoles={['owner', 'manager']} requiredPortalName="Owner">
                <OwnerLayout />
              </RoleRoute>
            }
          >
            <Route index element={<OwnerDashboardPage />} />
            <Route path="listings" element={<OwnerListingsPage />} />
            <Route path="edit/:id" element={<OwnerEditResourcePage />} />
            <Route path="add-equipment" element={<OwnerAddEquipmentPage />} />
            <Route path="add-space" element={<OwnerAddSpacePage />} />
            <Route path="requests" element={<OwnerRequestsPage />} />
            <Route path="calendar" element={<OwnerCalendarPage />} />
            <Route path="usage" element={<OwnerActiveUsagePage />} />
            <Route path="incidents" element={<OwnerIncidentsPage />} />
            <Route path="credentials-review" element={<OwnerCredentialsReviewPage />} />
            <Route path="team" element={<OwnerTeamPage />} />
            <Route path="fair-use" element={<OwnerFairUsePage />} />
            <Route path="analytics" element={<OwnerAnalyticsPage />} />
            <Route path="audit" element={<OwnerAuditPage />} />
            <Route path="settings" element={<OwnerSettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Friendly Role Restriction Page */}
          <Route
            path="/access-denied"
            element={<AccessDeniedPage requiredPortal="Booker" targetRole="user" />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Toast />
    </div>
  );
};

export function App() {
  const { init } = useAppStore();
  const { initAuth } = useAuthStore();

  useEffect(() => {
    init();
    initAuth();
  }, [init, initAuth]);

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
