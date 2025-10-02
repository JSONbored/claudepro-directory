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
  .brand<'ContentSlug'>()
  .describe(
    'Validated content identifier slug with alphanumeric characters, hyphens, underscores, and slashes (max 200 chars)'
  );

export type ContentSlug = z.infer<typeof contentSlugSchema>;

/**
 * Branded UserId schema for strong type safety
 * Ensures user IDs are properly validated and typed
 */
export const userIdSchema = shortString
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid user ID format')
  .brand<'UserId'>()
  .describe('Validated user identifier with alphanumeric characters, underscores, and hyphens');

export type UserId = z.infer<typeof userIdSchema>;

/**
 * View tracking event schema
 */
export const trackViewSchema = z
  .object({
    category: contentCategorySchema.describe('Content category being viewed'),
    slug: contentSlugSchema.describe('Unique content identifier slug'),
    timestamp: timestampDate.describe('Event occurrence timestamp'),
    userId: z.string().uuid().optional().describe('Optional UUID of viewing user'),
    sessionId: z
      .string()
      .optional()
      .describe('Optional session identifier for tracking user sessions'),
    referrer: z.string().url().optional().describe('Optional URL of the referring page'),
    userAgent: z
      .string()
      .max(500)
      .optional()
      .describe('Optional browser user agent string (max 500 chars)'),
  })
  .describe('Schema for tracking content view events with user and session context');

export type TrackViewEvent = z.infer<typeof trackViewSchema>;

/**
 * Copy tracking event schema (for code snippets)
 */
export const trackCopySchema = z
  .object({
    category: contentCategorySchema.describe('Content category where copy occurred'),
    slug: contentSlugSchema.describe('Content identifier where copy occurred'),
    timestamp: timestampDate.describe('Event occurrence timestamp'),
    content: z
      .string()
      .max(10000)
      .optional()
      .describe('Optional snippet of copied content (max 10000 chars)'),
    userId: z.string().uuid().optional().describe('Optional UUID of user who copied'),
    sessionId: z.string().optional().describe('Optional session identifier for tracking'),
  })
  .describe('Schema for tracking copy events on code snippets and content');

export type TrackCopyEvent = z.infer<typeof trackCopySchema>;

/**
 * Click tracking event schema
 */
export const trackClickSchema = z
  .object({
    category: contentCategorySchema.describe('Content category where click occurred'),
    slug: contentSlugSchema.describe('Content identifier where click occurred'),
    target: z
      .enum(['external', 'internal', 'download', 'github', 'docs'])
      .describe('Type of link target clicked'),
    url: z.string().url().optional().describe('Optional destination URL of the click'),
    timestamp: timestampDate.describe('Event occurrence timestamp'),
    userId: z.string().uuid().optional().describe('Optional UUID of user who clicked'),
    sessionId: z.string().optional().describe('Optional session identifier for tracking'),
  })
  .describe('Schema for tracking click events on links and interactive elements');

export type TrackClickEvent = z.infer<typeof trackClickSchema>;

/**
 * Search event schema
 */
export const trackSearchSchema = z
  .object({
    query: nonEmptyString
      .max(200, 'Search query is too long')
      .transform((val) => val.trim())
      .describe('Search query string (max 200 chars, trimmed)'),
    category: z
      .enum(['all', 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides'])
      .optional()
      .describe('Optional search category filter'),
    resultsCount: nonNegativeInt.optional().describe('Optional count of search results returned'),
    clickedResult: z.string().optional().describe('Optional identifier of clicked search result'),
    timestamp: timestampDate.describe('Event occurrence timestamp'),
    userId: z.string().uuid().optional().describe('Optional UUID of searching user'),
    sessionId: z.string().optional().describe('Optional session identifier for tracking'),
  })
  .describe('Schema for tracking search queries and result interactions');

export type TrackSearchEvent = z.infer<typeof trackSearchSchema>;

/**
 * Page view event schema
 */
export const pageViewSchema = z
  .object({
    pathname: nonEmptyString
      .max(500, 'Pathname is too long')
      .describe('URL pathname of viewed page (max 500 chars)'),
    title: z.string().max(200).optional().describe('Optional page title (max 200 chars)'),
    referrer: z.string().url().optional().describe('Optional URL of referring page'),
    timestamp: timestampDate.describe('Event occurrence timestamp'),
    userId: z.string().uuid().optional().describe('Optional UUID of viewing user'),
    sessionId: z.string().optional().describe('Optional session identifier for tracking'),
    viewport: z
      .object({
        width: z.number().int().positive().describe('Viewport width in pixels'),
        height: z.number().int().positive().describe('Viewport height in pixels'),
      })
      .optional()
      .describe('Optional browser viewport dimensions'),
    screenResolution: z
      .object({
        width: z.number().int().positive().describe('Screen width in pixels'),
        height: z.number().int().positive().describe('Screen height in pixels'),
      })
      .optional()
      .describe('Optional device screen resolution'),
  })
  .describe('Schema for tracking page view events with viewport and device context');

export type PageViewEvent = z.infer<typeof pageViewSchema>;

/**
 * Error tracking event schema
 */
export const trackErrorSchema = z
  .object({
    message: nonEmptyString
      .max(1000, 'Message is too long')
      .describe('Error message text (max 1000 chars)'),
    stack: z.string().max(5000).optional().describe('Optional error stack trace (max 5000 chars)'),
    category: z
      .enum(['client', 'server', 'api', 'validation', 'network'])
      .describe('Error category classification'),
    severity: errorSeverity.describe('Error severity level'),
    pathname: z.string().optional().describe('Optional pathname where error occurred'),
    timestamp: timestampDate.describe('Event occurrence timestamp'),
    userId: z.string().uuid().optional().describe('Optional UUID of affected user'),
    sessionId: z.string().optional().describe('Optional session identifier for tracking'),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe('Optional additional error metadata'),
  })
  .describe('Schema for tracking error events with context and severity classification');

export type TrackErrorEvent = z.infer<typeof trackErrorSchema>;

/**
 * Web Vitals metrics schema
 */
export const webVitalsMetricsSchema = z
  .object({
    pathname: nonEmptyString
      .max(500, 'Pathname is too long')
      .describe('URL pathname where metrics collected (max 500 chars)'),
    ttfb: optionalWebVitalMetric.describe('Time to First Byte in milliseconds'),
    fcp: optionalWebVitalMetric.describe('First Contentful Paint in milliseconds'),
    lcp: optionalWebVitalMetric.describe('Largest Contentful Paint in milliseconds'),
    fid: optionalWebVitalMetric.describe('First Input Delay in milliseconds'),
    cls: clsMetric.optional().describe('Cumulative Layout Shift score (min 0)'),
    tbt: optionalWebVitalMetric.describe('Total Blocking Time in milliseconds'),
    tti: optionalWebVitalMetric.describe('Time to Interactive in milliseconds'),
    timestamp: timestampDate.describe('Event occurrence timestamp'),
    userId: z.string().uuid().optional().describe('Optional UUID of user session'),
    sessionId: z.string().optional().describe('Optional session identifier for tracking'),
  })
  .describe('Schema for tracking Core Web Vitals performance metrics');

export type WebVitalsMetrics = z.infer<typeof webVitalsMetricsSchema>;

/**
 * Umami analytics event data schema
 * Strict validation for production analytics tracking
 */
export const umamiEventDataSchema = z
  .record(
    nonEmptyString.max(50).describe('Event property key (max 50 chars)'),
    z
      .union([z.string().max(500), z.number(), z.boolean(), z.null()])
      .describe('Event property value (string max 500 chars, number, boolean, or null)')
  )
  .describe('Record of event properties for Umami analytics tracking');

export type UmamiEventData = z.infer<typeof umamiEventDataSchema>;

/**
 * Umami payload schema for pageview and custom events
 */
export const umamiPayloadSchema = z
  .object({
    hostname: z.string().optional().describe('Optional hostname of the site'),
    language: z.string().optional().describe('Optional user language preference'),
    referrer: z.string().optional().describe('Optional referring URL'),
    screen: z.string().optional().describe('Optional screen dimensions string'),
    title: z.string().optional().describe('Optional page title'),
    url: z.string().optional().describe('Optional page URL'),
    website: z.string().optional().describe('Optional website identifier'),
    name: z.string().optional().describe('Optional custom event name'),
    data: umamiEventDataSchema.optional().describe('Optional custom event data'),
  })
  .describe('Payload schema for Umami pageview and custom event tracking');

export type UmamiPayload = z.infer<typeof umamiPayloadSchema>;

/**
 * Umami track event schema
 */
export const umamiTrackEventSchema = z
  .object({
    eventName: nonEmptyString.max(50).describe('Event name for tracking (max 50 chars)'),
    data: umamiEventDataSchema.optional().describe('Optional event properties and metadata'),
  })
  .describe('Schema for Umami custom event tracking with name and data');

export type UmamiTrackEvent = z.infer<typeof umamiTrackEventSchema>;

/**
 * Umami identify schema
 */
export const umamiIdentifySchema = z
  .object({
    userId: shortString.optional().describe('Optional user identifier for session association'),
    data: umamiEventDataSchema.describe('User traits and properties for identification'),
  })
  .describe('Schema for Umami user identification with traits');

export type UmamiIdentify = z.infer<typeof umamiIdentifySchema>;

/**
 * Umami Global Interface Schema
 * Represents the global umami tracking object
 */
export const umamiGlobalSchema = z
  .object({
    track: z
      .custom<(eventName: string, data?: Record<string, string | number | boolean | null>) => void>(
        (val) => typeof val === 'function',
        { message: 'Expected a track function' }
      )
      .describe('Function to track custom events'),
    identify: z
      .custom<(data: Record<string, string | number | boolean | null>) => void>(
        (val) => typeof val === 'function',
        { message: 'Expected an identify function' }
      )
      .describe('Function to identify users with traits'),
  })
  .describe('Schema for global Umami tracking interface with track and identify methods');

export type UmamiGlobal = z.infer<typeof umamiGlobalSchema>;

/**
 * Custom event schema for flexible tracking
 */
export const customEventSchema = z
  .object({
    name: shortString
      .regex(/^[a-zA-Z0-9_-]+$/, 'Event name contains invalid characters')
      .describe('Event name with alphanumeric, underscore, and hyphen characters'),
    category: z.string().max(50).optional().describe('Optional event category (max 50 chars)'),
    action: z.string().max(50).optional().describe('Optional event action (max 50 chars)'),
    label: z.string().max(200).optional().describe('Optional event label (max 200 chars)'),
    value: z.number().optional().describe('Optional numeric value associated with event'),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe('Optional additional event metadata'),
    timestamp: timestampDate.describe('Event occurrence timestamp'),
    userId: z.string().uuid().optional().describe('Optional UUID of user who triggered event'),
    sessionId: z.string().optional().describe('Optional session identifier for tracking'),
  })
  .describe('Schema for flexible custom event tracking with category, action, and label');

export type CustomEvent = z.infer<typeof customEventSchema>;

/**
 * Analytics response schema
 */
export const analyticsResponseSchema = z
  .object({
    success: z.boolean().describe('Whether the analytics operation succeeded'),
    message: z.string().optional().describe('Optional status or error message'),
    viewCount: viewCount.optional().describe('Optional view count result'),
    data: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe('Optional additional response data'),
  })
  .describe('Schema for analytics API response with success status and optional data');

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
export const trackingEventSchema = z
  .object({
    eventName: nonEmptyString
      .max(TRACKER_LIMITS.MAX_EVENT_NAME_LENGTH)
      .regex(EVENT_NAME_PATTERN, 'Invalid event name format')
      .describe(
        'Event name starting with letter, containing alphanumeric, underscores, and hyphens (max 100 chars)'
      ),
    payload: z
      .record(
        z.string().describe('Event property key'),
        z
          .union([
            z
              .string()
              .max(TRACKER_LIMITS.MAX_STRING_VALUE_LENGTH)
              .describe('String value (max 500 chars)'),
            z.number().finite().describe('Finite numeric value'),
            z.boolean().describe('Boolean value'),
          ])
          .describe('Event property value')
      )
      .optional()
      .default({})
      .describe('Optional event payload with properties (max 20 properties)'),
    timestamp: timestampMillis.describe('Event occurrence timestamp in milliseconds'),
  })
  .describe('Schema for generic tracking events with flexible payload structure');

export type TrackingEvent = z.infer<typeof trackingEventSchema>;

/**
 * User identification schema for session tracking
 */
export const userIdentificationSchema = z
  .object({
    userId: userIdSchema.describe('Validated user identifier'),
    traits: z
      .record(
        z.string().max(50, 'Field is too long').describe('User trait key (max 50 chars)'),
        z
          .union([
            z
              .string()
              .max(TRACKER_LIMITS.MAX_STRING_VALUE_LENGTH)
              .describe('String trait value (max 500 chars)'),
            z.number().finite().describe('Numeric trait value'),
            z.boolean().describe('Boolean trait value'),
            z.date().describe('Date trait value'),
          ])
          .describe('User trait value')
      )
      .refine(
        (traits) => Object.keys(traits).length <= TRACKER_LIMITS.MAX_TRAITS_COUNT,
        `Maximum ${TRACKER_LIMITS.MAX_TRAITS_COUNT} traits allowed`
      )
      .optional()
      .default({})
      .describe('Optional user traits and properties (max 10 traits)'),
  })
  .describe('Schema for user identification with traits for session tracking');

export type UserIdentification = z.infer<typeof userIdentificationSchema>;

/**
 * Performance metric schema for tracking operation timings
 */
export const performanceMetricSchema = z
  .object({
    eventName: eventName.describe('Performance event name'),
    metric: metricName.describe('Metric name identifier'),
    duration_ms: longDurationMs.describe('Operation duration in milliseconds'),
    success: z.boolean().describe('Whether the operation succeeded'),
    error_type: errorType.optional().describe('Optional error type if operation failed'),
    metadata: metricMetadataSchema.describe('Additional metric metadata and context'),
    timestamp: timestampMillis.describe('Event occurrence timestamp in milliseconds'),
  })
  .describe('Schema for tracking performance metrics and operation timings');

export type PerformanceMetric = z.infer<typeof performanceMetricSchema>;

/**
 * Error tracking schema with security considerations
 */
export const errorTrackingSchema = z
  .object({
    error_type: errorType.describe('Error type classification'),
    error_message: nonEmptyString
      .max(1000)
      .transform((val) => val.replace(/\b(?:password|token|key|secret)\b[^,\s]*/gi, '[REDACTED]'))
      .describe('Error message with sensitive data redacted (max 1000 chars)'),
    context: z
      .string()
      .max(TRACKER_LIMITS.MAX_CONTEXT_LENGTH)
      .optional()
      .describe('Optional error context (max 200 chars)'),
    page: z
      .string()
      .max(500)
      .optional()
      .describe('Optional page where error occurred (max 500 chars)'),
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
      .optional()
      .describe('Optional stack trace with paths redacted (max 5000 chars)'),
    timestamp: timestampMillis.describe('Event occurrence timestamp in milliseconds'),
  })
  .describe('Schema for error tracking with security-focused data sanitization');

export type ErrorTracking = z.infer<typeof errorTrackingSchema>;

/**
 * Interaction event schema for user actions
 */
export const interactionEventSchema = z
  .object({
    action: z
      .enum(['click', 'hover', 'focus', 'blur', 'copy', 'paste', 'share', 'download'])
      .describe('Type of user interaction action'),
    target: nonEmptyString
      .max(200)
      .describe('Interaction target element or identifier (max 200 chars)'),
    category: z
      .string()
      .max(50)
      .optional()
      .describe('Optional interaction category (max 50 chars)'),
    slug: z
      .string()
      .max(200)
      .optional()
      .describe('Optional content slug where interaction occurred (max 200 chars)'),
    method: z
      .string()
      .max(50)
      .optional()
      .describe('Optional interaction method or mechanism (max 50 chars)'),
    value: z
      .union([z.string().max(500), z.number().finite(), z.boolean()])
      .optional()
      .describe('Optional interaction value (string max 500 chars, number, or boolean)'),
    timestamp: timestampMillis.describe('Event occurrence timestamp in milliseconds'),
  })
  .describe('Schema for tracking user interaction events like clicks, hovers, and copies');

export type InteractionEvent = z.infer<typeof interactionEventSchema>;

/**
 * Navigation event schema for tracking user flow
 */
export const navigationEventSchema = z
  .object({
    action: z
      .enum([
        'page_view',
        'tab_switch',
        'filter_toggle',
        'sort_change',
        'pagination',
        'search',
        'menu_open',
        'menu_close',
      ])
      .describe('Type of navigation action'),
    from: z
      .string()
      .max(500)
      .optional()
      .describe('Optional navigation source location (max 500 chars)'),
    to: z
      .string()
      .max(500)
      .optional()
      .describe('Optional navigation destination location (max 500 chars)'),
    page: z
      .string()
      .max(500)
      .optional()
      .describe('Optional current page identifier (max 500 chars)'),
    filter_name: shortString.optional().describe('Optional name of filter being toggled'),
    filter_state: z.boolean().optional().describe('Optional filter state (enabled/disabled)'),
    sort_field: z
      .string()
      .max(50)
      .optional()
      .describe('Optional field being sorted (max 50 chars)'),
    sort_direction: z
      .enum(['asc', 'desc'])
      .optional()
      .describe('Optional sort direction (ascending or descending)'),
    search_query: z
      .string()
      .max(200)
      .optional()
      .describe('Optional search query text (max 200 chars)'),
    timestamp: timestampMillis.describe('Event occurrence timestamp in milliseconds'),
  })
  .describe('Schema for tracking navigation events and user flow through the application');

export type NavigationEvent = z.infer<typeof navigationEventSchema>;

/**
 * Google Analytics gtag event schema
 */
export const gtagEventSchema = z
  .object({
    command: z.literal('event').describe('Google Analytics command type (must be "event")'),
    action: shortString.describe('Event action name'),
    parameters: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe('Optional event parameters'),
  })
  .describe('Schema for Google Analytics gtag event tracking');

export type GtagEvent = z.infer<typeof gtagEventSchema>;

// Global interface declarations for Umami are handled in global.d.ts
// This file focuses on data validation schemas only

/**
 * Export all schemas for centralized access
 */
