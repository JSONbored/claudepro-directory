'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useState } from 'react';
import { UnifiedCardGrid } from '@/src/components/core/domain/cards/card-grid';
import { ConfigCard } from '@/src/components/core/domain/cards/config-card';
import { ErrorBoundary } from '@/src/components/core/infra/error-boundary';
import { Skeleton } from '@/src/components/primitives/feedback/loading-skeleton';

const UnifiedSearch = dynamic(
  () =>
    import('@/src/components/features/search/search').then((mod) => ({
      default: mod.UnifiedSearch,
    })),
  {
    ssr: false,
    loading: () => <Skeleton size="xl" width="3xl" className="h-14" />,
  }
);

import { HelpCircle } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type {
  ContentSearchClientProps,
  DisplayableContent,
  FilterState,
} from '@/src/lib/types/component.types';
import { ICON_NAME_MAP } from '@/src/lib/ui-constants';

/**
 * Content Search Client - Server Actions Integration
 * Uses cached server actions for optimized search
 */
function ContentSearchClientComponent<T extends DisplayableContent>({
  items,
  searchPlaceholder,
  title,
  icon,
  category,
}: ContentSearchClientProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [searchResults, setSearchResults] = useState<T[]>(items);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);

      // Empty query → show all initial items
      if (!query.trim()) {
        setSearchResults(items);
        return;
      }

      try {
        const { searchUnifiedClient } = await import('@/src/lib/edge/search-client');

        const result = await searchUnifiedClient({
          query: query.trim(),
          entities: category ? [category as 'content'] : ['content'],
          filters: {
            limit: 100,
            ...(category ? { categories: [category] } : {}),
          },
        });

        setSearchResults(result.results as T[]);
      } catch (error) {
        logger.error('Content search failed', error as Error, { source: 'ContentSearchClient' });
        setSearchResults(items);
      }
    },
    [items, category]
  );

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  // Reset results when initial items change
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(items);
    }
  }, [items, searchQuery]);

  const filteredItems = searchResults;

  const filterOptions = { tags: [], authors: [], categories: [] };

  return (
    <div className="space-y-8">
      {/* Unified Search & Filters */}
      <ErrorBoundary>
        <UnifiedSearch
          {...(searchPlaceholder && { placeholder: searchPlaceholder })}
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          filters={filters}
          availableTags={filterOptions.tags}
          availableAuthors={filterOptions.authors}
          availableCategories={filterOptions.categories}
          resultCount={filteredItems.length}
        />
      </ErrorBoundary>

      {/* Infinite Scroll Grid Results */}
      {filteredItems.length > 0 ? (
        <ErrorBoundary>
          <UnifiedCardGrid
            items={filteredItems}
            variant="normal"
            infiniteScroll={true}
            batchSize={30}
            emptyMessage={`No ${title.toLowerCase()} found`}
            ariaLabel="Search results"
            keyExtractor={(item) => item.slug ?? ''}
            renderCard={(item) => (
              <ConfigCard
                item={item}
                variant="default"
                showCategory={true}
                showActions={true}
                searchQuery={searchQuery}
              />
            )}
          />
        </ErrorBoundary>
      ) : (
        <output className={'block py-12 text-center'}>
          {(() => {
            const IconComponent = ICON_NAME_MAP[icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
            return (
              <IconComponent
                className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50"
                aria-hidden="true"
              />
            );
          })()}
          <h2 className="mb-2 font-semibold text-lg">No {title.toLowerCase()} found</h2>
          <p className="mb-6 text-muted-foreground">
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
