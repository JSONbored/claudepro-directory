/**
 * Changelog category filter tabs - receives counts from database.
 */

'use client';

import { ChangelogCategory } from '@heyclaude/data-layer/prisma';
import type { changelog_category } from '@heyclaude/data-layer/prisma';
import { DIMENSIONS, UnifiedBadge, TabsList, TabsTrigger, cn } from '@heyclaude/web-runtime/ui';
import { cluster, gap, size, marginLeft, paddingX } from '@heyclaude/web-runtime/design-system';

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
        <TabsTrigger key={category} value={category} className={cn(cluster.compact, gap.compact, size.sm)}>
          <span>{category}</span>
          <UnifiedBadge
            variant="base"
            style={activeCategory === category ? 'default' : 'secondary'}
            className={cn(marginLeft.tight, 'h-5', DIMENSIONS.MIN_W_BADGE, 'justify-center', paddingX['1.5'], 'text-xs')}
          >
            {categoryCounts[category] || 0}
          </UnifiedBadge>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
