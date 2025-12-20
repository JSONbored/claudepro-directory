import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NewsletterService } from './newsletter.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockClient

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Mock request cache
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

describe('NewsletterService', () => {
  let newsletterService: NewsletterService;
  let prismock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;

  /**
   * Helper to safely mock Prismock model methods
   */
  function mockPrismockMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismock model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = vi.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    prismock = prisma;

    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }

    // Prismock doesn't support $queryRawUnsafe, so we add it as a mock function
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismock models are initialized
    void prismock.newsletter_subscriptions;

    newsletterService = new NewsletterService();
  });

  describe('subscribeNewsletter', () => {
    it('should successfully subscribe with valid args', async () => {
      const mockData = { success: true, subscription_id: 'sub_123', was_resubscribed: false };
      const args = {
        p_email: 'test@example.com',
        p_copy_category: 'agents' as const,
        p_copy_slug: 'test-agent',
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await newsletterService.subscribeNewsletter(args);

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('subscribe_newsletter'),
        'test@example.com',
        'agents',
        'test-agent'
      );
      expect(result).toEqual(mockData);
    });

    it('should handle duplicate subscription gracefully', async () => {
      const mockError = new Error('Email already subscribed');
      const args = {
        p_email: 'test@example.com',
        p_copy_category: 'agents' as const,
      };

      queryRawUnsafeSpy.mockRejectedValue(mockError);

      await expect(newsletterService.subscribeNewsletter(args)).rejects.toThrow(
        'Email already subscribed'
      );
    });

    it('should handle RPC errors', async () => {
      const mockError = new Error('Invalid request');
      const args = { p_email: 'test@example.com' };

      queryRawUnsafeSpy.mockRejectedValue(mockError);

      await expect(newsletterService.subscribeNewsletter(args)).rejects.toThrow('Invalid request');
    });
  });

  describe('getNewsletterSubscriberCount', () => {
    it('should return subscriber count', async () => {
      mockPrismockMethod(prismock.newsletter_subscriptions, 'count', 42);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await newsletterService.getNewsletterSubscriberCount();

      expect(prismock.newsletter_subscriptions.count).toHaveBeenCalledWith({
        where: {
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
        },
      });
      expect(result).toBe(42);
    });

    it('should return 0 when no subscribers', async () => {
      mockPrismockMethod(prismock.newsletter_subscriptions, 'count', 0);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await newsletterService.getNewsletterSubscriberCount();
      expect(result).toBe(0);
    });
  });

  describe('getActiveSubscribers', () => {
    it('should return array of active subscriber emails', async () => {
      const mockSubscribers = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
        { email: 'user3@example.com' },
      ];

      mockPrismockMethod(prismock.newsletter_subscriptions, 'findMany', mockSubscribers);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await newsletterService.getActiveSubscribers();

      expect(prismock.newsletter_subscriptions.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
        },
        select: { email: true },
        orderBy: { subscribed_at: 'desc' },
      });
      expect(result).toEqual(['user1@example.com', 'user2@example.com', 'user3@example.com']);
    });
  });

  describe('getSubscriptionById', () => {
    it('should return subscription by ID', async () => {
      const mockSubscription = {
        id: 'sub-123',
        email: 'test@example.com',
        status: 'active',
      };

      mockPrismockMethod(prismock.newsletter_subscriptions, 'findUnique', mockSubscription);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await newsletterService.getSubscriptionById('sub-123');

      expect(prismock.newsletter_subscriptions.findUnique).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should return null for non-existent subscription', async () => {
      mockPrismockMethod(prismock.newsletter_subscriptions, 'findUnique', null);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await newsletterService.getSubscriptionById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getSubscriptionStatusByEmail', () => {
    it('should return subscription status by email', async () => {
      const mockSubscription = { status: 'active' };

      mockPrismockMethod(prismock.newsletter_subscriptions, 'findUnique', mockSubscription);

      const result = await newsletterService.getSubscriptionStatusByEmail('test@example.com');

      expect(prismock.newsletter_subscriptions.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { status: true },
      });
      expect(result).toEqual({ status: 'active' });
    });

    it('should return null for non-existent email', async () => {
      mockPrismockMethod(prismock.newsletter_subscriptions, 'findUnique', null);

      const result =
        await newsletterService.getSubscriptionStatusByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('getSubscriptionEngagementScore', () => {
    it('should return engagement score by email', async () => {
      const mockSubscription = { engagement_score: 0.85 };

      mockPrismockMethod(prismock.newsletter_subscriptions, 'findUnique', mockSubscription);

      const result = await newsletterService.getSubscriptionEngagementScore('test@example.com');

      expect(prismock.newsletter_subscriptions.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { engagement_score: true },
      });
      expect(result).toEqual({ engagement_score: 0.85 });
    });
  });

  describe('updateLastEmailSentAt', () => {
    it('should update last email sent timestamp', async () => {
      mockPrismockMethod(prismock.newsletter_subscriptions, 'update', {});

      await newsletterService.updateLastEmailSentAt('test@example.com');

      expect(prismock.newsletter_subscriptions.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          last_email_sent_at: expect.any(Date),
          updated_at: expect.any(Date),
        },
      });
    });

    it('should log errors on update failure', async () => {
      const { logRpcError } = await import('../utils/rpc-error-logging.ts');
      const mockError = new Error('Update failed');

      mockPrismockMethod(prismock.newsletter_subscriptions, 'update', Promise.reject(mockError));

      await expect(newsletterService.updateLastEmailSentAt('test@example.com')).rejects.toThrow(
        'Update failed'
      );

      expect(logRpcError).toHaveBeenCalledWith(mockError, {
        rpcName: 'newsletter_subscriptions.update',
        operation: 'NewsletterService.updateLastEmailSentAt',
        args: { email: 'test@example.com' },
      });
    });
  });

  describe('updateLastActiveAt', () => {
    it('should update last active timestamp', async () => {
      mockPrismockMethod(prismock.newsletter_subscriptions, 'update', {});

      await newsletterService.updateLastActiveAt('test@example.com');

      expect(prismock.newsletter_subscriptions.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          last_active_at: expect.any(Date),
          updated_at: expect.any(Date),
        },
      });
    });
  });

  describe('updateSubscriptionStatus', () => {
    it('should update subscription status', async () => {
      mockPrismockMethod(prismock.newsletter_subscriptions, 'update', {});

      await newsletterService.updateSubscriptionStatus('test@example.com', 'unsubscribed');

      expect(prismock.newsletter_subscriptions.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          status: 'unsubscribed',
        },
      });
    });
  });

  describe('updateEngagementScore', () => {
    it('should update engagement score', async () => {
      mockPrismockMethod(prismock.newsletter_subscriptions, 'update', {});

      await newsletterService.updateEngagementScore('test@example.com', 0.9);

      expect(prismock.newsletter_subscriptions.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          engagement_score: 0.9,
          updated_at: expect.any(Date),
        },
      });
    });
  });

  describe('unsubscribeWithTimestamp', () => {
    it('should unsubscribe and update timestamp', async () => {
      mockPrismockMethod(prismock.newsletter_subscriptions, 'update', {});

      await newsletterService.unsubscribeWithTimestamp('test@example.com');

      expect(prismock.newsletter_subscriptions.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: {
          status: 'unsubscribed',
          unsubscribed_at: expect.any(Date),
          updated_at: expect.any(Date),
        },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle database timeout', async () => {
      queryRawUnsafeSpy.mockRejectedValue(new Error('Query timeout'));

      await expect(
        newsletterService.subscribeNewsletter({ p_email: 'test@example.com' })
      ).rejects.toThrow('Query timeout');
    });
  });
});
