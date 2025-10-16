'use client';

/**
 * SearchSection Component
 * Production 2025 Architecture: TanStack Virtual for infinite lists
 *
 * Handles search UI and results display for the homepage
 * Uses virtualization for optimal performance with large result sets
 */

import { type FC, memo } from 'react';
import { ConfigCard } from '@/src/components/features/content/config-card';
import { VirtualizedGrid } from '@/src/components/shared/virtualized-grid';
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
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.MB_8}`}>
        <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD}`}>
          Search Results
          <span className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} ml-2`}>
            ({filteredResults.length} found)
          </span>
        </h2>
        <Button variant="outline" onClick={onClearSearch} className="text-sm">
          Clear Search
        </Button>
      </div>

      {filteredResults.length > 0 ? (
        <VirtualizedGrid<UnifiedContentItem>
          items={filteredResults}
          estimateSize={400}
          overscan={5}
          gap={24}
          renderItem={(item: UnifiedContentItem) => (
            <ConfigCard item={item} variant="default" showCategory={true} showActions={true} />
          )}
          emptyMessage="No results found"
          keyExtractor={(item: UnifiedContentItem) => item.slug}
        />
      ) : (
        <div className={UI_CLASSES.CONTAINER_CARD_MUTED}>
          <Search
            className={`h-12 w-12 ${UI_CLASSES.MX_AUTO} mb-4 ${UI_CLASSES.TEXT_MUTED_FOREGROUND}/50`}
          />
          <h3 className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.FONT_SEMIBOLD} mb-2`}>
            No results found
          </h3>
          <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
            Try different keywords or browse our featured content below
          </p>
        </div>
      )}
    </div>
  );
};

export const SearchSection = memo(SearchSectionComponent);
