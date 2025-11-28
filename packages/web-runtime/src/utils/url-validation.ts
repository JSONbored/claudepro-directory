/**
 * URL Validation Utilities
 *
 * Security-focused URL validation and sanitization functions.
 * Used for safely opening external links and validating repository/documentation URLs.
 *
 * Architecture:
 * - Pure functions (no side effects)
 * - Strict validation (whitelist approach)
 * - Sanitization (removes credentials, query strings, fragments)
 * - Type-safe with explicit return types
 */

/**
 * Validate and sanitize repository URL
 * Only allows HTTPS URLs from trusted repository hosts (GitHub, GitLab)
 * Returns sanitized URL (with query/fragment removed) or null if invalid
 */
export function getSafeRepositoryUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    // Require HTTPS and trusted hostname
    if (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'github.com' ||
        parsed.hostname === 'www.github.com' ||
        parsed.hostname === 'gitlab.com' ||
        parsed.hostname === 'www.gitlab.com')
    ) {
      // Remove query string and fragment for redirect
      parsed.search = '';
      parsed.hash = '';
      // Remove username/password if present
      parsed.username = '';
      parsed.password = '';
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize documentation URL
 * Returns sanitized URL (strip credentials, normalize host) or null if invalid
 */
export function isTrustedDocumentationUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Require HTTPS protocol
    if (parsed.protocol !== 'https:') {
      return null;
    }

    // Strip credentials
    parsed.username = '';
    parsed.password = '';

    // Normalize hostname (remove trailing dot, lowercase)
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();

    // Remove default HTTPS port
    if (parsed.port === '443') {
      parsed.port = '';
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate category and slug are safe for URL construction
 * Only allows alphanumeric, hyphens, and underscores
 */
export function isSafeCategoryAndSlug(category: unknown, slug: unknown): boolean {
  const SAFE = /^[a-zA-Z0-9_-]+$/;
  return (
    typeof category === 'string' &&
    typeof slug === 'string' &&
    SAFE.test(category) &&
    SAFE.test(slug)
  );
}

/**
 * Validate internal navigation path is safe
 * Only allows relative paths starting with /, no protocol-relative URLs
 */
export function isValidInternalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false;
  // Must start with / for relative paths
  if (!path.startsWith('/')) return false;
  // Reject protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false;
  // Reject dangerous protocols
  if (/^(javascript|data|vbscript|file):/i.test(path)) return false;
  // Basic path validation - allow alphanumeric, slashes, hyphens, underscores
  // This is permissive but safe for Next.js routing
  return /^\/[a-zA-Z0-9/?#\-_.~!*'();:@&=+$,%[\]]*$/.test(path);
}
