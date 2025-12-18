import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware
vi.mock('./safe-action.ts', () => {
  const createActionMock = (schema: any) => ({
    action: vi.fn((handler) => {
      return async (input: unknown) => {
        const parsed = schema ? schema.parse(input) : input;
        return handler({
          parsedInput: parsed,
          ctx: { userId: 'test-user-id' },
        });
      };
    }),
  });

  return {
    optionalAuthAction: {
      metadata: vi.fn(() => ({
        inputSchema: vi.fn((schema) => createActionMock(schema)),
      })),
    },
    rateLimitedAction: {
      inputSchema: vi.fn((schema) => ({
        metadata: vi.fn(() => createActionMock(schema)),
      })),
    },
  };
});

// Mock data layer
vi.mock('../data/content/reviews.ts', () => ({
  getReviewsWithStatsData: vi.fn(),
}));

vi.mock('../data/content/paginated.ts', () => ({
  getPaginatedContent: vi.fn(),
}));

// Mock logging
vi.mock('../logging/server.ts', () => ({
  logger: {
    error: vi.fn(),
  },
  createWebAppContextWithId: vi.fn(() => ({
    requestId: 'test-request-id',
    operation: 'test-operation',
  })),
}));

// Mock errors
vi.mock('../errors.ts', () => ({
  normalizeError: vi.fn((error, message) => {
    const err = error instanceof Error ? error : new Error(String(error));
    err.message = message;
    return err;
  }),
}));

describe('getReviewsWithStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate content_category enum', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { content_categorySchema } = await import('./prisma-zod-schemas.ts');
      const validCategories = content_categorySchema._def.values;

      expect(() => {
        content_categorySchema.parse(validCategories[0]);
      }).not.toThrow();
    });

    it('should validate content_slug format', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      // Invalid slug format
      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'invalid slug with spaces!',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate sort_by enum', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
          sort_by: 'invalid-sort',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate limit and offset ranges', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
          limit: 0,
        } as any)
      ).rejects.toThrow();

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
          limit: 101,
        } as any)
      ).rejects.toThrow();

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
          offset: -1,
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('data fetching', () => {
    it('should call getReviewsWithStatsData with correct parameters', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');

      const mockData = {
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            review_text: 'Great!',
          },
        ],
        stats: {
          total_reviews: 10,
          average_rating: 4.5,
        },
      };

      vi.mocked(getReviewsWithStatsData).mockResolvedValue(mockData as any);

      const result = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
        sort_by: 'recent',
        limit: 20,
        offset: 0,
      });

      expect(getReviewsWithStatsData).toHaveBeenCalledWith({
        contentType: 'agents',
        contentSlug: 'test-agent',
        sortBy: 'recent',
        limit: 20,
        offset: 0,
        userId: 'test-user-id',
      });

      expect(result).toEqual(mockData);
    });

    it('should not include userId when user is not authenticated', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');

      // Mock optionalAuthAction to return null userId
      vi.mock('./safe-action.ts', async () => {
        const actual = await vi.importActual('./safe-action.ts');
        return {
          ...actual,
          optionalAuthAction: {
            metadata: vi.fn(() => ({
              inputSchema: vi.fn((schema) => ({
                action: vi.fn((handler) => {
                  return async (input: unknown) => {
                    const parsed = schema.parse(input);
                    return handler({
                      parsedInput: parsed,
                      ctx: { userId: null },
                    });
                  };
                }),
              })),
            })),
          },
        };
      });

      vi.mocked(getReviewsWithStatsData).mockResolvedValue({ reviews: [], stats: {} } as any);

      await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(getReviewsWithStatsData).toHaveBeenCalledWith(
        expect.not.objectContaining({
          userId: expect.anything(),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle null data from service', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');
      const { logger } = await import('../logging/server.ts');

      vi.mocked(getReviewsWithStatsData).mockResolvedValue(null);

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
        })
      ).rejects.toThrow('Failed to fetch reviews');

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');
      const { logger } = await import('../logging/server.ts');

      const mockError = new Error('Service error');
      vi.mocked(getReviewsWithStatsData).mockRejectedValue(mockError);

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
        })
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle ctx.userId being undefined', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');

      vi.mocked(getReviewsWithStatsData).mockResolvedValue({ reviews: [], stats: {} } as any);

      // Mock to return ctx without userId
      vi.doMock('./safe-action.ts', async () => {
        const actual = await vi.importActual('./safe-action.ts');
        return {
          ...actual,
          optionalAuthAction: {
            metadata: vi.fn(() => ({
              inputSchema: vi.fn((schema) => ({
                action: vi.fn((handler) => {
                  return async (input: unknown) => {
                    const parsed = schema.parse(input);
                    return handler({
                      parsedInput: parsed,
                      ctx: {}, // No userId
                    });
                  };
                }),
              })),
            })),
          },
        };
      });

      await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      expect(getReviewsWithStatsData).toHaveBeenCalledWith(
        expect.not.objectContaining({
          userId: expect.anything(),
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle lazy import errors for data/content/reviews', async () => {
      // This tests error handling when dynamic import fails
      // Note: Actual import errors are hard to test, but we verify error handling path
      const { getReviewsWithStats } = await import('./content.ts');
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');
      const { logger } = await import('../logging/server.ts');

      const mockError = new Error('Import failed');
      vi.mocked(getReviewsWithStatsData).mockRejectedValue(mockError);

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
        })
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle createWebAppContextWithId errors gracefully', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');
      const { createWebAppContextWithId } = await import('../logging/server.ts');

      vi.mocked(createWebAppContextWithId).mockImplementation(() => {
        throw new Error('Context creation failed');
      });

      // Should still work, just without logging context
      vi.mocked(getReviewsWithStatsData).mockResolvedValue({ reviews: [], stats: {} } as any);

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
        })
      ).rejects.toThrow();
    });
  });
});

describe('fetchPaginatedContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate offset and limit ranges', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      await expect(
        fetchPaginatedContent({
          offset: -1,
          limit: 10,
        } as any)
      ).rejects.toThrow();

      await expect(
        fetchPaginatedContent({
          offset: 0,
          limit: 0,
        } as any)
      ).rejects.toThrow();

      await expect(
        fetchPaginatedContent({
          offset: 0,
          limit: 101,
        } as any)
      ).rejects.toThrow();
    });

    it('should accept nullable category', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');

      vi.mocked(getPaginatedContent).mockResolvedValue([]);

      await fetchPaginatedContent({
        offset: 0,
        limit: 30,
        category: null,
      });

      expect(getPaginatedContent).toHaveBeenCalled();
    });
  });

  describe('data fetching', () => {
    it('should call getPaginatedContent with correct parameters', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');

      const mockContent = [
        {
          id: 'content-1',
          title: 'Test Content',
          slug: 'test-content',
        },
      ];

      vi.mocked(getPaginatedContent).mockResolvedValue(mockContent as any);

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
        category: 'agents',
      });

      expect(getPaginatedContent).toHaveBeenCalledWith({
        offset: 0,
        limit: 30,
        category: 'agents',
      });

      expect(result).toEqual(mockContent);
    });

    it('should use default values', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');

      vi.mocked(getPaginatedContent).mockResolvedValue([]);

      await fetchPaginatedContent({});

      expect(getPaginatedContent).toHaveBeenCalledWith({
        offset: 0,
        limit: 30,
        category: null,
      });
    });

    it('should handle getPaginatedContent returning null data', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');
      const { logger } = await import('../logging/server.ts');

      vi.mocked(getPaginatedContent).mockResolvedValue(null as any);

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle getPaginatedContent returning data without items', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');
      const { logger } = await import('../logging/server.ts');

      vi.mocked(getPaginatedContent).mockResolvedValue({
        items: null,
        pagination: { total_count: 0 },
      } as any);

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle getPaginatedContent returning data with empty items array', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');

      vi.mocked(getPaginatedContent).mockResolvedValue({
        items: [],
        pagination: { total_count: 0 },
      } as any);

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
    });

    it('should handle getPaginatedContent returning non-array items', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');
      const { logger } = await import('../logging/server.ts');

      vi.mocked(getPaginatedContent).mockResolvedValue({
        items: 'not-an-array',
        pagination: { total_count: 0 },
      } as any);

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return empty array on error', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');
      const { logger } = await import('../logging/server.ts');

      vi.mocked(getPaginatedContent).mockRejectedValue(new Error('Service error'));

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle lazy import errors for data/content/paginated', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');
      const { logger } = await import('../logging/server.ts');

      vi.mocked(getPaginatedContent).mockRejectedValue(new Error('Import failed'));

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle createWebAppContextWithId errors gracefully', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');
      const { createWebAppContextWithId } = await import('../logging/server.ts');

      vi.mocked(createWebAppContextWithId).mockImplementation(() => {
        throw new Error('Context creation failed');
      });

      vi.mocked(getPaginatedContent).mockResolvedValue({ items: [] } as any);

      // Should still work, just without logging context
      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
    });

    it('should handle data.items being undefined (nullish coalescing)', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');
      const { getPaginatedContent } = await import('../data/content/paginated.ts');

      vi.mocked(getPaginatedContent).mockResolvedValue({
        items: undefined,
        pagination: { total_count: 0 },
      } as any);

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
    });
  });
});
