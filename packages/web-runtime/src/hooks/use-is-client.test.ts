import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsClient } from './use-is-client.ts';

describe('useIsClient', () => {
  beforeEach(() => {
    // Ensure we're in a client environment
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    delete (global as any).window;
  });

  it('should return false initially (SSR)', () => {
    // Simulate SSR by removing window
    delete (global as any).window;

    const { result } = renderHook(() => useIsClient());

    expect(result.current).toBe(false);
  });

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
});
