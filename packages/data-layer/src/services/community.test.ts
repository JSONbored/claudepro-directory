import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CommunityService } from './community.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('CommunityService', () => {
  let service: CommunityService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;
    service = new CommunityService(mockSupabase);
  });

  describe('getUserProfile', () => {
    it('returns user profile on success', async () => {
      const mockData = {
        id: 'user-1',
        username: 'johndoe',
        display_name: 'John Doe',
        bio: 'Software engineer and AI enthusiast',
        avatar_url: 'https://cdn.heyclaude.com/avatars/user-1.png',
        reputation_score: 150,
        contributions_count: 25,
        joined_at: '2023-01-01T00:00:00Z',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getUserProfile({ username: 'johndoe' });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_profile', {
        username: 'johndoe',
      });
    });

    it('handles user not found', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await service.getUserProfile({ username: 'nonexistent' });

      expect(result).toBeNull();
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'User lookup failed', code: 'DB_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getUserProfile({ username: 'test' })).rejects.toEqual(mockError);
    });
  });

  describe('getTopContributors', () => {
    it('returns list of top contributors on success', async () => {
      const mockData = [
        {
          id: 'user-1',
          username: 'johndoe',
          display_name: 'John Doe',
          reputation_score: 500,
          contributions_count: 50,
        },
        {
          id: 'user-2',
          username: 'janedoe',
          display_name: 'Jane Doe',
          reputation_score: 400,
          contributions_count: 45,
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getTopContributors({ limit_count: 10 });

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_top_contributors', {
        limit_count: 10,
      });
      expect(result![0].reputation_score).toBeGreaterThan(result![1].reputation_score!);
    });

    it('returns empty array when no contributors exist', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getTopContributors({ limit_count: 10 });

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Failed to fetch contributors', code: 'DB_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getTopContributors({ limit_count: 10 })).rejects.toEqual(mockError);
    });

    it('handles different limit values', async () => {
      const mockData = [{ id: 'user-1', reputation_score: 500 }];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      await service.getTopContributors({ limit_count: 5 });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_top_contributors', { limit_count: 5 });

      await service.getTopContributors({ limit_count: 20 });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_top_contributors', { limit_count: 20 });
    });
  });
});