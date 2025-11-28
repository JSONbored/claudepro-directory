import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AccountService } from './account.ts';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Helper to create proper PostgrestError objects
function createPostgrestError(message: string, code: string): PostgrestError {
  return {
    message,
    code,
    details: '',
    hint: null,
    name: 'PostgrestError',
  };
}

// Helper to create proper mock responses
function createMockResponse<T>(data: T | null) {
  return {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK' as const,
  };
}

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

      const args = { p_user_id: 'user123' };
      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse(mockData));

      const result = await accountService.getAccountDashboard(args);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_account_dashboard', args);
      expect(result).toEqual(mockData);
    });

    it('should throw error when user not found', async () => {
      const mockError = createPostgrestError('User not found', 'PGRST116');

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
        count: null,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        accountService.getAccountDashboard({ p_user_id: 'nonexistent' })
      ).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      const mockError = createPostgrestError('Database connection failed', 'PGRST301');
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
        count: null,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        accountService.getAccountDashboard({ p_user_id: 'user123' })
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

      const args = { p_user_id: 'user123' };
      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse(mockData));

      const result = await accountService.getUserLibrary(args);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_library', args);
      expect(result).toEqual(mockData);
      expect(result.collections).toHaveLength(2);
    });

    it('should return empty library for new user', async () => {
      const mockData = { collections: [] };

      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse(mockData));

      const result = await accountService.getUserLibrary({ p_user_id: 'newuser' });
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

      const args = { p_user_id: 'user123' };
      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse(mockData));

      const result = await accountService.getUserDashboard(args);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_dashboard', args);
      expect(result).toEqual(mockData);
    });

    it('should handle missing profile gracefully', async () => {
      const mockData = {
        submissions: [],
        companies: {},
        jobs: {},
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse(mockData));

      const result = await accountService.getUserDashboard({ p_user_id: 'user123' });
      expect(result).toEqual(mockData);
    });
  });

  describe('error logging', () => {
    it('should log errors with proper context', async () => {
      const { logRpcError } = await import('../utils/rpc-error-logging.ts');
      const mockError = createPostgrestError('Permission denied', 'PGRST301');
      const args = { p_user_id: 'user123' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
        count: null,
        status: 403,
        statusText: 'Forbidden',
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
      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse(null));

      const result = await accountService.getUserDashboard({ p_user_id: '' });
      expect(result).toBeNull();
    });

    it('should handle special characters in user IDs', async () => {
      const mockData = {
        submissions: [],
        companies: {},
        jobs: {},
      };
      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse(mockData));

      const result = await accountService.getUserDashboard({ p_user_id: 'uuid-with-dashes' });
      expect(result).toEqual(mockData);
    });
  });
});