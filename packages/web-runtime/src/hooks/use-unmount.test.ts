/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useUnmount } from './use-unmount';

describe('useUnmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute cleanup function on unmount', () => {
    const cleanup = jest.fn();

    const { unmount } = renderHook(() => {
      useUnmount(cleanup);
    });

    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should throw error if non-function is passed', () => {
    expect(() => {
      renderHook(() => {
        // @ts-expect-error - Testing invalid input
        useUnmount('not a function');
      });
    }).toThrow('useUnmount: Expected a function, received string');

    expect(() => {
      renderHook(() => {
        // @ts-expect-error - Testing invalid input
        useUnmount(null);
      });
    }).toThrow('useUnmount: Expected a function, received object');

    expect(() => {
      renderHook(() => {
        // @ts-expect-error - Testing invalid input
        useUnmount(undefined);
      });
    }).toThrow('useUnmount: Expected a function, received undefined');
  });

  it('should use latest function version (avoid stale closures)', () => {
    const cleanup1 = jest.fn();
    const cleanup2 = jest.fn();

    const { rerender, unmount } = renderHook(
      ({ fn }) => {
        useUnmount(fn);
      },
      { initialProps: { fn: cleanup1 } }
    );

    rerender({ fn: cleanup2 });

    unmount();

    // Should call the latest function (cleanup2), not cleanup1
    expect(cleanup1).not.toHaveBeenCalled();
    expect(cleanup2).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple unmount calls gracefully', () => {
    const cleanup = jest.fn();

    const { unmount } = renderHook(() => {
      useUnmount(cleanup);
    });

    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);

    // Calling unmount again should not throw
    expect(() => unmount()).not.toThrow();
  });

  it('should handle cleanup function that throws', () => {
    const cleanup = jest.fn(() => {
      throw new Error('Cleanup error');
    });

    const { unmount } = renderHook(() => {
      useUnmount(cleanup);
    });

    // React may throw errors from cleanup functions, but cleanup should still be called
    // We'll catch the error if it's thrown
    try {
      unmount();
    } catch (error) {
      // Error is expected from cleanup function
      expect((error as Error).message).toBe('Cleanup error');
    }
    expect(cleanup).toHaveBeenCalled();
  });

  it('should handle cleanup function that returns a value', () => {
    const cleanup = jest.fn(() => {
      return 'some value';
    });

    const { unmount } = renderHook(() => {
      useUnmount(cleanup);
    });

    unmount();

    expect(cleanup).toHaveBeenCalled();
  });

  it('should not execute cleanup on re-render', () => {
    const cleanup = jest.fn();

    const { rerender } = renderHook(
      ({ value }) => {
        useUnmount(cleanup);
        return value;
      },
      { initialProps: { value: 1 } }
    );

    expect(cleanup).not.toHaveBeenCalled();

    rerender({ value: 2 });

    expect(cleanup).not.toHaveBeenCalled();
  });

  it('should handle cleanup function that accesses latest state', () => {
    let latestValue = 0;
    const cleanup = jest.fn(() => {
      // Access latest value
      const value = latestValue;
      expect(value).toBe(2);
    });

    const { rerender, unmount } = renderHook(
      ({ value }) => {
        latestValue = value;
        useUnmount(cleanup);
      },
      { initialProps: { value: 1 } }
    );

    rerender({ value: 2 });

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should handle cleanup function being updated multiple times', () => {
    const cleanup1 = jest.fn();
    const cleanup2 = jest.fn();
    const cleanup3 = jest.fn();

    const { rerender, unmount } = renderHook(
      ({ fn }) => {
        useUnmount(fn);
      },
      { initialProps: { fn: cleanup1 } }
    );

    rerender({ fn: cleanup2 });
    rerender({ fn: cleanup3 });

    unmount();

    // Should only call the latest function
    expect(cleanup1).not.toHaveBeenCalled();
    expect(cleanup2).not.toHaveBeenCalled();
    expect(cleanup3).toHaveBeenCalledTimes(1);
  });
});
