/**
 * Error codes used across server actions
 * This file is NOT a "use server" file so it can export constants
 */
export const ERROR_CODES = {
  ACCOUNT_DEACTIVATED: "ACCOUNT_DEACTIVATED",
  METER_NOT_FOUND: "METER_NOT_FOUND",
  AGENT_NOT_FOUND: "AGENT_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
