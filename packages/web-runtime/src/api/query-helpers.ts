/**
 * Query Parameter Helpers
 * 
 * Shared utilities for parsing and validating query parameters in API routes.
 * Eliminates repetitive validation logic across multiple routes.
 */

import { type content_category } from '@heyclaude/data-layer/prisma';
import { isValidCategory } from '@heyclaude/web-runtime/core';

/**
 * Parse and validate a category query parameter.
 * 
 * Handles both string and array values, normalizes to lowercase,
 * and validates using shared isValidCategory from @heyclaude/web-runtime/core.
 * 
 * @param value - Query parameter value (string, string array, or undefined)
 * @returns Valid content_category or null if invalid/missing
 * 
 * @example
 * ```typescript
 * const category = parseCategoryParam(query.category); // 'agents' | null
 * ```
 */
export function parseCategoryParam(
  value: string | string[] | undefined
): content_category | null {
  if (!value) return null;
  
  // Handle array (take first element)
  const category = Array.isArray(value) ? value[0] : value;
  if (!category) return null;
  
  const normalized = category.trim().toLowerCase();
  return isValidCategory(normalized) ? normalized : null;
}

/**
 * Parse and validate a limit query parameter.
 * 
 * Clamps value between min and max, returns default if invalid/missing.
 * 
 * @param value - Query parameter value (string or undefined)
 * @param min - Minimum allowed value (default: 1)
 * @param max - Maximum allowed value (default: 100)
 * @param default_ - Default value if invalid/missing (default: 20)
 * @returns Valid limit number
 * 
 * @example
 * ```typescript
 * const limit = parseLimitParam(query.limit, 1, 100, 20); // 1-100, default 20
 * ```
 */
export function parseLimitParam(
  value: string | undefined,
  min = 1,
  max = 100,
  default_ = 20
): number {
  if (!value) return default_;
  
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) return default_;
  
  return Math.min(parsed, max);
}

/**
 * Parse and validate an offset query parameter.
 * 
 * Ensures value is non-negative integer, returns default if invalid/missing.
 * 
 * @param value - Query parameter value (string or undefined)
 * @param default_ - Default value if invalid/missing (default: 0)
 * @returns Valid offset number (>= 0)
 * 
 * @example
 * ```typescript
 * const offset = parseOffsetParam(query.offset, 0); // >= 0, default 0
 * ```
 */
export function parseOffsetParam(
  value: string | undefined,
  default_ = 0
): number {
  if (!value) return default_;
  
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return default_;
  
  return Math.floor(parsed); // Ensure integer
}

/**
 * Parse and validate a boolean query parameter.
 * 
 * Handles string values 'true'/'false' and boolean values.
 * 
 * @param value - Query parameter value (string, boolean, or undefined)
 * @param default_ - Default value if invalid/missing (default: false)
 * @returns Valid boolean value
 * 
 * @example
 * ```typescript
 * const remote = parseBooleanParam(query.remote, false); // true | false
 * ```
 */
export function parseBooleanParam(
  value: string | boolean | undefined,
  default_ = false
): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return default_;
  
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  
  return default_;
}

/**
 * Parse and validate a string array query parameter.
 * 
 * Handles both string (comma-separated) and array values.
 * 
 * @param value - Query parameter value (string, string array, or undefined)
 * @returns Array of strings (empty array if invalid/missing)
 * 
 * @example
 * ```typescript
 * const tags = parseStringArrayParam(query.tags); // string[]
 * ```
 */
export function parseStringArrayParam(
  value: string | string[] | undefined
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') {
    // Handle comma-separated string
    return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
  return [];
}
