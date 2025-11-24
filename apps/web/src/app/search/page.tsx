/**
 * Search Page - Database-First RPC via search_content_optimized()
 */

import type { Database } from '@heyclaude/database-types';
import type { SearchFilters } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getHomepageData,
  getSearchFacets,
  searchContent,
} from '@heyclaude/web-runtime/data';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ContentSearchClient } from '@/src/components/content/content-search';
import { RecentlyViewedSidebar } from '@/src/components/features/navigation/recently-viewed-sidebar';

const VALID_SORT_OPTIONS: SearchFilters['sort'][] = [
  'relevance',
  'popularity',
  'newest',
  'alphabetical',
];

const QUICK_TAG_LIMIT = 8;
const QUICK_AUTHOR_LIMIT = 6;
const QUICK_CATEGORY_LIMIT = 6;
const FALLBACK_SUGGESTION_LIMIT = 18;

type SearchFacetAggregate = Awaited<ReturnType<typeof getSearchFacets>>;
type SearchFacetSummary = SearchFacetAggregate['facets'][number];
type ContentCategory = Database['public']['Enums']['content_category'];

function isValidSort(value: string | undefined): value is SearchFilters['sort'] {
  return VALID_SORT_OPTIONS.some((option) => option === value);
}

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { getHomepageCategoryIds } from '@heyclaude/web-runtime/data';

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

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tags?: string;
    author?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';

  return generatePageMetadata('/search', {
    params: { q: query },
    title: query ? `Search results for "${query}"` : 'Search',
    description: query
      ? `Find agents, MCP servers, rules, commands, and more matching "${query}"`
      : 'Search the Claude Code directory',
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const query = (resolvedParams.q || '').trim().slice(0, 200);

  const categories = resolvedParams.category?.split(',').filter(Boolean);
  const tags = resolvedParams.tags?.split(',').filter(Boolean);
  const author = resolvedParams.author;

  const filters: SearchFilters = {};

  const validatedSort = isValidSort(resolvedParams.sort) ? resolvedParams.sort : undefined;
  if (validatedSort) {
    filters.sort = validatedSort;
  }
  if (categories && categories.length > 0) filters.p_categories = categories;
  if (tags && tags.length > 0) filters.p_tags = tags;
  if (author) filters.p_authors = [author];
  filters.p_limit = 50;

  const hasUserFilters =
    !!validatedSort ||
    (categories && categories.length > 0) ||
    (tags && tags.length > 0) ||
    !!author;

  let results: Awaited<ReturnType<typeof searchContent>> = [];
  try {
    results = await searchContent(query, filters);
  } catch (error) {
    const normalized = normalizeError(error, 'Search content fetch failed');
    logger.error('SearchPage: searchContent invocation failed', normalized, {
      query,
      hasFilters: hasUserFilters,
    });
    throw normalized;
  }

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
  } catch (error) {
    const normalized = normalizeError(error, 'Search facets fetch failed');
    logger.error('SearchPage: getSearchFacets invocation failed', normalized);
  }

  let zeroStateSuggestions: Awaited<ReturnType<typeof searchContent>> = [];
  try {
    const homepageData = await getHomepageData(getHomepageCategoryIds);
    const categoryData = (homepageData?.content as { categoryData?: Record<string, unknown[]> })
      ?.categoryData;
    zeroStateSuggestions = categoryData
      ? (Object.values(categoryData).flat() as Awaited<ReturnType<typeof searchContent>>)
      : [];
  } catch (error) {
    const normalized = normalizeError(error, 'SearchPage: getHomepageData for suggestions failed');
    logger.error('SearchPage: suggestions fetch failed', normalized);
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

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-bold text-4xl">
        {query ? `Search: "${query}"` : 'Search Claude Code Directory'}
      </h1>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <ContentSearchClient
          items={results}
          type="agents"
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

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
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

  return facets
    .slice()
    .sort(
      (a, b) => b.contentCount - a.contentCount || a.category.localeCompare(b.category) // alphabetical tiebreaker
    )
    .map((facet) => facet.category as ContentCategory)
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
