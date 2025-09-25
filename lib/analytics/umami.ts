/**
 * Umami Analytics utilities for event tracking
 */

import type {
  CarouselNavigationEvent,
  RelatedContentClickEvent,
  RelatedContentImpressionEvent,
  RelatedContentViewEvent,
  UmamiEventData,
} from '@/lib/related-content/types';

// Check if we're in a browser environment and Umami is loaded
export const isUmamiAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.umami !== 'undefined';
};

// Safe wrapper for Umami tracking
export const trackEvent = (eventName: string, data?: UmamiEventData): void => {
  if (!isUmamiAvailable()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Umami Debug]', eventName, data);
    }
    return;
  }

  try {
    // Sanitize data to ensure no PII
    const sanitizedData = data ? sanitizeEventData(data) : {};
    window.umami?.track(eventName, sanitizedData);
  } catch (error) {
    console.error('[Umami Error]', error);
  }
};

// Sanitize event data to remove any potential PII
const sanitizeEventData = (data: UmamiEventData): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip any keys that might contain PII
    if (
      key.toLowerCase().includes('email') ||
      key.toLowerCase().includes('name') ||
      key.toLowerCase().includes('phone') ||
      key.toLowerCase().includes('address')
    ) {
      continue;
    }

    // Ensure values are primitive types
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Truncate long strings
      if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.substring(0, 500);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
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

// Performance tracking
export const trackPerformance = (
  metricName: string,
  value: number,
  metadata?: Record<string, any>
): void => {
  trackEvent('performance_metric', {
    metric: metricName,
    value,
    ...metadata,
  });
};

// Error tracking (non-sensitive)
export const trackError = (errorType: string, errorCode?: string, context?: string): void => {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_code: errorCode || 'unknown',
    context: context || 'unknown',
  });
};

// User journey tracking
export const trackJourney = (from: string, to: string, step: number): void => {
  trackEvent('content_journey', {
    from_page: from,
    to_page: to,
    journey_step: step,
  });
};

// Algorithm performance tracking
export const trackAlgorithmPerformance = (
  algorithm: string,
  score: number,
  clicked: boolean,
  position?: number
): void => {
  trackEvent('algorithm_performance', {
    algorithm_version: algorithm,
    match_score: score,
    user_clicked: clicked,
    position: position || 0,
  });
};

// Cache performance tracking
export const trackCachePerformance = (hit: boolean, latency: number, key?: string): void => {
  trackEvent('cache_performance', {
    cache_hit: hit,
    latency_ms: latency,
    cache_key: key?.substring(0, 50) || 'unknown', // Truncate for privacy
  });
};

// Utility to measure and track timing
export const measureTiming = async <T>(
  operation: () => Promise<T>,
  eventName: string,
  metadata?: Record<string, any>
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

// Batch event tracking for better performance
let eventQueue: Array<{ name: string; data?: UmamiEventData }> = [];
let flushTimeout: NodeJS.Timeout | null = null;

export const trackEventBatched = (eventName: string, data?: UmamiEventData): void => {
  eventQueue.push({ name: eventName, ...(data && { data }) });

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
};

const flushEventQueue = (): void => {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  events.forEach(({ name, data }) => {
    trackEvent(name, data);
  });
};

// Flush events on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushEventQueue();
  });
}
