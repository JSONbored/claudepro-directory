/**
 * URL Safety Utilities
 *
 * Security-focused URL and email validation functions for safe use in href attributes.
 * Used for external links, mailto links, and other user-provided URLs.
 *
 * Architecture:
 * - Pure functions (no side effects)
 * - Strict validation (whitelist approach)
 * - Sanitization (removes credentials, normalizes URLs)
 * - Type-safe with explicit return types
 */

/**
 * Validate and sanitize external website URL for safe use in href attributes.
 * Only allows HTTPS URLs (or HTTP for localhost in development).
 * Returns canonicalized URL or null if invalid.
 *
 * @param url - The input URL to validate; may be `null` or `undefined`.
 * @returns A canonicalized, safe href string when the input is an allowed URL, `null` otherwise.
 *   Allowed URLs use `https:` universally; `http:` is allowed only for localhost addresses.
 *   URLs containing credentials or failing parsing are rejected.
 *
 * @example
 * ```ts
 * const safeUrl = getSafeWebsiteUrl('https://example.com');
 * // Returns: 'https://example.com/'
 *
 * const invalid = getSafeWebsiteUrl('javascript:alert(1)');
 * // Returns: null
 * ```
 */
export function getSafeWebsiteUrl(url: null | string | undefined): null | string {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());
    // Only allow HTTPS protocol (or HTTP for localhost/development)
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1';
    if (parsed.protocol === 'https:') {
      // HTTPS always allowed
    } else if (parsed.protocol === 'http:' && isLocalhost) {
      // HTTP allowed only for local development
    } else {
      return null;
    }
    // Reject dangerous components
    if (parsed.username || parsed.password) return null;

    // Normalize hostname
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
    // Remove default ports
    if (parsed.port === '80' || parsed.port === '443') {
      parsed.port = '';
    }

    // Return canonicalized href (guaranteed to be normalized and safe)
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize email address for safe use in mailto links.
 * Returns safe mailto URL or null if email is invalid.
 *
 * @param email - The input email to validate; may be `null` or `undefined`.
 * @returns A safe `mailto:` URL string when the input is a valid email, `null` otherwise.
 *   Email is validated against RFC 5322 (simplified), normalized to lowercase, and encoded
 *   in the mailto URL to prevent injection attacks.
 *
 * @example
 * ```ts
 * const safeMailto = getSafeMailtoUrl('user@example.com');
 * // Returns: 'mailto:user@example.com'
 *
 * const invalid = getSafeMailtoUrl('not-an-email');
 * // Returns: null
 * ```
 */
export function getSafeMailtoUrl(email: null | string | undefined): null | string {
  if (!email || typeof email !== 'string') return null;

  // Trim and normalize
  const trimmed = email.trim();
  if (trimmed.length === 0) return null;

  // Basic email format validation (RFC 5322 simplified)
  // Prevents injection attacks while allowing valid emails
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Validate format
  if (!emailRegex.test(trimmed)) return null;

  // Security checks: reject dangerous patterns
  // Prevent null bytes
  if (trimmed.includes('\0')) return null;
  // Prevent path traversal attempts
  if (trimmed.includes('..') || trimmed.includes('//')) return null;
  // Prevent protocol injection (javascript:, data:, etc.)
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return null;

  // Normalize to lowercase
  const normalized = trimmed.toLowerCase();

  // Limit length (RFC 5321: max 254 characters)
  if (normalized.length > 254) return null;

  // Encode email in mailto URL to prevent injection
  // encodeURIComponent handles special characters safely
  return `mailto:${encodeURIComponent(normalized)}`;
}
