import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { checkRateLimit, RATE_LIMIT_PRESETS, type RateLimitConfig } from './rate-limit.ts';

describe('checkRateLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic rate limiting', () => {
    it('should allow first request', () => {
      const request = new Request('https://example.com');
      const config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 };
      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('should allow requests within limit', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 };

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(request, config);
        expect(result.allowed).toBe(true);
      }

      // 6th request should still be allowed
      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(true);
      // After 6 requests: remaining = 10 - 6 = 4
      expect(result.remaining).toBe(4);
    });

    it('should reject requests exceeding limit', () => {
      const request = new Request('https://example.com');
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };

      // Make 5 requests (all allowed)
      for (let i = 0; i < 5; i++) {
        checkRateLimit(request, config);
      }

      // 6th request should be rejected
      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('time window behavior', () => {
    it('should reset after window expires', () => {
      const request = new Request('https://example.com');
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(request, config);
      }

      // Should be rejected
      let result = checkRateLimit(request, config);
      expect(result.allowed).toBe(false);

      // Advance time past window
      jest.advanceTimersByTime(61000);

      // Should be allowed again
      result = checkRateLimit(request, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should track remaining requests correctly', () => {
      // Use different IPs to avoid shared state between tests
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });
      const config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 };

      // First request: count = 1, remaining = 10 - 1 = 9
      const result1 = checkRateLimit(request, config);
      expect(result1.remaining).toBe(9);

      // Second request: count = 2, remaining = 10 - 2 = 8
      const result2 = checkRateLimit(request, config);
      expect(result2.remaining).toBe(8);

      // Third request: count = 3, remaining = 10 - 3 = 7
      const result3 = checkRateLimit(request, config);
      expect(result3.remaining).toBe(7);
    });
  });

  describe('identifier handling', () => {
    it('should use custom identifier when provided', () => {
      const request = new Request('https://example.com');
      const config: RateLimitConfig = {
        identifier: 'custom-id',
        maxRequests: 5,
        windowMs: 60000,
      };

      const result1 = checkRateLimit(request, config);
      expect(result1.allowed).toBe(true);

      // Same identifier should share limit
      const result2 = checkRateLimit(request, config);
      expect(result2.remaining).toBe(3);
    });

    it('should extract IP from x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.500',
        },
      });
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };

      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should extract IP from x-real-ip when x-forwarded-for not present', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '10.0.0.1',
        },
      });
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };

      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(true);
    });

    it('should use "unknown" when no IP headers present', () => {
      const request = new Request('https://example.com');
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };

      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(true);
    });

    it('should handle multiple IPs in x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.600, 10.0.0.1, 172.16.0.1',
        },
      });
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };

      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(true);
      // Should use first IP (192.168.1.600)
      expect(result.remaining).toBe(4);
    });
  });

  describe('cleanup behavior', () => {
    it('should cleanup expired entries', () => {
      const request1 = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const request2 = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 1000 };

      // Create entries for both IPs
      checkRateLimit(request1, config);
      checkRateLimit(request2, config);

      // Advance time past window
      jest.advanceTimersByTime(2000);

      // Cleanup should happen on next check
      checkRateLimit(request1, config);
      // Both should have fresh windows
      const result = checkRateLimit(request2, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('RATE_LIMIT_PRESETS', () => {
    it('should have expected presets', () => {
      expect(RATE_LIMIT_PRESETS.public).toEqual({ maxRequests: 100, windowMs: 60000 });
      expect(RATE_LIMIT_PRESETS.heavy).toEqual({ maxRequests: 30, windowMs: 60000 });
      expect(RATE_LIMIT_PRESETS.indexnow).toEqual({ maxRequests: 10, windowMs: 60000 });
      expect(RATE_LIMIT_PRESETS.status).toEqual({ maxRequests: 200, windowMs: 60000 });
      expect(RATE_LIMIT_PRESETS.email).toEqual({ maxRequests: 20, windowMs: 60000 });
      expect(RATE_LIMIT_PRESETS.transform).toEqual({ maxRequests: 50, windowMs: 60000 });
      expect(RATE_LIMIT_PRESETS.search).toEqual({ maxRequests: 120, windowMs: 60000 });
      expect(RATE_LIMIT_PRESETS.queueWorker).toEqual({ maxRequests: 60, windowMs: 60000 });
    });

    it('should have expected structure', () => {
      // RATE_LIMIT_PRESETS is defined with 'as const' which makes it readonly at compile time
      // Runtime immutability is not enforced, but TypeScript prevents mutations
      expect(RATE_LIMIT_PRESETS.public).toBeDefined();
      expect(RATE_LIMIT_PRESETS.public.maxRequests).toBe(100);
      expect(RATE_LIMIT_PRESETS.public.windowMs).toBe(60000);
    });

    it('should be usable with checkRateLimit', () => {
      // Use unique IP to avoid shared state from previous tests
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.200' },
      });
      const result = checkRateLimit(request, RATE_LIMIT_PRESETS.public);
      expect(result.allowed).toBe(true);
      // After first request: remaining = 100 - 1 = 99
      expect(result.remaining).toBe(99);
    });
  });

  describe('edge cases', () => {
    it('should handle maxRequests of 1', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.300' },
      });
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };

      const result1 = checkRateLimit(request, config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(0);

      const result2 = checkRateLimit(request, config);
      expect(result2.allowed).toBe(false);
      expect(result2.remaining).toBe(0);
    });

    it('should handle very short windows', () => {
      const request = new Request('https://example.com');
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 100 };

      checkRateLimit(request, config);
      jest.advanceTimersByTime(101);

      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should calculate retryAfter correctly', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.400' },
      });
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };

      // Exhaust limit
      checkRateLimit(request, config);
      checkRateLimit(request, config);

      // Should be rejected
      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });
  });
});
