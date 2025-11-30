'use client';

/** Featured sections consuming homepageConfigs for runtime-tunable categories */

import type { Database } from '@heyclaude/database-types';
import { trackMissingData } from '@heyclaude/web-runtime/core';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { ExternalLink } from '@heyclaude/web-runtime/icons';
import { between, iconSize } from '@heyclaude/web-runtime/design-system';
import type {
  DisplayableContent,
  UnifiedCategoryConfig,
} from '@heyclaude/web-runtime/types/component.types';
import Link from 'next/link';
import { type FC, memo, useEffect, useMemo } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { UnifiedCardGrid } from '@heyclaude/web-runtime/ui';
import { ConfigCard } from '@heyclaude/web-runtime/ui';
import { JobCard } from '@/src/components/core/domain/cards/job-card';
import { getTrendingSlugs, isNewSince } from '@heyclaude/web-runtime/core';

interface FeaturedSectionProps {
  title: string;
  href: string;
  items: readonly DisplayableContent[];
  weekStart?: string;
}

/**
 * Memoized Featured Section Component (SHA-2086 Fix)
 *
 * PERFORMANCE: Prevents 30 card re-renders on every parent state change
 * Previously: All featured cards re-rendered on search/tab/filter changes
 * Now: Only re-renders when items prop actually changes
 *
 * Impact: ~180ms savings per state change (30 cards × 6ms each)
 */
const FeaturedSection: FC<FeaturedSectionProps> = memo(
  ({ title, href, items, weekStart }: FeaturedSectionProps) => {
    // PERFORMANCE: Memoize the sliced array to prevent re-creating on every render
    // Previous: rules.slice(0, 6) created new array on EVERY parent render
    // Current: Stable reference unless items array changes
    // Defensive check: ensure items is an array before calling .slice()
    const featuredItems = useMemo(() => {
      if (!(items && Array.isArray(items))) return [];
      return items.slice(0, 6);
    }, [items]);
    const weekStartDate = useMemo(() => {
      if (!weekStart) return null;
      const parsed = new Date(weekStart);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }, [weekStart]);
    const trendingSlugs = useMemo(() => getTrendingSlugs(featuredItems, 2), [featuredItems]);

    return (
      <div>
        <div className={`${between.center} mb-8`}>
          <h2 className={'font-bold text-2xl'}>{title}</h2>
          <Link href={href} className="flex items-center gap-2 text-accent hover:underline">
            View all <ExternalLink className={iconSize.sm} />
          </Link>
        </div>
        <UnifiedCardGrid
          items={featuredItems}
          renderCard={(item, index) => {
            const slug = typeof item.slug === 'string' ? item.slug : null;
            const showNew = Boolean(weekStartDate && isNewSince(item, weekStartDate));
            const showTrending = Boolean(slug && trendingSlugs.has(slug));

            return (
              <div className="relative h-full">
                {(showNew || showTrending) && (
                  <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-2">
                    {showNew && (
                      <UnifiedBadge
                        variant="base"
                        style="secondary"
                        className="text-[10px] uppercase tracking-wide"
                      >
                        New this week
                      </UnifiedBadge>
                    )}
                    {showTrending && (
                      <UnifiedBadge
                        variant="base"
                        style="outline"
                        className="text-[10px] uppercase tracking-wide"
                      >
                        Trending
                      </UnifiedBadge>
                    )}
                  </div>
                )}
                <ConfigCard item={item} showBorderBeam={index < 3} />
              </div>
            );
          }}
          variant="normal"
          ariaLabel={`Featured ${title}`}
          prefetchCount={3}
        />
      </div>
    );
  }
);

FeaturedSection.displayName = 'FeaturedSection';

export interface FeaturedSectionsProps {
  categories: Record<string, readonly DisplayableContent[]>;
  categoryConfigs: Record<string, UnifiedCategoryConfig>;
  featuredJobs?: ReadonlyArray<Database['public']['Tables']['jobs']['Row']>;
  featuredCategories: readonly Database['public']['Enums']['content_category'][];
  weekStart?: string;
}

const FeaturedSectionsComponent: FC<FeaturedSectionsProps> = ({
  categories,
  categoryConfigs,
  featuredJobs = [],
  featuredCategories,
  weekStart,
}) => {
  // Track missing featured categories
  useEffect(() => {
    if (featuredCategories.length === 0) {
      trackMissingData('featured', 'featured-categories', {
        categoriesKeys: Object.keys(categories),
        categoryConfigsKeys: Object.keys(categoryConfigs),
        featuredJobsCount: featuredJobs.length,
      });
    }
  }, [featuredCategories.length, categories, categoryConfigs, featuredJobs.length]);

  return (
    <div className={'mb-16 space-y-16'}>
      {featuredCategories.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No featured categories available.
        </div>
      )}
      {featuredCategories.map((categorySlug) => {
        const items = categories[categorySlug];
        const config = categoryConfigs[categorySlug];

        // Skip if no config or no items for this category
        // Also validate that items is actually an array (defensive programming)
        if (!(config && items && Array.isArray(items))) {
          trackMissingData('featured', 'category-data', {
            categorySlug,
            hasConfig: !!config,
            hasItems: !!items,
            itemsIsArray: Array.isArray(items),
            itemsType: typeof items,
          });
          return null;
        }

        return (
          <FeaturedSection
            key={categorySlug}
            title={`Featured ${config.pluralTitle}`}
            href={`/${config.urlSlug}`}
            items={items}
            {...(weekStart ? { weekStart } : {})}
          />
        );
      })}

      {/* Featured Jobs - Dynamic from database */}
      {featuredJobs.length > 0 && (
        <div>
          <div className={`${between.center} mb-8`}>
            <h2 className={'font-bold text-2xl'}>Featured Jobs</h2>
            <Link
              href={ROUTES.JOBS}
              className="flex items-center gap-2 text-accent hover:underline"
            >
              View all <ExternalLink className={iconSize.sm} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.slice(0, 6).map((job) => (
              <JobCard key={job.slug} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const FeaturedSections = memo(FeaturedSectionsComponent);
