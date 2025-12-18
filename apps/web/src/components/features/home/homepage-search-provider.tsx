'use client';

/**
 * Homepage Search Provider Wrapper
 *
 * Provides SearchProvider context for the entire homepage, including hero section.
 * This allows the hero search bar to access SearchProvider context.
 *
 * Extracts search logic from HomePageClient so it can be shared at page level.
 */

import { SearchProvider } from '@heyclaude/web-runtime/search/context/search-provider';
import { useSearchAPI } from '@heyclaude/web-runtime/search/hooks/use-search-api';
import { logClientInfo, logClientError } from '@heyclaude/web-runtime/logging/client';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { FilterState } from '@heyclaude/web-runtime/types/component.types';
import { usePulse } from '@heyclaude/web-runtime/hooks/use-pulse';
import { useCallback, type ReactNode } from 'react';

interface HomepageSearchProviderProps {
  children: ReactNode;
}

/**
 * HomepageSearchProvider - Provides SearchProvider context for entire homepage
 * 
 * Wraps both hero and content sections so search functionality is available everywhere.
 */
export function HomepageSearchProvider({ children }: HomepageSearchProviderProps) {
  const pulse = usePulse();
  const searchFunction = useSearchAPI({
    apiPath: '/api/search',
    limit: 50,
    offset: 0,
  });

  // Handle search with analytics
  // OPTIMIZATION: Reduced logging in production (only log errors, not all steps)
  const handleSearch = useCallback(
    async (query: string, filters: FilterState) => {
      const searchStart = Date.now();
      const trimmedQuery = query.trim();
      
      // OPTIMIZATION: Only log in development to reduce production overhead
      if (process.env.NODE_ENV === 'development') {
        logClientInfo(
          '[HomepageSearchProvider] handleSearch called',
          'HomepageSearchProvider.handleSearch.start',
          {
            component: 'HomepageSearchProvider',
            action: 'handle-search-start',
            query: trimmedQuery,
            queryLength: trimmedQuery.length,
            filters: JSON.stringify(filters),
            timestamp: searchStart,
          }
        );
      }
      
      try {
        const results = await searchFunction(query, filters);

        // Track search analytics (fire and forget - non-blocking)
        if (trimmedQuery) {
          pulse
            .search({
              category: 'agents',
              slug: '',
              query: trimmedQuery,
              metadata: {
                filters,
                resultCount: Array.isArray(results) ? results.length : 0,
              },
            })
            .catch((error) => {
              // Only log analytics errors in development
              if (process.env.NODE_ENV === 'development') {
                const normalized = normalizeError(error, 'Analytics tracking failed');
                logClientError(
                  '[HomepageSearchProvider] Analytics tracking error',
                  normalized,
                  'HomepageSearchProvider.handleSearch.analyticsError',
                  {
                    component: 'HomepageSearchProvider',
                    action: 'handle-search-analytics-error',
                    query: trimmedQuery,
                    timestamp: Date.now(),
                  }
                );
              }
            });
        }

        // OPTIMIZATION: Only log success in development
        if (process.env.NODE_ENV === 'development') {
          logClientInfo(
            '[HomepageSearchProvider] handleSearch completed successfully',
            'HomepageSearchProvider.handleSearch.success',
            {
              component: 'HomepageSearchProvider',
              action: 'handle-search-success',
              query: trimmedQuery,
              resultsCount: Array.isArray(results) ? results.length : 0,
              totalDuration: Date.now() - searchStart,
              timestamp: Date.now(),
            }
          );
        }

        return results;
      } catch (error) {
        // Always log errors (even in production)
        const normalized = normalizeError(error, 'handleSearch failed');
        
        logClientError(
          '[HomepageSearchProvider] handleSearch error',
          normalized,
          'HomepageSearchProvider.handleSearch.error',
          {
            component: 'HomepageSearchProvider',
            action: 'handle-search-error',
            query: trimmedQuery,
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            duration: Date.now() - searchStart,
            timestamp: Date.now(),
          }
        );
        
        throw normalized;
      }
    },
    [searchFunction, pulse]
  );

  return (
    <SearchProvider
      onSearch={handleSearch}
      defaultQuery=""
      defaultFilters={{}}
    >
      {children}
    </SearchProvider>
  );
}
