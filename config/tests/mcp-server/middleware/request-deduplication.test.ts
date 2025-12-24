/**
 * Tests for Request Deduplication Middleware
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  withRequestDeduplication,
  generateCacheKey,
  getCacheStats,
  clearCache,
  clearExpiredCache,
} from '@heyclaude/mcp-server/middleware/request-deduplication';

describe('Request Deduplication', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('generateCacheKey', () => {
    it('should generate cache key from tool name and input', () => {
      const key = generateCacheKey('testTool', { param: 'value' });
      expect(key).toContain('testTool');
      expect(key).toContain('value');
    });

    it('should generate consistent keys for same input', () => {
      const input = { param: 'value', other: 'data' };
      const key1 = generateCacheKey('testTool', input);
      const key2 = generateCacheKey('testTool', input);
      expect(key1).toBe(key2);
    });
  });

  describe('withRequestDeduplication', () => {
    it('should cache results and return cached value on duplicate calls', async () => {
      const handler = jest.fn().mockResolvedValue({ result: 'cached' });
      const wrapped = withRequestDeduplication('testTool', handler, { ttl: 5000 });

      // First call
      const result1 = await wrapped({ input: 'test' }, {});
      expect(handler).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ result: 'cached' });

      // Second call with same input should return cached value
      const result2 = await wrapped({ input: 'test' }, {});
      expect(handler).toHaveBeenCalledTimes(1); // Handler not called again
      expect(result2).toEqual({ result: 'cached' });
    });

    it('should call handler for different inputs', async () => {
      const handler = jest.fn().mockImplementation((input) => Promise.resolve({ input: input.input }));
      const wrapped = withRequestDeduplication('testTool', handler);

      await wrapped({ input: 'test1' }, {});
      await wrapped({ input: 'test2' }, {});

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should skip caching when disabled', async () => {
      const handler = jest.fn().mockResolvedValue({ result: 'data' });
      const wrapped = withRequestDeduplication('testTool', handler, { enabled: false });

      await wrapped({ input: 'test' }, {});
      await wrapped({ input: 'test' }, {});

      expect(handler).toHaveBeenCalledTimes(2); // Both calls executed
    });

    it('should use custom TTL', async () => {
      const handler = jest.fn().mockResolvedValue({ result: 'data' });
      const wrapped = withRequestDeduplication('testTool', handler, { ttl: 100 });

      // First call
      await wrapped({ input: 'test' }, {});
      expect(handler).toHaveBeenCalledTimes(1);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second call after expiration should call handler again
      await wrapped({ input: 'test' }, {});
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const handler = jest.fn().mockResolvedValue({ result: 'data' });
      const wrapped = withRequestDeduplication('testTool', handler);

      await wrapped({ input: 'test1' }, {});
      await wrapped({ input: 'test2' }, {});

      const stats = getCacheStats();
      expect(stats.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached entries', async () => {
      const handler = jest.fn().mockResolvedValue({ result: 'data' });
      const wrapped = withRequestDeduplication('testTool', handler);

      await wrapped({ input: 'test' }, {});
      expect(getCacheStats().size).toBeGreaterThan(0);

      clearCache();

      expect(getCacheStats().size).toBe(0);
      // Next call should execute handler again (cache cleared)
      await wrapped({ input: 'test' }, {});
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearExpiredCache', () => {
    it('should clear expired entries', async () => {
      const handler = jest.fn().mockResolvedValue({ result: 'data' });
      const wrapped = withRequestDeduplication('testTool', handler, { ttl: 100 });

      await wrapped({ input: 'test' }, {});
      expect(getCacheStats().size).toBeGreaterThan(0);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      clearExpiredCache();

      // Cache should be empty after clearing expired entries
      expect(getCacheStats().size).toBe(0);
    });
  });
});

