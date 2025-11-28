import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AccountService } from './account.ts';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('AccountService', () => {
  let mockSupabase: SupabaseClient<Database>;
  let accountService: AccountService;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;

    accountService = new AccountService(mockSupabase);
  });

  describe('getAccountDashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const mockData = {
        user_id: 'user123',
        collections: [],
        submissions: [],
        bookmarks: [],
        stats: { total_submissions: 5, total_collections: 2 },
      };

      const args = { user_id: 'user123' };
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await accountService.getAccountDashboard(args);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_account_dashboard', args);
      expect(result).toEqual(mockData);
    });

    it('should throw error when user not found', async () => {
      const mockError = {
        message: 'User not found',
        code: 'PGRST116',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        accountService.getAccountDashboard({ user_id: 'nonexistent' })
      ).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Database connection failed' };
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        accountService.getAccountDashboard({ user_id: 'user123' })
      ).rejects.toThrow();
    });
  });

  describe('getUserLibrary', () => {
    it('should return user library with collections and items', async () => {
      const mockData = {
        collections: [
          { id: '1', name: 'My Agents', items: [] },
          { id: '2', name: 'My Skills', items: [] },
        ],
      };

      const args = { user_id: 'user123' };
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await accountService.getUserLibrary(args);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_library', args);
      expect(result).toEqual(mockData);
      expect(result.collections).toHaveLength(2);
    });

    it('should return empty library for new user', async () => {
      const mockData = { collections: [] };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await accountService.getUserLibrary({ user_id: 'newuser' });
      expect(result.collections).toEqual([]);
    });
  });

  describe('getUserDashboard', () => {
    it('should return user dashboard data', async () => {
      const mockData = {
        profile: { username: 'testuser', avatar_url: null },
        recent_activity: [],
        stats: { views: 100, likes: 50 },
      };

      const args = { user_id: 'user123' };
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await accountService.getUserDashboard(args);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_dashboard', args);
      expect(result).toEqual(mockData);
    });

    it('should handle missing profile gracefully', async () => {
      const mockData = {
        profile: null,
        recent_activity: [],
        stats: null,
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await accountService.getUserDashboard({ user_id: 'user123' });
      expect(result.profile).toBeNull();
    });
  });

  describe('error logging', () => {
    it('should log errors with proper context', async () => {
      const { logRpcError } = await import('../utils/rpc-error-logging.ts');
      const mockError = { message: 'Permission denied', code: 'PGRST301' };
      const args = { user_id: 'user123' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(accountService.getAccountDashboard(args)).rejects.toThrow();

      expect(logRpcError).toHaveBeenCalledWith(mockError, {
        rpcName: 'get_account_dashboard',
        operation: 'AccountService.getAccountDashboard',
        args: args,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty args object', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await accountService.getUserDashboard({ user_id: '' });
      expect(result).toBeNull();
    });

    it('should handle special characters in user IDs', async () => {
      const mockData = { profile: { username: 'test-user_123' } };
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await accountService.getUserDashboard({ user_id: 'uuid-with-dashes' });
      expect(result).toEqual(mockData);
    });
  });
});