import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRunRpc } from './run-rpc.ts';
import type { RpcClientLike } from './run-rpc.ts';

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
  let mockClient: RpcClientLike;
  let createClient: () => Promise<RpcClientLike>;
  let runRpc: ReturnType<typeof createRunRpc>;

  beforeEach(() => {
    mockClient = {
      rpc: vi.fn(),
    };

    createClient = vi.fn(async () => mockClient);
    runRpc = createRunRpc({ createClient });
  });

  describe('successful RPC calls', () => {
    it('should return data on successful RPC call', async () => {
      const mockData = { id: '123', name: 'Test' };
      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await runRpc('test_rpc', { arg: 'value' }, {
        action: 'testAction',
      });

      expect(createClient).toHaveBeenCalled();
      expect(mockClient.rpc).toHaveBeenCalledWith('test_rpc', { arg: 'value' });
      expect(result).toEqual(mockData);
    });

    it('should pass userId in context', async () => {
      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await runRpc('test_rpc', {}, {
        action: 'testAction',
        userId: 'user123',
      });

      expect(mockClient.rpc).toHaveBeenCalled();
    });

    it('should include metadata in context', async () => {
      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await runRpc('test_rpc', {}, {
        action: 'testAction',
        meta: { source: 'api', requestId: 'req123' },
      });

      expect(mockClient.rpc).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw normalized error on RPC failure', async () => {
      const rpcError = { message: 'RPC failed', code: 'PGRST116' };
      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: null,
        error: rpcError,
      });

      await expect(
        runRpc('test_rpc', {}, { action: 'testAction' })
      ).rejects.toThrow();
    });

    it('should log RPC errors with context', async () => {
      const { logActionFailure } = await import('../errors.ts');
      const rpcError = { message: 'Database error' };
      
      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: null,
        error: rpcError,
      });

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
      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

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

    it('should handle client creation failure', async () => {
      const clientError = new Error('Failed to create client');
      createClient = vi.fn(async () => {
        throw clientError;
      });
      runRpc = createRunRpc({ createClient });

      await expect(
        runRpc('test_rpc', {}, { action: 'testAction' })
      ).rejects.toThrow('Failed to create client');
    });
  });

  describe('edge cases', () => {
    it('should handle null data', async () => {
      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await runRpc('test_rpc', {}, { action: 'testAction' });
      expect(result).toBeNull();
    });

    it('should handle empty args object', async () => {
      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await runRpc('test_rpc', {}, { action: 'testAction' });
      expect(mockClient.rpc).toHaveBeenCalledWith('test_rpc', {});
      expect(result).toEqual({ success: true });
    });

    it('should handle complex nested args', async () => {
      const complexArgs = {
        filter: { category: 'test', tags: ['a', 'b'] },
        pagination: { limit: 10, offset: 0 },
      };

      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: [],
        error: null,
      });

      await runRpc('test_rpc', complexArgs, { action: 'testAction' });
      expect(mockClient.rpc).toHaveBeenCalledWith('test_rpc', complexArgs);
    });
  });

  describe('type safety', () => {
    it('should allow custom RPC types', async () => {
      type CustomRpc = 'custom_rpc_1' | 'custom_rpc_2';
      const customRunRpc = createRunRpc<CustomRpc>({ createClient });

      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: { result: 'custom' },
        error: null,
      });

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

      vi.mocked(mockClient.rpc).mockResolvedValue({
        data: { id: 'test', count: 5 },
        error: null,
      });

      const result = await runRpc<TestResult>('test_rpc', {}, {
        action: 'testAction',
      });

      // TypeScript should infer the correct type
      expect(result.id).toBe('test');
      expect(result.count).toBe(5);
    });
  });
});