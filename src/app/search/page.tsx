import type { Metadata } from 'next';
import { ContentSearchClient } from '@/src/components/content-search-client';
import type { CategoryId } from '@/src/lib/config/category-types';
import { searchContent } from '@/src/lib/search/server-search';
import { sanitizers } from '@/src/lib/security/validators';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

/**
 * Search Page - Server Component with PostgreSQL FTS
 *
 * ARCHITECTURE (2025-10-27):
 * - ✅ Server Component (RSC) - Fetches data server-side
 * - ✅ PostgreSQL FTS - 100-1000x faster than client-side fuzzy search
 * - ✅ Reuses existing ContentSearchClient UI component
 * - ✅ URL-driven state via searchParams
 *
 * REPLACES:
 * - ❌ useSearch hook (317 LOC)
 * - ❌ client-side fuzzysort (20KB + 264 LOC)
 */

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
  const rawQuery = resolvedParams.q || '';
  const sanitizedQuery = (await sanitizers.sanitizeSearchQuery(rawQuery)).slice(0, 200);

  // Parse filters from URL
  const categories = resolvedParams.category?.split(',').filter(Boolean) as
    | CategoryId[]
    | undefined;
  const tags = resolvedParams.tags?.split(',').filter(Boolean);
  const author = resolvedParams.author;
  const sort = (resolvedParams.sort as 'relevance' | 'newest' | 'alphabetical') || 'relevance';

  // Build filters object conditionally to satisfy exactOptionalPropertyTypes
  const filters: Parameters<typeof searchContent>[1] = {
    sort,
    limit: 50,
  };

  if (categories && categories.length > 0) {
    filters.categories = categories;
  }

  if (tags && tags.length > 0) {
    filters.tags = tags;
  }

  if (author) {
    filters.authors = [author];
  }

  // SERVER-SIDE QUERY: PostgreSQL FTS with filters
  const results = await searchContent(sanitizedQuery, filters);

  // Reuse existing ContentSearchClient component with server-fetched data
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">
        {sanitizedQuery ? `Search: "${sanitizedQuery}"` : 'Search Claude Code Directory'}
      </h1>
      <ContentSearchClient
        items={results}
        type="agents" // Default type for search - component handles filtering
        searchPlaceholder="Search agents, MCP servers, rules, commands..."
        title="Results"
        icon="Search"
      />
    </main>
  );
}
