import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect';

describe('useIsomorphicLayoutEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be useLayoutEffect in browser environment', () => {
    // In browser (window is defined), should use useLayoutEffect
    expect(typeof window).not.toBe('undefined');

    // The hook should be defined
    expect(typeof useIsomorphicLayoutEffect).toBe('function');

    // Test that it executes (useLayoutEffect behavior)
    const effect = vi.fn();
    const cleanup = vi.fn();

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
    const effect = vi.fn();

    renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        effect();
      }, []);
    });

    expect(effect).toHaveBeenCalledOnce();
  });

  it('should execute cleanup on unmount', () => {
    const cleanup = vi.fn();

    const { unmount } = renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        return cleanup;
      }, []);
    });

    unmount();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('should re-run effect when dependencies change', () => {
    const effect = vi.fn();

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
    const effect = vi.fn();

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
    const effect = vi.fn();

    const { unmount } = renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        effect();
      }, []);
    });

    expect(effect).toHaveBeenCalled();
    unmount(); // Should not throw
  });

  it('should handle effect with async cleanup', () => {
    const cleanup = vi.fn();

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
});
