'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { ConfigCard } from '@/components/config-card';
import { ErrorBoundary } from '@/components/error-boundary';
import { InfiniteScrollContainer } from '@/components/infinite-scroll-container';
import { useLocalSearch } from '@/hooks/use-search';

const UnifiedSearch = dynamic(
  () => import('@/components/unified-search').then((mod) => ({ default: mod.UnifiedSearch })),
  {
    ssr: false,
    loading: () => <div className="h-14 bg-muted/50 rounded-lg animate-pulse" />,
  }
);

import { getIconByName } from '@/lib/icons';
import type { ContentSearchClientProps, UnifiedContentItem } from '@/lib/schemas';

export function ContentSearchClient<T extends UnifiedContentItem>({
  items,
  searchPlaceholder,
  title,
  icon,
}: ContentSearchClientProps<T>) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([...items].slice(0, 20));
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

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
  }, [currentPage, filteredItems]);

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
            pageSize={20}
            gridClassName="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            emptyMessage={`No ${title.toLowerCase()} found`}
            keyExtractor={(item) => item.slug}
          />
        </ErrorBoundary>
      ) : (
        <output className="text-center py-12 block">
          {(() => {
            const IconComponent = getIconByName(icon);
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
