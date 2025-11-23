/**
 * Shared formatting helpers for email templates.
 */

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
};

/**
 * Format a date string or Date into a localized string suitable for emails.
 */
export function formatEmailDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
  locale = 'en-US'
): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  return value.toLocaleDateString(locale, options);
}

/**
 * Format a currency amount (defaults to USD).
 */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Format a number with thousands separators.
 */
export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Basic pluralization helper.
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const resolvedPlural = plural ?? `${singular}s`;
  return count === 1 ? singular : resolvedPlural;
}
