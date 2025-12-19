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

/**
 * Creates a start-of-day Date object for the given date in the app timezone (Africa/Nairobi).
 * This ensures consistent date filtering across client and server regardless of server timezone.
 *
 * @param date - The date to get start of day for
 * @returns Date object representing 00:00:00 in Africa/Nairobi timezone
 */
export function getStartOfDayInAppTimezone(date: DateInput): Date | null {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return null;

  // Get the date parts in the app timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: APP_TIMEZONE,
  });

  const [year, month, day] = formatter.format(dateObj).split("-").map(Number);

  // Create a date string that represents midnight in Africa/Nairobi
  // Africa/Nairobi is UTC+3, so midnight there is 21:00 UTC the previous day
  const isoString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+03:00`;
  return new Date(isoString);
}

/**
 * Creates an end-of-day Date object for the given date in the app timezone (Africa/Nairobi).
 * This ensures consistent date filtering across client and server regardless of server timezone.
 *
 * @param date - The date to get end of day for
 * @returns Date object representing 23:59:59.999 in Africa/Nairobi timezone
 */
export function getEndOfDayInAppTimezone(date: DateInput): Date | null {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return null;

  // Get the date parts in the app timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: APP_TIMEZONE,
  });

  const [year, month, day] = formatter.format(dateObj).split("-").map(Number);

  // Create a date string that represents end of day in Africa/Nairobi
  // Africa/Nairobi is UTC+3
  const isoString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T23:59:59.999+03:00`;
  return new Date(isoString);
}
