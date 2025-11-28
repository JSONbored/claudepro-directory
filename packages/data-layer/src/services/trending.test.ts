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
          category: 'agents',
          view_count: 1500,
          trending_score: 0.95,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'content-2',
          title: 'Hot Skill',
          slug: 'hot-skill',
          category: 'skills',
          view_count: 1200,
          trending_score: 0.88,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getTrendingContent({
        limit_count: 10,
        time_window: '7d',
      });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_trending_content', {
        limit_count: 10,
        time_window: '7d',
      });
    });

    it('returns empty array when no trending content', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getTrendingContent({
        limit_count: 10,
        time_window: '24h',
      });

      expect(result).toEqual([]);
    });

    it('handles different time windows', async () => {
      const mockData = [{ id: 'content-1', trending_score: 0.95 }];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      // Test 24h window
      await service.getTrendingContent({ limit_count: 5, time_window: '24h' });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_trending_content', {
        limit_count: 5,
        time_window: '24h',
      });

      // Test 30d window
      await service.getTrendingContent({ limit_count: 5, time_window: '30d' });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_trending_content', {
        limit_count: 5,
        time_window: '30d',
      });
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Analytics unavailable', code: 'ANALYTICS_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(
        service.getTrendingContent({
          limit_count: 10,
          time_window: '7d',
        })
      ).rejects.toEqual(mockError);
    });

    it('sorts results by trending score', async () => {
      const mockData = [
        { id: '1', trending_score: 0.95 },
        { id: '2', trending_score: 0.88 },
        { id: '3', trending_score: 0.75 },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getTrendingContent({
        limit_count: 10,
        time_window: '7d',
      });

      expect(result![0].trending_score).toBeGreaterThan(result![1].trending_score!);
      expect(result![1].trending_score).toBeGreaterThan(result![2].trending_score!);
    });
  });
});