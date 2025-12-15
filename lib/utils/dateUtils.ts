const APP_TIMEZONE = "Africa/Nairobi";

/**
 * Type alias for date input parameters
 */
type DateInput = Date | string | null | undefined;

/**
 * Converts a UTC date to local date object while preserving the correct day
 * Handles various input types: Date, string, or null/undefined
 */
export function toLocalDate(date: DateInput): Date | null {
  if (!date) return null;

  try {
    // If it's already a Date object, we need to handle it carefully
    // If it's a string, parse it properly
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (Number.isNaN(dateObj.getTime())) {
      return null;
    }

    return dateObj;
  } catch {
    return null;
  }
}

/**
 * Formats a date to dd/MM/yyyy format (e.g., "27/06/2025")
 * Converts UTC dates to local timezone before formatting
 */
export function formatDate(date: DateInput): string {
  const localDate = toLocalDate(date);
  if (!localDate) return "N/A";

  return localDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Formats a date to dd/MM/yyyy HH:mm:ss format (e.g., "27/06/2025 15:54:20")
 * Converts UTC dates to local timezone before formatting
 */
export function formatDateTime(date: DateInput): string {
  const localDate = toLocalDate(date);
  if (!localDate) return "N/A";

  return localDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Formats a date to dd/MM/yyyy HH:mm format (e.g., "27/06/2025 15:54")
 * Converts UTC dates to local timezone before formatting
 */
export function formatDateTimeShort(date: DateInput): string {
  const localDate = toLocalDate(date);
  if (!localDate) return "N/A";

  return localDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Formats a date to time only HH:mm:ss format (e.g., "15:54:20")
 * Converts UTC dates to local timezone before formatting
 */
export function formatTime(date: DateInput): string {
  const localDate = toLocalDate(date);
  if (!localDate) return "N/A";

  return localDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Formats a date to a short format with month name (e.g., "27 Jun 2025")
 * Converts UTC dates to local timezone before formatting
 */
export function formatDateShort(date: DateInput): string {
  const localDate = toLocalDate(date);
  if (!localDate) return "N/A";

  return localDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Formats a date to a long readable format (e.g., "27 June 2025")
 * Converts UTC dates to local timezone before formatting
 */
export function formatDateLong(date: DateInput): string {
  const localDate = toLocalDate(date);
  if (!localDate) return "N/A";

  return localDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Formats a date with relative time info (e.g., "27/06/2025, 3:54 PM")
 * For notification timestamps
 */
export function formatNotificationDate(date: DateInput): string {
  const localDate = toLocalDate(date);
  if (!localDate) return "N/A";

  return localDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Formats a date for display in charts/tooltips
 * Returns dd/MM/yyyy format
 */
export function formatChartDate(date: DateInput): string {
  return formatDate(date);
}

/**
 * Gets current date/time formatted for receipts
 * Returns dd/MM/yyyy HH:mm:ss format
 */
export function getCurrentDateTime(): string {
  return formatDateTime(new Date());
}

/**
 * Formats a date for ISO format for date comparisons
 * Returns yyyy-MM-dd format (uses local timezone)
 */
export function formatISODate(date: DateInput): string {
  const localDate = toLocalDate(date);
  if (!localDate) return "";

  // Get local date parts using the app timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: APP_TIMEZONE,
  });

  return formatter.format(localDate);
}
