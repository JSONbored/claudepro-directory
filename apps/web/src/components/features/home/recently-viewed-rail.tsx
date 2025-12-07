'use client';

import { type Database } from '@heyclaude/database-types';
import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { usePulse, useRecentlyViewed, getCategoryRoute } from '@heyclaude/web-runtime/hooks';
import { ArrowRight, Trash } from '@heyclaude/web-runtime/icons';
import { cn, ConfigCard, Button, Skeleton } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { memo, useMemo, useEffect, useState } from 'react';

import { fetchRecentlyViewedItems } from '@/src/actions/fetch-recently-viewed-items';

const MAX_RAIL_ITEMS = 6;

export const RecentlyViewedRail = memo(function RecentlyViewedRail() {
  const { recentlyViewed, isLoaded, clearAll } = useRecentlyViewed();
  const router = useRouter();
  const pulse = usePulse();
  const [enrichedItems, setEnrichedItems] = useState<
    Database['public']['CompositeTypes']['enriched_content_item'][]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full item data for recently viewed items
  useEffect(() => {
    if (!isLoaded || recentlyViewed.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchEnrichedData = async () => {
      setIsLoading(true);
      try {
        const itemsToFetch = recentlyViewed.slice(0, MAX_RAIL_ITEMS);
        // Call server action to fetch full item data
        const enrichedItems = await fetchRecentlyViewedItems(itemsToFetch);
        setEnrichedItems(enrichedItems);
      } catch (error) {
        logUnhandledPromise('RecentlyViewedRail: Failed to fetch enriched data', error, {
          count: recentlyViewed.length,
        });
        setEnrichedItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrichedData();
  }, [isLoaded, recentlyViewed]);

  const railItems = enrichedItems;
  const latestEntry = recentlyViewed[0];
  const resumeSearchHref = useMemo(() => {
    if (!latestEntry) return '/search';
    const params = new URLSearchParams();
    if (latestEntry.category) {
      // Use plural route form for search category filter
      params.set('category', getCategoryRoute(latestEntry.category));
    }
    if (latestEntry.tags && latestEntry.tags.length > 0) {
      params.set('tags', latestEntry.tags.slice(0, 5).join(','));
    }
    return params.toString() ? `/search?${params.toString()}` : '/search';
  }, [latestEntry]);

  // Guard SSR + empty states to avoid hydration mismatches
  if (!isLoaded || (railItems.length === 0 && !isLoading)) {
    return null;
  }

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <section
        aria-labelledby="recently-viewed-rail-heading"
        className="container mx-auto space-y-6 px-4 py-8"
      >
        <div className="border-border/60 bg-card/60 mx-auto max-w-7xl space-y-6 rounded-2xl border p-4 shadow-md backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">Keep exploring</p>
              <h2 id="recently-viewed-rail-heading" className="text-2xl font-semibold">
                Recently viewed
              </h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} size="lg" className="h-48 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const handleResumeSearch = () => {
    router.push(resumeSearchHref);
    if (!latestEntry) return;
    // Use plural route form for analytics category
    const category = getCategoryRoute(
      latestEntry.category
    ) as Database['public']['Enums']['content_category'];
    pulse
      .click({
        category,
        slug: `recently-viewed:resume:${category}`,
        metadata: {
          source: 'recently_viewed_rail',
          hasTags: Boolean(latestEntry.tags && latestEntry.tags.length > 0),
        },
      })
      .catch((error) => {
        logUnhandledPromise('RecentlyViewedRail: resume search pulse failed', error, {
          category,
          slug: latestEntry.slug,
        });
      });
  };

  const handleClearHistory = () => {
    clearAll();
    // Use plural route form for analytics category
    const category = latestEntry
      ? (getCategoryRoute(latestEntry.category) as Database['public']['Enums']['content_category'])
      : ('agents' as Database['public']['Enums']['content_category']);
    pulse
      .filter({
        category,
        filters: {},
        metadata: {
          action: 'clear_recently_viewed',
          source: 'recently_viewed_rail',
          clearedCount: recentlyViewed.length,
        },
      })
      .catch((error) => {
        logUnhandledPromise('RecentlyViewedRail: clear history pulse failed', error, {
          category,
          count: recentlyViewed.length,
        });
      });
  };

  return (
    <section
      aria-labelledby="recently-viewed-rail-heading"
      className="container mx-auto space-y-6 px-4 py-8"
    >
      <div className="border-border/60 bg-card/60 mx-auto max-w-7xl space-y-6 rounded-2xl border p-4 shadow-md backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Keep exploring</p>
            <h2 id="recently-viewed-rail-heading" className="text-2xl font-semibold">
              Recently viewed
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-sm"
              onClick={handleResumeSearch}
              aria-label="Resume your last search"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              Resume search
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-sm"
              onClick={handleClearHistory}
              aria-label="Clear recently viewed history"
            >
              <Trash className="text-destructive h-4 w-4" aria-hidden="true" />
              Clear history
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'grid gap-4',
            railItems.length >= 3 && 'md:grid-cols-2 xl:grid-cols-3',
            railItems.length < 3 && 'md:grid-cols-2'
          )}
        >
          {railItems.map((item) => (
            <ConfigCard
              key={`${item.category}-${item.slug}`}
              item={item}
              showCategory
              showActions
              enableSwipeGestures={false}
              useViewTransitions
            />
          ))}
        </div>
      </div>
    </section>
  );
});
