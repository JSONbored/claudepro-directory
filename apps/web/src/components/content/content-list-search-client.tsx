'use client';

/**
 * Content List Search Client - New Unified Search System
 *
 * Client component that wraps the unified search system for content list pages.
 * Replaces ContentSearchClient with new SearchProvider + SearchBar + SearchResults.
 *
 * @module apps/web/src/components/content/content-list-search-client
 */

import type { content_category } from '@heyclaude/data-layer/prisma';
import { SearchProvider } from '@heyclaude/web-runtime/search/context/search-provider';
import { SearchBar } from '@heyclaude/web-runtime/search/components/search-bar';
import { SearchResults } from '@heyclaude/web-runtime/search/components/search-results';
import { SearchFilters } from '@heyclaude/web-runtime/search/components/search-filters';
import { useSearchAPI } from '@heyclaude/web-runtime/search/hooks/use-search-api';
import { usePulse } from '@heyclaude/web-runtime/hooks/use-pulse';
import type { FilterState } from '@heyclaude/web-runtime/types/component.types';
import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { Suspense, useCallback } from 'react';
import { useAuthModal } from '@/src/hooks/use-auth-modal';
import { usePathname } from 'next/navigation';

export interface ContentListSearchClientProps<T extends DisplayableContent> {
  /** Initial items to display */
  items: readonly T[];
  /** Search placeholder text */
  searchPlaceholder: string;
  /** Page title */
  title: string;
  /** Icon name */
  icon: string;
  /** Content type */
  type: content_category;
  /** Optional category filter */
  category?: content_category;
}

/**
 * ContentListSearchClient - Unified search for content list pages
 */
export function ContentListSearchClient<T extends DisplayableContent>({
  searchPlaceholder,
  category,
  type,
}: ContentListSearchClientProps<T>) {
  const pulse = usePulse();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();
  const searchFunction = useSearchAPI({
    apiPath: '/api/search',
    limit: 100,
    offset: 0,
  });

  // Handle search with analytics
  const handleSearch = useCallback(
    async (query: string, filters: FilterState) => {
      const searchFilters: FilterState = {
        ...filters,
        ...(category && { category }),
      };

      const results = await searchFunction(query, searchFilters);

      if (query.trim()) {
        pulse
          .search({
            category: category || type || 'agents',
            slug: '',
            query: query.trim(),
            metadata: {
              filters: searchFilters,
              resultCount: results.length,
            },
          })
          .catch(() => {
            // Errors already logged
          });
      }

      return results;
    },
    [searchFunction, pulse, category, type]
  );

  // Handle auth required
  const handleAuthRequired = useCallback(() => {
    openAuthModal({
      valueProposition: 'Sign in to save bookmarks',
      redirectTo: pathname ?? undefined,
    });
  }, [openAuthModal, pathname]);

  return (
    <SearchProvider
      onSearch={handleSearch}
      defaultQuery=""
      defaultFilters={category ? { category } : {}}
    >
      <div className="space-y-6">
        <SearchBar
          placeholder={searchPlaceholder}
          variant="default"
          size="lg"
        />

        <Suspense fallback={<div className="text-muted-foreground p-4 text-center">Loading filters...</div>}>
          <SearchFilters />
        </Suspense>

        <Suspense fallback={<div className="text-muted-foreground p-8 text-center">Loading search results...</div>}>
          <SearchResults
            showCategory
            showActions
            onAuthRequired={handleAuthRequired}
          />
        </Suspense>
      </div>
    </SearchProvider>
  );
}
