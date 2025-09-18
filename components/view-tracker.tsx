'use client';

import { useEffect } from 'react';
import { trackView } from '@/app/actions/track-view';

interface ViewTrackerProps {
  category: string;
  slug: string;
}

export function ViewTracker({ category, slug }: ViewTrackerProps) {
  useEffect(() => {
    // Track view after a short delay to ensure the page has loaded
    const timer = setTimeout(() => {
      trackView(category, slug).catch(console.error);
    }, 1000);

    return () => clearTimeout(timer);
  }, [category, slug]);

  return null;
}
