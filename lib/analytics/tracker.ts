/**
 * Universal Analytics Tracker
 * Provides a simple, consistent API for tracking events across the application
 */

import { z } from 'zod';
import {
  errorTrackingSchema,
  interactionEventSchema,
  navigationEventSchema,
  performanceMetricSchema,
  trackingEventSchema,
  userIdentificationSchema,
} from '@/lib/schemas/analytics.schema';
import { env, isDevelopment, isProduction } from '@/lib/schemas/env.schema';
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
      console.log('[Analytics] Event disabled:', eventName);
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
        console.log('[Analytics] Event sampled out:', eventName, config.sampleRate);
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
      console.log('[Analytics Dev]', {
        event: eventName,
        payload,
        category: config.category,
        description: config.description,
      });
    }
  } catch (error) {
    console.error('[Analytics Error]', eventName, error);
  }
}

/**
 * Simplified tracking function for components
 * No need to import event names or types
 */
export function track(eventName: string, payload?: Record<string, any>): void {
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
      console.log('[Analytics]', validated.eventName, validated.payload);
    }
  } catch (error) {
    if (ENABLE_DEBUG) {
      console.error('[Analytics Validation Error]', eventName, error);
    }
  }
}

/**
 * Track page views (automatically called by Next.js)
 */
export function trackPageView(_url: string, _referrer?: string): void {
  if (isUmamiAvailable()) {
    window.umami?.track();
  }
}

/**
 * Track user identification (for session tracking)
 */
export function identify(userId: string, traits?: Record<string, any>): void {
  try {
    // Validate user identification
    const validated = userIdentificationSchema.parse({
      userId,
      traits: traits || {},
    });

    if (isUmamiAvailable()) {
      window.umami?.identify(validated.userId, sanitizePayload(validated.traits) || {});
    }
  } catch (error) {
    if (ENABLE_DEBUG) {
      console.error('[Analytics Identify Error]', userId, error);
    }
  }
}

/**
 * Sanitize payload to remove PII and ensure data safety
 */
function sanitizePayload(payload?: any): Record<string, any> | undefined {
  if (!payload) return undefined;

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
      z.array(z.any()).transform((val) => val.slice(0, 10).join(',').substring(0, 500)),
      z.null(),
      z.undefined(),
    ])
  );

  try {
    // First validate the entire payload structure
    const validatedPayload = payloadSchema.parse(payload);
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(validatedPayload)) {
      // Check for PII keywords
      const lowerKey = key.toLowerCase();
      if (PII_KEYWORDS.some((keyword) => lowerKey.includes(keyword))) {
        continue;
      }

      // Value is already sanitized by the schema
      sanitized[key] = value;
    }

    return sanitized;
  } catch {
    // If sanitization fails, return undefined to prevent tracking
    return undefined;
  }
}

/**
 * Performance monitoring helper
 */
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  eventName: string,
  metadata?: Record<string, any>
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

    track('performance_metric', {
      metric: validated.metric,
      duration_ms: validated.duration_ms,
      success: validated.success,
      error_type: validated.error_type,
      ...validated.metadata,
    });

    throw error;
  }
}

/**
 * Error tracking helper
 */
export function trackError(error: Error | unknown, context?: string): void {
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

    track('error_occurred', {
      error_type: validated.error_type,
      error_message: validated.error_message,
      context: validated.context,
      page: validated.page,
    });
  } catch (validationError) {
    if (ENABLE_DEBUG) {
      console.error('[Analytics Error Tracking Failed]', validationError);
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
      track('copy_code', {
        content_category: validated.category,
        content_slug: validated.slug,
      });
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('[Analytics Copy Code Error]', error);
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
        console.error('[Analytics Share Error]', error);
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
        console.error('[Analytics Feedback Error]', error);
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
      track('tab_switched', {
        from_tab: validated.from,
        to_tab: validated.to,
        page: validated.page || '/',
      });
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error('[Analytics Tab Switch Error]', error);
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
        console.error('[Analytics Filter Toggle Error]', error);
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
        console.error('[Analytics Sort Change Error]', error);
      }
    }
  },
};

// Export typed event tracking for components that want type safety
export { trackEvent as trackTyped };
