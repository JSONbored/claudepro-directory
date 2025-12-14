'use client';

/**
 * Homepage Search Provider Wrapper
 *
 * Provides SearchProvider context for the entire homepage, including hero section.
 * This allows the hero search bar to access SearchProvider context.
 *
 * Extracts search logic from HomePageClient so it can be shared at page level.
 */

import { SearchProvider, useSearchAPI } from '@heyclaude/web-runtime/search';
import { logClientInfo, logClientError } from '@heyclaude/web-runtime/logging/client';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { FilterState } from '@heyclaude/web-runtime/types/component.types';
import { usePulse } from '@heyclaude/web-runtime/hooks';
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
  const handleSearch = useCallback(
    async (query: string, filters: FilterState) => {
      const searchStart = Date.now();
      
      logClientInfo(
        '[HomepageSearchProvider] handleSearch called',
        'HomepageSearchProvider.handleSearch.start',
        {
          component: 'HomepageSearchProvider',
          action: 'handle-search-start',
          query: query.trim(),
          queryLength: query.trim().length,
          filters: JSON.stringify(filters),
          timestamp: searchStart,
        }
      );
      
      try {
        const functionCallStart = Date.now();
        const results = await searchFunction(query, filters);
        const functionCallDuration = Date.now() - functionCallStart;
        
        logClientInfo(
          '[HomepageSearchProvider] searchFunction completed',
          'HomepageSearchProvider.handleSearch.functionCompleted',
          {
            component: 'HomepageSearchProvider',
            action: 'handle-search-function-completed',
            query: query.trim(),
            resultsCount: Array.isArray(results) ? results.length : 0,
            isArray: Array.isArray(results),
            functionDuration: functionCallDuration,
            timestamp: Date.now(),
          }
        );

        // Track search analytics (fire and forget)
        if (query.trim()) {
          // Use 'agents' as default category for homepage search (no specific category)
          pulse
            .search({
              category: 'agents',
              slug: '',
              query: query.trim(),
              metadata: {
                filters,
                resultCount: results.length,
              },
            })
            .catch((error) => {
              const normalized = normalizeError(error, 'Analytics tracking failed');
              logClientError(
                '[HomepageSearchProvider] Analytics tracking error',
                normalized,
                'HomepageSearchProvider.handleSearch.analyticsError',
                {
                  component: 'HomepageSearchProvider',
                  action: 'handle-search-analytics-error',
                  query: query.trim(),
                  timestamp: Date.now(),
                }
              );
            });
        }

        logClientInfo(
          '[HomepageSearchProvider] handleSearch completed successfully',
          'HomepageSearchProvider.handleSearch.success',
          {
            component: 'HomepageSearchProvider',
            action: 'handle-search-success',
            query: query.trim(),
            resultsCount: Array.isArray(results) ? results.length : 0,
            totalDuration: Date.now() - searchStart,
            timestamp: Date.now(),
          }
        );

        return results;
      } catch (error) {
        const normalized = normalizeError(error, 'handleSearch failed');
        
        logClientError(
          '[HomepageSearchProvider] handleSearch error',
          normalized,
          'HomepageSearchProvider.handleSearch.error',
          {
            component: 'HomepageSearchProvider',
            action: 'handle-search-error',
            query: query.trim(),
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
