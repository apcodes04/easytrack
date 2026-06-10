import { useOrg } from './useOrg';

export const usePermissions = () => {
  const { userRole, userPermissions } = useOrg();

  const isManager = userRole === 'manager';
  const isAsstManager = userRole === 'asst_manager';
  const isEmployee = userRole === 'employee';
  const isManagerOrAbove = isManager || isAsstManager;

  const hasPermission = (permission) => {
    if (isManager) return true;
    if (isAsstManager) {
      // Asst managers have all permissions except those explicitly revoked
      return userPermissions?.includes(permission) !== false;
    }
    // Employees have only explicitly granted view permissions
    return userPermissions?.includes(permission) || false;
  };

  const canViewFeature = (feature) => {
    if (isManager) return true;
    if (isAsstManager) return !userPermissions?.includes(`hide_${feature}`);
    return userPermissions?.includes(`view_${feature}`) || false;
  };

  const canEditFeature = (feature) => {
    if (isManager) return true;
    if (isAsstManager) return !userPermissions?.includes(`no_edit_${feature}`);
    return false; // Employees can only suggest, not directly edit
  };

  const canApprove = isManagerOrAbove;
  const canManageMembers = isManager;
  const canPromote = isManager;
  const canDemote = (targetRole) => {
    if (isManager) return true;
    if (isAsstManager && targetRole === 'asst_manager') return true;
    return false;
  };

  return {
    isManager,
    isAsstManager,
    isEmployee,
    isManagerOrAbove,
    hasPermission,
    canViewFeature,
    canEditFeature,
    canApprove,
    canManageMembers,
    canPromote,
    canDemote,
    userRole,
  };
};
