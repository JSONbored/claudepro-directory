/**
 * Changelog category filter tabs - receives counts from database.
 */

'use client';

import { memo } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { TabsList, TabsTrigger } from '@/src/components/primitives/ui/tabs';
import type { ChangelogCategory } from '@/src/lib/changelog/loader';
import { DIMENSIONS } from '@/src/lib/ui-constants';

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
    <TabsList className="grid w-full gap-1 lg:w-auto lg:auto-cols-fr lg:grid-flow-col">
      {FILTER_CATEGORIES.map((category) => (
        <TabsTrigger key={category} value={category} className={'flex items-center gap-2 text-sm'}>
          <span>{category}</span>
          <UnifiedBadge
            variant="base"
            style={activeCategory === category ? 'default' : 'secondary'}
            className={`ml-1 h-5 ${DIMENSIONS.MIN_W_BADGE} justify-center px-1.5 text-xs`}
          >
            {categoryCounts[category] || 0}
          </UnifiedBadge>
        </TabsTrigger>
      ))}
    </TabsList>
  );
});

CategoryFilter.displayName = 'CategoryFilter';
