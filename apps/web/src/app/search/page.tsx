/**
 * Search Page - Database-First RPC via search_content_optimized()
 */

import { Constants, type Database } from '@heyclaude/database-types';
import type { SearchFilters } from '@heyclaude/web-runtime/core';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getHomepageData,
  getSearchFacets,
  searchContent, getHomepageCategoryIds 
} from '@heyclaude/web-runtime/data';
import type { Metadata } from 'next';
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

function isValidSort(value: string | undefined): value is SearchFilters['sort'] {
  return value !== undefined && VALID_SORT_OPTIONS.has(value as SearchFilters['sort']);
}


/**
 * Dynamic Rendering Required
 *
 * This page must use dynamic rendering because it imports from @heyclaude/web-runtime
 * which transitively imports feature-flags/flags.ts. The Vercel Flags SDK's flags/next
 * module contains module-level code that calls server functions, which cannot be
 * executed during static site generation.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

interface SearchPageProperties {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tags?: string;
    author?: string;
    sort?: string;
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

// Deferred Results Section Component for PPR
async function SearchResultsSection({
  query,
  filters,
  hasUserFilters,
  facetOptions,
  fallbackSuggestions,
  quickTags,
  quickAuthors,
  quickCategories,
  logContext,
}: {
  query: string;
  filters: SearchFilters;
  hasUserFilters: boolean;
  facetOptions: {
    tags: string[];
    authors: string[];
    categories: ContentCategory[];
  };
  fallbackSuggestions: Awaited<ReturnType<typeof searchContent>>;
  quickTags: string[];
  quickAuthors: string[];
  quickCategories: ContentCategory[];
  logContext: ReturnType<typeof createWebAppContextWithId>;
}) {
  // Section: Search Results
  const resultsSectionStart = Date.now();
  // Use noCache for search queries (cache: 'no-store' equivalent)
  const noCache = query.length > 0 || hasUserFilters;

  let results: Awaited<ReturnType<typeof searchContent>> = [];
  try {
    results = await searchContent(query, filters, noCache);
    logger.info(
      'SearchPage: search results loaded',
      withDuration(
        {
          ...logContext,
          section: 'search-results',
          queryLength: query.length,
          hasFilters: hasUserFilters,
          resultsCount: results.length,
          noCache,
        },
        resultsSectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Search content fetch failed');
    logger.error(
      'SearchPage: searchContent invocation failed',
      normalized,
      withDuration(
        {
          ...logContext,
          section: 'search-results',
          query,
          hasFilters: hasUserFilters,
          sectionDuration_ms: Date.now() - resultsSectionStart,
        },
        resultsSectionStart
      )
    );
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

export default async function SearchPage({ searchParams }: SearchPageProperties) {
  const startTime = Date.now();
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(requestId, '/search', 'SearchPage');

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
    !!validatedSort ||
    (categories?.length ?? 0) > 0 ||
    (tags?.length ?? 0) > 0 ||
    !!author;

  // Gate zero-state data behind !query && !hasFilters (Phase 3 requirement)
  const hasQueryOrFilters = query.length > 0 || hasUserFilters;

  // Section: Search Facets
  const facetsSectionStart = Date.now();
  let facetAggregate: SearchFacetAggregate | null = null;
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
    logger.info(
      'SearchPage: facets loaded',
      withDuration(
        {
          ...baseLogContext,
          section: 'facets',
          tagsCount: facetOptions.tags.length,
          authorsCount: facetOptions.authors.length,
          categoriesCount: facetOptions.categories.length,
        },
        facetsSectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Search facets fetch failed');
    logger.error(
      'SearchPage: getSearchFacets invocation failed',
      normalized,
      withDuration(
        {
          ...baseLogContext,
          section: 'facets',
          sectionDuration_ms: Date.now() - facetsSectionStart,
        },
        startTime
      )
    );
  }

  // Section: Zero-State Suggestions
  const suggestionsSectionStart = Date.now();
  let zeroStateSuggestions: Awaited<ReturnType<typeof searchContent>> = [];
  if (!hasQueryOrFilters) {
    try {
      const homepageData = await getHomepageData(getHomepageCategoryIds);
      const categoryData = (homepageData?.content as { categoryData?: Record<string, unknown[]> })
        .categoryData;
      zeroStateSuggestions = categoryData
        ? (Object.values(categoryData).flat() as Awaited<ReturnType<typeof searchContent>>)
        : [];
      logger.info(
        'SearchPage: zero-state suggestions loaded',
        withDuration(
          {
            ...baseLogContext,
            section: 'zero-state-suggestions',
            suggestionsCount: zeroStateSuggestions.length,
          },
          suggestionsSectionStart
        )
      );
    } catch (error) {
      const normalized = normalizeError(
        error,
        'SearchPage: getHomepageData for suggestions failed'
      );
      logger.error(
        'SearchPage: suggestions fetch failed',
        normalized,
        withDuration(
          {
            ...baseLogContext,
            section: 'zero-state-suggestions',
            sectionDuration_ms: Date.now() - suggestionsSectionStart,
          },
          startTime
        )
      );
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
  logger.info(
    'SearchPage: page render completed',
    withDuration(
      {
        ...baseLogContext,
        section: 'page-render',
        hasQuery: query.length > 0,
        hasFilters: hasUserFilters,
        facetsLoaded: !!facetAggregate,
        suggestionsCount: zeroStateSuggestions.length,
      },
      startTime
    )
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-bold text-4xl">
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
            logContext={baseLogContext}
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

function dedupeSuggestions<T extends { slug?: string | null }>(items: T[], limit: number): T[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const slug = (item as { slug?: string | null }).slug;
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
