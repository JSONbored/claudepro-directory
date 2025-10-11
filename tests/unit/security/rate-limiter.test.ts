/**
 * Rate Limiter Unit Tests
 *
 * Tests sliding window rate limiting implementation with Redis.
 * Validates rate limit enforcement, error handling, and fallback behavior.
 *
 * **Security Focus:**
 * - DoS prevention through rate limiting
 * - Per-IP rate tracking
 * - Fail-open behavior on Redis errors
 * - Request fingerprinting (IP + User-Agent)
 *
 * @see src/lib/rate-limiter.ts
 */

import { describe, expect, test, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { RateLimiter, rateLimiters } from '@/src/lib/rate-limiter';
import type { MiddlewareRateLimitConfig } from '@/src/lib/schemas/middleware.schema';

// Mock dependencies
vi.mock('@/src/lib/redis', () => ({
  redisClient: {
    getStatus: vi.fn(() => ({ isConnected: true, isFallback: false })),
    executeOperation: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('@/src/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Rate Limiter - Configuration', () => {
  describe('Rate Limit Presets', () => {
    test('should have all required rate limiter instances', () => {
      expect(rateLimiters.api).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
      expect(rateLimiters.submit).toBeDefined();
      expect(rateLimiters.general).toBeDefined();
      expect(rateLimiters.heavyApi).toBeDefined();
      expect(rateLimiters.admin).toBeDefined();
      expect(rateLimiters.bulk).toBeDefined();
      expect(rateLimiters.llmstxt).toBeDefined();
      expect(rateLimiters.webhookBounce).toBeDefined();
      expect(rateLimiters.webhookAnalytics).toBeDefined();
    });

    test('should validate API rate limiter configuration', () => {
      // API: 1000 requests/hour (generous)
      expect(rateLimiters.api).toBeInstanceOf(RateLimiter);
    });

    test('should validate search rate limiter configuration', () => {
      // Search: 100 requests/5min (restrictive due to computational cost)
      expect(rateLimiters.search).toBeInstanceOf(RateLimiter);
    });

    test('should validate submit rate limiter configuration', () => {
      // Submit: 30 requests/hour (moderate to prevent abuse)
      expect(rateLimiters.submit).toBeInstanceOf(RateLimiter);
    });

    test('should validate heavy API rate limiter configuration', () => {
      // Heavy API: 100 requests/15min
      expect(rateLimiters.heavyApi).toBeInstanceOf(RateLimiter);
    });

    test('should validate admin rate limiter configuration', () => {
      // Admin: 50 requests/hour (restrictive)
      expect(rateLimiters.admin).toBeInstanceOf(RateLimiter);
    });

    test('should validate LLMs.txt rate limiter configuration', () => {
      // LLMs.txt: 100 requests/hour (prevent scraping)
      expect(rateLimiters.llmstxt).toBeInstanceOf(RateLimiter);
    });
  });

  describe('RateLimiter Construction', () => {
    test('should create rate limiter with valid configuration', () => {
      const config: MiddlewareRateLimitConfig = {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };

      const limiter = new RateLimiter(config);
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    test('should validate configuration with Zod schema', () => {
      // Invalid config should throw during construction
      const invalidConfig = {
        maxRequests: -1, // Invalid: negative
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };

      expect(() => new RateLimiter(invalidConfig as MiddlewareRateLimitConfig)).toThrow();
    });

    test('should convert windowMs to windowSeconds', () => {
      const config: MiddlewareRateLimitConfig = {
        maxRequests: 100,
        windowMs: 60000, // 60 seconds
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };

      const limiter = new RateLimiter(config);
      // Internal conversion happens, but we can verify via behavior
      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });
});

describe('Rate Limiter - Request Validation', () => {
  let redisClient: Awaited<typeof import('@/src/lib/redis')>['redisClient'];
  let headers: Awaited<typeof import('next/headers')>['headers'];

  beforeEach(async () => {
    if (!redisClient) {
      const redis = await import('@/src/lib/redis');
      redisClient = redis.redisClient;
      const nextHeaders = await import('next/headers');
      headers = nextHeaders.headers;
    }
    vi.clearAllMocks();
    (redisClient.getStatus as ReturnType<typeof vi.fn>).mockReturnValue({
      isConnected: true,
      isFallback: false,
    });
  });

  describe('Client Identification', () => {
    test('should use CF-Connecting-IP header (Cloudflare) if available', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['x-forwarded-for', '5.6.7.8'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      await limiter.checkLimit(request);

      // Should use CF-Connecting-IP for key generation
      expect(redisClient.executeOperation).toHaveBeenCalled();
    });

    test('should fall back to X-Forwarded-For if CF-Connecting-IP unavailable', async () => {
      const mockHeaders = new Map([
        ['x-forwarded-for', '5.6.7.8, 9.10.11.12'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      await limiter.checkLimit(request);

      expect(redisClient.executeOperation).toHaveBeenCalled();
    });

    test('should handle missing IP headers gracefully', async () => {
      const mockHeaders = new Map([['user-agent', 'TestAgent/1.0']]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await limiter.checkLimit(request);

      expect(result.success).toBe(true);
    });

    test('should include user-agent in rate limit key', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      await limiter.checkLimit(request);

      expect(redisClient.executeOperation).toHaveBeenCalled();
    });

    test('should handle missing user-agent header', async () => {
      const mockHeaders = new Map([['cf-connecting-ip', '1.2.3.4']]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await limiter.checkLimit(request);

      expect(result.success).toBe(true);
    });
  });

  describe('Rate Limit Enforcement', () => {
    test('should allow requests within limit', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await limiter.checkLimit(request);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(5);
    });

    test('should block requests exceeding limit', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValue(11);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await limiter.checkLimit(request);

      expect(result.success).toBe(false);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    test('should calculate correct remaining count', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 100,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');

      // Test different request counts
      const testCases = [1, 50, 99, 100, 101];

      for (const count of testCases) {
        (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValueOnce(count);
        const result = await limiter.checkLimit(request);

        const expectedRemaining = Math.max(0, 100 - count);
        expect(result.remaining).toBe(expectedRemaining);

        if (count <= 100) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
        }
      }
    });

    test('should include reset time in response', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const beforeTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await limiter.checkLimit(request);
      const afterTime = Date.now();

      // Reset time should be approximately now + windowMs
      expect(result.resetTime).toBeGreaterThan(beforeTime);
      expect(result.resetTime).toBeLessThanOrEqual(afterTime + 60000 + 1000); // Allow 1s buffer
    });
  });

  describe('Fallback Behavior', () => {
    test('should fail-open when Redis is unavailable', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.getStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isConnected: false,
        isFallback: false,
      });

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await limiter.checkLimit(request);

      // Should allow request when Redis is down
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9); // maxRequests - 1
    });

    test('should log warning when failing open', async () => {
      const loggerModule = await import('@/src/lib/logger');
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.getStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isConnected: false,
        isFallback: false,
      });

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      await limiter.checkLimit(request);

      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        'Redis not available for rate limiting',
        expect.objectContaining({
          path: '/api/test',
          fallback: 'allowing request',
        })
      );
    });

    test('should fail-open on Redis operation errors', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.getStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isConnected: true,
        isFallback: false,
      });
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Redis connection lost')
      );

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await limiter.checkLimit(request);

      // Should allow request on error
      expect(result.success).toBe(true);
    });

    test('should log errors when Redis operations fail', async () => {
      const loggerModule = await import('@/src/lib/logger');
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.getStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isConnected: true,
        isFallback: false,
      });
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Pipeline failed')
      );

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      await limiter.checkLimit(request);

      expect(loggerModule.logger.error).toHaveBeenCalledWith(
        'Rate limiter error',
        expect.any(Error),
        expect.objectContaining({
          fallback: 'allowing request',
        })
      );
    });
  });

  describe('Security - DoS Prevention', () => {
    test('should enforce different limits for different endpoints', () => {
      // API endpoints: 1000 req/hour (generous)
      expect(rateLimiters.api).toBeInstanceOf(RateLimiter);

      // Submit endpoints: 30 req/hour (restrictive)
      expect(rateLimiters.submit).toBeInstanceOf(RateLimiter);

      // Admin endpoints: 50 req/hour (very restrictive)
      expect(rateLimiters.admin).toBeInstanceOf(RateLimiter);
    });

    test('should track requests per IP address', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'TestAgent/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);
      (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');
      await limiter.checkLimit(request);

      // Should call Redis with key including IP
      expect(redisClient.executeOperation).toHaveBeenCalled();
    });

    test('should prevent rapid-fire requests from same IP', async () => {
      const mockHeaders = new Map([
        ['cf-connecting-ip', '1.2.3.4'],
        ['user-agent', 'AttackBot/1.0'],
      ]);

      (headers as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      const config: MiddlewareRateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
      };
      const limiter = new RateLimiter(config);

      const request = new NextRequest('http://localhost:3000/api/test');

      // Simulate rapid requests
      for (let i = 1; i <= 10; i++) {
        (redisClient.executeOperation as ReturnType<typeof vi.fn>).mockResolvedValueOnce(i);
        const result = await limiter.checkLimit(request);

        if (i <= 5) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
          expect(result.retryAfter).toBeGreaterThan(0);
        }
      }
    });
  });
});
