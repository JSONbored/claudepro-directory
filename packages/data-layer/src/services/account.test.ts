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

  describe('getCollectionDetailWithItems', () => {
    it('should return collection detail with items', async () => {
      const mockData = {
        collection: { id: '1', name: 'My Collection' },
        items: [{ id: 'item-1', content_slug: 'test' }],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getCollectionDetailWithItems({
        p_user_id: 'user123',
        p_collection_slug: 'my-collection',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_collection_detail_with_items')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getUserSettings', () => {
    it('should return user settings', async () => {
      const mockData = {
        email_notifications: true,
        theme: 'dark',
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getUserSettings({
        p_user_id: 'user123',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_settings')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSponsorshipAnalytics', () => {
    it('should return sponsorship analytics', async () => {
      const mockData = {
        total_impressions: 1000,
        total_clicks: 100,
        click_through_rate: 0.1,
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getSponsorshipAnalytics({
        p_user_id: 'user123',
        p_sponsorship_id: 'sponsor-1',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_sponsorship_analytics')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getUserCompanies', () => {
    it('should return user companies', async () => {
      const mockData = {
        companies: [
          { id: '1', name: 'Company 1' },
          { id: '2', name: 'Company 2' },
        ],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getUserCompanies({
        p_user_id: 'user123',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_companies')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getUserSponsorships', () => {
    it('should return user sponsorships', async () => {
      const mockData = {
        sponsorships: [
          { id: '1', content_type: 'agents', content_slug: 'test' },
        ],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getUserSponsorships({
        p_user_id: 'user123',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_sponsorships')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSubmissionDashboard', () => {
    it('should return submission dashboard', async () => {
      const mockData = {
        submissions: [
          { id: '1', status: 'pending', content_slug: 'test' },
        ],
        stats: { total: 10, pending: 5, approved: 3 },
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getSubmissionDashboard({
        p_user_id: 'user123',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_submission_dashboard')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('isBookmarked', () => {
    it('should return true when content is bookmarked', async () => {
      const mockBookmark = { id: 'bookmark-1' };

      vi.mocked(prismock.bookmarks.findFirst).mockResolvedValue(
        mockBookmark as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await accountService.isBookmarked({
        p_user_id: 'user123',
        p_content_type: 'agents',
        p_content_slug: 'test-agent',
      });

      expect(prismock.bookmarks.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: 'user123',
          content_type: 'agents',
          content_slug: 'test-agent',
        },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when content is not bookmarked', async () => {
      vi.mocked(prismock.bookmarks.findFirst).mockResolvedValue(null);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await accountService.isBookmarked({
        p_user_id: 'user123',
        p_content_type: 'agents',
        p_content_slug: 'not-bookmarked',
      });

      expect(result).toBe(false);
    });
  });

  describe('isBookmarkedBatch', () => {
    it('should return batch bookmark status for array items', async () => {
      const mockBookmarks = [
        { content_type: 'agents', content_slug: 'bookmarked-1' },
        { content_type: 'mcp', content_slug: 'bookmarked-2' },
      ];

      vi.mocked(prismock.bookmarks.findMany).mockResolvedValue(
        mockBookmarks as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await accountService.isBookmarkedBatch({
        p_user_id: 'user123',
        p_items: [
          { content_type: 'agents', content_slug: 'bookmarked-1' },
          { content_type: 'agents', content_slug: 'not-bookmarked' },
          { content_type: 'mcp', content_slug: 'bookmarked-2' },
        ],
      });

      expect(prismock.bookmarks.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user123',
          OR: [
            { content_type: 'agents', content_slug: 'bookmarked-1' },
            { content_type: 'agents', content_slug: 'not-bookmarked' },
            { content_type: 'mcp', content_slug: 'bookmarked-2' },
          ],
        },
        select: {
          content_type: true,
          content_slug: true,
        },
      });
      expect(result).toHaveLength(3);
      expect(result[0].is_bookmarked).toBe(true);
      expect(result[1].is_bookmarked).toBe(false);
      expect(result[2].is_bookmarked).toBe(true);
    });

    it('should handle JSONB object format', async () => {
      vi.mocked(prismock.bookmarks.findMany).mockResolvedValue([]);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await accountService.isBookmarkedBatch({
        p_user_id: 'user123',
        p_items: {
          items: [{ content_type: 'agents', content_slug: 'test' }],
        } as any,
      });

      expect(result).toHaveLength(1);
      expect(result[0].is_bookmarked).toBe(false);
    });

    it('should return empty array for empty items', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await accountService.isBookmarkedBatch({
        p_user_id: 'user123',
        p_items: [],
      });

      expect(result).toEqual([]);
      expect(prismock.bookmarks.findMany).not.toHaveBeenCalled();
    });
  });

  describe('isFollowing', () => {
    it('should return true when user is following', async () => {
      const mockFollow = { id: 'follow-1' };

      vi.mocked(prismock.followers.findFirst).mockResolvedValue(
        mockFollow as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await accountService.isFollowing({
        follower_id: 'user123',
        following_id: 'user456',
      });

      expect(prismock.followers.findFirst).toHaveBeenCalledWith({
        where: {
          follower_id: 'user123',
          following_id: 'user456',
        },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when user is not following', async () => {
      vi.mocked(prismock.followers.findFirst).mockResolvedValue(null);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await accountService.isFollowing({
        follower_id: 'user123',
        following_id: 'user789',
      });

      expect(result).toBe(false);
    });
  });

  describe('isFollowingBatch', () => {
    it('should return batch following status', async () => {
      const mockFollows = [
        { following_id: 'user456' },
        { following_id: 'user789' },
      ];

      vi.mocked(prismock.followers.findMany).mockResolvedValue(
        mockFollows as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await accountService.isFollowingBatch({
        p_follower_id: 'user123',
        p_followed_user_ids: ['user456', 'user789', 'user999'],
      });

      expect(prismock.followers.findMany).toHaveBeenCalledWith({
        where: {
          follower_id: 'user123',
          following_id: { in: ['user456', 'user789', 'user999'] },
        },
        select: { following_id: true },
      });
      expect(result).toHaveLength(3);
      expect(result[0].is_following).toBe(true);
      expect(result[1].is_following).toBe(true);
      expect(result[2].is_following).toBe(false);
    });

    it('should return empty array for empty user IDs', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await accountService.isFollowingBatch({
        p_follower_id: 'user123',
        p_followed_user_ids: [],
      });

      expect(result).toEqual([]);
      expect(prismock.followers.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getUserActivitySummary', () => {
    it('should return user activity summary', async () => {
      const mockData = {
        total_submissions: 10,
        total_reviews: 5,
        total_bookmarks: 20,
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getUserActivitySummary({
        p_user_id: 'user123',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_activity_summary')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getUserActivityTimeline', () => {
    it('should return user activity timeline', async () => {
      const mockData = [
        {
          id: 'activity-1',
          type: 'submission',
          created_at: '2024-01-01',
        },
        {
          id: 'activity-2',
          type: 'review',
          created_at: '2024-01-02',
        },
      ];
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await accountService.getUserActivityTimeline({
        p_user_id: 'user123',
        p_type: 'submission',
        p_limit: 20,
        p_offset: 0,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_activity_timeline')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getUserIdentities', () => {
    it('should return user identities', async () => {
      const mockData = [
        {
          id: 'identity-1',
          provider: 'github',
          email: 'user@example.com',
        },
      ];
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await accountService.getUserIdentities({
        p_user_id: 'user123',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_identities')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getUserCompleteData', () => {
    it('should return user complete data', async () => {
      const mockData = {
        profile: { id: 'user123', username: 'testuser' },
        collections: [],
        submissions: [],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.getUserCompleteData({
        p_user_id: 'user123',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_complete_data')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('batchInsertUserInteractions', () => {
    it('should batch insert user interactions', async () => {
      const mockData = {
        inserted_count: 5,
        errors: [],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await accountService.batchInsertUserInteractions({
        p_user_id: 'user123',
        p_interactions: [
          { content_type: 'agents', content_slug: 'test', interaction_type: 'view' },
        ],
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('batch_insert_user_interactions')
      );
      expect(result).toEqual(mockData);
    });

    it('should not use cache for mutations', async () => {
      const mockData = { inserted_count: 0 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      await accountService.batchInsertUserInteractions({
        p_user_id: 'user123',
        p_interactions: [],
      });

      // Verify mutation doesn't use cache (handled by BasePrismaService)
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });
});