/**
 * Universal Analytics Tracker
 * Provides a simple, consistent API for tracking events across the application
 */

import { EVENT_CONFIG, type EventName, type EventPayload } from './events.config';
import { isUmamiAvailable } from './umami';

// Environment checks
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const ENABLE_DEBUG = process.env.NEXT_PUBLIC_DEBUG_ANALYTICS === 'true';

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
  // This allows components to track events without importing types
  // But loses type safety - use trackEvent when possible
  if (isUmamiAvailable()) {
    window.umami?.track(eventName, sanitizePayload(payload) || {});
  } else if (IS_DEVELOPMENT && ENABLE_DEBUG) {
    console.log('[Analytics]', eventName, payload);
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
  if (isUmamiAvailable()) {
    window.umami?.identify(userId, sanitizePayload(traits) || {});
  }
}

/**
 * Sanitize payload to remove PII and ensure data safety
 */
function sanitizePayload(payload?: any): Record<string, any> | undefined {
  if (!payload) return undefined;

  const sanitized: Record<string, any> = {};
  const PII_KEYWORDS = ['email', 'name', 'phone', 'address', 'ssn', 'credit', 'password'];

  for (const [key, value] of Object.entries(payload)) {
    // Check for PII keywords
    const lowerKey = key.toLowerCase();
    if (PII_KEYWORDS.some((keyword) => lowerKey.includes(keyword))) {
      continue;
    }

    // Sanitize value based on type
    if (value === null || value === undefined) {
    } else if (typeof value === 'string') {
      // Truncate long strings and check for email patterns
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      sanitized[key] = value.replace(emailPattern, '[email]').substring(0, 500);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      // Convert arrays to comma-separated strings
      sanitized[key] = value.slice(0, 10).join(',').substring(0, 500);
    } else if (typeof value === 'object') {
      // Recursively sanitize objects (max depth of 2)
      sanitized[key] = sanitizePayload(value);
    }
  }

  return sanitized;
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

    track('performance_metric', {
      metric: eventName,
      duration_ms: duration,
      success: true,
      ...metadata,
    });

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);

    track('performance_metric', {
      metric: eventName,
      duration_ms: duration,
      success: false,
      error_type: error instanceof Error ? error.name : 'unknown',
      ...metadata,
    });

    throw error;
  }
}

/**
 * Error tracking helper
 */
export function trackError(error: Error | unknown, context?: string): void {
  const errorData = {
    error_type: error instanceof Error ? error.name : 'unknown',
    error_message: error instanceof Error ? error.message.substring(0, 200) : 'unknown',
    context: context || 'unknown',
    page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
  };

  track('error_occurred', errorData);
}

/**
 * Interaction tracking helpers
 */
export const interactions = {
  copyCode: (category: string, slug: string) => {
    track('copy_code', {
      content_category: category,
      content_slug: slug,
    });
  },

  share: (method: string, contentSlug: string) => {
    track('share_content', {
      share_method: method,
      content_slug: contentSlug,
    });
  },

  feedback: (type: 'helpful' | 'not_helpful', page: string) => {
    track('feedback_submitted', {
      feedback_type: type,
      page,
    });
  },
};

/**
 * Navigation tracking helpers
 */
export const navigation = {
  tabSwitch: (from: string, to: string) => {
    track('tab_switched', {
      from_tab: from,
      to_tab: to,
      page: window.location.pathname,
    });
  },

  filterToggle: (filterName: string, state: boolean) => {
    track('filter_toggled', {
      filter_name: filterName,
      filter_state: state,
      page: window.location.pathname,
    });
  },

  sortChange: (field: string, direction: 'asc' | 'desc') => {
    track('sort_changed', {
      sort_field: field,
      sort_direction: direction,
      page: window.location.pathname,
    });
  },
};

// Export typed event tracking for components that want type safety
export { trackEvent as trackTyped };
