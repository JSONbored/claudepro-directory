'use client';

/**
 * PageViewTracker - Client component for tracking content detail page views
 *
 * Tracks when users view content detail pages (agents, mcp, rules, commands, hooks, statuslines)
 * Sends event to Umami analytics on component mount
 */

import { useEffect } from 'react';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { trackEvent } from '@/src/lib/analytics/tracker';

interface PageViewTrackerProps {
  category: string;
  slug: string;
  sourcePage?: string;
}

export function PageViewTracker({ category, slug, sourcePage }: PageViewTrackerProps) {
  useEffect(() => {
    // Track content view on mount (client-side only)
    trackEvent(EVENTS.CONTENT_VIEW, {
      category,
      slug,
      page: typeof window !== 'undefined' ? window.location.pathname : `/${category}/${slug}`,
      source: sourcePage || 'direct',
    });
  }, [category, slug, sourcePage]);

  // This component doesn't render anything
  return null;
}
