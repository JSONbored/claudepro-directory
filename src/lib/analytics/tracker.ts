/**
 * Universal Analytics Tracker
 * Database-driven event tracking with runtime configuration
 *
 * **Database-First Architecture:**
 * - Event configuration loaded from analytics_events table
 * - No hardcoded event definitions - database is source of truth
 * - Event names are plain strings (no EVENTS const needed)
 * - Full autocomplete via Umami dashboard, not TypeScript
 *
 * @module lib/analytics/tracker
 */

import { isDevelopment, isProduction } from '@/src/lib/env-client';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import { isUmamiAvailable } from './umami';

/**
 * Event configuration from database
 */
interface EventConfig {
  description: string;
  category: string;
  enabled: boolean;
  sampleRate?: number | null;
  debugOnly?: boolean;
}

// Environment checks using client-safe helpers
const IS_PRODUCTION = isProduction;
const IS_DEVELOPMENT = isDevelopment;

// Fallback for ENABLE_DEBUG (loaded from app_settings at runtime)
const ENABLE_DEBUG_FALLBACK = process.env.NEXT_PUBLIC_DEBUG_ANALYTICS === 'true';

/**
 * Cache for event config (loaded from database)
 */
let _eventConfigCache: Record<string, EventConfig> | null = null;
let _configFetchPromise: Promise<Record<string, EventConfig>> | null = null;

/**
 * Runtime app_settings cache (debug flag, PII keywords)
 */
let _debugEnabled: boolean = ENABLE_DEBUG_FALLBACK;
let _piiKeywords: string[] = ['email', 'name', 'phone', 'address', 'ssn', 'credit', 'password'];
let _appSettingsLoaded = false;

/**
 * Load app_settings for analytics (debug flag, PII keywords)
 * Runs once on first trackEvent call
 */
async function loadAppSettings(): Promise<void> {
  if (_appSettingsLoaded) return;

  try {
    const supabase = createClient();
    const { data } = await supabase.rpc('get_app_settings', {
      p_category: 'analytics',
    });

    if (data) {
      const settings = data as Record<string, { value: unknown }>;

      // Load debug flag
      if (settings['analytics.debug_enabled']?.value !== undefined) {
        _debugEnabled = Boolean(settings['analytics.debug_enabled'].value);
      }

      // Load PII keywords array
      if (Array.isArray(settings['analytics.pii_keywords']?.value)) {
        _piiKeywords = settings['analytics.pii_keywords'].value as string[];
      }
    }

    _appSettingsLoaded = true;
  } catch (error) {
    logger.warn('App settings load failed, using defaults', {
      source: 'AnalyticsTracker',
      error: String(error),
    });
    _appSettingsLoaded = true;
  }
}

/**
 * Fetch event configurations from database
 * Queries analytics_events table for runtime configuration
 */
async function fetchEventConfig(): Promise<Record<string, EventConfig>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('analytics_events')
    .select('event_name, description, category, enabled, sample_rate, debug_only');

  const config: Record<string, EventConfig> = {};
  for (const event of data || []) {
    config[event.event_name] = {
      description: event.description,
      category: event.category,
      enabled: event.enabled,
      sampleRate: event.sample_rate,
      debugOnly: event.debug_only,
    };
  }
  return config;
}

/**
 * Build default event config (fallback if DB unavailable)
 * Enables all events by default for graceful degradation
 */
function buildDefaultConfig(eventName: string): EventConfig {
  return {
    description: eventName.replace(/_/g, ' '),
    category: 'INTERACTION',
    enabled: true,
    sampleRate: null,
    debugOnly: false,
  };
}

/**
 * Get event configuration with caching
 * Returns cached config if available, otherwise returns default and fetches in background
 */
function getEventConfig(eventName: string): EventConfig {
  // Return cached config if available
  if (_eventConfigCache && _eventConfigCache[eventName]) {
    return _eventConfigCache[eventName];
  }

  // Start fetch if not already in progress
  if (!_configFetchPromise) {
    _configFetchPromise = fetchEventConfig()
      .then((config) => {
        _eventConfigCache = config;
        return config;
      })
      .catch((error) => {
        logger.warn('Event config fetch failed, using defaults', {
          source: 'AnalyticsTracker',
          error: String(error),
        });
        _eventConfigCache = {};
        return {};
      });
  }

  // Return default config immediately while DB fetch completes
  return buildDefaultConfig(eventName);
}

/**
 * Payload sanitization with typed data support
 * Database-First: PII keywords loaded from app_settings
 *
 * Preserves numbers, booleans, and dates (Umami best practices)
 * Removes PII and converts Date objects to ISO strings
 *
 * @see https://umami.is/docs/track-events - "For numeric values, dates, or booleans, the JavaScript method is recommended"
 */
function sanitizePayload(
  payload?: Record<string, unknown>
): Record<string, string | number | boolean | null> {
  if (!payload) return {};

  const sanitized: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(payload)) {
    // Skip PII keywords (loaded from app_settings)
    const lowerKey = key.toLowerCase();
    if (_piiKeywords.some((keyword) => lowerKey.includes(keyword))) {
      continue;
    }

    // Preserve typed values (Umami best practice)
    if (typeof value === 'string') {
      sanitized[key] = value;
    } else if (typeof value === 'number') {
      // Preserve numbers for numeric comparisons in dashboard
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      // Preserve booleans for filtering
      sanitized[key] = value;
    } else if (value instanceof Date) {
      // Convert Date to ISO string
      sanitized[key] = value.toISOString();
    }
    // Ignore other types (objects, arrays, null, undefined)
  }

  return sanitized;
}

/**
 * Universal tracking function that all components can use
 * Provides automatic validation, sampling, and error handling
 * Database-First: Loads debug flag and PII keywords from app_settings
 *
 * @param eventName - Event name (e.g., 'content_viewed', 'code_copied')
 * @param payload - Event payload with custom properties
 */
export function trackEvent(eventName: string, payload?: Record<string, unknown>): void {
  // Load app_settings on first call (background, non-blocking)
  if (!_appSettingsLoaded) {
    loadAppSettings().catch((error) => {
      logger.warn('Background app settings load failed', {
        source: 'AnalyticsTracker',
        error: String(error),
      });
    });
  }

  // Check config
  const config = getEventConfig(eventName);

  // Check if event is enabled
  if (!config?.enabled) {
    if (_debugEnabled) {
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
      if (_debugEnabled) {
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
      const sanitizedPayload = sanitizePayload(payload);
      window.umami?.track(eventName, sanitizedPayload);

      if (_debugEnabled) {
        logger.debug('[Analytics] Tracked:', {
          event: eventName,
          payload: JSON.stringify(sanitizedPayload),
        });
      }
    } else if (IS_DEVELOPMENT && _debugEnabled) {
      // Development logging
      logger.debug('[Analytics Dev]', {
        event: eventName,
        payload: JSON.stringify(payload),
      });
    }
  } catch (error) {
    logger.error('[Analytics Error]', error as Error, { eventName });
  }
}
