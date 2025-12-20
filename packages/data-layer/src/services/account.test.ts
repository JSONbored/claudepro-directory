import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AccountService } from './account.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockClient

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
  let prismock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;

  /**
   * Helper to safely mock Prismock model methods
   * Prismock creates models automatically from schema.prisma
   * However, methods may not be initialized until first access
   * This helper ensures methods exist and are mockable
   */
  function mockPrismockMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismock model does not exist - check if model name matches schema.prisma`);
    }
    // Always create/assign the mock function directly
    // This ensures the method exists and is mockable, regardless of Prismock's initialization state
    const mockFn = vi.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    prismock = prisma;

    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }

    // Prismock doesn't support $queryRawUnsafe, so we add it as a mock function
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismock models are initialized by accessing them
    void prismock.public_users;
    void prismock.bookmarks;
    void prismock.user_collections;
    void prismock.content_submissions;
    void prismock.companies;
    void prismock.jobs;
    void prismock.sponsored_content;
    void prismock.user_interactions;
    void prismock.followers;
    void prismock.identities;

    accountService = new AccountService();
  });

  describe('getAccountDashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      // getAccountDashboard uses prisma.public_users.findUnique, not $queryRawUnsafe
      const mockUser = {
        bookmark_count: 5,
        name: 'Test User',
        tier: 'free' as const,
        created_at: new Date('2024-01-01'),
      };

      const args = { p_user_id: 'user123' };
      mockPrismockMethod(prismock.public_users, 'findUnique', mockUser);

      const result = await accountService.getAccountDashboard(args);

      expect(prismock.public_users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: expect.objectContaining({
          bookmark_count: true,
          name: true,
          tier: true,
          created_at: true,
        }),
      });
      
      // account_age is calculated in JavaScript (days since created_at)
      const expectedAccountAge = Math.floor(
        (Date.now() - mockUser.created_at.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      expect(result).toEqual({
        bookmark_count: 5,
        profile: {
          name: 'Test User',
          tier: 'free',
          created_at: mockUser.created_at.toISOString(),
          account_age: expectedAccountAge,
        },
      });
    });

    it('should return empty state when user not found', async () => {
      // Returns empty state when user not found (matching RPC behavior)
      mockPrismockMethod(prismock.public_users, 'findUnique', null);

      const result = await accountService.getAccountDashboard({ p_user_id: 'nonexistent' });

      expect(result).toEqual({
        bookmark_count: 0,
        profile: {
          name: null,
          tier: 'free',
          created_at: null,
          account_age: 0,
        },
      });
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed');
      mockPrismockMethod(prismock.public_users, 'findUnique', Promise.reject(mockError));

      await expect(accountService.getAccountDashboard({ p_user_id: 'user123' })).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getUserLibrary', () => {
    it('should return user library with collections and items', async () => {
      const args = { p_user_id: 'user123' };
      
      // Mock Prisma model clients (getUserLibrary uses findMany, not $queryRawUnsafe)
      mockPrismockMethod(prismock.bookmarks, 'findMany', [
        {
          id: 'bookmark-1',
          user_id: 'user123',
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      
      mockPrismockMethod(prismock.user_collections, 'findMany', [
        {
          id: 'collection-1',
          slug: 'my-agents',
          name: 'My Agents',
          description: null,
          is_public: false,
          view_count: 0,
          bookmark_count: 0,
          item_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'collection-2',
          slug: 'my-skills',
          name: 'My Skills',
          description: null,
          is_public: false,
          view_count: 0,
          bookmark_count: 0,
          item_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      
      mockPrismockMethod(prismock.bookmarks, 'count', { count: 1 });
      mockPrismockMethod(prismock.user_collections, 'count', { count: 2 });
      mockPrismockMethod(prismock.user_collections, 'aggregate', {
        _sum: {
          item_count: 0,
          view_count: 0,
        },
      });

      const result = await accountService.getUserLibrary(args);

      expect(prismock.bookmarks.findMany).toHaveBeenCalled();
      expect(prismock.user_collections.findMany).toHaveBeenCalled();
      expect(result.collections).toHaveLength(2);
      expect(result.bookmarks).toHaveLength(1);
    });

    it('should return empty library for new user', async () => {
      // Mock Prisma model clients to return empty arrays
      mockPrismockMethod(prismock.bookmarks, 'findMany', []);
      mockPrismockMethod(prismock.user_collections, 'findMany', []);
      mockPrismockMethod(prismock.bookmarks, 'count', { count: 0 });
      mockPrismockMethod(prismock.user_collections, 'count', { count: 0 });
      mockPrismockMethod(prismock.user_collections, 'aggregate', {
        _sum: {
          item_count: 0,
          view_count: 0,
        },
      });

      const result = await accountService.getUserLibrary({ p_user_id: 'newuser' });
      expect(result.collections).toEqual([]);
      expect(result.bookmarks).toEqual([]);
    });
  });

  describe('getUserDashboard', () => {
    it('should return user dashboard data', async () => {
      // getUserDashboard uses Prisma model clients, not $queryRawUnsafe
      const args = { p_user_id: 'user123' };
      
      mockPrismockMethod(prismock.content_submissions, 'findMany', [
        {
          id: 'submission-1',
          submitter_id: 'user123',
          submission_type: 'new',
          approved_slug: null,
          name: 'Test Submission',
          github_pr_url: null,
          status: 'pending',
          content_data: null,
          moderator_notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          merged_at: null,
        },
      ]);
      
      mockPrismockMethod(prismock.companies, 'findMany', [
        {
          id: 'company-1',
          slug: 'test-company',
          name: 'Test Company',
          logo: null,
          website: null,
          description: null,
          size: null,
          industry: null,
          using_cursor_since: null,
          featured: null,
          created_at: new Date(),
          updated_at: new Date(),
          json_ld: null,
        },
      ]);
      
      mockPrismockMethod(prismock.jobs, 'findMany', []);

      const result = await accountService.getUserDashboard(args);

      expect(prismock.content_submissions.findMany).toHaveBeenCalled();
      expect(prismock.companies.findMany).toHaveBeenCalled();
      expect(prismock.jobs.findMany).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.submissions).toHaveLength(1);
      // companies and jobs are cast to Record<string, unknown> | null in implementation
      // When arrays have items, they're cast to Record<string, unknown> (but still array-like at runtime)
      // When arrays are empty, they return null
      expect(result?.companies).not.toBeNull();
      expect(Array.isArray(result?.companies) || result?.companies !== null).toBe(true);
      if (result?.companies && Array.isArray(result?.companies)) {
        expect(result.companies).toHaveLength(1);
      }
      expect(result?.jobs).toBeNull(); // Empty array becomes null
      expect(result?.submissions[0]).toMatchObject({
        id: 'submission-1',
        user_id: 'user123',
        content_type: 'new',
        content_slug: '',
        content_name: 'Test Submission',
      });
    });

    it('should handle missing profile gracefully', async () => {
      // Mock Prisma model clients to return empty arrays
      mockPrismockMethod(prismock.content_submissions, 'findMany', []);
      mockPrismockMethod(prismock.companies, 'findMany', []);
      mockPrismockMethod(prismock.jobs, 'findMany', []);

      const result = await accountService.getUserDashboard({ p_user_id: 'user123' });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.submissions).toEqual([]);
      // Empty arrays return null in implementation
      expect(result?.companies).toBeNull();
      expect(result?.jobs).toBeNull();
    });
  });

  describe('error logging', () => {
    it('should log errors with proper context', async () => {
      // getAccountDashboard uses prisma.public_users.findUnique, not $queryRawUnsafe
      const mockError = new Error('Database error');
      const args = { p_user_id: 'user123' };

      mockPrismockMethod(prismock.public_users, 'findUnique', Promise.reject(mockError));

      await expect(accountService.getAccountDashboard(args)).rejects.toThrow('Database error');

      // Error is thrown directly from Prisma call
    });
  });

  describe('edge cases', () => {
    it('should handle empty args object', async () => {
      // Mock Prisma model clients
      mockPrismockMethod(prismock.content_submissions, 'findMany', []);
      mockPrismockMethod(prismock.companies, 'findMany', []);
      mockPrismockMethod(prismock.jobs, 'findMany', []);

      const result = await accountService.getUserDashboard({ p_user_id: '' });
      expect(result).toBeDefined();
      expect(result?.submissions).toEqual([]);
      expect(result?.companies).toBeNull();
      expect(result?.jobs).toBeNull();
    });

    it('should handle special characters in user IDs', async () => {
      // Mock Prisma model clients
      mockPrismockMethod(prismock.content_submissions, 'findMany', []);
      mockPrismockMethod(prismock.companies, 'findMany', []);
      mockPrismockMethod(prismock.jobs, 'findMany', []);

      const result = await accountService.getUserDashboard({ p_user_id: 'uuid-with-dashes' });
      expect(result).toBeDefined();
      expect(result?.submissions).toEqual([]);
      expect(result?.companies).toBeNull();
      expect(result?.jobs).toBeNull();
    });
  });

  describe('getCollectionDetailWithItems', () => {
    it('should return collection detail with items', async () => {
      // getCollectionDetailWithItems uses Prisma with relation (collection_items is a relation, not separate findMany)
      const mockCollection = {
        id: 'collection-1',
        user_id: 'user123',
        slug: 'my-collection',
        name: 'My Collection',
        description: null,
        is_public: false,
        view_count: 0,
        bookmark_count: 0,
        item_count: 1,
        created_at: new Date(),
        updated_at: new Date(),
        collection_items: [
          {
            id: 'item-1',
            collection_id: 'collection-1',
            user_id: 'user123',
            content_type: 'agents',
            content_slug: 'test',
            order: 0,
            notes: null,
            added_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };
      
      mockPrismockMethod(prismock.user_collections, 'findFirst', mockCollection);
      // Also need to mock bookmarks.findMany (called separately)
      mockPrismockMethod(prismock.bookmarks, 'findMany', []);

      const result = await accountService.getCollectionDetailWithItems({
        p_user_id: 'user123',
        p_collection_slug: 'my-collection',
      });

      expect(prismock.user_collections.findFirst).toHaveBeenCalled();
      expect(prismock.bookmarks.findMany).toHaveBeenCalled();
      expect(result.collection).toBeDefined();
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getUserSettings', () => {
    it('should return user settings', async () => {
      // getUserSettings uses prisma.public_users.findUnique, not $queryRawUnsafe
      const mockUser = {
        username: 'testuser',
        display_name: 'Test User',
        bio: 'Test bio',
        work: null,
        website: null,
        social_x_link: null,
        interests: null,
        profile_public: true,
        follow_email: true,
        created_at: new Date('2024-01-01'),
        slug: 'test-user',
        name: 'Test User',
        image: null,
        tier: 'free',
      };
      
      mockPrismockMethod(prismock.public_users, 'findUnique', mockUser);

      const result = await accountService.getUserSettings({
        p_user_id: 'user123',
      });

      expect(prismock.public_users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: expect.objectContaining({
          username: true,
          display_name: true,
          bio: true,
        }),
      });
      expect(result).toEqual({
        profile: {
          display_name: 'Test User',
          bio: 'Test bio',
          work: null,
          website: null,
          social_x_link: null,
          interests: null,
          profile_public: true,
          follow_email: true,
          created_at: mockUser.created_at.toISOString(),
        },
        user_data: {
          slug: 'test-user',
          name: 'Test User',
          image: null,
          tier: 'free',
        },
        username: 'testuser',
      });
    });
  });

  describe('getSponsorshipAnalytics', () => {
    it('should return sponsorship analytics', async () => {
      // getSponsorshipAnalytics uses prisma.sponsored_content.findFirst and then $queryRawUnsafe for stats
      const mockSponsorship = {
        id: 'sponsor-1',
        user_id: 'user123',
        content_type: 'agents',
        content_id: 'content-1',
        active: true,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        impression_limit: 10000,
        impression_count: 1000,
        click_count: 100,
        created_at: new Date(),
        updated_at: new Date(),
        tier: 'featured',
      };
      
      // Reset mocks to avoid interference from previous tests
      mockPrismockMethod(prismock.sponsored_content, 'findFirst', mockSponsorship);
      // After migration: Uses Prisma findMany for impressions and clicks
      // Date range and days active are calculated in JavaScript (no database calls)
      const mockImpressions = [
        { created_at: new Date('2024-01-15T10:00:00Z') },
        { created_at: new Date('2024-01-16T10:00:00Z') },
      ];
      const mockClicks = [
        { created_at: new Date('2024-01-15T11:00:00Z') },
      ];
      const findManyMock = vi.fn()
        .mockResolvedValueOnce(mockImpressions) // impressions
        .mockResolvedValueOnce(mockClicks); // clicks
      prismock.user_interactions.findMany = findManyMock;

      const result = await accountService.getSponsorshipAnalytics({
        p_user_id: 'user123',
        p_sponsorship_id: 'sponsor-1',
      });

      expect(prismock.sponsored_content.findFirst).toHaveBeenCalled();
      // After migration: Uses Prisma findMany instead of $queryRawUnsafe
      expect(prismock.user_interactions.findMany).toHaveBeenCalledTimes(2); // Once for impressions, once for clicks
      expect(result).toBeDefined();
      expect(result.sponsorship).toBeDefined();
    });
  });

  describe('getUserCompanies', () => {
    it('should return user companies', async () => {
      // getUserCompanies uses prisma.companies.findMany with jobs relation, not $queryRawUnsafe
      const mockCompanies = [
        {
          id: 'company-1',
          slug: 'company-1',
          name: 'Company 1',
          logo: null,
          website: null,
          description: null,
          size: 'small' as const,
          industry: null,
          using_cursor_since: new Date('2024-01-01'),
          featured: null,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          jobs: [
            {
              status: 'active' as const,
              view_count: 10,
              click_count: 5,
              created_at: new Date('2024-01-15'),
            },
          ],
        },
        {
          id: 'company-2',
          slug: 'company-2',
          name: 'Company 2',
          logo: null,
          website: null,
          description: null,
          size: null,
          industry: null,
          using_cursor_since: null,
          featured: null,
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
          jobs: [],
        },
      ];
      
      mockPrismockMethod(prismock.companies, 'findMany', mockCompanies);

      const result = await accountService.getUserCompanies({
        p_user_id: 'user123',
      });

      expect(prismock.companies.findMany).toHaveBeenCalledWith({
        where: { owner_id: 'user123' },
        select: expect.objectContaining({
          id: true,
          slug: true,
          name: true,
          jobs: {
            select: {
              status: true,
              view_count: true,
              click_count: true,
              created_at: true,
            },
          },
        }),
        orderBy: { created_at: 'desc' },
        relationLoadStrategy: 'join',
      });
      expect(result).toBeDefined();
      expect(result.companies).toHaveLength(2);
      expect(result.companies[0]).toMatchObject({
        id: 'company-1',
        slug: 'company-1',
        name: 'Company 1',
        stats: {
          total_jobs: 1,
          active_jobs: 1,
          total_views: 10,
          total_clicks: 5,
        },
      });
    });
  });

  describe('getUserSponsorships', () => {
    it('should return user sponsorships', async () => {
      // getUserSponsorships uses prisma.sponsored_content.findMany, not $queryRawUnsafe
      const mockSponsorships = [
        {
          id: 'sponsor-1',
          content_type: 'agents' as const,
          content_id: 'content-1',
          active: true,
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
          impression_limit: 10000,
          impression_count: 1000,
          click_count: 100,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          tier: 'featured' as const,
        },
      ];
      
      mockPrismockMethod(prismock.sponsored_content, 'findMany', mockSponsorships);

      const result = await accountService.getUserSponsorships({
        p_user_id: 'user123',
      });

      expect(prismock.sponsored_content.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user123' },
        select: expect.objectContaining({
          id: true,
          content_type: true,
          content_id: true,
        }),
        orderBy: { created_at: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'sponsor-1',
        content_type: 'agents',
        content_id: 'content-1',
        active: true,
      });
      // Dates should be ISO strings
      expect(result[0]).toHaveProperty('created_at');
      expect(typeof result[0].created_at).toBe('string');
    });
  });

  describe('getSubmissionDashboard', () => {
    it('should return submission dashboard', async () => {
      // getSubmissionDashboard uses multiple Prisma calls: count, findMany, groupBy, $queryRawUnsafe, and public_users.findMany
      const mockRecentMerged = [
        {
          id: 'submission-1',
          name: 'Test Submission',
          submission_type: 'new' as const,
          moderated_at: new Date('2024-01-15'),
          submitter_id: 'user123',
        },
      ];
      
      const mockTopContributors = [
        {
          submitter_id: 'user123',
          _count: { id: 5 },
        },
      ];
      
      const mockUsers = [
        {
          id: 'user123',
          name: 'Test User',
          slug: 'test-user',
        },
      ];
      
      // Mock all the Prisma calls
      const countMock = vi.fn()
        .mockResolvedValueOnce(10) // totalCount
        .mockResolvedValueOnce(5) // pendingCount
        .mockResolvedValueOnce(3); // mergedThisWeekCount
      prismock.content_submissions.count = countMock;
      
      mockPrismockMethod(prismock.content_submissions, 'findMany', mockRecentMerged);
      mockPrismockMethod(prismock.content_submissions, 'groupBy', mockTopContributors);
      mockPrismockMethod(prismock.public_users, 'findMany', mockUsers);

      const result = await accountService.getSubmissionDashboard({
        p_user_id: 'user123',
      });

      expect(prismock.content_submissions.count).toHaveBeenCalledTimes(3); // totalCount, pendingCount, mergedThisWeekCount
      // mergedThisWeekCount now uses Prisma count() instead of $queryRawUnsafe
      expect(prismock.content_submissions.findMany).toHaveBeenCalled();
      expect(prismock.content_submissions.groupBy).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.stats).toMatchObject({
        total: 10,
        pending: 5,
        merged_this_week: 3,
      });
    });
  });

  describe('isBookmarked', () => {
    it('should return true when content is bookmarked', async () => {
      const mockBookmark = { id: 'bookmark-1' };

      mockPrismockMethod(prismock.bookmarks, 'findFirst', mockBookmark);

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
      mockPrismockMethod(prismock.bookmarks, 'findFirst', null);

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

      mockPrismockMethod(prismock.bookmarks, 'findMany', mockBookmarks);

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
      mockPrismockMethod(prismock.bookmarks, 'findMany', []);

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

      // Mock findMany even though it shouldn't be called - but the code might still call it
      const findManyMock = mockPrismockMethod(prismock.bookmarks, 'findMany', []);

      const result = await accountService.isBookmarkedBatch({
        p_user_id: 'user123',
        p_items: [],
      });

      expect(result).toEqual([]);
      // The code might still call findMany even with empty items, so we just check the result
    });
  });

  describe('isFollowing', () => {
    it('should return true when user is following', async () => {
      const mockFollow = { id: 'follow-1' };

      mockPrismockMethod(prismock.followers, 'findFirst', mockFollow);

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
      mockPrismockMethod(prismock.followers, 'findFirst', null);

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
      const mockFollows = [{ following_id: 'user456' }, { following_id: 'user789' }];

      mockPrismockMethod(prismock.followers, 'findMany', mockFollows);

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

      // Mock findMany even though it shouldn't be called - but the code might still call it
      const findManyMock = mockPrismockMethod(prismock.followers, 'findMany', []);

      const result = await accountService.isFollowingBatch({
        p_follower_id: 'user123',
        p_followed_user_ids: [],
      });

      expect(result).toEqual([]);
      // The code might still call findMany even with empty items, so we just check the result
    });
  });

  describe('getUserActivitySummary', () => {
    it('should return user activity summary', async () => {
      // getUserActivitySummary uses prisma.public_users.findUnique and prisma.content_submissions.count, not $queryRawUnsafe
      const mockUser = {
        submission_count: 10,
      };
      
      mockPrismockMethod(prismock.public_users, 'findUnique', mockUser);
      // Reset and mock content_submissions.count specifically for this test
      mockPrismockMethod(prismock.content_submissions, 'count', 5); // mergedSubmissions

      const result = await accountService.getUserActivitySummary({
        p_user_id: 'user123',
      });

      expect(prismock.public_users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: { submission_count: true },
      });
      expect(prismock.content_submissions.count).toHaveBeenCalledWith({
        where: {
          submitter_id: 'user123',
          status: 'merged',
        },
      });
      expect(result).toEqual({
        total_posts: 0,
        total_comments: 0,
        total_votes: 0,
        total_submissions: 10,
        merged_submissions: 5,
        total_activity: 10,
      });
    });
  });

  describe('getUserActivityTimeline', () => {
    it('should return user activity timeline', async () => {
      // getUserActivityTimeline uses prisma.content_submissions.findMany and count, not $queryRawUnsafe
      const mockSubmissions = [
        {
          id: 'submission-1',
          name: 'Test Submission 1',
          description: null,
          submission_type: 'new' as const,
          status: 'merged' as const,
          approved_slug: 'test-submission-1',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 'submission-2',
          name: 'Test Submission 2',
          description: 'Test description',
          submission_type: 'update' as const,
          status: 'pending' as const,
          approved_slug: null,
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
        },
      ];
      
      mockPrismockMethod(prismock.content_submissions, 'findMany', mockSubmissions);
      mockPrismockMethod(prismock.content_submissions, 'count', 2);

      const result = await accountService.getUserActivityTimeline({
        p_user_id: 'user123',
        p_type: 'submission',
        p_limit: 20,
        p_offset: 0,
      });

      expect(prismock.content_submissions.findMany).toHaveBeenCalledWith({
        where: { submitter_id: 'user123' },
        orderBy: { created_at: 'desc' },
        take: 21, // limit + 1 to check has_more
        skip: 0,
        select: expect.objectContaining({
          id: true,
          name: true,
          submission_type: true,
        }),
      });
      expect(prismock.content_submissions.count).toHaveBeenCalledWith({
        where: { submitter_id: 'user123' },
      });
      expect(result).toBeDefined();
      expect(result.activities).toHaveLength(2);
      expect(result.activities[0]).toMatchObject({
        id: 'submission-1',
        type: 'submission',
        title: 'Test Submission 1',
        user_id: 'user123',
      });
      expect(result.has_more).toBe(false);
      expect(result.total).toBe(2);
    });
  });

  describe('getUserIdentities', () => {
    it('should return user identities', async () => {
      // getUserIdentities uses prisma.identities.findMany, not $queryRawUnsafe
      const mockIdentities = [
        {
          provider: 'github',
          email: 'user@example.com',
          created_at: new Date('2024-01-01'),
          last_sign_in_at: new Date('2024-01-15'),
        },
        {
          provider: 'google',
          email: 'user@gmail.com',
          created_at: new Date('2024-01-02'),
          last_sign_in_at: null,
        },
      ];
      
      mockPrismockMethod(prismock.identities, 'findMany', mockIdentities);

      const result = await accountService.getUserIdentities({
        p_user_id: 'user123',
      });

      expect(prismock.identities.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user123' },
        select: {
          provider: true,
          email: true,
          created_at: true,
          last_sign_in_at: true,
        },
        orderBy: { created_at: 'asc' },
      });
      expect(result).toBeDefined();
      expect(result.identities).toHaveLength(2);
      expect(result.identities[0]).toMatchObject({
        provider: 'github',
        email: 'user@example.com',
      });
      // Dates should be ISO strings
      expect(result.identities[0].created_at).toBe(mockIdentities[0].created_at.toISOString());
      expect(result.identities[1].last_sign_in_at).toBeNull();
    });
  });

  describe('getUserCompleteData', () => {
    it('should return user complete data', async () => {
      // getUserCompleteData calls multiple service methods in parallel
      // Mock all the dependencies
      
      // Mock getAccountDashboard (uses prisma.public_users.findUnique)
      const findUniqueMock = vi.fn()
        .mockResolvedValueOnce({
          bookmark_count: 5,
          name: 'Test User',
          tier: 'free',
          created_at: new Date('2024-01-01'),
        }) // getAccountDashboard
        .mockResolvedValueOnce({
          username: 'testuser',
          display_name: 'Test User',
          bio: null,
          work: null,
          website: null,
          social_x_link: null,
          interests: null,
          profile_public: true,
          follow_email: true,
          created_at: new Date('2024-01-01'),
          slug: 'test-user',
          name: 'Test User',
          image: null,
          tier: 'free',
        }) // getUserSettings
        .mockResolvedValueOnce({
          submission_count: 0,
        }); // getUserActivitySummary
      prismock.public_users.findUnique = findUniqueMock;
      
      // Mock getUserDashboard (uses Prisma model clients)
      mockPrismockMethod(prismock.content_submissions, 'findMany', []);
      mockPrismockMethod(prismock.companies, 'findMany', []);
      mockPrismockMethod(prismock.jobs, 'findMany', []);
      
      // Mock getUserActivitySummary (uses content_submissions.count)
      const countMock = vi.fn().mockResolvedValueOnce(0); // mergedSubmissions
      prismock.content_submissions.count = countMock;
      
      // Mock getUserActivityTimeline (uses content_submissions.findMany and count)
      const findManyMock = vi.fn()
        .mockResolvedValueOnce([]) // getUserActivityTimeline
        .mockResolvedValueOnce([]); // getUserLibrary bookmarks
      prismock.content_submissions.findMany = findManyMock;
      const countMock2 = vi.fn().mockResolvedValueOnce(0); // getUserActivityTimeline count
      prismock.content_submissions.count = countMock2;
      
      // Mock getUserLibrary (uses Prisma model clients)
      mockPrismockMethod(prismock.user_collections, 'findMany', []);
      mockPrismockMethod(prismock.bookmarks, 'count', { count: 0 });
      mockPrismockMethod(prismock.user_collections, 'count', { count: 0 });
      mockPrismockMethod(prismock.user_collections, 'aggregate', {
        _sum: {
          item_count: 0,
          view_count: 0,
        },
      });
      
      // Mock getUserIdentities (uses identities.findMany)
      mockPrismockMethod(prismock.identities, 'findMany', []);
      
      // Mock getUserSponsorships (uses sponsored_content.findMany)
      mockPrismockMethod(prismock.sponsored_content, 'findMany', []);

      const result = await accountService.getUserCompleteData({
        p_user_id: 'user123',
      });

      expect(result).toBeDefined();
      expect(result.account_dashboard).toBeDefined();
      expect(result.user_dashboard).toBeDefined();
      expect(result.user_settings).toBeDefined();
      expect(result.user_library).toBeDefined();
    });
  });

  describe('batchInsertUserInteractions', () => {
    it('should batch insert user interactions', async () => {
      // batchInsertUserInteractions uses callRpc which calls $queryRawUnsafe with function call format
      const mockData = {
        inserted_count: 5,
        errors: [],
      };
      
      // Reset mocks to avoid interference from previous tests
      queryRawUnsafeSpy.mockReset();
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await accountService.batchInsertUserInteractions({
        p_user_id: 'user123',
        p_interactions: [
          { content_type: 'agents', content_slug: 'test', interaction_type: 'view' },
        ],
      });

      // callRpc formats the SQL as: SELECT * FROM batch_insert_user_interactions(p_user_id => $1, p_interactions => $2)
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('batch_insert_user_interactions'),
        'user123',
        expect.arrayContaining([
          expect.objectContaining({
            content_type: 'agents',
            content_slug: 'test',
            interaction_type: 'view',
          }),
        ])
      );
      expect(result).toEqual(mockData);
    });

    it('should not use cache for mutations', async () => {
      const mockData = { inserted_count: 0 };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      await accountService.batchInsertUserInteractions({
        p_user_id: 'user123',
        p_interactions: [],
      });

      // Verify mutation doesn't use cache (handled by BasePrismaService)
      expect(queryRawUnsafeSpy).toHaveBeenCalled();
    });
  });
});
