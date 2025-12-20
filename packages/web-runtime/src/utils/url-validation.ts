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
 * Validate and sanitize repository URL for safe use in href attributes.
 *
 * Only allows HTTPS URLs from trusted repository hosts (GitHub, GitLab).
 * Removes query strings, fragments, and credentials for security.
 * Returns sanitized URL or null if invalid.
 *
 * @param url - The repository URL to validate; may be `null` or `undefined`.
 * @returns A sanitized, safe href string when the input is a valid repository URL, `null` otherwise.
 *   Query strings and fragments are removed, credentials are stripped, and only trusted hosts are allowed.
 *
 * @example
 * ```ts
 * const safeUrl = getSafeRepositoryUrl('https://github.com/user/repo?ref=main#readme');
 * // Returns: 'https://github.com/user/repo'
 *
 * const invalid = getSafeRepositoryUrl('http://github.com/user/repo');
 * // Returns: null (HTTP not allowed)
 * ```
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
 * Validate and sanitize documentation URL for safe use in href attributes.
 *
 * Only allows HTTPS URLs. Strips credentials, normalizes hostname, and removes default ports.
 * Returns sanitized URL or null if invalid.
 *
 * @param url - The documentation URL to validate.
 * @returns A sanitized, safe href string when the input is a valid HTTPS URL, `null` otherwise.
 *   Credentials are stripped, hostname is normalized (lowercase, trailing dot removed),
 *   and default HTTPS port (443) is removed.
 *
 * @example
 * ```ts
 * const safeUrl = isTrustedDocumentationUrl('https://docs.example.com/path');
 * // Returns: 'https://docs.example.com/path'
 *
 * const invalid = isTrustedDocumentationUrl('http://docs.example.com/path');
 * // Returns: null (HTTP not allowed)
 * ```
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
 * Validate that category and slug are safe for URL construction.
 *
 * Ensures both category and slug contain only safe characters (alphanumeric, hyphens, underscores).
 * This prevents injection attacks and ensures valid URL segments.
 *
 * @param category - Category value to validate (may be any type)
 * @param slug - Slug value to validate (may be any type)
 * @returns `true` if both category and slug are strings containing only safe characters, `false` otherwise
 *
 * @example
 * ```ts
 * isSafeCategoryAndSlug('agents', 'my-agent') // Returns: true
 * isSafeCategoryAndSlug('agents', 'my agent') // Returns: false (space not allowed)
 * isSafeCategoryAndSlug('agents', '../path') // Returns: false (unsafe characters)
 * ```
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
 * Validate that an internal navigation path is safe for Next.js routing.
 *
 * Ensures the path is a valid relative path that can be safely used with Next.js Link components.
 * Rejects protocol-relative URLs, dangerous protocols, and invalid path formats.
 *
 * @param path - The path to validate (must be a string)
 * @returns `true` if the path is a safe internal path, `false` otherwise.
 *   Safe paths must:
 *   - Start with `/` (relative path)
 *   - Not start with `//` (protocol-relative URL)
 *   - Not contain dangerous protocols (javascript:, data:, vbscript:, file:)
 *   - Match Next.js routing pattern (alphanumeric, slashes, hyphens, query params, hash)
 *
 * @example
 * ```ts
 * isValidInternalPath('/agents') // Returns: true
 * isValidInternalPath('/agents/my-agent') // Returns: true
 * isValidInternalPath('//example.com') // Returns: false (protocol-relative)
 * isValidInternalPath('javascript:alert(1)') // Returns: false (dangerous protocol)
 * ```
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
