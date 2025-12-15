// Constants for Agent Analytics

export const MAX_COMPARISON_AGENTS = 10;
export const RANKINGS_PER_PAGE = 10;

export const TIME_PERIODS = {
  "7d": { label: "7 Days", days: 7 },
  "30d": { label: "30 Days", days: 30 },
  "90d": { label: "90 Days", days: 90 },
  "180d": { label: "6 Months", days: 180 },
  "365d": { label: "1 Year", days: 365 },
} as const;

export type TimePeriod = keyof typeof TIME_PERIODS;

// Distinct colors for different agents (max 10)
export const AGENT_COLORS = [
  "#4F46E5", // Indigo
  "#0EA5E9", // Sky
  "#059669", // Emerald
  "#DC2626", // Red
  "#7C3AED", // Violet
  "#EA580C", // Orange
  "#0891B2", // Cyan
  "#4338CA", // Indigo dark
  "#DB2777", // Pink
  "#16A34A", // Green
];
