import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NewsletterService } from './newsletter.ts';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Helper to create proper PostgrestError objects
function createPostgrestError(message: string, code: string): PostgrestError {
  return {
    message,
    code,
    details: '',
    hint: null,
    name: 'PostgrestError',
  };
}

// Helper to create proper mock responses
function createMockResponse<T>(data: T | null) {
  return {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK' as const,
  };
}

describe('NewsletterService', () => {
  let mockSupabase: SupabaseClient<Database>;
  let newsletterService: NewsletterService;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;

    newsletterService = new NewsletterService(mockSupabase);
  });

  describe('subscribeNewsletter', () => {
    it('should successfully subscribe with valid args', async () => {
      const mockData = { success: true, subscription_id: 'sub_123', was_resubscribed: false };
      const args = { 
        p_email: 'test@example.com',
        p_copy_category: 'agents' as const, 
        p_copy_slug: 'test-agent' 
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue(createMockResponse(mockData));

      const result = await newsletterService.subscribeNewsletter(args);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('subscribe_newsletter', args);
      expect(result).toEqual(mockData);
    });

    it('should handle duplicate subscription gracefully', async () => {
      const mockError = createPostgrestError('Email already subscribed', 'DUPLICATE');
      const args = { 
        p_email: 'test@example.com',
        p_copy_category: 'agents' as const 
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
        count: null,
        status: 409,
        statusText: 'Conflict',
      });

      await expect(newsletterService.subscribeNewsletter(args)).rejects.toThrow();
    });

    it('should handle RPC errors', async () => {
      const mockError = createPostgrestError('Invalid request', 'VALIDATION_ERROR');
      const args = { p_email: 'test@example.com' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
        count: null,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(newsletterService.subscribeNewsletter(args)).rejects.toThrow();
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
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error('Query timeout'));

      await expect(newsletterService.subscribeNewsletter({ p_email: 'test@example.com' })).rejects.toThrow('Query timeout');
    });
  });
});