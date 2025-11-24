'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { UnifiedCardGrid } from '@/src/components/core/domain/cards/card-grid';
import { ConfigCard } from '@/src/components/core/domain/cards/config-card';
import { ErrorBoundary } from '@/src/components/core/infra/error-boundary';
import { Skeleton } from '@/src/components/primitives/feedback/loading-skeleton';
import { Button } from '@/src/components/primitives/ui/button';

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

import type { Database } from '@heyclaude/database-types';
import type { UnifiedSearchFilters } from '@heyclaude/web-runtime';
import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { searchUnifiedClient } from '@heyclaude/web-runtime/data';
import { HelpCircle } from '@heyclaude/web-runtime/icons';
import type {
  ContentSearchClientProps,
  DisplayableContent,
  FilterState,
} from '@heyclaude/web-runtime/types/component.types';
import { ICON_NAME_MAP } from '@heyclaude/web-runtime/ui';

/**
 * Content Search Client - Edge Function Integration
 * Uses edge-cached search client for optimized search
 */

type ExtractableValue = string | string[] | null | undefined;

function sanitizeStringList(values?: string[]): string[] {
  if (!Array.isArray(values)) return [];
  const set = new Set<string>();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      set.add(trimmed);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function collectStringsFromItems<T>(
  items: T[],
  extractor: (item: T) => ExtractableValue
): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const value = extractor(item);
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry !== 'string') continue;
        const trimmed = entry.trim();
        if (trimmed.length > 0) {
          set.add(trimmed);
        }
      }
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        set.add(trimmed);
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function ContentSearchClientComponent<T extends DisplayableContent>({
  items,
  searchPlaceholder,
  title,
  icon,
  category,
  availableTags: providedTags = [],
  availableAuthors: providedAuthors = [],
  availableCategories: providedCategories = [],
}: ContentSearchClientProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [searchResults, setSearchResults] = useState<T[]>(items);

  const combinedItems = useMemo(() => {
    const merged: T[] = [];
    const seen = new Set<string>();

    [...items, ...searchResults].forEach((item, index) => {
      const slug = (item as { slug?: string | null }).slug;
      const key =
        typeof slug === 'string' && slug.length > 0 ? slug : `content-search-item-${index}`;

      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });

    return merged;
  }, [items, searchResults]);

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
        const normalized = normalizeError(error, 'Content search failed');
        logger.error('Content search failed', normalized, { source: 'ContentSearchClient' });
        setSearchResults(items);
      }
    },
    [items, category, filters]
  );

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  // Temporary placeholders to fix build errors
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const quickTagOptions: string[] = [];
  const quickAuthorOptions: string[] = [];
  const quickCategoryOptions: string[] = [];
  const fallbackSuggestions: T[] = [];
  const handleQuickFilter = (type: string, value: string) => {
    // Apply quick filter by updating the filter state
    const newFilters = { ...filters };

    if (type === 'tag') {
      newFilters.tags = [...(newFilters.tags || []), value];
    } else if (type === 'author') {
      // FilterState uses 'author' (singular), not 'authors'
      newFilters.author = value;
    } else if (type === 'category') {
      // FilterState uses 'category' (singular), not 'categories'
      newFilters.category = value as Database['public']['Enums']['content_category'];
    }

    setFilters(newFilters);
  };

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
        const normalized = normalizeError(error, 'Content search effect failed');
        logger.error('Content search effect failed', normalized, {
          source: 'ContentSearchClient',
        });
      });
    }
  }, [handleSearch, searchQuery]);

  const filteredItems = searchResults;

  const filterOptions = useMemo(() => {
    const normalizedProvidedTags = sanitizeStringList(providedTags);
    const normalizedProvidedAuthors = sanitizeStringList(providedAuthors);
    const normalizedProvidedCategories = sanitizeStringList(providedCategories);

    const derivedTags =
      normalizedProvidedTags.length > 0
        ? normalizedProvidedTags
        : collectStringsFromItems(
            combinedItems,
            (item) => (item as { tags?: string[] | null }).tags ?? []
          );

    const derivedAuthors =
      normalizedProvidedAuthors.length > 0
        ? normalizedProvidedAuthors
        : collectStringsFromItems(
            combinedItems,
            (item) =>
              (item as { author?: string | null }).author ??
              (item as { created_by?: string | null }).created_by ??
              null
          );

    const derivedCategories =
      normalizedProvidedCategories.length > 0
        ? normalizedProvidedCategories
        : collectStringsFromItems(
            combinedItems,
            (item) => (item as { category?: string | null }).category ?? null
          );

    return {
      tags: derivedTags,
      authors: derivedAuthors,
      categories: derivedCategories,
    };
  }, [combinedItems, providedTags, providedAuthors, providedCategories]);

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
        <div className="rounded-3xl border border-border/60 bg-card/40 p-8 text-center shadow-inner">
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
            Try a suggested filter or explore popular configurations from this week.
          </p>

          {(quickTagOptions.length > 0 ||
            quickAuthorOptions.length > 0 ||
            quickCategoryOptions.length > 0) && (
            <div className="mb-6 space-y-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Quick filters</p>
              <div className="flex flex-wrap justify-center gap-2">
                {quickTagOptions.map((tag) => (
                  <Button
                    key={`tag-${tag}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter('tags', tag)}
                  >
                    #{tag}
                  </Button>
                ))}
                {quickAuthorOptions.map((author) => (
                  <Button
                    key={`author-${author}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter('authors', author)}
                  >
                    {author}
                  </Button>
                ))}
                {quickCategoryOptions.map((cat) => (
                  <Button
                    key={`category-${cat}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter('categories', cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {fallbackSuggestions.length > 0 && (
            <div className="space-y-3 text-left">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Trending &nbsp;•&nbsp; Suggested picks
              </p>
              <ErrorBoundary>
                <UnifiedCardGrid
                  items={fallbackSuggestions}
                  variant="normal"
                  infiniteScroll={false}
                  batchSize={fallbackSuggestions.length}
                  emptyMessage="No suggestions available"
                  ariaLabel="Suggested content"
                  keyExtractor={(item, index) => item.slug ?? `suggestion-${index}`}
                  renderCard={(item) => (
                    <ConfigCard
                      item={item}
                      variant="default"
                      showCategory={true}
                      showActions={true}
                    />
                  )}
                />
              </ErrorBoundary>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export memoized component - generic type preserved
export const ContentSearchClient = memo(
  ContentSearchClientComponent
) as typeof ContentSearchClientComponent;
