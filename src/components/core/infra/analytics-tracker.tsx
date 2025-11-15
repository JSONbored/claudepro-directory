'use client';

/**
 * Unified Tracker - Database-First Architecture
 * Tracks views and page views via server actions. Data stored in user_interactions table.
 */

import { useEffect, useState } from 'react';
import { getPollingConfig } from '@/src/lib/actions/feature-flags.actions';
import type { CategoryId } from '@/src/lib/data/config/category';
import { trackInteraction } from '@/src/lib/edge/client';
import { logger } from '@/src/lib/logger';
import { logClientWarning, logUnhandledPromise } from '@/src/lib/utils/error.utils';

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

function ViewVariant({ category, slug, delay }: Extract<UnifiedTrackerProps, { variant: 'view' }>) {
  const [actualDelay, setActualDelay] = useState(delay ?? 1000);

  useEffect(() => {
    if (delay === undefined) {
      getPollingConfig()
        .then((config) => {
          setActualDelay(config['polling.realtime_ms']);
        })
        .catch((error) => {
          logClientWarning('UnifiedTracker: failed to load polling config', error);
        });
    }
  }, [delay]);
  useTrackingEffect(
    () => {
      return trackInteraction({
        interaction_type: 'view',
        content_type: category,
        content_slug: slug,
      }).catch((error) => {
        logUnhandledPromise('UnifiedTracker:view', error, { category, slug });
      });
    },
    actualDelay,
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
      return trackInteraction({
        interaction_type: 'view',
        content_type: category,
        content_slug: slug,
        metadata: {
          page: typeof window !== 'undefined' ? window.location.pathname : `/${category}/${slug}`,
          source: sourcePage || 'direct',
        },
      }).catch((error) => {
        logUnhandledPromise('UnifiedTracker:page-view', error, {
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
