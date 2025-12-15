export interface UpdateRequestChanges {
  sale_date?: { old: Date | null; new: Date };
  unit_price?: { old: number; new: number };
  total_price?: { old: number; new: number };
}

export interface PendingRequest {
  id: string;
  sale_batch_id: string;
  requested_by: string;
  requested_by_name: string;
  requested_at: Date | null;
  status: "pending" | "approved" | "rejected" | null;
  update_reason: string;
  changes: unknown;
  new_sale_date: Date | null;
  new_unit_price: string | null;
  new_total_price: string | null;
  batch_user_name: string;
  batch_meter_type: string;
  batch_amount: number;
  batch_recipient: string;
  batch_destination: string;
  current_sale_date: Date | null;
  current_unit_price: string;
  current_total_price: string;
}

// Static meter types - same as chart config
export const METER_TYPES = [
  "Integrated",
  "Split",
  "Gas",
  "Water",
  "Smart",
  "3 Phase",
] as const;

export type MeterType = (typeof METER_TYPES)[number];

// Status options for filtering
export const STATUS_OPTIONS = ["pending", "approved", "rejected"] as const;
export type StatusOption = (typeof STATUS_OPTIONS)[number];

export interface FilterOptions {
  requestedBy: string[];
  meterType: string[];
  recipient: string[];
}
