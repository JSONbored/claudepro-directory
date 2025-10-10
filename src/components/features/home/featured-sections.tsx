'use client';

/**
 * FeaturedSections Component
 * SHA-2102: Extracted from home-page-client.tsx for better modularity
 * SHA-XXXX: Made dynamic using HOMEPAGE_FEATURED_CATEGORIES
 *
 * Displays featured content sections dynamically based on category config
 * Adding a new featured category now only requires updating HOMEPAGE_FEATURED_CATEGORIES
 */

import { Briefcase, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { type FC, memo, useMemo } from 'react';
import { LazyConfigCard } from '@/src/components/shared/lazy-config-card';
import { Button } from '@/src/components/ui/button';
import { BentoCard, BentoGrid } from '@/src/components/ui/magic/bento-grid';
import { CATEGORY_CONFIGS, HOMEPAGE_FEATURED_CATEGORIES } from '@/src/lib/config/category-config';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface FeaturedSectionProps {
  title: string;
  href: string;
  items: readonly UnifiedContentItem[];
}

/**
 * Bento Grid Layout Pattern for 6 items
 * Creates visual hierarchy with varying card sizes
 *
 * Layout:
 * Row 1: [Large (2x2)] [Medium (1x1)] [Medium (1x1)]
 * Row 2: [Medium (1x1)] [Medium (1x1)] [Large (2x2)]
 *
 * This creates an asymmetric, visually interesting layout
 */
const BENTO_LAYOUT_PATTERN = [
  { colSpan: 2, rowSpan: 2, gradient: 'to-br' as const }, // Item 0 - Featured large
  { colSpan: 1, rowSpan: 1, gradient: 'none' as const }, // Item 1
  { colSpan: 1, rowSpan: 1, gradient: 'none' as const }, // Item 2
  { colSpan: 1, rowSpan: 1, gradient: 'none' as const }, // Item 3
  { colSpan: 1, rowSpan: 1, gradient: 'none' as const }, // Item 4
  { colSpan: 2, rowSpan: 2, gradient: 'to-tl' as const }, // Item 5 - Featured large
];

/**
 * Memoized Featured Section Component (SHA-2086 Fix + Bento Grid Enhancement)
 *
 * PERFORMANCE: Prevents 30 card re-renders on every parent state change
 * Previously: All featured cards re-rendered on search/tab/filter changes
 * Now: Only re-renders when items prop actually changes
 *
 * VISUAL: Uses Bento Grid for modern, visually striking layout
 * Impact: ~180ms savings per state change (30 cards × 6ms each)
 */
const FeaturedSection: FC<FeaturedSectionProps> = memo(
  ({ title, href, items }: FeaturedSectionProps) => {
    // PERFORMANCE: Memoize the sliced array to prevent re-creating on every render
    // Previous: rules.slice(0, 6) created new array on EVERY parent render
    // Current: Stable reference unless items array changes
    const featuredItems = useMemo(() => items.slice(0, 6), [items]);

    return (
      <div>
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.MB_8}`}>
          <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD}`}>{title}</h2>
          <Link href={href} className={UI_CLASSES.LINK_ACCENT_UNDERLINE}>
            View all <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {/* Bento Grid for modern, visually striking layout */}
        <BentoGrid columns={4} gap={6}>
          {featuredItems.map((item, index) => {
            const layout = BENTO_LAYOUT_PATTERN[index] || {
              colSpan: 1,
              rowSpan: 1,
              gradient: 'none' as const,
            };

            return (
              <BentoCard
                key={item.slug}
                colSpan={layout.colSpan}
                rowSpan={layout.rowSpan}
                gradient={layout.gradient}
                className="p-0 overflow-hidden"
              >
                <LazyConfigCard
                  item={item}
                  variant="default"
                  showCategory={true}
                  showActions={true}
                />
              </BentoCard>
            );
          })}
        </BentoGrid>
      </div>
    );
  }
);

FeaturedSection.displayName = 'FeaturedSection';

/**
 * Props now accept a dynamic record of categories to content items
 * This allows any number of categories without hardcoding
 */
interface FeaturedSectionsProps {
  categories: Record<string, readonly UnifiedContentItem[]>;
}

const FeaturedSectionsComponent: FC<FeaturedSectionsProps> = ({ categories }) => {
  return (
    <div className={`${UI_CLASSES.SPACE_Y_16} mb-16`}>
      {/* Dynamically render featured sections based on HOMEPAGE_FEATURED_CATEGORIES */}
      {HOMEPAGE_FEATURED_CATEGORIES.map((categorySlug) => {
        const items = categories[categorySlug];
        const config = CATEGORY_CONFIGS[categorySlug];

        // Skip if no config or no items for this category
        if (!(config && items)) {
          return null;
        }

        return (
          <FeaturedSection
            key={categorySlug}
            title={`Featured ${config.pluralTitle}`}
            href={`/${config.urlSlug}`}
            items={items}
          />
        );
      })}

      {/* Featured Jobs */}
      <div>
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.MB_8}`}>
          <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD}`}>Featured Jobs</h2>
          <Link href="/jobs" className={UI_CLASSES.LINK_ACCENT_UNDERLINE}>
            View all <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
        <div className={UI_CLASSES.CONTAINER_CARD_MUTED}>
          <Briefcase
            className={`h-12 w-12 ${UI_CLASSES.MX_AUTO} mb-4 ${UI_CLASSES.TEXT_MUTED_FOREGROUND}/50`}
          />
          <h3 className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_2}`}>
            Find Your Next AI Role
          </h3>
          <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} ${UI_CLASSES.MB_6}`}>
            Discover opportunities with companies building the future of AI
          </p>
          <Button asChild>
            <Link href="/jobs">Browse Job Opportunities</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const FeaturedSections = memo(FeaturedSectionsComponent);
