import { describe, expect, it, vi } from 'vitest';
import { logRpcError } from './rpc-error-logging.ts';

// Mock the logger
vi.mock('@heyclaude/shared-runtime', () => ({
  logError: vi.fn(),
  createUtilityContext: vi.fn((domain, action, meta) => ({ domain, action, ...meta })),
}));

describe('logRpcError', () => {
  it('should log RPC errors with context', () => {
    const { logError } = require('@heyclaude/shared-runtime');
    const error = { message: 'RPC failed', code: 'PGRST116' };
    const context = {
      rpcName: 'get_content',
      operation: 'ContentService.getContent',
    };

    logRpcError(error, context);

    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('RPC failed'),
      error,
      expect.objectContaining({
        rpcName: 'get_content',
        operation: 'ContentService.getContent',
      })
    );
  });

  it('should handle errors without message', () => {
    const { logError } = require('@heyclaude/shared-runtime');
    const error = { code: 'UNKNOWN' };
    const context = { rpcName: 'test_rpc' };

    logRpcError(error, context);

    expect(logError).toHaveBeenCalled();
  });

  it('should include error code in context', () => {
    const { logError } = require('@heyclaude/shared-runtime');
    const error = { message: 'Error', code: 'PGRST301', details: 'Permission denied' };
    const context = { rpcName: 'protected_rpc' };

    logRpcError(error, context);

    expect(logError).toHaveBeenCalledWith(
      expect.any(String),
      error,
      expect.objectContaining({
        rpcName: 'protected_rpc',
      })
    );
  });

  it('should handle null/undefined errors gracefully', () => {
    const { logError } = require('@heyclaude/shared-runtime');
    
    logRpcError(null as any, { rpcName: 'test' });
    expect(logError).toHaveBeenCalled();

    logRpcError(undefined as any, { rpcName: 'test2' });
    expect(logError).toHaveBeenCalled();
  });
});