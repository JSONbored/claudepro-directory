/**
 * Search Page - Database-First RPC via search_content_optimized()
 */

import type { Metadata } from 'next';
import { ContentSearchClient } from '@/src/components/content/content-search';
import type { SearchFilters } from '@/src/lib/edge/search-client';
import { searchContent } from '@/src/lib/edge/search-client';

const VALID_SORT_OPTIONS: SearchFilters['sort'][] = [
  'relevance',
  'popularity',
  'newest',
  'alphabetical',
];

function isValidSort(value: string | undefined): value is SearchFilters['sort'] {
  return VALID_SORT_OPTIONS.some((option) => option === value);
}

import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const revalidate = false;

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

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-bold text-4xl">
        {query ? `Search: "${query}"` : 'Search Claude Code Directory'}
      </h1>
      <ContentSearchClient
        items={results}
        type="agents"
        searchPlaceholder="Search agents, MCP servers, rules, commands..."
        title="Results"
        icon="Search"
      />
    </main>
  );
}
