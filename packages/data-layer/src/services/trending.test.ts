import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TrendingService } from './trending.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('TrendingService', () => {
  let service: TrendingService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;
    service = new TrendingService(mockSupabase);
  });

  describe('getTrendingContent', () => {
    it('returns trending content on success', async () => {
      const mockData = [
        {
          id: 'content-1',
          title: 'Popular Agent',
          slug: 'popular-agent',
          category: 'agents' as const,
          view_count: 1500,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'content-2',
          title: 'Hot Skill',
          slug: 'hot-skill',
          category: 'skills' as const,
          view_count: 1200,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getTrendingContent({
        p_category: null,
        p_limit: 10,
      });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_trending_content', {
        p_category: null,
        p_limit: 10,
      });
    });

    it('returns empty array when no trending content', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getTrendingContent({
        p_category: null,
        p_limit: 10,
      });

      expect(result).toEqual([]);
    });

    it('handles category filtering', async () => {
      const mockData = [{ id: 'content-1', category: 'agents' as const }];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      // Test with category filter
      await service.getTrendingContent({ p_category: 'agents', p_limit: 5 });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_trending_content', {
        p_category: 'agents',
        p_limit: 5,
      });

      // Test without category filter
      await service.getTrendingContent({ p_category: null, p_limit: 5 });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_trending_content', {
        p_category: null,
        p_limit: 5,
      });
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Database error', code: 'PGRST_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(
        service.getTrendingContent({
          p_category: null,
          p_limit: 10,
        })
      ).rejects.toEqual(mockError);
    });

    it('returns results sorted by trending score from materialized view', async () => {
      const mockData = [
        { id: '1', category: 'agents' as const, slug: 'item-1' },
        { id: '2', category: 'agents' as const, slug: 'item-2' },
        { id: '3', category: 'agents' as const, slug: 'item-3' },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getTrendingContent({
        p_category: null,
        p_limit: 10,
      });

      // Results are pre-sorted by database (trending_score DESC)
      expect(result).toEqual(mockData);
      expect(result).toHaveLength(3);
    });
  });
});