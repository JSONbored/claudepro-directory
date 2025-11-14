/**
 * Unified Search Edge Client - wraps the /functions/v1/unified-search endpoint
 */

import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

const EDGE_SEARCH_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/unified-search`;

type ContentSearchResult =
  Database['public']['Functions']['search_content_optimized']['Returns'][number];

type UnifiedSearchEntity = {
  entity_type: string;
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string | null;
  relevance_score?: number | null;
  engagement_score?: number | null;
};

interface UnifiedSearchResponse<T> {
  results: T[];
}

export type SearchFilters = {
  sort?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';
  p_categories?: string[];
  p_tags?: string[];
  p_authors?: string[];
  p_limit?: number;
  p_offset?: number;
};

export type SearchResult = ContentSearchResult;

async function callUnifiedSearch<T>(params: URLSearchParams): Promise<T[]> {
  const response = await fetch(`${EDGE_SEARCH_URL}?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 300, tags: ['search'] },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Unified search edge call failed', undefined, {
      status: response.status,
      errorText,
    });
    throw new Error(`Unified search failed: ${response.statusText}`);
  }

  const data = (await response.json()) as UnifiedSearchResponse<T>;
  return data.results ?? [];
}

export async function searchContent(query: string, filters: SearchFilters = {}) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (filters.p_categories?.length) params.set('categories', filters.p_categories.join(','));
  if (filters.p_tags?.length) params.set('tags', filters.p_tags.join(','));
  if (filters.p_authors?.length) params.set('authors', filters.p_authors.join(','));
  if (filters.sort) params.set('sort', filters.sort);
  params.set('limit', String(filters.p_limit ?? 50));
  if (filters.p_offset) params.set('offset', String(filters.p_offset));

  return callUnifiedSearch<ContentSearchResult>(params);
}

export type CompanySearchResult = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
};

export async function searchCompaniesEdge(
  query: string,
  limit = 10
): Promise<CompanySearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams();
  params.set('q', trimmed);
  params.set('entities', 'company');
  params.set('limit', String(limit));

  const entities = await callUnifiedSearch<UnifiedSearchEntity>(params);
  return entities.map((entity) => ({
    id: entity.id,
    name: entity.title || entity.slug || '',
    slug: entity.slug,
    description: entity.description,
  }));
}
