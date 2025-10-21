/**
 * Universal Analytics Tracker
 * Provides a simple, consistent API for tracking events across the application
 */

import { isDevelopment, isProduction } from '@/src/lib/env-client';
import { logger } from '@/src/lib/logger';
import type { EventName, EventPayload, EventPayloads } from './events.constants';
import { getEventConfig } from './events.constants';
import { isUmamiAvailable } from './umami';

// Environment checks using client-safe helpers
const IS_PRODUCTION = isProduction;
const IS_DEVELOPMENT = isDevelopment;
const ENABLE_DEBUG = process.env.NEXT_PUBLIC_DEBUG_ANALYTICS === 'true';
const FALLBACK_EVENT_NAME = 'unknown-event';

type NormalizedPayload = Record<string, string | number | boolean>;

/**
 * Normalize event name according to Umami best practices (lowercase kebab-case)
 */
export function normalizeEventName(eventName: string): string {
  if (!eventName) return FALLBACK_EVENT_NAME;

  const withHyphenatedUppercase = eventName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // CamelCase → camel-Case
    .replace(/[_\s]+/g, '-') // underscores/spaces → hyphen
    .replace(/-+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  const trimmed = withHyphenatedUppercase.replace(/^-+|-+$/g, '');

  return trimmed || FALLBACK_EVENT_NAME;
}

function toCamelCase(key: string): string {
  if (!key) return '';
  return key
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment, index) => {
      const lower = segment.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/**
 * Normalize payload keys (camelCase) and trim string values
 */
export function normalizePayloadKeys(payload: NormalizedPayload): NormalizedPayload {
  const normalized: NormalizedPayload = {};

  for (const [key, value] of Object.entries(payload)) {
    const normalizedKey = toCamelCase(key);
    if (!normalizedKey) continue;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) continue;
      normalized[normalizedKey] = trimmed;
    } else {
      normalized[normalizedKey] = value;
    }
  }

  return normalized;
}

function getNormalizedPayload(payload?: Record<string, unknown>): NormalizedPayload | undefined {
  const sanitized = sanitizePayload(payload);
  const normalized = normalizePayloadKeys(sanitized);
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function isEventDisabled(eventName: EventName, normalizedEventName: string): boolean {
  const env = process.env.NEXT_PUBLIC_ANALYTICS_DISABLED_EVENTS;
  if (!env) return false;

  const values = env
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (values.length === 0) {
    return false;
  }

  const comparisons = new Set(values.map((value) => normalizeEventName(value)));

  return comparisons.has(normalizeEventName(eventName)) || comparisons.has(normalizedEventName);
}

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
export function trackEvent<T extends EventName>(
  eventName: T,
  payload?: T extends keyof EventPayloads ? EventPayload<T> : Record<string, unknown>
): void {
  const config = getEventConfig()[eventName];

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

  const normalizedEventName = normalizeEventName(eventName);

  if (isEventDisabled(eventName, normalizedEventName)) {
    if (ENABLE_DEBUG) {
      logger.debug('[Analytics] Event disabled via env override:', { eventName });
    }
    return;
  }

  const normalizedPayload = getNormalizedPayload(payload);

  // Track the event
  try {
    if (isUmamiAvailable()) {
      if (normalizedPayload) {
        window.umami?.track(normalizedEventName, normalizedPayload);
      } else {
        window.umami?.track(normalizedEventName);
      }
    } else if (IS_DEVELOPMENT && ENABLE_DEBUG) {
      // Development logging - convert payload to string for logger compatibility
      const debugInfo = {
        event: normalizedEventName,
        category: config.category,
        description: config.description,
        ...(normalizedPayload && { payload: JSON.stringify(normalizedPayload) }),
      };
      logger.debug('[Analytics Dev]', debugInfo);
    }
  } catch (error) {
    logger.error('[Analytics Error]', error as Error, { eventName });
  }
}
