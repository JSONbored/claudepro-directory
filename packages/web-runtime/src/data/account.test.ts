import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getUserCompleteData,
  getUserBookmarksForCollections,
  getUserJobById,
  getAccountDashboardBundle,
  isBookmarked,
  isFollowing,
  isBookmarkedBatch,
  isFollowingBatch,
} from './account';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock Supabase client - must define inline to avoid hoisting issues
vi.mock('../supabase/server.ts', () => ({
  createSupabaseServerClient: vi.fn(() => ({})),
}));

// Mock auth - must define inline to avoid hoisting issues
vi.mock('../auth/get-authenticated-user.ts', () => ({
  getAuthenticatedUserFromClient: vi.fn(),
}));

// Mock service factory - must define inline to avoid hoisting issues
vi.mock('./service-factory.ts', () => ({
  getService: vi.fn(),
}));

// Mock logger
vi.mock('../logger.ts', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    })),
  },
}));

// Mock errors
vi.mock('../errors.ts', () => ({
  normalizeError: (error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
}));

// Mock homepage data
vi.mock('./content/homepage.ts', () => ({
  getHomepageData: vi.fn().mockResolvedValue({ categories: [] }),
}));

// Mock category config
vi.mock('./config/category/index.ts', () => ({
  getHomepageCategoryIds: ['agents', 'mcp'],
}));

describe('account data functions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockAccountService = {
    getUserCompleteData: vi.fn(),
    isBookmarked: vi.fn(),
    isFollowing: vi.fn(),
    isBookmarkedBatch: vi.fn(),
    isFollowingBatch: vi.fn(),
  } as any; // Use 'as any' to allow dynamic method assignment in tests

  let mockGetAuthenticatedUserFromClient: ReturnType<typeof vi.fn>;
  let mockGetService: ReturnType<typeof vi.fn>;
  let mockCreateSupabaseServerClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get mocked functions
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { getAuthenticatedUserFromClient } = await import('../auth/get-authenticated-user.ts');
    const { getService } = await import('./service-factory.ts');
    
    mockCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);
    mockGetAuthenticatedUserFromClient = vi.mocked(getAuthenticatedUserFromClient);
    mockGetService = vi.mocked(getService);
    
    mockCreateSupabaseServerClient.mockReturnValue({});
    mockGetAuthenticatedUserFromClient.mockResolvedValue({
      user: mockUser,
      isAuthenticated: true,
    });
    mockGetService.mockResolvedValue(mockAccountService);
    
    // Reset service method mocks
    mockAccountService.getUserCompleteData.mockReset();
    mockAccountService.isBookmarked.mockReset();
    mockAccountService.isFollowing.mockReset();
    mockAccountService.isBookmarkedBatch.mockReset();
    mockAccountService.isFollowingBatch.mockReset();
  });

  describe('getUserCompleteData', () => {
    it('should return user complete data successfully', async () => {
      const mockData = {
        account_dashboard: {
          bookmark_count: 5,
          profile: {
            created_at: '2024-01-01',
            name: 'Test User',
            tier: 'free',
          },
        },
        user_dashboard: {
          jobs: [{ id: 'job-1', title: 'Test Job' }],
        },
        user_library: {
          bookmarks: [],
        },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockData);

      const result = await getUserCompleteData('user-123');

      expect(result).toEqual(mockData);
      expect(mockGetAuthenticatedUserFromClient).toHaveBeenCalled();
      expect(mockAccountService.getUserCompleteData).toHaveBeenCalledWith({
        p_user_id: 'user-123',
        p_activity_limit: 20,
        p_activity_offset: 0,
        p_activity_type: null,
      });
    });

    it('should return null when authentication fails', async () => {
      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: null,
        isAuthenticated: false,
        error: new Error('No valid session'),
      });

      const result = await getUserCompleteData('user-123');

      expect(result).toBeNull();
      expect(mockAccountService.getUserCompleteData).not.toHaveBeenCalled();
    });

    it('should return null when userId mismatch', async () => {
      mockGetAuthenticatedUserFromClient.mockResolvedValue({
        user: { id: 'different-user' },
        isAuthenticated: true,
      });

      const result = await getUserCompleteData('user-123');

      expect(result).toBeNull();
      expect(mockAccountService.getUserCompleteData).not.toHaveBeenCalled();
    });

    it('should handle activity options correctly', async () => {
      const mockData = { account_dashboard: {}, user_dashboard: {}, user_library: {} };
      mockAccountService.getUserCompleteData.mockResolvedValue(mockData);

      await getUserCompleteData('user-123', {
        activityLimit: 50,
        activityOffset: 10,
        activityType: 'comment',
      });

      expect(mockAccountService.getUserCompleteData).toHaveBeenCalledWith({
        p_user_id: 'user-123',
        p_activity_limit: 50,
        p_activity_offset: 10,
        p_activity_type: 'comment',
      });
    });

    it('should return null on service error', async () => {
      const error = new Error('Database connection failed');
      mockAccountService.getUserCompleteData.mockRejectedValue(error);

      const result = await getUserCompleteData('user-123');

      expect(result).toBeNull();
    });

    it('should handle Supabase error objects', async () => {
      const supabaseError = {
        code: 'PGRST116',
        details: 'The result contains 0 rows',
        hint: null,
        message: 'JSON object requested, multiple (or no) rows returned',
      };

      mockAccountService.getUserCompleteData.mockRejectedValue(supabaseError);

      const result = await getUserCompleteData('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getUserBookmarksForCollections', () => {
    it('should return bookmarks in Prisma format', async () => {
      const mockCompleteData = {
        user_library: {
          bookmarks: [
            {
              id: 'bookmark-1',
              user_id: 'user-123',
              content_type: 'agents',
              content_slug: 'test-slug',
              created_at: '2024-01-01T00:00:00Z',
              notes: 'Test note',
            },
          ],
        },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);

      const result = await getUserBookmarksForCollections('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'bookmark-1',
        user_id: 'user-123',
        content_type: 'agents',
        content_slug: 'test-slug',
        notes: 'Test note',
      });
      expect(result[0].created_at).toBeInstanceOf(Date);
      expect(result[0].updated_at).toBeInstanceOf(Date);
    });

    it('should filter out bookmarks with null required fields', async () => {
      const mockCompleteData = {
        user_library: {
          bookmarks: [
            {
              id: 'bookmark-1',
              user_id: 'user-123',
              content_type: 'agents',
              content_slug: 'test-slug',
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'bookmark-2',
              user_id: null, // Invalid
              content_type: 'agents',
              content_slug: 'test-slug',
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: null, // Invalid
              user_id: 'user-123',
              content_type: 'agents',
              content_slug: 'test-slug',
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);

      const result = await getUserBookmarksForCollections('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bookmark-1');
    });

    it('should handle empty bookmarks array', async () => {
      const mockCompleteData = {
        user_library: {
          bookmarks: [],
        },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);

      const result = await getUserBookmarksForCollections('user-123');

      expect(result).toEqual([]);
    });

    it('should handle missing user_library', async () => {
      const mockCompleteData = {
        user_library: null,
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);

      const result = await getUserBookmarksForCollections('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getUserJobById', () => {
    it('should return job when found', async () => {
      const mockJob = { id: 'job-1', title: 'Test Job' };
      const mockCompleteData = {
        user_dashboard: {
          jobs: [mockJob, { id: 'job-2', title: 'Other Job' }],
        },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);

      const result = await getUserJobById('user-123', 'job-1');

      expect(result).toEqual(mockJob);
    });

    it('should return null when job not found', async () => {
      const mockCompleteData = {
        user_dashboard: {
          jobs: [{ id: 'job-2', title: 'Other Job' }],
        },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);

      const result = await getUserJobById('user-123', 'job-1');

      expect(result).toBeNull();
    });

    it('should return null when jobs array is empty', async () => {
      const mockCompleteData = {
        user_dashboard: {
          jobs: [],
        },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);

      const result = await getUserJobById('user-123', 'job-1');

      expect(result).toBeNull();
    });

    it('should return null when user_dashboard is missing', async () => {
      const mockCompleteData = {};

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);

      const result = await getUserJobById('user-123', 'job-1');

      expect(result).toBeNull();
    });
  });

  describe('getAccountDashboardBundle', () => {
    it('should return dashboard bundle with all components', async () => {
      const { getHomepageData } = await import('./content/homepage.ts');
      const mockCompleteData = {
        account_dashboard: {
          bookmark_count: 5,
          profile: {
            created_at: '2024-01-01',
            name: 'Test User',
            tier: 'free',
          },
        },
        user_library: {
          bookmarks: [],
        },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);
      vi.mocked(getHomepageData).mockResolvedValue({} as any);

      const result = await getAccountDashboardBundle('user-123');

      expect(result.dashboard).toBeDefined();
      expect(result.library).toBeDefined();
      expect(result.homepage).toBeDefined();
      expect(getHomepageData).toHaveBeenCalledWith(['agents', 'mcp']);
    });

    it('should use provided categoryIds when given', async () => {
      const { getHomepageData } = await import('./content/homepage.ts');
      const mockCompleteData = {
        account_dashboard: { bookmark_count: 0, profile: { created_at: '2024-01-01', name: null, tier: null } },
        user_library: { bookmarks: [] },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);
      vi.mocked(getHomepageData).mockResolvedValue({ categories: ['custom'] });

      const result = await getAccountDashboardBundle('user-123', ['custom']);

      expect(getHomepageData).toHaveBeenCalledWith(['custom']);
      expect(result.homepage).toBeDefined();
    });

    it('should handle null account_dashboard gracefully', async () => {
      const { getHomepageData } = await import('./content/homepage.ts');
      const mockCompleteData = {
        account_dashboard: null,
        user_library: { bookmarks: [] },
      };

      mockAccountService.getUserCompleteData.mockResolvedValue(mockCompleteData);
      vi.mocked(getHomepageData).mockResolvedValue({ categories: [] });

      const result = await getAccountDashboardBundle('user-123');

      expect(result.dashboard).toBeNull();
      expect(result.library).toBeDefined();
    });
  });

  describe('isBookmarked and isFollowing', () => {
    // These functions use createDataFunction which calls service methods directly

    it('should return true when bookmark exists', async () => {
      mockAccountService.isBookmarked.mockResolvedValue(true);

      const result = await isBookmarked({
        content_slug: 'test-slug',
        content_type: 'agents',
        userId: 'user-123',
      });

      expect(result).toBe(true);
      expect(mockAccountService.isBookmarked).toHaveBeenCalledWith({
        p_content_slug: 'test-slug',
        p_content_type: 'agents',
        p_user_id: 'user-123',
      });
    });

    it('should return false when bookmark not found', async () => {
      mockAccountService.isBookmarked.mockResolvedValue(false);

      const result = await isBookmarked({
        content_slug: 'non-existent',
        content_type: 'agents',
        userId: 'user-123',
      });

      expect(result).toBe(false);
    });

    it('should return false on service error', async () => {
      mockAccountService.isBookmarked.mockRejectedValue(new Error('Service error'));

      const result = await isBookmarked({
        content_slug: 'test-slug',
        content_type: 'agents',
        userId: 'user-123',
      });

      expect(result).toBe(false);
    });

    it('should handle isFollowing correctly', async () => {
      mockAccountService.isFollowing.mockResolvedValue(true);

      const result = await isFollowing({
        followerId: 'user-123',
        followingId: 'user-456',
      });

      expect(result).toBe(true);
      expect(mockAccountService.isFollowing).toHaveBeenCalledWith({
        follower_id: 'user-123',
        following_id: 'user-456',
      });
    });
  });

  describe('batch functions', () => {

    it('should handle isBookmarkedBatch with multiple items', async () => {
      const mockBatchResult = [
        { content_slug: 'slug-1', content_type: 'agents', is_bookmarked: true },
        { content_slug: 'slug-2', content_type: 'mcp', is_bookmarked: true },
        { content_slug: 'slug-3', content_type: 'agents', is_bookmarked: false },
      ];

      mockAccountService.isBookmarkedBatch.mockResolvedValue(mockBatchResult);

      const result = await isBookmarkedBatch({
        items: [
          { content_slug: 'slug-1', content_type: 'agents' },
          { content_slug: 'slug-2', content_type: 'mcp' },
          { content_slug: 'slug-3', content_type: 'agents' },
        ],
        userId: 'user-123',
      });

      expect(result).toHaveLength(3);
      expect(result[0].is_bookmarked).toBe(true);
      expect(result[1].is_bookmarked).toBe(true);
      expect(result[2].is_bookmarked).toBe(false);
      expect(mockAccountService.isBookmarkedBatch).toHaveBeenCalledWith({
        p_items: [
          { content_slug: 'slug-1', content_type: 'agents' },
          { content_slug: 'slug-2', content_type: 'mcp' },
          { content_slug: 'slug-3', content_type: 'agents' },
        ],
        p_user_id: 'user-123',
      });
    });

    it('should handle empty batch requests', async () => {
      mockAccountService.isBookmarkedBatch.mockResolvedValue([]);

      const result = await isBookmarkedBatch({
        items: [],
        userId: 'user-123',
      });

      expect(result).toEqual([]);
      expect(mockAccountService.isBookmarkedBatch).toHaveBeenCalledWith({
        p_items: [],
        p_user_id: 'user-123',
      });
    });

    it('should return empty array on service error', async () => {
      mockAccountService.isBookmarkedBatch.mockRejectedValue(new Error('Service error'));

      const result = await isBookmarkedBatch({
        items: [{ content_slug: 'slug-1', content_type: 'agents' }],
        userId: 'user-123',
      });

      expect(result).toEqual([]);
    });

    it('should handle isFollowingBatch correctly', async () => {
      const mockBatchResult = [
        { followed_user_id: 'user-456', is_following: true },
        { followed_user_id: 'user-789', is_following: false },
      ];

      mockAccountService.isFollowingBatch.mockResolvedValue(mockBatchResult);

      const result = await isFollowingBatch({
        followedUserIds: ['user-456', 'user-789'],
        followerId: 'user-123',
      });

      expect(result).toHaveLength(2);
      expect(result[0].is_following).toBe(true);
      expect(result[1].is_following).toBe(false);
      expect(mockAccountService.isFollowingBatch).toHaveBeenCalledWith({
        p_followed_user_ids: ['user-456', 'user-789'],
        p_follower_id: 'user-123',
      });
    });
  });
});

