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
import {
  useRecentlyViewed,
  type RecentlyViewedCategory,
} from '@/src/hooks/use-recently-viewed';

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
    // Track view on mount
    addRecentlyViewed({
      category,
      slug,
      title,
      description,
      ...(tags && tags.length > 0 ? { tags } : {}),
    });
    // Only run once on mount (don't track on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This component renders nothing (pure side-effect)
  return null;
}
