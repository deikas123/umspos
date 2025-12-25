export type UserRole =
  | "super_admin"
  | "admin"
  | "accountant"
  | "sales_person"
  | "user";

// ============================================
// ROLE CHECK UTILITIES
// Centralized role checking functions to avoid
// scattered role === "admin" checks throughout the codebase
// ============================================

/**
 * Check if role is a super admin
 */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "super_admin";
}

/**
 * Check if role has admin privileges (admin or super_admin)
 */
export function isAdmin(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Check if role is an accountant
 */
export function isAccountant(role: string | null | undefined): boolean {
  return role === "accountant";
}

/**
 * Check if role is a sales person
 */
export function isSalesPerson(role: string | null | undefined): boolean {
  return role === "sales_person";
}

/**
 * Check if role has reports access (admin, super_admin, or accountant)
 */
export function hasReportsAccess(role: string | null | undefined): boolean {
  return isAdmin(role) || isAccountant(role);
}

/**
 * Check if role has approval access (super_admin only)
 */
export function hasApprovalAccess(role: string | null | undefined): boolean {
  return isSuperAdmin(role);
}

/**
 * Check if role can view all prospects (admin or super_admin)
 */
export function hasProspectViewAccess(
  role: string | null | undefined
): boolean {
  return isAdmin(role);
}

/**
 * Check if role can manage prospects (create/update)
 * sales_person, admin, super_admin
 */
export function canManageProspects(role: string | null | undefined): boolean {
  return isSalesPerson(role) || isAdmin(role);
}

/**
 * Check if role can delete prospects (admin or super_admin only)
 */
export function canDeleteProspects(role: string | null | undefined): boolean {
  return isAdmin(role);
}

/**
 * Check if role can access stores (admin, super_admin, or user)
 * Users with 'user' role work at stores and need full store access
 */
export function canAccessStores(role: string | null | undefined): boolean {
  return isAdmin(role) || role === "user";
}

/**
 * Check if role can perform store operations (sell, assign, return meters)
 * This is specifically for store-based operations
 */
export function canManageStoreOperations(
  role: string | null | undefined
): boolean {
  return isAdmin(role) || role === "user";
}

/**
 * Check if role can manage users (admin or super_admin)
 */
export function canManageUsers(role: string | null | undefined): boolean {
  return isAdmin(role);
}

/**
 * Get the role badge variant for UI styling
 */
export function getRoleBadgeVariant(role: string | null | undefined): string {
  if (role === "super_admin") return "bg-red-100 text-red-700 border-red-200";
  if (role === "admin")
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (role === "accountant")
    return "bg-violet-100 text-violet-700 border-violet-200";
  if (role === "sales_person")
    return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

/**
 * Get human-readable role label
 */
export function getRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "accountant":
      return "Accountant";
    case "sales_person":
      return "Sales Person";
    case "user":
      return "User";
    default:
      return "Unknown";
  }
}

// ============================================
// PERMISSION MATRIX
// ============================================

interface Permission {
  createUser: boolean;
  createAgent: boolean;
  addMeter: boolean;
  viewReports: boolean;
  manageSales: boolean;
  viewInventory: boolean;
  manageAgents: boolean;
  returnSoldMeters: boolean;
  assignMeters: boolean;
  viewUsers: boolean;
  viewAgents: boolean;
  approveUpdates: boolean;
  viewApprovals: boolean;
  createProspect: boolean;
  viewAllProspects: boolean;
  viewStores: boolean;
  manageStores: boolean;
}

export const rolePermissions: Record<UserRole, Permission> = {
  super_admin: {
    createUser: true,
    createAgent: true,
    addMeter: true,
    viewReports: true,
    manageSales: true,
    viewInventory: true,
    manageAgents: true,
    returnSoldMeters: true,
    assignMeters: true,
    viewUsers: true,
    viewAgents: true,
    approveUpdates: true,
    viewApprovals: true,
    createProspect: false,
    viewAllProspects: true,
    viewStores: true,
    manageStores: true,
  },
  admin: {
    createUser: true,
    createAgent: true,
    addMeter: true,
    viewReports: true,
    manageSales: true,
    viewInventory: true,
    manageAgents: true,
    returnSoldMeters: true,
    assignMeters: true,
    viewUsers: true,
    viewAgents: true,
    approveUpdates: false,
    viewApprovals: false,
    createProspect: false,
    viewAllProspects: true,
    viewStores: true,
    manageStores: true,
  },
  accountant: {
    createUser: false,
    createAgent: false,
    addMeter: false,
    viewReports: true,
    manageSales: true,
    viewInventory: true,
    manageAgents: true,
    returnSoldMeters: true,
    assignMeters: true,
    viewUsers: false,
    viewAgents: true,
    approveUpdates: false,
    viewApprovals: false,
    createProspect: false,
    viewAllProspects: false,
    viewStores: false,
    manageStores: false,
  },
  sales_person: {
    createUser: false,
    createAgent: false,
    addMeter: false,
    viewReports: false,
    manageSales: false,
    viewInventory: false,
    manageAgents: false,
    returnSoldMeters: false,
    assignMeters: false,
    viewUsers: false,
    viewAgents: false,
    approveUpdates: false,
    viewApprovals: false,
    createProspect: true,
    viewAllProspects: false,
    viewStores: false,
    manageStores: false,
  },
  user: {
    createUser: false,
    createAgent: false,
    addMeter: false,
    viewReports: false,
    manageSales: true,
    viewInventory: true,
    manageAgents: false,
    returnSoldMeters: false,
    assignMeters: false,
    viewUsers: false,
    viewAgents: true,
    approveUpdates: false,
    viewApprovals: false,
    createProspect: false,
    viewAllProspects: false,
    viewStores: true,
    manageStores: true,
  },
};

export const hasPermission = (
  role: UserRole | null,
  permission: keyof Permission
): boolean => {
  if (!role || !isValidRole(role)) return false;
  return rolePermissions[role]?.[permission] ?? false;
};

export const isValidRole = (role: any): role is UserRole => {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "user" ||
    role === "accountant" ||
    role === "sales_person"
  );
};
