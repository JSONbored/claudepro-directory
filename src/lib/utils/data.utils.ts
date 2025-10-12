/**
 * Data Utilities
 * Consolidated data parsing, formatting, and manipulation utilities
 * SHA-2101: Part of consolidation effort
 *
 * Consolidates:
 * - safe-json.ts (441 LOC) - Secure JSON parsing with devalue
 * - date.utils.ts (296 LOC) - Date formatting and manipulation
 *
 * Total: 737 LOC consolidated
 *
 * Features:
 * - Production-grade secure JSON parsing with XSS protection
 * - Multiple parsing strategies (devalue, validated, unsafe)
 * - Comprehensive date formatting and manipulation
 * - Week calculations for analytics
 * - Type-safe error handling
 */

import { parse as devalueParse, stringify as devalueStringify } from 'devalue';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';

// ============================================
// JSON PARSING UTILITIES
// ============================================

/**
 * Parse strategy enum
 */
export enum ParseStrategy {
  /** Use devalue for maximum security and type preservation */
  DEVALUE = 'devalue',
  /** Use JSON.parse with Zod validation for maximum compatibility */
  VALIDATED_JSON = 'validated-json',
  /** Use JSON.parse without validation (unsafe - use only for trusted data) */
  UNSAFE_JSON = 'unsafe-json',
}

/**
 * Parse options schema
 */
const parseOptionsSchema = z
  .object({
    strategy: z
      .nativeEnum(ParseStrategy)
      .default(ParseStrategy.DEVALUE)
      .describe('Parsing strategy to use'),
    maxSize: z
      .number()
      .positive()
      .max(10_000_000)
      .optional()
      .describe('Maximum allowed size in bytes (10MB default)'),
    enableLogging: z.boolean().default(true).describe('Enable error logging'),
    fallbackStrategy: z
      .nativeEnum(ParseStrategy)
      .optional()
      .describe('Fallback strategy if primary fails'),
  })
  .describe('Options for safe JSON parsing');

export type ParseOptions = z.infer<typeof parseOptionsSchema>;

/**
 * Stringify options schema
 */
const stringifyOptionsSchema = z
  .object({
    strategy: z
      .nativeEnum(ParseStrategy)
      .default(ParseStrategy.DEVALUE)
      .describe('Stringify strategy to use'),
    space: z.number().min(0).max(10).optional().describe('Indentation spaces for JSON.stringify'),
    enableLogging: z.boolean().default(true).describe('Enable error logging'),
  })
  .describe('Options for safe JSON stringification');

export type StringifyOptions = z.infer<typeof stringifyOptionsSchema>;

/**
 * Safe parse result type
 */
export interface SafeParseResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  strategy: ParseStrategy;
  parseTime?: number;
}

/**
 * Maximum safe JSON size (10MB)
 */
const MAX_SAFE_SIZE = 10_000_000;

/**
 * Safely parse a string using devalue (XSS-safe, type-preserving)
 */
function parseWithDevalue<T = unknown>(str: string): T {
  try {
    return devalueParse(str) as T;
  } catch (error) {
    throw new Error(
      `Devalue parse failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Safely parse a string using JSON.parse with Zod validation
 */
function parseWithValidation<T>(str: string, schema: z.ZodType<T>): T {
  try {
    const parsed = JSON.parse(str);
    return schema.parse(parsed);
  } catch (error) {
    throw new Error(
      `Validated JSON parse failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Safely parse a string using JSON.parse (unsafe - for trusted data only)
 */
function parseWithUnsafeJSON<T = unknown>(str: string): T {
  try {
    return JSON.parse(str) as T;
  } catch (error) {
    throw new Error(
      `JSON parse failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Production-grade safe JSON parsing with multiple strategies
 *
 * @param str - String to parse
 * @param schema - Optional Zod schema for validation
 * @param options - Parsing options
 * @returns Safely parsed value
 * @throws Error if all parsing strategies fail
 *
 * @example
 * const data = safeParse<UserData>(redisValue);
 * const validated = safeParse(apiResponse, userSchema, { strategy: ParseStrategy.VALIDATED_JSON });
 */
export function safeParse<T = unknown>(
  str: string,
  schema?: z.ZodType<T>,
  options?: Partial<ParseOptions>
): T {
  const opts = parseOptionsSchema.parse(options || {});
  const startTime = performance.now();

  // Size validation
  const maxSize = opts.maxSize || MAX_SAFE_SIZE;
  if (str.length > maxSize) {
    throw new Error(`Input exceeds maximum safe size: ${str.length} > ${maxSize} bytes`);
  }

  // Empty string check
  if (!str || str.trim() === '') {
    throw new Error('Cannot parse empty string');
  }

  let lastError: Error | undefined;

  // Primary strategy
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
    lastError = error instanceof Error ? error : new Error(String(error));

    if (opts.enableLogging) {
      logger.error('Primary parse strategy failed', lastError, {
        strategy: String(opts.strategy),
        size: `${str.length} bytes`,
        preview: str.slice(0, 100),
      });
    }
  }

  // Fallback strategy
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

  // All strategies failed
  throw new Error(
    `All parse strategies failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Safe parse with detailed result (doesn't throw)
 *
 * @example
 * const result = safeParseSafe<User>(input);
 * if (result.success) {
 *   console.log(result.data);
 * }
 */
export function safeParseSafe<T = unknown>(
  str: string,
  schema?: z.ZodType<T>,
  options?: Partial<ParseOptions>
): SafeParseResult<T> {
  const startTime = performance.now();
  const opts = parseOptionsSchema.parse(options || {});

  try {
    const data = safeParse<T>(str, schema, options);
    return {
      success: true,
      data,
      strategy: opts.strategy,
      parseTime: performance.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      strategy: opts.strategy,
      parseTime: performance.now() - startTime,
    };
  }
}

/**
 * Production-grade safe JSON stringification
 *
 * @example
 * const str = safeStringify({ date: new Date(), map: new Map() });
 */
export function safeStringify<T = unknown>(value: T, options?: Partial<StringifyOptions>): string {
  const opts = stringifyOptionsSchema.parse(options || {});

  try {
    switch (opts.strategy) {
      case ParseStrategy.DEVALUE:
      case ParseStrategy.VALIDATED_JSON:
        return devalueStringify(value);

      case ParseStrategy.UNSAFE_JSON:
        return JSON.stringify(value, null, opts.space);

      default:
        throw new Error(`Unknown stringify strategy: ${opts.strategy}`);
    }
  } catch (error) {
    if (opts.enableLogging) {
      logger.error('Stringify failed', error instanceof Error ? error : new Error(String(error)), {
        strategy: String(opts.strategy),
        type: typeof value,
      });
    }
    throw new Error(
      `Stringify failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a string is valid JSON without parsing
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Estimate memory size of a value when stringified
 */
export function estimateSize<T = unknown>(value: T): number {
  try {
    const str = safeStringify(value);
    // UTF-16 encoding: 2 bytes per character
    return str.length * 2;
  } catch {
    return 0;
  }
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Format Options
 */
export type DateFormatStyle = 'short' | 'long' | 'iso';
export type RelativeDateStyle = 'simple' | 'detailed';

export interface RelativeDateOptions {
  /** Style of relative date output */
  style?: RelativeDateStyle;
  /** Maximum days before showing absolute date */
  maxDays?: number;
}

/**
 * Formats a date to a localized format
 *
 * @example
 * formatDate('2024-01-15') // "January 15, 2024"
 * formatDate('2024-01-15', 'short') // "Jan 15, 2024"
 * formatDate('2024-01-15', 'iso') // "2024-01-15"
 */
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
  } catch {
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Formats a date as relative time with granular time units
 *
 * @example
 * formatRelativeDate(new Date()) // "just now"
 * formatRelativeDate(yesterday) // "1 day ago"
 * formatRelativeDate(lastWeek, { style: 'simple' }) // "1 week ago"
 */
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

    // If maxDays is set and exceeded, return absolute date
    if (maxDays && diffDays > maxDays) {
      return formatDate(dateObj);
    }

    // Simple style (existing formatRelativeDate behavior)
    if (style === 'simple') {
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${diffWeeks} weeks ago`;
      if (diffDays < 365) return `${diffMonths} months ago`;
      return `${diffYears} years ago`;
    }

    // Detailed style (existing formatDistanceToNow behavior)
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
  } catch {
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Alias for detailed relative date formatting
 */
export function formatDistanceToNow(date: Date): string {
  return formatRelativeDate(date, { style: 'detailed' });
}

/**
 * Safely parses a date string
 */
export function parseDate(input: string): Date | null {
  try {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Checks if a value is a valid date
 */
export function isValidDate(date: unknown): boolean {
  if (date instanceof Date) {
    return !Number.isNaN(date.getTime());
  }
  if (typeof date === 'string') {
    return parseDate(date) !== null;
  }
  return false;
}

/**
 * Gets the number of days between a date and now
 */
export function getDaysAgo(date: string | Date): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a date is in the past
 */
export function isInPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
}

/**
 * Checks if a date is in the future
 */
export function isInFuture(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
}

/**
 * Gets the start of the current week (Monday at 00:00:00)
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Gets the start of the current week as ISO date string (YYYY-MM-DD)
 */
export function getCurrentWeekStartISO(): string {
  return getCurrentWeekStart().toISOString().split('T')[0] as string;
}

/**
 * Gets the end of a week (Sunday at 23:59:59)
 */
export function getWeekEnd(weekStart: Date): Date {
  const sunday = new Date(weekStart);
  sunday.setDate(weekStart.getDate() + 6); // Add 6 days to get Sunday
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Formats a week range for display
 *
 * @example
 * formatWeekRange(new Date('2025-01-06')) // "Jan 6-12"
 */
export function formatWeekRange(weekStart: Date): string {
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const monthName = monthFormatter.format(weekStart);
  const startDay = weekStart.getDate();
  const endDay = getWeekEnd(weekStart).getDate();
  return `${monthName} ${startDay}-${endDay}`;
}
