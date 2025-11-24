/**
 * Search Page - Database-First RPC via search_content_optimized()
 */

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

  let facetOptions = { tags: [] as string[], authors: [] as string[], categories: [] as string[] };
  try {
    const facetData = await getSearchFacets();
    facetOptions = {
      tags: facetData.tags,
      authors: facetData.authors,
      categories: facetData.categories,
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
          zeroStateSuggestions={zeroStateSuggestions.slice(0, 6)}
        />
        <Suspense fallback={null}>
          <RecentlyViewedSidebar />
        </Suspense>
      </div>
    </main>
  );
}
