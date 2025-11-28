import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MiscService } from './misc.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('MiscService', () => {
  let service: MiscService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;
    service = new MiscService(mockSupabase);
  });

  describe('getSiteStats', () => {
    it('returns site statistics on success', async () => {
      const mockData = {
        total_content: 1500,
        total_users: 5000,
        total_companies: 200,
        total_jobs: 150,
        active_contributors: 350,
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getSiteStats();

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_site_stats');
    });

    it('handles missing stats gracefully', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await service.getSiteStats();

      expect(result).toBeNull();
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Stats aggregation failed', code: 'AGGREGATION_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getSiteStats()).rejects.toEqual(mockError);
    });
  });

  describe('getCategories', () => {
    it('returns list of categories on success', async () => {
      const mockData = [
        { id: 'agents', name: 'Agents', count: 500, icon: 'robot' },
        { id: 'skills', name: 'Skills', count: 300, icon: 'puzzle' },
        { id: 'tools', name: 'Tools', count: 200, icon: 'wrench' },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getCategories();

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_categories');
      expect(result).toHaveLength(3);
    });

    it('returns empty array when no categories exist', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getCategories();

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Failed to fetch categories', code: 'DB_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getCategories()).rejects.toEqual(mockError);
    });
  });
});