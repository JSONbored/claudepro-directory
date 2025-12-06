'use client';

import { type Database } from '@heyclaude/database-types';
import { type UnifiedSearchFilters } from '@heyclaude/web-runtime';
import { searchUnifiedClient } from '@heyclaude/web-runtime/data';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { HelpCircle } from '@heyclaude/web-runtime/icons';
import {
  type ContentSearchClientProps,
  type DisplayableContent,
  type FilterState,
} from '@heyclaude/web-runtime/types/component.types';
import {
  Button,
  Skeleton,
  ConfigCard,
  ErrorBoundary,
  UnifiedCardGrid,
  ICON_NAME_MAP,
} from '@heyclaude/web-runtime/ui';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSavedSearchPresets } from '@/src/hooks/use-saved-search-presets';

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

/**
 * Content Search Client - Edge Function Integration
 * Uses edge-cached search client for optimized search
 */

type ExtractableValue = null | string | string[] | undefined;

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
  return [...set].sort((a, b) => a.localeCompare(b));
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
  return [...set].sort((a, b) => a.localeCompare(b));
}

const QUICK_TAG_LIMIT = 8;
const QUICK_AUTHOR_LIMIT = 6;
const QUICK_CATEGORY_LIMIT = 6;
const FALLBACK_SUGGESTION_LIMIT = 18;
const FALLBACK_SUGGESTION_CHUNK_SIZE = 6;

type QuickFilterType = 'author' | 'category' | 'tag';

function dedupeContentItems<T extends DisplayableContent>(
  items: T[],
  limit = FALLBACK_SUGGESTION_LIMIT
): T[] {
  const seenSlugs = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    if (limit > 0 && unique.length >= limit) break;
    const slug = (item as { slug?: null | string }).slug;
    if (typeof slug === 'string' && slug.length > 0) {
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
    }
    unique.push(item);
  }

  return unique;
}

function chunkItems<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    return items.length > 0 ? [items] : [];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function hasFilterCriteria(filters?: FilterState | null): boolean {
  if (!filters) return false;
  return Boolean(
    filters.category ||
    filters.author ||
    (filters.tags && filters.tags.length > 0) ||
    filters.sort ||
    filters.dateRange ||
    filters.popularity
  );
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
  zeroStateSuggestions = [],
  quickTags,
  quickAuthors,
  quickCategories,
  fallbackSuggestions,
}: ContentSearchClientProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [searchResults, setSearchResults] = useState<T[]>(items);
  const pathname = usePathname();
  const {
    presets,
    isLoaded: presetsLoaded,
    isAtLimit: presetsAtLimit,
    savePreset,
    applyPreset,
    removePreset,
  } = useSavedSearchPresets({ pathname });
  const runLoggedAsync = useLoggedAsync({
    scope: 'ContentSearchClient',
    defaultMessage: 'Content search failed',
    defaultRethrow: false,
  });

  const combinedItems = useMemo(() => {
    const merged: T[] = [];
    const seen = new Set<string>();

    for (const [index, item] of [...items, ...searchResults].entries()) {
      const slug = (item as { slug?: null | string }).slug;
      const key =
        typeof slug === 'string' && slug.length > 0 ? slug : `content-search-item-${index}`;

      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    return merged;
  }, [items, searchResults]);

  const handleSearch = useCallback(
    async (
      query: string,
      overrideFilters?: FilterState,
      telemetry?: { quickFilterType?: QuickFilterType; quickFilterValue?: string }
    ) => {
      const nextFilters = overrideFilters ?? filters;
      const sanitizedQuery = query.trim();
      setSearchQuery(query);

      const shouldExecuteSearch = sanitizedQuery.length > 0 || hasFilterCriteria(nextFilters);
      if (!shouldExecuteSearch) {
        setSearchResults(items);
        return;
      }

      const result = await runLoggedAsync(
        async () => {
          const searchFilters: UnifiedSearchFilters = {
            limit: 100,
          };

          if (nextFilters.category) {
            searchFilters.categories = [nextFilters.category];
          } else if (category) {
            searchFilters.categories = [category];
          }

          if (nextFilters.tags && nextFilters.tags.length > 0) {
            searchFilters.tags = nextFilters.tags;
          }

          if (nextFilters.author) {
            searchFilters.authors = [nextFilters.author];
          }

          if (nextFilters.sort) {
            const sortMap: Record<string, 'alphabetical' | 'newest' | 'popularity' | 'relevance'> =
              {
                relevance: 'relevance',
                popularity: 'popularity',
                newest: 'newest',
                alphabetical: 'alphabetical',
              };
            const mappedSort = sortMap[nextFilters.sort];
            if (mappedSort) {
              searchFilters.sort = mappedSort;
            }
          }

          const result = await searchUnifiedClient({
            query: sanitizedQuery,
            entities: ['content'],
            filters: searchFilters,
          });

          return result.results as T[];
        },
        {
          context: {
            query: sanitizedQuery,
            hasFilters: hasFilterCriteria(nextFilters) ? 'true' : 'false',
            quickFilterType: telemetry?.quickFilterType,
            quickFilterValue: telemetry?.quickFilterValue,
          },
          rethrow: false,
        }
      );

      if (result) {
        setSearchResults(result);
      } else {
        // On error, fallback to original items
        setSearchResults(items);
      }
    },
    [category, filters, items, runLoggedAsync]
  );

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      handleSearch(searchQuery, newFilters).catch(() => {
        // Errors already logged inside handleSearch.
      });
    },
    [handleSearch, searchQuery]
  );
  const fallbackSuggestionPool = useMemo(() => {
    if (fallbackSuggestions && fallbackSuggestions.length > 0) {
      return fallbackSuggestions;
    }
    if (zeroStateSuggestions.length > 0) {
      return zeroStateSuggestions;
    }
    return items.slice(0, FALLBACK_SUGGESTION_LIMIT);
  }, [fallbackSuggestions, zeroStateSuggestions, items]);

  const dedupedFallbackSuggestions = useMemo(
    () => dedupeContentItems(fallbackSuggestionPool, FALLBACK_SUGGESTION_LIMIT),
    [fallbackSuggestionPool]
  );

  const fallbackChunks = useMemo(
    () => chunkItems(dedupedFallbackSuggestions, FALLBACK_SUGGESTION_CHUNK_SIZE),
    [dedupedFallbackSuggestions]
  );

  const [visibleSuggestionChunks, setVisibleSuggestionChunks] = useState(1);

  useEffect(() => {
    if (fallbackChunks.length >= 0) {
      setVisibleSuggestionChunks(1);
    }
  }, [fallbackChunks]);

  const fallbackChunkCount = fallbackChunks.length;

  const visibleFallbackSuggestions = useMemo(
    () => fallbackChunks.slice(0, visibleSuggestionChunks).flat(),
    [fallbackChunks, visibleSuggestionChunks]
  );

  const hasMoreFallbackSuggestions = visibleSuggestionChunks < fallbackChunkCount;

  const handleShowMoreSuggestions = useCallback(() => {
    setVisibleSuggestionChunks((prev) => Math.min(prev + 1, fallbackChunkCount));
  }, [fallbackChunkCount]);

  const handleQuickFilter = useCallback(
    (type: QuickFilterType, rawValue: string) => {
      const value = rawValue.trim();
      if (!value) return;

      const nextFilters: FilterState = {
        ...filters,
        ...(filters.tags ? { tags: [...filters.tags] } : {}),
      };

      let didChange = false;

      switch (type) {
        case 'tag': {
          const nextTags = new Set(nextFilters.tags);
          if (!nextTags.has(value)) {
            nextTags.add(value);
            nextFilters.tags = [...nextTags];
            didChange = true;
          }

          break;
        }
        case 'author': {
          if (nextFilters.author !== value) {
            nextFilters.author = value;
            didChange = true;
          }

          break;
        }
        case 'category': {
          const typedValue = value as Database['public']['Enums']['content_category'];
          if (nextFilters.category !== typedValue) {
            nextFilters.category = typedValue;
            didChange = true;
          }

          break;
        }
        // No default
      }

      if (!didChange) {
        return;
      }

      setFilters(nextFilters);
      handleSearch(searchQuery, nextFilters, {
        quickFilterType: type,
        quickFilterValue: value,
      }).catch(() => {
        // Errors already logged inside handleSearch.
      });
    },
    [filters, handleSearch, searchQuery]
  );

  const handleSavedSearchSelect = useCallback(
    (presetId: string) => {
      const preset = applyPreset(presetId);
      if (!preset) return;
      const nextFilters = preset.filters ?? {};
      setFilters(nextFilters);
      handleSearch(preset.query, nextFilters).catch(() => {
        // Errors already logged inside handleSearch.
      });
    },
    [applyPreset, handleSearch]
  );

  const handleSavedSearchRemove = useCallback(
    (presetId: string) => {
      removePreset(presetId);
    },
    [removePreset]
  );

  const handleSavePresetRequest = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (!(trimmedQuery || hasFilterCriteria(filters))) {
      return;
    }
    const baseLabel = trimmedQuery || title || 'Saved search';
    const label = baseLabel.slice(0, 80);
    savePreset({
      label,
      query: searchQuery,
      filters,
    });
  }, [filters, savePreset, searchQuery, title]);

  // Reset results when initial items change
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(items);
    }
  }, [items, searchQuery]);

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
            (item) => (item as { tags?: null | string[] }).tags ?? []
          );

    const derivedAuthors =
      normalizedProvidedAuthors.length > 0
        ? normalizedProvidedAuthors
        : collectStringsFromItems(
            combinedItems,
            (item) =>
              (item as { author?: null | string }).author ??
              (item as { created_by?: null | string }).created_by ??
              null
          );

    const derivedCategories =
      normalizedProvidedCategories.length > 0
        ? normalizedProvidedCategories
        : collectStringsFromItems(
            combinedItems,
            (item) => (item as { category?: null | string }).category ?? null
          );

    return {
      tags: derivedTags,
      authors: derivedAuthors,
      categories: derivedCategories,
    };
  }, [combinedItems, providedTags, providedAuthors, providedCategories]);

  const resolvedQuickTagOptions = useMemo(() => {
    const provided = sanitizeStringList(quickTags);
    if (provided.length > 0) {
      return provided.slice(0, QUICK_TAG_LIMIT);
    }
    return filterOptions.tags.slice(0, QUICK_TAG_LIMIT);
  }, [filterOptions.tags, quickTags]);

  const resolvedQuickAuthorOptions = useMemo(() => {
    const provided = sanitizeStringList(quickAuthors);
    if (provided.length > 0) {
      return provided.slice(0, QUICK_AUTHOR_LIMIT);
    }
    return filterOptions.authors.slice(0, QUICK_AUTHOR_LIMIT);
  }, [filterOptions.authors, quickAuthors]);

  const resolvedQuickCategoryOptions = useMemo(() => {
    const provided =
      Array.isArray(quickCategories) && quickCategories.length > 0
        ? quickCategories
        : filterOptions.categories;
    return provided.slice(0, QUICK_CATEGORY_LIMIT);
  }, [filterOptions.categories, quickCategories]);

  const quickFiltersAvailable =
    resolvedQuickTagOptions.length > 0 ||
    resolvedQuickAuthorOptions.length > 0 ||
    resolvedQuickCategoryOptions.length > 0;

  const renderSuggestionCard = useCallback(
    (item: DisplayableContent) => (
      <ConfigCard
        item={item}
        variant="default"
        showCategory
        showActions
        searchQuery={searchQuery}
      />
    ),
    [searchQuery]
  );

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
          {...(presetsLoaded && presets.length > 0 ? { savedSearches: presets } : {})}
          onSelectSavedSearch={handleSavedSearchSelect}
          onRemoveSavedSearch={handleSavedSearchRemove}
          onSavePresetRequest={handleSavePresetRequest}
          isPresetSaveDisabled={!presetsLoaded || presetsAtLimit}
        />
      </ErrorBoundary>

      {filteredItems.length > 0 ? (
        <ErrorBoundary>
          <UnifiedCardGrid
            items={filteredItems}
            variant="normal"
            infiniteScroll
            batchSize={30}
            emptyMessage={`No ${title.toLowerCase()} found`}
            ariaLabel="Search results"
            keyExtractor={(item, index) => item.slug ?? `fallback-${index}`}
            renderCard={(item) => (
              <ConfigCard
                item={item}
                variant="default"
                showCategory
                showActions
                searchQuery={searchQuery}
              />
            )}
          />
        </ErrorBoundary>
      ) : (
        <div className="border-border/60 bg-card/40 rounded-3xl border p-8 text-center shadow-inner">
          {(() => {
            const IconComponent = ICON_NAME_MAP[icon] || HelpCircle;
            return (
              <IconComponent
                className="text-muted-foreground/50 mx-auto mb-4 h-16 w-16"
                aria-hidden="true"
              />
            );
          })()}
          <h2 className="mb-2 text-lg font-semibold">No {title.toLowerCase()} found</h2>
          <p className="text-muted-foreground mb-6">
            Try a suggested filter or explore popular configurations from this week.
          </p>

          {quickFiltersAvailable ? (
            <div className="mb-6 space-y-2">
              <p className="text-muted-foreground text-xs tracking-wide uppercase">Quick filters</p>
              <div className="flex flex-wrap justify-center gap-2">
                {resolvedQuickTagOptions.map((tag) => (
                  <Button
                    key={`tag-${tag}`}
                    variant="outline"
                    size="sm"
                    aria-label={`Filter by tag ${tag}`}
                    onClick={() => handleQuickFilter('tag', tag)}
                  >
                    #{tag}
                  </Button>
                ))}
                {resolvedQuickAuthorOptions.map((author) => (
                  <Button
                    key={`author-${author}`}
                    variant="outline"
                    size="sm"
                    aria-label={`Filter by author ${author}`}
                    onClick={() => handleQuickFilter('author', author)}
                  >
                    {author}
                  </Button>
                ))}
                {resolvedQuickCategoryOptions.map((cat) => (
                  <Button
                    key={`category-${cat}`}
                    variant="outline"
                    size="sm"
                    aria-label={`Filter by category ${cat}`}
                    onClick={() => handleQuickFilter('category', cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {visibleFallbackSuggestions.length > 0 && (
            <div className="space-y-3 text-left">
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                Trending &nbsp;•&nbsp; Suggested picks
              </p>
              <ErrorBoundary>
                <UnifiedCardGrid
                  items={visibleFallbackSuggestions}
                  variant="normal"
                  infiniteScroll={false}
                  batchSize={visibleFallbackSuggestions.length}
                  emptyMessage="No suggestions available"
                  ariaLabel="Suggested content"
                  keyExtractor={(item, index) => item.slug ?? `suggestion-${index}`}
                  renderCard={renderSuggestionCard}
                />
              </ErrorBoundary>
              {hasMoreFallbackSuggestions ? (
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowMoreSuggestions}
                    aria-label="Show more suggested configurations"
                  >
                    Show more suggestions
                  </Button>
                </div>
              ) : null}
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
