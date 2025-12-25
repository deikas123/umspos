import { useMemo } from "react";
import { navigationItems, actionItems } from "@/lib/config/navigation";
import {
  isSuperAdmin as checkIsSuperAdmin,
  isAdmin as checkIsAdmin,
  isAccountant as checkIsAccountant,
  isSalesPerson as checkIsSalesPerson,
  hasReportsAccess as checkHasReportsAccess,
  hasApprovalAccess as checkHasApprovalAccess,
  canAccessStores as checkCanAccessStores,
} from "@/lib/utils/rolePermissions";

interface RoleChecks {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAccountant: boolean;
  isSalesPerson: boolean;
  hasReportsAccess: boolean;
  hasApprovalAccess: boolean;
  hasProspectViewAccess: boolean;
  canAccessStores: boolean;
}

export function useRoleBasedFiltering(safeUserRole: string | null) {
  // Memoize role checks using centralized utilities
  const roleChecks = useMemo<RoleChecks>(() => {
    const isSuperAdmin = checkIsSuperAdmin(safeUserRole);
    const isAdmin = checkIsAdmin(safeUserRole);
    const isAccountant = checkIsAccountant(safeUserRole);
    const isSalesPerson = checkIsSalesPerson(safeUserRole);
    const hasReportsAccess = checkHasReportsAccess(safeUserRole);
    // Only super_admin can access approvals
    const hasApprovalAccess = checkHasApprovalAccess(safeUserRole);
    // Admin, super_admin, and sales_person can view prospects (filtered for sales_person)
    const hasProspectViewAccess = isAdmin || isSalesPerson;
    // Admin, super_admin, and user can access stores
    const canAccessStores = checkCanAccessStores(safeUserRole);

    return {
      isSuperAdmin,
      isAdmin,
      isAccountant,
      isSalesPerson,
      hasReportsAccess,
      hasApprovalAccess,
      hasProspectViewAccess,
      canAccessStores,
    };
  }, [safeUserRole]);

  // Memoize navigation filtering
  const filteredNavItems = useMemo(
    () =>
      navigationItems.filter((item) => {
        if (!safeUserRole) return false;

        // User role can only see Dashboard, Sales, and Stores
        if (safeUserRole === "user") {
          return (
            item.title === "Dashboard" ||
            item.title === "Sales" ||
            item.requiresStoreAccess === true
          );
        }

        // Sales person can see their Client Form page AND Prospects List
        if (roleChecks.isSalesPerson) {
          return (
            item.salesPersonOnly === true ||
            item.requiresProspectViewAccess === true
          );
        }

        // Sales person only pages are not visible to other roles
        if (item.salesPersonOnly) return false;

        if (item.requiresStoreAccess) return roleChecks.canAccessStores;
        if (item.requiresProspectViewAccess)
          return roleChecks.hasProspectViewAccess;
        if (item.requiresApprovalAccess) return roleChecks.hasApprovalAccess;
        if (item.requiresReportAccess) return roleChecks.hasReportsAccess;
        if (item.adminOnly) return roleChecks.isAdmin;
        if (item.title === "Users") return roleChecks.isAdmin;

        return true;
      }),
    [safeUserRole, roleChecks]
  );

  // Memoize action filtering
  const filteredActionItems = useMemo(
    () =>
      actionItems.filter((item) => {
        if (!safeUserRole) return false;

        // Sales person cannot access any action items
        if (roleChecks.isSalesPerson) return false;

        if (item.adminOnly) return roleChecks.isAdmin;
        if (item.requiresAuth)
          return roleChecks.isAdmin || roleChecks.isAccountant;

        // Specific item checks
        if (item.title === "Sell Meters") return true;
        if (item.title === "Return Sold Meters")
          return roleChecks.hasReportsAccess;
        if (item.title === "Assign Meters to Agent")
          return roleChecks.hasReportsAccess;
        if (item.title === "Create User") return roleChecks.isAdmin;
        if (item.title === "Create Agent") return roleChecks.isAdmin;
        if (item.title === "Add Meters") return roleChecks.isAdmin;

        return true;
      }),
    [safeUserRole, roleChecks]
  );

  return {
    roleChecks,
    filteredNavItems,
    filteredActionItems,
  };
}
