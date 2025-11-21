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

import { searchUnifiedClient, type UnifiedSearchFilters } from '@/src/lib/edge/search-client';
import { HelpCircle } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type {
  ContentSearchClientProps,
  DisplayableContent,
  FilterState,
} from '@/src/lib/types/component.types';
import { ICON_NAME_MAP } from '@/src/lib/ui-constants';

/**
 * Content Search Client - Edge Function Integration
 * Uses edge-cached search client for optimized search
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
        // Build filters object: merge filters state with category prop
        // Use UnifiedSearchFilters type for proper type safety
        const searchFilters: UnifiedSearchFilters = {
          limit: 100,
        };

        // Categories: prefer filters.category, fallback to category prop
        if (filters.category) {
          searchFilters.categories = [filters.category];
        } else if (category) {
          searchFilters.categories = [category];
        }

        // Tags from filters state
        if (filters.tags && filters.tags.length > 0) {
          searchFilters.tags = filters.tags;
        }

        // Authors from filters state (convert singular to array)
        if (filters.author) {
          searchFilters.authors = [filters.author];
        }

        // Sort from filters state - convert ENUM to string union type
        if (filters.sort) {
          // Map sort_option ENUM to UnifiedSearchFilters sort type
          const sortMap: Record<string, 'relevance' | 'popularity' | 'newest' | 'alphabetical'> = {
            relevance: 'relevance',
            popularity: 'popularity',
            newest: 'newest',
            alphabetical: 'alphabetical',
          };
          const mappedSort = sortMap[filters.sort];
          if (mappedSort) {
            searchFilters.sort = mappedSort;
          }
        }

        const result = await searchUnifiedClient({
          query: query.trim(),
          entities: ['content'],
          filters: searchFilters,
        });

        setSearchResults(result.results as T[]);
      } catch (error) {
        logger.error('Content search failed', error as Error, { source: 'ContentSearchClient' });
        setSearchResults(items);
      }
    },
    [items, category, filters]
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

  // Re-run search when filters change (if there's an active search query)
  // Note: searchQuery changes are handled by the direct onSearch callback,
  // but we need to include handleSearch and searchQuery in deps for exhaustive-deps compliance
  // handleSearch already depends on filters, so when filters change, handleSearch is recreated
  useEffect(() => {
    if (searchQuery.trim()) {
      // Fire-and-forget: handleSearch has its own error handling
      handleSearch(searchQuery).catch((error) => {
        // Error is already logged in handleSearch, but we catch to prevent unhandled promise rejection
        logger.error('Content search effect failed', error as Error, {
          source: 'ContentSearchClient',
        });
      });
    }
  }, [handleSearch, searchQuery]);

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
            keyExtractor={(item, index) => item.slug ?? `fallback-${index}`}
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
