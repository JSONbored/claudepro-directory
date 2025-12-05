/**
 * Search Page - Database-First RPC via search_content_optimized()
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { type SearchFilters } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getHomepageData,
  getSearchFacets,
  searchContent,
  getHomepageCategoryIds,
} from '@heyclaude/web-runtime/data';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { Suspense } from 'react';

import { ContentSearchClient } from '@/src/components/content/content-search';
import { RecentlyViewedSidebar } from '@/src/components/features/navigation/recently-viewed-sidebar';

const VALID_SORT_OPTIONS = new Set<SearchFilters['sort']>([
  'relevance',
  'popularity',
  'newest',
  'alphabetical',
]);

const QUICK_TAG_LIMIT = 8;
const QUICK_AUTHOR_LIMIT = 6;
const QUICK_CATEGORY_LIMIT = 6;
const FALLBACK_SUGGESTION_LIMIT = 18;

type SearchFacetAggregate = Awaited<ReturnType<typeof getSearchFacets>>;
type SearchFacetSummary = SearchFacetAggregate['facets'][number];
type ContentCategory = Database['public']['Enums']['content_category'];

/**
 * Type guard that checks whether a string corresponds to one of the allowed sort options.
 *
 * @param value - The candidate sort value to validate.
 * @returns `true` if `value` is one of the entries in `VALID_SORT_OPTIONS`, `false` otherwise.
 *
 * @see VALID_SORT_OPTIONS
 * @see SearchFilters
 */
function isValidSort(value: string | undefined): value is SearchFilters['sort'] {
  return value !== undefined && VALID_SORT_OPTIONS.has(value as SearchFilters['sort']);
}

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

interface SearchPageProperties {
  searchParams: Promise<{
    author?: string;
    category?: string;
    q?: string;
    sort?: string;
    tags?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProperties): Promise<Metadata> {
  const resolvedParameters = await searchParams;
  const query = resolvedParameters.q ?? '';

  return generatePageMetadata('/search', {
    params: { q: query },
    title: query ? `Search results for "${query}"` : 'Search',
    description: query
      ? `Find agents, MCP servers, rules, commands, and more matching "${query}"`
      : 'Search the Claude Code directory',
  });
}

/**
 * Renders the search results section and fetches matching content for the current query and filters.
 *
 * Performs a server-side fetch of search results. When `query` is non-empty or `hasUserFilters` is true,
 * the fetch is performed without caching to ensure fresh results.
 *
 * @param props.query - The user-entered search query string.
 * @param props.filters - SearchFilters used to constrain the search (sort, categories, tags, authors, limit).
 * @param props.hasUserFilters - True when the user has applied any non-empty filter or sort.
 * @param props.facetOptions.authors - Available author facet values for the UI.
 * @param props.facetOptions.categories - Available category facet values for the UI.
 * @param props.facetOptions.tags - Available tag facet values for the UI.
 * @param props.fallbackSuggestions - Fallback/zero-state suggestions to show when there are no query results.
 * @param props.quickTags - Precomputed quick tag values for the UI.
 * @param props.quickAuthors - Precomputed quick author values for the UI.
 * @param props.quickCategories - Precomputed quick category values for the UI.
 * @param props.requestId - Correlation identifier used for request-scoped logging.
 *
 * @returns A React element containing a configured ContentSearchClient rendered with fetched results and facet data.
 *
 * @throws When the backend search fetch fails, a normalized error is thrown.
 *
 * @see ContentSearchClient
 * @see searchContent
 * @see normalizeError
 */
async function SearchResultsSection({
  query,
  filters,
  hasUserFilters,
  facetOptions,
  fallbackSuggestions,
  quickTags,
  quickAuthors,
  quickCategories,
  requestId,
}: {
  facetOptions: {
    authors: string[];
    categories: ContentCategory[];
    tags: string[];
  };
  fallbackSuggestions: Awaited<ReturnType<typeof searchContent>>;
  filters: SearchFilters;
  hasUserFilters: boolean;
  query: string;
  quickAuthors: string[];
  quickCategories: ContentCategory[];
  quickTags: string[];
  requestId: string;
}) {
  // Create request-scoped child logger using parent requestId for correlation
  const sectionLogger = logger.child({
    requestId,
    operation: 'SearchResultsSection',
    route: '/search',
    module: 'apps/web/src/app/search',
  });

  // Section: Search Results
  // Use noCache for search queries (cache: 'no-store' equivalent)
  const noCache = query.length > 0 || hasUserFilters;

  let results: Awaited<ReturnType<typeof searchContent>> = [];
  try {
    results = await searchContent(query, filters, noCache);
    sectionLogger.info('SearchPage: search results loaded', {
      section: 'search-results',
      queryLength: query.length,
      hasFilters: hasUserFilters,
      resultsCount: results.length,
      noCache,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Search content fetch failed');
    sectionLogger.error('SearchPage: searchContent invocation failed', normalized, {
      section: 'search-results',
      query,
      hasFilters: hasUserFilters,
    });
    throw normalized;
  }

  return (
    <ContentSearchClient
      items={results}
      type={Constants.public.Enums.content_category[0]}
      searchPlaceholder="Search agents, MCP servers, rules, commands..."
      title="Results"
      icon="Search"
      availableTags={facetOptions.tags}
      availableAuthors={facetOptions.authors}
      availableCategories={facetOptions.categories}
      zeroStateSuggestions={fallbackSuggestions}
      fallbackSuggestions={fallbackSuggestions}
      quickTags={quickTags}
      quickAuthors={quickAuthors}
      quickCategories={quickCategories}
    />
  );
}

/**
 * Renders the search page by resolving route parameters into a query and filters, loading search facets and optional zero-state suggestions, and composing the results UI with facet controls and a recently viewed sidebar.
 *
 * If there is no query and no user filters, homepage data is queried to provide zero-state suggestions.
 *
 * @param searchParams - Promise resolving to route query parameters (may include `q`, `category`, `tags`, `author`, `sort`) used to derive the search query and filters.
 * @returns The rendered React element for the search page containing the search input, results section, facet controls, zero-state/fallback suggestions, and the recently viewed sidebar.
 *
 * @see getSearchFacets
 * @see getHomepageData
 * @see ContentSearchClient
 * @see SearchResultsSection
 * @see RecentlyViewedSidebar
 */
export default async function SearchPage({ searchParams }: SearchPageProperties) {
  const resolvedParameters = await searchParams;

  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'SearchPage',
    route: '/search',
    module: 'apps/web/src/app/search',
  });

  const query = (resolvedParameters.q ?? '').trim().slice(0, 200);

  const categories = resolvedParameters.category?.split(',').filter(Boolean);
  const tags = resolvedParameters.tags?.split(',').filter(Boolean);
  const author = resolvedParameters.author;

  const filters: SearchFilters = {};

  const validatedSort = isValidSort(resolvedParameters.sort) ? resolvedParameters.sort : undefined;
  if (validatedSort) {
    filters.sort = validatedSort;
  }
  if (categories && categories.length > 0) filters.p_categories = categories;
  if (tags && tags.length > 0) filters.p_tags = tags;
  if (author) filters.p_authors = [author];
  filters.p_limit = 50;

  const hasUserFilters =
    !!validatedSort || (categories?.length ?? 0) > 0 || (tags?.length ?? 0) > 0 || !!author;

  // Gate zero-state data behind !query && !hasFilters (Phase 3 requirement)
  const hasQueryOrFilters = query.length > 0 || hasUserFilters;

  // Section: Search Facets
  let facetAggregate: null | SearchFacetAggregate = null;
  let facetOptions = {
    tags: [] as string[],
    authors: [] as string[],
    categories: [] as ContentCategory[],
  };
  try {
    facetAggregate = await getSearchFacets();
    facetOptions = {
      tags: facetAggregate.tags,
      authors: facetAggregate.authors,
      categories: facetAggregate.categories,
    };
    reqLogger.info('SearchPage: facets loaded', {
      section: 'facets',
      tagsCount: facetOptions.tags.length,
      authorsCount: facetOptions.authors.length,
      categoriesCount: facetOptions.categories.length,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Search facets fetch failed');
    reqLogger.error('SearchPage: getSearchFacets invocation failed', normalized, {
      section: 'facets',
    });
  }

  // Section: Zero-State Suggestions
  let zeroStateSuggestions: Awaited<ReturnType<typeof searchContent>> = [];
  if (!hasQueryOrFilters) {
    try {
      const homepageData = await getHomepageData(getHomepageCategoryIds);
      const categoryData = (homepageData?.content as { categoryData?: Record<string, unknown[]> })
        .categoryData;
      zeroStateSuggestions = categoryData
        ? (Object.values(categoryData).flat() as Awaited<ReturnType<typeof searchContent>>)
        : [];
      reqLogger.info('SearchPage: zero-state suggestions loaded', {
        section: 'zero-state-suggestions',
        suggestionsCount: zeroStateSuggestions.length,
      });
    } catch (error) {
      const normalized = normalizeError(
        error,
        'SearchPage: getHomepageData for suggestions failed'
      );
      reqLogger.error('SearchPage: suggestions fetch failed', normalized, {
        section: 'zero-state-suggestions',
      });
    }
  }

  const fallbackSuggestions = dedupeSuggestions(zeroStateSuggestions, FALLBACK_SUGGESTION_LIMIT);

  const quickTags = rankFacetValues(
    facetAggregate?.facets,
    (facet) => facet.tags,
    QUICK_TAG_LIMIT,
    facetOptions.tags
  );

  const quickAuthors = rankFacetValues(
    facetAggregate?.facets,
    (facet) => facet.authors,
    QUICK_AUTHOR_LIMIT,
    facetOptions.authors
  );

  const quickCategories = deriveQuickCategories(
    facetAggregate?.facets,
    QUICK_CATEGORY_LIMIT,
    facetOptions.categories
  );

  // Final summary log
  reqLogger.info('SearchPage: page render completed', {
    section: 'page-render',
    hasQuery: query.length > 0,
    hasFilters: hasUserFilters,
    facetsLoaded: !!facetAggregate,
    suggestionsCount: zeroStateSuggestions.length,
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold">
        {query ? `Search: "${query}"` : 'Search Claude Code Directory'}
      </h1>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Suspense
          fallback={
            <ContentSearchClient
              items={[]}
              type={Constants.public.Enums.content_category[0]}
              searchPlaceholder="Search agents, MCP servers, rules, commands..."
              title="Results"
              icon="Search"
              availableTags={facetOptions.tags}
              availableAuthors={facetOptions.authors}
              availableCategories={facetOptions.categories}
              zeroStateSuggestions={fallbackSuggestions}
              fallbackSuggestions={fallbackSuggestions}
              quickTags={quickTags}
              quickAuthors={quickAuthors}
              quickCategories={quickCategories}
            />
          }
        >
          <SearchResultsSection
            query={query}
            filters={filters}
            hasUserFilters={hasUserFilters}
            facetOptions={facetOptions}
            fallbackSuggestions={fallbackSuggestions}
            quickTags={quickTags}
            quickAuthors={quickAuthors}
            quickCategories={quickCategories}
            requestId={requestId}
          />
        </Suspense>
        <Suspense fallback={null}>
          <RecentlyViewedSidebar />
        </Suspense>
      </div>
    </main>
  );
}

function rankFacetValues(
  facets: SearchFacetSummary[] | undefined,
  selector: (facet: SearchFacetSummary) => string[],
  limit: number,
  fallback: string[]
): string[] {
  if (!facets || facets.length === 0) {
    return fallback.slice(0, limit);
  }

  const counts = new Map<string, number>();
  for (const facet of facets) {
    const weight = Math.max(1, facet.contentCount);
    for (const rawValue of selector(facet)) {
      if (!rawValue) continue;
      const normalized = rawValue.trim();
      if (!normalized) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + weight);
    }
  }

  if (counts.size === 0) {
    return fallback.slice(0, limit);
  }

  return [...counts.entries()]
    .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function deriveQuickCategories(
  facets: SearchFacetSummary[] | undefined,
  limit: number,
  fallback: ContentCategory[]
): ContentCategory[] {
  if (!facets || facets.length === 0) {
    return fallback.slice(0, limit);
  }

  return [...facets]
    .toSorted(
      (a, b) => b.contentCount - a.contentCount || a.category.localeCompare(b.category) // alphabetical tiebreaker
    )
    .map((facet) => facet.category)
    .slice(0, limit);
}

function dedupeSuggestions<T extends { slug?: null | string }>(items: T[], limit: number): T[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const slug = (item as { slug?: null | string }).slug;
    if (typeof slug === 'string' && slug.length > 0) {
      if (seen.has(slug)) {
        continue;
      }
      seen.add(slug);
    }
    result.push(item);
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}