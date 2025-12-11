/**
 * Edge-Safe Error Normalization
 * 
 * This module provides error normalization WITHOUT importing logger.
 * Use this in proxy/middleware files that need to be edge-compatible.
 * 
 * ⚠️ IMPORTANT: This is a minimal version that doesn't log errors.
 * For full error logging, use normalizeError from errors.ts in server contexts.
 * 
 * **Why This Exists:**
 * - Proxy/middleware files are analyzed by Netlify for edge function compatibility
 * - The regular errors.ts imports logger, which imports pino (Node.js-only)
 * - This creates an indirect dependency that breaks edge function bundling
 * - This edge-safe version has zero dependencies and works in all runtimes
 * 
 * **Usage:**
 * - ✅ Use in proxy.ts, middleware.ts, and other edge-compatible files
 * - ✅ Use in files that need to avoid pulling in pino logger
 * - ❌ Don't use in server components that need error logging (use errors.ts instead)
 * 
 * @module web-runtime/errors-edge
 */

/**
 * Normalize unknown error types to Error objects
 * 
 * Edge-compatible version (no logger dependency).
 * This function is identical to normalizeError in errors.ts, but without
 * the logger import that pulls in pino.
 * 
 * @param error - Unknown error value (Error, string, object, etc.)
 * @param fallbackMessage - Fallback message if error cannot be converted
 * @returns Normalized Error object
 * 
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (error) {
 *   const normalized = normalizeErrorEdge(error, 'Operation failed');
 *   // Use normalized error (but don't log - this is edge-safe)
 * }
 * ```
 */
export function normalizeErrorEdge(
  error: unknown,
  fallbackMessage = 'Unknown error'
): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(fallbackMessage);
  }
}
