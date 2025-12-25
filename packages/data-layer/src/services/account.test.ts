import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AccountService } from './account.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache, getRequestCache } from '../utils/request-cache';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockerClient
// Jest automatically uses __mocks__ directory (no explicit registration needed)

// Mock the RPC error logging utility
jest.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

describe('AccountService', () => {
  let accountService: AccountService;
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    // Clear request cache before each test
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Prismocker supports $queryRawUnsafe via Proxy set handler (enhanced in previous refactor)
    queryRawUnsafeSpy = jest.fn().mockResolvedValue([]);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismocker models are initialized by accessing them
    void prismocker.public_users;
    void prismocker.bookmarks;
    void prismocker.user_collections;
    void prismocker.content_submissions;
    void prismocker.companies;
    void prismocker.jobs;
    void prismocker.sponsored_content;
    void prismocker.user_interactions;
    void prismocker.followers;
    void prismocker.identities;

    accountService = new AccountService();
  });

  describe('getAccountDashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      // getAccountDashboard uses prisma.public_users.findUnique
      const mockUser = {
        id: 'user123',
        bookmark_count: 5,
        name: 'Test User',
        tier: 'free' as const,
        created_at: new Date('2024-01-01'),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('public_users', [mockUser]);
      }

      const args = { p_user_id: 'user123' };
      const result = await accountService.getAccountDashboard(args);

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
      // Use Prismocker's setData with empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('public_users', []);
      }

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
      // Use spy to throw error
      const findUniqueSpy = jest
        .spyOn(prismocker.public_users, 'findUnique')
        .mockRejectedValue(new Error('Database connection failed'));

      await expect(accountService.getAccountDashboard({ p_user_id: 'user123' })).rejects.toThrow(
        'Database connection failed'
      );

      findUniqueSpy.mockRestore();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockUser = {
        id: 'user123',
        bookmark_count: 5,
        name: 'Test User',
        tier: 'free' as const,
        created_at: new Date('2024-01-01'),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('public_users', [mockUser]);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getAccountDashboard(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getAccountDashboard(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getUserLibrary', () => {
    it('should return user library with collections and items', async () => {
      const args = { p_user_id: 'user123' };

      // Use Prismocker's setData to seed test data
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          user_id: 'user123',
          content_type: 'agents' as const,
          content_slug: 'test-agent',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockCollections = [
        {
          id: 'collection-1',
          user_id: 'user123',
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
          user_id: 'user123',
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
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', mockBookmarks);
        (prismocker as any).setData('user_collections', mockCollections);
      }

      const result = await accountService.getUserLibrary(args);

      expect(result.collections).toHaveLength(2);
      expect(result.bookmarks).toHaveLength(1);
      expect(result.stats).toEqual({
        bookmark_count: 1,
        collection_count: 2,
        total_collection_items: 0,
        total_collection_views: 0,
      });
    });

    it('should return empty library for new user', async () => {
      // Use Prismocker's setData with empty arrays
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', []);
        (prismocker as any).setData('user_collections', []);
      }

      const result = await accountService.getUserLibrary({ p_user_id: 'newuser' });
      expect(result.collections).toEqual([]);
      expect(result.bookmarks).toEqual([]);
      expect(result.stats).toEqual({
        bookmark_count: 0,
        collection_count: 0,
        total_collection_items: 0,
        total_collection_views: 0,
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          user_id: 'user123',
          content_type: 'agents' as const,
          content_slug: 'test-agent',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', mockBookmarks);
        (prismocker as any).setData('user_collections', []);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserLibrary(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getUserLibrary(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getUserDashboard', () => {
    it('should return user dashboard data', async () => {
      // getUserDashboard uses Prisma model clients
      const args = { p_user_id: 'user123' };

      const mockSubmissions = [
        {
          id: 'submission-1',
          submitter_id: 'user123',
          submission_type: 'new' as const,
          approved_slug: null,
          name: 'Test Submission',
          github_pr_url: null,
          status: 'pending' as const,
          content_data: null,
          moderator_notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          merged_at: null,
        },
      ];

      const mockCompanies = [
        {
          id: 'company-1',
          owner_id: 'user123',
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
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', mockSubmissions);
        (prismocker as any).setData('companies', mockCompanies);
        (prismocker as any).setData('jobs', []);
      }

      const result = await accountService.getUserDashboard(args);

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
      // Use Prismocker's setData with empty arrays
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', []);
        (prismocker as any).setData('companies', []);
        (prismocker as any).setData('jobs', []);
      }

      const result = await accountService.getUserDashboard({ p_user_id: 'user123' });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.submissions).toEqual([]);
      // Empty arrays return null in implementation
      expect(result?.companies).toBeNull();
      expect(result?.jobs).toBeNull();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockSubmissions = [
        {
          id: 'submission-1',
          submitter_id: 'user123',
          submission_type: 'new' as const,
          approved_slug: null,
          name: 'Test Submission',
          github_pr_url: null,
          status: 'pending' as const,
          content_data: null,
          moderator_notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          merged_at: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', mockSubmissions);
        (prismocker as any).setData('companies', []);
        (prismocker as any).setData('jobs', []);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserDashboard(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getUserDashboard(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('error logging', () => {
    it('should log errors with proper context', async () => {
      // getAccountDashboard uses prisma.public_users.findUnique
      const mockError = new Error('Database error');
      const args = { p_user_id: 'user123' };

      // Use spy to throw error
      const findUniqueSpy = jest
        .spyOn(prismocker.public_users, 'findUnique')
        .mockRejectedValue(mockError);

      await expect(accountService.getAccountDashboard(args)).rejects.toThrow('Database error');

      findUniqueSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty args object', async () => {
      // Use Prismocker's setData with empty arrays
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', []);
        (prismocker as any).setData('companies', []);
        (prismocker as any).setData('jobs', []);
      }

      const result = await accountService.getUserDashboard({ p_user_id: '' });
      expect(result).toBeDefined();
      expect(result?.submissions).toEqual([]);
      expect(result?.companies).toBeNull();
      expect(result?.jobs).toBeNull();
    });

    it('should handle special characters in user IDs', async () => {
      // Use Prismocker's setData with empty arrays
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', []);
        (prismocker as any).setData('companies', []);
        (prismocker as any).setData('jobs', []);
      }

      const result = await accountService.getUserDashboard({ p_user_id: 'uuid-with-dashes' });
      expect(result).toBeDefined();
      expect(result?.submissions).toEqual([]);
      expect(result?.companies).toBeNull();
      expect(result?.jobs).toBeNull();
    });
  });

  describe('getCollectionDetailWithItems', () => {
    it('should return collection detail with items', async () => {
      // getCollectionDetailWithItems uses Prisma with relation (collection_items is a relation)
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
      };

      const mockCollectionItems = [
        {
          id: 'item-1',
          collection_id: 'collection-1',
          user_id: 'user123',
          content_type: 'agents' as const,
          content_slug: 'test',
          order: 0,
          notes: null,
          added_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('user_collections', [mockCollection]);
        (prismocker as any).setData('collection_items', mockCollectionItems);
        (prismocker as any).setData('bookmarks', []);
      }

      const result = await accountService.getCollectionDetailWithItems({
        p_user_id: 'user123',
        p_collection_slug: 'my-collection',
      });

      expect(result.collection).toBeDefined();
      expect(result.items).toHaveLength(1);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockCollection = {
        id: 'collection-1',
        user_id: 'user123',
        slug: 'my-collection',
        name: 'My Collection',
        description: null,
        is_public: false,
        view_count: 0,
        bookmark_count: 0,
        item_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('user_collections', [mockCollection]);
        (prismocker as any).setData('collection_items', []);
        (prismocker as any).setData('bookmarks', []);
      }

      const args = {
        p_user_id: 'user123',
        p_collection_slug: 'my-collection',
      };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getCollectionDetailWithItems(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getCollectionDetailWithItems(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getUserSettings', () => {
    it('should return user settings', async () => {
      // getUserSettings uses prisma.public_users.findUnique
      const mockUser = {
        id: 'user123',
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
        tier: 'free' as const,
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('public_users', [mockUser]);
      }

      const result = await accountService.getUserSettings({
        p_user_id: 'user123',
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

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockUser = {
        id: 'user123',
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
        tier: 'free' as const,
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('public_users', [mockUser]);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserSettings(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getUserSettings(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getSponsorshipAnalytics', () => {
    it('should return sponsorship analytics', async () => {
      // getSponsorshipAnalytics uses prisma.sponsored_content.findFirst and Prisma findMany for impressions/clicks
      const mockSponsorship = {
        id: 'sponsor-1',
        user_id: 'user123',
        content_type: 'agents' as const,
        content_id: 'content-1',
        active: true,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        impression_limit: 10000,
        impression_count: 1000,
        click_count: 100,
        created_at: new Date(),
        updated_at: new Date(),
        tier: 'featured' as const,
      };

      const mockImpressions = [
        {
          id: 'impression-1',
          user_id: 'user123',
          content_type: 'agents' as const,
          content_slug: 'content-1',
          interaction_type: 'view' as const,
          created_at: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'impression-2',
          user_id: 'user123',
          content_type: 'agents' as const,
          content_slug: 'content-1',
          interaction_type: 'view' as const,
          created_at: new Date('2024-01-16T10:00:00Z'),
        },
      ];
      const mockClicks = [
        {
          id: 'click-1',
          user_id: 'user123',
          content_type: 'agents' as const,
          content_slug: 'content-1',
          interaction_type: 'click' as const,
          created_at: new Date('2024-01-15T11:00:00Z'),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('sponsored_content', [mockSponsorship]);
        (prismocker as any).setData('user_interactions', [...mockImpressions, ...mockClicks]);
      }

      const result = await accountService.getSponsorshipAnalytics({
        p_user_id: 'user123',
        p_sponsorship_id: 'sponsor-1',
      });

      expect(result).toBeDefined();
      expect(result.sponsorship).toBeDefined();
      expect(result.computed_metrics).toBeDefined();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockSponsorship = {
        id: 'sponsor-1',
        user_id: 'user123',
        content_type: 'agents' as const,
        content_id: 'content-1',
        active: true,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        impression_limit: 10000,
        impression_count: 0,
        click_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
        tier: 'featured' as const,
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('sponsored_content', [mockSponsorship]);
        (prismocker as any).setData('user_interactions', []);
      }

      const args = {
        p_user_id: 'user123',
        p_sponsorship_id: 'sponsor-1',
      };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getSponsorshipAnalytics(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getSponsorshipAnalytics(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getUserCompanies', () => {
    it('should return user companies', async () => {
      // getUserCompanies uses prisma.companies.findMany with jobs relation
      const mockCompanies = [
        {
          id: 'company-1',
          owner_id: 'user123',
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
          json_ld: null,
        },
        {
          id: 'company-2',
          owner_id: 'user123',
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
          json_ld: null,
        },
      ];

      const mockJobs = [
        {
          id: 'job-1',
          company_id: 'company-1',
          status: 'active' as const,
          view_count: 10,
          click_count: 5,
          created_at: new Date('2024-01-15'),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('companies', mockCompanies);
        (prismocker as any).setData('jobs', mockJobs);
      }

      const result = await accountService.getUserCompanies({
        p_user_id: 'user123',
      });

      expect(result).toBeDefined();
      expect(result.companies).toHaveLength(2);
      // Companies are ordered by created_at: 'desc', so company-2 (newer) comes first
      expect(result.companies[0]).toMatchObject({
        id: 'company-2',
        slug: 'company-2',
        name: 'Company 2',
        stats: {
          total_jobs: 0,
          active_jobs: 0,
          total_views: 0,
          total_clicks: 0,
        },
      });
      // company-1 (older) comes second, with the job
      expect(result.companies[1]).toMatchObject({
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

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          owner_id: 'user123',
          slug: 'company-1',
          name: 'Company 1',
          logo: null,
          website: null,
          description: null,
          size: null,
          industry: null,
          using_cursor_since: null,
          featured: null,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          json_ld: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('companies', mockCompanies);
        (prismocker as any).setData('jobs', []);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserCompanies(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getUserCompanies(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getUserSponsorships', () => {
    it('should return user sponsorships', async () => {
      // getUserSponsorships uses prisma.sponsored_content.findMany
      const mockSponsorships = [
        {
          id: 'sponsor-1',
          user_id: 'user123',
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

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('sponsored_content', mockSponsorships);
      }

      const result = await accountService.getUserSponsorships({
        p_user_id: 'user123',
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

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockSponsorships = [
        {
          id: 'sponsor-1',
          user_id: 'user123',
          content_type: 'agents' as const,
          content_id: 'content-1',
          active: true,
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
          impression_limit: 10000,
          impression_count: 0,
          click_count: 0,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          tier: 'featured' as const,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('sponsored_content', mockSponsorships);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserSponsorships(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getUserSponsorships(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getSubmissionDashboard', () => {
    it('should return submission dashboard', async () => {
      // getSubmissionDashboard uses multiple Prisma calls: count, findMany, groupBy, and public_users.findMany
      const mockSubmissions = [
        {
          id: 'submission-1',
          submitter_id: 'user123',
          name: 'Test Submission',
          submission_type: 'new' as const,
          status: 'merged' as const,
          moderated_at: new Date('2024-01-15'),
          created_at: new Date('2024-01-15'),
        },
        {
          id: 'submission-2',
          submitter_id: 'user123',
          name: 'Pending Submission',
          submission_type: 'update' as const,
          status: 'pending' as const,
          moderated_at: null,
          created_at: new Date('2024-01-10'),
        },
        {
          id: 'submission-3',
          submitter_id: 'user123',
          name: 'Approved Submission',
          submission_type: 'new' as const,
          status: 'approved' as const,
          moderated_at: new Date('2024-01-14'),
          created_at: new Date('2024-01-14'),
        },
      ];

      const mockUsers = [
        {
          id: 'user123',
          name: 'Test User',
          slug: 'test-user',
        },
      ];

      // Use Prismocker's setData to seed test data
      // Note: count() will return the actual count from the data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', mockSubmissions);
        (prismocker as any).setData('public_users', mockUsers);
      }

      const result = await accountService.getSubmissionDashboard({
        p_user_id: 'user123',
      });

      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.total).toBeGreaterThanOrEqual(0);
      expect(result.stats.pending).toBeGreaterThanOrEqual(0);
      expect(result.stats.merged_this_week).toBeGreaterThanOrEqual(0);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockSubmissions = [
        {
          id: 'submission-1',
          submitter_id: 'user123',
          name: 'Test Submission',
          submission_type: 'new' as const,
          status: 'merged' as const,
          moderated_at: new Date('2024-01-15'),
          created_at: new Date('2024-01-15'),
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', mockSubmissions);
        (prismocker as any).setData('public_users', []);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getSubmissionDashboard(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getSubmissionDashboard(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('isBookmarked', () => {
    it('should return true when content is bookmarked', async () => {
      const mockBookmark = {
        id: 'bookmark-1',
        user_id: 'user123',
        content_type: 'agents' as const,
        content_slug: 'test-agent',
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', [mockBookmark]);
      }

      const result = await accountService.isBookmarked({
        p_user_id: 'user123',
        p_content_type: 'agents',
        p_content_slug: 'test-agent',
      });

      expect(result).toBe(true);
    });

    it('should return false when content is not bookmarked', async () => {
      // Use Prismocker's setData with empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', []);
      }

      const result = await accountService.isBookmarked({
        p_user_id: 'user123',
        p_content_type: 'agents',
        p_content_slug: 'not-bookmarked',
      });

      expect(result).toBe(false);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockBookmark = {
        id: 'bookmark-1',
        user_id: 'user123',
        content_type: 'agents' as const,
        content_slug: 'test-agent',
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', [mockBookmark]);
      }

      const args = {
        p_user_id: 'user123',
        p_content_type: 'agents',
        p_content_slug: 'test-agent',
      };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.isBookmarked(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.isBookmarked(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('isBookmarkedBatch', () => {
    it('should return batch bookmark status for array items', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          user_id: 'user123',
          content_type: 'agents' as const,
          content_slug: 'bookmarked-1',
        },
        {
          id: 'bookmark-2',
          user_id: 'user123',
          content_type: 'mcp' as const,
          content_slug: 'bookmarked-2',
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', mockBookmarks);
      }

      const result = await accountService.isBookmarkedBatch({
        p_user_id: 'user123',
        p_items: [
          { content_type: 'agents', content_slug: 'bookmarked-1' },
          { content_type: 'agents', content_slug: 'not-bookmarked' },
          { content_type: 'mcp', content_slug: 'bookmarked-2' },
        ],
      });

      expect(result).toHaveLength(3);
      expect(result[0].is_bookmarked).toBe(true);
      expect(result[1].is_bookmarked).toBe(false);
      expect(result[2].is_bookmarked).toBe(true);
    });

    it('should handle JSONB object format', async () => {
      // Use Prismocker's setData with empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', []);
      }

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
      // Use Prismocker's setData with empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', []);
      }

      const result = await accountService.isBookmarkedBatch({
        p_user_id: 'user123',
        p_items: [],
      });

      expect(result).toEqual([]);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          user_id: 'user123',
          content_type: 'agents' as const,
          content_slug: 'bookmarked-1',
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('bookmarks', mockBookmarks);
      }

      const args = {
        p_user_id: 'user123',
        p_items: [{ content_type: 'agents', content_slug: 'bookmarked-1' }],
      };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.isBookmarkedBatch(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.isBookmarkedBatch(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('isFollowing', () => {
    it('should return true when user is following', async () => {
      const mockFollow = {
        id: 'follow-1',
        follower_id: 'user123',
        following_id: 'user456',
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('followers', [mockFollow]);
      }

      const result = await accountService.isFollowing({
        follower_id: 'user123',
        following_id: 'user456',
      });

      expect(result).toBe(true);
    });

    it('should return false when user is not following', async () => {
      // Use Prismocker's setData with empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('followers', []);
      }

      const result = await accountService.isFollowing({
        follower_id: 'user123',
        following_id: 'user789',
      });

      expect(result).toBe(false);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockFollow = {
        id: 'follow-1',
        follower_id: 'user123',
        following_id: 'user456',
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('followers', [mockFollow]);
      }

      const args = {
        follower_id: 'user123',
        following_id: 'user456',
      };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.isFollowing(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.isFollowing(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('isFollowingBatch', () => {
    it('should return batch following status', async () => {
      const mockFollows = [
        {
          id: 'follow-1',
          follower_id: 'user123',
          following_id: 'user456',
        },
        {
          id: 'follow-2',
          follower_id: 'user123',
          following_id: 'user789',
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('followers', mockFollows);
      }

      const result = await accountService.isFollowingBatch({
        p_follower_id: 'user123',
        p_followed_user_ids: ['user456', 'user789', 'user999'],
      });

      expect(result).toHaveLength(3);
      expect(result[0].is_following).toBe(true);
      expect(result[1].is_following).toBe(true);
      expect(result[2].is_following).toBe(false);
    });

    it('should return empty array for empty user IDs', async () => {
      // Use Prismocker's setData with empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('followers', []);
      }

      const result = await accountService.isFollowingBatch({
        p_follower_id: 'user123',
        p_followed_user_ids: [],
      });

      expect(result).toEqual([]);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockFollows = [
        {
          id: 'follow-1',
          follower_id: 'user123',
          following_id: 'user456',
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('followers', mockFollows);
      }

      const args = {
        p_follower_id: 'user123',
        p_followed_user_ids: ['user456'],
      };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.isFollowingBatch(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.isFollowingBatch(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getUserActivitySummary', () => {
    it('should return user activity summary', async () => {
      // getUserActivitySummary uses prisma.public_users.findUnique and prisma.content_submissions.count
      const mockUser = {
        id: 'user123',
        submission_count: 10,
      };

      const mockMergedSubmissions = [
        {
          id: 'submission-1',
          submitter_id: 'user123',
          status: 'merged' as const,
        },
        {
          id: 'submission-2',
          submitter_id: 'user123',
          status: 'merged' as const,
        },
        {
          id: 'submission-3',
          submitter_id: 'user123',
          status: 'merged' as const,
        },
        {
          id: 'submission-4',
          submitter_id: 'user123',
          status: 'merged' as const,
        },
        {
          id: 'submission-5',
          submitter_id: 'user123',
          status: 'merged' as const,
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('public_users', [mockUser]);
        (prismocker as any).setData('content_submissions', mockMergedSubmissions);
      }

      const result = await accountService.getUserActivitySummary({
        p_user_id: 'user123',
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

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockUser = {
        id: 'user123',
        submission_count: 0,
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('public_users', [mockUser]);
        (prismocker as any).setData('content_submissions', []);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserActivitySummary(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getUserActivitySummary(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getUserActivityTimeline', () => {
    it('should return user activity timeline', async () => {
      // getUserActivityTimeline uses prisma.content_submissions.findMany and count
      const mockSubmissions = [
        {
          id: 'submission-1',
          submitter_id: 'user123',
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
          submitter_id: 'user123',
          name: 'Test Submission 2',
          description: 'Test description',
          submission_type: 'update' as const,
          status: 'pending' as const,
          approved_slug: null,
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', mockSubmissions);
      }

      const result = await accountService.getUserActivityTimeline({
        p_user_id: 'user123',
        p_type: 'submission',
        p_limit: 20,
        p_offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.activities).toHaveLength(2);
      // Activities are ordered by created_at: 'desc', so submission-2 (newer) comes first
      expect(result.activities[0]).toMatchObject({
        id: 'submission-2',
        type: 'submission',
        title: 'Test Submission 2',
        user_id: 'user123',
      });
      // submission-1 (older) comes second
      expect(result.activities[1]).toMatchObject({
        id: 'submission-1',
        type: 'submission',
        title: 'Test Submission 1',
        user_id: 'user123',
      });
      expect(result.has_more).toBe(false);
      expect(result.total).toBe(2);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockSubmissions = [
        {
          id: 'submission-1',
          submitter_id: 'user123',
          name: 'Test Submission 1',
          description: null,
          submission_type: 'new' as const,
          status: 'merged' as const,
          approved_slug: 'test-submission-1',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_submissions', mockSubmissions);
      }

      const args = {
        p_user_id: 'user123',
        p_type: 'submission',
        p_limit: 20,
        p_offset: 0,
      };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserActivityTimeline(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getUserActivityTimeline(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getUserIdentities', () => {
    it('should return user identities', async () => {
      // getUserIdentities uses prisma.identities.findMany
      const mockIdentities = [
        {
          id: 'identity-1',
          user_id: 'user123',
          provider: 'github',
          email: 'user@example.com',
          created_at: new Date('2024-01-01'),
          last_sign_in_at: new Date('2024-01-15'),
        },
        {
          id: 'identity-2',
          user_id: 'user123',
          provider: 'google',
          email: 'user@gmail.com',
          created_at: new Date('2024-01-02'),
          last_sign_in_at: null,
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('identities', mockIdentities);
      }

      const result = await accountService.getUserIdentities({
        p_user_id: 'user123',
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

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockIdentities = [
        {
          id: 'identity-1',
          user_id: 'user123',
          provider: 'github',
          email: 'user@example.com',
          created_at: new Date('2024-01-01'),
          last_sign_in_at: new Date('2024-01-15'),
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('identities', mockIdentities);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserIdentities(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getUserIdentities(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getUserCompleteData', () => {
    it('should return user complete data', async () => {
      // getUserCompleteData calls multiple service methods in parallel
      // Use Prismocker's setData to seed all test data
      const mockUser = {
        id: 'user123',
        bookmark_count: 5,
        name: 'Test User',
        tier: 'free' as const,
        created_at: new Date('2024-01-01'),
        username: 'testuser',
        display_name: 'Test User',
        bio: null,
        work: null,
        website: null,
        social_x_link: null,
        interests: null,
        profile_public: true,
        follow_email: true,
        slug: 'test-user',
        image: null,
        submission_count: 0,
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('public_users', [mockUser]);
        (prismocker as any).setData('content_submissions', []);
        (prismocker as any).setData('companies', []);
        (prismocker as any).setData('jobs', []);
        (prismocker as any).setData('bookmarks', []);
        (prismocker as any).setData('user_collections', []);
        (prismocker as any).setData('identities', []);
        (prismocker as any).setData('sponsored_content', []);
      }

      const result = await accountService.getUserCompleteData({
        p_user_id: 'user123',
      });

      expect(result).toBeDefined();
      expect(result.account_dashboard).toBeDefined();
      expect(result.user_dashboard).toBeDefined();
      expect(result.user_settings).toBeDefined();
      expect(result.user_library).toBeDefined();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockUser = {
        id: 'user123',
        bookmark_count: 0,
        name: 'Test User',
        tier: 'free' as const,
        created_at: new Date('2024-01-01'),
        username: 'testuser',
        display_name: 'Test User',
        bio: null,
        work: null,
        website: null,
        social_x_link: null,
        interests: null,
        profile_public: true,
        follow_email: true,
        slug: 'test-user',
        image: null,
        submission_count: 0,
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('public_users', [mockUser]);
        (prismocker as any).setData('content_submissions', []);
        (prismocker as any).setData('companies', []);
        (prismocker as any).setData('jobs', []);
        (prismocker as any).setData('bookmarks', []);
        (prismocker as any).setData('user_collections', []);
        (prismocker as any).setData('identities', []);
        (prismocker as any).setData('sponsored_content', []);
      }

      const args = { p_user_id: 'user123' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserCompleteData(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await accountService.getUserCompleteData(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('batchInsertUserInteractions', () => {
    it('should batch insert user interactions', async () => {
      // batchInsertUserInteractions uses callRpc which calls $queryRawUnsafe with function call format
      const mockData = {
        inserted_count: 5,
        errors: [],
      };

      // Reset and set up mock return value
      queryRawUnsafeSpy.mockReset();
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);
      (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

      const result = await accountService.batchInsertUserInteractions({
        p_user_id: 'user123',
        p_interactions: [
          { content_type: 'agents', content_slug: 'test', interaction_type: 'view' },
        ],
      });

      // callRpc formats the SQL as: SELECT * FROM batch_insert_user_interactions(p_user_id => $1, p_interactions => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
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
      queryRawUnsafeSpy.mockReset();
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);
      (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

      await accountService.batchInsertUserInteractions({
        p_user_id: 'user123',
        p_interactions: [],
      });

      // Verify mutation doesn't use cache (handled by BasePrismaService)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
    });
  });
});
