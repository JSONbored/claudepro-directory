/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSafeAction } from './use-safe-action';

// Mock next-safe-action for unit tests - define mocks inside factory function to avoid hoisting issues
jest.mock('next-safe-action/hooks', () => {
  const mockExecute = jest.fn();
  const mockExecuteAsync = jest.fn();
  const mockReset = jest.fn();
  const mockUseAction = jest.fn(() => ({
    execute: mockExecute,
    executeAsync: mockExecuteAsync,
    input: undefined,
    result: {},
    reset: mockReset,
    status: 'idle' as const,
    isIdle: true,
    isExecuting: false,
    isTransitioning: false,
    isPending: false,
    hasSucceeded: false,
    hasErrored: false,
    hasNavigated: false,
  }));
  return {
    useAction: mockUseAction,
    __mockExecute: mockExecute,
    __mockExecuteAsync: mockExecuteAsync,
    __mockReset: mockReset,
    __mockUseAction: mockUseAction,
  };
});

// Get mocks for use in unit tests
const mockModule = jest.requireMock('next-safe-action/hooks') as {
  useAction: ReturnType<typeof jest.fn>;
  __mockExecute: ReturnType<typeof jest.fn>;
  __mockExecuteAsync: ReturnType<typeof jest.fn>;
  __mockReset: ReturnType<typeof jest.fn>;
  __mockUseAction: ReturnType<typeof jest.fn>;
};
const mockExecute = mockModule.__mockExecute;
const mockExecuteAsync = mockModule.__mockExecuteAsync;
const mockReset = mockModule.__mockReset;
const mockUseAction = mockModule.__mockUseAction;

/**
 * Unit Tests
 * 
 * These tests verify that useSafeAction correctly wraps useAction and passes through
 * all properties, callbacks, and status flags. They use mocked useAction to test
 * the wrapper logic in isolation.
 */
describe('useSafeAction (Unit Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset mockUseAction to default return value
    mockUseAction.mockReturnValue({
      execute: mockExecute,
      executeAsync: mockExecuteAsync,
      input: undefined,
      result: {},
      reset: mockReset,
      status: 'idle' as const,
      isIdle: true,
      isExecuting: false,
      isTransitioning: false,
      isPending: false,
      hasSucceeded: false,
      hasErrored: false,
      hasNavigated: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return hook result from useAction', () => {
    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current).toBeDefined();
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.executeAsync).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(mockUseAction).toHaveBeenCalled();
  });

  it('should call execute from useAction', () => {
    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    act(() => {
      result.current.execute({ value: 'test' });
    });

    expect(mockExecute).toHaveBeenCalledWith({ value: 'test' });
  });

  it('should call executeAsync from useAction', async () => {
    mockExecuteAsync.mockResolvedValue({ data: { result: 'test' } });

    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    await act(async () => {
      const promise = result.current.executeAsync({ value: 'test' });
      await promise;
    });

    expect(mockExecuteAsync).toHaveBeenCalledWith({ value: 'test' });
  });

  it('should return status flags', () => {
    mockUseAction.mockReturnValue({
      execute: mockExecute,
      executeAsync: mockExecuteAsync,
      input: undefined,
      result: {},
      reset: mockReset,
      status: 'executing' as const,
      isIdle: false,
      isExecuting: true,
      isTransitioning: false,
      isPending: true,
      hasSucceeded: false,
      hasErrored: false,
      hasNavigated: false,
    });

    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current.status).toBe('executing');
    expect(result.current.isExecuting).toBe(true);
    expect(result.current.isPending).toBe(true);
  });

  it('should pass callbacks to useAction', () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onSettled = jest.fn();
    const onExecute = jest.fn();

    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    renderHook(() =>
      useSafeAction(mockAction, {
        onSuccess,
        onError,
        onSettled,
        onExecute,
      })
    );

    expect(mockUseAction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        onSuccess,
        onError,
        onSettled,
        onExecute,
      })
    );
  });

  it('should call reset from useAction', () => {
    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    act(() => {
      result.current.reset();
    });

    expect(mockReset).toHaveBeenCalled();
  });

  it('should preserve action input and output types', () => {
    interface ActionInput {
      userId: string;
      value: number;
    }

    interface ActionOutput {
      success: boolean;
      id: string;
    }

    const mockAction = jest.fn(
      async (input: ActionInput): Promise<{ data?: ActionOutput }> => ({
        data: { success: true, id: '123' },
      })
    );

    const { result } = renderHook(() => useSafeAction(mockAction));

    // TypeScript should infer types correctly
    act(() => {
      result.current.execute({ userId: 'user-1', value: 42 });
    });

    expect(mockExecute).toHaveBeenCalledWith({ userId: 'user-1', value: 42 });
  });

  it('should handle actions without data property', async () => {
    const mockAction = jest.fn(async () => {
      return { serverError: 'Error occurred' };
    });

    mockExecuteAsync.mockResolvedValue({ serverError: 'Error occurred' });

    const { result } = renderHook(() => useSafeAction(mockAction));

    await act(async () => {
      const promise = result.current.executeAsync({});
      const response = await promise;
      expect(response.serverError).toBe('Error occurred');
    });
  });

  it('should handle validation errors', async () => {
    mockExecuteAsync.mockResolvedValue({
      validationErrors: { field: 'Invalid value' },
    });

    const mockAction = jest.fn(async () => ({
      data: { result: 'success' },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    await act(async () => {
      const response = await result.current.executeAsync({});
      expect(response.validationErrors).toEqual({ field: 'Invalid value' });
    });
  });

  it('should handle fetch errors', async () => {
    mockExecuteAsync.mockResolvedValue({
      fetchError: 'Network error',
    });

    const mockAction = jest.fn(async () => ({
      data: { result: 'success' },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    await act(async () => {
      const response = await result.current.executeAsync({});
      expect(response.fetchError).toBe('Network error');
    });
  });

  it('should return input from useAction', () => {
    mockUseAction.mockReturnValue({
      execute: mockExecute,
      executeAsync: mockExecuteAsync,
      input: { value: 'test' },
      result: {},
      reset: mockReset,
      status: 'idle' as const,
      isIdle: true,
      isExecuting: false,
      isTransitioning: false,
      isPending: false,
      hasSucceeded: false,
      hasErrored: false,
      hasNavigated: false,
    });

    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current.input).toEqual({ value: 'test' });
  });

  it('should return result from useAction', () => {
    mockUseAction.mockReturnValue({
      execute: mockExecute,
      executeAsync: mockExecuteAsync,
      input: undefined,
      result: { data: { result: 'success' } },
      reset: mockReset,
      status: 'hasSucceeded' as const,
      isIdle: false,
      isExecuting: false,
      isTransitioning: false,
      isPending: false,
      hasSucceeded: true,
      hasErrored: false,
      hasNavigated: false,
    });

    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current.result).toEqual({ data: { result: 'success' } });
    expect(result.current.hasSucceeded).toBe(true);
  });

  it('should test all status values', () => {
    const statuses: Array<'idle' | 'executing' | 'transitioning' | 'hasSucceeded' | 'hasErrored' | 'hasNavigated'> = [
      'idle',
      'executing',
      'transitioning',
      'hasSucceeded',
      'hasErrored',
      'hasNavigated',
    ];

    statuses.forEach((status) => {
      mockUseAction.mockReturnValue({
        execute: mockExecute,
        executeAsync: mockExecuteAsync,
        input: undefined,
        result: {},
        reset: mockReset,
        status,
        isIdle: status === 'idle',
        isExecuting: status === 'executing',
        isTransitioning: status === 'transitioning',
        isPending: status === 'executing' || status === 'transitioning',
        hasSucceeded: status === 'hasSucceeded',
        hasErrored: status === 'hasErrored',
        hasNavigated: status === 'hasNavigated',
      });

      const mockAction = jest.fn(async (input: { value: string }) => ({
        data: { result: input.value },
      }));

      const { result } = renderHook(() => useSafeAction(mockAction));

      expect(result.current.status).toBe(status);
    });
  });

  it('should test all boolean flags', () => {
    mockUseAction.mockReturnValue({
      execute: mockExecute,
      executeAsync: mockExecuteAsync,
      input: undefined,
      result: {},
      reset: mockReset,
      status: 'executing' as const,
      isIdle: false,
      isExecuting: true,
      isTransitioning: false,
      isPending: true,
      hasSucceeded: false,
      hasErrored: false,
      hasNavigated: false,
    });

    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current.isIdle).toBe(false);
    expect(result.current.isExecuting).toBe(true);
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.isPending).toBe(true);
    expect(result.current.hasSucceeded).toBe(false);
    expect(result.current.hasErrored).toBe(false);
    expect(result.current.hasNavigated).toBe(false);
  });

  it('should pass action function to useAction', () => {
    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    renderHook(() => useSafeAction(mockAction));

    expect(mockUseAction).toHaveBeenCalledWith(expect.any(Function), undefined);
    // Verify the function passed is the action (wrapped due to type assertion)
    const passedAction = mockUseAction.mock.calls[0]?.[0];
    expect(typeof passedAction).toBe('function');
  });

  it('should handle undefined callbacks', () => {
    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    renderHook(() => useSafeAction(mockAction, undefined));

    expect(mockUseAction).toHaveBeenCalledWith(expect.any(Function), undefined);
  });

  it('should handle empty callbacks object', () => {
    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    renderHook(() => useSafeAction(mockAction, {}));

    expect(mockUseAction).toHaveBeenCalledWith(expect.any(Function), {});
  });

  it('should handle partial callbacks', () => {
    const onSuccess = jest.fn();
    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    renderHook(() => useSafeAction(mockAction, { onSuccess }));

    expect(mockUseAction).toHaveBeenCalledWith(expect.any(Function), { onSuccess });
  });

  it('should return all required properties', () => {
    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current).toHaveProperty('execute');
    expect(result.current).toHaveProperty('executeAsync');
    expect(result.current).toHaveProperty('input');
    expect(result.current).toHaveProperty('result');
    expect(result.current).toHaveProperty('reset');
    expect(result.current).toHaveProperty('status');
    expect(result.current).toHaveProperty('isIdle');
    expect(result.current).toHaveProperty('isExecuting');
    expect(result.current).toHaveProperty('isTransitioning');
    expect(result.current).toHaveProperty('isPending');
    expect(result.current).toHaveProperty('hasSucceeded');
    expect(result.current).toHaveProperty('hasErrored');
    expect(result.current).toHaveProperty('hasNavigated');
  });

  it('should handle transitioning status', () => {
    mockUseAction.mockReturnValue({
      execute: mockExecute,
      executeAsync: mockExecuteAsync,
      input: undefined,
      result: {},
      reset: mockReset,
      status: 'transitioning' as const,
      isIdle: false,
      isExecuting: false,
      isTransitioning: true,
      isPending: true,
      hasSucceeded: false,
      hasErrored: false,
      hasNavigated: false,
    });

    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current.status).toBe('transitioning');
    expect(result.current.isTransitioning).toBe(true);
    expect(result.current.isPending).toBe(true);
  });

  it('should handle hasErrored status', () => {
    mockUseAction.mockReturnValue({
      execute: mockExecute,
      executeAsync: mockExecuteAsync,
      input: undefined,
      result: { serverError: 'Error occurred' },
      reset: mockReset,
      status: 'hasErrored' as const,
      isIdle: false,
      isExecuting: false,
      isTransitioning: false,
      isPending: false,
      hasSucceeded: false,
      hasErrored: true,
      hasNavigated: false,
    });

    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current.status).toBe('hasErrored');
    expect(result.current.hasErrored).toBe(true);
    expect(result.current.result.serverError).toBe('Error occurred');
  });

  it('should handle hasNavigated status', () => {
    mockUseAction.mockReturnValue({
      execute: mockExecute,
      executeAsync: mockExecuteAsync,
      input: undefined,
      result: {},
      reset: mockReset,
      status: 'hasNavigated' as const,
      isIdle: false,
      isExecuting: false,
      isTransitioning: false,
      isPending: false,
      hasSucceeded: false,
      hasErrored: false,
      hasNavigated: true,
    });

    const mockAction = jest.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current.status).toBe('hasNavigated');
    expect(result.current.hasNavigated).toBe(true);
  });

  it('should re-export useAction', () => {
    // Verify that useAction is exported from the module
    const { useAction: exportedUseAction } = require('./use-safe-action');
    expect(typeof exportedUseAction).toBe('function');
    // It should be the same as the mocked useAction (since it's a re-export)
    expect(exportedUseAction).toBe(mockUseAction);
  });
});

/**
 * Integration Tests
 *
 * These tests use REAL useAction (not mocked) and REAL server actions,
 * creating true end-to-end integration: Hook → Action → RPC → Database (Prismocker).
 *
 * This verifies the complete flow works correctly with minimal mocks.
 * 
 * Uses jest.isolateModules() to get real useAction implementation.
 */
describe('useSafeAction (Integration Tests)', () => {
  // Import integration helpers
  let setupActionIntegration: () => ReturnType<typeof jest.spyOn>;
  let registerActionForIntegration: (action: Function) => void;
  let clearActionRegistry: () => void;
  let fetchSpy: ReturnType<typeof jest.spyOn>;
  let prismocker: any; // PrismockerClient (not standard PrismaClient)
  let clearRequestCache: () => void;

  beforeAll(async () => {
    // Import integration helpers
    const integrationHelpers = await import('./__helpers__/integration-helpers');
    setupActionIntegration = integrationHelpers.setupActionIntegration;
    registerActionForIntegration = integrationHelpers.registerActionForIntegration;
    clearActionRegistry = integrationHelpers.clearActionRegistry;

    // Import Prismocker and cache utilities
    const { prisma } = await import('@heyclaude/data-layer/prisma/client');
    prismocker = prisma; // PrismockerClient (already typed as any)
    
    const requestCache = await import('../../../data-layer/src/utils/request-cache.ts');
    clearRequestCache = requestCache.clearRequestCache;
  });

  beforeEach(async () => {
    // 1. Clear request cache (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Reset Prismocker data
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 3. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 4. Set up $queryRawUnsafe for RPC testing
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

    // 5. Clear action registry
    clearActionRegistry();

    // 6. Set up fetch interceptor (must be before importing useSafeAction)
    fetchSpy = setupActionIntegration();
  });

  afterEach(() => {
    // Clean up
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
    clearActionRegistry();
    jest.clearAllMocks();
    jest.resetModules(); // Reset modules to clear any cached imports
  });

  it('should execute real addBookmark action via hook', async () => {
    // Use jest.isolateModules() to get real useAction (bypassing the global mock)
    // Wrap in Promise to handle async callback
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
      // Import real action
      const { addBookmark } = await import('@heyclaude/web-runtime/actions/bookmarks');

      // Register action for integration
      registerActionForIntegration(addBookmark);

      // Mock RPC result
      const mockResult = {
        success: true,
        bookmark: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: 'test-user-id',
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: 'My notes',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      (prismocker.$queryRawUnsafe as jest.Mock).mockResolvedValue([mockResult]);

      // Mock next/cache for revalidatePath/revalidateTag
      jest.doMock('next/cache', () => ({
        revalidatePath: jest.fn(),
        revalidateTag: jest.fn(),
      }));

      // Import useSafeAction in isolated module context (gets real useAction)
      const { useSafeAction } = await import('./use-safe-action');
      const { renderHook, act, waitFor } = await import('@testing-library/react');

      const { result } = renderHook(() => useSafeAction(addBookmark));

      // Execute action via hook
      await act(async () => {
        await result.current.executeAsync({
          content_type: 'agents',
          content_slug: 'test-agent',
          notes: 'My notes',
        });
      });

      // Wait for result
      await waitFor(() => {
        expect(result.current.result).toBeDefined();
      }, { timeout: 5000 });

      // Verify SafeActionResult structure
      expect(result.current.result?.data).toBeDefined();
      expect(result.current.result?.serverError).toBeUndefined();
      expect(result.current.result?.validationErrors).toBeUndefined();

      // Verify result data
      expect(result.current.result?.data?.success).toBe(true);
      expect(result.current.result?.data?.bookmark).toBeDefined();

      // Verify RPC was called
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('add_bookmark'),
        'test-user-id', // From safemocker auth context
        'agents',
        'test-agent',
        'My notes'
      );

      // Verify fetch was intercepted (action was called via hook)
      expect(fetchSpy).toHaveBeenCalled();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('should handle validation errors from real action', async () => {
    // Use jest.isolateModules() to get real useAction (bypassing the global mock)
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
      // Import real action
      const { addBookmark } = await import('@heyclaude/web-runtime/actions/bookmarks');

      // Register action for integration
      registerActionForIntegration(addBookmark);

      // Import useSafeAction in isolated module context (gets real useAction)
      const { useSafeAction } = await import('./use-safe-action');
      const { renderHook, act, waitFor } = await import('@testing-library/react');

      const { result } = renderHook(() => useSafeAction(addBookmark));

      // Execute with invalid input (missing required fields)
      await act(async () => {
        await result.current.executeAsync({
          // Missing content_type and content_slug
        } as any);
      });

      // Wait for result
      await waitFor(() => {
        expect(result.current.result).toBeDefined();
      }, { timeout: 5000 });

      // Verify validation errors in SafeActionResult
      // useAction returns validationErrors (not fieldErrors from safemocker)
      expect(result.current.result?.validationErrors).toBeDefined();
      expect(result.current.result?.data).toBeUndefined();
      expect(result.current.result?.serverError).toBeUndefined();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('should handle server errors from real action', async () => {
    // Use jest.isolateModules() to get real useAction (bypassing the global mock)
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
      // Import real action
      const { addBookmark } = await import('@heyclaude/web-runtime/actions/bookmarks');

      // Register action for integration
      registerActionForIntegration(addBookmark);

      // Mock RPC to throw error
      (prismocker.$queryRawUnsafe as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // Mock next/cache
      jest.doMock('next/cache', () => ({
        revalidatePath: jest.fn(),
        revalidateTag: jest.fn(),
      }));

      // Import useSafeAction in isolated module context (gets real useAction)
      const { useSafeAction } = await import('./use-safe-action');
      const { renderHook, act, waitFor } = await import('@testing-library/react');

      const { result } = renderHook(() => useSafeAction(addBookmark));

      // Execute action
      await act(async () => {
        await result.current.executeAsync({
          content_type: 'agents',
          content_slug: 'test-agent',
        });
      });

      // Wait for result
      await waitFor(() => {
        expect(result.current.result).toBeDefined();
      }, { timeout: 5000 });

      // Verify server error in SafeActionResult
      expect(result.current.result?.serverError).toBeDefined();
      expect(result.current.result?.data).toBeUndefined();
      expect(result.current.result?.validationErrors).toBeUndefined();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
});
