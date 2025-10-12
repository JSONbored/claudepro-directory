/**
 * Date Utilities
 * Consolidated date formatting and manipulation functions
 * SHA-2101: Part of consolidation effort
 *
 * Replaces:
 * - date-utils.ts (formatDate, formatRelativeDate)
 * - date-helpers.ts (formatDistanceToNow)
 *
 * Features:
 * - Absolute date formatting (localized, ISO, etc.)
 * - Relative date formatting ("2 days ago", "just now")
 * - Date parsing and validation
 * - Time calculations
 */

/**
 * Format Options
 */
export type DateFormatStyle = 'short' | 'long' | 'iso';
export type RelativeDateStyle = 'simple' | 'detailed';

export interface RelativeDateOptions {
  /** Style of relative date output */
  style?: RelativeDateStyle;
  /** Maximum days before showing absolute date */
  maxDays?: number;
}

/**
 * Absolute Date Formatting
 */

/**
 * Formats a date to a localized format
 * @param date - Date string or Date object
 * @param style - Format style (short, long, iso)
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15') // "January 15, 2024"
 * formatDate('2024-01-15', 'short') // "Jan 15, 2024"
 * formatDate('2024-01-15', 'iso') // "2024-01-15"
 */
export function formatDate(date: string | Date, style: DateFormatStyle = 'long'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (style === 'iso') {
      const isoDate = dateObj.toISOString().split('T')[0];
      return isoDate ?? '';
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: style === 'long' ? 'long' : 'short',
      day: 'numeric',
    });
  } catch {
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Relative Date Formatting
 */

/**
 * Formats a date as relative time with granular time units
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Relative time string (e.g., "2 hours ago", "just now")
 *
 * @example
 * // Detailed style (default) - includes minutes/hours
 * formatRelativeDate(new Date()) // "just now"
 * formatRelativeDate(yesterday) // "1 day ago"
 *
 * // Simple style - days/weeks/months only
 * formatRelativeDate(yesterday, { style: 'simple' }) // "Yesterday"
 * formatRelativeDate(lastWeek, { style: 'simple' }) // "1 week ago"
 */
export function formatRelativeDate(date: string | Date, options: RelativeDateOptions = {}): string {
  const { style = 'detailed', maxDays } = options;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // If maxDays is set and exceeded, return absolute date
    if (maxDays && diffDays > maxDays) {
      return formatDate(dateObj);
    }

    // Simple style (existing formatRelativeDate behavior)
    if (style === 'simple') {
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${diffWeeks} weeks ago`;
      if (diffDays < 365) return `${diffMonths} months ago`;
      return `${diffYears} years ago`;
    }

    // Detailed style (existing formatDistanceToNow behavior)
    if (diffSeconds < 60) {
      return 'just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
    if (diffWeeks < 4) {
      return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
    }
    if (diffMonths < 12) {
      return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    }
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  } catch {
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Alias for detailed relative date formatting (replaces formatDistanceToNow)
 * @param date - Date object
 * @returns Detailed relative time string
 *
 * @example
 * formatDistanceToNow(new Date()) // "just now"
 * formatDistanceToNow(yesterday) // "1 day ago"
 */
export function formatDistanceToNow(date: Date): string {
  return formatRelativeDate(date, { style: 'detailed' });
}

/**
 * Date Parsing & Validation
 */

/**
 * Safely parses a date string
 * @param input - Date string to parse
 * @returns Date object or null if invalid
 *
 * @example
 * parseDate('2024-01-15') // Date object
 * parseDate('invalid') // null
 */
export function parseDate(input: string): Date | null {
  try {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Checks if a value is a valid date
 * @param date - Value to check
 * @returns True if valid date
 *
 * @example
 * isValidDate(new Date()) // true
 * isValidDate('2024-01-15') // true
 * isValidDate('invalid') // false
 */
export function isValidDate(date: unknown): boolean {
  if (date instanceof Date) {
    return !Number.isNaN(date.getTime());
  }
  if (typeof date === 'string') {
    return parseDate(date) !== null;
  }
  return false;
}

/**
 * Time Calculations
 */

/**
 * Gets the number of days between a date and now
 * @param date - Date string or Date object
 * @returns Number of days (positive = past, negative = future)
 *
 * @example
 * getDaysAgo(yesterday) // 1
 * getDaysAgo(tomorrow) // -1
 */
export function getDaysAgo(date: string | Date): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a date is in the past
 * @param date - Date string or Date object
 * @returns True if date is in the past
 */
export function isInPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
}

/**
 * Checks if a date is in the future
 * @param date - Date string or Date object
 * @returns True if date is in the future
 */
export function isInFuture(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
}

/**
 * Week Calculations
 * SHA-3152: Consolidated from featured-calculator and featured-loader services
 */

/**
 * Gets the start of the current week (Monday at 00:00:00)
 * @returns Date object representing Monday of current week
 *
 * @example
 * getCurrentWeekStart() // Monday 00:00:00 of current week
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Gets the start of the current week as ISO date string (YYYY-MM-DD)
 * @returns ISO date string for Monday of current week
 *
 * @example
 * getCurrentWeekStartISO() // "2025-01-06"
 */
export function getCurrentWeekStartISO(): string {
  return getCurrentWeekStart().toISOString().split('T')[0] as string;
}

/**
 * Gets the end of a week (Sunday at 23:59:59)
 * @param weekStart - Start date of the week (Monday)
 * @returns Date object representing Sunday of that week
 *
 * @example
 * const monday = getCurrentWeekStart()
 * getWeekEnd(monday) // Following Sunday 23:59:59
 */
export function getWeekEnd(weekStart: Date): Date {
  const sunday = new Date(weekStart);
  sunday.setDate(weekStart.getDate() + 6); // Add 6 days to get Sunday
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Formats a week range for display
 * @param weekStart - Start date of the week (Monday)
 * @returns Formatted week range string
 *
 * @example
 * formatWeekRange(new Date('2025-01-06')) // "Jan 6-12"
 */
export function formatWeekRange(weekStart: Date): string {
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const monthName = monthFormatter.format(weekStart);
  const startDay = weekStart.getDate();
  const endDay = getWeekEnd(weekStart).getDate();
  return `${monthName} ${startDay}-${endDay}`;
}
