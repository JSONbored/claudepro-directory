/**
 * Collection Actions Database Integration Tests
 *
 * Tests user collection CRUD operations and collection item management.
 * Validates business logic, authorization, and database interactions.
 *
 * **Test Coverage:**
 * - Collection CRUD operations
 * - Collection item management
 * - Item reordering with batch optimization
 * - Public/private visibility
 * - Authorization enforcement
 * - Slug uniqueness
 *
 * @see src/lib/actions/collection-actions.ts
 */

import { describe, expect, test, beforeEach, vi } from 'vitest';

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
  createCollection,
  updateCollection,
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
  reorderCollectionItems,
  getUserCollections,
  getCollectionWithItems,
} = await import('@/src/lib/actions/collection-actions');

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
 * Helper to mock Supabase query chain: .from().update().eq().eq().select().single()
 */
function mockSupabaseUpdateChain(responseData: unknown, responseError: unknown = null) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: responseData,
    error: responseError,
  });

  const mockSelect = vi.fn().mockReturnValue({
    single: mockSingle,
  });

  const mockEq2 = vi.fn().mockReturnValue({
    select: mockSelect,
  });

  const mockEq1 = vi.fn().mockReturnValue({
    eq: mockEq2,
  });

  const mockUpdate = vi.fn().mockReturnValue({
    eq: mockEq1,
  });

  return { mockUpdate, mockEq: mockEq1, mockSelect, mockSingle };
}

/**
 * Helper to mock Supabase query chain: .from().delete().eq().eq()
 */
function mockSupabaseDeleteChain(responseError: unknown = null, numEqCalls: number = 2) {
  // The final result when all .eq() calls are done
  const finalResult = {
    error: responseError,
  };

  // Build the chain from the end backwards
  let chain: any = vi.fn().mockResolvedValue(finalResult);

  // Wrap each .eq() call
  for (let i = 1; i < numEqCalls; i++) {
    const nextEq = chain;
    chain = vi.fn().mockReturnValue({ eq: nextEq });
  }

  const mockDelete = vi.fn().mockReturnValue({ eq: chain });

  return { mockDelete };
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

/**
 * Helper to mock Supabase query chain: .from().upsert().select()
 */
function mockSupabaseUpsertChain(responseData: unknown, responseError: unknown = null) {
  const mockSelect = vi.fn().mockResolvedValue({
    data: responseData,
    error: responseError,
  });

  const mockUpsert = vi.fn().mockReturnValue({
    select: mockSelect,
  });

  return { mockUpsert, mockSelect };
}

describe('Collection Actions - Database Integration', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };
  const mockCollectionId = '223e4567-e89b-12d3-a456-426614174000';
  const mockItemId = '323e4567-e89b-12d3-a456-426614174000';
  const mockItemId2 = '423e4567-e89b-12d3-a456-426614174000';
  const mockItemId3 = '523e4567-e89b-12d3-a456-426614174000';
  const mockItemId999 = '623e4567-e89b-12d3-a456-426614174000';

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

  describe('createCollection', () => {
    test('should successfully create a collection', async () => {
      const mockCollection = {
        id: mockCollectionId,
        user_id: mockUser.id,
        name: 'My Favorites',
        slug: 'my-favorites',
        description: 'Collection of favorite agents',
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockInsert } = mockSupabaseInsertChain(mockCollection);
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const result = await createCollection({
        name: 'My Favorites',
        description: 'Collection of favorite agents',
        is_public: false,
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.collection).toEqual(mockCollection);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        name: 'My Favorites',
        slug: 'my-favorites',
        description: 'Collection of favorite agents',
        is_public: false,
      });
    });

    test('should auto-generate slug from name if not provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockInsert } = mockSupabaseInsertChain({ slug: 'typescript-essentials' });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      await createCollection({
        name: 'TypeScript Essentials',
        is_public: false,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'typescript-essentials',
        })
      );
    });

    test('should use provided custom slug', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockInsert } = mockSupabaseInsertChain({ slug: 'custom-slug' });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      await createCollection({
        name: 'My Collection',
        slug: 'custom-slug',
        is_public: false,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'custom-slug',
        })
      );
    });

    test('should throw error for duplicate slug', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockInsert } = mockSupabaseInsertChain(
        null,
        { code: '23505', message: 'Unique constraint violation' }
      );
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const result = await createCollection({
          name: 'Duplicate',
          slug: 'existing-slug',
          is_public: false,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('A collection with this slug already exists');
    });

    test('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await createCollection({
          name: 'Test Collection',
          is_public: false,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You must be signed in to create collections');
    });

    test('should revalidate public profile when creating public collection', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockInsert } = mockSupabaseInsertChain({ is_public: true });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      await createCollection({
        name: 'Public Collection',
        is_public: true,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith('/u/[slug]', 'page');
    });
  });

  describe('updateCollection', () => {
    test('should successfully update a collection', async () => {
      const updatedCollection = {
        id: mockCollectionId,
        user_id: mockUser.id,
        name: 'Updated Name',
        slug: 'updated-slug',
        description: 'Updated description',
        is_public: true,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockUpdate } = mockSupabaseUpdateChain(updatedCollection);
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const result = await updateCollection({
        id: mockCollectionId,
        name: 'Updated Name',
        slug: 'updated-slug',
        description: 'Updated description',
        is_public: true,
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.collection).toEqual(updatedCollection);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          slug: 'updated-slug',
          description: 'Updated description',
          is_public: true,
        })
      );
    });

    test('should throw error when user does not own collection', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockUpdate } = mockSupabaseUpdateChain(null);
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const result = await updateCollection({
          id: mockCollectionId,
          name: 'Updated Name',
          is_public: false,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('Collection not found or you do not have permission to update it');
    });

    test('should revalidate collection-specific pages', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockUpdate } = mockSupabaseUpdateChain({ slug: 'my-collection', is_public: true });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await updateCollection({
        id: mockCollectionId,
        name: 'Updated Collection',
        is_public: true,
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/library/my-collection');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/u/[slug]', 'page');
    });
  });

  describe('deleteCollection', () => {
    test('should successfully delete a collection', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockDelete } = mockSupabaseDeleteChain(null, 2);
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      const result = await deleteCollection({
        id: mockCollectionId,
      });

      expect(result?.data?.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    test('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await deleteCollection({
          id: mockCollectionId,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('You must be signed in to delete collections');
    });
  });

  describe('addItemToCollection', () => {
    test('should successfully add an item to a collection', async () => {
      const mockItem = {
        id: mockItemId,
        collection_id: mockCollectionId,
        user_id: mockUser.id,
        content_type: 'agents',
        content_slug: 'code-reviewer',
        notes: 'Great for PRs',
        order: 0,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock collection verification and item insertion
      const mockFrom = vi.fn((table: string) => {
        if (table === 'user_collections') {
          // .select('id').eq().eq().single() chain
          const mockSingle = vi.fn().mockResolvedValue({
            data: { id: mockCollectionId },
            error: null,
          });
          const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
          const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
          const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
          return { select: mockSelect };
        }
        if (table === 'collection_items') {
          // .insert().select().single() chain
          const { mockInsert } = mockSupabaseInsertChain(mockItem);
          return { insert: mockInsert };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await addItemToCollection({
        collection_id: mockCollectionId,
        content_type: 'agents',
        content_slug: 'code-reviewer',
        notes: 'Great for PRs',
        order: 0,
      });

      expect(result?.data?.success).toBe(true);
      expect(result?.data?.item).toEqual(mockItem);
    });

    test('should throw error when collection does not belong to user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock collection verification returning null (not found)
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await addItemToCollection({
          collection_id: mockCollectionId,
          content_type: 'agents',
          content_slug: 'test-agent',
          order: 0,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('Collection not found or you do not have permission');
    });

    test('should throw error for duplicate item', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'user_collections') {
          // Collection verification succeeds
          const mockSingle = vi.fn().mockResolvedValue({
            data: { id: mockCollectionId },
            error: null,
          });
          const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
          const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
          const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
          return { select: mockSelect };
        }
        if (table === 'collection_items') {
          // Insert fails with duplicate error
          const { mockInsert } = mockSupabaseInsertChain(null, { code: '23505' });
          return { insert: mockInsert };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await addItemToCollection({
          collection_id: mockCollectionId,
          content_type: 'agents',
          content_slug: 'duplicate-agent',
          order: 0,
        });
      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain('This item is already in the collection');
    });
  });

  describe('removeItemFromCollection', () => {
    test('should successfully remove an item from a collection', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { mockDelete } = mockSupabaseDeleteChain(null, 3);
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      const result = await removeItemFromCollection({
        id: mockItemId,
        collection_id: mockCollectionId,
      });

      expect(result?.data?.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('reorderCollectionItems', () => {
    test('should successfully reorder collection items with batch upsert', async () => {
      const existingItems = [
        { id: mockItemId, content_type: 'agents', content_slug: 'agent-a' },
        { id: mockItemId2, content_type: 'agents', content_slug: 'agent-b' },
        { id: mockItemId3, content_type: 'mcp', content_slug: 'mcp-a' },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'user_collections') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockCollectionId },
              error: null,
            }),
          };
        }
        if (table === 'collection_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: existingItems,
              error: null,
            }),
            upsert: mockUpsert,
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const items = [
        { id: mockItemId, order: 2 },
        { id: mockItemId2, order: 0 },
        { id: mockItemId3, order: 1 },
      ];

      const result = await reorderCollectionItems({
        collection_id: mockCollectionId,
        items,
      });

      expect(result?.data?.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: mockItemId,
            order: 2,
            content_type: 'agents',
            content_slug: 'agent-a',
          }),
          expect.objectContaining({
            id: mockItemId2,
            order: 0,
            content_type: 'agents',
            content_slug: 'agent-b',
          }),
          expect.objectContaining({
            id: mockItemId3,
            order: 1,
            content_type: 'mcp',
            content_slug: 'mcp-a',
          }),
        ]),
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      );
    });

    test('should skip items not found in existing collection', async () => {
      const existingItems = [
        { id: mockItemId, content_type: 'agents', content_slug: 'agent-a' },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'user_collections') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockCollectionId },
              error: null,
            }),
          };
        }
        if (table === 'collection_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: existingItems,
              error: null,
            }),
            upsert: mockUpsert,
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const items = [
        { id: mockItemId, order: 0 },
        { id: mockItemId999, order: 1 }, // Does not exist
      ];

      await reorderCollectionItems({
        collection_id: mockCollectionId,
        items,
      });

      // Should only upsert item-1 (item-999 is filtered out)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: mockItemId }),
        ]),
        expect.anything()
      );
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({ id: mockItemId999 }),
        ]),
        expect.anything()
      );
    });
  });

  describe('getUserCollections', () => {
    test('should return all user collections ordered by creation date', async () => {
      const mockCollections = [
        { id: 'c1', name: 'Collection 1', created_at: '2024-01-15' },
        { id: 'c2', name: 'Collection 2', created_at: '2024-01-16' },
        { id: 'c3', name: 'Collection 3', created_at: '2024-01-17' },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockCollections,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await getUserCollections();

      expect(result).toEqual(mockCollections);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    test('should return empty array when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUserCollections();

      expect(result).toEqual([]);
    });
  });

  describe('getCollectionWithItems', () => {
    test('should return collection with items and ownership status', async () => {
      const mockCollection = {
        id: mockCollectionId,
        user_id: mockUser.id,
        name: 'My Collection',
        slug: 'my-collection',
      };

      const mockItems = [
        { id: mockItemId, content_type: 'agents', content_slug: 'agent-a', order: 0 },
        { id: mockItemId2, content_type: 'mcp', content_slug: 'mcp-a', order: 1 },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'user_collections') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockCollection,
              error: null,
            }),
          };
        }
        if (table === 'collection_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockItems,
              error: null,
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await getCollectionWithItems(mockCollectionId);

      expect(result).toEqual({
        ...mockCollection,
        items: mockItems,
        isOwner: true,
      });
    });

    test('should indicate non-owner for collections owned by others', async () => {
      const mockCollection = {
        id: mockCollectionId,
        user_id: 'other-user-id',
        name: 'Public Collection',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'user_collections') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockCollection,
              error: null,
            }),
          };
        }
        if (table === 'collection_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {};
      });

      mockSupabase.from = mockFrom;

      const result = await getCollectionWithItems(mockCollectionId);

      expect(result.isOwner).toBe(false);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    test('should reject collection name that is too short', async () => {
      const result = await createCollection({
          name: 'A',
          is_public: false,
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject collection name that is too long', async () => {
      const result = await createCollection({
          name: 'A'.repeat(101),
          is_public: false,
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject invalid slug format', async () => {
      const result = await createCollection({
          name: 'Test Collection',
          slug: 'Invalid Slug!',
          is_public: false,
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject description that is too long', async () => {
      const result = await createCollection({
          name: 'Test Collection',
          description: 'A'.repeat(501),
          is_public: false,
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject invalid UUID for collection_id', async () => {
      const result = await addItemToCollection({
          collection_id: 'not-a-uuid',
          content_type: 'agents',
          content_slug: 'test-agent',
          order: 0,
        });
      expect(result?.validationErrors).toBeDefined();
    });

    test('should reject item notes that are too long', async () => {
      const result = await addItemToCollection({
          collection_id: '123e4567-e89b-12d3-a456-426614174000',
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: 'A'.repeat(501),
          order: 0,
        });
      expect(result?.validationErrors).toBeDefined();
    });
  });
});
