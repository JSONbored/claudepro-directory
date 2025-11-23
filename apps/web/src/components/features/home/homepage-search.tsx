'use client';

/**
 * SearchSection Component
 * Production 2025 Architecture: Infinite Scroll with Intersection Observer
 *
 * Handles search UI and results display for the homepage
 * Uses infinite scroll for optimal performance with large result sets
 */

import { UI_CLASSES } from '@heyclaude/web-runtime';
import { Search } from '@heyclaude/web-runtime/icons';
import { type FC, memo } from 'react';
import { UnifiedCardGrid } from '@/src/components/core/domain/cards/card-grid';
import { ConfigCard } from '@/src/components/core/domain/cards/config-card';
import { Button } from '@/src/components/primitives/ui/button';
import type { DisplayableContent } from '@/src/lib/types/component.types';

export interface SearchSectionProps {
  isSearching: boolean;
  filteredResults: readonly DisplayableContent[];
  onClearSearch: () => void;
  searchQuery?: string;
}

const SearchSectionComponent: FC<SearchSectionProps> = ({
  isSearching,
  filteredResults,
  onClearSearch,
  searchQuery,
}) => {
  if (!isSearching) return null;

  return (
    <div className="mb-16">
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mb-8`}>
        <h2 className={'font-bold text-2xl'}>
          Search Results
          <span className={'ml-2 text-muted-foreground'}>({filteredResults.length} found)</span>
        </h2>
        <Button variant="outline" onClick={onClearSearch} className="text-sm">
          Clear Search
        </Button>
      </div>

      {filteredResults.length > 0 ? (
        <UnifiedCardGrid
          items={filteredResults}
          variant="normal"
          infiniteScroll={true}
          batchSize={30}
          emptyMessage="No results found"
          ariaLabel="Search results"
          keyExtractor={(item) => item.slug ?? ''}
          renderCard={(item) => (
            <ConfigCard
              item={item}
              variant="default"
              showCategory={true}
              showActions={true}
              {...(searchQuery ? { searchQuery } : {})}
            />
          )}
        />
      ) : (
        <div className={UI_CLASSES.CONTAINER_CARD_MUTED}>
          <Search className={'mx-auto mb-4 h-12 w-12 text-muted-foreground/50'} />
          <h3 className={'mb-2 font-semibold text-lg'}>No results found</h3>
          <p className="text-muted-foreground">
            Try different keywords or browse our featured content below
          </p>
        </div>
      )}
    </div>
  );
};

export const SearchSection = memo(SearchSectionComponent);
