import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRunRpc } from './run-rpc.ts';
import { prisma } from '../../../data-layer/src/prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockClient

// Mock request cache - BasePrismaService imports from '../utils/request-cache.ts'
// We need to mock the internal import path
vi.mock('../../../data-layer/src/utils/request-cache.ts', () => ({
  withSmartCache: vi.fn(async (_rpcName, _methodName, rpcCall, _args) => {
    return await rpcCall();
  }),
  withRequestCache: vi.fn(async (_rpcName, rpcCall, _args) => {
    return await rpcCall();
  }),
}));

// Also mock the package export for completeness
vi.mock('@heyclaude/data-layer', async () => {
  const actual = await vi.importActual('@heyclaude/data-layer');
  return {
    ...actual,
    withSmartCache: vi.fn(async (_rpcName, _methodName, rpcCall, _args) => {
      return await rpcCall();
    }),
  };
});

// Mock dependencies
vi.mock('../errors.ts', () => ({
  normalizeError: vi.fn((error, message) =>
    error instanceof Error ? error : new Error(message || String(error))
  ),
  logActionFailure: vi.fn((action, error, context) => {
    const normalized = error instanceof Error ? error : new Error(String(error));
    return normalized;
  }),
}));

vi.mock('../logger.ts', () => ({
  toLogContextValue: vi.fn((v) => v),
}));

describe('createRunRpc', () => {
  let runRpc: ReturnType<typeof createRunRpc>;
  let mockPrisma: PrismaClient;
  let mockQueryRawUnsafe: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    mockPrisma = prisma;

    // Reset all mocks
    vi.clearAllMocks();
    if (mockPrisma.reset) {
      mockPrisma.reset();
    }

    // Prismock doesn't support $queryRawUnsafe, so we add it as a mock function
    // This matches the pattern used in other test files (e.g., base-prisma-service.test.ts)
    mockQueryRawUnsafe = vi.fn().mockResolvedValue([]);
    (mockPrisma as any).$queryRawUnsafe = mockQueryRawUnsafe;

    // Create runRpc instance (no createClient needed - uses Prisma directly)
    runRpc = createRunRpc();
  });

  describe('successful RPC calls', () => {
    it('should return data on successful RPC call', async () => {
      const mockData = { id: '123', name: 'Test' };
      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockResolvedValue([mockData] as any);

      const result = await runRpc(
        'test_rpc',
        { arg: 'value' },
        {
          action: 'testAction',
        }
      );

      expect(mockQueryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should pass userId in context', async () => {
      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockResolvedValue([{ success: true }] as any);

      await runRpc(
        'test_rpc',
        {},
        {
          action: 'testAction',
          userId: 'user123',
        }
      );

      expect(mockQueryRawUnsafe).toHaveBeenCalled();
    });

    it('should include metadata in context', async () => {
      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockResolvedValue([{ success: true }] as any);

      await runRpc(
        'test_rpc',
        {},
        {
          action: 'testAction',
          meta: { source: 'api' },
        }
      );

      expect(mockQueryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw normalized error on RPC failure', async () => {
      const dbError = new Error('Database error');
      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockRejectedValue(dbError);

      await expect(runRpc('test_rpc', {}, { action: 'testAction' })).rejects.toThrow();
      expect(mockQueryRawUnsafe).toHaveBeenCalled();
    });

    it('should log RPC errors with context', async () => {
      const { logActionFailure } = await import('../errors.ts');
      const dbError = new Error('Database error');

      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockRejectedValue(dbError);

      await expect(
        runRpc(
          'test_rpc',
          { param: 'value' },
          {
            action: 'testAction',
            userId: 'user123',
          }
        )
      ).rejects.toThrow();

      expect(mockQueryRawUnsafe).toHaveBeenCalled();
      expect(logActionFailure).toHaveBeenCalledWith(
        'testAction',
        expect.any(Error),
        expect.objectContaining({
          userId: 'user123',
        })
      );
    });

    it('should include RPC name and args in error context', async () => {
      const { logActionFailure } = await import('../errors.ts');
      const dbError = new Error('Database error');
      
      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockRejectedValue(dbError);

      await expect(
        runRpc('test_rpc', { arg1: 'val1', arg2: 42 }, { action: 'testAction' })
      ).rejects.toThrow();

      expect(mockQueryRawUnsafe).toHaveBeenCalled();
      expect(logActionFailure).toHaveBeenCalledWith(
        'testAction',
        expect.any(Error),
        expect.objectContaining({
          dbQuery: expect.objectContaining({
            rpcName: 'test_rpc',
            args: expect.objectContaining({ arg1: 'val1', arg2: 42 }),
          }),
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle null data', async () => {
      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockResolvedValue([null] as any);

      const result = await runRpc('test_rpc', {}, { action: 'testAction' });
      expect(mockQueryRawUnsafe).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle empty args object', async () => {
      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockResolvedValue([{ success: true }] as any);

      const result = await runRpc('test_rpc', {}, { action: 'testAction' });
      expect(mockQueryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle complex nested args', async () => {
      const complexArgs = {
        filter: { category: 'test', tags: ['a', 'b'] },
        pagination: { limit: 10, offset: 0 },
      };

      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockResolvedValue([[]] as any);

      await runRpc('test_rpc', complexArgs, { action: 'testAction' });
      expect(mockQueryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('type safety', () => {
    it('should allow custom RPC types', async () => {
      type CustomRpc = 'custom_rpc_1' | 'custom_rpc_2';
      const customRunRpc = createRunRpc<CustomRpc>();

      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockResolvedValue([{ result: 'custom' }] as any);

      const result = await customRunRpc(
        'custom_rpc_1',
        {},
        {
          action: 'customAction',
        }
      );

      expect(mockQueryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual({ result: 'custom' });
    });

    it('should properly type return values', async () => {
      interface TestResult {
        id: string;
        count: number;
      }

      // Reset and set up mock for this specific test
      mockQueryRawUnsafe.mockClear();
      mockQueryRawUnsafe.mockResolvedValue([{ id: 'test', count: 5 }] as any);

      const result = await runRpc<TestResult>(
        'test_rpc',
        {},
        {
          action: 'testAction',
        }
      );

      // TypeScript should infer the correct type
      expect(mockQueryRawUnsafe).toHaveBeenCalled();
      expect(result.id).toBe('test');
      expect(result.count).toBe(5);
    });
  });
});
