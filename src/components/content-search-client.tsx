'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useState } from 'react';
import { ConfigCard } from '@/src/components/features/content/config-card';
import { ErrorBoundary } from '@/src/components/shared/error-boundary';
import { InfiniteScrollContainer } from '@/src/components/shared/infinite-scroll-container';
import { useLocalSearch } from '@/src/hooks/use-search';
import { UI_CONFIG } from '@/src/lib/constants';
import { UI_CLASSES } from '@/src/lib/ui-constants';

const UnifiedSearch = dynamic(
  () =>
    import('@/src/components/features/search/unified-search').then((mod) => ({
      default: mod.UnifiedSearch,
    })),
  {
    ssr: false,
    loading: () => <div className={`h-14 bg-muted/50 ${UI_CLASSES.ROUNDED_LG} animate-pulse`} />,
  }
);

import { HelpCircle } from '@/src/lib/icons';
import type {
  ContentSearchClientProps,
  UnifiedContentItem,
} from '@/src/lib/schemas/component.schema';
import { ICON_NAME_MAP } from '@/src/lib/ui-constants';

/**
 * Content Search Client Component
 *
 * Performance Optimizations:
 * - Memoized to prevent re-renders when parent state changes
 * - Only re-renders when items/searchPlaceholder/title/icon props change
 * - Renders infinite scroll container with 20-100+ items (expensive)
 * - useCallback on loadMore to prevent infinite re-creation
 */
function ContentSearchClientComponent<T extends UnifiedContentItem>({
  items,
  searchPlaceholder,
  title,
  icon,
}: ContentSearchClientProps<T>) {
  const [displayedItems, setDisplayedItems] = useState<T[]>(
    items.slice(0, UI_CONFIG.pagination.defaultLimit)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = UI_CONFIG.pagination.defaultLimit;

  // Use consolidated search hook
  const { filters, searchResults, filterOptions, handleSearch, handleFiltersChange } =
    // biome-ignore lint/suspicious/noExplicitAny: Generic constraint too complex for UnifiedContentItem union
    useLocalSearch(items as any);

  const filteredItems = searchResults as T[];

  // Load more function for infinite scroll - optimized with React 19 patterns
  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const nextItems = filteredItems.slice(startIndex, endIndex);

    setDisplayedItems((prev) => [...prev, ...nextItems] as T[]);
    setCurrentPage(nextPage);

    return nextItems;
  }, [currentPage, filteredItems, pageSize]);

  const hasMore = displayedItems.length < filteredItems.length;

  return (
    <div className="space-y-8">
      {/* Unified Search & Filters */}
      <ErrorBoundary>
        <UnifiedSearch
          placeholder={searchPlaceholder}
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          filters={filters}
          availableTags={filterOptions.tags}
          availableAuthors={filterOptions.authors}
          availableCategories={filterOptions.categories}
          resultCount={filteredItems.length}
        />
      </ErrorBoundary>

      {/* Infinite Scroll Results */}
      {filteredItems.length > 0 ? (
        <ErrorBoundary>
          <InfiniteScrollContainer
            items={displayedItems}
            renderItem={(item) => (
              <ConfigCard
                key={item.slug}
                item={item}
                variant="default"
                showCategory={true}
                showActions={true}
              />
            )}
            loadMore={loadMore}
            hasMore={hasMore}
            emptyMessage={`No ${title.toLowerCase()} found`}
            keyExtractor={(item) => item.slug}
          />
        </ErrorBoundary>
      ) : (
        <output className={`text-center py-12 ${UI_CLASSES.BLOCK}`}>
          {(() => {
            const IconComponent = ICON_NAME_MAP[icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
            return (
              <IconComponent
                className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50"
                aria-hidden="true"
              />
            );
          })()}
          <h2 className="text-lg font-semibold mb-2">No {title.toLowerCase()} found</h2>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search criteria or filters.
          </p>
        </output>
      )}
    </div>
  );
}

// Export memoized component - generic type preserved
export const ContentSearchClient = memo(
  ContentSearchClientComponent
) as typeof ContentSearchClientComponent;
