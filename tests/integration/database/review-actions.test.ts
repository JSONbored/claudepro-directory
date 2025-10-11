/**
 * Review Actions Database Integration Tests
 *
 * Tests review/rating CRUD operations and helpful vote management.
 * Validates business logic, collaborative filtering, and database interactions.
 *
 * **Test Coverage:**
 * - Review CRUD operations
 * - Helpful vote management
 * - Review aggregation and statistics
 * - Sorting and pagination
 * - Duplicate prevention
 * - Authorization enforcement
 *
 * @see src/lib/actions/review-actions.ts
 */

import { describe, expect, test, beforeEach, vi } from 'vitest';
import { reviewFactory } from '@/tests/factories/user/review.factory';

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
const {
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getReviews,
  getAggregateRating,
} = await import('@/src/lib/actions/review-actions');

/**
 * Helper to mock Supabase query chain: .from().insert().select().single()
 * Supabase chains methods, so each must return the next in the chain
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
 * Helper to mock Supabase query chain: .from().update().eq().select().single()
 */
function mockSupabaseUpdateChain(responseData: unknown, responseError: unknown = null) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: responseData,
    error: responseError,
  });

  const mockSelect = vi.fn().mockReturnValue({
    single: mockSingle,
  });

  const mockEq = vi.fn().mockReturnValue({
    select: mockSelect,
  });

  const mockUpdate = vi.fn().mockReturnValue({
    eq: mockEq,
  });

  return { mockUpdate, mockEq, mockSelect, mockSingle };
}

/**
 * Helper to mock Supabase query chain: .from().delete().eq()
 */
function mockSupabaseDeleteChain(responseData: unknown, responseError: unknown = null) {
  const mockEq = vi.fn().mockResolvedValue({
    data: responseData,
    error: responseError,
  });

  const mockDelete = vi.fn().mockReturnValue({
    eq: mockEq,
  });

  return { mockDelete, mockEq };
}

/**
 * Helper to mock Supabase query chain: .from().select().eq().single()
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
    eq: mockEq,
  });

  return { mockSelect, mockEq, mockSingle };
}

describe('Review Actions - Database Integration', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
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

  describe('createReview', () => {
    test('should successfully create a review with rating and text', async () => {
      const mockReview = reviewFactory.build({
        user_id: mockUser.id,
        content_type: 'agents',
        content_slug: 'code-reviewer',
        rating: 5,
        comment: 'Excellent tool!',
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callNumber = 0;
      const mockFrom = vi.fn((table: string) => {
        callNumber++;

        if (table === 'review_ratings') {
          if (callNumber === 1) {
            // First call: check for existing review (needs 3 eq calls: content_type, content_slug, user_id)
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' }, // Not found
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          // Second call: insert the review
          const { mockInsert } = mockSupabaseInsertChain(mockReview);
          return { insert: mockInsert };
        }
        if (table === 'user_interactions') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await createReview({
        content_type: 'agents',
        content_slug: 'code-reviewer',
        rating: 5,
        review_text: 'Excellent tool!',
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.review).toEqual(mockReview);
    });

    test('should create review with only rating (no text)', async () => {
      const mockReview = reviewFactory.build({
        user_id: mockUser.id,
        rating: 4,
        comment: null,
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callNumber = 0;
      const mockFrom = vi.fn((table: string) => {
        callNumber++;

        if (table === 'review_ratings') {
          if (callNumber === 1) {
            // First call: check for existing review (needs 3 eq calls: content_type, content_slug, user_id)
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' },
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          // Second call: insert the review
          const { mockInsert } = mockSupabaseInsertChain(mockReview);
          return { insert: mockInsert };
        }
        if (table === 'user_interactions') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await createReview({
        content_type: 'agents',
        content_slug: 'test-agent',
        rating: 4,
      });

      expect(result?.data?.success).toBe(true);
    });

    test('should throw error when user already reviewed content', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'existing-review-123' },
          error: null,
        }),
      });

      const result = await createReview({
          content_type: 'agents',
          content_slug: 'already-reviewed',
          rating: 5,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You have already reviewed this content');
    });

    test('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 5,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You must be signed in to write a review');
    });

    test('should track user interaction when review is created', async () => {
      const mockReview = reviewFactory.build({
        user_id: mockUser.id,
        content_type: 'agents',
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let interactionTracked = false;
      let callNumber = 0;

      const mockFrom = vi.fn((table: string) => {
        callNumber++;

        if (table === 'review_ratings') {
          if (callNumber === 1) {
            // First call: check for existing review (needs 3 eq calls: content_type, content_slug, user_id)
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' },
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          // Second call: insert the review
          const { mockInsert } = mockSupabaseInsertChain(mockReview);
          return { insert: mockInsert };
        }
        if (table === 'user_interactions') {
          interactionTracked = true;
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      await createReview({
        content_type: mockReview.content_type,
        content_slug: mockReview.content_slug,
        rating: mockReview.rating,
      });

      expect(interactionTracked).toBe(true);
    });

    test('should revalidate content pages after review creation', async () => {
      const mockReview = reviewFactory.build({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'review_ratings') {
          if (mockSupabase.from.mock.calls.length === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            };
          }
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockReview,
              error: null,
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      await createReview({
        content_type: 'agents',
        content_slug: 'test-agent',
        rating: 5,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith('/agents/test-agent');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/agents');
      expect(mockRevalidateTag).toHaveBeenCalledWith('reviews:agents:test-agent');
    });
  });

  describe('updateReview', () => {
    test('should successfully update review rating and text', async () => {
      const existingReview = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        user_id: mockUser.id,
        content_type: 'agents',
        content_slug: 'test-agent',
        rating: 4,
      };

      const updatedReview = {
        ...existingReview,
        rating: 5,
        review_text: 'Updated review text',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'review_ratings') {
          const calls = mockSupabase.from.mock.calls.length;

          if (calls === 1) {
            // First call: fetch existing review
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: existingReview,
                error: null,
              }),
            };
          }
          // Second call: update review
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: updatedReview,
              error: null,
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await updateReview({
        review_id: '223e4567-e89b-12d3-a456-426614174001',
        rating: 5,
        review_text: 'Updated review text',
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.review).toEqual(updatedReview);
    });

    test('should throw error when review does not belong to user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            user_id: '323e4567-e89b-12d3-a456-426614174002',
            content_type: 'agents',
            content_slug: 'test-agent',
          },
          error: null,
        }),
      });

      const result = await updateReview({
          review_id: '223e4567-e89b-12d3-a456-426614174001',
          rating: 5,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You can only update your own reviews');
    });

    test('should throw error when no updates provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            user_id: mockUser.id,
            content_type: 'agents',
            content_slug: 'test-agent',
          },
          error: null,
        }),
      });

      const result = await updateReview({
          review_id: '223e4567-e89b-12d3-a456-426614174001',
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('No updates provided');
    });
  });

  describe('deleteReview', () => {
    test('should successfully delete a review', async () => {
      const existingReview = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        user_id: mockUser.id,
        content_type: 'agents',
        content_slug: 'test-agent',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        const calls = mockSupabase.from.mock.calls.length;

        if (calls === 1) {
          // First call: fetch review
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: existingReview,
              error: null,
            }),
          };
        }
        // Second call: delete review
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        };
      });

      mockSupabase.from = mockFrom;

      const result = await deleteReview({
        review_id: '223e4567-e89b-12d3-a456-426614174001',
      });

      expect(result?.data?.success).toBe(true);
    });

    test('should throw error when user does not own review', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            user_id: '323e4567-e89b-12d3-a456-426614174002',
            content_type: 'agents',
            content_slug: 'test-agent',
          },
          error: null,
        }),
      });

      const result = await deleteReview({
          review_id: '223e4567-e89b-12d3-a456-426614174001',
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You can only delete your own reviews');
    });
  });

  describe('markReviewHelpful', () => {
    test('should successfully mark a review as helpful', async () => {
      const mockReview = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        user_id: '323e4567-e89b-12d3-a456-426614174002',
        content_type: 'agents',
        content_slug: 'test-agent',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'review_ratings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockReview,
              error: null,
            }),
          };
        }
        if (table === 'review_helpful_votes') {
          return {
            insert: vi.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await markReviewHelpful({
        review_id: '223e4567-e89b-12d3-a456-426614174001',
        helpful: true,
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.helpful).toBe(true);
    });

    test('should successfully remove helpful vote', async () => {
      const mockReview = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        user_id: '323e4567-e89b-12d3-a456-426614174002',
        content_type: 'agents',
        content_slug: 'test-agent',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'review_ratings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'review_helpful_votes') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await markReviewHelpful({
        review_id: '223e4567-e89b-12d3-a456-426614174001',
        helpful: false,
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.helpful).toBe(false);
    });

    test('should throw error when user tries to vote on own review', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '223e4567-e89b-12d3-a456-426614174001',
            user_id: mockUser.id, // Same as current user
            content_type: 'agents',
            content_slug: 'test-agent',
          },
          error: null,
        }),
      });

      const result = await markReviewHelpful({
          review_id: '223e4567-e89b-12d3-a456-426614174001',
          helpful: true,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You cannot vote on your own review');
    });

    test('should throw error for duplicate helpful vote', async () => {
      const mockReview = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        user_id: '323e4567-e89b-12d3-a456-426614174002',
        content_type: 'agents',
        content_slug: 'test-agent',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'review_ratings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockReview,
              error: null,
            }),
          };
        }
        if (table === 'review_helpful_votes') {
          return {
            insert: vi.fn().mockResolvedValue({
              error: { code: '23505', message: 'Duplicate' },
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await markReviewHelpful({
          review_id: '223e4567-e89b-12d3-a456-426614174001',
          helpful: true,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You have already marked this review as helpful');
    });
  });

  describe('getReviews', () => {
    test('should fetch reviews with pagination', async () => {
      const mockReviews = reviewFactory.buildList(5);

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockRange = vi.fn().mockResolvedValue({
        data: mockReviews,
        error: null,
        count: 20, // Total count
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'review_ratings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: mockRange,
          };
        }
        if (table === 'review_helpful_votes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await getReviews({
        content_type: 'agents',
        content_slug: 'test-agent',
        sort_by: 'recent',
        limit: 5,
        offset: 0,
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.reviews).toHaveLength(5);
      expect(result?.data?.total).toBe(20);
      expect(result?.data?.hasMore).toBe(true);
      expect(mockRange).toHaveBeenCalledWith(0, 4); // offset to offset + limit - 1
    });

    test('should sort reviews by helpful count', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockOrder = vi.fn().mockReturnThis();
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: mockOrder,
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      await getReviews({
        content_type: 'agents',
        content_slug: 'test-agent',
        sort_by: 'helpful',
        limit: 20,
        offset: 0,
      });

      expect(mockOrder).toHaveBeenCalledWith('helpful_count', { ascending: false });
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    test('should attach user helpful vote status to reviews', async () => {
      const mockReviews = [
        { id: '423e4567-e89b-12d3-a456-426614174003', rating: 5 },
        { id: '523e4567-e89b-12d3-a456-426614174004', rating: 4 },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callCount = 0;
      const mockFrom = vi.fn((table: string) => {
        if (table === 'review_ratings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: mockReviews,
              error: null,
              count: 2,
            }),
          };
        }
        if (table === 'review_helpful_votes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ review_id: '423e4567-e89b-12d3-a456-426614174003' }], // User voted review-1 helpful
              error: null,
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await getReviews({
        content_type: 'agents',
        content_slug: 'test-agent',
        sort_by: 'recent',
        limit: 20,
        offset: 0,
      });

      expect(result?.data?.reviews[0].user_has_voted_helpful).toBe(true);
      expect(result?.data?.reviews[1].user_has_voted_helpful).toBe(false);
    });
  });

  describe('getAggregateRating', () => {
    test('should calculate average rating and distribution', async () => {
      const mockRatings = [
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRatings,
              error: null,
            }),
          }),
        }),
      });

      const result = await getAggregateRating({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.count).toBe(7);
      expect(result?.data?.average).toBe(4.0);
      expect(result?.data?.distribution).toEqual({
        1: 0,
        2: 1,
        3: 1,
        4: 2,
        5: 3,
      });
    });

    test('should return zero stats for content with no reviews', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await getAggregateRating({
        content_type: 'agents',
        content_slug: 'no-reviews',
      });

      expect(result?.data?.average).toBe(0);
      expect(result?.data?.count).toBe(0);
      expect(result?.data?.distribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    test('should round average to one decimal place', async () => {
      const mockRatings = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRatings,
              error: null,
            }),
          }),
        }),
      });

      const result = await getAggregateRating({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // (5 + 4 + 3) / 3 = 4.0
      expect(result?.data?.average).toBe(4.0);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    test('should reject invalid rating values', async () => {
      const result1 = await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 0,
        });
      expect(result1?.validationErrors).toBeDefined();

      const result2 = await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 6,
        });
      expect(result2?.validationErrors).toBeDefined();
    });

    test('should reject non-integer rating values', async () => {
      const result = await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 4.5,
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject review text that is too long', async () => {
      const result = await createReview({
          content_type: 'agents',
          content_slug: 'test-agent',
          rating: 5,
          review_text: 'A'.repeat(2001),
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should trim review text whitespace', async () => {
      const mockReview = reviewFactory.build();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'review_ratings') {
          const calls = mockSupabase.from.mock.calls.length;

          if (calls === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            };
          }
          return {
            insert: vi.fn((data) => {
              // Verify text is trimmed
              expect(data.review_text).toBe('Trimmed text');
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: mockReview,
                  error: null,
                }),
              };
            }),
          };
        }
        return {};
      });

      await createReview({
        content_type: 'agents',
        content_slug: 'test-agent',
        rating: 5,
        review_text: '  Trimmed text  ',
      });
    });

    test('should reject invalid UUID for review_id', async () => {
      const result = await updateReview({
          review_id: 'not-a-uuid',
          rating: 5,
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject invalid sort_by values', async () => {
      const result = await getReviews({
          content_type: 'agents',
          content_slug: 'test-agent',
          sort_by: 'invalid' as any,
          limit: 20,
          offset: 0,
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should enforce pagination limits', async () => {
      const result1 = await getReviews({
          content_type: 'agents',
          content_slug: 'test-agent',
          sort_by: 'recent',
          limit: 101, // Max is 100
          offset: 0,
        });
      expect(result1?.validationErrors).toBeDefined();

      const result2 = await getReviews({
          content_type: 'agents',
          content_slug: 'test-agent',
          sort_by: 'recent',
          limit: 0,
          offset: 0,
        });
      expect(result2?.validationErrors).toBeDefined();
    });
  });
});
