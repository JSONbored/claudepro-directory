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

import { useMemo, useState } from 'react';
import { CategoryFilter } from '@/src/components/changelog/category-filter';
import { ChangelogCard } from '@/src/components/changelog/changelog-card';
import type { ChangelogCategory, ChangelogEntry } from '@/src/lib/schemas/changelog.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
    <div className={UI_CLASSES.SPACE_Y_6}>
      {/* Category Filter */}
      <CategoryFilter
        entries={entries}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Filtered Entries List */}
      <div className="mt-6">
        {filteredEntries.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-1">
            {filteredEntries.map((entry) => (
              <ChangelogCard key={entry.slug} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No changelog entries found for {activeCategory.toLowerCase()} category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
