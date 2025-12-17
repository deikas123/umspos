// Re-export types from the existing constants
export type { KenyaCounty, CustomerType } from "@/lib/constants/locationData";

// Additional types specific to database operations
export type UserRole =
  | "SuperAdmin"
  | "Admin"
  | "Accountant"
  | "User"
  | "Sales Person";

export type NotificationType =
  | "METER_SALE"
  | "AGENT_ASSIGNMENT"
  | "METER_RETURN"
  | "FAULTY_METER"
  | "SYSTEM_UPDATE";

export type TransactionType = "assignment" | "return";

export type MeterStatus = "active" | "replaced" | "faulty";

export type FaultyMeterStatus =
  | "pending"
  | "repaired"
  | "unrepairable"
  | "binned";
