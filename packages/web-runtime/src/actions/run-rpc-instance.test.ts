import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock run-rpc - use globalThis to avoid hoisting issues
jest.mock('../rpc/run-rpc', () => {
  if (!(globalThis as any).__runRpcMocks) {
    (globalThis as any).__runRpcMocks = {
      mockRpcFunction: jest.fn(),
      createRunRpc: jest.fn(() => (globalThis as any).__runRpcMocks.mockRpcFunction), // Return a function when called
    };
  }
  return {
    createRunRpc: (globalThis as any).__runRpcMocks.createRunRpc,
  };
});

// Import after mock is set up
import { runRpc } from './run-rpc-instance';

describe('run-rpc-instance', () => {
  beforeEach(() => {
    // Don't clear mocks - createRunRpc is called at module initialization
    // We want to preserve the call history
  });

  it('should create RPC instance', () => {
    // createRunRpc is called at module initialization when runRpc is exported
    // The mock should have been called during module import
    const mock = (globalThis as any).__runRpcMocks?.createRunRpc;
    expect(mock).toBeDefined();
    // Verify it was called (module initialization happens before tests run)
    // Note: If mockClear was called in beforeEach, this would fail
    // But we removed mockClear to preserve the call history
    expect(mock).toHaveBeenCalled();
  });

  it('should export runRpc function', () => {
    // runRpc is the result of createRunRpc<'ensure_user_record'>()
    // It should be defined and be a function (the mock function)
    expect(runRpc).toBeDefined();
    expect(runRpc).toBe((globalThis as any).__runRpcMocks.mockRpcFunction);
    expect(typeof runRpc).toBe('function');
  });
});

