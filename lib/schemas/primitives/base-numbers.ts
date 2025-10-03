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
