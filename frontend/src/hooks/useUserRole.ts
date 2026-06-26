import { useAuthStore } from '../stores/authStore';

const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
};

export function useUserRole() {
  const { user } = useAuthStore();

  const role = user?.role || 'VIEWER';
  const userLevel = ROLE_HIERARCHY[role] ?? -1;

  return {
    role,
    isAdmin: userLevel >= 2,
    isMember: userLevel >= 1,
    isViewer: userLevel >= 0,
    canEdit: userLevel >= 1,
    canDelete: userLevel >= 2,
    hasRole: (minRole: string) => (ROLE_HIERARCHY[minRole] ?? 0) <= userLevel,
  };
}
