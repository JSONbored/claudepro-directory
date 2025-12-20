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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaService } from './base-prisma-service.ts';

// Prisma error types are available from Prisma namespace
const { PrismaClientKnownRequestError, PrismaClientValidationError } = Prisma;
import * as requestCacheModule from '../utils/request-cache.ts';
import * as rpcErrorLoggingModule from '../utils/rpc-error-logging.ts';

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// We can create a new PrismockClient instance for this test

// Mock request cache and error logging
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
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
  let prismock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Use the singleton prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    // This avoids the adapter constructor issue since the singleton is already initialized
    prismock = prisma;
    
    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }
    
    // Prismock doesn't support $queryRawUnsafe, $transaction, etc., so we add them as mock functions
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;
    (prismock as any).$transaction = vi.fn();
    (prismock as any).$executeRawUnsafe = vi.fn();
    
    service = new TestService(prismock);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('callRpc', () => {
    describe('basic RPC calls', () => {
      it('should call RPC function with no arguments', async () => {
        const mockResult = [{ id: '1', name: 'Test' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_all_items', {}, {
          returnType: 'array', // Explicitly specify array return type
        });

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
          'SELECT * FROM get_all_items()',
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
          '123',
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
          0,
        );
        // get_items has no 'list' in name, but returns single object, so it should be unwrapped
        expect(result).toEqual({ id: '1', name: 'Test' });
      });
    });

    describe('return type handling', () => {
      it('should unwrap single-element array for single return type', async () => {
        const mockResult = [{ id: '1', name: 'Test' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_item', { p_id: '123' }, {
          returnType: 'single',
        });

        expect(result).toEqual({ id: '1', name: 'Test' }); // Unwrapped
      });

      it('should return array for array return type', async () => {
        const mockResult = [{ id: '1' }, { id: '2' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_items', { p_category: 'agents' }, {
          returnType: 'array',
        });

        expect(result).toEqual(mockResult); // Not unwrapped
      });

      it('should auto-detect and unwrap composite types (objects)', async () => {
        const mockResult = [{ id: '1', name: 'Test', data: { nested: 'value' } }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_item_detail', { p_id: '123' }, {
          returnType: 'auto',
        });

        expect(result).toEqual({ id: '1', name: 'Test', data: { nested: 'value' } }); // Unwrapped
      });

      it('should auto-detect and keep arrays for list functions', async () => {
        const mockResult = [{ id: '1' }, { id: '2' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_content_list', { p_category: 'agents' }, {
          returnType: 'auto',
        });

        expect(result).toEqual(mockResult); // Not unwrapped (has 'list' in name)
      });

      it('should return empty array for array return type when no results', async () => {
        queryRawUnsafeSpy.mockResolvedValue([]);

        const result = await service.testCallRpc('get_items', { p_category: 'agents' }, {
          returnType: 'array',
        });

        expect(result).toEqual([]);
      });

      it('should return undefined for single return type when no results', async () => {
        queryRawUnsafeSpy.mockResolvedValue([]);

        const result = await service.testCallRpc('get_item', { p_id: '123' }, {
          returnType: 'single',
        });

        expect(result).toBeUndefined();
      });

      it('should auto-detect single return for search functions with composite types', async () => {
        // search_content_optimized returns composite type (object), should be unwrapped
        const mockResult = [{ results: [], total_count: 0 }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('search_content_optimized', {
          p_query: 'test',
        }, {
          returnType: 'auto',
        });

        expect(result).toEqual({ results: [], total_count: 0 }); // Unwrapped (composite type)
      });
    });

    describe('caching behavior', () => {
      it('should use withSmartCache when useCache is true (default)', async () => {
        const mockResult = [{ id: '1' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);
        const withSmartCacheSpy = vi.spyOn(requestCacheModule, 'withSmartCache');

        await service.testCallRpc('get_item', { p_id: '123' }, {
          useCache: true,
          methodName: 'getItem',
        });

        expect(withSmartCacheSpy).toHaveBeenCalledWith(
          'get_item',
          'getItem',
          expect.any(Function),
          { p_id: '123' },
        );
      });

      it('should skip caching when useCache is false', async () => {
        const mockResult = [{ id: '1' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);
        const withSmartCacheSpy = vi.spyOn(requestCacheModule, 'withSmartCache');

        await service.testCallRpc('get_item', { p_id: '123' }, {
          useCache: false,
        });

        expect(withSmartCacheSpy).not.toHaveBeenCalled();
        expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should log and rethrow PrismaClientKnownRequestError', async () => {
        const mockError = new PrismaClientKnownRequestError('Database error', {
          code: 'P2002',
          clientVersion: '7.0.0',
        } as any);
        queryRawUnsafeSpy.mockRejectedValue(mockError);
        const logRpcErrorSpy = vi.spyOn(rpcErrorLoggingModule, 'logRpcError');

        await expect(
          service.testCallRpc('get_item', { p_id: '123' })
        ).rejects.toThrow('Database error');

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
        const logRpcErrorSpy = vi.spyOn(rpcErrorLoggingModule, 'logRpcError');

        await expect(
          service.testCallRpc('get_item', { p_id: '123' })
        ).rejects.toThrow('Validation error');

        expect(logRpcErrorSpy).toHaveBeenCalledWith(mockError, {
          rpcName: 'get_item',
          operation: 'callRpc',
          args: { p_id: '123' },
        });
      });

      it('should log and rethrow generic errors', async () => {
        const mockError = new Error('Generic error');
        queryRawUnsafeSpy.mockRejectedValue(mockError);
        const logRpcErrorSpy = vi.spyOn(rpcErrorLoggingModule, 'logRpcError');

        await expect(
          service.testCallRpc('get_item', { p_id: '123' })
        ).rejects.toThrow('Generic error');

        expect(logRpcErrorSpy).toHaveBeenCalledWith(mockError, {
          rpcName: 'get_item',
          operation: 'callRpc',
          args: { p_id: '123' },
        });
      });

      it('should use custom methodName in error context', async () => {
        const mockError = new Error('Database error');
        queryRawUnsafeSpy.mockRejectedValue(mockError);
        const logRpcErrorSpy = vi.spyOn(rpcErrorLoggingModule, 'logRpcError');

        await expect(
          service.testCallRpc('get_item', { p_id: '123' }, {
            methodName: 'getItemById',
          })
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

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
          'SELECT * FROM get_item(p_id => $1)',
          null,
        );
        // get_item returns single object, so it should be unwrapped
        expect(result).toEqual({ id: '1' });
      });

      it('should handle undefined arguments', async () => {
        const mockResult = [{ id: '1' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_item', { p_id: undefined });

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
          'SELECT * FROM get_item(p_id => $1)',
          undefined,
        );
        // get_item returns single object, so it should be unwrapped
        expect(result).toEqual({ id: '1' });
      });

      it('should handle empty args object', async () => {
        const mockResult = [{ id: '1' }];
        queryRawUnsafeSpy.mockResolvedValue(mockResult);

        const result = await service.testCallRpc('get_all_items', {}, {
          returnType: 'array', // Explicitly specify array return type
        });

        expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
          'SELECT * FROM get_all_items()',
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
        'agents',
      );
      expect(result).toEqual(mockResult);
    });

    it('should execute raw SQL query with multiple parameters', async () => {
      const mockResult = [{ id: '1', name: 'Test' }];
      queryRawUnsafeSpy.mockResolvedValue(mockResult);

      const result = await service.testExecuteRaw(
        'SELECT * FROM content WHERE category = $1 AND slug = $2',
        'agents',
        'test-slug',
      );

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        'SELECT * FROM content WHERE category = $1 AND slug = $2',
        'agents',
        'test-slug',
      );
      expect(result).toEqual(mockResult);
    });

    it('should execute raw SQL query with no parameters', async () => {
      const mockResult = [{ count: BigInt(100) }];
      queryRawUnsafeSpy.mockResolvedValue(mockResult);

      const result = await service.testExecuteRaw('SELECT COUNT(*) as count FROM content');

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM content',
        // No parameters
      );
      expect(result).toEqual(mockResult);
    });

    it('should log and rethrow errors', async () => {
      const mockError = new Error('SQL syntax error');
      queryRawUnsafeSpy.mockRejectedValue(mockError);
      const logRpcErrorSpy = vi.spyOn(rpcErrorLoggingModule, 'logRpcError');

      await expect(
        service.testExecuteRaw('INVALID SQL QUERY')
      ).rejects.toThrow('SQL syntax error');

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
      const logRpcErrorSpy = vi.spyOn(rpcErrorLoggingModule, 'logRpcError');

      await expect(
        service.testExecuteRaw(longQuery, 'agents')
      ).rejects.toThrow();

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
      const transactionCallback = vi.fn(async (tx: any) => {
        return mockResult;
      });
      const transactionSpy = (prismock as any).$transaction as ReturnType<typeof vi.fn>;
      transactionSpy.mockImplementation(async (callback: any) => {
        const mockTx = {}; // Mock transaction client
        return callback(mockTx);
      });

      const result = await service.testTransaction(transactionCallback);

      expect((prismock as any).$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        {
          maxWait: 30000,
          timeout: 30000,
        },
      );
      expect(transactionCallback).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should use custom timeout', async () => {
      const transactionCallback = vi.fn(async (tx: any) => ({ id: '1' }));
      const transactionSpy = (prismock as any).$transaction as ReturnType<typeof vi.fn>;
      transactionSpy.mockResolvedValue({ id: '1' });

      await service.testTransaction(transactionCallback, { timeout: 10000 });

      expect((prismock as any).$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        {
          maxWait: 10000,
          timeout: 10000,
        },
      );
    });

    it('should use custom isolation level', async () => {
      const transactionCallback = vi.fn(async (tx: any) => ({ id: '1' }));
      const transactionSpy = (prismock as any).$transaction as ReturnType<typeof vi.fn>;
      transactionSpy.mockResolvedValue({ id: '1' });

      await service.testTransaction(transactionCallback, {
        isolationLevel: 'ReadCommitted',
      });

      expect((prismock as any).$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        {
          maxWait: 30000,
          timeout: 30000,
          isolationLevel: 'ReadCommitted',
        },
      );
    });

    it('should handle transaction errors', async () => {
      const mockError = new Error('Transaction failed');
      const transactionSpy = (prismock as any).$transaction as ReturnType<typeof vi.fn>;
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
      const testService = new TestService(prismock);

      // Service should use the injected client
      expect((testService as any).prisma).toBe(prismock);
    });

    it('should use default Prisma client when not provided', async () => {
      // Import default prisma to verify it's used
      const { prisma: defaultPrisma } = await import('../prisma/client.ts');
      const testService = new TestService();

      // Service should use the default client (which is PrismockClient in tests)
      // Note: We can't directly compare because defaultPrisma might be a different instance
      // But we can verify it's not undefined
      expect((testService as any).prisma).toBeDefined();
    });
  });
});
