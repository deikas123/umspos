"use server";

import { randomUUID } from "node:crypto";

/**
 * Database utility functions for handling timeouts and error recovery
 */

const DEFAULT_TIMEOUT_MS = 25000; // 25 seconds (leave buffer for Vercel)

/**
 * Sanitizes an error object to extract only safe metadata
 * Prevents PII leakage in logs (emails, query strings, DB rows, stack traces)
 */
function sanitizeError(error: unknown): {
  errorId: string;
  name: string;
  message: string;
  code?: string;
  timestamp: string;
} {
  const errorId = randomUUID();
  const timestamp = new Date().toISOString();

  if (error instanceof Error) {
    // Truncate and sanitize message - remove potential PII patterns
    let safeMessage = error.message.slice(0, 200);

    // Mask email patterns
    safeMessage = safeMessage.replaceAll(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[EMAIL_REDACTED]"
    );

    // Mask potential phone numbers
    safeMessage = safeMessage.replaceAll(
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      "[PHONE_REDACTED]"
    );

    // Mask UUIDs that might identify specific records
    safeMessage = safeMessage.replaceAll(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "[UUID_REDACTED]"
    );

    // Mask meter numbers (assuming they follow patterns like 12345678901)
    safeMessage = safeMessage.replaceAll(/\b\d{10,13}\b/g, "[ID_REDACTED]");

    return {
      errorId,
      name: error.name,
      message: safeMessage,
      code: (error as NodeJS.ErrnoException).code,
      timestamp,
    };
  }

  return {
    errorId,
    name: "UnknownError",
    message:
      typeof error === "string"
        ? error.slice(0, 100)
        : "Unknown error occurred",
    timestamp,
  };
}

/**
 * Logs a sanitized error with correlation ID
 * Full error details should be sent to a protected monitoring system (e.g., Honeycomb, Sentry)
 */
function logSanitizedError(context: string, error: unknown): string {
  const sanitized = sanitizeError(error);

  // Log only safe metadata - correlate with errorId in monitoring system
  console.error(
    JSON.stringify({
      level: "error",
      context,
      ...sanitized,
    })
  );

  return sanitized.errorId;
}

/**
 * Wraps a database operation with a timeout to prevent hung queries
 * This is critical for serverless environments like Vercel
 *
 * @param operation - The async database operation to execute
 * @param timeoutMs - Timeout in milliseconds (default: 25000)
 * @param fallback - Optional fallback value to return on timeout
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  fallback?: T
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Database operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    if (fallback !== undefined) {
      const errorId = logSanitizedError("withTimeout", error);
      console.warn(
        `Database operation failed (errorId: ${errorId}), using fallback value`
      );
      return fallback;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Wraps a database operation with timeout and provides a fallback value
 * Useful for non-critical data that shouldn't block page load
 *
 * @param operation - The async database operation to execute
 * @param fallback - Fallback value to return on error/timeout
 * @param timeoutMs - Timeout in milliseconds (default: 15000)
 */
export async function withFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  timeoutMs: number = 15000
): Promise<T> {
  return withTimeout(operation, timeoutMs, fallback);
}

/**
 * Executes multiple database operations in parallel with individual timeouts
 * Failed operations return their fallback values instead of failing everything
 *
 * @param operations - Array of { operation, fallback } objects
 * @param timeoutMs - Timeout for each operation
 */
export async function withParallelFallbacks<T extends readonly unknown[]>(
  operations: {
    [K in keyof T]: { operation: () => Promise<T[K]>; fallback: T[K] };
  },
  timeoutMs: number = 15000
): Promise<T> {
  const results = await Promise.all(
    operations.map(({ operation, fallback }) =>
      withFallback(operation, fallback, timeoutMs)
    )
  );
  return results as unknown as T;
}
