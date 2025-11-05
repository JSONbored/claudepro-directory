'use client';

/**
 * Unified Tracker - Database-First Architecture
 * Tracks views and page views via server actions. Data stored in user_interactions table.
 */

import { useEffect } from 'react';
import { trackInteraction } from '@/src/lib/actions/analytics.actions';
import { trackEvent } from '@/src/lib/analytics/tracker';
import type { CategoryId } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';

export type UnifiedTrackerProps =
  | {
      variant: 'view';
      category: CategoryId;
      slug: string;
      delay?: number;
    }
  | {
      variant: 'page-view';
      category: CategoryId;
      slug: string;
      sourcePage?: string;
      delay?: number;
    };

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
            logger.warn('Analytics tracking failed', {
              source: 'UnifiedTracker',
              error: String(error),
            });
          });
        }
      } catch (error) {
        logger.warn('Analytics tracking failed', {
          source: 'UnifiedTracker',
          error: String(error),
        });
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        const result = trackingFn();
        if (result instanceof Promise) {
          result.catch((error) => {
            logger.warn('Analytics tracking failed', {
              source: 'UnifiedTracker',
              error: String(error),
            });
          });
        }
      } catch (error) {
        logger.warn('Analytics tracking failed', {
          source: 'UnifiedTracker',
          error: String(error),
        });
      }
    }, delay);

    return () => clearTimeout(timer);
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps provided by caller
  }, deps);
}

export function UnifiedTracker(props: UnifiedTrackerProps) {
  if (props.variant === 'view') {
    return <ViewVariant {...props} />;
  }

  return <PageViewVariant {...props} />;
}

function ViewVariant({
  category,
  slug,
  delay = 1000,
}: Extract<UnifiedTrackerProps, { variant: 'view' }>) {
  useTrackingEffect(
    () => {
      return trackInteraction({
        interaction_type: 'view',
        content_type: category,
        content_slug: slug,
      }).catch(() => {
        // Intentional
      });
    },
    delay,
    [category, slug]
  );

  return null;
}

function PageViewVariant({
  category,
  slug,
  sourcePage,
  delay = 0,
}: Extract<UnifiedTrackerProps, { variant: 'page-view' }>) {
  useTrackingEffect(
    () => {
      trackEvent('content_viewed', {
        category,
        slug,
        page: typeof window !== 'undefined' ? window.location.pathname : `/${category}/${slug}`,
        source: sourcePage || 'direct',
      });
      return Promise.resolve();
    },
    delay,
    [category, slug, sourcePage]
  );

  return null;
}
