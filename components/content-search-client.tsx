'use client';

import { useCallback, useMemo, useState } from 'react';
import { ConfigCard } from '@/components/config-card';
import { ErrorBoundary } from '@/components/error-boundary';
import { InfiniteScrollContainer } from '@/components/infinite-scroll-container';
import { UnifiedSearch } from '@/components/unified-search';
import { sortAlphabetically } from '@/lib/content-sorting';
import { getIconByName } from '@/lib/icons';
import type { ContentSearchClientProps, FilterState } from '@/lib/schemas/component.schema';

import type { UnifiedContentItem } from '@/lib/schemas/components';

export function ContentSearchClient<T extends UnifiedContentItem>({
  items,
  searchPlaceholder,
  title,
  icon,
}: ContentSearchClientProps<T>) {
  const [filteredItems, setFilteredItems] = useState<T[]>([...items]);
  const [displayedItems, setDisplayedItems] = useState<T[]>([...items].slice(0, 20));
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    sort: 'trending',
  });
  const pageSize = 20;

  // Pre-computed search index for better performance
  const searchIndex = useMemo(() => {
    return items.map((item) => ({
      item,
      searchText: [
        item.name || '',
        item.description || '',
        ...(item.tags || []),
        item.category || '',
        item.author || '',
      ]
        .join(' ')
        .toLowerCase(),
    }));
  }, [items]);

  // Filter and search logic - optimized with pre-computed search index
  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredItems([...items]);
        setDisplayedItems([...items].slice(0, pageSize));
        setCurrentPage(1);
        return;
      }

      const searchLower = query.toLowerCase();
      const filtered = searchIndex
        .filter(({ searchText }) => searchText.includes(searchLower))
        .map(({ item }) => item);

      setFilteredItems(filtered);
      setDisplayedItems(filtered.slice(0, pageSize));
      setCurrentPage(1);
    },
    [items, searchIndex]
  );

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);

      let processed = [...filteredItems];

      // Apply category filter
      if (newFilters.category) {
        processed = processed.filter((item) => item.category === newFilters.category);
      }

      // Apply author filter
      if (newFilters.author) {
        processed = processed.filter((item) => item.author === newFilters.author);
      }

      // Apply tags filter
      if (newFilters.tags && newFilters.tags.length > 0) {
        processed = processed.filter((item) =>
          newFilters.tags?.some((tag) => item.tags?.includes(tag))
        );
      }

      // Apply sorting using centralized content-sorting utilities
      switch (newFilters.sort) {
        case 'alphabetical':
          processed = sortAlphabetically(processed);
          break;
        case 'newest':
          // Keep original order for newest (should be sorted by date if available)
          break;
        default:
          // Keep original order which should be trending
          break;
      }

      setFilteredItems(processed);
      setDisplayedItems(processed.slice(0, pageSize));
      setCurrentPage(1);
    },
    [filteredItems]
  );

  // Load more function for infinite scroll - optimized with React 19 patterns
  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const nextItems = filteredItems.slice(startIndex, endIndex);

    setDisplayedItems((prev) => [...prev, ...nextItems]);
    setCurrentPage(nextPage);

    return nextItems;
  }, [currentPage, filteredItems]);

  const hasMore = displayedItems.length < filteredItems.length;

  // Extract unique values for filters - memoized for performance
  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))].filter(Boolean) as string[],
    [items]
  );
  const tags = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags || []))].filter(Boolean),
    [items]
  );
  const authors = useMemo(
    () => [...new Set(items.map((item) => item.author))].filter(Boolean) as string[],
    [items]
  );

  return (
    <div className="space-y-8">
      {/* Unified Search & Filters */}
      <ErrorBoundary>
        <UnifiedSearch
          placeholder={searchPlaceholder}
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          filters={filters}
          availableTags={tags}
          availableAuthors={authors}
          availableCategories={categories}
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
