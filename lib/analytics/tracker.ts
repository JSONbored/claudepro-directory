/**
 * Universal Analytics Tracker
 * Provides a simple, consistent API for tracking events across the application
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import type { errorInputSchema } from '@/lib/schemas';
import {
  env,
  errorTrackingSchema,
  interactionEventSchema,
  isDevelopment,
  isProduction,
  navigationEventSchema,
  performanceMetricSchema,
  trackingEventSchema,
  userIdentificationSchema,
} from '@/lib/schemas';
import { EVENT_CONFIG, type EventName, type EventPayload } from './events.config';
import { isUmamiAvailable } from './umami';

// Environment checks using validated env schema
const IS_PRODUCTION = isProduction;
const IS_DEVELOPMENT = isDevelopment;
const ENABLE_DEBUG = env.NEXT_PUBLIC_DEBUG_ANALYTICS === 'true';

/**
 * Universal tracking function that all components can use
 * Provides automatic validation, sampling, and error handling
 */
export function trackEvent<T extends EventName>(eventName: T, payload?: EventPayload<T>): void {
  const config = EVENT_CONFIG[eventName];

  // Check if event is enabled
  if (!config?.enabled) {
    if (ENABLE_DEBUG) {
      logger.debug('[Analytics] Event disabled:', { eventName });
    }
    return;
  }

  // Check if event is debug-only and we're in production
  if (config.debugOnly && IS_PRODUCTION) {
    return;
  }

  // Apply sampling if configured
  if (config.sampleRate && config.sampleRate < 1) {
    if (Math.random() > config.sampleRate) {
      if (ENABLE_DEBUG) {
        logger.debug('[Analytics] Event sampled out:', {
          eventName,
          sampleRate: config.sampleRate,
        });
      }
      return;
    }
  }

  // Track the event
  try {
    if (isUmamiAvailable()) {
      // Production tracking with Umami
      window.umami?.track(eventName, sanitizePayload(payload) || {});
    } else if (IS_DEVELOPMENT && ENABLE_DEBUG) {
      // Development logging
      logger.debug('[Analytics Dev]', {
        event: eventName,
        payload: JSON.stringify(payload),
        category: config.category,
        description: config.description,
      });
    }
  } catch (error) {
    logger.error('[Analytics Error]', error as Error, { eventName });
  }
}

/**
 * Simplified tracking function for components
 * No need to import event names or types
 */
export function track(
  eventName: string,
  payload?: Record<string, string | number | boolean>
): void {
  try {
    // Validate event name and payload
    const validated = trackingEventSchema.parse({
      eventName,
      payload: payload || {},
      timestamp: Date.now(),
    });

    // This allows components to track events without importing types
    // But loses type safety - use trackEvent when possible
    if (isUmamiAvailable()) {
      window.umami?.track(validated.eventName, sanitizePayload(validated.payload) || {});
    } else if (IS_DEVELOPMENT && ENABLE_DEBUG) {
      logger.debug('[Analytics]', {
        eventName: validated.eventName,
        payload: JSON.stringify(validated.payload),
      });
    }
  } catch (error) {
    if (ENABLE_DEBUG) {
      logger.error('[Analytics Validation Error]', error as Error, { eventName });
    }
  }
}

/**
 * Track page views (automatically called by Next.js)
 */
export function trackPageView(url: string, _referrer?: string): void {
  if (isUmamiAvailable()) {
    window.umami?.track('pageview', { url });
  }
}

/**
 * Track user identification (for session tracking)
 */
export function identify(userId: string, traits?: Record<string, string | number | boolean>): void {
  try {
    // Validate user identification
    const validated = userIdentificationSchema.parse({
      userId,
      traits: traits || {},
    });

    if (isUmamiAvailable()) {
      window.umami?.identify({
        userId: validated.userId,
        ...(sanitizePayload(validated.traits) || {}),
      });
    }
  } catch (error) {
    if (ENABLE_DEBUG) {
      logger.error('[Analytics Identify Error]', error as Error, { userId });
    }
  }
}

/**
 * Sanitize payload to remove PII and ensure data safety
 */
function sanitizePayload(
  payload?: Record<string, unknown>
): Record<string, string | number | boolean> | null {
  if (!payload) return {};

  // Define PII detection schema
  const PII_KEYWORDS = ['email', 'name', 'phone', 'address', 'ssn', 'credit', 'password'];
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // Schema for validating and sanitizing payload values
  const payloadSchema = z.record(
    z.string(),
    z.union([
      z
        .string()
        .max(500)
        .transform((val) => val.replace(emailPattern, '[email]')),
      z.number(),
      z.boolean(),
      z
        .array(z.union([z.string(), z.number(), z.boolean()]))
        .transform((val) => val.slice(0, 10).join(',').substring(0, 500)),
    ])
  );

  try {
    // First validate the entire payload structure
    const validatedPayload = payloadSchema.parse(payload);
    const sanitized: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(validatedPayload)) {
      // Check for PII keywords
      const lowerKey = key.toLowerCase();
      if (PII_KEYWORDS.some((keyword) => lowerKey.includes(keyword))) {
        continue;
      }

      // Value is already validated by the schema
      sanitized[key] = value;
    }

    return sanitized;
  } catch {
    // If sanitization fails, return empty object to prevent tracking
    return {};
  }
}

/**
 * Performance monitoring helper
 */
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  eventName: string,
  metadata?: Record<string, string | number | boolean>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await operation();
    const duration = Math.round(performance.now() - start);

    // Validate performance metric
    const validated = performanceMetricSchema.parse({
      eventName: 'performance_metric',
      metric: eventName,
      duration_ms: duration,
      success: true,
      metadata: metadata || {},
      timestamp: Date.now(),
    });

    track('performance_metric', {
      metric: validated.metric,
      duration_ms: validated.duration_ms,
      success: validated.success,
      ...validated.metadata,
    });

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);

    // Validate performance metric for error case
    const validated = performanceMetricSchema.parse({
      eventName: 'performance_metric',
      metric: eventName,
      duration_ms: duration,
      success: false,
      error_type: error instanceof Error ? error.name : 'unknown',
      metadata: metadata || {},
      timestamp: Date.now(),
    });

    const trackData: Record<string, string | number | boolean> = {
      metric: validated.metric,
      duration_ms: validated.duration_ms,
      success: validated.success,
      ...validated.metadata,
    };
    if (validated.error_type) {
      trackData.error_type = validated.error_type;
    }
    track('performance_metric', trackData);

    throw error;
  }
}

/**
 * Error tracking helper
 */
export function trackError(error: z.infer<typeof errorInputSchema>, context?: string): void {
  try {
    // Validate error tracking data
    const validated = errorTrackingSchema.parse({
      error_type: error instanceof Error ? error.name : 'unknown',
      error_message: error instanceof Error ? error.message.substring(0, 200) : 'unknown',
      context: context || 'unknown',
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      stack_trace: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      timestamp: Date.now(),
    });

    const errorTrackData: Record<string, string | number | boolean> = {
      error_type: validated.error_type,
      error_message: validated.error_message,
    };
    if (validated.page) {
      errorTrackData.page = validated.page;
    }
    if (validated.context) {
      errorTrackData.context = validated.context;
    }
    track('error_occurred', errorTrackData);
  } catch (validationError) {
    if (ENABLE_DEBUG) {
      logger.error('[Analytics Error Tracking Failed]', validationError as Error);
    }
  }
}

/**
 * Interaction tracking helpers
 */
export const interactions = {
  copyCode: (category: string, slug: string) => {
    try {
      const validated = interactionEventSchema.parse({
        action: 'copy',
        target: 'code',
        category,
        slug,
        timestamp: Date.now(),
      });
      const copyData: Record<string, string | number | boolean> = {};
      if (validated.category) copyData.content_category = validated.category;
      if (validated.slug) copyData.content_slug = validated.slug;
      track('copy_code', copyData);
    } catch (error) {
      if (ENABLE_DEBUG) {
        logger.error('[Analytics Copy Code Error]', error as Error);
      }
    }
  },

  share: (method: string, contentSlug: string) => {
    try {
      const validated = interactionEventSchema.parse({
        action: 'share',
        target: contentSlug,
        method,
        timestamp: Date.now(),
      });
      track('share_content', {
        share_method: validated.method || method,
        content_slug: validated.target,
      });
    } catch (error) {
      if (ENABLE_DEBUG) {
        logger.error('[Analytics Share Error]', error as Error);
      }
    }
  },

  feedback: (type: 'helpful' | 'not_helpful', page: string) => {
    try {
      const validated = z
        .object({
          feedback_type: z.enum(['helpful', 'not_helpful']),
          page: z.string().max(200),
        })
        .parse({
          feedback_type: type,
          page,
        });
      track('feedback_submitted', validated);
    } catch (error) {
      if (ENABLE_DEBUG) {
        logger.error('[Analytics Feedback Error]', error as Error);
      }
    }
  },
};

/**
 * Navigation tracking helpers
 */
export const navigation = {
  tabSwitch: (from: string, to: string) => {
    try {
      const validated = navigationEventSchema.parse({
        action: 'tab_switch',
        from,
        to,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        timestamp: Date.now(),
      });
      const tabData: Record<string, string | number | boolean> = {
        page: validated.page || '/',
      };
      if (validated.from) tabData.from_tab = validated.from;
      if (validated.to) tabData.to_tab = validated.to;
      track('tab_switched', tabData);
    } catch (error) {
      if (ENABLE_DEBUG) {
        logger.error('[Analytics Tab Switch Error]', error as Error);
      }
    }
  },

  filterToggle: (filterName: string, state: boolean) => {
    try {
      const validated = navigationEventSchema.parse({
        action: 'filter_toggle',
        filter_name: filterName,
        filter_state: state,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        timestamp: Date.now(),
      });
      track('filter_toggled', {
        filter_name: validated.filter_name || filterName,
        filter_state: validated.filter_state !== undefined ? validated.filter_state : state,
        page: validated.page || '/',
      });
    } catch (error) {
      if (ENABLE_DEBUG) {
        logger.error('[Analytics Filter Toggle Error]', error as Error);
      }
    }
  },

  sortChange: (field: string, direction: 'asc' | 'desc') => {
    try {
      const validated = z
        .object({
          sort_field: z.string().max(50),
          sort_direction: z.enum(['asc', 'desc']),
          page: z.string().max(200),
        })
        .parse({
          sort_field: field,
          sort_direction: direction,
          page: typeof window !== 'undefined' ? window.location.pathname : '/',
        });
      track('sort_changed', validated);
    } catch (error) {
      if (ENABLE_DEBUG) {
        logger.error('[Analytics Sort Change Error]', error as Error);
      }
    }
  },
};
