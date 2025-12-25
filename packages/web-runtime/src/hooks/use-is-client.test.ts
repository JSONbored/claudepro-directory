/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsClient } from './use-is-client.ts';

describe('useIsClient', () => {
  it('should return true after mount (client)', async () => {
    const { result } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should only change once after mount', async () => {
    const { result, rerender } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    const firstValue = result.current;
    rerender();

    // Should remain true after initial change
    expect(result.current).toBe(true);
    expect(result.current).toBe(firstValue);
  });

  it('should remain true on multiple rerenders', async () => {
    const { result, rerender } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Rerender multiple times
    rerender();
    expect(result.current).toBe(true);

    rerender();
    expect(result.current).toBe(true);

    rerender();
    expect(result.current).toBe(true);
  });

  it('should work correctly with multiple hook instances', async () => {
    const { result: result1 } = renderHook(() => useIsClient());
    const { result: result2 } = renderHook(() => useIsClient());
    const { result: result3 } = renderHook(() => useIsClient());

    // All should become true after mount (in jsdom, useEffect runs synchronously)
    await waitFor(() => {
      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
      expect(result3.current).toBe(true);
    });
  });

  it('should be stable across component lifecycle', async () => {
    const { result, unmount, rerender } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    const valueBeforeRerender = result.current;
    rerender();
    expect(result.current).toBe(valueBeforeRerender);
    expect(result.current).toBe(true);

    // Unmount and remount - new instance should become true after mount
    unmount();
    const { result: result2 } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result2.current).toBe(true);
    });
  });

  it('should handle rapid mount/unmount cycles', async () => {
    const { result, unmount } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    unmount();

    const { result: result2 } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result2.current).toBe(true);
    });

    unmount();

    const { result: result3 } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result3.current).toBe(true);
    });
  });
});
