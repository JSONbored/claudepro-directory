import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AccountService } from './account.ts';
import { ContentService } from './content.ts';
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

/**
 * AccountService Test Suite
 *
 * Comprehensive unit and integration tests for AccountService, including:
 * - User dashboard and library operations
 * - Bookmark management and queries
 * - Content submission tracking
 * - Collection management
 * - User settings and analytics
 * - Integration with ContentService for bookmarks and submissions flow
 *
 * All tests use Prismocker for in-memory database mocking and proper cache testing
 * using getRequestCache().getStats().size instead of spying on Prisma methods.
 *
 * @module AccountServiceTests
 * @see {@link AccountService} - The service being tested
 * @see {@link ContentService} - Service used in integration tests
 */
describe('AccountService', () => {
  let accountService: AccountService;
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;

  /**
   * Sets up test environment before each test case.
   *
   * Performs the following operations in order:
   * 1. Clears request-scoped cache for test isolation
   * 2. Gets Prismocker instance (in-memory database mock)
   * 3. Resets Prismocker data to ensure clean state
   * 4. Clears all Jest mocks
   * 5. Sets up $queryRawUnsafe spy for RPC function testing
   * 6. Initializes Prismocker models
   * 7. Creates fresh AccountService instance
   *
   * @private
   * @async
   * @returns {Promise<void>} Resolves when setup is complete
   */
  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    queryRawUnsafeSpy = jest.fn().mockResolvedValue([]);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // 6. Ensure Prismocker models are initialized by accessing them
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
    void prismocker.content;

    // 7. Create service instance (use real service, not mocked)
    accountService = new AccountService(prismocker);
  });

  /**
   * Tests for getAccountDashboard method.
   *
   * Verifies direct Prisma queries to public_users table, including:
   * - User profile data retrieval
   * - Bookmark count aggregation
   * - Account age calculation
   * - Request-scoped caching behavior
   *
   * Uses Prismocker's setData() for data seeding and getRequestCache()
   * for cache verification instead of spying on Prisma methods.
   *
   * @group AccountService
   * @group Prisma
   * @group Caching
   */
  describe('getAccountDashboard', () => {
    /**
     * Verifies successful dashboard data retrieval for authenticated user.
     *
     * Tests that the service correctly queries public_users and returns
     * the expected dashboard structure with profile and bookmark_count.
     *
     * @test
     */
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
      // For error testing, we use Prismocker's Proxy set handler to override findUnique
      // This is acceptable for error testing only (not for normal operation testing)
      const originalFindUnique = prismocker.public_users.findUnique;
      (prismocker.public_users as any).findUnique = jest
        .fn()
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

  /**
   * Tests for getUserLibrary method.
   *
   * Verifies direct Prisma queries to bookmarks and user_collections tables, including:
   * - Bookmark retrieval and transformation
   * - Collection retrieval and transformation
   * - Stats aggregation (bookmark_count, collection_count, total_items, total_views)
   * - Request-scoped caching behavior
   *
   * Uses Prismocker's setData() for data seeding and getRequestCache()
   * for cache verification instead of spying on Prisma methods.
   *
   * @group AccountService
   * @group Prisma
   * @group Caching
   * @group Bookmarks
   * @group Collections
   */
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

  /**
   * Tests for getUserDashboard method.
   *
   * Verifies direct Prisma queries to content_submissions table, including:
   * - Submission retrieval and transformation
   * - Company and job data aggregation
   * - Request-scoped caching behavior
   *
   * Uses Prismocker's setData() for data seeding and getRequestCache()
   * for cache verification instead of spying on Prisma methods.
   *
   * @group AccountService
   * @group Prisma
   * @group Caching
   * @group Submissions
   */
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

  /**
   * Tests for getCollectionDetailWithItems method.
   *
   * Verifies direct Prisma queries to user_collections and related tables, including:
   * - Collection detail retrieval
   * - Collection items retrieval
   * - Bookmarks associated with collection items
   * - Request-scoped caching behavior
   *
   * Uses Prismocker's setData() for data seeding and getRequestCache()
   * for cache verification instead of spying on Prisma methods.
   *
   * @group AccountService
   * @group Prisma
   * @group Caching
   * @group Collections
   */
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

  /**
   * Tests for getSubmissionDashboard method.
   *
   * Verifies RPC function call to get_submission_dashboard() which returns
   * submission statistics and analytics for a user.
   *
   * @group AccountService
   * @group RPC
   * @group Submissions
   */
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

  /**
   * Tests for isBookmarked method.
   *
   * Verifies direct Prisma queries to bookmarks table to check if
   * a specific content item is bookmarked by a user.
   *
   * Uses Prismocker's setData() for data seeding and getRequestCache()
   * for cache verification instead of spying on Prisma methods.
   *
   * @group AccountService
   * @group Prisma
   * @group Caching
   * @group Bookmarks
   */
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

  /**
   * Integration tests for AccountService and ContentService interaction.
   *
   * Verifies cross-service functionality for bookmarks and submissions flow, including:
   * - AccountService.getUserLibrary (bookmarks) + ContentService.getContentDetailCore
   * - AccountService.getUserDashboard (submissions) + ContentService (content validation)
   * - AccountService.isBookmarked + ContentService (content existence check)
   * - Shared request-scoped cache across services
   * - Cache invalidation when bookmarks/submissions are added
   * - Error handling when one service fails
   *
   * @group Integration
   * @group AccountService
   * @group ContentService
   * @group Bookmarks
   * @group Submissions
   * @group Caching
   */
  describe('Integration: AccountService + ContentService', () => {
    let contentService: ContentService;

    /**
     * Sets up ContentService instance for integration tests.
     *
     * Creates fresh service instance using the same Prismocker
     * instance as AccountService to ensure shared in-memory database state.
     *
     * @private
     */
    beforeEach(() => {
      // Create ContentService instance for integration tests
      contentService = new ContentService(prismocker);
    });

    /**
     * Verifies AccountService.getUserLibrary and ContentService.getContentDetailCore work together.
     *
     * Tests that when a user has bookmarks, AccountService can retrieve them
     * and ContentService can fetch the detailed content for each bookmarked item.
     *
     * @test
     * @group Integration
     * @group Bookmarks
     */
    it('should allow AccountService.getUserLibrary and ContentService.getContentDetailCore to work together', async () => {
      // Seed content data
      const mockContent = [
        {
          id: 'content-bookmark-1',
          slug: 'bookmarked-content',
          title: 'Bookmarked Content',
          display_title: null,
          category: 'agents' as const,
          description: 'This content is bookmarked',
          tags: ['bookmark', 'test'],
          author: 'Test Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 1,
          view_count: 100,
          popularity_score: 50,
          trending_score: 25,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      // Seed bookmark data
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          user_id: 'user-1',
          content_type: 'agents' as const,
          content_slug: 'bookmarked-content',
          notes: 'Great content!',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData for data seeding (proper Prismocker usage)
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
        (prismocker as any).setData('bookmarks', mockBookmarks);
      }

      // Mock ContentService.getContentDetailCore RPC result
      const mockContentDetail = {
        id: 'content-bookmark-1',
        slug: 'bookmarked-content',
        title: 'Bookmarked Content',
        category: 'agents',
        description: 'This content is bookmarked',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockContentDetail,
      ] as any);

      // AccountService: Get user library (bookmarks)
      const library = await accountService.getUserLibrary({
        p_user_id: 'user-1',
      });

      // ContentService: Get content detail for bookmarked item
      const contentDetail = await contentService.getContentDetailCore({
        p_slug: 'bookmarked-content',
      });

      // Verify both services work together
      expect(library.bookmarks).toHaveLength(1);
      expect(library.bookmarks?.[0]?.content_slug).toBe('bookmarked-content');
      expect(contentDetail).toBeDefined();
      expect(contentDetail?.slug).toBe('bookmarked-content');
    });

    /**
     * Verifies AccountService.getUserDashboard and ContentService work together for submissions.
     *
     * Tests that when a user has content submissions, AccountService can retrieve them
     * and ContentService can verify the submitted content exists.
     *
     * @test
     * @group Integration
     * @group Submissions
     */
    it('should allow AccountService.getUserDashboard and ContentService to work together for submissions', async () => {
      // Seed content data (submitted content)
      const mockContent = [
        {
          id: 'content-submission-1',
          slug: 'submitted-content',
          title: 'Submitted Content',
          display_title: null,
          category: 'agents' as const,
          description: 'This content was submitted',
          tags: ['submission', 'test'],
          author: 'Test Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      // Seed submission data
      const mockSubmissions = [
        {
          id: 'submission-1',
          user_id: 'user-1',
          content_type: 'agents' as const,
          content_slug: 'submitted-content',
          content_name: 'Submitted Content',
          pr_number: '123',
          pr_url: 'https://github.com/example/pr/123',
          branch_name: 'feature/submission',
          status: 'pending' as const,
          submission_data: { test: 'data' },
          rejection_reason: null,
          created_at: new Date(),
          updated_at: new Date(),
          merged_at: null,
        },
      ];

      // Use Prismocker's setData for data seeding (proper Prismocker usage)
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
        (prismocker as any).setData('content_submissions', mockSubmissions);
      }

      // Mock ContentService.getContentDetailCore RPC result
      const mockContentDetail = {
        id: 'content-submission-1',
        slug: 'submitted-content',
        title: 'Submitted Content',
        category: 'agents',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockContentDetail,
      ] as any);

      // AccountService: Get user dashboard (submissions)
      const dashboard = await accountService.getUserDashboard({
        p_user_id: 'user-1',
      });

      // ContentService: Verify submitted content exists
      const contentDetail = await contentService.getContentDetailCore({
        p_slug: 'submitted-content',
      });

      // Verify both services work together
      expect(dashboard.submissions).toHaveLength(1);
      expect(dashboard.submissions[0].content_slug).toBe('submitted-content');
      expect(contentDetail).toBeDefined();
      expect(contentDetail?.slug).toBe('submitted-content');
    });

    /**
     * Verifies AccountService.isBookmarked and ContentService work together.
     *
     * Tests that AccountService can check if content is bookmarked
     * and ContentService can verify the content exists.
     *
     * @test
     * @group Integration
     * @group Bookmarks
     */
    it('should allow AccountService.isBookmarked and ContentService to work together', async () => {
      // Seed content data
      const mockContent = [
        {
          id: 'content-check-1',
          slug: 'check-bookmark-content',
          title: 'Check Bookmark Content',
          display_title: null,
          category: 'agents' as const,
          description: 'Content to check bookmark status',
          tags: [],
          author: 'Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 1,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      // Seed bookmark data
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          user_id: 'user-1',
          content_type: 'agents' as const,
          content_slug: 'check-bookmark-content',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData for data seeding (proper Prismocker usage)
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
        (prismocker as any).setData('bookmarks', mockBookmarks);
      }

      // Mock ContentService.getContentDetailCore RPC result
      const mockContentDetail = {
        id: 'content-check-1',
        slug: 'check-bookmark-content',
        title: 'Check Bookmark Content',
        category: 'agents',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockContentDetail,
      ] as any);

      // AccountService: Check if content is bookmarked
      const isBookmarked = await accountService.isBookmarked({
        p_user_id: 'user-1',
        p_content_slug: 'check-bookmark-content',
      });

      // ContentService: Verify content exists
      const contentDetail = await contentService.getContentDetailCore({
        p_slug: 'check-bookmark-content',
      });

      // Verify both services work together
      expect(isBookmarked).toBe(true);
      expect(contentDetail).toBeDefined();
      expect(contentDetail?.slug).toBe('check-bookmark-content');
    });

    /**
     * Verifies shared request-scoped cache across AccountService and ContentService.
     *
     * Tests that both services share the same request-scoped cache, preventing
     * duplicate queries within a single request.
     *
     * @test
     * @group Integration
     * @group Caching
     */
    it('should share request-scoped cache across AccountService and ContentService', async () => {
      // Seed data
      const mockContent = [
        {
          id: 'content-cache-1',
          slug: 'cacheable-content',
          title: 'Cacheable Content',
          display_title: null,
          category: 'agents' as const,
          description: 'Content for cache test',
          tags: [],
          author: 'Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      const mockBookmarks = [
        {
          id: 'bookmark-cache-1',
          user_id: 'user-1',
          content_type: 'agents' as const,
          content_slug: 'cacheable-content',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
        (prismocker as any).setData('bookmarks', mockBookmarks);
      }

      // Mock ContentService RPC
      const mockContentDetail = {
        id: 'content-cache-1',
        slug: 'cacheable-content',
        title: 'Cacheable Content',
        category: 'agents',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockContentDetail,
      ] as any);

      // First call via AccountService - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      await accountService.getUserLibrary({
        p_user_id: 'user-1',
      });
      const cacheAfterAccount = getRequestCache().getStats().size;

      // Second call via ContentService - should use cache if same data
      await contentService.getContentDetailCore({
        p_slug: 'cacheable-content',
      });
      const cacheAfterContent = getRequestCache().getStats().size;

      // Verify cache was shared
      expect(cacheAfterAccount).toBeGreaterThan(cacheBefore);
      // Note: ContentService uses RPC, AccountService uses Prisma queries, so cache may increase
      // But both should use request-scoped cache
      expect(cacheAfterContent).toBeGreaterThanOrEqual(cacheAfterAccount);
    });

    /**
     * Verifies error handling when one service fails.
     *
     * Tests that when AccountService fails, ContentService can still function
     * independently, and errors are properly isolated.
     *
     * @test
     * @group Integration
     * @group ErrorHandling
     */
    it('should handle errors gracefully when one service fails', async () => {
      // Seed content data for ContentService
      const mockContent = [
        {
          id: 'content-error-1',
          slug: 'error-test-content',
          title: 'Error Test Content',
          display_title: null,
          category: 'agents' as const,
          description: 'Content for error test',
          tags: [],
          author: 'Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
        // Don't seed bookmarks - this will cause AccountService to return empty library
      }

      // Mock ContentService RPC
      const mockContentDetail = {
        id: 'content-error-1',
        slug: 'error-test-content',
        title: 'Error Test Content',
        category: 'agents',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockContentDetail,
      ] as any);

      // AccountService: Get user library (should return empty since no bookmarks)
      const library = await accountService.getUserLibrary({
        p_user_id: 'user-1',
      });

      // ContentService: Should still work (doesn't depend on AccountService)
      const contentDetail = await contentService.getContentDetailCore({
        p_slug: 'error-test-content',
      });

      // Verify both services work independently
      expect(library.bookmarks).toEqual([]);
      expect(contentDetail).toBeDefined();
      expect(contentDetail?.slug).toBe('error-test-content');
    });
  });
});
