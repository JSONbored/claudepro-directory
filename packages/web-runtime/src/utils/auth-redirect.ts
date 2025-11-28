/**
 * Auth Redirect Validation Utilities
 * 
 * Shared validation for 'next' redirect parameters in OAuth flows.
 * Prevents open redirect attacks by validating redirect paths.
 * 
 * This utility is isomorphic (works on both server and client) to ensure
 * validation rules stay in sync between route handlers and client components.
 */

/**
 * Validates and normalizes a 'next' redirect parameter
 * Prevents open redirect attacks by ensuring:
 * - Path starts with '/' (relative path)
 * - Not protocol-relative (//example.com)
 * - Not backslash-relative (/\\example.com)
 * - No email-style paths (contains '@')
 * 
 * @param nextParameter - The 'next' parameter value from query string
 * @param defaultPath - Default path to return if validation fails (default: '/')
 * @returns Validated path or default path
 */
export function validateNextParameter(
  nextParameter: string | null | undefined,
  defaultPath: string = '/'
): string {
  const normalized = nextParameter ?? defaultPath;
  const isValidRedirect =
    normalized.startsWith('/') &&
    !normalized.startsWith('//') &&
    !normalized.startsWith('/\\') &&
    !normalized.includes('@');
  return isValidRedirect ? normalized : defaultPath;
}
