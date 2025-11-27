'use client';

/**
 * Pulse Component - Unified Declarative Tracking
 *
 * Consolidated tracking component that replaces UnifiedTracker and PwaInstallTracker.
 * Tracks views, page views, and PWA events via server actions.
 * Data stored in user_interactions table via pulse queue-based system.
 *
 * Variants:
 * - view: Content view tracking (with configurable delay)
 * - page-view: Page view tracking (immediate)
 * - pwa-install: PWA installation event (listens to DOM events)
 * - pwa-launch: PWA standalone launch (checks on mount)
 *
 * Architecture:
 * - Auto-tracking on mount with configurable delay
 * - Uses trackInteraction() from edge/client (queue-based)
 * - Uses static polling config for delay values
 *
 * @module components/infra/pulse
 */

import type { Database } from '@heyclaude/database-types';
import { getPollingConfig } from '@heyclaude/web-runtime/config/static-configs';
import {
  logger,
  logUnhandledPromise,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { trackInteraction } from '@heyclaude/web-runtime/client';
import { useEffect, useState } from 'react';

export type PulseProps =
  | {
      variant: 'view';
      category: Database['public']['Enums']['content_category'];
      slug: string;
      delay?: number;
      metadata?: Record<string, unknown>;
    }
  | {
      variant: 'page-view';
      category: Database['public']['Enums']['content_category'];
      slug: string;
      sourcePage?: string;
      delay?: number;
    }
  | {
      variant: 'pwa-install';
    }
  | {
      variant: 'pwa-launch';
    };

/**
 * Custom hook for tracking effects with delay support
 * Handles both immediate (delay=0) and delayed tracking
 */
function useTrackingEffect(
  trackingFn: () => undefined | Promise<unknown>,
  delay: number,
  deps: React.DependencyList
) {
  useEffect(() => {
    if (delay === 0) {
      try {
        const result = trackingFn();
        if (result instanceof Promise) {
          result.catch((error) => {
            const normalized = normalizeError(error, 'Analytics tracking failed');
            logger.warn('Analytics tracking failed', {
              source: 'Pulse',
              error: normalized.message,
            });
          });
        }
      } catch (error) {
        const normalized = normalizeError(error, 'Analytics tracking failed');
        logger.warn('Analytics tracking failed', {
          source: 'Pulse',
          error: normalized.message,
        });
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        const result = trackingFn();
        if (result instanceof Promise) {
          result.catch((error) => {
            const normalized = normalizeError(error, 'Analytics tracking failed');
            logger.warn('Analytics tracking failed', {
              source: 'Pulse',
              error: normalized.message,
            });
          });
        }
      } catch (error) {
        const normalized = normalizeError(error, 'Analytics tracking failed');
        logger.warn('Analytics tracking failed', {
          source: 'Pulse',
          error: normalized.message,
        });
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps provided by caller
  }, deps);
}

/**
 * Main Pulse component - routes to appropriate variant
 */
export function Pulse(props: PulseProps) {
  if (props.variant === 'view') {
    return <ViewVariant {...props} />;
  }

  if (props.variant === 'page-view') {
    return <PageViewVariant {...props} />;
  }

  if (props.variant === 'pwa-install') {
    return <PwaInstallVariant />;
  }

  if (props.variant === 'pwa-launch') {
    return <PwaLaunchVariant />;
  }

  return null;
}

/**
 * View variant - tracks content views with configurable delay
 * Uses static polling config if delay not provided
 */
function ViewVariant({
  category,
  slug,
  delay,
  metadata,
}: Extract<PulseProps, { variant: 'view' }>) {
  const [actualDelay, setActualDelay] = useState(delay ?? 1000);

  useEffect(() => {
    if (delay === undefined) {
      // Get polling config from static defaults
      const config = getPollingConfig();
      setActualDelay(config['polling.realtime_ms']);
    }
  }, [delay]);

  useTrackingEffect(
    () => {
      return trackInteraction({
        interaction_type: 'view',
        content_type: category,
        content_slug: slug,
        metadata: metadata ?? null,
      }).catch((error) => {
        logUnhandledPromise('Pulse:view', error, { category, slug });
      });
    },
    actualDelay,
    [category, slug, metadata]
  );

  return null;
}

/**
 * Page view variant - tracks page views (immediate by default)
 */
function PageViewVariant({
  category,
  slug,
  sourcePage,
  delay = 0,
}: Extract<PulseProps, { variant: 'page-view' }>) {
  useTrackingEffect(
    () => {
      return trackInteraction({
        interaction_type: 'view',
        content_type: category,
        content_slug: slug,
        metadata: {
          page: typeof window !== 'undefined' ? window.location.pathname : `/${category}/${slug}`,
          source: sourcePage || 'direct',
        },
      }).catch((error) => {
        logUnhandledPromise('Pulse:page-view', error, {
          category,
          slug,
          source: sourcePage || 'direct',
        });
      });
    },
    delay,
    [category, slug, sourcePage]
  );

  return null;
}

/**
 * PWA install variant - listens for PWA installation events
 * Listens to 'pwa-installed' DOM event dispatched by service-worker-init.js
 */
function PwaInstallVariant() {
  useEffect(() => {
    const handleInstalled = () => {
      trackInteraction({
        content_type: null,
        content_slug: null,
        interaction_type: 'pwa_installed',
        metadata: {
          platform: navigator.platform || 'unknown',
          timestamp: new Date().toISOString(),
        },
      }).catch((error) => {
        logUnhandledPromise('Pulse:pwa-install', error);
      });
    };

    // Listen for PWA events dispatched by service-worker-init.js
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  return null;
}

/**
 * PWA launch variant - tracks when app is opened in standalone mode
 * Checks on mount if app is in standalone mode (launched from home screen)
 */
function PwaLaunchVariant() {
  useEffect(() => {
    const handleStandaloneLaunch = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        trackInteraction({
          content_type: null,
          content_slug: null,
          interaction_type: 'pwa_launched',
          metadata: {
            platform: navigator.platform || 'unknown',
            timestamp: new Date().toISOString(),
          },
        }).catch((error) => {
          logUnhandledPromise('Pulse:pwa-launch', error);
        });
      }
    };

    // Check standalone mode on mount
    handleStandaloneLaunch();
  }, []);

  return null;
}
