'use client';

/**
 * SearchSection Component
 * Production 2025 Architecture: Infinite Scroll with Intersection Observer
 *
 * Handles search UI and results display for the homepage
 * Uses infinite scroll for optimal performance with large result sets
 */

import { type FC, memo } from 'react';
import { ConfigCard } from '@/src/components/features/content/config-card';
import { InfiniteScrollGrid } from '@/src/components/shared/infinite-scroll-grid';
import { Button } from '@/src/components/ui/button';
import { Search } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface SearchSectionProps {
  isSearching: boolean;
  filteredResults: readonly UnifiedContentItem[];
  onClearSearch: () => void;
}

const SearchSectionComponent: FC<SearchSectionProps> = ({
  isSearching,
  filteredResults,
  onClearSearch,
}) => {
  if (!isSearching) return null;

  return (
    <div className="mb-16">
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mb-8`}>
        <h2 className={'text-2xl font-bold'}>
          Search Results
          <span className={'text-muted-foreground ml-2'}>({filteredResults.length} found)</span>
        </h2>
        <Button variant="outline" onClick={onClearSearch} className="text-sm">
          Clear Search
        </Button>
      </div>

      {filteredResults.length > 0 ? (
        <InfiniteScrollGrid<UnifiedContentItem>
          items={filteredResults}
          gap={24}
          batchSize={30}
          renderItem={(item: UnifiedContentItem) => (
            <ConfigCard item={item} variant="default" showCategory={true} showActions={true} />
          )}
          emptyMessage="No results found"
          keyExtractor={(item: UnifiedContentItem) => item.slug}
        />
      ) : (
        <div className={UI_CLASSES.CONTAINER_CARD_MUTED}>
          <Search className={'h-12 w-12 mx-auto mb-4 text-muted-foreground/50'} />
          <h3 className={'text-lg font-semibold mb-2'}>No results found</h3>
          <p className="text-muted-foreground">
            Try different keywords or browse our featured content below
          </p>
        </div>
      )}
    </div>
  );
};

export const SearchSection = memo(SearchSectionComponent);
