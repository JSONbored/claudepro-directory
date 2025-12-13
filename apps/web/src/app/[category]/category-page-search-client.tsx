'use client';

/**
 * Category Page Search Client - New Unified Search System
 *
 * Client component that wraps the unified search system for category pages.
 * Replaces ContentSearchClient with new SearchProvider + SearchBar + SearchResults.
 *
 * @module apps/web/src/app/[category]/category-page-search-client
 */

import { type Database } from '@heyclaude/database-types';
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

export interface CategoryPageSearchClientProps {
  /** Available authors for filters */
  availableAuthors?: readonly string[];
  /** Available categories for filters */
  availableCategories?: readonly string[];
  /** Available tags for filters */
  availableTags?: readonly string[];
  /** Category for this page */
  category: Database['public']['Enums']['content_category'];
  /** Search placeholder text */
  searchPlaceholder: string;
}

/**
 * CategoryPageSearchClient - Unified search for category pages
 * @param root0
 * @param root0.category
 * @param root0.searchPlaceholder
 * @param root0.availableTags
 * @param root0.availableAuthors
 * @param root0.availableCategories
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
  const searchFunction = useSearchAPI({
    apiPath: '/api/search',
    limit: 50,
    offset: 0,
  });

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

  return (
    <SearchProvider defaultFilters={{ category }} defaultQuery="" onSearch={handleSearch}>
      <div className="space-y-6">
        {/* Search Bar */}
        <SearchBar placeholder={searchPlaceholder} size="lg" variant="default" />

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
          <SearchResults showActions showCategory onAuthRequired={handleAuthRequired} />
        </Suspense>
      </div>
    </SearchProvider>
  );
}
