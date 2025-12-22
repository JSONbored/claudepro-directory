import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  getCommunityDirectory,
  getPublicUserProfile,
  getPublicCollectionDetail,
} from './community';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock logger
jest.mock('../logger.ts', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock normalizeError
jest.mock('../errors.ts', () => ({
  normalizeError: jest.fn((error: unknown, message?: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message || (typeof error === 'string' ? error : 'Unknown error'));
  }),
}));

// Mock pulse
jest.mock('../pulse', () => ({
  pulseUserSearch: jest.fn().mockResolvedValue(undefined),
}));

// Don't mock createDataFunction - use real implementation
// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts
// All functions use RPC calls via $queryRawUnsafe

describe('community data functions', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    jest.clearAllMocks();

    // Set up $queryRawUnsafe for RPC testing (all functions use RPC)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('getCommunityDirectory', () => {
    it('should return RPC result when no search query', async () => {
      // getCommunityDirectory calls getCommunityDirectoryRpc which uses MiscService.getCommunityDirectory (RPC)
      const mockRpcResult = {
        all_users: [],
        new_members: [],
        top_contributors: [],
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await getCommunityDirectory({});

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_limit
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_community_directory'),
        100 // p_limit (default)
      );
      expect(result).toEqual(mockRpcResult);
    });

    it('should use search when searchQuery provided', async () => {
      // getCommunityDirectory calls searchUsersUnified which uses SearchService.searchUnified (RPC)
      // RPC returns composite type: { results: [...], total_count: number }
      // SearchService.searchUnified transforms it to: { data: [...], total_count: number }
      // transformResult in searchUsersUnified receives { data: [...], total_count: number } and extracts data array
      const mockSearchRpcResult = {
        results: [
          {
            id: 'user-1',
            slug: 'user-1',
            title: 'Test User',
            description: 'Bio',
            created_at: '2024-01-01',
          },
        ],
        total_count: 1n,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockSearchRpcResult] as any);

      const result = await getCommunityDirectory({ searchQuery: 'test' });

      // $queryRawUnsafe is called with search_unified RPC
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('search_unified'),
        expect.anything(), // p_entities: ['user']
        expect.anything(), // p_highlight_query: 'test'
        expect.anything(), // p_limit: 100
        expect.anything(), // p_offset: 0
        expect.anything() // p_query: 'test'
      );

      expect(result).toEqual({
        all_users: [
          {
            id: 'user-1',
            slug: 'user-1',
            name: 'Test User',
            bio: 'Bio',
            created_at: '2024-01-01',
            image: null,
            tier: 'free',
            work: null,
          },
        ],
        new_members: [],
        top_contributors: [],
      });
    });

    it('should return empty result when search fails (onError handler)', async () => {
      // searchUsersUnified has onError: () => [], so errors are caught by createDataFunction
      // and it returns an empty array instead of throwing
      // This means the try-catch in getCommunityDirectory won't catch an error
      // Instead, searchUsersUnified will return [] on error, and getCommunityDirectory
      // will return { all_users: [], new_members: [], top_contributors: [] }
      
      // Mock search_unified RPC to fail
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(new Error('Search failed'));

      const result = await getCommunityDirectory({ searchQuery: 'test' });

      // searchUsersUnified's onError handler returns [], so result should be empty arrays
      // The try-catch in getCommunityDirectory won't be triggered because onError handles it
      expect(result).toEqual({
        all_users: [],
        new_members: [],
        top_contributors: [],
      });
      // Only one call because onError prevents the error from bubbling up
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });

    it('should handle empty search query', async () => {
      const mockRpcResult = {
        all_users: [],
        new_members: [],
        top_contributors: [],
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await getCommunityDirectory({ searchQuery: '   ' });

      // Empty/whitespace search query should use RPC (not search)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_community_directory'),
        expect.anything() // p_limit
      );
      expect(result).toEqual(mockRpcResult);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockRpcResult = {
        all_users: [],
        new_members: [],
        top_contributors: [],
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getCommunityDirectory({});
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      const result2 = await getCommunityDirectory({});
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);

      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });

    it('should handle custom limit', async () => {
      const mockRpcResult = {
        all_users: [],
        new_members: [],
        top_contributors: [],
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await getCommunityDirectory({ limit: 50 });

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_community_directory'),
        50 // p_limit (custom)
      );
      expect(result).toEqual(mockRpcResult);
    });
  });

  describe('getPublicUserProfile', () => {
    it('should return user profile on success', async () => {
      // getPublicUserProfile uses MiscService.getUserProfile which calls RPC get_user_profile
      const mockRpcResult = {
        id: 'user-1',
        slug: 'test-user',
        name: 'Test User',
        bio: 'Bio text',
        image: null,
        tier: 'free',
        created_at: '2024-01-01',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await getPublicUserProfile({ slug: 'test-user' });

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_profile'),
        'test-user' // p_user_slug
      );
      expect(result).toEqual(mockRpcResult);
    });

    it('should include viewerId when provided', async () => {
      const mockRpcResult = {
        id: 'user-1',
        slug: 'test-user',
        name: 'Test User',
        bio: 'Bio text',
        image: null,
        tier: 'free',
        created_at: '2024-01-01',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      await getPublicUserProfile({ slug: 'test-user', viewerId: 'viewer-id' });

      // Arguments are passed in object key insertion order: p_user_slug, p_viewer_id
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_profile'),
        'test-user', // p_user_slug
        'viewer-id' // p_viewer_id
      );
    });

    it('should return null when user not found', async () => {
      // Empty array means user not found
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([] as any);

      const result = await getPublicUserProfile({ slug: 'non-existent' });

      expect(result).toBeUndefined();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockRpcResult = {
        id: 'user-1',
        slug: 'test-user',
        name: 'Test User',
        bio: 'Bio text',
        image: null,
        tier: 'free',
        created_at: '2024-01-01',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const args = { slug: 'test-user' };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getPublicUserProfile(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      const result2 = await getPublicUserProfile(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);

      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPublicCollectionDetail', () => {
    it('should return collection detail on success', async () => {
      // getPublicCollectionDetail uses MiscService.getUserCollectionDetail which calls RPC get_user_collection_detail
      const mockRpcResult = {
        id: 'collection-1',
        slug: 'collection',
        name: 'My Collection',
        description: 'Collection description',
        user_id: 'user-1',
        user_slug: 'user',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await getPublicCollectionDetail({
        userSlug: 'user',
        collectionSlug: 'collection',
      });

      // Arguments are passed in object key insertion order: p_collection_slug, p_user_slug
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_collection_detail'),
        'collection', // p_collection_slug
        'user' // p_user_slug
      );
      expect(result).toEqual(mockRpcResult);
    });

    it('should include viewerId when provided', async () => {
      const mockRpcResult = {
        id: 'collection-1',
        slug: 'collection',
        name: 'My Collection',
        description: 'Collection description',
        user_id: 'user-1',
        user_slug: 'user',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      await getPublicCollectionDetail({
        userSlug: 'user',
        collectionSlug: 'collection',
        viewerId: 'viewer-id',
      });

      // Arguments are passed in object key insertion order: p_collection_slug, p_user_slug, p_viewer_id
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_collection_detail'),
        'collection', // p_collection_slug
        'user', // p_user_slug
        'viewer-id' // p_viewer_id
      );
    });

    it('should return null when collection not found', async () => {
      // Empty array means collection not found
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([] as any);

      const result = await getPublicCollectionDetail({
        userSlug: 'user',
        collectionSlug: 'non-existent',
      });

      expect(result).toBeUndefined();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockRpcResult = {
        id: 'collection-1',
        slug: 'collection',
        name: 'My Collection',
        description: 'Collection description',
        user_id: 'user-1',
        user_slug: 'user',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const args = {
        userSlug: 'user',
        collectionSlug: 'collection',
      };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getPublicCollectionDetail(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      const result2 = await getPublicCollectionDetail(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);

      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });
  });
});
