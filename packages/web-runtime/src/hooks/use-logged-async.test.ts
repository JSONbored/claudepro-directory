import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoggedAsync } from './use-logged-async';
import type { UseLoggedAsyncOptions } from './use-logged-async';

// Mock dependencies
const mockError = vi.fn();
const mockWarn = vi.fn();
const mockLogger = {
  error: mockError,
  warn: mockWarn,
  info: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(),
};

vi.mock('../logger', () => ({
  logger: mockLogger,
}));

vi.mock('../errors', () => ({
  normalizeError: vi.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

describe('useLoggedAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a function', () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    expect(typeof result.current).toBe('function');
  });

  it('should execute successful operation', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const operation = vi.fn(async () => 'success');

    await act(async () => {
      const value = await result.current(operation);
      expect(value).toBe('success');
    });

    expect(operation).toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('should log error on failure', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation);
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
      }),
      '[TestComponent] Async operation failed'
    );
  });

  it('should use default message', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
        defaultMessage: 'Custom default message',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation);
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalledWith(
      expect.any(Object),
      '[TestComponent] Custom default message'
    );
  });

  it('should use custom message for run', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation, { message: 'Custom run message' });
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalledWith(
      expect.any(Object),
      '[TestComponent] Custom run message'
    );
  });

  it('should use warn level when specified', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
        defaultLevel: 'warn',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation);
      } catch {
        // Expected to throw
      }
    });

    expect(mockWarn).toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it('should override level for specific run', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
        defaultLevel: 'error',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation, { level: 'warn' });
      } catch {
        // Expected to throw
      }
    });

    expect(mockWarn).toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it('should rethrow error by default', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      await expect(result.current(operation)).rejects.toThrow('Async operation failed');
    });
  });

  it('should not rethrow when defaultRethrow is false', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
        defaultRethrow: false,
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      const value = await result.current(operation);
      expect(value).toBeUndefined();
    });

    expect(mockError).toHaveBeenCalled();
  });

  it('should override rethrow for specific run', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
        defaultRethrow: true,
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      const value = await result.current(operation, { rethrow: false });
      expect(value).toBeUndefined();
    });
  });

  it('should call onError callback', async () => {
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
        onError,
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation);
      } catch {
        // Expected to throw
      }
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should include context in log', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation, {
          context: { userId: '123', action: 'test' },
        });
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '123',
        action: 'test',
      }),
      expect.any(String)
    );
  });

  it('should sanitize context (remove undefined values)', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = vi.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation, {
          context: { userId: '123', optional: undefined },
        });
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '123',
      }),
      expect.any(String)
    );

    expect(mockError).not.toHaveBeenCalledWith(
      expect.objectContaining({
        optional: undefined,
      }),
      expect.any(String)
    );
  });

  it('should return stable function reference', () => {
    const { result, rerender } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const firstRunner = result.current;

    rerender();

    const secondRunner = result.current;

    expect(firstRunner).toBe(secondRunner);
  });
});
