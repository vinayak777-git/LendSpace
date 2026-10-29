import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { AppRole } from '../../types';
import { AccessDeniedPage } from '../../pages/shared/AccessDeniedPage';

interface RoleRouteProps {
  allowedRoles: AppRole[];
  requiredPortalName: 'Booker' | 'Owner';
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  requiredPortalName,
  children,
}) => {
  const { currentUser, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/get-started?mode=signin" replace />;
  }

  // Check if current user has an allowed role
  const isAllowed = allowedRoles.includes(currentUser.role);

  if (!isAllowed) {
    return (
      <AccessDeniedPage
        requiredPortal={requiredPortalName}
        targetRole={allowedRoles[0]}
      />
    );
  }

  return <>{children}</>;
};
