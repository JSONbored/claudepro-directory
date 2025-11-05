/**
 * Search Page - Database-First RPC via search_content_optimized()
 */

import type { Metadata } from 'next';
import { ContentSearchClient } from '@/src/components/content-search-client';
import type { SearchFilters } from '@/src/lib/search/server-search';
import { searchContent } from '@/src/lib/search/server-search';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const revalidate = 3600; // 1 hour ISR

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
  const sort = resolvedParams.sort as SearchFilters['sort'];

  const filters: SearchFilters = {};

  if (sort) filters.sort = sort;
  if (categories && categories.length > 0) filters.p_categories = categories;
  if (tags && tags.length > 0) filters.p_tags = tags;
  if (author) filters.p_authors = [author];
  filters.p_limit = 50;

  const results = await searchContent(query, filters);

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
