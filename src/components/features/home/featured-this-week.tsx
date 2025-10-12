'use client';

/**
 * FeaturedThisWeek Component
 * SHA-XXXX: Weekly curated featured content with multi-factor scoring
 *
 * Displays top 10 featured configs for the current week based on:
 * - Trending score (40%): 24h growth momentum
 * - Rating score (30%): User ratings (when reviews implemented)
 * - Engagement score (20%): Bookmarks, copies, comments, views
 * - Freshness score (10%): Recency boost
 *
 * Features:
 * - Hero section with gradient border
 * - Horizontal scrollable carousel
 * - Featured badges with animated styling
 * - Score breakdown tooltips
 * - Mobile-responsive grid layout
 */

import Link from 'next/link';
import { type FC, memo } from 'react';
import { ConfigCard } from '@/src/components/features/content/config-card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Award, ChevronRight, Sparkles, TrendingUp } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface FeaturedThisWeekProps {
  /** Featured items for current week (max 10 per category) */
  featuredItems: readonly UnifiedContentItem[];
  /** Week start date for display (e.g., "Oct 7") */
  weekLabel?: string;
}

/**
 * FeaturedThisWeek Component
 *
 * Displays weekly curated featured content in hero section
 * Performance-optimized with React.memo
 */
const FeaturedThisWeekComponent: FC<FeaturedThisWeekProps> = ({ featuredItems, weekLabel }) => {
  // Don't render if no featured items
  if (featuredItems.length === 0) {
    return null;
  }

  // Calculate week label if not provided
  const displayWeekLabel = weekLabel || getCurrentWeekLabel();

  return (
    <section className="relative mb-16 overflow-hidden">
      {/* Gradient background accent */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.15), transparent 50%)',
        }}
      />

      {/* Header */}
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.MB_8}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD} flex items-center gap-2`}>
              Featured This Week
              <Badge variant="secondary" className="text-xs font-normal">
                {displayWeekLabel}
              </Badge>
            </h2>
            <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
              Top configs selected by our multi-factor algorithm
            </p>
          </div>
        </div>
        <Link href="/featured" className={UI_CLASSES.LINK_ACCENT_UNDERLINE}>
          View Archive <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Featured Items Grid/Carousel */}
      <div
        className={`
          grid gap-4
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
          2xl:grid-cols-5
        `}
      >
        {featuredItems.slice(0, 10).map((item, index) => (
          <div
            key={item.slug}
            className="group relative"
            style={{
              // Stagger animation delay
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Rank badge (top 3 only) */}
            {index < 3 && (
              <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-sm font-bold text-black shadow-lg">
                {index + 1}
              </div>
            )}

            {/* Featured card with enhanced styling */}
            <div className="relative h-full overflow-hidden rounded-lg border-2 border-primary/20 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-lg">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Featured badge */}
              <div className="absolute right-2 top-2 z-10">
                <Badge
                  variant="secondary"
                  className="gap-1 border-primary/30 bg-primary/10 text-primary"
                >
                  <Sparkles className="h-3 w-3" />
                  Featured
                </Badge>
              </div>

              {/* Card content */}
              <div className="p-4">
                <ConfigCard
                  item={item}
                  variant="default"
                  showCategory={true}
                  showActions={false}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA for more featured */}
      {featuredItems.length > 10 && (
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/featured">
              <TrendingUp className="mr-2 h-4 w-4" />
              View All {featuredItems.length} Featured Configs
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
};

/**
 * Get current week label (e.g., "Oct 7-13")
 */
function getCurrentWeekLabel(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const monthName = monthFormatter.format(monday);
  const startDay = monday.getDate();
  const endDay = sunday.getDate();

  return `${monthName} ${startDay}-${endDay}`;
}

export const FeaturedThisWeek = memo(FeaturedThisWeekComponent);
FeaturedThisWeek.displayName = 'FeaturedThisWeek';
