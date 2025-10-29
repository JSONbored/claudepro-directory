/**
 * Changelog category filter tabs - receives counts from database.
 */

'use client';

import { memo } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { TabsList, TabsTrigger } from '@/src/components/primitives/tabs';
import type { ChangelogCategory } from '@/src/lib/changelog/loader';

export interface CategoryFilterProps {
  activeCategory: 'All' | ChangelogCategory;
  onCategoryChange: (category: 'All' | ChangelogCategory) => void;
  categoryCounts: Record<string, number>;
}

const FILTER_CATEGORIES = [
  'All',
  'Added',
  'Changed',
  'Fixed',
  'Removed',
  'Deprecated',
  'Security',
] as const;

export const CategoryFilter = memo(({ activeCategory, categoryCounts }: CategoryFilterProps) => {
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
            {categoryCounts[category] || 0}
          </UnifiedBadge>
        </TabsTrigger>
      ))}
    </TabsList>
  );
});

CategoryFilter.displayName = 'CategoryFilter';
