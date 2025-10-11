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
import type { EventName } from '@/src/lib/analytics/events.config';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { trackEvent } from '@/src/lib/analytics/tracker';

interface PageViewTrackerProps {
  category: string;
  slug: string;
  sourcePage?: string;
}

/**
 * Get content-type-specific event name based on category
 */
function getContentViewEvent(category: string): EventName {
  const eventMap: Record<string, EventName> = {
    agents: EVENTS.CONTENT_VIEW_AGENT,
    mcp: EVENTS.CONTENT_VIEW_MCP,
    'mcp-servers': EVENTS.CONTENT_VIEW_MCP,
    commands: EVENTS.CONTENT_VIEW_COMMAND,
    rules: EVENTS.CONTENT_VIEW_RULE,
    hooks: EVENTS.CONTENT_VIEW_HOOK,
    statuslines: EVENTS.CONTENT_VIEW_STATUSLINE,
    collections: EVENTS.CONTENT_VIEW_COLLECTION,
  };

  return eventMap[category] || EVENTS.CONTENT_VIEW; // Fallback to legacy event
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
