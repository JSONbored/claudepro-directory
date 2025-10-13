/**
 * Copy Count Feature Test
 *
 * Verifies that copy count tracking and enrichment works correctly.
 * Tests the new getCopyCounts and enrichWithCopyCounts functions.
 */

import { describe, expect, it, vi } from 'vitest';
import { statsRedis } from '@/src/lib/redis';

// Mock Redis client
vi.mock('@/src/lib/redis/client', () => ({
  redisClient: {
    getStatus: () => ({ isConnected: true, isFallback: false }),
    executeOperation: async (fn: unknown) => {
      if (typeof fn === 'function') {
        // Mock Redis client with test data
        const mockClient = {
          get: async (key: string) => {
            if (key === 'copies:agents:test-agent') return 42;
            if (key === 'copies:mcp:test-mcp') return 67;
            return 0;
          },
          mget: async (...keys: string[]) => {
            return keys.map((key) => {
              if (key === 'copies:agents:test-agent') return 42;
              if (key === 'copies:mcp:test-mcp') return 67;
              return 0;
            });
          },
        };
        // @ts-expect-error - Mock client type
        return await fn(mockClient);
      }
      return null;
    },
  },
}));

describe('Copy Count Tracking', () => {
  describe('getCopyCount', () => {
    it('returns copy count for a single item', async () => {
      const count = await statsRedis.getCopyCount('agents', 'test-agent');
      expect(count).toBe(42);
    });

    it('returns 0 for items with no copies', async () => {
      const count = await statsRedis.getCopyCount('agents', 'unknown-item');
      expect(count).toBe(0);
    });
  });

  describe('getCopyCounts', () => {
    it('returns copy counts for multiple items', async () => {
      const items = [
        { category: 'agents', slug: 'test-agent' },
        { category: 'mcp', slug: 'test-mcp' },
      ];

      const counts = await statsRedis.getCopyCounts(items);

      expect(counts).toEqual({
        'agents:test-agent': 42,
        'mcp:test-mcp': 67,
      });
    });

    it('returns empty object for empty array', async () => {
      const counts = await statsRedis.getCopyCounts([]);
      expect(counts).toEqual({});
    });

    it('returns 0 for items with no copies', async () => {
      const items = [{ category: 'agents', slug: 'unknown-item' }];
      const counts = await statsRedis.getCopyCounts(items);
      expect(counts['agents:unknown-item']).toBe(0);
    });
  });

  describe('enrichWithCopyCounts', () => {
    it('enriches items with copy counts', async () => {
      const items = [
        { category: 'agents', slug: 'test-agent', title: 'Test Agent' },
        { category: 'mcp', slug: 'test-mcp', title: 'Test MCP' },
      ];

      const enriched = await statsRedis.enrichWithCopyCounts(items);

      expect(enriched).toHaveLength(2);
      expect(enriched[0]).toEqual({
        category: 'agents',
        slug: 'test-agent',
        title: 'Test Agent',
        copyCount: 42,
      });
      expect(enriched[1]).toEqual({
        category: 'mcp',
        slug: 'test-mcp',
        title: 'Test MCP',
        copyCount: 67,
      });
    });

    it('returns empty array for empty input', async () => {
      const enriched = await statsRedis.enrichWithCopyCounts([]);
      expect(enriched).toEqual([]);
    });

    it('adds copyCount: 0 for items with no copies', async () => {
      const items = [{ category: 'agents', slug: 'unknown-item', title: 'Unknown' }];
      const enriched = await statsRedis.enrichWithCopyCounts(items);
      expect(enriched[0]?.copyCount).toBe(0);
    });
  });

  describe('enrichWithAllCounts', () => {
    it('enriches items with both view and copy counts in parallel', async () => {
      const items = [
        { category: 'agents', slug: 'test-agent', title: 'Test Agent' },
        { category: 'mcp', slug: 'test-mcp', title: 'Test MCP' },
      ];

      const enriched = await statsRedis.enrichWithAllCounts(items);

      expect(enriched).toHaveLength(2);
      expect(enriched[0]).toHaveProperty('viewCount');
      expect(enriched[0]).toHaveProperty('copyCount');
      expect(enriched[1]).toHaveProperty('viewCount');
      expect(enriched[1]).toHaveProperty('copyCount');
    });

    it('returns empty array for empty input', async () => {
      const enriched = await statsRedis.enrichWithAllCounts([]);
      expect(enriched).toEqual([]);
    });
  });
});
