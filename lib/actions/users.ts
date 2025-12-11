"use server";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { headers } from "next/headers";

// Note: User management now uses Better Auth's user table directly
// Custom fields (appRole, isActive, displayName) are stored in the user table

// Type for the user data from Better Auth user table
type UserRole = "admin" | "accountant" | "user";

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
    // Use Better Auth's admin API to update user
    const updateData: Record<string, any> = {};

    if (updates.name !== undefined) {
      updateData.displayName = updates.name;
      updateData.name = updates.name; // Also update the standard name field
    }

    if (updates.role !== undefined) {
      updateData.appRole = updates.role;
    }

    if (updates.is_active !== undefined) {
      updateData.isActive = updates.is_active;
    }

    // Use the correct admin API format: body has userId and data as separate fields
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        userId: userId,
        data: updateData,
      } as any, // Type assertion needed for custom fields
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    throw new Error(error.message || "Failed to update user profile");
  }
}

export async function deleteUserProfile(userId: string) {
  try {
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
  name: string
) {
  try {
    // Create user with Better Auth Admin API
    // Use the data field for custom fields
    const result = await auth.api.createUser({
      headers: await headers(),
      body: {
        email,
        password,
        name,
        data: {
          displayName: name,
          appRole: role,
          isActive: true,
        },
      },
    });

    if (!result?.user) throw new Error("Failed to create user");

    return {
      success: true,
      message: "User created successfully",
      user: result.user,
    };
  } catch (error: any) {
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

    // Force sign out after password change
    await signOut();

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

    // If user is inactive, sign them out
    if (!isActive) {
      await signOut();
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

export async function signOut() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error signing out:", error);
    throw new Error(error.message || "Failed to sign out");
  }
}

export async function signIn(email: string, password: string) {
  try {
    // Sign in with Better Auth
    const result = await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email,
        password,
      },
    });

    if (!result?.user) {
      throw new Error("No user data returned");
    }

    // Check if user is active (custom field is now in user table)
    const user = result.user as any;
    const isActive = user.isActive ?? true;

    if (!isActive) {
      await signOut();
      const error = new Error("ACCOUNT_DEACTIVATED");
      error.name = "AuthError";
      throw error;
    }

    return {
      user: result.user,
      token: result.token,
      error: null,
    } as const;
  } catch (error: any) {
    console.error("Error signing in:", error);
    let fallbackMessage = "Failed to sign in";
    if (typeof error === "object" && error !== null && "message" in error) {
      const messageValue = (error as { message?: unknown }).message;
      if (typeof messageValue === "string" && messageValue.trim().length > 0) {
        fallbackMessage = messageValue;
      }
    }

    const normalizedError =
      error instanceof Error ? error : new Error(fallbackMessage);
    return {
      user: null,
      token: null,
      error: normalizedError,
    } as const;
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
