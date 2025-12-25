/**
 * Tests for Rate Limiting Middleware
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  checkRateLimit,
  addRateLimitHeaders,
  createRateLimitErrorResponse,
  type RateLimitResult,
  type RateLimitConfig,
} from '@heyclaude/mcp-server/middleware/rate-limit';

describe('Rate Limiting Middleware', () => {
  describe('checkRateLimit', () => {
    it('should return permissive result when rate limit binding is not configured', async () => {
      const env = {} as any;
      const result = await checkRateLimit(env, 'MCP_RATE_LIMIT', 'user-123');

      expect(result.success).toBe(true);
      expect(result.limit).toBe(0);
      expect(result.remaining).toBe(999999);
      expect(result.reset).toBeGreaterThan(0);
    });

    it('should check rate limit when binding is configured', async () => {
      const mockRateLimitBinding = {
        limit: jest.fn().mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Math.floor(Date.now() / 1000) + 60,
        }),
      };

      const env = {
        MCP_RATE_LIMIT: mockRateLimitBinding,
      } as any;

      const result = await checkRateLimit(env, 'MCP_RATE_LIMIT', 'user-123');

      expect(result.success).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(99);
      expect(mockRateLimitBinding.limit).toHaveBeenCalledWith({ key: 'user-123' });
    });

    it('should handle rate limit exceeded', async () => {
      const mockRateLimitBinding = {
        limit: jest.fn().mockResolvedValue({
          success: false,
          limit: 100,
          remaining: 0,
          reset: Math.floor(Date.now() / 1000) + 60,
        }),
      };

      const env = {
        MCP_RATE_LIMIT: mockRateLimitBinding,
      } as any;

      const result = await checkRateLimit(env, 'MCP_RATE_LIMIT', 'user-123');

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', () => {
      const response = new Response('OK', { status: 200 });
      const rateLimitResult: RateLimitResult = {
        success: true,
        limit: 100,
        remaining: 50,
        reset: Math.floor(Date.now() / 1000) + 60,
      };
      const config: RateLimitConfig = {
        limit: 100,
        period: 60,
      };

      addRateLimitHeaders(response, rateLimitResult, config);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('50');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('createRateLimitErrorResponse', () => {
    it('should create rate limit error response', () => {
      const rateLimitResult: RateLimitResult = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
      };
      const config: RateLimitConfig = {
        limit: 100,
        period: 60,
      };

      const response = createRateLimitErrorResponse(rateLimitResult, config);

      expect(response.status).toBe(429);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBeDefined();

      // Check response body
      return response.json().then((body) => {
        expect(body.error).toBe('Too Many Requests');
        expect(body.message).toBeDefined();
        expect(body.retryAfter).toBeDefined();
      });
    });
  });
});
