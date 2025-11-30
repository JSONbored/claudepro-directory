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
        search_query: 'typescript',
        result_limit: 10,
      });

      // Service returns { data: rows, total_count: number }
      expect(result.data).toEqual(mockData);
      expect(result.total_count).toBe(2);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_content_optimized', {
        search_query: 'typescript',
        result_limit: 10,
      });
    });

    it('returns empty array when no results found', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.searchContent({
        search_query: 'nonexistent-query-xyz',
        result_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Search index unavailable', code: 'SEARCH_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(
        service.searchContent({
          search_query: 'test',
          result_limit: 10,
        })
      ).rejects.toEqual(mockError);
    });

    it('handles special characters in query', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.searchContent({
        search_query: 'test & query | with (special) characters',
        result_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });
  });
});