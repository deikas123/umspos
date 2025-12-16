"use server";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { requireAdmin, getCurrentSession, type UserRole } from "./utils";
import { isAdmin, isSuperAdmin } from "@/lib/utils/rolePermissions";

// Note: User management now uses Better Auth's user table directly
// Custom fields (appRole, isActive, displayName) are stored in the user table

export async function getUserProfile(userId: string) {
  try {
    // Query Better Auth user table directly
    const result = await db.execute(sql`
      SELECT 
        id, 
        email, 
        name,
        "displayName",
        "appRole",
        "isActive"
      FROM "user" 
      WHERE id = ${userId}
      LIMIT 1
    `);

    const rows = result as unknown as any[];
    if (!rows || rows.length === 0) {
      return null;
    }

    const user = rows[0];
    return {
      name: user.displayName || user.name,
      role: (user.appRole || "user") as UserRole,
      is_active: user.isActive ?? true,
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    role?: UserRole;
    is_active?: boolean;
  }
) {
  try {
    // Require admin role to update user profiles
    await requireAdmin();

    // Only super_admin can promote users to super_admin
    if (updates.role === "super_admin") {
      const session = await getCurrentSession();
      const currentUserRole = (session?.user as any)?.appRole;
      if (!isSuperAdmin(currentUserRole)) {
        throw new Error("Only super admins can promote users to super admin");
      }
    }

    // Build the update data for Better Auth API (only fields it supports)
    const updateData: Record<string, any> = {};

    if (updates.name !== undefined) {
      updateData.displayName = updates.name;
      updateData.name = updates.name;
    }

    // Only call Better Auth API if there are fields it can update (name only)
    if (Object.keys(updateData).length > 0) {
      await auth.api.updateUser({
        headers: await headers(),
        body: {
          userId: userId,
          data: updateData,
        } as any,
      });
    }

    // Update isActive directly in the database (Better Auth API doesn't support this)
    if (updates.is_active !== undefined) {
      await db.execute(sql`
        UPDATE "user" 
        SET "isActive" = ${updates.is_active}
        WHERE id = ${userId}
      `);
    }

    // Update role directly in the database
    // Both appRole (our custom field) and role (Better Auth field) need to be updated
    if (updates.role !== undefined) {
      const newBetterAuthRole = isAdmin(updates.role) ? "admin" : "user";
      await db.execute(sql`
        UPDATE "user" 
        SET role = ${newBetterAuthRole}, "appRole" = ${updates.role}
        WHERE id = ${userId}
      `);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    throw new Error(error.message || "Failed to update user profile");
  }
}

export async function deleteUserProfile(userId: string) {
  try {
    // Require admin role to delete users
    await requireAdmin();

    // Delete from Better Auth using admin API (this handles all related tables)
    await auth.api.removeUser({
      headers: await headers(),
      body: {
        userId,
      },
    });

    return true;
  } catch (error: any) {
    console.error("Error deleting user:", error);
    throw new Error(error.message || "Failed to delete user");
  }
}

export async function getUsersList() {
  try {
    // Query Better Auth user table directly
    const result = await db.execute(sql`
      SELECT 
        id, 
        email, 
        name,
        "displayName",
        "appRole",
        "isActive"
      FROM "user" 
      ORDER BY "createdAt" ASC
    `);

    const rows = result as unknown as any[];
    return rows.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.displayName || user.name || "N/A",
      role: (user.appRole || "user") as UserRole,
      isActive: user.isActive ?? true,
    }));
  } catch (error) {
    console.error("Error getting users list:", error);
    return [];
  }
}

export async function createUser(
  email: string,
  password: string,
  role: string,
  name: string,
  phoneNumber: string
) {
  try {
    // Require admin role to create users
    await requireAdmin();

    // Only super_admin can create users with super_admin role
    if (role === "super_admin") {
      const session = await getCurrentSession();
      const currentUserRole = (session?.user as any)?.appRole;
      if (!isSuperAdmin(currentUserRole)) {
        throw new Error("Only super admins can create super admin users");
      }
    }

    const betterAuthRole = isAdmin(role) ? "admin" : "user";

    const result = await auth.api.createUser({
      headers: await headers(),
      body: {
        email,
        password,
        name,
        role: betterAuthRole,
        data: {
          displayName: name,
          appRole: role,
          isActive: true,
          phoneNumber: phoneNumber,
          twoFactorEnabled: true,
        },
      },
    });

    if (!result?.user) {
      console.error("Server Action: Failed to create user - no user returned");
      throw new Error("Failed to create user");
    }

    return {
      success: true,
      message: "User created successfully",
      user: result.user,
    };
  } catch (error: any) {
    console.error("Server Action: Error creating user:", error);
    throw new Error(error.message || "Failed to create user");
  }
}

export async function changePassword(userId: string, newPassword: string) {
  try {
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Use Better Auth to change password
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: "", // Not needed for admin change
        newPassword,
        revokeOtherSessions: true, // Force sign out from other sessions
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error changing password:", error);
    throw new Error(error.message || "Failed to change password");
  }
}

/**
 * Change a user's password using admin privileges (service role)
 */
export async function adminChangePassword(userId: string, newPassword: string) {
  try {
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Use Better Auth Admin API to set user password
    await auth.api.setUserPassword({
      headers: await headers(),
      body: {
        userId,
        newPassword,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Admin password change error:", error);
    throw new Error(error.message || "Failed to change password");
  }
}

export async function getCurrentUser() {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    // User data is now directly in session.user with custom fields
    const user = session.user as any;
    const isActive = user.isActive ?? true;

    // If user is inactive, return null (client will handle redirect)
    if (!isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      name: user.displayName || user.name,
      role: user.appRole || "user",
      is_active: isActive,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Consolidated function to fetch all Users page data in a single call
 * This reduces multiple POST requests to a single server-side fetch
 */
export async function getUsersPageData() {
  try {
    const users = await getUsersList();

    return {
      users,
    };
  } catch (error) {
    console.error("Error fetching users page data:", error);
    return {
      users: [],
    };
  }
}
