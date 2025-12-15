import type { ClientProspect } from "@/lib/db/schema";

export interface ChangeHistoryEntry {
  timestamp: string;
  user_id: string;
  user_name: string;
  changes: {
    field: string;
    old_value: string | number | null;
    new_value: string | number | null;
  }[];
}

export const STATUS_COLORS: Record<string, string> = {
  interested: "bg-green-100 text-green-800",
  not_interested: "bg-red-100 text-red-800",
  prospect: "bg-blue-100 text-blue-800",
  lead: "bg-purple-100 text-purple-800",
  presentation: "bg-yellow-100 text-yellow-800",
  quotation_sent: "bg-orange-100 text-orange-800",
  closed: "bg-emerald-100 text-emerald-800",
  lost: "bg-gray-100 text-gray-800",
};

export const STATUS_LABELS: Record<string, string> = {
  interested: "Interested",
  not_interested: "Not Interested",
  prospect: "Prospect",
  lead: "Lead",
  presentation: "Presentation",
  quotation_sent: "Quotation Sent",
  closed: "Closed",
  lost: "Lost",
};

export const PROSPECT_STATUS_OPTIONS = [
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "prospect", label: "Prospect" },
  { value: "lead", label: "Lead" },
  { value: "presentation", label: "Presentation" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
] as const;

export const METER_TYPE_OPTIONS = [
  { value: "split", label: "Split Meter" },
  { value: "integrated", label: "Integrated Meter" },
  { value: "3_phase", label: "3-Phase Meter" },
  { value: "other", label: "Other" },
];

export type ProspectWithHistory = ClientProspect & {
  change_history: ChangeHistoryEntry[];
};
