/**
 * Category Filter Component
 *
 * Tabbed filter for changelog entries by category (All, Added, Fixed, etc.).
 * Displays count badges for each category to show number of matching entries.
 *
 * Architecture:
 * - Uses shadcn Tabs component
 * - Shows category counts in badges
 * - Client-side filtering (no page reload)
 * - Responsive design
 *
 * Production Standards:
 * - Accessible with keyboard navigation
 * - Type-safe props
 * - Memoized for performance
 * - Follows existing TabsSection pattern
 */

'use client';

import { memo, useMemo } from 'react';
import { TabsList, TabsTrigger } from '@/src/components/primitives/tabs';
import { UnifiedBadge } from '@/src/components/ui/unified-badge';
import type { ChangelogCategory, ChangelogEntry } from '@/src/lib/schemas/changelog.schema';

/**
 * Props for CategoryFilter component
 */
export interface CategoryFilterProps {
  /** All changelog entries for counting */
  entries: ChangelogEntry[];
  /** Currently active category filter */
  activeCategory: 'All' | ChangelogCategory;
  /** Callback when category filter changes */
  onCategoryChange: (category: 'All' | ChangelogCategory) => void;
}

/**
 * Available filter categories (All + Keep a Changelog categories)
 */
const FILTER_CATEGORIES = [
  'All',
  'Added',
  'Changed',
  'Fixed',
  'Removed',
  'Deprecated',
  'Security',
] as const;

/**
 * CategoryFilter Component
 *
 * @example
 * ```tsx
 * const [activeCategory, setActiveCategory] = useState<'All' | ChangelogCategory>('All');
 *
 * <CategoryFilter
 *   entries={allEntries}
 *   activeCategory={activeCategory}
 *   onCategoryChange={setActiveCategory}
 * />
 * ```
 */
export const CategoryFilter = memo(({ entries, activeCategory }: CategoryFilterProps) => {
  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: entries.length,
      Added: 0,
      Changed: 0,
      Fixed: 0,
      Removed: 0,
      Deprecated: 0,
      Security: 0,
    };

    // Count entries that have at least one item in each category
    for (const entry of entries) {
      if (entry.categories.Added.length > 0) counts.Added = (counts.Added ?? 0) + 1;
      if (entry.categories.Changed.length > 0) counts.Changed = (counts.Changed ?? 0) + 1;
      if (entry.categories.Fixed.length > 0) counts.Fixed = (counts.Fixed ?? 0) + 1;
      if (entry.categories.Removed.length > 0) counts.Removed = (counts.Removed ?? 0) + 1;
      if (entry.categories.Deprecated.length > 0) counts.Deprecated = (counts.Deprecated ?? 0) + 1;
      if (entry.categories.Security.length > 0) counts.Security = (counts.Security ?? 0) + 1;
    }

    return counts;
  }, [entries]);

  return (
    <TabsList className="grid w-full lg:w-auto lg:grid-flow-col lg:auto-cols-fr gap-1">
      {FILTER_CATEGORIES.map((category) => (
        <TabsTrigger key={category} value={category} className={'text-sm flex items-center gap-2'}>
          <span>{category}</span>
          <UnifiedBadge
            variant="base"
            style={activeCategory === category ? 'default' : 'secondary'}
            className="ml-1 h-5 min-w-[1.5rem] justify-center px-1.5 text-xs"
          >
            {categoryCounts[category]}
          </UnifiedBadge>
        </TabsTrigger>
      ))}
    </TabsList>
  );
});

CategoryFilter.displayName = 'CategoryFilter';
