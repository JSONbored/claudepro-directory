import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getCommunityDirectory, getPublicUserProfile, getPublicCollectionDetail } from './community';
import { normalizeError } from '../errors';
import { logger } from '../logger';
import { pulseUserSearch } from '../pulse';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

// Mock pulse
jest.mock('../pulse', () => ({
  pulseUserSearch: vi.fn().mockResolvedValue(undefined),
}));

// Mock cached-data-factory - use globalThis to avoid hoisting issues
jest.mock('./cached-data-factory', () => {
  // Initialize mocks in globalThis
  if (!(globalThis as any).__communityMocks) {
    (globalThis as any).__communityMocks = {
      searchUsersUnified: vi.fn(),
      getCommunityDirectoryRpc: vi.fn(),
      getPublicUserProfile: vi.fn(),
      getPublicCollectionDetail: vi.fn(),
    };
  }
  
  return {
    createDataFunction: vi.fn((config: any) => {
      if (!(globalThis as any).__dataFunctionConfigs) {
        (globalThis as any).__dataFunctionConfigs = new Map();
      }
      (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
      
      if (config.operation === 'searchUsersUnified') {
        return (globalThis as any).__communityMocks.searchUsersUnified;
      }
      if (config.operation === 'getCommunityDirectoryRpc') {
        return (globalThis as any).__communityMocks.getCommunityDirectoryRpc;
      }
      if (config.operation === 'getPublicUserProfile') {
        return (globalThis as any).__communityMocks.getPublicUserProfile;
      }
      if (config.operation === 'getPublicCollectionDetail') {
        return (globalThis as any).__communityMocks.getPublicCollectionDetail;
      }
      return vi.fn().mockResolvedValue(null);
    }),
  };
});

describe('community data functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset community mocks
    if ((globalThis as any).__communityMocks) {
      (globalThis as any).__communityMocks.searchUsersUnified.mockClear();
      (globalThis as any).__communityMocks.getCommunityDirectoryRpc.mockClear();
      (globalThis as any).__communityMocks.getPublicUserProfile.mockClear();
      (globalThis as any).__communityMocks.getPublicCollectionDetail.mockClear();
    }
  });

  describe('getCommunityDirectory', () => {
    it('should return RPC result when no search query', async () => {
      const mockResult = {
        all_users: [],
        new_members: [],
        top_contributors: [],
      };
      (globalThis as any).__communityMocks.getCommunityDirectoryRpc.mockResolvedValue(mockResult);

      const result = await getCommunityDirectory({});

      expect(result).toEqual(mockResult);
      expect((globalThis as any).__communityMocks.getCommunityDirectoryRpc).toHaveBeenCalledWith(100);
    });

    it('should use search when searchQuery provided', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          slug: 'user-1',
          name: 'Test User',
          bio: null,
          created_at: '2024-01-01',
          image: null,
          tier: 'free' as const,
          work: null,
        },
      ];
      (globalThis as any).__communityMocks.searchUsersUnified.mockResolvedValue(mockUsers);

      const result = await getCommunityDirectory({ searchQuery: 'test' });

      expect(result).toEqual({
        all_users: mockUsers,
        new_members: [],
        top_contributors: [],
      });
      expect((globalThis as any).__communityMocks.searchUsersUnified).toHaveBeenCalledWith({
        limit: 100,
        query: 'test',
      });
    });

    it('should fallback to RPC on search error', async () => {
      (globalThis as any).__communityMocks.searchUsersUnified.mockRejectedValue(new Error('Search failed'));
      const mockRpcResult = {
        all_users: [],
        new_members: [],
        top_contributors: [],
      };
      (globalThis as any).__communityMocks.getCommunityDirectoryRpc.mockResolvedValue(mockRpcResult);

      const result = await getCommunityDirectory({ searchQuery: 'test' });

      expect(result).toEqual(mockRpcResult);
    });

    it('should handle empty search query', async () => {
      const mockResult = {
        all_users: [],
        new_members: [],
        top_contributors: [],
      };
      (globalThis as any).__communityMocks.getCommunityDirectoryRpc.mockResolvedValue(mockResult);

      const result = await getCommunityDirectory({ searchQuery: '   ' });

      expect(result).toEqual(mockResult);
      expect((globalThis as any).__communityMocks.getCommunityDirectoryRpc).toHaveBeenCalled();
    });
  });

  describe('getPublicUserProfile', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getPublicUserProfile');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('misc');
      expect(config?.methodName).toBe('getUserProfile');
    });

    it('should transform args correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getPublicUserProfile');
      const transformArgs = config?.transformArgs;
      
      expect(transformArgs({ slug: 'test-user' })).toEqual({
        p_user_slug: 'test-user',
      });
      
      expect(transformArgs({ slug: 'test-user', viewerId: 'viewer-id' })).toEqual({
        p_user_slug: 'test-user',
        p_viewer_id: 'viewer-id',
      });
    });
  });

  describe('getPublicCollectionDetail', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getPublicCollectionDetail');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('misc');
      expect(config?.methodName).toBe('getUserCollectionDetail');
    });

    it('should transform args correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getPublicCollectionDetail');
      const transformArgs = config?.transformArgs;
      
      expect(transformArgs({ userSlug: 'user', collectionSlug: 'collection' })).toEqual({
        p_user_slug: 'user',
        p_collection_slug: 'collection',
      });
      
      expect(transformArgs({ userSlug: 'user', collectionSlug: 'collection', viewerId: 'viewer' })).toEqual({
        p_user_slug: 'user',
        p_collection_slug: 'collection',
        p_viewer_id: 'viewer',
      });
    });
  });
});

