'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useState } from 'react';
import { ConfigCard } from '@/src/components/domain/config-card';
import { UnifiedCardGrid } from '@/src/components/domain/unified-card-grid';
import { ErrorBoundary } from '@/src/components/infra/error-boundary';
import { Skeleton } from '@/src/components/primitives/loading-skeleton';

const UnifiedSearch = dynamic(
  () =>
    import('@/src/components/features/search/unified-search').then((mod) => ({
      default: mod.UnifiedSearch,
    })),
  {
    ssr: false,
    loading: () => <Skeleton size="xl" width="3xl" className="h-14" />,
  }
);

import { HelpCircle } from '@/src/lib/icons';
import type { ContentItem, ContentSearchClientProps } from '@/src/lib/schemas/component.schema';
import { ICON_NAME_MAP } from '@/src/lib/ui-constants';

/**
 * Content Search Client Component
 * Production 2025 Architecture: Infinite Scroll with Intersection Observer
 *
 * Performance Optimizations:
 * - Intersection Observer for progressive loading
 * - Loads 30 items per batch for optimal performance
 * - Compatible with CSS Grid layout
 * - Memoized to prevent re-renders when parent state changes
 * - Only re-renders when items/searchPlaceholder/title/icon props change
 */
function ContentSearchClientComponent<T extends ContentItem>({
  items,
  searchPlaceholder,
  title,
  icon,
}: ContentSearchClientProps<T>) {
  // Local state for search (no server call needed - data already provided)
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  // Simple client-side filtering since data is already provided
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query)
    );
  }) as T[];

  const filterOptions = { tags: [], authors: [], categories: [] };

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

      {/* Infinite Scroll Grid Results */}
      {filteredItems.length > 0 ? (
        <ErrorBoundary>
          <UnifiedCardGrid
            items={filteredItems}
            variant="normal"
            infiniteScroll
            batchSize={30}
            emptyMessage={`No ${title.toLowerCase()} found`}
            ariaLabel="Search results"
            keyExtractor={(item) => item.slug}
            renderCard={(item) => (
              <ConfigCard item={item} variant="default" showCategory={true} showActions={true} />
            )}
          />
        </ErrorBoundary>
      ) : (
        <output className={'text-center py-12 block'}>
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
