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
    rateLimitedAction: {
      inputSchema: vi.fn((schema) => ({
        metadata: vi.fn(() => createActionMock(schema)),
      })),
    },
  };
});

// Mock data layer
vi.mock('../data/newsletter.ts', () => ({
  getNewsletterSubscriberCount: vi.fn(),
}));

// Mock Inngest
vi.mock('../inngest/client.ts', () => ({
  inngest: {
    send: vi.fn(),
  },
}));

// Mock logging
vi.mock('../logging/server.ts', () => ({
  logger: {
    info: vi.fn(),
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

describe('getNewsletterCountAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return subscriber count from data layer', async () => {
    const { getNewsletterCountAction } = await import('./newsletter.ts');
    const { getNewsletterSubscriberCount } = await import('../data/newsletter.ts');

    vi.mocked(getNewsletterSubscriberCount).mockResolvedValue(1234);

    const result = await getNewsletterCountAction({});

    expect(getNewsletterSubscriberCount).toHaveBeenCalled();
    expect(result).toBe(1234);
  });

  it('should return null when count is null', async () => {
    const { getNewsletterCountAction } = await import('./newsletter.ts');
    const { getNewsletterSubscriberCount } = await import('../data/newsletter.ts');

    vi.mocked(getNewsletterSubscriberCount).mockResolvedValue(null);

    const result = await getNewsletterCountAction({});

    expect(result).toBeNull();
  });
});

describe('subscribeNewsletterAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate email format', async () => {
      const { subscribeNewsletterAction } = await import('./newsletter.ts');

      await expect(
        subscribeNewsletterAction({
          email: 'invalid-email',
          source: 'homepage',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate newsletter_source enum', async () => {
      const { subscribeNewsletterAction } = await import('./newsletter.ts');
      const { newsletter_sourceSchema } = await import('./prisma-zod-schemas.ts');
      const validSources = newsletter_sourceSchema._def.values;

      expect(() => {
        newsletter_sourceSchema.parse(validSources[0]);
      }).not.toThrow();
    });

    it('should accept optional metadata', async () => {
      const { subscribeNewsletterAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any);

      await subscribeNewsletterAction({
        email: 'test@example.com',
        source: 'homepage',
        metadata: {
          referrer: 'https://example.com',
          trigger_source: 'button',
        },
      });

      expect(inngest.send).toHaveBeenCalled();
    });
  });

  describe('Inngest event', () => {
    it('should send email/subscribe event to Inngest', async () => {
      const { subscribeNewsletterAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');
      const { logger } = await import('../logging/server.ts');

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any);

      const result = await subscribeNewsletterAction({
        email: 'TEST@EXAMPLE.COM',
        source: 'homepage',
        metadata: {
          referrer: 'https://example.com',
        },
      });

      expect(inngest.send).toHaveBeenCalledWith({
        name: 'email/subscribe',
        data: {
          email: 'test@example.com', // Should be normalized to lowercase
          source: 'homepage',
          referrer: 'https://example.com',
          metadata: {
            referrer: 'https://example.com',
          },
        },
      });

      expect(logger.info).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Subscription request received',
      });
    });

    it('should normalize email to lowercase and trim', async () => {
      const { subscribeNewsletterAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any);

      await subscribeNewsletterAction({
        email: '  TEST@EXAMPLE.COM  ',
        source: 'homepage',
      });

      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle Inngest send errors', async () => {
      const { subscribeNewsletterAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');
      const { logger } = await import('../logging/server.ts');

      const mockError = new Error('Inngest error');
      vi.mocked(inngest.send).mockRejectedValue(mockError);

      await expect(
        subscribeNewsletterAction({
          email: 'test@example.com',
          source: 'homepage',
        })
      ).rejects.toThrow('Failed to process subscription');

      expect(logger.error).toHaveBeenCalled();
    });
  });
});

describe('subscribeViaOAuthAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate email format', async () => {
      const { subscribeViaOAuthAction } = await import('./newsletter.ts');

      await expect(
        subscribeViaOAuthAction({
          email: 'invalid-email',
        } as any)
      ).rejects.toThrow();
    });

    it('should accept optional metadata with trigger_source enum', async () => {
      const { subscribeViaOAuthAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any);

      await subscribeViaOAuthAction({
        email: 'test@example.com',
        metadata: {
          trigger_source: 'auth_callback',
          referrer: 'https://example.com',
        },
      });

      expect(inngest.send).toHaveBeenCalled();
    });
  });

  describe('Inngest event', () => {
    it('should send email/subscribe event with oauth_signup source', async () => {
      const { subscribeViaOAuthAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any);

      await subscribeViaOAuthAction({
        email: 'test@example.com',
        metadata: {
          trigger_source: 'auth_callback',
        },
      });

      expect(inngest.send).toHaveBeenCalledWith({
        name: 'email/subscribe',
        data: {
          email: 'test@example.com',
          source: 'oauth_signup',
          referrer: undefined,
          metadata: {
            trigger_source: 'auth_callback',
          },
        },
      });
    });

    it('should normalize email to lowercase and trim', async () => {
      const { subscribeViaOAuthAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any);

      await subscribeViaOAuthAction({
        email: '  TEST@EXAMPLE.COM  ',
      });

      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle Inngest send errors', async () => {
      const { subscribeViaOAuthAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');
      const { logger } = await import('../logging/server.ts');

      const mockError = new Error('Inngest error');
      vi.mocked(inngest.send).mockRejectedValue(mockError);

      await expect(
        subscribeViaOAuthAction({
          email: 'test@example.com',
        })
      ).rejects.toThrow('Failed to process subscription');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle getNewsletterSubscriberCount returning undefined', async () => {
      const { getNewsletterCountAction } = await import('./newsletter.ts');
      const { getNewsletterSubscriberCount } = await import('../data/newsletter.ts');

      vi.mocked(getNewsletterSubscriberCount).mockResolvedValue(undefined as any);

      const result = await getNewsletterCountAction({});

      expect(result).toBeNull();
    });

    it('should handle metadata being null/undefined in subscribeNewsletterAction', async () => {
      const { subscribeNewsletterAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any);

      await subscribeNewsletterAction({
        email: 'test@example.com',
        source: 'homepage',
        metadata: undefined,
      });

      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referrer: undefined,
            metadata: undefined,
          }),
        })
      );
    });

    it('should handle createWebAppContextWithId errors gracefully in subscribeNewsletterAction', async () => {
      const { subscribeNewsletterAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');
      const { createWebAppContextWithId } = await import('../logging/server.ts');

      vi.mocked(createWebAppContextWithId).mockImplementation(() => {
        throw new Error('Context creation failed');
      });

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any);

      // Should still work, just without logging context
      const result = await subscribeNewsletterAction({
        email: 'test@example.com',
        source: 'homepage',
      });

      expect(result.success).toBe(true);
    });

    it('should handle createWebAppContextWithId errors gracefully in subscribeViaOAuthAction', async () => {
      const { subscribeViaOAuthAction } = await import('./newsletter.ts');
      const { inngest } = await import('../inngest/client.ts');
      const { createWebAppContextWithId } = await import('../logging/server.ts');

      vi.mocked(createWebAppContextWithId).mockImplementation(() => {
        throw new Error('Context creation failed');
      });

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any);

      // Should still work, just without logging context
      const result = await subscribeViaOAuthAction({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
    });
  });
});
