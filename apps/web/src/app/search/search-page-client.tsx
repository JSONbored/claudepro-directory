'use client';

/**
 * Search Page Client - New Unified Search System
 *
 * Client component that wraps the unified search system for the /search page.
 * Replaces ContentSearchClient with new SearchProvider + SearchBar + SearchResults.
 *
 * @module apps/web/src/app/search/search-page-client
 */

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

export interface SearchPageClientProps {
  /** Available authors for filters */
  availableAuthors?: readonly string[];
  /** Available categories for filters */
  availableCategories?: readonly string[];
  /** Available tags for filters */
  availableTags?: readonly string[];
}

/**
 * SearchPageClient - Unified search for /search page
 *
 * React Compiler automatically handles memoization (reactCompiler: true in next.config.mjs).
 * We only use useMemo/useCallback here to ensure stable prop references for child components.
 * @param root0
 * @param root0.availableAuthors
 * @param root0.availableCategories
 * @param root0.availableTags
 */
export function SearchPageClient({
  availableAuthors = [],
  availableCategories = [],
  availableTags = [],
}: SearchPageClientProps) {
  const pulse = usePulse();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  // OPTIMIZATION: Memoize prop arrays to ensure stable references
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
      const results = await searchFunction(query, filters);

      // Track search analytics (fire and forget)
      if (query.trim()) {
        pulse
          .search({
            category: 'agents',
            metadata: {
              filters,
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
    [searchFunction, pulse]
  );

  // Handle auth required
  const handleAuthRequired = useCallback(() => {
    openAuthModal({
      redirectTo: pathname ?? undefined,
      valueProposition: 'Sign in to save bookmarks',
    });
  }, [openAuthModal, pathname]);

  // OPTIMIZATION: Memoize default filters to prevent recreation
  const defaultFilters = useMemo(() => ({}), []);

  // OPTIMIZATION: Memoize default query to prevent recreation
  const defaultQuery = useMemo(() => '', []);

  return (
    <SearchProvider
      defaultFilters={defaultFilters}
      defaultQuery={defaultQuery}
      onSearch={handleSearch}
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <SearchBar
          placeholder="Search agents, MCP servers, rules, commands..."
          size="lg"
          variant="default"
        />

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
          <SearchResults onAuthRequired={handleAuthRequired} showActions showCategory />
        </Suspense>
      </div>
    </SearchProvider>
  );
}
