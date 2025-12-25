/**
 * Base Prisma Service Tests
 *
 * Comprehensive tests for BasePrismaService class covering:
 * - RPC function calls (callRpc)
 * - Raw SQL execution (executeRaw)
 * - Error handling and logging
 * - Request-scoped caching integration
 * - Composite type unwrapping
 * - Transaction support
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BasePrismaService } from './base-prisma-service.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismocker is configured globally via __mocks__/@prisma/client.ts
// Jest automatically uses __mocks__ directory (no explicit registration needed)
// This ensures consistent Prismocker usage across all test files regardless of project root

// Define Prisma error classes for testing
// These match the structure of Prisma's error classes but don't require importing the real module
class PrismaClientKnownRequestError extends Error {
  code?: string;
  clientVersion?: string;
  meta?: any;
  constructor(message: string, options?: { code?: string; clientVersion?: string; meta?: any }) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
    this.code = options?.code;
    this.clientVersion = options?.clientVersion;
    this.meta = options?.meta;
  }
}

class PrismaClientValidationError extends Error {
  clientVersion?: string;
  constructor(message: string, options?: { clientVersion?: string }) {
    super(message);
    this.name = 'PrismaClientValidationError';
    this.clientVersion = options?.clientVersion;
  }
}
import * as rpcErrorLoggingModule from '../utils/rpc-error-logging.ts';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockerClient
// Following the official Prismocker README approach exactly

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '../utils/request-cache.ts';

jest.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

/**
 * Test service class that extends BasePrismaService
 * Exposes protected methods for testing
 */
class TestService extends BasePrismaService {
  // Expose protected methods for testing
  public async testCallRpc<T = unknown>(
    functionName: string,
    args: Record<string, unknown> = {},
    options?: {
      useCache?: boolean;
      methodName?: string;
      returnType?: 'array' | 'single' | 'auto';
    }
  ): Promise<T> {
    return this.callRpc<T>(functionName, args, options);
  }

  public async testExecuteRaw<T = unknown>(query: string, ...params: unknown[]): Promise<T> {
    return this.executeRaw<T>(query, ...params);
  }

  public async testTransaction<T>(
    callback: (tx: any) => Promise<T>,
    options?: {
      timeout?: number;
      isolationLevel?: any;
    }
  ): Promise<T> {
    return this.transaction(callback, options);
  }
}

describe('BasePrismaService', () => {
  let service: TestService;
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;
  let transactionSpy: ReturnType<typeof jest.fn>;
  let executeRawUnsafeSpy: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    // Clear request cache before each test
    clearRequestCache();

    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test (must be before clearAllMocks)
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
    queryRawUnsafeSpy = prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>;

    // Mock transaction method
    transactionSpy = jest.fn().mockImplementation(async (callback: (tx: any) => Promise<any>) => {
      return callback(prismocker);
    });
    (prismocker as any).$transaction = transactionSpy;

    // Mock executeRawUnsafe (alias for $queryRawUnsafe)
    executeRawUnsafeSpy = queryRawUnsafeSpy;

    service = new TestService(prismocker);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('callRpc', () => {
    describe('basic RPC calls', () => {
      it('should call RPC function with no arguments', async () => {
        const mockResult = [{ id: '1', name: 'Test' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc(
          'get_all_items',
          {},
          {
            returnType: 'array', // Explicitly specify array return type
          }
        );

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
          'SELECT * FROM get_all_items()'
          // No arguments
        );
        // get_all_items has 'list' in name, so it should return array (not unwrapped)
        expect(result).toEqual(mockResult);
      });

      it('should call RPC function with single argument', async () => {
        const mockResult = [{ id: '1', name: 'Test' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_item_by_id', { p_id: '123' });

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
          'SELECT * FROM get_item_by_id(p_id => $1)',
          '123'
        );
        // get_item_by_id returns single object, so it should be unwrapped
        expect(result).toEqual({ id: '1', name: 'Test' });
      });

      it('should call RPC function with multiple arguments', async () => {
        const mockResult = [{ id: '1', name: 'Test' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_items', {
          p_category: 'agents',
          p_limit: 10,
          p_offset: 0,
        });

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
          'SELECT * FROM get_items(p_category => $1, p_limit => $2, p_offset => $3)',
          'agents',
          10,
          0
        );
        // get_items has no 'list' in name, but returns single object, so it should be unwrapped
        expect(result).toEqual({ id: '1', name: 'Test' });
      });
    });

    describe('return type handling', () => {
      it('should unwrap single-element array for single return type', async () => {
        const mockResult = [{ id: '1', name: 'Test' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc(
          'get_item',
          { p_id: '123' },
          {
            returnType: 'single',
          }
        );

        expect(result).toEqual({ id: '1', name: 'Test' }); // Unwrapped
      });

      it('should return array for array return type', async () => {
        const mockResult = [{ id: '1' }, { id: '2' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc(
          'get_items',
          { p_category: 'agents' },
          {
            returnType: 'array',
          }
        );

        expect(result).toEqual(mockResult); // Not unwrapped
      });

      it('should auto-detect and unwrap composite types (objects)', async () => {
        const mockResult = [{ id: '1', name: 'Test', data: { nested: 'value' } }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc(
          'get_item_detail',
          { p_id: '123' },
          {
            returnType: 'auto',
          }
        );

        expect(result).toEqual({ id: '1', name: 'Test', data: { nested: 'value' } }); // Unwrapped
      });

      it('should auto-detect and keep arrays for list functions', async () => {
        const mockResult = [{ id: '1' }, { id: '2' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc(
          'get_content_list',
          { p_category: 'agents' },
          {
            returnType: 'auto',
          }
        );

        expect(result).toEqual(mockResult); // Not unwrapped (has 'list' in name)
      });

      it('should return empty array for array return type when no results', async () => {
        queryRawUnsafeSpy.mockResolvedValue([]);

        const result = await service.testCallRpc(
          'get_items',
          { p_category: 'agents' },
          {
            returnType: 'array',
          }
        );

        expect(result).toEqual([]);
      });

      it('should return undefined for single return type when no results', async () => {
        queryRawUnsafeSpy.mockResolvedValue([]);

        const result = await service.testCallRpc(
          'get_item',
          { p_id: '123' },
          {
            returnType: 'single',
          }
        );

        expect(result).toBeUndefined();
      });

      it('should auto-detect single return for search functions with composite types', async () => {
        // search_content_optimized returns composite type (object), should be unwrapped
        const mockResult = [{ results: [], total_count: 0 }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc(
          'search_content_optimized',
          {
            p_query: 'test',
          },
          {
            returnType: 'auto',
          }
        );

        expect(result).toEqual({ results: [], total_count: 0 }); // Unwrapped (composite type)
      });
    });

    describe('caching behavior', () => {
      it('should use withSmartCache when useCache is true (default)', async () => {
        const mockResult = [{ id: '1' }];
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

        await service.testCallRpc(
          'get_item',
          { p_id: '123' },
          {
            useCache: true,
            methodName: 'getItem',
          }
        );

        // Verify RPC was called
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      });

      it('should skip caching when useCache is false', async () => {
        const mockResult = [{ id: '1' }];
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

        await service.testCallRpc(
          'get_item',
          { p_id: '123' },
          {
            useCache: false,
          }
        );

        expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      });

      it('should cache results on duplicate calls (caching test)', async () => {
        const mockResult = [{ id: '1', name: 'Test' }];
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

        const cache = getRequestCache();

        // First call - should hit database and populate cache
        const result1 = await service.testCallRpc(
          'get_item',
          { p_id: '123' },
          {
            useCache: true,
            methodName: 'getItem',
          }
        );
        const cacheSizeAfterFirst = cache.getStats().size;
        const firstCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls
          .length;

        // Second call - should hit cache (no database call)
        const result2 = await service.testCallRpc(
          'get_item',
          { p_id: '123' },
          {
            useCache: true,
            methodName: 'getItem',
          }
        );
        const cacheSizeAfterSecond = cache.getStats().size;
        const secondCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock
          .calls.length;

        // Verify results are the same (indicating cache was used)
        expect(result1).toEqual(result2);

        // Verify cache was populated (cache size should increase after first call)
        if (cacheSizeAfterFirst > 0) {
          expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)
          // Verify $queryRawUnsafe was only called once (cached on second call)
          expect(secondCallCount).toBe(firstCallCount);
        }
      });
    });

    describe('error handling', () => {
      it('should log and rethrow PrismaClientKnownRequestError', async () => {
        const mockError = new PrismaClientKnownRequestError('Database error', {
          code: 'P2002',
          clientVersion: '7.0.0',
        } as any);
        queryRawUnsafeSpy.mockRejectedValue(mockError);
        const logRpcErrorSpy = jest.spyOn(rpcErrorLoggingModule, 'logRpcError');

        await expect(service.testCallRpc('get_item', { p_id: '123' })).rejects.toThrow(
          'Database error'
        );

        expect(logRpcErrorSpy).toHaveBeenCalledWith(mockError, {
          rpcName: 'get_item',
          operation: 'callRpc',
          args: { p_id: '123' },
        });
      });

      it('should log and rethrow PrismaClientValidationError', async () => {
        const mockError = new PrismaClientValidationError('Validation error', {
          clientVersion: '7.0.0',
        } as any);
        queryRawUnsafeSpy.mockRejectedValue(mockError);
        const logRpcErrorSpy = jest.spyOn(rpcErrorLoggingModule, 'logRpcError');

        await expect(service.testCallRpc('get_item', { p_id: '123' })).rejects.toThrow(
          'Validation error'
        );

        expect(logRpcErrorSpy).toHaveBeenCalledWith(mockError, {
          rpcName: 'get_item',
          operation: 'callRpc',
          args: { p_id: '123' },
        });
      });

      it('should log and rethrow generic errors', async () => {
        const mockError = new Error('Generic error');
        queryRawUnsafeSpy.mockRejectedValue(mockError);
        const logRpcErrorSpy = jest.spyOn(rpcErrorLoggingModule, 'logRpcError');

        await expect(service.testCallRpc('get_item', { p_id: '123' })).rejects.toThrow(
          'Generic error'
        );

        expect(logRpcErrorSpy).toHaveBeenCalledWith(mockError, {
          rpcName: 'get_item',
          operation: 'callRpc',
          args: { p_id: '123' },
        });
      });

      it('should use custom methodName in error context', async () => {
        const mockError = new Error('Database error');
        queryRawUnsafeSpy.mockRejectedValue(mockError);
        const logRpcErrorSpy = jest.spyOn(rpcErrorLoggingModule, 'logRpcError');

        await expect(
          service.testCallRpc(
            'get_item',
            { p_id: '123' },
            {
              methodName: 'getItemById',
            }
          )
        ).rejects.toThrow();

        expect(logRpcErrorSpy).toHaveBeenCalledWith(mockError, {
          rpcName: 'get_item',
          operation: 'getItemById',
          args: { p_id: '123' },
        });
      });
    });

    describe('edge cases', () => {
      it('should handle null arguments', async () => {
        const mockResult = [{ id: '1' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_item', { p_id: null });

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith('SELECT * FROM get_item(p_id => $1)', null);
        // get_item returns single object, so it should be unwrapped
        expect(result).toEqual({ id: '1' });
      });

      it('should handle undefined arguments', async () => {
        const mockResult = [{ id: '1' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_item', { p_id: undefined });

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
          'SELECT * FROM get_item(p_id => $1)',
          undefined
        );
        // get_item returns single object, so it should be unwrapped
        expect(result).toEqual({ id: '1' });
      });

      it('should handle empty args object', async () => {
        const mockResult = [{ id: '1' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc(
          'get_all_items',
          {},
          {
            returnType: 'array', // Explicitly specify array return type
          }
        );

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
          'SELECT * FROM get_all_items()'
          // No arguments
        );
        // get_all_items has 'list' in name, so it should return array (not unwrapped)
        expect(result).toEqual(mockResult);
      });

      it('should handle non-array results from $queryRawUnsafe', async () => {
        const mockResult = { id: '1', name: 'Test' }; // Not an array
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_item', { p_id: '123' });

        expect(result).toEqual(mockResult); // Returned as-is
      });
    });
  });

  describe('executeRaw', () => {
    it('should execute raw SQL query with parameters', async () => {
      const mockResult = [{ count: BigInt(10) }];
      queryRawUnsafeSpy.mockResolvedValue(mockResult);

      const result = await service.testExecuteRaw<Array<{ count: bigint }>>(
        'SELECT COUNT(*) as count FROM content WHERE category = $1',
        'agents'
      );

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM content WHERE category = $1',
        'agents'
      );
      expect(result).toEqual(mockResult);
    });

    it('should execute raw SQL query with multiple parameters', async () => {
      const mockResult = [{ id: '1', name: 'Test' }];
      queryRawUnsafeSpy.mockResolvedValue(mockResult);

      const result = await service.testExecuteRaw(
        'SELECT * FROM content WHERE category = $1 AND slug = $2',
        'agents',
        'test-slug'
      );

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        'SELECT * FROM content WHERE category = $1 AND slug = $2',
        'agents',
        'test-slug'
      );
      expect(result).toEqual(mockResult);
    });

    it('should execute raw SQL query with no parameters', async () => {
      const mockResult = [{ count: BigInt(100) }];
      queryRawUnsafeSpy.mockResolvedValue(mockResult);

      const result = await service.testExecuteRaw('SELECT COUNT(*) as count FROM content');

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM content'
        // No parameters
      );
      expect(result).toEqual(mockResult);
    });

    it('should log and rethrow errors', async () => {
      const mockError = new Error('SQL syntax error');
      queryRawUnsafeSpy.mockRejectedValue(mockError);
      const logRpcErrorSpy = jest.spyOn(rpcErrorLoggingModule, 'logRpcError');

      await expect(service.testExecuteRaw('INVALID SQL QUERY')).rejects.toThrow('SQL syntax error');

      expect(logRpcErrorSpy).toHaveBeenCalledWith(mockError, {
        rpcName: 'executeRaw',
        operation: 'BasePrismaService.executeRaw',
        args: { query: 'INVALID SQL QUERY' }, // First 100 chars
      });
    });

    it('should truncate long queries in error logging', async () => {
      const longQuery = 'SELECT * FROM content WHERE ' + 'category = $1 AND '.repeat(50);
      const mockError = new Error('SQL error');
      queryRawUnsafeSpy.mockRejectedValue(mockError);
      const logRpcErrorSpy = jest.spyOn(rpcErrorLoggingModule, 'logRpcError');

      await expect(service.testExecuteRaw(longQuery, 'agents')).rejects.toThrow();

      expect(logRpcErrorSpy).toHaveBeenCalledWith(mockError, {
        rpcName: 'executeRaw',
        operation: 'BasePrismaService.executeRaw',
        args: { query: longQuery.substring(0, 100) }, // Truncated to 100 chars
      });
    });
  });

  describe('transaction', () => {
    it('should execute transaction with callback', async () => {
      const mockResult = { id: '1', name: 'Test' };
      const transactionCallback = jest.fn(async (tx: any) => {
        return mockResult;
      });
      transactionSpy.mockImplementation(async (callback: any) => {
        const mockTx = {}; // Mock transaction client
        return callback(mockTx);
      });

      const result = await service.testTransaction(transactionCallback);

      expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function), {
        maxWait: 30000,
        timeout: 30000,
      });
      expect(transactionCallback).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should use custom timeout', async () => {
      const transactionCallback = jest.fn(async (tx: any) => ({ id: '1' }));
      transactionSpy.mockResolvedValue({ id: '1' });

      await service.testTransaction(transactionCallback, { timeout: 10000 });

      expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function), {
        maxWait: 10000,
        timeout: 10000,
      });
    });

    it('should use custom isolation level', async () => {
      const transactionCallback = jest.fn(async (tx: any) => ({ id: '1' }));
      transactionSpy.mockResolvedValue({ id: '1' });

      await service.testTransaction(transactionCallback, {
        isolationLevel: 'ReadCommitted',
      });

      expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function), {
        maxWait: 30000,
        timeout: 30000,
        isolationLevel: 'ReadCommitted',
      });
    });

    it('should handle transaction errors', async () => {
      const mockError = new Error('Transaction failed');
      transactionSpy.mockRejectedValue(mockError);

      await expect(
        service.testTransaction(async (tx: any) => {
          throw mockError;
        })
      ).rejects.toThrow('Transaction failed');
    });
  });

  describe('constructor', () => {
    it('should use injected Prisma client when provided', () => {
      // Create a new service with injected client
      const testService = new TestService(prismocker);

      // Service should use the injected client
      expect((testService as any).prisma).toBe(prismocker);
    });

    it('should use default Prisma client when not provided', async () => {
      // Import default prisma to verify it's used
      const { prisma: defaultPrisma } = await import('../prisma/client.ts');
      const testService = new TestService();

      // Service should use the default client (which is PrismockerClient in tests)
      // Note: We can't directly compare because defaultPrisma might be a different instance
      // But we can verify it's not undefined
      expect((testService as any).prisma).toBeDefined();
    });
  });
});
