/**
 * Changelog category filter tabs - receives counts from database.
 */

'use client';

import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { TabsList, TabsTrigger } from '@/src/components/primitives/ui/tabs';
import { DIMENSIONS } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';
import { Constants } from '@/src/types/database.types';

// Use enum values directly from database.types.ts Constants
const CHANGELOG_CATEGORY_VALUES = Constants.public.Enums.changelog_category;

export interface CategoryFilterProps {
  activeCategory: 'All' | Database['public']['Enums']['changelog_category'];
  onCategoryChange: (category: 'All' | Database['public']['Enums']['changelog_category']) => void;
  categoryCounts: Record<string, number>;
}

const FILTER_CATEGORIES = ['All', ...CHANGELOG_CATEGORY_VALUES] as const;

export function CategoryFilter({ activeCategory, categoryCounts }: CategoryFilterProps) {
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
}
