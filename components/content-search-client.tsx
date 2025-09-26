'use client';

import { useCallback, useMemo, useState } from 'react';
import { ConfigCard } from '@/components/config-card';
import { ErrorBoundary } from '@/components/error-boundary';
import { InfiniteScrollContainer } from '@/components/infinite-scroll-container';
import { type FilterState, UnifiedSearch } from '@/components/unified-search';
import { getIconByName } from '@/lib/icons';
import type { ContentCategory, ContentMetadata } from '@/types/content';

interface ContentSearchClientProps<T extends ContentMetadata> {
  items: readonly T[] | T[];
  type: ContentCategory;
  searchPlaceholder: string;
  title: string;
  icon: string;
}

export function ContentSearchClient<T extends ContentMetadata>({
  items,
  type,
  searchPlaceholder,
  title,
  icon,
}: ContentSearchClientProps<T>) {
  const [filteredItems, setFilteredItems] = useState<T[]>([...items]);
  const [displayedItems, setDisplayedItems] = useState<T[]>([...items].slice(0, 20));
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({ sort: 'trending' });
  const pageSize = 20;

  // Filter and search logic - optimized with React 19 patterns
  const handleSearch = useCallback(
    (query: string) => {
      const searchLower = query.toLowerCase();
      const filtered = items.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          item.category?.toLowerCase().includes(searchLower) ||
          item.author?.toLowerCase().includes(searchLower)
      );
      setFilteredItems(filtered);
      setDisplayedItems(filtered.slice(0, pageSize));
      setCurrentPage(1);
    },
    [items]
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

      // Apply sorting
      switch (newFilters.sort) {
        case 'alphabetical':
          processed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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

    // Simulate async load with small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 100));

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
      <ErrorBoundary
        fallback={<div className="p-4 text-center text-muted-foreground">Error loading search</div>}
      >
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
        <ErrorBoundary
          fallback={
            <div className="p-8 text-center text-muted-foreground">Error loading results</div>
          }
        >
          <InfiniteScrollContainer
            items={displayedItems}
            renderItem={(item) => <ConfigCard key={item.slug} {...item} type={type} />}
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
