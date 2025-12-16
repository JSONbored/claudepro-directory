import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { NewsletterService } from './newsletter.ts';

// Mock the prisma singleton with Prismock
vi.mock('../prisma/client.ts', () => {
  const { setupPrismockMock } = require('../test-utils/prisma-mock.ts');
  return {
    prisma: setupPrismockMock(),
  };
});

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
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;
    
    // Reset Prismock data before each test
    prismock.reset();
    
    newsletterService = new NewsletterService();
  });

  describe('subscribeNewsletter', () => {
    it('should successfully subscribe with valid args', async () => {
      const mockData = { success: true, subscription_id: 'sub_123', was_resubscribed: false };
      const args = { 
        p_email: 'test@example.com',
        p_copy_category: 'agents' as const, 
        p_copy_slug: 'test-agent' 
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await newsletterService.subscribeNewsletter(args);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
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
        p_copy_category: 'agents' as const 
      };

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(newsletterService.subscribeNewsletter(args)).rejects.toThrow('Email already subscribed');
    });

    it('should handle RPC errors', async () => {
      const mockError = new Error('Invalid request');
      const args = { p_email: 'test@example.com' };

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(newsletterService.subscribeNewsletter(args)).rejects.toThrow('Invalid request');
    });
  });

  describe('getNewsletterSubscriberCount', () => {
    it('should return subscriber count', async () => {
      const mockData = [{ id: '1' }, { id: '2' }, { id: '3' }];

      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse(mockData));

      const result = await newsletterService.getNewsletterSubscriberCount();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_active_subscribers');
      expect(result).toBe(3);
    });

    it('should return 0 when no subscribers', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse([]));

      const result = await newsletterService.getNewsletterSubscriberCount();
      expect(result).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle database timeout', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(new Error('Query timeout'));

      await expect(newsletterService.subscribeNewsletter({ p_email: 'test@example.com' })).rejects.toThrow('Query timeout');
    });
  });
});