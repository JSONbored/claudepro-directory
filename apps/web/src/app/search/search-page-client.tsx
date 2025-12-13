'use client';

/**
 * Search Page Client - New Unified Search System
 *
 * Client component that wraps the unified search system for the /search page.
 * Replaces ContentSearchClient with new SearchProvider + SearchBar + SearchResults.
 *
 * @module apps/web/src/app/search/search-page-client
 */

import { usePulse } from '@heyclaude/web-runtime/hooks';
import {
  SearchBar,
  SearchFilters,
  SearchProvider,
  SearchResults,
  useSearchAPI,
} from '@heyclaude/web-runtime/search';
import { type FilterState } from '@heyclaude/web-runtime/types/component.types';
import { usePathname } from 'next/navigation';
import { Suspense, useCallback } from 'react';

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
 * @param root0
 * @param root0.availableTags
 * @param root0.availableAuthors
 * @param root0.availableCategories
 */
export function SearchPageClient({
  availableAuthors = [],
  availableCategories = [],
  availableTags = [],
}: SearchPageClientProps) {
  const pulse = usePulse();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();
  const searchFunction = useSearchAPI({
    apiPath: '/api/search',
    limit: 50,
    offset: 0,
  });

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

  return (
    <SearchProvider defaultFilters={{}} defaultQuery="" onSearch={handleSearch}>
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
            availableAuthors={availableAuthors}
            availableCategories={availableCategories}
            availableTags={availableTags}
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
