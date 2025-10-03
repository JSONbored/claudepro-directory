/**
 * Universal Analytics Tracker
 * Provides a simple, consistent API for tracking events across the application
 */

import { logger } from '@/src/lib/logger';
import { env, isDevelopment, isProduction } from '@/src/lib/schemas/env.schema';
import { EVENT_CONFIG, type EventName, type EventPayload } from './events.config';
import { isUmamiAvailable } from './umami';

// Environment checks using validated env schema
const IS_PRODUCTION = isProduction;
const IS_DEVELOPMENT = isDevelopment;
const ENABLE_DEBUG = env.NEXT_PUBLIC_DEBUG_ANALYTICS === 'true';

/**
 * Basic payload sanitization to remove PII
 * Simplified version - only filters out obvious PII keywords
 */
function sanitizePayload(
  payload?: Record<string, unknown>
): Record<string, string | number | boolean> {
  if (!payload) return {};

  const PII_KEYWORDS = ['email', 'name', 'phone', 'address', 'ssn', 'credit', 'password'];
  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(payload)) {
    // Skip PII keywords
    const lowerKey = key.toLowerCase();
    if (PII_KEYWORDS.some((keyword) => lowerKey.includes(keyword))) {
      continue;
    }

    // Only allow primitive values
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

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
