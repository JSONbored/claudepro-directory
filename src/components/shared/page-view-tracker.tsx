'use client';

/**
 * PageViewTracker - Client component for tracking content detail page views
 *
 * Tracks when users view content detail pages with content-type-specific events
 * for better segmentation in Umami analytics.
 *
 * Events: content_view_agent, content_view_mcp, content_view_command, etc.
 */

import { useEffect } from 'react';
import { getContentViewEvent } from '@/src/lib/analytics/event-mapper';
import { trackEvent } from '@/src/lib/analytics/tracker';

interface PageViewTrackerProps {
  category: string;
  slug: string;
  sourcePage?: string;
}

export function PageViewTracker({ category, slug, sourcePage }: PageViewTrackerProps) {
  useEffect(() => {
    // Track content view with content-type-specific event
    const eventName = getContentViewEvent(category);

    trackEvent(eventName, {
      slug,
      page: typeof window !== 'undefined' ? window.location.pathname : `/${category}/${slug}`,
      source: sourcePage || 'direct',
    });
  }, [category, slug, sourcePage]);

  // This component doesn't render anything
  return null;
}
