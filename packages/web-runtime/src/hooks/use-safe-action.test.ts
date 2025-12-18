import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSafeAction } from './use-safe-action';

// Mock next-safe-action
const mockExecute = vi.fn();
const mockExecuteAsync = vi.fn();
const mockReset = vi.fn();

const mockUseAction = vi.fn(() => ({
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

vi.mock('next-safe-action/hooks', () => ({
  useAction: mockUseAction,
}));

describe('useSafeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return hook result from useAction', () => {
    const mockAction = vi.fn(async (input: { value: string }) => ({
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
    const mockAction = vi.fn(async (input: { value: string }) => ({
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

    const mockAction = vi.fn(async (input: { value: string }) => ({
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

    const mockAction = vi.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current.status).toBe('executing');
    expect(result.current.isExecuting).toBe(true);
    expect(result.current.isPending).toBe(true);
  });

  it('should pass callbacks to useAction', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onSettled = vi.fn();
    const onExecute = vi.fn();

    const mockAction = vi.fn(async (input: { value: string }) => ({
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
    const mockAction = vi.fn(async (input: { value: string }) => ({
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

    const mockAction = vi.fn(async (input: ActionInput): Promise<{ data?: ActionOutput }> => ({
      data: { success: true, id: '123' },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    // TypeScript should infer types correctly
    act(() => {
      result.current.execute({ userId: 'user-1', value: 42 });
    });

    expect(mockExecute).toHaveBeenCalledWith({ userId: 'user-1', value: 42 });
  });

  it('should handle actions without data property', async () => {
    const mockAction = vi.fn(async () => {
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

    const mockAction = vi.fn(async () => ({
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

    const mockAction = vi.fn(async () => ({
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

    const mockAction = vi.fn(async (input: { value: string }) => ({
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

    const mockAction = vi.fn(async (input: { value: string }) => ({
      data: { result: input.value },
    }));

    const { result } = renderHook(() => useSafeAction(mockAction));

    expect(result.current.result).toEqual({ data: { result: 'success' } });
    expect(result.current.hasSucceeded).toBe(true);
  });
});
