"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { betterAuthUser } from "@/lib/db/schema";
import { ERROR_CODES } from "@/lib/constants/errors";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { isAdmin as checkIsAdmin } from "@/lib/utils/rolePermissions";

// Type for the user data from Better Auth user table
export type UserRole = "admin" | "accountant" | "user";

/**
 * Gets the current session and user from Better Auth
 */
export async function getCurrentSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Ensures the current user has admin permissions
 * Also syncs appRole='admin' with role='admin' for migrated users
 * @throws Error if user is not authenticated or not an admin
 */
export async function requireAdmin(): Promise<{
  id: string;
  email: string;
  name: string;
}> {
  const session = await getCurrentSession();

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const user = session.user as any;
  const isAppAdmin = checkIsAdmin(user.appRole);
  const isBetterAuthAdmin = user.role === "admin";

  // If user is an app admin but better-auth role is not admin, fix it
  if (isAppAdmin && !isBetterAuthAdmin) {
    await db.execute(sql`
      UPDATE "user" 
      SET role = 'admin' 
      WHERE id = ${user.id}
    `);
  }

  // Check if user has admin role (admin or super_admin)
  if (!isAppAdmin && !isBetterAuthAdmin) {
    throw new Error("Not authorized. Admin role required.");
  }

  return {
    id: user.id,
    email: user.email || "",
    name: user.displayName || user.name || "",
  };
}

/**
 * Gets the current authenticated user (any role)
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<{
  id: string;
  email: string;
  name: string;
  role: UserRole;
}> {
  const session = await getCurrentSession();

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const user = session.user as any;

  return {
    id: user.id,
    email: user.email || "",
    name: user.displayName || user.name || "",
    role: (user.appRole || "user") as UserRole,
  };
}

/**
 * Checks if a user is active in the database
 */
export async function checkUserActive(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ isActive: betterAuthUser.isActive })
    .from(betterAuthUser)
    .where(eq(betterAuthUser.id, userId))
    .limit(1);

  return user?.isActive || false;
}

/**
 * Higher-order function that wraps an action with an active user check
 * Throws ACCOUNT_DEACTIVATED error if the user is not active
 */
export async function withActiveUserCheck<T>(
  userId: string,
  action: () => Promise<T>
): Promise<T> {
  const isActive = await checkUserActive(userId);
  if (!isActive) {
    throw new Error(ERROR_CODES.ACCOUNT_DEACTIVATED);
  }
  return action();
}
