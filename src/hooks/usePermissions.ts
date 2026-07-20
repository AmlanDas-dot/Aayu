import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission as checkPermission, Permission } from "@/rbac/permissions";

export function usePermissions() {
  const { permissions } = useAuth();

  return useMemo(
    () => ({
      permissions,
      hasPermission: (permission: Permission) => checkPermission(permissions, permission),
    }),
    [permissions]
  );
}
