import { describe, it, expect } from 'vitest';
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
        if (isMounted()) {
          resolve();
        }
      }, 100);
    });

    // Unmount before promise resolves
    unmount();

    await promise;

    expect(isMounted()).toBe(false);
  });
});
