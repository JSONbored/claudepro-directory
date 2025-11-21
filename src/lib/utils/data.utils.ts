/**
 * Data Utilities - Secure JSON parsing and date formatting
 * Date calculations migrated to PostgreSQL (SHA-4137)
 */

import { parse as devalueParse } from 'devalue';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

export enum ParseStrategy {
  DEVALUE = 'devalue',
  VALIDATED_JSON = 'validated-json',
  UNSAFE_JSON = 'unsafe-json',
}

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
  const startTime = performance.now();

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

    const parseTime = performance.now() - startTime;

    if (opts.enableLogging && parseTime > 100) {
      logger.warn('Slow JSON parse detected', {
        strategy: String(opts.strategy),
        parseTime: `${parseTime.toFixed(2)}ms`,
        size: `${str.length} bytes`,
      });
    }

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'Primary parse strategy failed');
    lastError = normalized;

    if (opts.enableLogging) {
      logger.error('Primary parse strategy failed', normalized, {
        strategy: String(opts.strategy),
        size: `${str.length} bytes`,
        preview: str.slice(0, 100),
      });
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
        logger.info('Fallback parse strategy succeeded', {
          primaryStrategy: String(opts.strategy),
          fallbackStrategy: String(opts.fallbackStrategy),
        });
      }

      return result;
    } catch (fallbackError) {
      if (opts.enableLogging) {
        logger.error(
          'Fallback parse strategy failed',
          fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
          {
            strategy: String(opts.fallbackStrategy),
          }
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

export function formatDate(date: string | Date, style: DateFormatStyle = 'long'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (style === 'iso') {
      const isoDate = dateObj.toISOString().split('T')[0];
      return isoDate ?? '';
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: style === 'long' ? 'long' : 'short',
      day: 'numeric',
    });
  } catch (error) {
    const normalized = normalizeError(error, 'formatDate failed');
    logger.warn('formatDate failed', {
      input: typeof date === 'string' ? date : date.toString(),
      style,
      error: normalized.message,
    });
    return typeof date === 'string' ? date : date.toString();
  }
}

export function formatRelativeDate(date: string | Date, options: RelativeDateOptions = {}): string {
  const { style = 'detailed', maxDays } = options;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
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
    logger.warn('formatRelativeDate failed', {
      input: typeof date === 'string' ? date : date.toString(),
      style,
      error: normalized.message,
    });
    return typeof date === 'string' ? date : date.toString();
  }
}

export function formatDistanceToNow(date: Date): string {
  return formatRelativeDate(date, { style: 'detailed' });
}

/**
 * Get formatted last updated date for legal pages (cookies, privacy)
 * Returns current date in "Month Day, Year" format (e.g., "November 15, 2025")
 */
export function getLastUpdatedDate(): string {
  try {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to format last updated date');
    logger.error('getLastUpdatedDate: date formatting failed', normalized);
    return 'Unavailable';
  }
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
