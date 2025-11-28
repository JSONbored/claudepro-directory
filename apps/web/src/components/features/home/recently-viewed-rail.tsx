'use client';

import type { Database } from '@heyclaude/database-types';
import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { ArrowRight, Trash } from '@heyclaude/web-runtime/icons';
import type { HomepageContentItem } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { memo, useMemo } from 'react';
import { ConfigCard } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { useRecentlyViewed } from '@heyclaude/web-runtime/hooks';

const MAX_RAIL_ITEMS = 6;

function toHomepageContentItem(
  item: ReturnType<typeof useRecentlyViewed>['recentlyViewed'][number]
): HomepageContentItem {
  const category = (item.category ?? 'agents') as Database['public']['Enums']['content_category'];
  return {
    slug: item.slug,
    title: item.title,
    description: item.description,
    author: '',
    tags: item.tags ?? [],
    source: 'recently_viewed',
    created_at: item.viewedAt,
    date_added: item.viewedAt,
    category,
    view_count: 0,
    copy_count: 0,
    featured: false,
  };
}

export const RecentlyViewedRail = memo(function RecentlyViewedRail() {
  const { recentlyViewed, isLoaded, clearAll } = useRecentlyViewed();
  const router = useRouter();
  const pulse = usePulse();
  const railItems = useMemo(
    () => recentlyViewed.slice(0, MAX_RAIL_ITEMS).map((item) => toHomepageContentItem(item)),
    [recentlyViewed]
  );
  const latestEntry = recentlyViewed[0];
  const resumeSearchHref = useMemo(() => {
    if (!latestEntry) return '/search';
    const params = new URLSearchParams();
    if (latestEntry.category) {
      params.set('category', latestEntry.category);
    }
    if (latestEntry.tags && latestEntry.tags.length > 0) {
      params.set('tags', latestEntry.tags.slice(0, 5).join(','));
    }
    return params.toString() ? `/search?${params.toString()}` : '/search';
  }, [latestEntry]);

  // Guard SSR + empty states to avoid hydration mismatches
  if (!isLoaded || railItems.length === 0) {
    return null;
  }

  const handleResumeSearch = () => {
    router.push(resumeSearchHref);
    if (!latestEntry) return;
    const category = (latestEntry.category ??
      'agents') as Database['public']['Enums']['content_category'];
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
    const category = (latestEntry?.category ??
      'agents') as Database['public']['Enums']['content_category'];
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
      <div className="mx-auto max-w-7xl space-y-6 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-md backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Keep exploring</p>
            <h2 id="recently-viewed-rail-heading" className="font-semibold text-2xl">
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
              <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
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
              showCategory={true}
              showActions={true}
              enableSwipeGestures={false}
              useViewTransitions={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
