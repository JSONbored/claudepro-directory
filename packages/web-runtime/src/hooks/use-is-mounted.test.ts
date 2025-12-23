/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsMounted } from './use-is-mounted.ts';

describe('useIsMounted', () => {
  it('should return true when component is mounted', () => {
    const { result } = renderHook(() => useIsMounted());

    expect(result.current()).toBe(true);
  });

  it('should return false after component unmounts', () => {
    const { result, unmount } = renderHook(() => useIsMounted());

    expect(result.current()).toBe(true);

    unmount();

    expect(result.current()).toBe(false);
  });

  it('should maintain stable function reference', () => {
    const { result, rerender } = renderHook(() => useIsMounted());
    const firstIsMounted = result.current;

    rerender();

    expect(result.current).toBe(firstIsMounted);
  });

  it('should work correctly in async operations', async () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    const isMounted = result.current;

    const promise = new Promise<void>((resolve) => {
      setTimeout(() => {
        // Always resolve, but check mount state
        resolve();
      }, 100);
    });

    // Unmount before promise resolves
    unmount();

    await promise;

    // Should report unmounted after unmount
    expect(isMounted()).toBe(false);
  });

  it('should handle multiple mount/unmount cycles', () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    const isMounted = result.current;

    // First mount
    expect(isMounted()).toBe(true);

    // First unmount
    unmount();
    expect(isMounted()).toBe(false);

    // Remount
    const { result: result2, unmount: unmount2 } = renderHook(() => useIsMounted());
    const isMounted2 = result2.current;
    expect(isMounted2()).toBe(true);

    // Second unmount
    unmount2();
    expect(isMounted2()).toBe(false);
  });

  it('should work correctly with multiple hook instances', () => {
    const { result: result1, unmount: unmount1 } = renderHook(() => useIsMounted());
    const { result: result2, unmount: unmount2 } = renderHook(() => useIsMounted());
    const { result: result3, unmount: unmount3 } = renderHook(() => useIsMounted());

    const isMounted1 = result1.current;
    const isMounted2 = result2.current;
    const isMounted3 = result3.current;

    // All should be mounted
    expect(isMounted1()).toBe(true);
    expect(isMounted2()).toBe(true);
    expect(isMounted3()).toBe(true);

    // Unmount one
    unmount1();
    expect(isMounted1()).toBe(false);
    expect(isMounted2()).toBe(true);
    expect(isMounted3()).toBe(true);

    // Unmount another
    unmount2();
    expect(isMounted1()).toBe(false);
    expect(isMounted2()).toBe(false);
    expect(isMounted3()).toBe(true);

    // Unmount last
    unmount3();
    expect(isMounted1()).toBe(false);
    expect(isMounted2()).toBe(false);
    expect(isMounted3()).toBe(false);
  });

  it('should handle rapid mount/unmount cycles', () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    const isMounted = result.current;

    expect(isMounted()).toBe(true);
    unmount();
    expect(isMounted()).toBe(false);

    const { result: result2, unmount: unmount2 } = renderHook(() => useIsMounted());
    const isMounted2 = result2.current;

    expect(isMounted2()).toBe(true);
    unmount2();
    expect(isMounted2()).toBe(false);

    const { result: result3, unmount: unmount3 } = renderHook(() => useIsMounted());
    const isMounted3 = result3.current;

    expect(isMounted3()).toBe(true);
    unmount3();
    expect(isMounted3()).toBe(false);
  });

  it('should maintain stable function reference across rerenders', () => {
    const { result, rerender } = renderHook(() => useIsMounted());
    const firstIsMounted = result.current;

    // Multiple rerenders
    rerender();
    expect(result.current).toBe(firstIsMounted);

    rerender();
    expect(result.current).toBe(firstIsMounted);

    rerender();
    expect(result.current).toBe(firstIsMounted);

    // Function should still work
    expect(result.current()).toBe(true);
  });

  it('should work correctly with multiple async operations', async () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    const isMounted = result.current;

    const promises = [
      new Promise<void>((resolve) => {
        setTimeout(() => {
          // Always resolve, but check mount state
          resolve();
        }, 50);
      }),
      new Promise<void>((resolve) => {
        setTimeout(() => {
          // Always resolve, but check mount state
          resolve();
        }, 100);
      }),
      new Promise<void>((resolve) => {
        setTimeout(() => {
          // Always resolve, but check mount state
          resolve();
        }, 150);
      }),
    ];

    // Unmount before promises resolve
    unmount();

    // Wait for all promises
    await Promise.allSettled(promises);

    // All should report unmounted
    expect(isMounted()).toBe(false);
  });

  it('should correctly track mount state during component lifecycle', () => {
    const { result, rerender, unmount } = renderHook(() => useIsMounted());
    const isMounted = result.current;

    // Initially mounted
    expect(isMounted()).toBe(true);

    // Still mounted after rerender
    rerender();
    expect(isMounted()).toBe(true);

    // Still mounted after another rerender
    rerender();
    expect(isMounted()).toBe(true);

    // Unmounted after unmount
    unmount();
    expect(isMounted()).toBe(false);

    // Still unmounted after trying to call again
    expect(isMounted()).toBe(false);
  });

  it('should prevent state updates after unmount in async scenarios', async () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    const isMounted = result.current;

    let stateUpdated = false;

    const asyncOperation = new Promise<void>((resolve) => {
      setTimeout(() => {
        if (isMounted()) {
          stateUpdated = true;
        }
        resolve();
      }, 100);
    });

    // Unmount before async operation completes
    unmount();

    await asyncOperation;

    // State should not be updated because component was unmounted
    expect(stateUpdated).toBe(false);
    expect(isMounted()).toBe(false);
  });

  it('should allow state updates when mounted in async scenarios', async () => {
    const { result } = renderHook(() => useIsMounted());
    const isMounted = result.current;

    let stateUpdated = false;

    const asyncOperation = new Promise<void>((resolve) => {
      setTimeout(() => {
        if (isMounted()) {
          stateUpdated = true;
        }
        resolve();
      }, 100);
    });

    // Component remains mounted
    await asyncOperation;

    // State should be updated because component is still mounted
    expect(stateUpdated).toBe(true);
    expect(isMounted()).toBe(true);
  });
});
