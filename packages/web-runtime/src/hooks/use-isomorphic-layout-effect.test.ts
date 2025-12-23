/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';

describe('useIsomorphicLayoutEffect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be useLayoutEffect in browser environment', () => {
    // In browser (window is defined), should use useLayoutEffect
    expect(typeof window).not.toBe('undefined');

    // The hook should be defined
    expect(typeof useIsomorphicLayoutEffect).toBe('function');

    // Test that it executes (useLayoutEffect behavior)
    const effect = jest.fn();
    const cleanup = jest.fn();

    renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        effect();
        return cleanup;
      }, []);
    });

    // Effect should have been called
    expect(effect).toHaveBeenCalled();
  });

  it('should execute effect on mount', () => {
    const effect = jest.fn();

    renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        effect();
      }, []);
    });

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('should execute cleanup on unmount', () => {
    const cleanup = jest.fn();

    const { unmount } = renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        return cleanup;
      }, []);
    });

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should re-run effect when dependencies change', () => {
    const effect = jest.fn();

    const { rerender } = renderHook(
      ({ dep }) => {
        useIsomorphicLayoutEffect(() => {
          effect();
        }, [dep]);
      },
      { initialProps: { dep: 1 } }
    );

    expect(effect).toHaveBeenCalledTimes(1);

    rerender({ dep: 2 });

    expect(effect).toHaveBeenCalledTimes(2);
  });

  it('should not re-run effect when dependencies do not change', () => {
    const effect = jest.fn();

    const { rerender } = renderHook(
      ({ dep }) => {
        useIsomorphicLayoutEffect(() => {
          effect();
        }, [dep]);
      },
      { initialProps: { dep: 1 } }
    );

    expect(effect).toHaveBeenCalledTimes(1);

    rerender({ dep: 1 });

    // Should not re-run
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('should handle effect without cleanup', () => {
    const effect = jest.fn();

    const { unmount } = renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        effect();
      }, []);
    });

    expect(effect).toHaveBeenCalled();
    unmount(); // Should not throw
  });

  it('should handle effect with async cleanup', () => {
    const cleanup = jest.fn();

    const { unmount } = renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        return () => {
          cleanup();
        };
      }, []);
    });

    unmount();

    expect(cleanup).toHaveBeenCalled();
  });

  it('should handle multiple dependencies', () => {
    const effect = jest.fn();

    const { rerender } = renderHook(
      ({ dep1, dep2 }) => {
        useIsomorphicLayoutEffect(() => {
          effect();
        }, [dep1, dep2]);
      },
      { initialProps: { dep1: 1, dep2: 'a' } }
    );

    expect(effect).toHaveBeenCalledTimes(1);

    rerender({ dep1: 1, dep2: 'b' });
    expect(effect).toHaveBeenCalledTimes(2);

    rerender({ dep1: 2, dep2: 'b' });
    expect(effect).toHaveBeenCalledTimes(3);
  });

  it('should handle empty dependency array', () => {
    const effect = jest.fn();

    const { rerender } = renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        effect();
      }, []);
    });

    expect(effect).toHaveBeenCalledTimes(1);

    rerender();

    // Should not re-run with empty deps
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('should handle effect that accesses refs', () => {
    const effect = jest.fn();
    let refValue: string | null = null;

    const { rerender } = renderHook(
      ({ value }) => {
        refValue = value;
        useIsomorphicLayoutEffect(() => {
          effect(refValue);
        }, [value]);
      },
      { initialProps: { value: 'initial' } }
    );

    expect(effect).toHaveBeenCalledWith('initial');

    rerender({ value: 'updated' });
    expect(effect).toHaveBeenCalledWith('updated');
  });
});
