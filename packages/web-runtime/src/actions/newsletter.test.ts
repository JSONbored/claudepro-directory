import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware - standardized pattern
// Pattern: rateLimitedAction.inputSchema().metadata().action()
vi.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
      return async (input: unknown) => {
        const parsed = inputSchema ? inputSchema.parse(input) : input;
        return handler({
          parsedInput: parsed,
          ctx: { userAgent: 'test-user-agent', startTime: performance.now() },
        });
      };
    });
  };

  const createMetadataResult = (inputSchema: any) => ({
    action: createActionHandler(inputSchema),
  });

  const createInputSchemaResult = (inputSchema: any) => ({
    metadata: vi.fn(() => createMetadataResult(inputSchema)),
    action: createActionHandler(inputSchema),
  });

  return {
    rateLimitedAction: {
      inputSchema: vi.fn((schema: any) => createInputSchemaResult(schema)),
    },
  };
});

// Mock data layer
vi.mock('../data/newsletter.ts', () => ({
  getNewsletterSubscriberCount: vi.fn(),
  getNewsletterSubscriptionByEmail: vi.fn(),
}));

// Mock data service factory
vi.mock('../data/service-factory.ts', () => ({
  getService: vi.fn(),
}));

// Mock Resend integration
vi.mock('../integrations/resend.ts', () => ({
  getResendClient: vi.fn(),
  validateTopicIds: vi.fn(),
  RESEND_TOPIC_IDS: {
    weekly_digest: 'topic-1',
    agents_prompts: 'topic-2',
    mcp_integrations: 'topic-3',
  },
  getContactTopics: vi.fn(),
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

// Mock auth
vi.mock('../auth/get-authenticated-user.ts', () => ({
  getAuthenticatedUser: vi.fn(),
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

describe.skip('subscribeNewsletterAction', () => {
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
      const { newsletter_sourceSchema } = await import('../prisma-zod-schemas.ts');
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

describe.skip('subscribeViaOAuthAction', () => {
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

describe('updateTopicPreferencesAction', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockSubscription = {
    id: 'sub-123',
    email: 'test@example.com',
    resend_contact_id: 'resend-contact-123',
    resend_topics: ['topic-1'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const { getAuthenticatedUser } = require('../auth/get-authenticated-user');
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser });
    const { getNewsletterSubscriptionByEmail } = require('../data/newsletter');
    vi.mocked(getNewsletterSubscriptionByEmail).mockResolvedValue(mockSubscription);
    const { getResendClient, getContactTopics } = require('../integrations/resend');
    vi.mocked(getResendClient).mockReturnValue({
      contacts: {
        topics: {
          update: vi.fn().mockResolvedValue({ data: {}, error: null }),
        },
      },
    });
    vi.mocked(getContactTopics).mockResolvedValue(['topic-1', 'topic-2']);
    const { getService } = require('../data/service-factory');
    vi.mocked(getService).mockResolvedValue({
      updateResendTopics: vi.fn().mockResolvedValue(undefined),
    });
    const { validateTopicIds } = require('../integrations/resend');
    vi.mocked(validateTopicIds).mockReturnValue(true);
  });

  it('should update topic preferences in Resend and sync to DB', async () => {
    const { updateTopicPreferencesAction } = await import('./newsletter.ts');
    const { getResendClient, getContactTopics } = await import('../integrations/resend');
    const { getService } = await import('../data/service-factory');

    const resendClient = getResendClient();
    const newsletterService = await getService('newsletter');

    const result = await updateTopicPreferencesAction({
      topicIds: ['topic-2'],
      optIn: true,
    });

    expect(resendClient.contacts.topics.update).toHaveBeenCalledWith({
      id: mockSubscription.resend_contact_id,
      topics: [{ id: 'topic-2', subscription: 'opt_in' }],
    });
    expect(getContactTopics).toHaveBeenCalledWith(resendClient, mockSubscription.resend_contact_id);
    expect(newsletterService.updateResendTopics).toHaveBeenCalledWith(
      mockUser.email,
      ['topic-1', 'topic-2']
    );
    expect(result).toEqual({ success: true });
  });

  it('should handle opt-out correctly', async () => {
    const { updateTopicPreferencesAction } = await import('./newsletter.ts');
    const { getResendClient, getContactTopics } = await import('../integrations/resend');
    const { getService } = await import('../data/service-factory');

    const resendClient = getResendClient();
    const newsletterService = await getService('newsletter');

    // Mock getContactTopics to return topics after opt-out
    vi.mocked(getContactTopics).mockResolvedValue(['topic-1']); // topic-2 removed after opt-out

    await updateTopicPreferencesAction({
      topicIds: ['topic-2'],
      optIn: false,
    });

    expect(resendClient.contacts.topics.update).toHaveBeenCalledWith({
      id: mockSubscription.resend_contact_id,
      topics: [{ id: 'topic-2', subscription: 'opt_out' }],
    });
    expect(getContactTopics).toHaveBeenCalledWith(resendClient, mockSubscription.resend_contact_id);
    expect(newsletterService.updateResendTopics).toHaveBeenCalledWith(mockUser.email, ['topic-1']);
  });

  it('should throw error if user not authenticated', async () => {
    const { updateTopicPreferencesAction } = await import('./newsletter.ts');
    const { getAuthenticatedUser } = require('../auth/get-authenticated-user');
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: null });

    await expect(
      updateTopicPreferencesAction({ topicIds: ['topic-1'], optIn: true })
    ).rejects.toThrow('User email is required');
  });

  it('should throw error if subscription not found', async () => {
    const { updateTopicPreferencesAction } = await import('./newsletter.ts');
    const { getNewsletterSubscriptionByEmail } = require('../data/newsletter');
    vi.mocked(getNewsletterSubscriptionByEmail).mockResolvedValue(null);

    await expect(
      updateTopicPreferencesAction({ topicIds: ['topic-1'], optIn: true })
    ).rejects.toThrow('Newsletter subscription not found');
  });

  it('should throw error if Resend contact ID not found', async () => {
    const { updateTopicPreferencesAction } = await import('./newsletter.ts');
    const { getNewsletterSubscriptionByEmail } = require('../data/newsletter');
    vi.mocked(getNewsletterSubscriptionByEmail).mockResolvedValue({
      ...mockSubscription,
      resend_contact_id: null,
    });

    await expect(
      updateTopicPreferencesAction({ topicIds: ['topic-1'], optIn: true })
    ).rejects.toThrow('Resend contact ID not found. Please contact support.');
  });

  it('should throw error if Resend API update fails', async () => {
    const { updateTopicPreferencesAction } = await import('./newsletter.ts');
    const { getResendClient } = require('../integrations/resend');
    vi.mocked(getResendClient).mockReturnValue({
      contacts: {
        topics: {
          update: vi.fn().mockResolvedValue({ data: null, error: { message: 'API error' } }),
        },
      },
    });

    await expect(
      updateTopicPreferencesAction({ topicIds: ['topic-2'], optIn: true })
    ).rejects.toThrow('API error');
  });

  it('should validate topic IDs using validateTopicIds', async () => {
    const { updateTopicPreferencesAction } = await import('./newsletter.ts');
    const { validateTopicIds } = require('../integrations/resend');
    vi.mocked(validateTopicIds).mockReturnValue(false); // Simulate invalid topic ID

    await expect(
      updateTopicPreferencesAction({ topicIds: ['invalid_topic'], optIn: true })
    ).rejects.toThrow(/All topic IDs must be valid Resend topic IDs/);
  });
});

describe('unsubscribeFromNewsletterAction', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockSubscription = {
    id: 'sub-123',
    email: 'test@example.com',
    resend_contact_id: 'resend-contact-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const { getAuthenticatedUser } = require('../auth/get-authenticated-user');
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: mockUser });
    const { getNewsletterSubscriptionByEmail } = require('../data/newsletter');
    vi.mocked(getNewsletterSubscriptionByEmail).mockResolvedValue(mockSubscription);
    const { getResendClient } = require('../integrations/resend');
    vi.mocked(getResendClient).mockReturnValue({
      contacts: {
        update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
    });
    const { getService } = require('../data/service-factory');
    vi.mocked(getService).mockResolvedValue({
      unsubscribeWithTimestamp: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('should unsubscribe user in Resend and update DB', async () => {
    const { unsubscribeFromNewsletterAction } = await import('./newsletter.ts');
    const { getResendClient } = await import('../integrations/resend');
    const { getService } = await import('../data/service-factory');

    const resendClient = getResendClient();
    const newsletterService = await getService('newsletter');

    const result = await unsubscribeFromNewsletterAction({});

    expect(resendClient.contacts.update).toHaveBeenCalledWith({
      id: mockSubscription.resend_contact_id,
      unsubscribed: true,
    });
    expect(newsletterService.unsubscribeWithTimestamp).toHaveBeenCalledWith(mockUser.email);
    expect(result).toEqual({ success: true });
  });

  it('should throw error if user not authenticated', async () => {
    const { unsubscribeFromNewsletterAction } = await import('./newsletter.ts');
    const { getAuthenticatedUser } = require('../auth/get-authenticated-user');
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: null });

    await expect(unsubscribeFromNewsletterAction({})).rejects.toThrow('User email is required');
  });

  it('should throw error if subscription not found', async () => {
    const { unsubscribeFromNewsletterAction } = await import('./newsletter.ts');
    const { getNewsletterSubscriptionByEmail } = require('../data/newsletter');
    vi.mocked(getNewsletterSubscriptionByEmail).mockResolvedValue(null);

    await expect(unsubscribeFromNewsletterAction({})).rejects.toThrow('Newsletter subscription not found');
  });

  it('should throw error if Resend contact ID not found', async () => {
    const { unsubscribeFromNewsletterAction } = await import('./newsletter.ts');
    const { getNewsletterSubscriptionByEmail } = require('../data/newsletter');
    vi.mocked(getNewsletterSubscriptionByEmail).mockResolvedValue({
      ...mockSubscription,
      resend_contact_id: null,
    });

    await expect(unsubscribeFromNewsletterAction({})).rejects.toThrow('Resend contact ID not found. Please contact support.');
  });

  it('should throw error if Resend API update fails', async () => {
    const { unsubscribeFromNewsletterAction } = await import('./newsletter.ts');
    const { getResendClient } = require('../integrations/resend');
    vi.mocked(getResendClient).mockReturnValue({
      contacts: {
        update: vi.fn().mockResolvedValue({ data: null, error: { message: 'API error' } }),
      },
    });

    await expect(unsubscribeFromNewsletterAction({})).rejects.toThrow('API error');
  });
});
