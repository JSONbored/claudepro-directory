/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useLoggedAsync } from './use-logged-async';
import type { UseLoggedAsyncOptions } from './use-logged-async';

// Mock dependencies - define mocks directly in jest.mock()
jest.mock('../logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(),
  },
}));

jest.mock('../errors', () => ({
  normalizeError: jest.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

describe('useLoggedAsync', () => {
  let mockError: ReturnType<typeof jest.fn>;
  let mockWarn: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get mocks from logger module
    const { logger } = jest.requireMock('../logger');
    mockError = logger.error;
    mockWarn = logger.warn;
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    const operation = jest.fn(async () => 'success');

    await act(async () => {
      const value = await result.current(operation);
      expect(value).toBe('success');
    });

    expect(operation).toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('should execute successful operation with different return types', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    // Test with number
    const numberOperation = jest.fn(async () => 42);
    await act(async () => {
      const value = await result.current(numberOperation);
      expect(value).toBe(42);
    });

    // Test with object
    const objectOperation = jest.fn(async () => ({ id: '123', name: 'test' }));
    await act(async () => {
      const value = await result.current(objectOperation);
      expect(value).toEqual({ id: '123', name: 'test' });
    });

    // Test with null
    const nullOperation = jest.fn(async () => null);
    await act(async () => {
      const value = await result.current(nullOperation);
      expect(value).toBeNull();
    });

    // Test with undefined
    const undefinedOperation = jest.fn(async () => undefined);
    await act(async () => {
      const value = await result.current(undefinedOperation);
      expect(value).toBeUndefined();
    });
  });

  it('should log error on failure', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = jest.fn(async () => {
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

  it('should handle non-Error exceptions', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    // Test with string error
    const stringErrorOperation = jest.fn(async () => {
      throw 'String error';
    });

    await act(async () => {
      try {
        await result.current(stringErrorOperation);
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalled();

    // Test with object error
    const objectErrorOperation = jest.fn(async () => {
      throw { code: 'ERROR', message: 'Object error' };
    });

    await act(async () => {
      try {
        await result.current(objectErrorOperation);
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalledTimes(2);
  });

  it('should use default message', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
        defaultMessage: 'Custom default message',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = jest.fn(async () => {
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
    const operation = jest.fn(async () => {
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
    const operation = jest.fn(async () => {
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
    const operation = jest.fn(async () => {
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
    const operation = jest.fn(async () => {
      throw error;
    });

    await act(async () => {
      await expect(result.current(operation)).rejects.toThrow('Operation failed');
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
    const operation = jest.fn(async () => {
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
    const operation = jest.fn(async () => {
      throw error;
    });

    await act(async () => {
      const value = await result.current(operation, { rethrow: false });
      expect(value).toBeUndefined();
    });
  });

  it('should call onError callback', async () => {
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
        onError,
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = jest.fn(async () => {
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
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('should call onError callback even when rethrow is false', async () => {
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
        onError,
        defaultRethrow: false,
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = jest.fn(async () => {
      throw error;
    });

    await act(async () => {
      await result.current(operation);
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
    const operation = jest.fn(async () => {
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
    const operation = jest.fn(async () => {
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

  it('should handle empty context', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = jest.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation, {
          context: {},
        });
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalled();
  });

  it('should handle context with all undefined values', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = jest.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation, {
          context: { field1: undefined, field2: undefined },
        });
      } catch {
        // Expected to throw
      }
    });

    // Context should be sanitized to undefined (no context passed)
    expect(mockError).toHaveBeenCalled();
  });

  it('should handle context with different value types', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = jest.fn(async () => {
      throw error;
    });

    await act(async () => {
      try {
        await result.current(operation, {
          context: {
            stringValue: 'test',
            numberValue: 42,
            booleanValue: true,
            undefinedValue: undefined,
          },
        });
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalledWith(
      expect.objectContaining({
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
      }),
      expect.any(String)
    );

    expect(mockError).not.toHaveBeenCalledWith(
      expect.objectContaining({
        undefinedValue: undefined,
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

  it('should return new function reference when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ scope, defaultMessage, defaultLevel, defaultRethrow, onError }) =>
        useLoggedAsync({
          scope,
          defaultMessage,
          defaultLevel,
          defaultRethrow,
          onError,
        } as UseLoggedAsyncOptions),
      {
        initialProps: {
          scope: 'TestComponent',
          defaultMessage: 'Message 1',
          defaultLevel: 'error' as const,
          defaultRethrow: true,
          onError: undefined,
        },
      }
    );

    const firstRunner = result.current;

    // Change scope
    rerender({
      scope: 'OtherComponent',
      defaultMessage: 'Message 1',
      defaultLevel: 'error' as const,
      defaultRethrow: true,
      onError: undefined,
    });

    const secondRunner = result.current;
    expect(secondRunner).not.toBe(firstRunner);

    // Change defaultMessage
    rerender({
      scope: 'OtherComponent',
      defaultMessage: 'Message 2',
      defaultLevel: 'error' as const,
      defaultRethrow: true,
      onError: undefined,
    });

    const thirdRunner = result.current;
    expect(thirdRunner).not.toBe(secondRunner);

    // Change defaultLevel
    rerender({
      scope: 'OtherComponent',
      defaultMessage: 'Message 2',
      defaultLevel: 'warn' as const,
      defaultRethrow: true,
      onError: undefined,
    });

    const fourthRunner = result.current;
    expect(fourthRunner).not.toBe(thirdRunner);

    // Change defaultRethrow
    rerender({
      scope: 'OtherComponent',
      defaultMessage: 'Message 2',
      defaultLevel: 'warn' as const,
      defaultRethrow: false,
      onError: undefined,
    });

    const fifthRunner = result.current;
    expect(fifthRunner).not.toBe(fourthRunner);

    // Change onError
    const onError = jest.fn();
    rerender({
      scope: 'OtherComponent',
      defaultMessage: 'Message 2',
      defaultLevel: 'warn' as const,
      defaultRethrow: false,
      onError,
    });

    const sixthRunner = result.current;
    expect(sixthRunner).not.toBe(fifthRunner);
  });

  it('should handle multiple sequential operations', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const operation1 = jest.fn(async () => 'result1');
    const operation2 = jest.fn(async () => 'result2');
    const operation3 = jest.fn(async () => 'result3');

    await act(async () => {
      const value1 = await result.current(operation1);
      const value2 = await result.current(operation2);
      const value3 = await result.current(operation3);

      expect(value1).toBe('result1');
      expect(value2).toBe('result2');
      expect(value3).toBe('result3');
    });

    expect(operation1).toHaveBeenCalled();
    expect(operation2).toHaveBeenCalled();
    expect(operation3).toHaveBeenCalled();
  });

  it('should handle concurrent operations', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const operation1 = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'result1';
    });
    const operation2 = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'result2';
    });

    await act(async () => {
      const [value1, value2] = await Promise.all([
        result.current(operation1),
        result.current(operation2),
      ]);

      expect(value1).toBe('result1');
      expect(value2).toBe('result2');
    });

    expect(operation1).toHaveBeenCalled();
    expect(operation2).toHaveBeenCalled();
  });

  it('should handle operation that throws synchronously', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'TestComponent',
      } as UseLoggedAsyncOptions)
    );

    const operation = jest.fn(() => {
      throw new Error('Synchronous error');
    });

    await act(async () => {
      try {
        await result.current(operation);
      } catch {
        // Expected to throw
      }
    });

    expect(mockError).toHaveBeenCalled();
  });

  it('should handle scope with special characters', async () => {
    const { result } = renderHook(() =>
      useLoggedAsync({
        scope: 'Component-Name_123',
      } as UseLoggedAsyncOptions)
    );

    const error = new Error('Operation failed');
    const operation = jest.fn(async () => {
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
      '[Component-Name_123] Async operation failed'
    );
  });
});
