/**
 * Umami Analytics utilities for event tracking
 * Production-grade implementation with Zod validation for hostile environments
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import type {
  CarouselNavigationEvent,
  RelatedContentClickEvent,
  RelatedContentImpressionEvent,
  RelatedContentViewEvent,
} from '@/lib/related-content/service';
import { isDevelopment, type UmamiEventData, umamiEventDataSchema } from '@/lib/schemas';

/**
 * Security constants for analytics validation
 */
const ANALYTICS_LIMITS = {
  MAX_EVENT_NAME_LENGTH: 100,
  MAX_STRING_VALUE_LENGTH: 500,
  MAX_PROPERTIES_COUNT: 20,
  MAX_QUEUE_SIZE: 100,
  MAX_METADATA_KEYS: 10,
} as const;

/**
 * Event name validation pattern - only allow safe characters
 */
const EVENT_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,99}$/;

/**
 * Safe property key validation pattern - prevent injection
 */
const PROPERTY_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,49}$/;

/**
 * PII detection patterns for enhanced security
 */
const PII_PATTERNS = [
  /email/i,
  /name/i,
  /phone/i,
  /address/i,
  /ssn/i,
  /credit/i,
  /card/i,
  /passport/i,
  /license/i,
] as const;

/**
 * Event name validation schema
 */
const eventNameSchema = z
  .string()
  .min(1, 'Event name is required')
  .max(ANALYTICS_LIMITS.MAX_EVENT_NAME_LENGTH, 'Event name too long')
  .regex(EVENT_NAME_PATTERN, 'Invalid event name format');

/**
 * Analytics property value validation
 */
const analyticsPropertyValueSchema = z.union([
  z.string().max(ANALYTICS_LIMITS.MAX_STRING_VALUE_LENGTH),
  z.number().finite(),
  z.boolean(),
]);

/**
 * Analytics data validation schema
 */
const analyticsDataSchema = z
  .record(
    z.string().regex(PROPERTY_KEY_PATTERN, 'Invalid property key'),
    analyticsPropertyValueSchema
  )
  .refine(
    (data) => Object.keys(data).length <= ANALYTICS_LIMITS.MAX_PROPERTIES_COUNT,
    `Maximum ${ANALYTICS_LIMITS.MAX_PROPERTIES_COUNT} properties allowed`
  );

/**
 * Performance metric validation schema
 */
const performanceMetricSchema = z.object({
  metric: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{0,49}$/),
  value: z.number().finite().min(0),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Error tracking validation schema
 */
const errorTrackingSchema = z.object({
  error_type: z.string().min(1).max(100),
  error_code: z.string().max(100).optional(),
  context: z.string().max(200).optional(),
});

/**
 * Journey tracking validation schema
 */
const journeyTrackingSchema = z.object({
  from_page: z.string().min(1).max(200),
  to_page: z.string().min(1).max(200),
  journey_step: z.number().int().min(1).max(1000),
});

/**
 * Algorithm performance validation schema
 */
const algorithmPerformanceSchema = z.object({
  algorithm_version: z.string().min(1).max(50),
  match_score: z.number().min(0).max(1),
  user_clicked: z.boolean(),
  position: z.number().int().min(0).max(1000),
});

/**
 * Cache performance validation schema
 */
const cachePerformanceSchema = z.object({
  cache_hit: z.boolean(),
  latency_ms: z.number().min(0).max(300000), // 5 minutes max
  cache_key: z.string().max(50).optional(),
});

/**
 * Safe event data validation helper
 */
function validateEventData(data: unknown): Record<string, string | number | boolean> | null {
  try {
    if (!data || typeof data !== 'object') {
      return {};
    }

    return analyticsDataSchema.parse(data);
  } catch (error) {
    logger.error('[Analytics Validation Error]', new Error('Validation failed'), {
      error: error instanceof z.ZodError ? JSON.stringify(error.issues) : String(error),
      dataType: typeof data,
    });
    return null;
  }
}

/**
 * Safe event name validation helper
 */
function validateEventName(name: unknown): string | null {
  try {
    return eventNameSchema.parse(name);
  } catch (error) {
    logger.error(
      'Analytics Event Name Validation Error',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        name: typeof name === 'string' ? name.slice(0, 50) : String(name).slice(0, 50),
      }
    );
    return null;
  }
}

// Check if we're in a browser environment and Umami is loaded
export const isUmamiAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.umami !== 'undefined';
};

// Safe wrapper for Umami tracking with production-grade validation
export const trackEvent = (eventName: string, data?: UmamiEventData): void => {
  if (!isUmamiAvailable()) {
    if (isDevelopment) {
      logger.debug('Umami Debug - tracking unavailable', {
        eventName: typeof eventName === 'string' ? eventName : String(eventName),
        hasData: !!data,
      });
    }
    return;
  }

  try {
    // Validate event name
    const validatedEventName = validateEventName(eventName);
    if (!validatedEventName) {
      logger.warn('Analytics: Invalid event name, skipping', {
        eventName: typeof eventName === 'string' ? eventName.slice(0, 50) : String(eventName),
      });
      return;
    }

    // Validate and sanitize data to ensure no PII
    const sanitizedData = data ? sanitizeEventData(data) : {};
    if (sanitizedData === null) {
      logger.warn('Analytics: Data validation failed, tracking without data', {
        eventName: validatedEventName,
      });
      window.umami?.track(validatedEventName, {});
      return;
    }

    window.umami?.track(validatedEventName, sanitizedData);
  } catch (error) {
    logger.error(
      'Umami tracking error',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof Error ? error.message : String(error),
        eventName: typeof eventName === 'string' ? eventName.slice(0, 50) : 'invalid',
      }
    );
  }
};

// Production-grade event data sanitization with Zod validation
const sanitizeEventData = (
  data: UmamiEventData
): Record<string, string | number | boolean> | null => {
  try {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(data)) {
      // Enhanced PII detection using patterns
      const keyLower = key.toLowerCase();
      const containsPII = PII_PATTERNS.some((pattern) => pattern.test(keyLower));

      if (containsPII) {
        logger.warn('Analytics: Skipping potential PII field', {
          field: key.slice(0, 20),
        });
        continue;
      }

      // Validate property key format
      if (!PROPERTY_KEY_PATTERN.test(key)) {
        logger.warn('Analytics: Invalid property key format', {
          key: key.slice(0, 30),
        });
        continue;
      }

      // Validate and sanitize value using schema
      try {
        const validatedValue = analyticsPropertyValueSchema.parse(value);
        sanitized[key] = validatedValue;
      } catch (error) {
        logger.warn('Analytics: Invalid property value', {
          key: key.slice(0, 20),
          valueType: typeof value,
          error:
            error instanceof z.ZodError
              ? error.issues[0]?.message || 'Validation failed'
              : String(error),
        });
      }
    }

    // Final validation of the complete object
    return validateEventData(sanitized);
  } catch (error) {
    logger.error(
      'Analytics sanitization error',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        dataType: typeof data,
      }
    );
    return null;
  }
};

// Specific event tracking functions
export const trackRelatedContentView = (event: Partial<RelatedContentViewEvent>): void => {
  trackEvent('related_content_view', event as UmamiEventData);
};

export const trackRelatedContentClick = (event: Partial<RelatedContentClickEvent>): void => {
  trackEvent('related_content_click', event as UmamiEventData);
};

export const trackCarouselNavigation = (event: Partial<CarouselNavigationEvent>): void => {
  trackEvent('carousel_navigation', event as UmamiEventData);
};

export const trackRelatedContentImpression = (
  event: Partial<RelatedContentImpressionEvent>
): void => {
  trackEvent('related_content_impression', event as UmamiEventData);
};

// Performance tracking with validation
export const trackPerformance = (
  metricName: string,
  value: number,
  metadata?: Record<string, unknown>
): void => {
  try {
    const rawData = {
      metric: metricName,
      value,
      ...(metadata || {}),
    };
    const data = umamiEventDataSchema.parse(rawData);
    const validatedData = performanceMetricSchema.parse(data);

    // Create clean data object without undefined values for Umami
    const eventData: UmamiEventData = {
      metric: validatedData.metric,
      value: validatedData.value,
    };
    if (validatedData.metadata) {
      Object.entries(validatedData.metadata).forEach(([key, val]) => {
        if (val !== undefined) {
          eventData[key] = val;
        }
      });
    }
    trackEvent('performance_metric', eventData);
  } catch (error) {
    logger.error(
      'Analytics: Performance tracking validation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        metricName: String(metricName).slice(0, 30),
        value: Number(value),
      }
    );
  }
};

// Error tracking with validation (non-sensitive)
export const trackError = (errorType: string, errorCode?: string, context?: string): void => {
  try {
    const validatedData = errorTrackingSchema.parse({
      error_type: errorType,
      error_code: errorCode || 'unknown',
      context: context || 'unknown',
    });
    // Create clean data object without undefined values
    const eventData: UmamiEventData = {
      error_type: validatedData.error_type,
    };
    if (validatedData.error_code) {
      eventData.error_code = validatedData.error_code;
    }
    if (validatedData.context) {
      eventData.context = validatedData.context;
    }
    trackEvent('error_occurred', eventData);
  } catch (error) {
    logger.error(
      'Analytics: Error tracking validation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        errorType: String(errorType).slice(0, 30),
        errorCode: String(errorCode || '').slice(0, 20),
        context: String(context || '').slice(0, 50),
      }
    );
  }
};

// User journey tracking with validation
export const trackJourney = (from: string, to: string, step: number): void => {
  try {
    const validatedData = journeyTrackingSchema.parse({
      from_page: from,
      to_page: to,
      journey_step: step,
    });
    trackEvent('content_journey', validatedData);
  } catch (error) {
    logger.error(
      'Analytics: Journey tracking validation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        from: String(from).slice(0, 30),
        to: String(to).slice(0, 30),
        step: Number(step),
      }
    );
  }
};

// Algorithm performance tracking with validation
export const trackAlgorithmPerformance = (
  algorithm: string,
  score: number,
  clicked: boolean,
  position?: number
): void => {
  try {
    const validatedData = algorithmPerformanceSchema.parse({
      algorithm_version: algorithm,
      match_score: score,
      user_clicked: clicked,
      position: position || 0,
    });
    trackEvent('algorithm_performance', validatedData);
  } catch (error) {
    logger.error(
      'Analytics: Algorithm performance tracking validation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        algorithm,
        score,
        clicked,
        position: position ?? 0,
      }
    );
  }
};

// Cache performance tracking with validation
export const trackCachePerformance = (hit: boolean, latency: number, key?: string): void => {
  try {
    const validatedData = cachePerformanceSchema.parse({
      cache_hit: hit,
      latency_ms: latency,
      cache_key: key?.substring(0, 50) || 'unknown', // Truncate for privacy
    });
    // Create clean data object without undefined values
    const eventData: UmamiEventData = {
      cache_hit: validatedData.cache_hit,
      latency_ms: validatedData.latency_ms,
    };
    if (validatedData.cache_key) {
      eventData.cache_key = validatedData.cache_key;
    }
    trackEvent('cache_performance', eventData);
  } catch (error) {
    logger.error(
      'Analytics: Cache performance tracking validation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        hit,
        latency,
        keyLength: key?.length || 0,
      }
    );
  }
};

// Utility to measure and track timing
export const measureTiming = async <T>(
  operation: () => Promise<T>,
  eventName: string,
  metadata?: UmamiEventData
): Promise<T> => {
  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = Math.round(performance.now() - startTime);

    trackEvent(eventName, {
      duration_ms: duration,
      success: true,
      ...metadata,
    });

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    trackEvent(eventName, {
      duration_ms: duration,
      success: false,
      ...metadata,
    });

    throw error;
  }
};

/**
 * Batch event validation schema
 */
const batchEventSchema = z.object({
  name: eventNameSchema,
  data: analyticsDataSchema.optional(),
});

/**
 * Event queue validation schema
 */
const eventQueueSchema = z.array(batchEventSchema).max(ANALYTICS_LIMITS.MAX_QUEUE_SIZE);

// Batch event tracking for better performance with validation
let eventQueue: Array<{ name: string; data?: Record<string, string | number | boolean> }> = [];
let flushTimeout: NodeJS.Timeout | null = null;

export const trackEventBatched = (eventName: string, data?: UmamiEventData): void => {
  try {
    // Validate event before adding to queue
    const validatedEventName = validateEventName(eventName);
    if (!validatedEventName) {
      logger.warn('Analytics: Invalid batched event name, skipping', {
        eventName: String(eventName).slice(0, 30),
      });
      return;
    }

    const sanitizedData = data ? sanitizeEventData(data) : undefined;

    // Validate event structure
    const validatedEvent = batchEventSchema.parse({
      name: validatedEventName,
      data: sanitizedData || undefined,
    });

    // Only add to queue if event has valid name
    if (validatedEvent.data !== undefined) {
      eventQueue.push({ name: validatedEvent.name, data: validatedEvent.data });
    } else {
      eventQueue.push({ name: validatedEvent.name });
    }

    // Clear existing timeout
    if (flushTimeout) {
      clearTimeout(flushTimeout);
    }

    // Set new timeout to flush after 1 second of inactivity
    flushTimeout = setTimeout(() => {
      flushEventQueue();
    }, 1000);

    // Flush immediately if queue is large
    if (eventQueue.length >= 10) {
      flushEventQueue();
    }
  } catch (error) {
    logger.error(
      'Analytics: Batched event validation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        eventName,
        dataType: typeof data,
      }
    );
  }
};

const flushEventQueue = (): void => {
  if (eventQueue.length === 0) return;

  try {
    // Validate entire queue before processing
    const validatedQueue = eventQueueSchema.parse(eventQueue);
    const events = [...validatedQueue];
    eventQueue = [];

    events.forEach(({ name, data }) => {
      trackEvent(name, data);
    });
  } catch (error) {
    logger.error(
      'Analytics: Queue validation failed during flush',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        queueLength: eventQueue.length,
      }
    );
    // Clear invalid queue to prevent corruption
    eventQueue = [];
  }
};

// Flush events on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushEventQueue();
  });
}
