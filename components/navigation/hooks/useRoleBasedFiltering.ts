import { useMemo } from "react";
import { navigationItems, actionItems } from "@/lib/config/navigation";

interface RoleChecks {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAccountant: boolean;
  isSalesPerson: boolean;
  hasReportsAccess: boolean;
  hasApprovalAccess: boolean;
  hasProspectViewAccess: boolean;
}

export function useRoleBasedFiltering(safeUserRole: string | null) {
  // Memoize role checks
  const roleChecks = useMemo<RoleChecks>(() => {
    const isSuperAdmin = safeUserRole === "super_admin";
    const isAdmin = safeUserRole === "admin" || isSuperAdmin;
    const isAccountant = safeUserRole === "accountant";
    const isSalesPerson = safeUserRole === "sales_person";
    const hasReportsAccess = isAdmin || isAccountant;
    // Only super_admin can access approvals
    const hasApprovalAccess = isSuperAdmin;
    // Admin, super_admin, and sales_person can view prospects (filtered for sales_person)
    const hasProspectViewAccess = isAdmin || isSalesPerson;

    return {
      isSuperAdmin,
      isAdmin,
      isAccountant,
      isSalesPerson,
      hasReportsAccess,
      hasApprovalAccess,
      hasProspectViewAccess,
    };
  }, [safeUserRole]);

  // Memoize navigation filtering
  const filteredNavItems = useMemo(
    () =>
      navigationItems.filter((item) => {
        if (!safeUserRole) return false;

        // Sales person can see their Client Form page AND Prospects List
        if (roleChecks.isSalesPerson) {
          return (
            item.salesPersonOnly === true ||
            item.requiresProspectViewAccess === true
          );
        }

        // Sales person only pages are not visible to other roles
        if (item.salesPersonOnly) return false;

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
