import { useAuth } from "@/contexts/AuthContext";
import { USER_STATUS } from "@/rbac/permissions";

export function useRole() {
  const { role, status } = useAuth();

  return {
    role,
    status,
    isActive: status === USER_STATUS.ACTIVE,
  };
}
