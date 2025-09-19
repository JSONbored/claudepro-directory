'use client';

import { useEffect } from 'react';
import { trackView } from '@/app/actions/track-view';
import { logger } from '@/lib/logger';

interface ViewTrackerProps {
  category: string;
  slug: string;
}

export function ViewTracker({ category, slug }: ViewTrackerProps) {
  useEffect(() => {
    // Track view after a short delay to ensure the page has loaded
    const timer = setTimeout(() => {
      trackView(category, slug).catch((error) => {
        logger.error(
          'Failed to track view from client component',
          error instanceof Error ? error : new Error(String(error)),
          {
            category,
            slug,
            component: 'ViewTracker',
          }
        );
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [category, slug]);

  return null;
}
