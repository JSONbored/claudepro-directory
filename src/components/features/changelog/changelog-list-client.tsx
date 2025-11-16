/**
 * Changelog list with database-first filtering via get_changelog_with_category_stats RPC.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { BaseCard } from '@/src/components/core/domain/cards/content-card-base';
import { CategoryFilter } from '@/src/components/features/changelog/changelog-category-filter';
import { Tabs, TabsContent } from '@/src/components/primitives/ui/tabs';
import {
  formatChangelogDateShort,
  getChangelogPath,
  getNonEmptyCategories,
  getRelativeTime,
} from '@/src/lib/changelog/utils';
import { ArrowRight, Calendar } from '@/src/lib/icons';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';
import type { ChangelogCategory } from '@/src/types/database-overrides';

type ChangelogEntry = Tables<'changelog'>;

export interface ChangelogListClientProps {
  entries: ChangelogEntry[];
  categoryCounts: Record<string, number>;
}
export function ChangelogListClient({ entries, categoryCounts }: ChangelogListClientProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | ChangelogCategory>('All');

  // Filter entries based on active category
  const filteredEntries =
    activeCategory === 'All'
      ? entries
      : entries.filter((entry) => {
          if (!entry.changes || typeof entry.changes !== 'object') return false;
          const changes = entry.changes as Record<string, unknown>;
          const categoryChanges = changes[activeCategory];
          return Array.isArray(categoryChanges) && categoryChanges.length > 0;
        });

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(value) => setActiveCategory(value as 'All' | ChangelogCategory)}
      className="space-y-6"
    >
      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
      />

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
              const nonEmptyCategories = getNonEmptyCategories(entry.changes);
              const displayDate = getRelativeTime(entry.release_date);

              return (
                <Link key={entry.slug} href={targetPath} className="block">
                  <BaseCard
                    variant="changelog"
                    targetPath={targetPath}
                    displayTitle={entry.title}
                    {...(entry.tldr && { description: entry.tldr })}
                    ariaLabel={`${entry.title} - ${entry.release_date}`}
                    showAuthor={false}
                    className="transition-all duration-200"
                    renderTopBadges={() => (
                      <div className={'flex items-center gap-2'}>
                        <Calendar className={`${UI_CLASSES.ICON_SM} text-muted-foreground`} />
                        <time
                          dateTime={entry.release_date}
                          className="font-medium text-muted-foreground text-sm"
                          title={formatChangelogDateShort(entry.release_date)}
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
                          'flex items-center gap-2 font-medium text-primary text-sm transition-colors transition-colors-smooth group-hover:text-accent'
                        }
                      >
                        <span>Read full changelog</span>
                        <ArrowRight className={UI_CLASSES.ICON_SM} />
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
