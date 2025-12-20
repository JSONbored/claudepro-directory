/**
 * Data Utilities - Secure JSON parsing and date formatting
 * Date calculations migrated to PostgreSQL (SHA-4137)
 */

import { parse as devalueParse } from 'devalue';
import { z } from 'zod';
import { logger } from './logger.ts';
import { normalizeError } from './errors.ts';
import { getSkeletonKeys } from './skeleton-keys.ts';
import { DATE_CONFIG } from './config/unified-config.ts';

const PARSE_STRATEGY = {
  DEVALUE: 'devalue',
  VALIDATED_JSON: 'validated-json',
  UNSAFE_JSON: 'unsafe-json',
} as const;

export const ParseStrategy = PARSE_STRATEGY;
export type ParseStrategy = (typeof PARSE_STRATEGY)[keyof typeof PARSE_STRATEGY];

const parseOptionsSchema = z.object({
  strategy: z.nativeEnum(ParseStrategy).default(ParseStrategy.DEVALUE),
  maxSize: z.number().positive().max(10_000_000).optional(),
  enableLogging: z.boolean().default(true),
  fallbackStrategy: z.nativeEnum(ParseStrategy).optional(),
});

export type ParseOptions = z.infer<typeof parseOptionsSchema>;

const MAX_SAFE_SIZE = 10_000_000;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function ensureStringArray(value: unknown, fallback: readonly string[] = []): string[] {
  return isStringArray(value) ? [...value] : [...fallback];
}

export function ensureString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

export function ensureNumber(value: unknown, fallback = 0): number {
  return isFiniteNumber(value) ? value : fallback;
}

function parseWithDevalue<T = unknown>(str: string): T {
  try {
    return devalueParse(str) as T;
  } catch (error) {
    const normalized = normalizeError(error, 'Devalue parse failed');
    throw normalized;
  }
}

/**
 * **INTERNAL USE ONLY**: This is part of the safeParse abstraction layer.
 * Direct JSON.parse is acceptable HERE because it's immediately followed by Zod validation.
 * All other code in the codebase MUST use safeParse() instead of JSON.parse directly.
 */
function parseWithValidation<T>(str: string, schema: z.ZodType<T>): T {
  try {
    const parsed = JSON.parse(str);
    return schema.parse(parsed);
  } catch (error) {
    const normalized = normalizeError(error, 'Validated JSON parse failed');
    throw normalized;
  }
}

/**
 * **INTERNAL USE ONLY**: This is part of the safeParse abstraction layer.
 * Direct JSON.parse is acceptable HERE for the UNSAFE_JSON strategy (trusted data only).
 * All other code in the codebase MUST use safeParse() instead of JSON.parse directly.
 */
function parseWithUnsafeJSON<T = unknown>(str: string): T {
  try {
    return JSON.parse(str) as T;
  } catch (error) {
    const normalized = normalizeError(error, 'JSON parse failed');
    throw normalized;
  }
}

export function safeParse<T = unknown>(
  str: string,
  schema?: z.ZodType<T>,
  options?: Partial<ParseOptions>
): T {
  const opts = parseOptionsSchema.parse(options || {});

  const maxSize = opts.maxSize || MAX_SAFE_SIZE;
  if (str.length > maxSize) {
    throw new Error(`Input exceeds maximum safe size: ${str.length} > ${maxSize} bytes`);
  }

  if (!str || str.trim() === '') {
    throw new Error('Cannot parse empty string');
  }

  let lastError: Error | undefined;

  try {
    let result: T;

    switch (opts.strategy) {
      case ParseStrategy.DEVALUE:
        result = parseWithDevalue<T>(str);
        break;

      case ParseStrategy.VALIDATED_JSON:
        if (!schema) {
          throw new Error('Schema is required for VALIDATED_JSON strategy');
        }
        result = parseWithValidation(str, schema);
        break;

      case ParseStrategy.UNSAFE_JSON:
        result = parseWithUnsafeJSON<T>(str);
        break;

      default:
        throw new Error(`Unknown parse strategy: ${opts.strategy}`);
    }

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'Primary parse strategy failed');
    lastError = normalized;

    if (opts.enableLogging) {
      logger.error(
        {
          err: normalized,
          strategy: String(opts.strategy),
          size: `${str.length} bytes`,
          preview: str.slice(0, 100),
        },
        'Primary parse strategy failed'
      );
    }
  }

  if (opts.fallbackStrategy && opts.fallbackStrategy !== opts.strategy) {
    try {
      let result: T;

      switch (opts.fallbackStrategy) {
        case ParseStrategy.DEVALUE:
          result = parseWithDevalue<T>(str);
          break;

        case ParseStrategy.VALIDATED_JSON:
          if (!schema) {
            throw new Error('Schema is required for VALIDATED_JSON fallback');
          }
          result = parseWithValidation(str, schema);
          break;

        case ParseStrategy.UNSAFE_JSON:
          result = parseWithUnsafeJSON<T>(str);
          break;

        default:
          throw new Error(`Unknown fallback strategy: ${opts.fallbackStrategy}`);
      }

      if (opts.enableLogging) {
        logger.info(
          {
            primaryStrategy: String(opts.strategy),
            fallbackStrategy: String(opts.fallbackStrategy),
          },
          'Fallback parse strategy succeeded'
        );
      }

      return result;
    } catch (fallbackError) {
      if (opts.enableLogging) {
        logger.error(
          {
            err: fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
            strategy: String(opts.fallbackStrategy),
          },
          'Fallback parse strategy failed'
        );
      }
    }
  }

  throw new Error(
    `All parse strategies failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * **INTERNAL USE ONLY**: This utility validates JSON syntax without returning parsed data.
 * Direct JSON.parse is acceptable HERE because the result is discarded (validation only).
 * All other code that needs parsed data MUST use safeParse() instead.
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export type DateFormatStyle = 'short' | 'long' | 'iso';
export type RelativeDateStyle = 'simple' | 'detailed';

export interface RelativeDateOptions {
  style?: RelativeDateStyle;
  maxDays?: number;
}

/**
 * Format a date deterministically using UTC to prevent hydration mismatches.
 *
 * This function uses UTC methods to ensure server and client produce identical output,
 * preventing React hydration errors caused by timezone differences.
 *
 * @param date - Date string or Date object to format
 * @param style - Format style ('long', 'short', or 'iso')
 * @returns Formatted date string (e.g., "Jan 15, 2024" or "January 15, 2024")
 */
export function formatDate(date: string | Date, style: DateFormatStyle = 'long'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (style === 'iso') {
      const isoDate = dateObj.toISOString().split('T')[0];
      return isoDate ?? '';
    }

    // Use UTC methods for deterministic output (prevents hydration mismatches)
    // This ensures server and client produce identical formatted dates
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth(); // 0-11
    const day = dateObj.getUTCDate();

    const monthNames =
      style === 'long'
        ? [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ]
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${monthNames[month]} ${day}, ${year}`;
  } catch (error) {
    const normalized = normalizeError(error, 'formatDate failed');
    logger.warn(
      { err: normalized, input: typeof date === 'string' ? date : date.toString(), style },
      'formatDate failed'
    );
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Format a date and time deterministically using UTC to prevent hydration mismatches.
 *
 * Replaces `toLocaleString()` with deterministic UTC-based formatting.
 *
 * @param date - Date string or Date object to format
 * @returns Formatted date/time string (e.g., "Jan 15, 2024, 3:45 PM")
 */
export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Use UTC methods for deterministic output
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth(); // 0-11
    const day = dateObj.getUTCDate();
    const hours = dateObj.getUTCHours();
    const minutes = dateObj.getUTCMinutes();

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${monthNames[month]} ${day}, ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
  } catch (error) {
    const normalized = normalizeError(error, 'formatDateTime failed');
    logger.warn(
      { err: normalized, input: typeof date === 'string' ? date : date.toString() },
      'formatDateTime failed'
    );
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Format a date as a relative time string (e.g., "2 days ago", "just now").
 *
 * **Build-Time Safety:**
 * - Accepts optional `now` parameter for deterministic builds
 * - If `now` is not provided, uses current time (runtime-only, not build-time safe)
 * - For server components with 'use cache', either:
 *   1. Provide `now` parameter (deterministic)
 *   2. Use after `connection()` (deferred to request time)
 *   3. Move to client components (client-side only)
 *
 * @param date - Date string or Date object to format
 * @param options - Formatting options
 * @param options.style - Style of relative date ('simple' or 'detailed', default: 'detailed')
 * @param options.maxDays - Maximum days before switching to absolute date format
 * @param options.now - Optional current time (Date object or timestamp) for deterministic builds
 * @returns Relative time string (e.g., "just now", "2 minutes ago", "3 days ago", "Today")
 *
 * @example
 * ```ts
 * // Runtime usage (after connection() or in client component)
 * formatRelativeDate('2024-01-13T00:00:00Z', { style: 'simple' })
 *
 * // Build-time safe usage (deterministic)
 * formatRelativeDate('2024-01-13T00:00:00Z', {
 *   style: 'simple',
 *   now: new Date('2024-01-15T00:00:00Z') // Explicit current time
 * })
 * ```
 */
export function formatRelativeDate(
  date: string | Date,
  options: RelativeDateOptions & { now?: Date | number } = {}
): string {
  const { style = 'detailed', maxDays, now } = options;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // CRITICAL: `now` parameter is REQUIRED to avoid new Date() calls
    // Next.js statically detects `new Date()` calls even if they're in conditional branches
    // If `now` is not provided, return formatted date instead (build-safe fallback)
    // This ensures the function never calls new Date() or Date.now() during build
    if (now === undefined) {
      // Always return formatted date if `now` is not provided (build-safe)
      // This prevents Next.js from detecting any new Date() calls in this function
      return formatDate(dateObj);
    }

    const nowTime = typeof now === 'number' ? now : now.getTime();
    const diffMs = nowTime - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (maxDays && diffDays > maxDays) {
      return formatDate(dateObj);
    }

    if (style === 'simple') {
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${diffWeeks} weeks ago`;
      if (diffDays < 365) return `${diffMonths} months ago`;
      return `${diffYears} years ago`;
    }

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
  } catch (error) {
    const normalized = normalizeError(error, 'formatRelativeDate failed');
    logger.warn(
      { err: normalized, input: typeof date === 'string' ? date : date.toString(), style },
      'formatRelativeDate failed'
    );
    return typeof date === 'string' ? date : date.toString();
  }
}

export function formatDistanceToNow(date: Date): string {
  return formatRelativeDate(date, { style: 'detailed' });
}

/**
 * Get formatted last updated date for legal pages (cookies, privacy, terms)
 * Returns static date from DATE_CONFIG (build-time safe, no new Date() calls)
 *
 * This date should be updated in unified-config.ts when legal pages are modified.
 *
 * @returns Formatted date string (e.g., "November 15, 2025")
 */
export function getLastUpdatedDate(): string {
  return DATE_CONFIG.lastUpdatedDate;
}

/**
 * Safely extracts metadata from a content item or collection
 * Returns a normalized Record<string, unknown> with fallback to empty object
 *
 * @param item - Content item or collection that may contain a metadata field
 * @returns Normalized metadata object, never null/undefined
 *
 * @example
 * ```ts
 * const metadata = getMetadata(item);
 * const config = metadata.configuration;
 * const tags = ensureStringArray(metadata.tags);
 * ```
 */
export function getMetadata(
  item: { metadata?: unknown } | Record<string, unknown>
): Record<string, unknown> {
  if ('metadata' in item && item.metadata) {
    return typeof item.metadata === 'object' &&
      item.metadata !== null &&
      !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {};
  }
  return {};
}

export { getSkeletonKeys };
