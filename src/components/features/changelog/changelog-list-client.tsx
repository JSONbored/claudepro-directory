/**
 * Changelog List Client Component
 *
 * Client-side component for displaying and filtering changelog entries.
 * Handles category filtering state and renders filtered list.
 *
 * Architecture:
 * - Client component (uses React hooks)
 * - Category-based filtering (All, Added, Fixed, etc.)
 * - Memoized filtering for performance
 * - Grid layout for cards
 *
 * Production Standards:
 * - Type-safe props
 * - Optimized rendering with useMemo
 * - Accessible with ARIA labels
 * - Responsive design
 */

'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BaseCard } from '@/src/components/domain/base-card';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { CategoryFilter } from '@/src/components/features/changelog/category-filter';
import { Tabs, TabsContent } from '@/src/components/primitives/tabs';
import type { ChangelogCategory, ChangelogEntry } from '@/src/lib/changelog/loader';
import {
  formatChangelogDateShort,
  getChangelogPath,
  getNonEmptyCategories,
  getRelativeTime,
} from '@/src/lib/changelog/utils';
import { ArrowRight, Calendar } from '@/src/lib/icons';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Props for ChangelogListClient component
 */
export interface ChangelogListClientProps {
  /** All changelog entries */
  entries: ChangelogEntry[];
}

/**
 * ChangelogListClient Component
 *
 * @example
 * ```tsx
 * <ChangelogListClient entries={allEntries} />
 * ```
 */
export function ChangelogListClient({ entries }: ChangelogListClientProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | ChangelogCategory>('All');

  // Filter entries based on active category
  const filteredEntries = useMemo(() => {
    if (activeCategory === 'All') {
      return entries;
    }

    // Filter entries that have at least one item in the selected category
    return entries.filter((entry) => {
      return entry.categories[activeCategory].length > 0;
    });
  }, [entries, activeCategory]);

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(value) => setActiveCategory(value as 'All' | ChangelogCategory)}
      className="space-y-6"
    >
      {/* Category Filter */}
      <CategoryFilter
        entries={entries}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Filtered Entries List */}
      <TabsContent value={activeCategory} className="mt-6">
        {filteredEntries.length === 0 ? (
          <output className="flex items-center justify-center py-12" aria-live="polite">
            <p className="text-lg text-muted-foreground">
              No changelog entries found for {activeCategory.toLowerCase()} category.
            </p>
          </output>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredEntries.map((entry) => {
              const targetPath = getChangelogPath(entry.slug);
              const nonEmptyCategories = getNonEmptyCategories(entry.categories);
              const displayDate = getRelativeTime(entry.date);

              return (
                <Link key={entry.slug} href={targetPath} className="block">
                  <BaseCard
                    variant="changelog"
                    targetPath={targetPath}
                    displayTitle={entry.title}
                    {...(entry.tldr && { description: entry.tldr })}
                    ariaLabel={`${entry.title} - ${entry.date}`}
                    showAuthor={false}
                    className="transition-all duration-200"
                    renderTopBadges={() => (
                      <div className={'flex items-center gap-2'}>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <time
                          dateTime={entry.date}
                          className="text-sm font-medium text-muted-foreground"
                          title={formatChangelogDateShort(entry.date)}
                        >
                          {displayDate}
                        </time>
                      </div>
                    )}
                    renderContent={() =>
                      nonEmptyCategories.length > 0 ? (
                        <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2}`}>
                          {nonEmptyCategories.slice(0, 4).map((category) => (
                            <UnifiedBadge
                              key={category}
                              variant="base"
                              style="outline"
                              className={`${BADGE_COLORS.changelogCategory[category as keyof typeof BADGE_COLORS.changelogCategory]} font-medium`}
                            >
                              {category}
                            </UnifiedBadge>
                          ))}
                          {nonEmptyCategories.length > 4 && (
                            <UnifiedBadge
                              variant="base"
                              style="outline"
                              className="text-muted-foreground"
                            >
                              +{nonEmptyCategories.length - 4} more
                            </UnifiedBadge>
                          )}
                        </div>
                      ) : null
                    }
                    customMetadataText={
                      <div
                        className={
                          'flex items-center gap-2 text-sm text-primary group-hover:text-accent transition-colors-smooth font-medium transition-colors'
                        }
                      >
                        <span>Read full changelog</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    }
                  />
                </Link>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
