'use client';

/**
 * Category Page Search Client - New Unified Search System
 *
 * Client component that wraps the unified search system for category pages.
 * Replaces ContentSearchClient with new SearchProvider + SearchBar + SearchResults.
 *
 * @module apps/web/src/app/[category]/category-page-search-client
 */

import { type content_category } from '@heyclaude/data-layer/prisma';
import { usePulse } from '@heyclaude/web-runtime/hooks/use-pulse';
import { SearchProvider } from '@heyclaude/web-runtime/search/context/search-provider';
import { SearchBar } from '@heyclaude/web-runtime/search/components/search-bar';
import { SearchFilters } from '@heyclaude/web-runtime/search/components/search-filters';
import { SearchResults } from '@heyclaude/web-runtime/search/components/search-results';
import { useSearchAPI } from '@heyclaude/web-runtime/search/hooks/use-search-api';
import { type FilterState } from '@heyclaude/web-runtime/types/component.types';
import { usePathname } from 'next/navigation';
import { Suspense, useCallback, useMemo } from 'react';

import { useAuthModal } from '@/src/hooks/use-auth-modal';

export interface CategoryPageSearchClientProps {
  /** Available authors for filters */
  availableAuthors?: readonly string[];
  /** Available categories for filters */
  availableCategories?: readonly string[];
  /** Available tags for filters */
  availableTags?: readonly string[];
  /** Category for this page */
  category: content_category;
  /** Search placeholder text */
  searchPlaceholder: string;
}

/**
 * CategoryPageSearchClient - Unified search for category pages
 *
 * React Compiler automatically handles memoization (reactCompiler: true in next.config.mjs).
 * We only use useMemo/useCallback here to ensure stable prop references for child components.
 * @param root0
 * @param root0.availableAuthors
 * @param root0.availableCategories
 * @param root0.availableTags
 * @param root0.category
 * @param root0.searchPlaceholder
 */
export function CategoryPageSearchClient({
  availableAuthors = [],
  availableCategories = [],
  availableTags = [],
  category,
  searchPlaceholder,
}: CategoryPageSearchClientProps) {
  const pulse = usePulse();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  // OPTIMIZATION: Memoize prop arrays to ensure stable references for child components
  // React Compiler handles component memoization automatically
  const stableAuthors = useMemo(() => availableAuthors, [availableAuthors]);
  const stableCategories = useMemo(() => availableCategories, [availableCategories]);
  const stableTags = useMemo(() => availableTags, [availableTags]);

  // OPTIMIZATION: Memoize search API configuration to prevent recreation
  const searchApiConfig = useMemo(
    () => ({
      apiPath: '/api/search',
      limit: 50,
      offset: 0,
    }),
    []
  );

  const searchFunction = useSearchAPI(searchApiConfig);

  // Handle search with analytics
  const handleSearch = useCallback(
    async (query: string, filters: FilterState) => {
      // Add category filter to search
      const searchFilters: FilterState = {
        ...filters,
        category,
      };

      const results = await searchFunction(query, searchFilters);

      // Track search analytics (fire and forget)
      if (query.trim()) {
        pulse
          .search({
            category,
            metadata: {
              filters: searchFilters,
              resultCount: results.length,
            },
            query: query.trim(),
            slug: '',
          })
          .catch(() => {
            // Errors already logged
          });
      }

      return results;
    },
    [searchFunction, pulse, category]
  );

  // Handle auth required
  const handleAuthRequired = useCallback(() => {
    openAuthModal({
      redirectTo: pathname ?? undefined,
      valueProposition: 'Sign in to save bookmarks',
    });
  }, [openAuthModal, pathname]);

  // OPTIMIZATION: Memoize defaultFilters to ensure stable reference
  const defaultFilters = useMemo(() => ({ category }), [category]);

  return (
    <SearchProvider defaultFilters={defaultFilters} defaultQuery="" onSearch={handleSearch}>
      <div className="space-y-6">
        {/* Search Bar */}
        <SearchBar placeholder={searchPlaceholder} size="lg" variant="default" />

        {/* Search Filters */}
        <Suspense
          fallback={<div className="text-muted-foreground p-4 text-center">Loading filters...</div>}
        >
          <SearchFilters
            availableAuthors={stableAuthors}
            availableCategories={stableCategories}
            availableTags={stableTags}
          />
        </Suspense>

        {/* Search Results */}
        <Suspense
          fallback={
            <div className="text-muted-foreground p-8 text-center">Loading search results...</div>
          }
        >
          <SearchResults showActions showCategory onAuthRequired={handleAuthRequired} />
        </Suspense>
      </div>
    </SearchProvider>
  );
}
