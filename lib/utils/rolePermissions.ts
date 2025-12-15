export type UserRole =
  | "super_admin"
  | "admin"
  | "accountant"
  | "sales_person"
  | "user";

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
