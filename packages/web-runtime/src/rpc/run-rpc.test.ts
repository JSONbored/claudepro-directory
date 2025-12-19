import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRunRpc } from './run-rpc.ts';
import { PrismockClient } from 'prismock';

// Mock Prisma client with Prismock (required for BasePrismaService)
// Use the same pattern as data-layer service tests - use require() to avoid ESM issues
vi.mock('@heyclaude/data-layer/prisma/client', () => {
  const { setupPrismockMock } = require('../../../data-layer/src/test-utils/prisma-mock.ts');
  return {
    prisma: setupPrismockMock(),
  };
});

// Mock request cache (now properly exported from data-layer package)
vi.mock('@heyclaude/data-layer', async () => {
  const actual = await vi.importActual('@heyclaude/data-layer');
  return {
    ...actual,
    withSmartCache: vi.fn((_key, _method, fn) => fn()),
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
  let mockPrisma: any;

  beforeEach(async () => {
    // Get the mocked Prisma instance (Prismock)
    const { prisma } = await import('@heyclaude/data-layer/prisma/client');
    mockPrisma = prisma;
    
    // Reset mocks
    vi.clearAllMocks();
    if (mockPrisma.reset) {
      mockPrisma.reset();
    }
    
    // Create runRpc instance (no createClient needed - uses Prisma directly)
    runRpc = createRunRpc();
  });

  describe('successful RPC calls', () => {
    it('should return data on successful RPC call', async () => {
      const mockData = { id: '123', name: 'Test' };
      vi.mocked(mockPrisma.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await runRpc('test_rpc', { arg: 'value' }, {
        action: 'testAction',
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should pass userId in context', async () => {
      vi.mocked(mockPrisma.$queryRawUnsafe).mockResolvedValue([{ success: true }] as any);

      await runRpc('test_rpc', {}, {
        action: 'testAction',
        userId: 'user123',
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should include metadata in context', async () => {
      vi.mocked(mockPrisma.$queryRawUnsafe).mockResolvedValue([{ success: true }] as any);

      await runRpc('test_rpc', {}, {
        action: 'testAction',
        meta: { source: 'api' },
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw normalized error on RPC failure', async () => {
      const dbError = new Error('Database error');
      vi.mocked(mockPrisma.$queryRawUnsafe).mockRejectedValue(dbError);

      await expect(
        runRpc('test_rpc', {}, { action: 'testAction' })
      ).rejects.toThrow();
    });

    it('should log RPC errors with context', async () => {
      const { logActionFailure } = await import('../errors.ts');
      const dbError = new Error('Database error');
      
      vi.mocked(mockPrisma.$queryRawUnsafe).mockRejectedValue(dbError);

      await expect(
        runRpc('test_rpc', { param: 'value' }, {
          action: 'testAction',
          userId: 'user123',
        })
      ).rejects.toThrow();

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
      vi.mocked(mockPrisma.$queryRawUnsafe).mockRejectedValue(dbError);

      await expect(
        runRpc('test_rpc', { arg1: 'val1', arg2: 42 }, { action: 'testAction' })
      ).rejects.toThrow();

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
      vi.mocked(mockPrisma.$queryRawUnsafe).mockResolvedValue([null] as any);

      const result = await runRpc('test_rpc', {}, { action: 'testAction' });
      expect(result).toBeNull();
    });

    it('should handle empty args object', async () => {
      vi.mocked(mockPrisma.$queryRawUnsafe).mockResolvedValue([{ success: true }] as any);

      const result = await runRpc('test_rpc', {}, { action: 'testAction' });
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle complex nested args', async () => {
      const complexArgs = {
        filter: { category: 'test', tags: ['a', 'b'] },
        pagination: { limit: 10, offset: 0 },
      };

      vi.mocked(mockPrisma.$queryRawUnsafe).mockResolvedValue([[]] as any);

      await runRpc('test_rpc', complexArgs, { action: 'testAction' });
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('type safety', () => {
    it('should allow custom RPC types', async () => {
      type CustomRpc = 'custom_rpc_1' | 'custom_rpc_2';
      const customRunRpc = createRunRpc<CustomRpc>();

      vi.mocked(mockPrisma.$queryRawUnsafe).mockResolvedValue([{ result: 'custom' }] as any);

      const result = await customRunRpc('custom_rpc_1', {}, {
        action: 'customAction',
      });

      expect(result).toEqual({ result: 'custom' });
    });

    it('should properly type return values', async () => {
      interface TestResult {
        id: string;
        count: number;
      }

      vi.mocked(mockPrisma.$queryRawUnsafe).mockResolvedValue([{ id: 'test', count: 5 }] as any);

      const result = await runRpc<TestResult>('test_rpc', {}, {
        action: 'testAction',
      });

      // TypeScript should infer the correct type
      expect(result.id).toBe('test');
      expect(result.count).toBe(5);
    });
  });
});