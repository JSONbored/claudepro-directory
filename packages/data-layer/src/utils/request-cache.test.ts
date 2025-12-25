/**
 * Request Cache Tests
 *
 * Comprehensive tests for request-scoped caching utilities:
 * - withRequestCache - Basic caching behavior
 * - withSmartCache - Mutation detection and caching
 * - Cache key generation
 * - Cache isolation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  withRequestCache,
  withSmartCache,
  getRequestCache,
  clearRequestCache,
} from './request-cache.ts';

describe('Request Cache', () => {
  beforeEach(() => {
    clearRequestCache();
  });

  afterEach(() => {
    clearRequestCache();
  });

  describe('withRequestCache', () => {
    it('should cache result on first call', async () => {
      const mockRpcCall = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });

      const result1 = await withRequestCache('get_item', mockRpcCall, { p_id: '123' });

      expect(mockRpcCall).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ id: '1', name: 'Test' });
    });

    it('should return cached result on second call with same args', async () => {
      const mockRpcCall = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });

      const result1 = await withRequestCache('get_item', mockRpcCall, { p_id: '123' });
      const result2 = await withRequestCache('get_item', mockRpcCall, { p_id: '123' });

      expect(mockRpcCall).toHaveBeenCalledTimes(1); // Only called once
      expect(result1).toEqual({ id: '1', name: 'Test' });
      expect(result2).toEqual({ id: '1', name: 'Test' });
    });

    it('should call RPC again with different args', async () => {
      const mockRpcCall = jest
        .fn()
        .mockResolvedValueOnce({ id: '1', name: 'Test 1' })
        .mockResolvedValueOnce({ id: '2', name: 'Test 2' });

      const result1 = await withRequestCache('get_item', mockRpcCall, { p_id: '123' });
      const result2 = await withRequestCache('get_item', mockRpcCall, { p_id: '456' });

      expect(mockRpcCall).toHaveBeenCalledTimes(2); // Called twice (different args)
      expect(result1).toEqual({ id: '1', name: 'Test 1' });
      expect(result2).toEqual({ id: '2', name: 'Test 2' });
    });

    it('should handle undefined args', async () => {
      const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

      const result1 = await withRequestCache('get_all_items', mockRpcCall, undefined);
      const result2 = await withRequestCache('get_all_items', mockRpcCall, undefined);

      expect(mockRpcCall).toHaveBeenCalledTimes(1); // Cached
      expect(result1).toEqual({ id: '1' });
      expect(result2).toEqual({ id: '1' });
    });

    it('should handle empty args object', async () => {
      const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

      const result1 = await withRequestCache('get_all_items', mockRpcCall, {});
      const result2 = await withRequestCache('get_all_items', mockRpcCall, {});

      expect(mockRpcCall).toHaveBeenCalledTimes(1); // Cached
      expect(result1).toEqual({ id: '1' });
      expect(result2).toEqual({ id: '1' });
    });

    it('should handle cache key with sorted object keys', async () => {
      const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

      // Same args, different key order
      await withRequestCache('get_item', mockRpcCall, { p_id: '123', p_category: 'agents' });
      await withRequestCache('get_item', mockRpcCall, { p_category: 'agents', p_id: '123' });

      expect(mockRpcCall).toHaveBeenCalledTimes(1); // Cached (keys sorted)
    });

    it('should handle errors and not cache them', async () => {
      const mockRpcCall = jest
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ id: '1' });

      await expect(withRequestCache('get_item', mockRpcCall, { p_id: '123' })).rejects.toThrow(
        'First error'
      );

      // Second call should retry (not cached)
      const result = await withRequestCache('get_item', mockRpcCall, { p_id: '123' });

      expect(mockRpcCall).toHaveBeenCalledTimes(2); // Called twice (error not cached)
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('withSmartCache', () => {
    describe('mutation detection', () => {
      it('should skip caching for insert operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        await withSmartCache('insert_item', 'insertItem', mockRpcCall, { p_name: 'Test' });
        await withSmartCache('insert_item', 'insertItem', mockRpcCall, { p_name: 'Test' });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for update operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        await withSmartCache('update_item', 'updateItem', mockRpcCall, { p_id: '123' });
        await withSmartCache('update_item', 'updateItem', mockRpcCall, { p_id: '123' });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for delete operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ success: true });

        await withSmartCache('delete_item', 'deleteItem', mockRpcCall, { p_id: '123' });
        await withSmartCache('delete_item', 'deleteItem', mockRpcCall, { p_id: '123' });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for upsert operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        await withSmartCache('upsert_item', 'upsertItem', mockRpcCall, { p_id: '123' });
        await withSmartCache('upsert_item', 'upsertItem', mockRpcCall, { p_id: '123' });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for create operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        await withSmartCache('create_item', 'createItem', mockRpcCall, { p_name: 'Test' });
        await withSmartCache('create_item', 'createItem', mockRpcCall, { p_name: 'Test' });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for remove operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ success: true });

        await withSmartCache('remove_item', 'removeItem', mockRpcCall, { p_id: '123' });
        await withSmartCache('remove_item', 'removeItem', mockRpcCall, { p_id: '123' });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for batch_insert operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ inserted_count: 5 });

        await withSmartCache('batch_insert_items', 'batchInsertItems', mockRpcCall, { items: [] });
        await withSmartCache('batch_insert_items', 'batchInsertItems', mockRpcCall, { items: [] });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for subscribe operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ success: true });

        await withSmartCache('subscribe_newsletter', 'subscribeNewsletter', mockRpcCall, {
          p_email: 'test@example.com',
        });
        await withSmartCache('subscribe_newsletter', 'subscribeNewsletter', mockRpcCall, {
          p_email: 'test@example.com',
        });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for sync operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        await withSmartCache('sync_changelog_entry', 'syncChangelogEntry', mockRpcCall, {
          p_slug: 'test',
        });
        await withSmartCache('sync_changelog_entry', 'syncChangelogEntry', mockRpcCall, {
          p_slug: 'test',
        });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for RPC names with _insert suffix', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        await withSmartCache('batch_insert_user_interactions', 'batchInsert', mockRpcCall, {});
        await withSmartCache('batch_insert_user_interactions', 'batchInsert', mockRpcCall, {});

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for RPC names with _update suffix', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        await withSmartCache('update_webhook_event_status', 'updateStatus', mockRpcCall, {});
        await withSmartCache('update_webhook_event_status', 'updateStatus', mockRpcCall, {});

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for RPC names with _delete suffix', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ success: true });

        await withSmartCache('delete_old_records', 'deleteOld', mockRpcCall, {});
        await withSmartCache('delete_old_records', 'deleteOld', mockRpcCall, {});

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for RPC names with _upsert suffix', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        await withSmartCache('upsert_notification', 'upsertNotification', mockRpcCall, {});
        await withSmartCache('upsert_notification', 'upsertNotification', mockRpcCall, {});

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });

      it('should skip caching for RPC names with _sync suffix', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        await withSmartCache('sync_changelog_entry', 'syncEntry', mockRpcCall, {});
        await withSmartCache('sync_changelog_entry', 'syncEntry', mockRpcCall, {});

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (mutation)
      });
    });

    describe('read-only operations', () => {
      it('should cache read-only operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });

        const result1 = await withSmartCache('get_item', 'getItem', mockRpcCall, { p_id: '123' });
        const result2 = await withSmartCache('get_item', 'getItem', mockRpcCall, { p_id: '123' });

        expect(mockRpcCall).toHaveBeenCalledTimes(1); // Cached
        expect(result1).toEqual({ id: '1', name: 'Test' });
        expect(result2).toEqual({ id: '1', name: 'Test' });
      });

      it('should cache list operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]);

        const result1 = await withSmartCache('get_content_list', 'getContentList', mockRpcCall, {
          p_category: 'agents',
        });
        const result2 = await withSmartCache('get_content_list', 'getContentList', mockRpcCall, {
          p_category: 'agents',
        });

        expect(mockRpcCall).toHaveBeenCalledTimes(1); // Cached
        expect(result1).toEqual([{ id: '1' }, { id: '2' }]);
        expect(result2).toEqual([{ id: '1' }, { id: '2' }]);
      });

      it('should cache search operations', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ results: [], total_count: 0 });

        const result1 = await withSmartCache('search_content', 'searchContent', mockRpcCall, {
          p_query: 'test',
        });
        const result2 = await withSmartCache('search_content', 'searchContent', mockRpcCall, {
          p_query: 'test',
        });

        expect(mockRpcCall).toHaveBeenCalledTimes(1); // Cached
        expect(result1).toEqual({ results: [], total_count: 0 });
        expect(result2).toEqual({ results: [], total_count: 0 });
      });
    });

    describe('method name detection', () => {
      it('should use methodName for mutation detection when provided', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        // RPC name doesn't indicate mutation, but methodName does
        await withSmartCache('get_item', 'updateItem', mockRpcCall, { p_id: '123' });
        await withSmartCache('get_item', 'updateItem', mockRpcCall, { p_id: '123' });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (methodName indicates mutation)
      });

      it('should fall back to rpcName for mutation detection', async () => {
        const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

        // methodName not provided, use rpcName
        await withSmartCache('insert_item', undefined as any, mockRpcCall, { p_name: 'Test' });
        await withSmartCache('insert_item', undefined as any, mockRpcCall, { p_name: 'Test' });

        expect(mockRpcCall).toHaveBeenCalledTimes(2); // Not cached (rpcName indicates mutation)
      });
    });
  });

  describe('cache management', () => {
    it('should clear cache with clearRequestCache', async () => {
      const mockRpcCall = jest
        .fn()
        .mockResolvedValueOnce({ id: '1' })
        .mockResolvedValueOnce({ id: '2' });

      await withRequestCache('get_item', mockRpcCall, { p_id: '123' });
      clearRequestCache();
      const result = await withRequestCache('get_item', mockRpcCall, { p_id: '123' });

      expect(mockRpcCall).toHaveBeenCalledTimes(2); // Called twice (cache cleared)
      expect(result).toEqual({ id: '2' });
    });

    it('should return cache stats', () => {
      const cache = getRequestCache();
      const stats = cache.getStats();

      expect(stats).toHaveProperty('size');
      expect(typeof stats.size).toBe('number');
    });

    it('should track cache size correctly', async () => {
      const cache = getRequestCache();
      const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

      expect(cache.getStats().size).toBe(0);

      await withRequestCache('get_item_1', mockRpcCall, { p_id: '123' });
      expect(cache.getStats().size).toBe(1);

      await withRequestCache('get_item_2', mockRpcCall, { p_id: '456' });
      expect(cache.getStats().size).toBe(2);

      // Same key should not increase size
      await withRequestCache('get_item_1', mockRpcCall, { p_id: '123' });
      expect(cache.getStats().size).toBe(2);
    });
  });

  describe('cache key generation', () => {
    it('should generate consistent keys for same args', async () => {
      const cache = getRequestCache();
      const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

      await withRequestCache('get_item', mockRpcCall, { p_id: '123', p_category: 'agents' });
      await withRequestCache('get_item', mockRpcCall, { p_category: 'agents', p_id: '123' });

      expect(mockRpcCall).toHaveBeenCalledTimes(1); // Same key (keys sorted)
    });

    it('should generate different keys for different RPC names', async () => {
      const mockRpcCall = jest
        .fn()
        .mockResolvedValueOnce({ id: '1' })
        .mockResolvedValueOnce({ id: '2' });

      await withRequestCache('get_item', mockRpcCall, { p_id: '123' });
      await withRequestCache('get_other_item', mockRpcCall, { p_id: '123' });

      expect(mockRpcCall).toHaveBeenCalledTimes(2); // Different keys
    });

    it('should handle undefined args in cache key', async () => {
      const mockRpcCall = jest.fn().mockResolvedValue({ id: '1' });

      await withRequestCache('get_all_items', mockRpcCall, undefined);
      await withRequestCache('get_all_items', mockRpcCall, undefined);

      expect(mockRpcCall).toHaveBeenCalledTimes(1); // Same key
    });
  });
});
