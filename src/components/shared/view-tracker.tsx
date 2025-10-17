'use client';

import { useEffect } from 'react';
import { trackView } from '#lib/actions/track-view';
import type { ViewTrackerProps } from '@/src/lib/schemas/component.schema';

export function ViewTracker({ category, slug }: ViewTrackerProps) {
  useEffect(() => {
    // Track view after a short delay to ensure the page has loaded
    const timer = setTimeout(() => {
      trackView({ category, slug }).catch(() => {
        // Silently fail in client component - errors are handled server-side
        // No client-side logging to prevent browser console exposure
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [category, slug]);

  return null;
}
