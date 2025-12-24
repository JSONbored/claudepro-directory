/**
 * Tests for KV Cache
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KvResourceCache, createKvCache, generateCacheKey } from '@heyclaude/mcp-server/cache/kv-cache';
import { createMockKvCache, createMockLogger } from '../fixtures/test-utils.js';

describe('KV Cache', () => {
  describe('generateCacheKey', () => {
    it('should generate cache key from URI', () => {
      const key = generateCacheKey('mcp://content/agents/test-slug');
      expect(key).toBe('mcp:resource:mcp://content/agents/test-slug');
    });

    it('should sanitize URI for cache key', () => {
      const key = generateCacheKey('mcp://content/agents/test-slug/with-special@chars!');
      expect(key).toContain('mcp:resource:');
      expect(key).not.toContain('@');
      expect(key).not.toContain('!');
    });
  });

  describe('KvResourceCache', () => {
    let mockKv: ReturnType<typeof createMockKvCache>;
    let cache: KvResourceCache;

    beforeEach(() => {
      mockKv = createMockKvCache();
      cache = new KvResourceCache({ kv: mockKv, ttl: 3600 });
    });

    it('should return null when cache is disabled', async () => {
      const disabledCache = new KvResourceCache({ kv: mockKv, enabled: false });
      const result = await disabledCache.get('test-uri');
      expect(result).toBeNull();
    });

    it('should return null when KV is not available', async () => {
      const noKvCache = new KvResourceCache({ kv: null });
      const result = await noKvCache.get('test-uri');
      expect(result).toBeNull();
    });

    it('should get cached entry when available', async () => {
      const testEntry = {
        text: 'test content',
        mimeType: 'text/plain',
        etag: '"abc123"',
        cachedAt: new Date().toISOString(),
        cacheVersion: 1,
      };
      mockKv.get.mockResolvedValue(JSON.stringify(testEntry));

      const result = await cache.get('test-uri');
      expect(result).toBeDefined();
      expect(result?.text).toBe('test content');
      expect(result?.mimeType).toBe('text/plain');
      expect(result?.etag).toBe('"abc123"');
    });

    it('should return null for expired entry', async () => {
      const expiredEntry = {
        text: 'test content',
        mimeType: 'text/plain',
        etag: '"abc123"',
        cachedAt: new Date(Date.now() - 4000 * 1000).toISOString(), // 4000 seconds ago
        cacheVersion: 1,
      };
      mockKv.get.mockResolvedValue(JSON.stringify(expiredEntry));

      const shortTtlCache = new KvResourceCache({ kv: mockKv, ttl: 3600 }); // 1 hour TTL
      const result = await shortTtlCache.get('test-uri');
      expect(result).toBeNull();
    });

    it('should invalidate cache on version mismatch', async () => {
      const oldEntry = {
        text: 'test content',
        mimeType: 'text/plain',
        etag: '"abc123"',
        cachedAt: new Date().toISOString(),
        cacheVersion: 0, // Old version
      };
      mockKv.get.mockResolvedValue(JSON.stringify(oldEntry));
      mockKv.delete.mockResolvedValue();

      const result = await cache.get('test-uri');
      expect(result).toBeNull();
      expect(mockKv.delete).toHaveBeenCalled();
    });

    it('should set cache entry', async () => {
      await cache.set('test-uri', 'test content', 'text/plain');

      expect(mockKv.put).toHaveBeenCalled();
      const callArgs = (mockKv.put as ReturnType<typeof jest.fn>).mock.calls[0];
      expect(callArgs[0]).toContain('test-uri');
      expect(callArgs[1]).toContain('test content');
    });

    it('should delete cache entry', async () => {
      await cache.delete('test-uri');
      expect(mockKv.delete).toHaveBeenCalled();
    });

    it('should get metadata without full content', async () => {
      const testEntry = {
        text: 'test content',
        mimeType: 'text/plain',
        etag: '"abc123"',
        cachedAt: new Date().toISOString(),
        cacheVersion: 1,
      };
      mockKv.get.mockResolvedValue(JSON.stringify(testEntry));

      const metadata = await cache.getMetadata('test-uri');
      expect(metadata).toBeDefined();
      expect(metadata?.etag).toBe('"abc123"');
      expect(metadata?.cachedAt).toBeDefined();
    });

    it('should check if cache is available', () => {
      expect(cache.isAvailable()).toBe(true);
      
      const noKvCache = new KvResourceCache({ kv: null });
      expect(noKvCache.isAvailable()).toBe(false);
      
      const disabledCache = new KvResourceCache({ kv: mockKv, enabled: false });
      expect(disabledCache.isAvailable()).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const logger = createMockLogger();
      const cacheWithLogger = new KvResourceCache({ kv: mockKv, logger });
      mockKv.get.mockRejectedValue(new Error('KV error'));

      const result = await cacheWithLogger.get('test-uri');
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should use custom TTL when provided', async () => {
      await cache.set('test-uri', 'test content', 'text/plain', 7200);

      const callArgs = (mockKv.put as ReturnType<typeof jest.fn>).mock.calls[0];
      expect(callArgs[2]).toEqual({ expirationTtl: 7200 });
    });
  });

  describe('createKvCache', () => {
    it('should create cache instance', () => {
      const mockKv = createMockKvCache();
      const cache = createKvCache(mockKv);
      expect(cache).toBeInstanceOf(KvResourceCache);
      expect(cache.isAvailable()).toBe(true);
    });

    it('should create cache with options', () => {
      const mockKv = createMockKvCache();
      const logger = createMockLogger();
      const cache = createKvCache(mockKv, { ttl: 7200, logger });
      expect(cache).toBeInstanceOf(KvResourceCache);
    });
  });
});

