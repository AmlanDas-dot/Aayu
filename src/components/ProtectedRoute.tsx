import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useRole } from "@/hooks/useRole";
import { Permission, UserRole, USER_STATUS } from "@/rbac/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: Permission;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  const { role, status } = useRole();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status !== USER_STATUS.ACTIVE) {
    return <Navigate to="/" replace />;
  }

  const roleAllowed = !requiredRole || (
    role !== null &&
    (Array.isArray(requiredRole)
      ? requiredRole.includes(role)
      : role === requiredRole)
  );
  const permissionAllowed = !requiredPermission || hasPermission(requiredPermission);

  if (!roleAllowed || !permissionAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};
