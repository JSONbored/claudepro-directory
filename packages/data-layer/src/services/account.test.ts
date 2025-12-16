import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { AccountService } from './account.ts';

// Mock the prisma singleton with Prismock
vi.mock('../prisma/client.ts', () => {
  const { setupPrismockMock } = require('../test-utils/prisma-mock.ts');
  return {
    prisma: setupPrismockMock(),
  };
});

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Mock request cache
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

describe('AccountService', () => {
  let accountService: AccountService;
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;
    
    // Reset Prismock data before each test
    prismock.reset();
    
    accountService = new AccountService();
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
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getAccountDashboard(args);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_account_dashboard'),
        'user123'
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error when user not found', async () => {
      const mockError = new Error('User not found');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(
        accountService.getAccountDashboard({ p_user_id: 'nonexistent' })
      ).rejects.toThrow('User not found');
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed');
      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(
        accountService.getAccountDashboard({ p_user_id: 'user123' })
      ).rejects.toThrow('Database connection failed');
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
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getUserLibrary(args);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_library'),
        'user123'
      );
      expect(result).toEqual(mockData);
      expect(result.collections).toHaveLength(2);
    });

    it('should return empty library for new user', async () => {
      const mockData = { collections: [] };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

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
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getUserDashboard(args);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_dashboard'),
        'user123'
      );
      expect(result).toEqual(mockData);
    });

    it('should handle missing profile gracefully', async () => {
      const mockData = {
        submissions: [],
        companies: {},
        jobs: {},
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getUserDashboard({ p_user_id: 'user123' });
      expect(result).toEqual(mockData);
    });
  });

  describe('error logging', () => {
    it('should log errors with proper context', async () => {
      const { logRpcError } = await import('../utils/rpc-error-logging.ts');
      const mockError = new Error('Permission denied');
      const args = { p_user_id: 'user123' };

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

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
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

      const result = await accountService.getUserDashboard({ p_user_id: '' });
      expect(result).toBeUndefined();
    });

    it('should handle special characters in user IDs', async () => {
      const mockData = {
        submissions: [],
        companies: {},
        jobs: {},
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getUserDashboard({ p_user_id: 'uuid-with-dashes' });
      expect(result).toEqual(mockData);
    });
  });
});