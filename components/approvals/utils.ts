import { format } from "date-fns";

export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value;
  return `KES ${Math.round(numValue).toLocaleString()}`;
};

export const formatDateValue = (date: Date | null): string => {
  if (!date) return "N/A";
  return format(new Date(date), "PPP");
};

export const formatDateShort = (date: Date | null): string => {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy");
};

export const formatDateTime = (date: Date | null): string => {
  if (!date) return "N/A";
  return format(new Date(date), "PPp");
};
