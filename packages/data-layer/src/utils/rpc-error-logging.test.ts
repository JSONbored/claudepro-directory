import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock @heyclaude/shared-runtime
vi.mock('@heyclaude/shared-runtime', () => ({
  createPinoConfig: vi.fn((options?: { service?: string }) => ({
    level: 'info',
    ...(options?.service && { service: options.service }),
  })),
}));

// Import after mock is set up
import { logRpcError, logger } from './rpc-error-logging.ts';

describe('logRpcError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on the logger.error method
    vi.spyOn(logger, 'error');
  });

  it('should log RPC errors with context', () => {
    const error = { message: 'RPC failed', code: 'PGRST116' };
    const context = {
      rpcName: 'get_content',
      operation: 'ContentService.getContent',
    };

    logRpcError(error, context);

    expect(logger.error).toHaveBeenCalledWith(
      'RPC call failed',
      error,
      expect.objectContaining({
        dbQuery: expect.objectContaining({
          rpcName: 'get_content',
        }),
      })
    );
  });

  it('should handle errors without message', () => {
    const error = { code: 'UNKNOWN' };
    const context = { rpcName: 'test_rpc' };

    logRpcError(error, context);

    expect(logger.error).toHaveBeenCalled();
  });

  it('should include error code in context', () => {
    const error = { message: 'Error', code: 'PGRST301', details: 'Permission denied' };
    const context = { rpcName: 'protected_rpc' };

    logRpcError(error, context);

    expect(logger.error).toHaveBeenCalledWith(
      'RPC call failed',
      error,
      expect.objectContaining({
        dbQuery: expect.objectContaining({
          rpcName: 'protected_rpc',
        }),
      })
    );
  });

  it('should handle null/undefined errors gracefully', () => {
    logRpcError(null as any, { rpcName: 'test' });
    expect(logger.error).toHaveBeenCalled();

    logRpcError(undefined as any, { rpcName: 'test2' });
    expect(logger.error).toHaveBeenCalled();
  });
});