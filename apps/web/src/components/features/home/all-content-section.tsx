'use client';

/**
 * All Content Section - Simplified Homepage Content Display
 * 
 * Displays ALL category content across the site in optimized batches.
 * Uses Intersection Observer to only fetch when section scrolls into viewport.
 * Implements infinite scroll for progressive content loading.
 * 
 * OPTIMIZATION: Zero function calls until user scrolls to this section.
 * This eliminates unnecessary function invocations for users who don't scroll.
 */

import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { useIntersectionObserver } from '@heyclaude/web-runtime/hooks';
import { UnifiedCardGrid, ConfigCard } from '@heyclaude/web-runtime/ui';
import { getTrendingSlugs, isNewSince } from '@heyclaude/web-runtime/core';
import { logUnhandledPromise, trackHomepageSectionError } from '@heyclaude/web-runtime/core';
import { useIsMounted } from '@heyclaude/web-runtime/hooks';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { useBoolean } from '@heyclaude/web-runtime/hooks';
import { useAuthModal } from '@/src/hooks/use-auth-modal';
import { usePathname } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { cn } from '@heyclaude/web-runtime/ui';

export interface AllContentSectionProps {
  weekStart?: string;
}

export function AllContentSection({ weekStart }: AllContentSectionProps) {
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();
  const isMounted = useIsMounted();
  
  const [allConfigs, setAllConfigs] = useState<DisplayableContent[]>([]);
  const { value: isLoadingAllConfigs, setTrue: setIsLoadingAllConfigsTrue, setFalse: setIsLoadingAllConfigsFalse } = useBoolean();
  const { value: hasMoreAllConfigs, setValue: setHasMoreAllConfigs } = useBoolean(true);
  const hasTriggeredRef = useRef(false);

  const handleAuthRequired = useCallback(() => {
    openAuthModal({
      valueProposition: 'Sign in to save bookmarks',
      redirectTo: pathname ?? undefined,
    });
  }, [openAuthModal, pathname]);

  const fetchAllConfigs = useCallback(
    async (offset: number, limit = 30) => {
      if (isLoadingAllConfigs || !hasMoreAllConfigs || !isMounted()) {
        return;
      }

      setIsLoadingAllConfigsTrue();

      try {
        const { fetchPaginatedContent } = await import('@heyclaude/web-runtime/actions/content');

        const result = await fetchPaginatedContent({
          offset,
          limit,
          category: null,
        });

        if (result?.serverError) {
          // Error already logged by safe-action middleware
          trackHomepageSectionError(
            'all-content',
            'fetch-paginated-content',
            result.serverError,
            {
              offset,
              limit,
              source: 'fetchAllConfigs',
            }
          );
          throw new Error(result.serverError);
        }

        if (!isMounted()) return;

        // Safe-action returns { data: T, serverError?: ... } structure
        // fetchPaginatedContent returns DisplayableContent[] wrapped in { data: DisplayableContent[] }
        // Defensive: Ensure data is an array before using it
        const newItems: DisplayableContent[] = Array.isArray(result?.data) ? result.data : [];

        if (newItems.length < limit) {
          setHasMoreAllConfigs(false);
        }

        setAllConfigs((prev) => {
          // Deduplicate items by slug to prevent duplicate keys
          // Create a Set of existing slugs for O(1) lookup
          const existingSlugs = new Set(prev.map((item) => item.slug).filter(Boolean));
          
          // Filter out items that already exist
          const uniqueNewItems = newItems.filter((item) => {
            if (!item.slug) return true; // Keep items without slugs (shouldn't happen, but defensive)
            if (existingSlugs.has(item.slug)) {
              return false;
            }
            existingSlugs.add(item.slug);
            return true;
          });
          
          const updated = [...prev, ...uniqueNewItems];
          return updated;
        });
      } catch (error) {
        if (!isMounted()) return;
        const normalized = normalizeError(error, 'fetchAllConfigs failed');
        logClientWarn(
          '[AllContentSection] fetchAllConfigs error caught',
          normalized,
          'AllContentSection.fetchAllConfigs.error',
          {
            component: 'AllContentSection',
            action: 'fetch-all-configs-error',
            category: 'home',
            offset,
            limit,
          }
        );
        trackHomepageSectionError('all-content', 'fetch-all-configs', error, {
          offset,
          limit,
        });
      } finally {
        if (isMounted()) {
          setIsLoadingAllConfigsFalse();
        }
      }
    },
    [hasMoreAllConfigs, setIsLoadingAllConfigsTrue, setIsLoadingAllConfigsFalse, isMounted, isLoadingAllConfigs]
  );

  const handleFetchMore = useCallback(async () => {
    await fetchAllConfigs(allConfigs.length);
  }, [fetchAllConfigs, allConfigs.length]);

  // Intersection Observer to detect when section enters viewport
  // Only fetch initial batch when section becomes visible
  // Use useCallback to stabilize the onChange handler
  const handleIntersection = useCallback(
    (isIntersecting: boolean) => {
      if (isIntersecting && !hasTriggeredRef.current && allConfigs.length === 0 && !isLoadingAllConfigs) {
        hasTriggeredRef.current = true;
        fetchAllConfigs(0).catch((error) => {
          trackHomepageSectionError('all-content', 'initial-fetch', error, {});
          logUnhandledPromise('AllContentSection: initial fetchAllConfigs failed', error);
        });
      }
    },
    [allConfigs.length, isLoadingAllConfigs, fetchAllConfigs]
  );

  const { ref: sectionRef } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px', // Start loading 200px before section is visible
    onChange: handleIntersection,
  });

  const weekStartDate = useMemo(() => {
    if (!weekStart) return null;
    const parsed = new Date(weekStart);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [weekStart]);

  const trendingSlugs = useMemo(() => getTrendingSlugs(allConfigs, 6), [allConfigs]);

  // OPTIMIZATION: Memoize keyExtractor to prevent recreation on every render
  const keyExtractor = useCallback(
    (item: DisplayableContent, index: number) => {
      // Use slug for unique keys
      // DisplayableContent doesn't have an id property
      // Use index as fallback instead of Math.random() to prevent hydration mismatches
      const uniqueId = item.slug ?? `item-${index}`;
      return `all-${uniqueId}`;
    },
    []
  );

  // OPTIMIZATION: Memoize renderCard function to prevent recreation on every render
  const renderCard = useCallback(
    (item: DisplayableContent) => {
      const slug = typeof item.slug === 'string' ? item.slug : null;
      const showNew = Boolean(weekStartDate && isNewSince(item, weekStartDate));
      const showTrending = Boolean(slug && trendingSlugs.has(slug));

      return (
        <div className="relative h-full">
          {showNew || showTrending ? (
            <TooltipProvider delayDuration={300}>
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                {showNew ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <UnifiedBadge
                          variant="base"
                          style="secondary"
                          className={cn('text-[10px] uppercase pointer-events-auto')}
                        >
                          New this week
                        </UnifiedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      Added or updated within the last 7 days
                    </TooltipContent>
                  </Tooltip>
                ) : null}
                {showTrending ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <UnifiedBadge
                          variant="base"
                          style="outline"
                          className={cn('text-[10px] uppercase pointer-events-auto')}
                        >
                          Trending
                        </UnifiedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      Most viewed and copied configurations this week
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </TooltipProvider>
          ) : null}
          <ConfigCard
            item={item}
            variant="default"
            showCategory
            showActions
            onAuthRequired={handleAuthRequired}
          />
        </div>
      );
    },
    [weekStartDate, trendingSlugs, handleAuthRequired]
  );

  return (
    <section
      ref={sectionRef}
      aria-label="All configurations"
      className="container mx-auto space-y-12 px-4 pb-4"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold">All Configurations</h2>
        <p className="mt-2 text-muted-foreground">
          Browse all configurations across all categories
        </p>
      </div>

      <UnifiedCardGrid
        items={allConfigs}
        variant="normal"
        infiniteScroll
        batchSize={30}
        emptyMessage={isLoadingAllConfigs ? 'Loading configurations...' : 'No configurations found.'}
        ariaLabel="All configurations"
        loading={isLoadingAllConfigs}
        onFetchMore={handleFetchMore}
        serverHasMore={hasMoreAllConfigs}
        keyExtractor={keyExtractor}
        renderCard={renderCard}
      />
    </section>
  );
}
