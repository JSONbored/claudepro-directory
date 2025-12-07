'use client';

/**
 * SearchSection Component
 * Production 2025 Architecture: Infinite Scroll with Intersection Observer
 *
 * Handles search UI and results display for the homepage
 * Uses infinite scroll for optimal performance with large result sets
 */

import { Search } from '@heyclaude/web-runtime/icons';
import { type DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { UI_CLASSES, UnifiedCardGrid, ConfigCard, Button } from '@heyclaude/web-runtime/ui';
import { type FC, memo } from 'react';

export interface SearchSectionProps {
  filteredResults: readonly DisplayableContent[];
  isSearching: boolean; // Loading state indicator
  onClearSearch: () => void;
  searchQuery?: string;
}

const SearchSectionComponent: FC<SearchSectionProps> = ({
  isSearching,
  filteredResults,
  onClearSearch,
  searchQuery,
}) => {
  // Show search section if there's a search query (not just when loading)
  // isSearching is used for loading state indicator
  if (!searchQuery || searchQuery.length === 0) return null;

  return (
    <div className="mb-16">
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mb-8`}>
        <h2 className="text-2xl font-bold">
          Search Results
          {isSearching ? (
            <span className="text-muted-foreground ml-2">(Searching...)</span>
          ) : (
            <span className="text-muted-foreground ml-2">({filteredResults.length} found)</span>
          )}
        </h2>
        <Button variant="outline" onClick={onClearSearch} className="text-sm">
          Clear Search
        </Button>
      </div>

      {isSearching && filteredResults.length === 0 ? (
        <div className={UI_CLASSES.CONTAINER_CARD_MUTED}>
          <Search className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12 animate-pulse" />
          <h3 className="mb-2 text-lg font-semibold">Searching...</h3>
          <p className="text-muted-foreground">Finding results for &quot;{searchQuery}&quot;</p>
        </div>
      ) : filteredResults.length > 0 ? (
        <UnifiedCardGrid
          items={filteredResults}
          variant="normal"
          infiniteScroll
          batchSize={30}
          emptyMessage="No results found"
          ariaLabel="Search results"
          keyExtractor={(item) => item.slug ?? ''}
          renderCard={(item) => (
            <ConfigCard
              item={item}
              variant="default"
              showCategory
              showActions
              {...(searchQuery ? { searchQuery } : {})}
            />
          )}
        />
      ) : (
        <div className={UI_CLASSES.CONTAINER_CARD_MUTED}>
          <Search className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">No results found</h3>
          <p className="text-muted-foreground">
            Try different keywords or browse our featured content below
          </p>
        </div>
      )}
    </div>
  );
};

export const SearchSection = memo(SearchSectionComponent);
