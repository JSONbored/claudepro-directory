/**
 * Base Number Validation Primitives
 *
 * Centralized number validators to eliminate duplication across schemas.
 * These primitives are used extensively throughout the codebase.
 *
 * Usage Statistics (before consolidation):
 * - z.number().int(): 50+ instances
 * - z.number().min(): 45+ instances
 * - z.number().positive(): 35+ instances
 *
 * Production Standards:
 * - All exports must be properly typed
 * - Each validator includes JSDoc with use cases
 * - Common ranges based on actual usage patterns
 */

import { z } from 'zod';

/**
 * Positive integer validator
 * Used for: Counts, IDs, token limits, timeouts
 * Common in: Configuration, API limits, pagination
 */
export const positiveInt = z
  .number()
  .int()
  .positive()
  .describe('Positive integer for counts, IDs, and limits');

/**
 * Non-negative integer validator (includes 0)
 * Used for: Counters, offsets, error counts, resource counts
 * Common in: Pagination, analytics, performance metrics
 */
export const nonNegativeInt = z
  .number()
  .int()
  .min(0)
  .describe('Non-negative integer including zero for counters and offsets');

/**
 * Percentage validator (0-100)
 * Used for: Popularity scores, progress, ratings
 * Common in: Content metadata, analytics, metrics
 */
export const percentage = z
  .number()
  .min(0)
  .max(100)
  .describe('Percentage value from 0-100 for scores and progress');

/**
 * Timestamp validator (positive integer milliseconds)
 * Used for: Unix timestamps, time measurements
 * Common in: Cache entries, analytics, date fields
 */
export const timestamp = z
  .number()
  .int()
  .positive()
  .describe('Unix timestamp in milliseconds for time measurements');

/**
 * Port number validator (1-65535)
 * Used for: Network port numbers
 * Common in: Server configuration, API endpoints
 */
export const portNumber = z
  .number()
  .int()
  .min(1)
  .max(65535)
  .describe('Valid network port number (1-65535)');

/**
 * Temperature validator (0-2) for AI models
 * Used for: AI model temperature configuration
 * Common in: Agent, command, rule configurations
 */
export const aiTemperature = z
  .number()
  .min(0)
  .max(2)
  .describe('AI model temperature parameter (0-2)');

/**
 * Timeout validator (100-300000ms / 0.1s-5min)
 * Used for: Hook timeouts, request timeouts
 * Common in: Hook configurations, API calls
 */
export const timeoutMs = z
  .number()
  .int()
  .min(100)
  .max(300000)
  .describe('Timeout in milliseconds (100ms-5min)');

/**
 * Small positive number validator (0-1000)
 * Used for: Small counts, limits, indices
 * Common in: Array limits, small configuration values
 */
export const smallPositive = z
  .number()
  .min(0)
  .max(1000)
  .describe('Small positive number for counts and limits (0-1000)');

/**
 * Load time validator (0+)
 * Used for: Performance metrics, render times
 * Common in: Analytics, performance monitoring
 */
export const loadTime = z
  .number()
  .min(0)
  .describe('Load time in milliseconds for performance metrics');

/**
 * Image dimension validator (200-2000px)
 * Used for: Image width/height in OpenGraph, metadata
 * Common in: SEO schemas, image metadata
 */
export const imageDimension = z
  .number()
  .int()
  .min(200)
  .max(2000)
  .describe('Image dimension in pixels (200-2000px)');

/**
 * Score validator (any positive number)
 * Used for: Popularity scores, ranking scores, relevance scores
 * Common in: Trending items, popular items, search results
 */
export const score = z.number().describe('Numeric score for popularity, ranking, and relevance');

/**
 * View count validator (non-negative integer)
 * Used for: Page views, content views, engagement metrics
 * Common in: Analytics, trending content
 */
export const viewCount = z
  .number()
  .int()
  .min(0)
  .describe('View count for page views and engagement metrics');

/**
 * Priority score validator (1-10)
 * Used for: Task priority, importance ratings
 * Common in: Checklist items, task management
 */
export const priority = z
  .number()
  .int()
  .min(1)
  .max(10)
  .describe('Priority level from 1-10 for task importance');

/**
 * TTL validator (time-to-live in seconds, positive integer)
 * Used for: Cache expiration, session timeouts
 * Common in: Redis cache, API rate limiting
 */
export const ttlSeconds = z
  .number()
  .int()
  .positive()
  .describe('Time-to-live in seconds for cache expiration');

/**
 * Optional positive integer
 * Used for: Optional configuration values, optional limits
 * Common in: AI configuration, pagination, optional settings
 */
export const optionalPositiveInt = z
  .number()
  .int()
  .positive()
  .optional()
  .describe('Optional positive integer for configuration values');
