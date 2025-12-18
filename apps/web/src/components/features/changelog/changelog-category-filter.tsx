/**
 * Changelog category filter tabs - receives counts from database.
 */

'use client';

import { ChangelogCategory } from '@heyclaude/data-layer/prisma';
import type { changelog_category } from '@heyclaude/data-layer/prisma';
import { UnifiedBadge, TabsList, TabsTrigger, cn } from '@heyclaude/web-runtime/ui';

// Use Prisma enum values
const CHANGELOG_CATEGORY_VALUES = Object.values(ChangelogCategory);

export interface CategoryFilterProps {
  activeCategory: 'All' | changelog_category;
  categoryCounts: Record<string, number>;
  onCategoryChange: (category: 'All' | changelog_category) => void;
}

const FILTER_CATEGORIES = ['All', ...CHANGELOG_CATEGORY_VALUES] as const;

export function CategoryFilter({ activeCategory, categoryCounts }: CategoryFilterProps) {
  return (
    <TabsList className={`grid w-full gap-1 lg:w-auto lg:auto-cols-fr lg:grid-flow-col`}>
      {FILTER_CATEGORIES.map((category) => (
        <TabsTrigger key={category} value={category} className={cn('flex items-center gap-2', 'gap-2', 'text-sm')}>
          <span>{category}</span>
          <UnifiedBadge
            variant="base"
            style={activeCategory === category ? 'default' : 'secondary'}
            className={cn('ml-1', 'h-5', 'min-w-[1.5rem]', 'justify-center', 'px-1.5', 'text-xs')}
          >
            {categoryCounts[category] || 0}
          </UnifiedBadge>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
