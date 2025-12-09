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
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { Suspense } from 'react';

import { ContentSearchClient } from '@/src/components/content/content-search';
import { ContentSidebar } from '@/src/components/core/layout/content-sidebar';

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */

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

interface SearchPageProperties {
  searchParams: Promise<{
    author?: string;
    category?: string;
    q?: string;
    sort?: string;
    tags?: string;
  }>;
}

/**
 * Produce page metadata for the search results page, incorporating the resolved search query when present.
 *
 * Resolves the incoming search parameters at request time and builds a title and description that reflect the `q` query value if provided.
 *
 * @param searchParams - A promise resolving to an object of optional search parameters (for example, `q`) used to tailor the metadata.
 * @param searchParams.searchParams
 * @returns The Metadata object for the search page (title and description reflect the resolved query when available).
 *
 * @see generatePageMetadata
 */
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
 * Render the search results section and present matching content for the current query and filters.
 *
 * @param query.facetOptions
 * @param query.facetOptions.authors
 * @param query.facetOptions.categories
 * @param query.facetOptions.tags
 * @param query.fallbackSuggestions
 * @param query.filters
 * @param query.hasUserFilters
 * @param query - The user-entered search query string (trimmed and truncated upstream).
 * @param filters - SearchFilters that constrain the search (sort, categories, tags, authors, limit).
 * @param hasUserFilters - True when any non-empty filter or a valid sort is applied by the user.
 * @param facetOptions.authors - Available author facet values to populate the UI controls.
 * @param facetOptions.categories - Available category facet values to populate the UI controls.
 * @param facetOptions.tags - Available tag facet values to populate the UI controls.
 * @param fallbackSuggestions - Fallback/zero-state suggestions to surface when results are absent.
 * @param query.query
 * @param query.quickAuthors
 * @param query.quickCategories
 * @param quickTags - Precomputed quick tag suggestions for the UI.
 * @param quickAuthors - Precomputed quick author suggestions for the UI.
 * @param quickCategories - Precomputed quick category suggestions for the UI.
 * @param query.quickTags
 * @returns A React element configured with fetched search results, available facets, quick suggestions, and zero-state fallbacks.
 *
 * @throws A normalized error when the backend search fetch fails.
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
}) {
  // Create request-scoped child logger
  const sectionLogger = logger.child({
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
 * Renders the search page shell immediately and streams dynamic search facets, results, and sidebar content via Suspense.
 *
 * This server component produces a static header and layout for partial page rendering (PPR) and defers request-scoped work to runtime (awaits `connection()`), then renders dynamic content inside a Suspense boundary: facets (cached), search results (query/filters dependent), zero-state suggestions (when no query), and the unified sidebar.
 *
 * @param searchParams - Promise resolving to route query parameters; may include `q`, `category`, `tags`, `author`, and `sort` used to derive the search query and filters.
 * @param searchParams.searchParams
 * @returns A React element containing the search input, results section, facet controls, zero-state/fallback suggestions, and the unified content sidebar.
 *
 * @see getSearchFacets
 * @see getHomepageData
 * @see ContentSearchClient
 * @see SearchResultsSection
 * @see ContentSidebar
 */
export default async function SearchPage({ searchParams }: SearchPageProperties) {
  // Note: Cannot use 'use cache' on pages with searchParams - they're dynamic
  // Data layer caching is already in place for optimal performance

  // Create request-scoped child logger
  const reqLogger = logger.child({
    operation: 'SearchPage',
    route: '/search',
    module: 'apps/web/src/app/search',
  });

  // Static shell - renders immediately for PPR
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold">Search Claude Code Directory</h1>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Dynamic content streams in Suspense */}
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchPageContent searchParams={searchParams} reqLogger={reqLogger} />
        </Suspense>
        {/* Sidebar - Unified ContentSidebar with JobsPromo + RecentlyViewed */}
        <ContentSidebar />
      </div>
    </main>
  );
}

/**
 * Renders a lightweight skeleton of the search results UI used while real results are loading.
 *
 * This component provides a fully-configured ContentSearchClient with empty data and suggestions
 * so it can be used as a Suspense fallback without visual layout shift.
 *
 * @see ContentSearchClient
 * @see SearchResultsSkeleton
 */
function SearchResultsSkeleton() {
  return (
    <ContentSearchClient
      items={[]}
      type={Constants.public.Enums.content_category[0]}
      searchPlaceholder="Search agents, MCP servers, rules, commands..."
      title="Results"
      icon="Search"
      availableTags={[]}
      availableAuthors={[]}
      availableCategories={[]}
      zeroStateSuggestions={[]}
      fallbackSuggestions={[]}
      quickTags={[]}
      quickAuthors={[]}
      quickCategories={[]}
    />
  );
}

/**
 * Prepare search query and filter state from route parameters and render the search facets + results UI.
 *
 * Resolves the incoming `searchParams` promise, normalizes and limits the free-text query to 200 characters,
 * parses comma-separated `category` and `tags` values, validates `sort`, and builds a SearchFilters object.
 * Determines whether user-applied filters or a query are present and passes computed state to SearchFacetsAndResults.
 *
 * @param searchParams.reqLogger
 * @param searchParams - Promise that resolves to route query params; `q` is trimmed and capped at 200 characters, `category` and `tags` may be comma-separated lists.
 * @param reqLogger - Request-scoped logger child used for correlated logging during downstream fetches.
 * @param searchParams.searchParams
 * @returns The React element that renders facets and search results (SearchFacetsAndResults).
 *
 * @see SearchFacetsAndResults
 * @see isValidSort
 */
async function SearchPageContent({
  searchParams,
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
  searchParams: Promise<{
    author?: string;
    category?: string;
    q?: string;
    sort?: string;
    tags?: string;
  }>;
}) {
  const resolvedParameters = await searchParams;

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

  // Load facets and results - facets are cached but still need to load
  return (
    <SearchFacetsAndResults
      query={query}
      filters={filters}
      hasUserFilters={hasUserFilters}
      hasQueryOrFilters={hasQueryOrFilters}
      reqLogger={reqLogger}
    />
  );
}

/**
 * Coordinates loading of facet data and zero-state suggestions (when no query/filters), computes quick suggestion lists, and renders the search results section inside a Suspense boundary.
 *
 * @param root0
 * @param root0.filters
 * @param root0.hasQueryOrFilters
 * @param root0.hasUserFilters
 * @param props.query - The trimmed search query to run.
 * @param props.filters - SearchFilters constructed from incoming search parameters.
 * @param props.hasUserFilters - True if the request includes any user-applied filters.
 * @param props.hasQueryOrFilters - True if there is a non-empty query or any user filters.
 * @param root0.query
 * @param props.reqLogger - Request-scoped logger created from the global logger.
 * @param root0.reqLogger
 * @returns A Suspense-wrapped SearchResultsSection React element populated with facet options, quick tags/authors/categories, and fallback suggestions.
 * @see SearchResultsSection
 * @see getSearchFacets
 */
async function SearchFacetsAndResults({
  query,
  filters,
  hasUserFilters,
  hasQueryOrFilters,
  reqLogger,
}: {
  filters: SearchFilters;
  hasQueryOrFilters: boolean;
  hasUserFilters: boolean;
  query: string;
  reqLogger: ReturnType<typeof logger.child>;
}) {
  // Load facets (cached, but still needs to fetch)
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

  // Load zero-state suggestions after facets (if no query/filters)
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
  reqLogger.info('SearchPage: facets and suggestions loaded', {
    section: 'facets-and-suggestions',
    hasQuery: query.length > 0,
    hasFilters: hasUserFilters,
    facetsLoaded: !!facetAggregate,
    suggestionsCount: zeroStateSuggestions.length,
  });

  // Now load results (depends on facets for UI, but can load in parallel)
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchResultsSection
        query={query}
        filters={filters}
        hasUserFilters={hasUserFilters}
        facetOptions={facetOptions}
        fallbackSuggestions={fallbackSuggestions}
        quickTags={quickTags}
        quickAuthors={quickAuthors}
        quickCategories={quickCategories}
      />
    </Suspense>
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

/**
 * Produce an ordered list of suggestions with duplicate `slug` values removed and capped to a maximum length.
 *
 * If `items` is not an array or is empty, an empty array is returned.
 *
 * @param items - Array of suggestion-like objects; each item may include an optional `slug` string used to detect duplicates. The first occurrence of a given `slug` is kept and later duplicates are dropped.
 * @param limit - Maximum number of items to include in the returned array.
 * @returns An array containing up to `limit` items with duplicate `slug` values removed, preserving the original input order.
 *
 * @see rankFacetValues
 * @see deriveQuickCategories
 */
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
