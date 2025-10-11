/**
 * Sanitization Transform Functions for Zod Schemas
 *
 * Centralized, reusable transform functions for input sanitization.
 * Eliminates duplication across schema files while maintaining type safety.
 *
 * Architecture:
 * - Pure functions that can be composed with Zod transforms
 * - Type-safe with proper handling of undefined/null
 * - Security-focused with injection prevention
 * - Performance-optimized for production use
 *
 * Usage:
 * ```typescript
 * import { trimString, normalizeEmail, stringToBoolean } from './sanitization-transforms';
 *
 * const schema = z.object({
 *   name: z.string().transform(trimString),
 *   email: z.string().email().transform(normalizeEmail),
 *   active: z.string().transform(stringToBoolean),
 * });
 * ```
 *
 * @see src/lib/schemas/form.schema.ts - Original implementations
 * @see src/lib/schemas/newsletter.schema.ts - Email normalization
 * @see src/lib/schemas/search.schema.ts - String to boolean conversion
 */

// ============================================================================
// STRING SANITIZATION TRANSFORMS
// ============================================================================

/**
 * Trim whitespace from string input
 * Handles undefined/null gracefully for optional fields
 *
 * Used in: form.schema.ts (4 instances), search.schema.ts (4 instances)
 *
 * @param value - String value to trim
 * @returns Trimmed string or empty string if undefined
 *
 * @example
 * z.string().transform(trimString)
 * // "  hello  " -> "hello"
 */
export function trimString(value: string): string {
  return value.trim();
}

/**
 * Trim whitespace from optional string input
 * Returns undefined if input is undefined (preserves optionality)
 *
 * Used in: search.schema.ts (optional fields)
 *
 * @param value - Optional string value to trim
 * @returns Trimmed string or undefined
 *
 * @example
 * z.string().optional().transform(trimOptionalString)
 * // "  hello  " -> "hello"
 * // undefined -> undefined
 */
export function trimOptionalString(value: string | undefined): string | undefined {
  return value?.trim();
}

/**
 * Trim whitespace from optional string, returning empty string for undefined
 * Used when you want to ensure a string output even for optional fields
 *
 * Used in: form.schema.ts (url field)
 *
 * @param value - Optional string value
 * @returns Trimmed string or empty string if undefined
 *
 * @example
 * z.string().optional().transform(trimOptionalStringOrEmpty)
 * // "  hello  " -> "hello"
 * // undefined -> ""
 */
export function trimOptionalStringOrEmpty(value: string | undefined): string {
  return value?.trim() || '';
}

/**
 * Normalize string to lowercase and trim whitespace
 * Standard normalization for case-insensitive identifiers
 *
 * Used in: analytics.schema.ts, middleware.schema.ts
 *
 * @param value - String value to normalize
 * @returns Lowercase, trimmed string
 *
 * @example
 * z.string().transform(normalizeString)
 * // "  Hello World  " -> "hello world"
 */
export function normalizeString(value: string): string {
  return value.toLowerCase().trim();
}

/**
 * Normalize email address (lowercase + trim)
 * RFC 5322 compliant email normalization
 *
 * Security: Prevents email spoofing via case variations
 * Used in: newsletter.schema.ts
 *
 * @param value - Email address to normalize
 * @returns Lowercase, trimmed email address
 *
 * @example
 * z.string().email().transform(normalizeEmail)
 * // "  User@Example.com  " -> "user@example.com"
 */
export function normalizeEmail(value: string): string {
  return value.toLowerCase().trim();
}

// ============================================================================
// TYPE CONVERSION TRANSFORMS
// ============================================================================

/**
 * Convert string to boolean
 * Handles common truthy/falsy string representations
 *
 * Used in: search.schema.ts (3 instances for featured, trending, remote flags)
 *
 * Truthy values: "true", "True", "TRUE", "1", "yes", "Yes", "YES"
 * Falsy values: Everything else
 *
 * @param value - String value to convert
 * @returns Boolean representation
 *
 * @example
 * z.string().transform(stringToBoolean)
 * // "true" -> true
 * // "false" -> false
 * // "1" -> true
 * // "0" -> false
 */
export function stringToBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * Convert optional string to boolean
 * Returns undefined if input is undefined (preserves optionality)
 *
 * @param value - Optional string value to convert
 * @returns Boolean or undefined
 *
 * @example
 * z.string().optional().transform(stringToOptionalBoolean)
 * // "true" -> true
 * // undefined -> undefined
 */
export function stringToOptionalBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return stringToBoolean(value);
}

// ============================================================================
// CONTENT-TYPE PARSING TRANSFORMS
// ============================================================================

/**
 * Extract base content type from Content-Type header
 * Removes parameters (charset, boundary, etc.)
 *
 * Used in: middleware.schema.ts
 *
 * Security: Prevents parameter injection attacks
 *
 * @param value - Content-Type header value
 * @returns Base content type (lowercase, trimmed)
 *
 * @example
 * parseContentType("application/json; charset=utf-8")
 * // -> "application/json"
 *
 * parseContentType("text/html; charset=utf-8")
 * // -> "text/html"
 *
 * parseContentType("multipart/form-data; boundary=----WebKitFormBoundary")
 * // -> "multipart/form-data"
 */
export function parseContentType(value: string): string {
  return value?.split(';')[0]?.trim().toLowerCase() || '';
}

// ============================================================================
// URL SANITIZATION TRANSFORMS
// ============================================================================

/**
 * Normalize URL string
 * Trims whitespace and converts to lowercase for consistency
 *
 * Note: Does NOT validate URL format - use z.string().url() before this
 *
 * @param value - URL string to normalize
 * @returns Normalized URL
 *
 * @example
 * z.string().url().transform(normalizeUrl)
 * // "  HTTPS://EXAMPLE.COM/PATH  " -> "https://example.com/path"
 */
export function normalizeUrl(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Normalize optional URL string
 * Returns empty string for undefined (common pattern in forms)
 *
 * @param value - Optional URL string
 * @returns Normalized URL or empty string
 *
 * @example
 * z.string().url().optional().transform(normalizeOptionalUrl)
 * // "  HTTPS://EXAMPLE.COM  " -> "https://example.com"
 * // undefined -> ""
 */
export function normalizeOptionalUrl(value: string | undefined): string {
  return value?.trim().toLowerCase() || '';
}

// ============================================================================
// SLUG SANITIZATION TRANSFORMS
// ============================================================================

/**
 * Normalize slug string
 * Ensures lowercase kebab-case format
 *
 * Note: Use slugString schema from base-strings.ts for full validation
 * This is just the transform portion for reuse
 *
 * @param value - Slug string to normalize
 * @returns Lowercase slug
 *
 * @example
 * normalizeSlug("My-Slug")
 * // -> "my-slug"
 */
export function normalizeSlug(value: string): string {
  return value.toLowerCase();
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Compose multiple transform functions
 * Allows building complex transforms from simple ones
 *
 * @param transforms - Array of transform functions to compose
 * @returns Composed transform function
 *
 * @example
 * const normalizeAndSlug = composeTransforms([
 *   trimString,
 *   normalizeString,
 * ]);
 *
 * z.string().transform(normalizeAndSlug)
 */
export function composeTransforms<T>(transforms: ((value: T) => T)[]): (value: T) => T {
  return (value: T) => transforms.reduce((acc, fn) => fn(acc), value);
}

/**
 * Type guard to check if value is non-empty after trimming
 * Useful for additional validation after sanitization
 *
 * @param value - String value to check
 * @returns True if non-empty after trim
 *
 * @example
 * z.string()
 *   .transform(trimString)
 *   .refine(isNonEmptyTrimmed, 'Value cannot be empty or whitespace only')
 */
export function isNonEmptyTrimmed(value: string): boolean {
  return value.trim().length > 0;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Transform function type for Zod schemas
 * Generic type for all transform functions in this module
 */
export type TransformFunction<TInput, TOutput = TInput> = (value: TInput) => TOutput;

/**
 * Optional transform function type
 */
export type OptionalTransformFunction<TInput, TOutput = TInput> = (
  value: TInput | undefined
) => TOutput | undefined;
