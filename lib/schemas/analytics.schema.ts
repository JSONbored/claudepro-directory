/**
 * Production-grade analytics event validation schemas
 * Security-first approach to prevent data corruption and ensure integrity
 */

import { z } from 'zod';
import { nonNegativeInt, viewCount } from '@/lib/schemas/primitives/base-numbers';
import { nonEmptyString, shortString } from '@/lib/schemas/primitives/base-strings';
import {
  clsMetric,
  errorSeverity,
  errorType,
  eventName,
  longDurationMs,
  metricMetadataSchema,
  metricName,
  optionalWebVitalMetric,
  timestampDate,
  timestampMillis,
} from '@/lib/schemas/primitives/performance-primitives';
import { type ContentCategory, contentCategorySchema } from './shared.schema';

/**
 * Branded slug validation for content identifiers
 * Provides compile-time type safety for content slugs
 */
export const contentSlugSchema = nonEmptyString
  .max(200, 'Content slug is too long')
  .regex(
    /^[a-zA-Z0-9-_/]+$/,
    'Slug can only contain letters, numbers, hyphens, underscores, and forward slashes'
  )
  .transform((val) => val.toLowerCase().trim())
  .brand<'ContentSlug'>();

export type ContentSlug = z.infer<typeof contentSlugSchema>;

/**
 * Branded UserId schema for strong type safety
 * Ensures user IDs are properly validated and typed
 */
export const userIdSchema = shortString
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid user ID format')
  .brand<'UserId'>();

export type UserId = z.infer<typeof userIdSchema>;

/**
 * View tracking event schema
 */
export const trackViewSchema = z.object({
  category: contentCategorySchema,
  slug: contentSlugSchema,
  timestamp: timestampDate,
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  referrer: z.string().url().optional(),
  userAgent: z.string().max(500).optional(),
});

export type TrackViewEvent = z.infer<typeof trackViewSchema>;

/**
 * Copy tracking event schema (for code snippets)
 */
export const trackCopySchema = z.object({
  category: contentCategorySchema,
  slug: contentSlugSchema,
  timestamp: timestampDate,
  content: z.string().max(10000).optional(), // Optional snippet of what was copied
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
});

export type TrackCopyEvent = z.infer<typeof trackCopySchema>;

/**
 * Click tracking event schema
 */
export const trackClickSchema = z.object({
  category: contentCategorySchema,
  slug: contentSlugSchema,
  target: z.enum(['external', 'internal', 'download', 'github', 'docs']),
  url: z.string().url().optional(),
  timestamp: timestampDate,
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
});

export type TrackClickEvent = z.infer<typeof trackClickSchema>;

/**
 * Search event schema
 */
export const trackSearchSchema = z.object({
  query: nonEmptyString.max(200, 'Search query is too long').transform((val) => val.trim()),
  category: z.enum(['all', 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides']).optional(),
  resultsCount: nonNegativeInt.optional(),
  clickedResult: z.string().optional(),
  timestamp: timestampDate,
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
});

export type TrackSearchEvent = z.infer<typeof trackSearchSchema>;

/**
 * Page view event schema
 */
export const pageViewSchema = z.object({
  pathname: nonEmptyString.max(500, 'Pathname is too long'),
  title: z.string().max(200).optional(),
  referrer: z.string().url().optional(),
  timestamp: timestampDate,
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  viewport: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
  screenResolution: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
});

export type PageViewEvent = z.infer<typeof pageViewSchema>;

/**
 * Error tracking event schema
 */
export const trackErrorSchema = z.object({
  message: nonEmptyString.max(1000, 'Message is too long'),
  stack: z.string().max(5000).optional(),
  category: z.enum(['client', 'server', 'api', 'validation', 'network']),
  severity: errorSeverity,
  pathname: z.string().optional(),
  timestamp: timestampDate,
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type TrackErrorEvent = z.infer<typeof trackErrorSchema>;

/**
 * Web Vitals metrics schema
 */
export const webVitalsMetricsSchema = z.object({
  pathname: nonEmptyString.max(500, 'Pathname is too long'),
  ttfb: optionalWebVitalMetric, // Time to First Byte
  fcp: optionalWebVitalMetric, // First Contentful Paint
  lcp: optionalWebVitalMetric, // Largest Contentful Paint
  fid: optionalWebVitalMetric, // First Input Delay
  cls: clsMetric.optional(), // Cumulative Layout Shift (min 0)
  tbt: optionalWebVitalMetric, // Total Blocking Time
  tti: optionalWebVitalMetric, // Time to Interactive
  timestamp: timestampDate,
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
});

export type WebVitalsMetrics = z.infer<typeof webVitalsMetricsSchema>;

/**
 * Umami analytics event data schema
 * Strict validation for production analytics tracking
 */
export const umamiEventDataSchema = z.record(
  nonEmptyString.max(50),
  z.union([z.string().max(500), z.number(), z.boolean(), z.null()])
);

export type UmamiEventData = z.infer<typeof umamiEventDataSchema>;

/**
 * Umami payload schema for pageview and custom events
 */
export const umamiPayloadSchema = z.object({
  hostname: z.string().optional(),
  language: z.string().optional(),
  referrer: z.string().optional(),
  screen: z.string().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  website: z.string().optional(),
  name: z.string().optional(),
  data: umamiEventDataSchema.optional(),
});

export type UmamiPayload = z.infer<typeof umamiPayloadSchema>;

/**
 * Umami track event schema
 */
export const umamiTrackEventSchema = z.object({
  eventName: nonEmptyString.max(50),
  data: umamiEventDataSchema.optional(),
});

export type UmamiTrackEvent = z.infer<typeof umamiTrackEventSchema>;

/**
 * Umami identify schema
 */
export const umamiIdentifySchema = z.object({
  userId: shortString.optional(),
  data: umamiEventDataSchema,
});

export type UmamiIdentify = z.infer<typeof umamiIdentifySchema>;

/**
 * Umami Global Interface Schema
 * Represents the global umami tracking object
 */
export const umamiGlobalSchema = z.object({
  track: z.custom<
    (eventName: string, data?: Record<string, string | number | boolean | null>) => void
  >((val) => typeof val === 'function', { message: 'Expected a track function' }),
  identify: z.custom<(data: Record<string, string | number | boolean | null>) => void>(
    (val) => typeof val === 'function',
    { message: 'Expected an identify function' }
  ),
});

export type UmamiGlobal = z.infer<typeof umamiGlobalSchema>;

/**
 * Custom event schema for flexible tracking
 */
export const customEventSchema = z.object({
  name: shortString.regex(/^[a-zA-Z0-9_-]+$/, 'Event name contains invalid characters'),
  category: z.string().max(50).optional(),
  action: z.string().max(50).optional(),
  label: z.string().max(200).optional(),
  value: z.number().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  timestamp: timestampDate,
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
});

export type CustomEvent = z.infer<typeof customEventSchema>;

/**
 * Analytics response schema
 */
export const analyticsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  viewCount: viewCount.optional(),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
export type TrackView = z.infer<typeof trackViewSchema>;
export type TrackCopy = z.infer<typeof trackCopySchema>;
export type TrackClick = z.infer<typeof trackClickSchema>;
export type TrackSearch = z.infer<typeof trackSearchSchema>;
export type PageView = z.infer<typeof pageViewSchema>;
export type TrackError = z.infer<typeof trackErrorSchema>;

/**
 * Helper function to validate tracking parameters
 */
export function validateTrackingParams(
  category: unknown,
  slug: unknown
): { category: ContentCategory; slug: string } {
  const validatedCategory = contentCategorySchema.parse(category);
  const validatedSlug = contentSlugSchema.parse(slug);

  return {
    category: validatedCategory,
    slug: validatedSlug,
  };
}

/**
 * Security limits to prevent abuse
 * Note: Some limits imported from performance-primitives (METRIC_LIMITS)
 */
const TRACKER_LIMITS = {
  MAX_EVENT_NAME_LENGTH: 100,
  MAX_STRING_VALUE_LENGTH: 500,
  MAX_PROPERTIES_COUNT: 20,
  MAX_TRAITS_COUNT: 10,
  MAX_CONTEXT_LENGTH: 200,
  MAX_STACK_TRACE_LENGTH: 5000,
} as const;

/**
 * Event name validation pattern - alphanumeric with underscores/hyphens
 */
const EVENT_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,99}$/;

/**
 * Generic tracking event schema for flexible event tracking
 */
export const trackingEventSchema = z.object({
  eventName: nonEmptyString
    .max(TRACKER_LIMITS.MAX_EVENT_NAME_LENGTH)
    .regex(EVENT_NAME_PATTERN, 'Invalid event name format'),
  payload: z
    .record(
      z.string(),
      z.union([
        z.string().max(TRACKER_LIMITS.MAX_STRING_VALUE_LENGTH),
        z.number().finite(),
        z.boolean(),
      ])
    )
    .optional()
    .default({}),
  timestamp: timestampMillis,
});

export type TrackingEvent = z.infer<typeof trackingEventSchema>;

/**
 * User identification schema for session tracking
 */
export const userIdentificationSchema = z.object({
  userId: userIdSchema,
  traits: z
    .record(
      z.string().max(50, 'Field is too long'),
      z.union([
        z.string().max(TRACKER_LIMITS.MAX_STRING_VALUE_LENGTH),
        z.number().finite(),
        z.boolean(),
        z.date(),
      ])
    )
    .refine(
      (traits) => Object.keys(traits).length <= TRACKER_LIMITS.MAX_TRAITS_COUNT,
      `Maximum ${TRACKER_LIMITS.MAX_TRAITS_COUNT} traits allowed`
    )
    .optional()
    .default({}),
});

export type UserIdentification = z.infer<typeof userIdentificationSchema>;

/**
 * Performance metric schema for tracking operation timings
 */
export const performanceMetricSchema = z.object({
  eventName: eventName,
  metric: metricName,
  duration_ms: longDurationMs,
  success: z.boolean(),
  error_type: errorType.optional(),
  metadata: metricMetadataSchema,
  timestamp: timestampMillis,
});

export type PerformanceMetric = z.infer<typeof performanceMetricSchema>;

/**
 * Error tracking schema with security considerations
 */
export const errorTrackingSchema = z.object({
  error_type: errorType,
  error_message: nonEmptyString
    .max(1000)
    .transform((val) => val.replace(/\b(?:password|token|key|secret)\b[^,\s]*/gi, '[REDACTED]')), // Remove sensitive patterns
  context: z.string().max(TRACKER_LIMITS.MAX_CONTEXT_LENGTH).optional(),
  page: z.string().max(500).optional(),
  stack_trace: z
    .string()
    .max(TRACKER_LIMITS.MAX_STACK_TRACE_LENGTH)
    .transform((val) => {
      // Remove file paths and sensitive information from stack traces
      return val
        .replace(/\/[a-zA-Z0-9_\-/.]+\.(ts|js|tsx|jsx)/gi, '[FILE]')
        .replace(/\b[A-Z]:\\[a-zA-Z0-9_\-\\.]+/gi, '[PATH]')
        .replace(/\/home\/[a-zA-Z0-9_\-/.]+/gi, '[HOME]')
        .replace(/\/Users\/[a-zA-Z0-9_\-/.]+/gi, '[USER]');
    })
    .optional(),
  timestamp: timestampMillis,
});

export type ErrorTracking = z.infer<typeof errorTrackingSchema>;

/**
 * Interaction event schema for user actions
 */
export const interactionEventSchema = z.object({
  action: z.enum(['click', 'hover', 'focus', 'blur', 'copy', 'paste', 'share', 'download']),
  target: nonEmptyString.max(200),
  category: z.string().max(50).optional(),
  slug: z.string().max(200).optional(),
  method: z.string().max(50).optional(),
  value: z.union([z.string().max(500), z.number().finite(), z.boolean()]).optional(),
  timestamp: timestampMillis,
});

export type InteractionEvent = z.infer<typeof interactionEventSchema>;

/**
 * Navigation event schema for tracking user flow
 */
export const navigationEventSchema = z.object({
  action: z.enum([
    'page_view',
    'tab_switch',
    'filter_toggle',
    'sort_change',
    'pagination',
    'search',
    'menu_open',
    'menu_close',
  ]),
  from: z.string().max(500).optional(),
  to: z.string().max(500).optional(),
  page: z.string().max(500).optional(),
  filter_name: shortString.optional(),
  filter_state: z.boolean().optional(),
  sort_field: z.string().max(50).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  search_query: z.string().max(200).optional(),
  timestamp: timestampMillis,
});

export type NavigationEvent = z.infer<typeof navigationEventSchema>;

/**
 * Google Analytics gtag event schema
 */
export const gtagEventSchema = z.object({
  command: z.literal('event'),
  action: shortString,
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type GtagEvent = z.infer<typeof gtagEventSchema>;

// Global interface declarations for Umami are handled in global.d.ts
// This file focuses on data validation schemas only

/**
 * Export all schemas for centralized access
 */
