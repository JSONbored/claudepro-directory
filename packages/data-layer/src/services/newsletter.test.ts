import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NewsletterService } from './newsletter.ts';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('NewsletterService', () => {
  let mockSupabase: SupabaseClient<Database>;
  let newsletterService: NewsletterService;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;

    newsletterService = new NewsletterService(mockSupabase);
  });

  describe('subscribeToNewsletter', () => {
    it('should successfully subscribe with valid email', async () => {
      const mockData = { success: true, subscriber_id: 'sub_123' };
      const email = 'test@example.com';

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await newsletterService.subscribeToNewsletter(email);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('subscribe_to_newsletter', { 
        p_email: email 
      });
      expect(result).toEqual(mockData);
    });

    it('should handle duplicate subscription gracefully', async () => {
      const mockError = {
        message: 'Email already subscribed',
        code: 'DUPLICATE',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(newsletterService.subscribeToNewsletter('test@example.com'))
        .rejects.toThrow();
    });

    it('should reject invalid email format', async () => {
      const mockError = {
        message: 'Invalid email format',
        code: 'VALIDATION_ERROR',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(newsletterService.subscribeToNewsletter('invalid-email'))
        .rejects.toThrow();
    });
  });

  describe('unsubscribeFromNewsletter', () => {
    it('should unsubscribe successfully', async () => {
      const mockData = { success: true };
      const email = 'test@example.com';

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await newsletterService.unsubscribeFromNewsletter(email);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('unsubscribe_from_newsletter', {
        p_email: email,
      });
      expect(result).toEqual(mockData);
    });

    it('should handle non-existent subscription', async () => {
      const mockError = {
        message: 'Subscription not found',
        code: 'NOT_FOUND',
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(newsletterService.unsubscribeFromNewsletter('nonexistent@example.com'))
        .rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty email string', async () => {
      const mockError = { message: 'Email required', code: 'REQUIRED' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(newsletterService.subscribeToNewsletter('')).rejects.toThrow();
    });

    it('should handle database timeout', async () => {
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error('Query timeout'));

      await expect(newsletterService.subscribeToNewsletter('test@example.com'))
        .rejects.toThrow('Query timeout');
    });
  });
});