/**
 * Performance & Timing Validation Primitives
 *
 * Centralized validators for performance metrics and timing operations.
 * Shared between analytics.schema.ts and middleware.schema.ts.
 *
 * Phase 4: Specialized Schema Consolidation (SHA-2061)
 * - Extracts performance/timing patterns from analytics.schema.ts and middleware.schema.ts
 * - Consolidates duration and metric validators
 * - Unifies timestamp patterns
 * - Reduces bundle size by ~0.5-1%
 *
 * Production Standards:
 * - All exports properly typed with z.infer
 * - Security-first validation for metrics and timings
 * - Single source of truth for performance measurement
 */

import { z } from 'zod';
import { nonEmptyString, shortString } from './base-strings';

/**
 * ============================================================================
 * DURATION & TIMING PRIMITIVES
 * ============================================================================
 */

/**
 * Duration ranges for different performance contexts
 */
export const DURATION_LIMITS = {
  MAX_SHORT_DURATION: 5000, // 5 seconds
  MAX_MEDIUM_DURATION: 30000, // 30 seconds
  MAX_LONG_DURATION: 3600000, // 1 hour
} as const;

/**
 * Short duration validator (0-5 seconds)
 * Used for: Quick operations, API calls, render times
 * Common in: Client-side operations, fast API responses
 */
export const shortDurationMs = z
  .number()
  .int()
  .min(0, 'Duration cannot be negative')
  .max(DURATION_LIMITS.MAX_SHORT_DURATION, 'Duration exceeds 5 seconds')
  .describe('Short duration for quick operations and API calls (0-5 seconds)');

/**
 * Medium duration validator (0-30 seconds)
 * Used for: Standard operations, page loads, data fetching
 * Common in: Page navigation, form submissions, data queries
 */
export const mediumDurationMs = z
  .number()
  .int()
  .min(0, 'Duration cannot be negative')
  .max(DURATION_LIMITS.MAX_MEDIUM_DURATION, 'Duration exceeds 30 seconds')
  .describe('Medium duration for page loads and data fetching (0-30 seconds)');

/**
 * Long duration validator (0-1 hour)
 * Used for: Long-running operations, background jobs, batch processing
 * Common in: Analytics tracking, performance metrics, operation timings
 */
export const longDurationMs = z
  .number()
  .int()
  .min(0, 'Duration cannot be negative')
  .max(DURATION_LIMITS.MAX_LONG_DURATION, 'Duration exceeds 1 hour')
  .describe('Long duration for background jobs and batch processing (0-1 hour)');

/**
 * Generic duration validator (any non-negative duration)
 * Used for: Flexible timing measurements
 * Common in: Performance monitoring, generic timers
 */
export const durationMs = z
  .number()
  .int()
  .min(0, 'Duration cannot be negative')
  .describe('Generic duration validator for flexible timing measurements');

/**
 * ============================================================================
 * TIMESTAMP PRIMITIVES
 * ============================================================================
 */

/**
 * Unix timestamp (milliseconds) validator
 * Used for: Event timestamps, analytics tracking
 * Common in: Analytics events, performance metrics, logging
 */
export const timestampMillis = z
  .number()
  .int()
  .positive()
  .describe('Unix timestamp in milliseconds for event tracking');

/**
 * Date timestamp with default current time
 * Used for: Auto-timestamped events, tracking schemas
 * Common in: Analytics events, user actions, view tracking
 */
export const timestampDate = z
  .date()
  .optional()
  .default(() => new Date())
  .describe('Auto-timestamped Date object with current time default');

/**
 * Optional timestamp milliseconds
 * Used for: Optional timing fields
 * Common in: Performance metrics, optional timing data
 */
export const optionalTimestampMillis = z
  .number()
  .int()
  .positive()
  .optional()
  .describe('Optional Unix timestamp in milliseconds');

/**
 * ============================================================================
 * METRIC VALIDATION PRIMITIVES
 * ============================================================================
 */

/**
 * Metric name validator
 * Used for: Performance metric names, event names
 * Pattern: Must start with letter, alphanumeric + underscores only
 * Common in: Analytics events, performance tracking
 */
export const metricName = nonEmptyString
  .max(50, 'Metric name too long')
  .regex(/^[a-zA-Z][a-zA-Z0-9_]{0,49}$/, 'Invalid metric name format')
  .describe('Performance metric name starting with letter (alphanumeric + underscores)');

/**
 * Event name validator (for analytics)
 * Used for: Custom events, user actions, tracking events
 * Pattern: Must start with letter, alphanumeric + underscores + hyphens
 * Common in: Analytics tracking, custom events
 */
export const eventName = shortString
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,99}$/, 'Invalid event name format')
  .describe('Analytics event name for tracking user actions and custom events');

/**
 * ============================================================================
 * WEB VITALS PRIMITIVES
 * ============================================================================
 */

/**
 * Web vital metric validator (positive number)
 * Used for: Core Web Vitals (LCP, FID, CLS, etc.)
 * Common in: Performance monitoring, web vitals tracking
 */
export const webVitalMetric = z
  .number()
  .positive()
  .describe('Core Web Vitals metric value (LCP, FID, TTFB, etc.)');

/**
 * Optional web vital metric
 * Used for: Optional Core Web Vitals measurements
 * Common in: Web vitals schemas where not all metrics are available
 */
export const optionalWebVitalMetric = z
  .number()
  .positive()
  .optional()
  .describe('Optional Core Web Vitals metric for partial measurements');

/**
 * Cumulative Layout Shift (CLS) validator
 * Used for: CLS web vital (can be 0)
 * Common in: Web vitals tracking
 */
export const clsMetric = z
  .number()
  .min(0)
  .describe('Cumulative Layout Shift (CLS) metric for visual stability tracking');

/**
 * ============================================================================
 * PERFORMANCE SCORE PRIMITIVES
 * ============================================================================
 */

/**
 * Performance score validator (0-100)
 * Used for: Lighthouse scores, performance ratings
 * Common in: Performance monitoring, quality metrics
 */
export const performanceScore = z
  .number()
  .min(0)
  .max(100)
  .describe('Performance score from 0-100 for Lighthouse and quality metrics');

/**
 * Success rate validator (0-1 or 0-100)
 * Used for: Success rates, completion rates
 * Common in: Analytics, performance metrics
 */
export const successRate = z
  .number()
  .min(0)
  .max(1)
  .describe('Success rate as decimal from 0-1 for completion metrics');

/**
 * ============================================================================
 * METRIC METADATA PRIMITIVES
 * ============================================================================
 */

/**
 * Metric metadata limits
 */
export const METRIC_LIMITS = {
  MAX_METADATA_PROPERTIES: 15,
  MAX_PROPERTY_NAME_LENGTH: 50,
  MAX_STRING_VALUE_LENGTH: 500,
} as const;

/**
 * Metric metadata value validator
 * Used for: Flexible metric metadata values
 * Common in: Performance metrics, analytics events
 */
export const metricMetadataValue = z
  .union([z.string().max(METRIC_LIMITS.MAX_STRING_VALUE_LENGTH), z.number().finite(), z.boolean()])
  .describe('Flexible metadata value (string, number, or boolean)');

/**
 * Metric metadata object validator
 * Used for: Additional context in performance metrics
 * Common in: Performance tracking, analytics events
 */
export const metricMetadataSchema = z
  .record(z.string().max(METRIC_LIMITS.MAX_PROPERTY_NAME_LENGTH), metricMetadataValue)
  .refine(
    (meta) => Object.keys(meta).length <= METRIC_LIMITS.MAX_METADATA_PROPERTIES,
    `Maximum ${METRIC_LIMITS.MAX_METADATA_PROPERTIES} metadata properties allowed`
  )
  .optional()
  .default({})
  .describe('Metadata object with up to 15 properties for performance context');

/**
 * ============================================================================
 * ERROR TRACKING PRIMITIVES
 * ============================================================================
 */

/**
 * Error type validator
 * Used for: Error categorization, error tracking
 * Common in: Error monitoring, analytics
 */
export const errorType = nonEmptyString
  .max(100)
  .transform((val) => val.replace(/[^\w\s-]/g, ''))
  .describe('Error type identifier for categorization and tracking');

/**
 * Error severity validator
 * Used for: Error priority, incident management
 * Common in: Error tracking, monitoring systems
 */
export const errorSeverity = z
  .enum(['low', 'medium', 'high', 'critical'])
  .default('medium')
  .describe('Error severity level for incident priority management');

/**
 * Stack trace length limit
 */
export const MAX_STACK_TRACE_LENGTH = 5000;

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Validate duration with runtime checks
 * Used for: Safe duration validation in operations
 */
export function validateDuration(duration: number, maxMs?: number): number {
  const max = maxMs || DURATION_LIMITS.MAX_LONG_DURATION;
  return z.number().int().min(0).max(max).parse(duration);
}

/**
 * Validate metric name with runtime checks
 * Used for: Safe metric name validation
 */
export function validateMetricName(name: string): string {
  return metricName.parse(name);
}

/**
 * ============================================================================
 * TYPE EXPORTS
 * ============================================================================
 */

export type ShortDurationMs = z.infer<typeof shortDurationMs>;
export type MediumDurationMs = z.infer<typeof mediumDurationMs>;
export type LongDurationMs = z.infer<typeof longDurationMs>;
export type DurationMs = z.infer<typeof durationMs>;
export type TimestampMillis = z.infer<typeof timestampMillis>;
export type TimestampDate = z.infer<typeof timestampDate>;
export type OptionalTimestampMillis = z.infer<typeof optionalTimestampMillis>;
export type MetricName = z.infer<typeof metricName>;
export type EventName = z.infer<typeof eventName>;
export type WebVitalMetric = z.infer<typeof webVitalMetric>;
export type OptionalWebVitalMetric = z.infer<typeof optionalWebVitalMetric>;
export type ClsMetric = z.infer<typeof clsMetric>;
export type PerformanceScore = z.infer<typeof performanceScore>;
export type SuccessRate = z.infer<typeof successRate>;
export type MetricMetadataValue = z.infer<typeof metricMetadataValue>;
export type MetricMetadata = z.infer<typeof metricMetadataSchema>;
export type ErrorType = z.infer<typeof errorType>;
export type ErrorSeverity = z.infer<typeof errorSeverity>;
