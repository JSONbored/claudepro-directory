import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUnmount } from './use-unmount';

describe('useUnmount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute cleanup function on unmount', () => {
    const cleanup = vi.fn();

    const { unmount } = renderHook(() => {
      useUnmount(cleanup);
    });

    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledOnce();
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
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();

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
    expect(cleanup2).toHaveBeenCalledOnce();
  });

  it('should handle multiple unmount calls gracefully', () => {
    const cleanup = vi.fn();

    const { unmount } = renderHook(() => {
      useUnmount(cleanup);
    });

    unmount();
    expect(cleanup).toHaveBeenCalledOnce();

    // Calling unmount again should not throw
    expect(() => unmount()).not.toThrow();
  });

  it('should handle cleanup function that throws', () => {
    const cleanup = vi.fn(() => {
      throw new Error('Cleanup error');
    });

    const { unmount } = renderHook(() => {
      useUnmount(cleanup);
    });

    // Should not throw, but cleanup should be called
    expect(() => unmount()).not.toThrow();
    expect(cleanup).toHaveBeenCalled();
  });

  it('should handle cleanup function that returns a value', () => {
    const cleanup = vi.fn(() => {
      return 'some value';
    });

    const { unmount } = renderHook(() => {
      useUnmount(cleanup);
    });

    unmount();

    expect(cleanup).toHaveBeenCalled();
  });

  it('should not execute cleanup on re-render', () => {
    const cleanup = vi.fn();

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
});
