/**
 * Bookmark Actions Database Integration Tests
 *
 * Tests bookmark CRUD operations with mocked Supabase database.
 * Validates business logic, error handling, and database interactions.
 *
 * **Test Coverage:**
 * - Add/remove bookmark operations
 * - Batch bookmark operations
 * - Duplicate detection
 * - Authorization enforcement
 * - Cache invalidation
 * - User interaction tracking
 *
 * @see src/lib/actions/bookmark-actions.ts
 */

import { describe, expect, test, beforeEach, vi } from 'vitest';
import { bookmarkFactory } from '@/tests/factories/user/bookmark.factory';

// CRITICAL: Mock next/headers FIRST (required by next-safe-action middleware)
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: vi.fn((header: string) => {
      if (header === 'cf-connecting-ip') return '127.0.0.1';
      if (header === 'user-agent') return 'test-agent';
      return null;
    }),
  })),
}));

// Mock Supabase
const mockCreateClient = vi.fn();
vi.mock('@/src/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

// Mock Next.js cache
const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
}));

// Mock logger
const mockLogger = {
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};
vi.mock('@/src/lib/logger', () => ({
  logger: mockLogger,
}));

// Mock Redis (required by rate limiting middleware)
// IMPORTANT: Upstash Redis pipeline.exec() returns simple array, not [error, result] tuples
// Return 0 for request count (index 2) so all tests pass rate limiting
vi.mock('@/src/lib/redis', () => ({
  redisClient: {
    executeOperation: vi.fn(async (fn, fallback) => {
      // Call the function with a mock Redis client
      try {
        return await fn({
          pipeline: () => ({
            zremrangebyscore: vi.fn().mockReturnThis(),
            zadd: vi.fn().mockReturnThis(),
            zcard: vi.fn().mockReturnThis(),
            expire: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue([
              0, // zremrangebyscore result
              'OK', // zadd result
              0, // zcard result - REQUEST COUNT (0 = always pass rate limit)
              1, // expire result
            ]),
          }),
        });
      } catch (error) {
        return fallback ? fallback() : 0;
      }
    }),
    getStatus: vi.fn(() => ({ isConnected: true, isFallback: false })),
  },
}));

// Import actions AFTER all mocks are set up
const { addBookmark, removeBookmark, addBookmarkBatch, isBookmarked } = await import(
  '@/src/lib/actions/bookmark-actions'
);

/**
 * Helper to mock Supabase query chain: .from().insert().select().single()
 * Upstash Supabase chains methods, so each must return the next in the chain
 */
function mockSupabaseInsertChain(responseData: unknown, responseError: unknown = null) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: responseData,
    error: responseError,
  });

  const mockSelect = vi.fn().mockReturnValue({
    single: mockSingle,
  });

  const mockInsert = vi.fn().mockReturnValue({
    select: mockSelect,
  });

  return { mockInsert, mockSelect, mockSingle };
}

/**
 * Helper to mock Supabase query chain: .from().delete().eq().eq().eq()
 */
function mockSupabaseDeleteChain(responseData: unknown, responseError: unknown = null) {
  const mockEq = vi.fn().mockResolvedValue({
    data: responseData,
    error: responseError,
  });

  const mockDelete = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    }),
  });

  return { mockDelete, mockEq };
}

/**
 * Helper to mock Supabase query chain: .from().select().eq()...single()
 */
function mockSupabaseSelectChain(responseData: unknown, responseError: unknown = null) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: responseData,
    error: responseError,
  });

  const mockEq = vi.fn().mockReturnValue({
    single: mockSingle,
  });

  const mockSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    }),
  });

  return { mockSelect, mockEq, mockSingle };
}

describe('Bookmark Actions - Database Integration', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('addBookmark', () => {
    test('should successfully add a bookmark', async () => {
      const bookmark = bookmarkFactory.build({
        user_id: mockUser.id,
        content_type: 'agents',
        content_slug: 'code-reviewer',
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockInsert } = mockSupabaseInsertChain(bookmark);
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const result = await addBookmark({
        content_type: 'agents',
        content_slug: 'code-reviewer',
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.bookmark).toEqual(bookmark);
      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        content_type: 'agents',
        content_slug: 'code-reviewer',
        notes: null,
      });
    });

    test('should add bookmark with notes', async () => {
      const bookmark = bookmarkFactory.build({
        user_id: mockUser.id,
        notes: 'Great agent for code reviews',
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockInsert } = mockSupabaseInsertChain(bookmark);
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const result = await addBookmark({
        content_type: bookmark.content_type,
        content_slug: bookmark.content_slug,
        notes: 'Great agent for code reviews',
      });

      expect(result?.data?.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Great agent for code reviews',
        })
      );
    });

    test('should track user interaction when bookmark is added', async () => {
      const bookmark = bookmarkFactory.build({ user_id: mockUser.id });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let interactionInsertCalled = false;

      const mockFrom = vi.fn((table: string) => {
        if (table === 'bookmarks') {
          const mockSingle = vi.fn().mockResolvedValue({ data: bookmark, error: null });
          const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
          const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
          return { insert: mockInsert };
        }
        if (table === 'user_interactions') {
          interactionInsertCalled = true;
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      await addBookmark({
        content_type: bookmark.content_type,
        content_slug: bookmark.content_slug,
      });

      expect(interactionInsertCalled).toBe(true);
    });

    test('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await addBookmark({
          content_type: 'agents',
          content_slug: 'test-agent',
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You must be signed in to bookmark content');
    });

    test('should throw error for duplicate bookmark', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Unique constraint violation' },
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await addBookmark({
          content_type: 'agents',
          content_slug: 'already-bookmarked',
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You have already bookmarked this content');
    });

    test('should validate and sanitize content_slug', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const bookmark = bookmarkFactory.build({ user_id: mockUser.id });

      const mockSingle = vi.fn().mockResolvedValue({
        data: bookmark,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      await addBookmark({
        content_type: 'agents',
        content_slug: 'Test-Agent_123', // Should be lowercased
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          content_slug: 'test-agent_123',
        })
      );
    });

    test('should revalidate account and For You pages', async () => {
      const bookmark = bookmarkFactory.build({ user_id: mockUser.id });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockInsert } = mockSupabaseInsertChain(bookmark);
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      await addBookmark({
        content_type: bookmark.content_type,
        content_slug: bookmark.content_slug,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/for-you');
    });
  });

  describe('removeBookmark', () => {
    test('should successfully remove a bookmark', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockDelete, mockEq } = mockSupabaseDeleteChain(null, null);
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      const result = await removeBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(result?.data?.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockDelete).toHaveBeenCalled();
    });

    test('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await removeBookmark({
          content_type: 'agents',
          content_slug: 'test-agent',
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You must be signed in to remove bookmarks');
    });

    test('should revalidate account and For You pages with user tag', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockDelete } = mockSupabaseDeleteChain(null, null);
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      await removeBookmark({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
      expect(mockRevalidateTag).toHaveBeenCalledWith(`user-${mockUser.id}`);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/for-you');
    });
  });

  describe('isBookmarked', () => {
    test('should return true when content is bookmarked', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'bookmark-123' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await isBookmarked('agent', 'test-agent');

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSelect).toHaveBeenCalledWith('id');
    });

    test('should return false when content is not bookmarked', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await isBookmarked('agent', 'not-bookmarked');

      expect(result).toBe(false);
    });

    test('should return false when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await isBookmarked('agent', 'test-agent');

      expect(result).toBe(false);
    });
  });

  describe('addBookmarkBatch', () => {
    test('should successfully add multiple bookmarks at once', async () => {
      const bookmarks = bookmarkFactory.buildList(5);

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockResolvedValue({
        data: bookmarks,
        error: null,
      });

      const mockUpsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      // Mock returns different chains based on table name
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookmarks') {
          return { upsert: mockUpsert };
        }
        if (table === 'user_interactions') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      const items = bookmarks.map((b) => ({
        content_type: b.content_type,
        content_slug: b.content_slug,
      }));

      const result = await addBookmarkBatch({ items });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.saved_count).toBe(5);
      expect(result?.data?.total_requested).toBe(5);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: mockUser.id,
            content_type: expect.any(String),
            content_slug: expect.any(String),
          }),
        ]),
        {
          onConflict: 'user_id,content_type,content_slug',
          ignoreDuplicates: true,
        }
      );
    });

    test('should enforce maximum of 20 bookmarks per batch', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const items = Array.from({ length: 21 }, (_, i) => ({
        content_type: 'agents' as const,
        content_slug: `agent-${i}`,
      }));

      const result = await addBookmarkBatch({ items });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await addBookmarkBatch({
          items: [{ content_type: 'agents', content_slug: 'test' }],
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You must be signed in to bookmark content');
    });

    test('should handle partial failures gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Only 3 out of 5 succeed
      const successfulBookmarks = bookmarkFactory.buildList(3);

      const mockSelect = vi.fn().mockResolvedValue({
        data: successfulBookmarks,
        error: null,
      });

      const mockUpsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      // Mock returns different chains based on table name
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookmarks') {
          return { upsert: mockUpsert };
        }
        if (table === 'user_interactions') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      const items = Array.from({ length: 5 }, (_, i) => ({
        content_type: 'agents' as const,
        content_slug: `agent-${i}`,
      }));

      const result = await addBookmarkBatch({ items });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.saved_count).toBe(3);
      expect(result?.data?.total_requested).toBe(5);
    });

    test('should revalidate all relevant caches', async () => {
      const bookmarks = bookmarkFactory.buildList(3);

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockResolvedValue({ data: bookmarks, error: null });
      const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

      // Mock returns different chains based on table name
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookmarks') {
          return { upsert: mockUpsert };
        }
        if (table === 'user_interactions') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      await addBookmarkBatch({
        items: bookmarks.map((b) => ({
          content_type: b.content_type,
          content_slug: b.content_slug,
        })),
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library');
      expect(mockRevalidateTag).toHaveBeenCalledWith(`user-${mockUser.id}`);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/for-you');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    test('should reject invalid content_type', async () => {
      const result = await addBookmark({
          content_type: 'invalid-type' as any,
          content_slug: 'test-slug',
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject invalid content_slug with special characters', async () => {
      const result = await addBookmark({
          content_type: 'agents',
          content_slug: 'test<script>alert(1)</script>',
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject content_slug that is too long', async () => {
      const result = await addBookmark({
          content_type: 'agents',
          content_slug: 'a'.repeat(201),
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject notes that are too long', async () => {
      const result = await addBookmark({
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: 'x'.repeat(501),
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should allow valid forward slashes in content_slug', async () => {
      const bookmark = bookmarkFactory.build();

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: bookmark, error: null }),
      });

      await expect(
        addBookmark({
          content_type: 'command',
          content_slug: 'git/commit-message',
        })
      ).resolves.toBeDefined();
    });
  });
});
