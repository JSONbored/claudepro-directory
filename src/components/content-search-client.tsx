'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';
import { ConfigCard } from '@/src/components/features/content/config-card';
import { ErrorBoundary } from '@/src/components/shared/error-boundary';
import { InfiniteScrollGrid } from '@/src/components/shared/infinite-scroll-grid';
import { useLocalSearch } from '@/src/hooks/use-search';

const UnifiedSearch = dynamic(
  () =>
    import('@/src/components/features/search/unified-search').then((mod) => ({
      default: mod.UnifiedSearch,
    })),
  {
    ssr: false,
    loading: () => <div className={'h-14 bg-muted/50 rounded-lg animate-pulse'} />,
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
 * Production 2025 Architecture: Infinite Scroll with Intersection Observer
 *
 * Performance Optimizations:
 * - Intersection Observer for progressive loading
 * - Loads 30 items per batch for optimal performance
 * - Compatible with CSS Grid layout
 * - Memoized to prevent re-renders when parent state changes
 * - Only re-renders when items/searchPlaceholder/title/icon props change
 */
function ContentSearchClientComponent<T extends UnifiedContentItem>({
  items,
  searchPlaceholder,
  title,
  icon,
}: ContentSearchClientProps<T>) {
  // Use consolidated search hook
  const { filters, searchResults, filterOptions, handleSearch, handleFiltersChange } =
    // biome-ignore lint/suspicious/noExplicitAny: Generic constraint too complex for UnifiedContentItem union
    useLocalSearch(items as any);

  const filteredItems = searchResults as T[];

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
          <InfiniteScrollGrid<T>
            items={filteredItems}
            gap={24}
            batchSize={30}
            renderItem={(item: T) => (
              <ConfigCard item={item} variant="default" showCategory={true} showActions={true} />
            )}
            emptyMessage={`No ${title.toLowerCase()} found`}
            keyExtractor={(item: T) => item.slug}
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
