import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter, TokenBucketRateLimiter, SlidingWindowRateLimiter } from './rate-limit.ts';

describe('TokenBucketRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('token consumption', () => {
    it('allows requests when tokens are available', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 10,
        refillRate: 1,
        refillInterval: 1000,
      });

      expect(limiter.tryConsume('user1', 1)).toBe(true);
      expect(limiter.tryConsume('user1', 1)).toBe(true);
      expect(limiter.tryConsume('user1', 1)).toBe(true);
    });

    it('rejects requests when bucket is empty', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 2,
        refillRate: 1,
        refillInterval: 1000,
      });

      expect(limiter.tryConsume('user1', 1)).toBe(true);
      expect(limiter.tryConsume('user1', 1)).toBe(true);
      expect(limiter.tryConsume('user1', 1)).toBe(false); // Bucket empty
    });

    it('refills tokens over time', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 5,
        refillRate: 2,
        refillInterval: 1000,
      });

      // Consume all tokens
      expect(limiter.tryConsume('user1', 5)).toBe(true);
      expect(limiter.tryConsume('user1', 1)).toBe(false);

      // Wait for refill
      vi.advanceTimersByTime(1000);

      // Should have 2 tokens now
      expect(limiter.tryConsume('user1', 2)).toBe(true);
      expect(limiter.tryConsume('user1', 1)).toBe(false);
    });

    it('does not exceed capacity when refilling', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 5,
        refillRate: 10, // Would add more than capacity
        refillInterval: 1000,
      });

      // Start with full bucket
      vi.advanceTimersByTime(2000);

      // Should only have capacity tokens, not more
      expect(limiter.tryConsume('user1', 5)).toBe(true);
      expect(limiter.tryConsume('user1', 1)).toBe(false);
    });
  });

  describe('per-key isolation', () => {
    it('maintains separate buckets for different keys', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 2,
        refillRate: 1,
        refillInterval: 1000,
      });

      // User1 consumes all tokens
      expect(limiter.tryConsume('user1', 2)).toBe(true);
      expect(limiter.tryConsume('user1', 1)).toBe(false);

      // User2 should still have tokens
      expect(limiter.tryConsume('user2', 2)).toBe(true);
      expect(limiter.tryConsume('user2', 1)).toBe(false);
    });

    it('handles many concurrent keys', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 1,
        refillRate: 1,
        refillInterval: 1000,
      });

      for (let i = 0; i < 100; i++) {
        expect(limiter.tryConsume(`user${i}`, 1)).toBe(true);
        expect(limiter.tryConsume(`user${i}`, 1)).toBe(false);
      }
    });
  });

  describe('variable token consumption', () => {
    it('supports consuming multiple tokens at once', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 10,
        refillRate: 1,
        refillInterval: 1000,
      });

      expect(limiter.tryConsume('user1', 5)).toBe(true);
      expect(limiter.tryConsume('user1', 5)).toBe(true);
      expect(limiter.tryConsume('user1', 1)).toBe(false);
    });

    it('rejects requests larger than capacity', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 5,
        refillRate: 1,
        refillInterval: 1000,
      });

      expect(limiter.tryConsume('user1', 10)).toBe(false);
    });
  });

  describe('burst handling', () => {
    it('allows bursts up to capacity', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 100,
        refillRate: 1,
        refillInterval: 1000,
      });

      // Burst of 100 requests should be allowed
      for (let i = 0; i < 100; i++) {
        expect(limiter.tryConsume('user1', 1)).toBe(true);
      }

      expect(limiter.tryConsume('user1', 1)).toBe(false);
    });
  });

  describe('getTokenCount', () => {
    it('returns current token count for key', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 10,
        refillRate: 1,
        refillInterval: 1000,
      });

      expect(limiter.getTokenCount('user1')).toBe(10);

      limiter.tryConsume('user1', 3);
      expect(limiter.getTokenCount('user1')).toBe(7);

      vi.advanceTimersByTime(1000);
      expect(limiter.getTokenCount('user1')).toBe(8);
    });

    it('returns capacity for new keys', () => {
      const limiter = new TokenBucketRateLimiter({
        capacity: 15,
        refillRate: 1,
        refillInterval: 1000,
      });

      expect(limiter.getTokenCount('new-user')).toBe(15);
    });
  });
});

describe('SlidingWindowRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('window-based limiting', () => {
    it('allows requests within window limit', () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 5,
        windowMs: 60000, // 1 minute
      });

      for (let i = 0; i < 5; i++) {
        expect(limiter.tryAcquire('user1')).toBe(true);
      }

      expect(limiter.tryAcquire('user1')).toBe(false);
    });

    it('resets count as window slides', () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 3,
        windowMs: 10000, // 10 seconds
      });

      // Make 3 requests at t=0
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(false);

      // Advance time by 10 seconds
      vi.advanceTimersByTime(10000);

      // Should be able to make 3 more requests
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(false);
    });

    it('handles partial window overlaps correctly', () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 3,
        windowMs: 10000,
      });

      // Request at t=0
      expect(limiter.tryAcquire('user1')).toBe(true);

      // Advance 5 seconds
      vi.advanceTimersByTime(5000);

      // 2 more requests at t=5000
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(false);

      // Advance another 5 seconds (t=10000)
      vi.advanceTimersByTime(5000);

      // First request should have expired, allowing 1 more
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(false);
    });
  });

  describe('per-key isolation', () => {
    it('maintains separate windows for different keys', () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 2,
        windowMs: 10000,
      });

      // User1 hits limit
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(false);

      // User2 should have independent limit
      expect(limiter.tryAcquire('user2')).toBe(true);
      expect(limiter.tryAcquire('user2')).toBe(true);
      expect(limiter.tryAcquire('user2')).toBe(false);
    });
  });

  describe('getRemainingRequests', () => {
    it('returns remaining request count', () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      expect(limiter.getRemainingRequests('user1')).toBe(5);

      limiter.tryAcquire('user1');
      expect(limiter.getRemainingRequests('user1')).toBe(4);

      limiter.tryAcquire('user1');
      limiter.tryAcquire('user1');
      expect(limiter.getRemainingRequests('user1')).toBe(2);
    });

    it('returns 0 when limit is reached', () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 2,
        windowMs: 60000,
      });

      limiter.tryAcquire('user1');
      limiter.tryAcquire('user1');
      
      expect(limiter.getRemainingRequests('user1')).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles very short windows', () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 10,
        windowMs: 100, // 100ms
      });

      for (let i = 0; i < 10; i++) {
        expect(limiter.tryAcquire('user1')).toBe(true);
      }

      expect(limiter.tryAcquire('user1')).toBe(false);

      vi.advanceTimersByTime(100);

      expect(limiter.tryAcquire('user1')).toBe(true);
    });

    it('handles limit of 1', () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      });

      expect(limiter.tryAcquire('user1')).toBe(true);
      expect(limiter.tryAcquire('user1')).toBe(false);

      vi.advanceTimersByTime(1000);

      expect(limiter.tryAcquire('user1')).toBe(true);
    });
  });
});