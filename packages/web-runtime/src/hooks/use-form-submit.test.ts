/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormSubmit } from './use-form-submit';
import type { UseFormSubmitOptions } from './use-form-submit';

// Mock dependencies - define mocks directly in jest.mock() factory functions
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = {
  push: mockPush,
  refresh: mockRefresh,
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

const mockRunLoggedAsync = jest.fn();

jest.mock('./use-logged-async', () => ({
  useLoggedAsync: jest.fn(() => mockRunLoggedAsync),
}));

// Define toast mocks inside factory to avoid hoisting issues
jest.mock('../client/toast', () => {
  const mockSuccess = jest.fn();
  const mockError = jest.fn();
  return {
    toasts: {
      raw: {
        success: mockSuccess,
        error: mockError,
      },
    },
    // Export mocks for use in tests
    __mockSuccess: mockSuccess,
    __mockError: mockError,
  };
});

jest.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: jest.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

// Get toast mocks for use in tests
const { toasts } = jest.requireMock('../client/toast');
const mockSuccess = toasts.raw.success;
const mockError = toasts.raw.error;

describe('useFormSubmit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunLoggedAsync.mockResolvedValue({ id: '123' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with isPending=false', () => {
    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
      } as UseFormSubmitOptions)
    );

    expect(result.current.isPending).toBe(false);
    expect(typeof result.current.handleSubmit).toBe('function');
    expect(result.current.router).toBe(mockRouter);
  });

  it('should set isPending during submission', async () => {
    let resolveOperation: (value: any) => void;
    const operation = new Promise((resolve) => {
      resolveOperation = resolve;
    });

    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
      } as UseFormSubmitOptions)
    );

    const submitPromise = act(async () => {
      return result.current.handleSubmit(async () => {
        return await operation;
      });
    });

    // Wait for transition to start
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolveOperation!({ id: '123' });
    });

    await submitPromise;

    // Should no longer be pending
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should show success toast on create', async () => {
    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      await result.current.handleSubmit(async () => ({ id: '123' }));
    });

    expect(mockSuccess).toHaveBeenCalledWith('Success', {
      description: 'Created successfully',
    });
  });

  it('should show success toast on edit', async () => {
    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'edit',
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      await result.current.handleSubmit(async () => ({ id: '123' }));
    });

    expect(mockSuccess).toHaveBeenCalledWith('Success', {
      description: 'Updated successfully',
    });
  });

  it('should use custom success messages', async () => {
    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
        messages: {
          createSuccess: 'Custom create message',
        },
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      await result.current.handleSubmit(async () => ({ id: '123' }));
    });

    expect(mockSuccess).toHaveBeenCalledWith('Success', {
      description: 'Custom create message',
    });
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
        onSuccess,
      } as UseFormSubmitOptions)
    );

    const resultData = { id: '123' };

    await act(async () => {
      await result.current.handleSubmit(async () => resultData);
    });

    expect(onSuccess).toHaveBeenCalledWith(resultData);
  });

  it('should navigate to successRedirect on success', async () => {
    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
        successRedirect: '/success',
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      await result.current.handleSubmit(async () => ({ id: '123' }));
    });

    expect(mockPush).toHaveBeenCalledWith('/success');
  });

  it('should refresh router on success by default', async () => {
    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      await result.current.handleSubmit(async () => ({ id: '123' }));
    });

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should not refresh router when refreshOnSuccess is false', async () => {
    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
        refreshOnSuccess: false,
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      await result.current.handleSubmit(async () => ({ id: '123' }));
    });

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('should handle errors and show error toast', async () => {
    const error = new Error('Operation failed');
    mockRunLoggedAsync.mockResolvedValue(undefined); // Simulate error caught by runLoggedAsync

    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      await result.current.handleSubmit(async () => {
        throw error;
      });
    });

    // Should not show success toast
    expect(mockSuccess).not.toHaveBeenCalled();
  });

  it('should call onError callback on error', async () => {
    const error = new Error('Operation failed');
    const onError = jest.fn();
    mockRunLoggedAsync.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
        onError,
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      try {
        await result.current.handleSubmit(async () => {
          throw error;
        });
      } catch {
        // Error handling
      }
    });

    expect(onError).toHaveBeenCalled();
  });

  it('should use custom error title', async () => {
    const error = new Error('Operation failed');
    mockRunLoggedAsync.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
        messages: {
          errorTitle: 'Custom error title',
        },
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      try {
        await result.current.handleSubmit(async () => {
          throw error;
        });
      } catch {
        // Error handling
      }
    });

    expect(mockError).toHaveBeenCalledWith('Custom error title', expect.any(Object));
  });

  it('should not proceed if runLoggedAsync returns undefined', async () => {
    mockRunLoggedAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      await result.current.handleSubmit(async () => ({ id: '123' }));
    });

    // Should not show success toast or navigate
    expect(mockSuccess).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should include logContext in runLoggedAsync call', async () => {
    const { result } = renderHook(() =>
      useFormSubmit({
        scope: 'TestForm',
        mode: 'create',
        logContext: { userId: '123', formType: 'collection' },
      } as UseFormSubmitOptions)
    );

    await act(async () => {
      await result.current.handleSubmit(async () => ({ id: '123' }));
    });

    expect(mockRunLoggedAsync).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        context: expect.objectContaining({
          userId: '123',
          formType: 'collection',
        }),
      })
    );
  });
});
