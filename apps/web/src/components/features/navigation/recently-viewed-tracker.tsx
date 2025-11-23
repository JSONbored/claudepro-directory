'use client';

/**
 * Recently Viewed Tracker Component
 *
 * Client component that tracks page views for recently viewed sidebar.
 * Lightweight wrapper around useRecentlyViewed hook.
 *
 * PERFORMANCE:
 * - Only runs on client (zero SSR overhead)
 * - Single useEffect call
 * - Debounced writes via hook
 * - No re-renders (set-and-forget)
 *
 * USAGE:
 * ```tsx
 * // In Server Component
 * <RecentlyViewedTracker
 *   category="agent"
 *   slug="my-agent"
 *   title="My Agent"
 *   description="Agent description"
 *   tags={["ai", "automation"]}
 * />
 * ```
 */

import { useEffect } from 'react';
import { type RecentlyViewedCategory, useRecentlyViewed } from '@/src/hooks/use-recently-viewed';

export interface RecentlyViewedTrackerProps {
  category: RecentlyViewedCategory;
  slug: string;
  title: string;
  description: string;
  tags?: string[];
}

export function RecentlyViewedTracker({
  category,
  slug,
  title,
  description,
  tags,
}: RecentlyViewedTrackerProps) {
  const { addRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    // Track view on mount - runs when any of the content identifiers change
    // This ensures we track the correct content when navigating between pages
    addRecentlyViewed({
      category,
      slug,
      title,
      description,
      ...(tags && tags.length > 0 ? { tags } : {}),
    });
  }, [category, slug, title, description, tags, addRecentlyViewed]);

  // This component renders nothing (pure side-effect)
  return null;
}
