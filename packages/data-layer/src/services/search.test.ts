import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SearchService } from './search.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('SearchService', () => {
  let service: SearchService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;
    service = new SearchService(mockSupabase);
  });

  describe('searchContent', () => {
    it('returns search results on success', async () => {
      const mockData = [
        {
          id: 'result-1',
          title: 'TypeScript Best Practices',
          slug: 'typescript-best-practices',
          category: 'agents',
          excerpt: 'Learn TypeScript best practices...',
          relevance_score: 0.95,
        },
        {
          id: 'result-2',
          title: 'React Hooks Guide',
          slug: 'react-hooks-guide',
          category: 'skills',
          excerpt: 'A comprehensive guide to React Hooks...',
          relevance_score: 0.87,
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.searchContent({
        query: 'typescript',
        limit_count: 10,
      });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_content', {
        query: 'typescript',
        limit_count: 10,
      });
    });

    it('returns empty array when no results found', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.searchContent({
        query: 'nonexistent-query-xyz',
        limit_count: 10,
      });

      expect(result).toEqual([]);
    });

    it('handles search with category filter', async () => {
      const mockData = [
        {
          id: 'result-1',
          title: 'AI Agent',
          category: 'agents',
          relevance_score: 0.92,
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.searchContent({
        query: 'ai',
        category_filter: 'agents',
        limit_count: 10,
      });

      expect(result).toEqual(mockData);
      expect(result![0].category).toBe('agents');
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Search index unavailable', code: 'SEARCH_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(
        service.searchContent({
          query: 'test',
          limit_count: 10,
        })
      ).rejects.toEqual(mockError);
    });

    it('handles special characters in query', async () => {
      const mockData = [];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.searchContent({
        query: 'test & query | with (special) characters',
        limit_count: 10,
      });

      expect(result).toEqual([]);
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });
  });
});