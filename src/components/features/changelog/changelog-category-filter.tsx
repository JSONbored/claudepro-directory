/**
 * Changelog category filter tabs - receives counts from database.
 */

'use client';

import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { TabsList, TabsTrigger } from '@/src/components/primitives/ui/tabs';
import { DIMENSIONS } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';

// Changelog category enum values for validation
const CHANGELOG_CATEGORY_VALUES: readonly Database['public']['Enums']['changelog_category'][] = [
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
] as const;

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
