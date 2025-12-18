import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware
vi.mock('./safe-action.ts', () => {
  const createActionMock = (schema: any) => ({
    action: vi.fn((handler) => {
      return async (input: unknown) => {
        const parsed = schema ? schema.parse(input) : input;
        return handler({ parsedInput: parsed, ctx: { userId: 'test-user-id' } });
      };
    }),
  });

  return {
    authedAction: {
      metadata: vi.fn(() => ({
        inputSchema: vi.fn((schema) => createActionMock(schema)),
      })),
    },
  };
});

// Mock runRpc
vi.mock('./run-rpc-instance.ts', () => ({
  runRpc: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock cache-tags
vi.mock('../cache-tags.ts', () => ({
  revalidateCacheTags: vi.fn(),
}));

// Mock data layer
vi.mock('../data/account.ts', () => ({
  isBookmarked: vi.fn(),
  isBookmarkedBatch: vi.fn(),
  isFollowing: vi.fn(),
  isFollowingBatch: vi.fn(),
  getUserCompleteData: vi.fn(),
  getUserIdentitiesData: vi.fn(),
}));

// Mock logger
vi.mock('../logger.ts', () => ({
  logger: {
    info: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should accept all optional fields', async () => {
      const { updateProfile } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        profile: {
          id: 'user-123',
          slug: 'test-user',
          display_name: 'Test User',
        },
      } as any);

      await updateProfile({
        display_name: 'Updated Name',
        username: 'updated-username',
        bio: 'Updated bio',
        work: 'Updated work',
        website: 'https://example.com',
        social_x_link: 'https://x.com/user',
        interests: ['coding', 'design'],
        profile_public: true,
        follow_email: false,
      });

      expect(runRpc).toHaveBeenCalled();
    });

    it('should accept empty string for website', async () => {
      const { updateProfile } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        profile: { id: 'user-123', slug: 'test-user' },
      } as any);

      await updateProfile({
        website: '',
      });

      expect(runRpc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          p_website: '',
        }),
        expect.anything()
      );
    });
  });

  describe('RPC call', () => {
    it('should call update_user_profile RPC with correct parameters', async () => {
      const { updateProfile } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      const mockResult = {
        profile: {
          id: 'user-123',
          slug: 'test-user',
          display_name: 'Test User',
        },
      };

      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      const result = await updateProfile({
        display_name: 'Test User',
        username: 'test-user',
      });

      expect(runRpc).toHaveBeenCalledWith(
        'update_user_profile',
        expect.objectContaining({
          p_user_id: 'test-user-id',
          p_display_name: 'Test User',
          p_username: 'test-user',
        }),
        expect.objectContaining({
          action: 'user.updateProfile',
          userId: 'test-user-id',
        })
      );

      expect(result).toEqual(mockResult);
    });

    it('should only include provided fields in RPC call', async () => {
      const { updateProfile } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        profile: { id: 'user-123', slug: 'test-user' },
      } as any);

      await updateProfile({
        display_name: 'Test User',
        // username not provided
      });

      expect(runRpc).toHaveBeenCalledWith(
        expect.anything(),
        expect.not.objectContaining({
          p_username: expect.anything(),
        }),
        expect.anything()
      );
    });

    it('should throw error when profile is null', async () => {
      const { updateProfile } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        profile: null,
      } as any);

      await expect(
        updateProfile({
          display_name: 'Test',
        })
      ).rejects.toThrow('update_user_profile returned null profile');
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate user surfaces and invalidate caches', async () => {
      const { updateProfile } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath } = await import('next/cache');
      const { revalidateCacheTags } = await import('../cache-tags.ts');
      const { revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({
        profile: {
          id: 'user-123',
          slug: 'test-user',
        },
      } as any);

      await updateProfile({
        display_name: 'Test',
      });

      expect(revalidatePath).toHaveBeenCalledWith('/u/test-user');
      expect(revalidatePath).toHaveBeenCalledWith('/account');
      expect(revalidatePath).toHaveBeenCalledWith('/account/settings');
      expect(revalidateCacheTags).toHaveBeenCalledWith(['users', 'user-test-user-id']);
      expect(revalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');
    });
  });
});

describe('refreshProfileFromOAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call refresh_profile_from_oauth RPC and revalidate', async () => {
    const { refreshProfileFromOAuth } = await import('./user.ts');
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath } = await import('next/cache');
    const { revalidateCacheTags } = await import('../cache-tags.ts');
    const { revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({
        user_profile: {
          id: 'user-123',
          slug: 'test-user',
        },
      } as any);

      const result = await refreshProfileFromOAuth({});

      expect(runRpc).toHaveBeenCalledWith(
        'refresh_profile_from_oauth',
        { user_id: 'test-user-id' },
        expect.objectContaining({
          action: 'user.refreshProfileFromOAuth',
          userId: 'test-user-id',
        })
      );

      expect(revalidatePath).toHaveBeenCalledWith('/u/test-user');
      expect(revalidatePath).toHaveBeenCalledWith('/account');
      expect(revalidatePath).toHaveBeenCalledWith('/account/settings');
      expect(revalidateCacheTags).toHaveBeenCalledWith(['users', 'user-test-user-id']);
      expect(revalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');

      expect(result).toEqual({
        success: true,
        message: 'Profile refreshed from OAuth provider',
        slug: 'test-user',
      });
    });
});

describe('isBookmarkedAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate content_category enum', async () => {
      const { isBookmarkedAction } = await import('./user.ts');
      const { content_categorySchema } = await import('./prisma-zod-schemas.ts');
      const validCategories = content_categorySchema._def.values;

      expect(() => {
        content_categorySchema.parse(validCategories[0]);
      }).not.toThrow();
    });

    it('should validate content_slug format', async () => {
      const { isBookmarkedAction } = await import('./user.ts');

      await expect(
        isBookmarkedAction({
          content_type: 'agents',
          content_slug: 'invalid slug with spaces!',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate content_slug max length', async () => {
      const { isBookmarkedAction } = await import('./user.ts');

      await expect(
        isBookmarkedAction({
          content_type: 'agents',
          content_slug: 'a'.repeat(201),
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('data fetching', () => {
    it('should call isBookmarked from data layer', async () => {
      const { isBookmarkedAction } = await import('./user.ts');
      const { isBookmarked } = await import('../data/account.ts');

      vi.mocked(isBookmarked).mockResolvedValue(true);

      const result = await isBookmarkedAction({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(isBookmarked).toHaveBeenCalledWith({
        userId: 'test-user-id',
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(result).toBe(true);
    });
  });
});

describe('addBookmarkBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate items array (1-20 items)', async () => {
      const { addBookmarkBatch } = await import('./user.ts');

      // Empty array should fail
      await expect(
        addBookmarkBatch({
          items: [],
        } as any)
      ).rejects.toThrow();

      // Too many items should fail
      await expect(
        addBookmarkBatch({
          items: Array(21).fill({ content_type: 'agents', content_slug: 'test' }),
        } as any)
      ).rejects.toThrow();
    });

    it('should validate content_category enum for each item', async () => {
      const { addBookmarkBatch } = await import('./user.ts');

      await expect(
        addBookmarkBatch({
          items: [
            {
              content_type: 'invalid-category',
              content_slug: 'test',
            },
          ],
        } as any)
      ).rejects.toThrow();
    });

    it('should require content_slug for each item', async () => {
      const { addBookmarkBatch } = await import('./user.ts');

      await expect(
        addBookmarkBatch({
          items: [
            {
              content_type: 'agents',
              content_slug: '',
            },
          ],
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('RPC call', () => {
    it('should call batch_add_bookmarks RPC with correct parameters', async () => {
      const { addBookmarkBatch } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath } = await import('next/cache');
      const { revalidateCacheTags } = await import('../cache-tags.ts');
      const { revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({
        success: true,
      } as any);

      const result = await addBookmarkBatch({
        items: [
          { content_type: 'agents', content_slug: 'test-agent-1' },
          { content_type: 'mcp', content_slug: 'test-mcp-1' },
        ],
      });

      expect(runRpc).toHaveBeenCalledWith(
        'batch_add_bookmarks',
        {
          p_user_id: 'test-user-id',
          p_items: [
            { content_type: 'agents', content_slug: 'test-agent-1' },
            { content_type: 'mcp', content_slug: 'test-mcp-1' },
          ],
        },
        expect.objectContaining({
          action: 'user.addBookmarkBatch',
          userId: 'test-user-id',
          meta: { itemCount: 2 },
        })
      );

      expect(revalidatePath).toHaveBeenCalledWith('/account');
      expect(revalidatePath).toHaveBeenCalledWith('/account/library');
      expect(revalidateCacheTags).toHaveBeenCalledWith(['user-bookmarks', 'users', 'user-test-user-id']);
      expect(revalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');

      expect(result).toBeDefined();
    });
  });
});

describe('toggleFollow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate follow_action enum', async () => {
      const { toggleFollow } = await import('./user.ts');
      const { follow_actionSchema } = await import('./prisma-zod-schemas.ts');
      const validActions = follow_actionSchema._def.values;

      expect(() => {
        follow_actionSchema.parse(validActions[0]);
      }).not.toThrow();
    });

    it('should require user_id and slug', async () => {
      const { toggleFollow } = await import('./user.ts');

      await expect(
        toggleFollow({
          action: 'follow',
          // Missing user_id and slug
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('RPC call', () => {
    it('should call toggle_follow RPC with correct parameters', async () => {
      const { toggleFollow } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath } = await import('next/cache');
      const { revalidateCacheTags } = await import('../cache-tags.ts');
      const { revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({
        success: true,
      } as any);

      const result = await toggleFollow({
        action: 'follow',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'target-user',
      });

      expect(runRpc).toHaveBeenCalledWith(
        'toggle_follow',
        {
          p_follower_id: 'test-user-id',
          p_following_id: '123e4567-e89b-12d3-a456-426614174000',
          p_action: 'follow',
        },
        expect.objectContaining({
          action: 'user.toggleFollow',
          userId: 'test-user-id',
          meta: {
            targetUserId: '123e4567-e89b-12d3-a456-426614174000',
            followAction: 'follow',
          },
        })
      );

      expect(revalidatePath).toHaveBeenCalledWith('/u/target-user');
      expect(revalidatePath).toHaveBeenCalledWith('/account');
      expect(revalidateCacheTags).toHaveBeenCalledWith(['users', 'user-test-user-id', 'user-123e4567-e89b-12d3-a456-426614174000']);
      expect(revalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('user-123e4567-e89b-12d3-a456-426614174000', 'default');

      expect(result).toBeDefined();
    });
  });
});

describe('isFollowingAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate UUID for user_id', async () => {
      const { isFollowingAction } = await import('./user.ts');

      await expect(
        isFollowingAction({
          user_id: 'invalid-uuid',
        } as any)
      ).rejects.toThrow('Invalid UUID format');
    });
  });

  describe('data fetching', () => {
    it('should call isFollowing from data layer', async () => {
      const { isFollowingAction } = await import('./user.ts');
      const { isFollowing } = await import('../data/account.ts');

      vi.mocked(isFollowing).mockResolvedValue(true);

      const result = await isFollowingAction({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(isFollowing).toHaveBeenCalledWith({
        followerId: 'test-user-id',
        followingId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result).toBe(true);
    });
  });
});

describe('getBookmarkStatusBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate items array with content_category and content_slug', async () => {
      const { getBookmarkStatusBatch } = await import('./user.ts');

      await expect(
        getBookmarkStatusBatch({
          items: [
            {
              content_type: 'invalid-category',
              content_slug: 'test',
            },
          ],
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('data fetching', () => {
    it('should call isBookmarkedBatch and return Map', async () => {
      const { getBookmarkStatusBatch } = await import('./user.ts');
      const { isBookmarkedBatch } = await import('../data/account.ts');

      const mockResults = [
        { content_type: 'agents', content_slug: 'test-agent', is_bookmarked: true },
        { content_type: 'mcp', content_slug: 'test-mcp', is_bookmarked: false },
      ];

      vi.mocked(isBookmarkedBatch).mockResolvedValue(mockResults as any);

      const result = await getBookmarkStatusBatch({
        items: [
          { content_type: 'agents', content_slug: 'test-agent' },
          { content_type: 'mcp', content_slug: 'test-mcp' },
        ],
      });

      expect(isBookmarkedBatch).toHaveBeenCalledWith({
        userId: 'test-user-id',
        items: [
          { content_type: 'agents', content_slug: 'test-agent' },
          { content_type: 'mcp', content_slug: 'test-mcp' },
        ],
      });

      expect(result).toBeInstanceOf(Map);
      expect(result.get('agents:test-agent')).toBe(true);
      expect(result.get('mcp:test-mcp')).toBe(false);
    });

    it('should handle non-array results', async () => {
      const { getBookmarkStatusBatch } = await import('./user.ts');
      const { isBookmarkedBatch } = await import('../data/account.ts');

      vi.mocked(isBookmarkedBatch).mockResolvedValue(null as any);

      const result = await getBookmarkStatusBatch({
        items: [{ content_type: 'agents', content_slug: 'test' }],
      });

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });
});

describe('getFollowStatusBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate UUIDs for all user_ids', async () => {
      const { getFollowStatusBatch } = await import('./user.ts');

      await expect(
        getFollowStatusBatch({
          user_ids: ['invalid-uuid'],
        } as any)
      ).rejects.toThrow('Invalid UUID format');
    });
  });

  describe('data fetching', () => {
    it('should call isFollowingBatch and return Map', async () => {
      const { getFollowStatusBatch } = await import('./user.ts');
      const { isFollowingBatch } = await import('../data/account.ts');

      const mockResults = [
        { followed_user_id: 'user-1', is_following: true },
        { followed_user_id: 'user-2', is_following: false },
      ];

      vi.mocked(isFollowingBatch).mockResolvedValue(mockResults as any);

      const result = await getFollowStatusBatch({
        user_ids: ['user-1', 'user-2'],
      });

      expect(isFollowingBatch).toHaveBeenCalledWith({
        followerId: 'test-user-id',
        followedUserIds: ['user-1', 'user-2'],
      });

      expect(result).toBeInstanceOf(Map);
      expect(result.get('user-1')).toBe(true);
      expect(result.get('user-2')).toBe(false);
    });

    it('should handle non-array results', async () => {
      const { getFollowStatusBatch } = await import('./user.ts');
      const { isFollowingBatch } = await import('../data/account.ts');

      vi.mocked(isFollowingBatch).mockResolvedValue(null as any);

      const result = await getFollowStatusBatch({
        user_ids: ['user-1'],
      });

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });
});

describe('getActivitySummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return activity summary from getUserCompleteData', async () => {
    const { getActivitySummary } = await import('./user.ts');
    const { getUserCompleteData } = await import('../data/account.ts');

    const mockSummary = {
      total_submissions: 10,
      total_views: 100,
    };

    vi.mocked(getUserCompleteData).mockResolvedValue({
      activity_summary: mockSummary,
    } as any);

    const result = await getActivitySummary({});

    expect(getUserCompleteData).toHaveBeenCalledWith('test-user-id');
    expect(result).toEqual(mockSummary);
  });

  it('should return null when getUserCompleteData returns null', async () => {
    const { getActivitySummary } = await import('./user.ts');
    const { getUserCompleteData } = await import('../data/account.ts');

    vi.mocked(getUserCompleteData).mockResolvedValue(null);

    const result = await getActivitySummary({});

    expect(result).toBeNull();
  });

  it('should return null when activity_summary is null', async () => {
    const { getActivitySummary } = await import('./user.ts');
    const { getUserCompleteData } = await import('../data/account.ts');

    vi.mocked(getUserCompleteData).mockResolvedValue({
      activity_summary: null,
    } as any);

    const result = await getActivitySummary({});

    expect(result).toBeNull();
  });

  describe('edge cases', () => {
    it('should handle getUserCompleteData errors', async () => {
      const { getActivitySummary } = await import('./user.ts');
      const { getUserCompleteData } = await import('../data/account.ts');

      vi.mocked(getUserCompleteData).mockRejectedValue(new Error('Data fetch error'));

      await expect(getActivitySummary({})).rejects.toThrow();
    });
  });
});

describe('getActivityTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate type enum', async () => {
      const { getActivityTimeline } = await import('./user.ts');

      await expect(
        getActivityTimeline({
          type: 'invalid-type',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate limit and offset ranges', async () => {
      const { getActivityTimeline } = await import('./user.ts');

      await expect(
        getActivityTimeline({
          limit: 0,
        } as any)
      ).rejects.toThrow();

      await expect(
        getActivityTimeline({
          limit: 101,
        } as any)
      ).rejects.toThrow();

      await expect(
        getActivityTimeline({
          offset: -1,
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('data fetching', () => {
    it('should call getUserCompleteData with correct parameters', async () => {
      const { getActivityTimeline } = await import('./user.ts');
      const { getUserCompleteData } = await import('../data/account.ts');

      const mockTimeline = {
        activities: [
          {
            id: 'activity-1',
            type: 'submission',
            created_at: '2024-01-01',
          },
        ],
        has_more: false,
        total: 1,
      };

      vi.mocked(getUserCompleteData).mockResolvedValue({ activity_timeline: mockTimeline } as any);

      const result = await getActivityTimeline({
        type: 'submission',
        limit: 20,
        offset: 0,
      });

      expect(getUserCompleteData).toHaveBeenCalledWith('test-user-id', {
        activityLimit: 20,
        activityOffset: 0,
        activityType: 'submission',
      });

      expect(result).toEqual(mockTimeline);
    });

    it('should use default values', async () => {
      const { getActivityTimeline } = await import('./user.ts');
      const { getUserCompleteData } = await import('../data/account.ts');

      vi.mocked(getUserCompleteData).mockResolvedValue({ activity_timeline: { activities: [], has_more: false, total: 0 } } as any);

      await getActivityTimeline({});

      expect(getUserCompleteData).toHaveBeenCalledWith('test-user-id', {
        activityLimit: 20,
        activityOffset: 0,
        activityType: undefined,
      });
    });

    it('should return null when getUserCompleteData returns null', async () => {
      const { getActivityTimeline } = await import('./user.ts');
      const { getUserCompleteData } = await import('../data/account.ts');

      vi.mocked(getUserCompleteData).mockResolvedValue(null);

      const result = await getActivityTimeline({});

      expect(result).toBeNull();
    });

    it('should return null when activity_timeline is null', async () => {
      const { getActivityTimeline } = await import('./user.ts');
      const { getUserCompleteData } = await import('../data/account.ts');

      vi.mocked(getUserCompleteData).mockResolvedValue({
        activity_timeline: null,
      } as any);

      const result = await getActivityTimeline({});

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle getUserCompleteData errors', async () => {
      const { getActivityTimeline } = await import('./user.ts');
      const { getUserCompleteData } = await import('../data/account.ts');

      vi.mocked(getUserCompleteData).mockRejectedValue(new Error('Data fetch error'));

      await expect(getActivityTimeline({})).rejects.toThrow();
    });

    it('should handle type being undefined (converts to null)', async () => {
      const { getActivityTimeline } = await import('./user.ts');
      const { getUserCompleteData } = await import('../data/account.ts');

      vi.mocked(getUserCompleteData).mockResolvedValue({ activity_timeline: null } as any);

      await getActivityTimeline({});

      expect(getUserCompleteData).toHaveBeenCalledWith('test-user-id', {
        activityLimit: 20,
        activityOffset: 0,
        activityType: null, // undefined converted to null
      });
    });
  });
});

describe('getUserIdentities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call getUserIdentitiesData from data layer', async () => {
    const { getUserIdentities } = await import('./user.ts');
    const { getUserIdentitiesData } = await import('../data/account.ts');

    const mockIdentities = [
      {
        id: 'identity-1',
        provider: 'github',
        email: 'test@example.com',
      },
    ];

    vi.mocked(getUserIdentitiesData).mockResolvedValue(mockIdentities as any);

    const result = await getUserIdentities({});

    expect(getUserIdentitiesData).toHaveBeenCalledWith('test-user-id');
    expect(result).toEqual(mockIdentities);
  });

  it('should handle getUserIdentitiesData returning null', async () => {
    const { getUserIdentities } = await import('./user.ts');
    const { getUserIdentitiesData } = await import('../data/account.ts');

    vi.mocked(getUserIdentitiesData).mockResolvedValue(null as any);

    const result = await getUserIdentities({});

    expect(result).toBeNull();
  });

  it('should handle getUserIdentitiesData errors', async () => {
    const { getUserIdentities } = await import('./user.ts');
    const { getUserIdentitiesData } = await import('../data/account.ts');

    vi.mocked(getUserIdentitiesData).mockRejectedValue(new Error('Data fetch error'));

    await expect(getUserIdentities({})).rejects.toThrow();
  });
});

describe('refreshProfileFromOAuthServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call refresh_profile_from_oauth RPC and invalidate caches', async () => {
    const { refreshProfileFromOAuthServer } = await import('./user.ts');
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidateCacheTags } = await import('../cache-tags.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');

    const mockResult = {
      user_profile: {
        id: 'test-user-id',
        slug: 'test-user',
        display_name: 'Test User',
      },
    };

    vi.mocked(runRpc).mockResolvedValue(mockResult as any);

    const result = await refreshProfileFromOAuthServer('test-user-id');

    expect(runRpc).toHaveBeenCalledWith(
      'refresh_profile_from_oauth',
      { user_id: 'test-user-id' },
      { action: 'user.refreshProfileFromOAuth', userId: 'test-user-id' }
    );

    expect(revalidatePath).toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalled();
    expect(revalidateCacheTags).toHaveBeenCalled();

    expect(result).toEqual({ success: true, slug: 'test-user' });
  });

  it('should handle null slug', async () => {
    const { refreshProfileFromOAuthServer } = await import('./user.ts');
    const { runRpc } = await import('./run-rpc-instance.ts');

    const mockResult = {
      user_profile: {
        id: 'test-user-id',
        slug: null,
        display_name: 'Test User',
      },
    };

    vi.mocked(runRpc).mockResolvedValue(mockResult as any);

    const result = await refreshProfileFromOAuthServer('test-user-id');

    expect(result).toEqual({ success: true, slug: null });
  });

  it('should handle null user_profile from runRpc', async () => {
    const { refreshProfileFromOAuthServer } = await import('./user.ts');
    const { runRpc } = await import('./run-rpc-instance.ts');

    vi.mocked(runRpc).mockResolvedValue({
      user_profile: null,
    } as any);

    const result = await refreshProfileFromOAuthServer('test-user-id');

    expect(result).toEqual({ success: true, slug: null });
  });

  it('should handle revalidatePath errors gracefully', async () => {
    const { refreshProfileFromOAuthServer } = await import('./user.ts');
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath } = await import('next/cache');

    vi.mocked(runRpc).mockResolvedValue({
      user_profile: { slug: 'test-user' },
    } as any);

    vi.mocked(revalidatePath).mockImplementation(() => {
      throw new Error('Revalidation failed');
    });

    // Should still succeed even if revalidatePath fails
    const result = await refreshProfileFromOAuthServer('test-user-id');

    expect(result.success).toBe(true);
  });

  it('should handle revalidateTag errors gracefully', async () => {
    const { refreshProfileFromOAuthServer } = await import('./user.ts');
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidateTag } = await import('next/cache');

    vi.mocked(runRpc).mockResolvedValue({
      user_profile: { slug: 'test-user' },
    } as any);

    vi.mocked(revalidateTag).mockImplementation(() => {
      throw new Error('Tag revalidation failed');
    });

    // Should still succeed even if revalidateTag fails
    const result = await refreshProfileFromOAuthServer('test-user-id');

    expect(result.success).toBe(true);
  });
});

describe('ensureUserRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call ensure_user_record RPC with correct parameters', async () => {
    const { ensureUserRecord } = await import('./user.ts');
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidateCacheTags } = await import('../cache-tags.ts');
    const { revalidateTag } = await import('next/cache');

    const mockResult = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
      slug: 'test-user',
      display_name: 'Test User',
      bio: null,
      work: null,
      website: null,
      social_x_link: null,
      interests: null,
      profile_public: true,
      follow_email: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.mocked(runRpc).mockResolvedValue(mockResult as any);

    await ensureUserRecord({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
    });

    expect(runRpc).toHaveBeenCalledWith(
      'ensure_user_record',
      {
        p_id: 'test-user-id',
        p_email: 'test@example.com',
        p_name: 'Test User',
        p_image: 'https://example.com/avatar.jpg',
        p_profile_public: true,
        p_follow_email: true,
      },
      {
        action: 'user.ensureUserRecord',
        userId: 'test-user-id',
      }
    );

    expect(revalidateTag).toHaveBeenCalledWith('user-test-user-id', 'default');
    expect(revalidateCacheTags).toHaveBeenCalledWith(['users', 'user-test-user-id']);
  });

  it('should handle null optional parameters', async () => {
    const { ensureUserRecord } = await import('./user.ts');
    const { runRpc } = await import('./run-rpc-instance.ts');

    const mockResult = {
      id: 'test-user-id',
      email: null,
      name: null,
      image: null,
      slug: null,
      display_name: null,
      bio: null,
      work: null,
      website: null,
      social_x_link: null,
      interests: null,
      profile_public: true,
      follow_email: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.mocked(runRpc).mockResolvedValue(mockResult as any);

    await ensureUserRecord({
      id: 'test-user-id',
      email: null,
    });

    expect(runRpc).toHaveBeenCalledWith(
      'ensure_user_record',
      {
        p_id: 'test-user-id',
        p_email: null,
        p_name: null,
        p_image: null,
        p_profile_public: true,
        p_follow_email: true,
      },
      {
        action: 'user.ensureUserRecord',
        userId: 'test-user-id',
      }
    );
  });

  describe('edge cases', () => {
    it('should handle revalidateTag errors gracefully', async () => {
      const { ensureUserRecord } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      } as any);

      vi.mocked(revalidateTag).mockImplementation(() => {
        throw new Error('Tag revalidation failed');
      });

      // Should still succeed even if revalidateTag fails
      await ensureUserRecord({
        id: 'test-user-id',
        email: 'test@example.com',
      });

      expect(runRpc).toHaveBeenCalled();
    });

    it('should handle revalidateCacheTags errors gracefully', async () => {
      const { ensureUserRecord } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidateCacheTags } = await import('../cache-tags.ts');

      vi.mocked(runRpc).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      } as any);

      vi.mocked(revalidateCacheTags).mockImplementation(() => {
        throw new Error('Cache invalidation failed');
      });

      // Should still succeed even if revalidateCacheTags fails
      await ensureUserRecord({
        id: 'test-user-id',
        email: 'test@example.com',
      });

      expect(runRpc).toHaveBeenCalled();
    });

    it('should handle null/undefined name and image', async () => {
      const { ensureUserRecord } = await import('./user.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      } as any);

      await ensureUserRecord({
        id: 'test-user-id',
        email: 'test@example.com',
        name: null,
        image: undefined,
      });

      expect(runRpc).toHaveBeenCalledWith(
        'ensure_user_record',
        expect.objectContaining({
          p_name: null,
          p_image: null,
        }),
        expect.any(Object)
      );
    });
  });
});
