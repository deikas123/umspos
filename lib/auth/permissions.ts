import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Custom permission statements for the application
 * Extends Better Auth's default statements with app-specific resources
 */
const statements = {
  ...defaultStatements,
  // App-specific resources and actions
  users: ["create", "read", "update", "delete"],
  meters: ["create", "read", "update", "delete", "sell", "return"],
  agents: ["create", "read", "update", "delete", "assign"],
  sales: ["create", "read", "update", "delete"],
  reports: ["read", "export"],
  notifications: ["read", "create"],
} as const;

export const ac = createAccessControl(statements);

/**
 * Admin role - full access to everything
 */
export const admin = ac.newRole({
  ...adminAc.statements,
  users: ["create", "read", "update", "delete"],
  meters: ["create", "read", "update", "delete", "sell", "return"],
  agents: ["create", "read", "update", "delete", "assign"],
  sales: ["create", "read", "update", "delete"],
  reports: ["read", "export"],
  notifications: ["read", "create"],
});

/**
 * Accountant role - read-heavy access with some create/update
 */
export const accountant = ac.newRole({
  users: ["read"],
  meters: ["read", "sell"],
  agents: ["read"],
  sales: ["create", "read"],
  reports: ["read", "export"],
  notifications: ["read", "create"],
});

/**
 * Regular user role - basic operations
 */
export const user = ac.newRole({
  users: ["read"],
  meters: ["read", "sell"],
  agents: ["read"],
  sales: ["create", "read"],
  reports: ["read"],
  notifications: ["read", "create"],
});
