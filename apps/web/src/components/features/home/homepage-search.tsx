'use client';

/**
 * SearchSection Component
 * Production 2025 Architecture: Infinite Scroll with Intersection Observer
 *
 * Handles search UI and results display for the homepage
 * Uses infinite scroll for optimal performance with large result sets
 */

import { between, emptyCard, iconSize, muted, marginBottom, weight ,size } from '@heyclaude/web-runtime/design-system';
import { Search } from '@heyclaude/web-runtime/icons';
import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { type FC, memo } from 'react';
import { UnifiedCardGrid } from '@heyclaude/web-runtime/ui';
import { ConfigCard } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';

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
    <div className={marginBottom.hero}>
      <div className={`${between.center} ${marginBottom.relaxed}`}>
        <h2 className={`${weight.bold} ${size['2xl']}`}>
          Search Results
          <span className={`ml-2 ${muted.default}`}>({filteredResults.length} found)</span>
        </h2>
        <Button variant="outline" onClick={onClearSearch} className={size.sm}>
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
        <div className={emptyCard.default}>
          <Search className={`mx-auto ${marginBottom.default} ${iconSize['3xl']} ${muted.default}/50`} />
          <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.lg}`}>No results found</h3>
          <p className={muted.default}>
            Try different keywords or browse our featured content below
          </p>
        </div>
      )}
    </div>
  );
};

export const SearchSection = memo(SearchSectionComponent);
