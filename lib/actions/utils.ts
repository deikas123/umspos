"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { betterAuthUser } from "@/lib/db/schema";
import { ERROR_CODES } from "@/lib/constants/errors";

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
