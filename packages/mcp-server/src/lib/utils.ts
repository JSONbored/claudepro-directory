/**
 * Utility Functions
 *
 * Reuses shared utilities from @heyclaude/shared-runtime.
 * Only worker-specific utilities should be defined here.
 */

import { sanitizeText, sanitizeUrl, isValidSlug } from '@heyclaude/shared-runtime';

/**
 * Sanitize string input to prevent XSS and injection attacks.
 * Reuses shared-runtime sanitizeText with appropriate options.
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return sanitizeText(input, {
    allowHtml: false,
    allowNewlines: false,
    maxLength: 10000,
  });
}

/**
 * Validate slug format.
 * Reuses shared-runtime isValidSlug.
 *
 * @param slug - Slug string to validate
 * @returns true if valid slug, false otherwise
 */
export { isValidSlug };

/**
 * Validate URL format.
 * Uses shared-runtime sanitizeUrl to validate and sanitize.
 *
 * @param url - URL string to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  const sanitized = sanitizeUrl(url);
  return sanitized.length > 0;
}
