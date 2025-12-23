/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useViewTransition } from './use-view-transition';

// Mock dependencies
jest.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  isDevelopment: false,
}));

jest.mock('../logger', () => ({
  logger: {
    warn: jest.fn(),
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

jest.mock('../utils/client-logger', () => ({
  logClientWarn: jest.fn(),
}));

describe('useViewTransition', () => {
  let mockStartViewTransition: ReturnType<typeof jest.fn>;
  let mockViewTransition: {
    updateCallback: () => void | Promise<void>;
    finished: Promise<void>;
    ready: Promise<void>;
    skipTransition: () => void;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockViewTransition = {
      updateCallback: jest.fn(),
      finished: Promise.resolve(),
      ready: Promise.resolve(),
      skipTransition: jest.fn(),
    };

    mockStartViewTransition = jest.fn((callback: () => void | Promise<void>) => {
      mockViewTransition.updateCallback = callback;
      return mockViewTransition;
    });

    Object.defineProperty(document, 'startViewTransition', {
      value: mockStartViewTransition,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should detect View Transitions API support', () => {
    const { result } = renderHook(() => useViewTransition());

    expect(result.current.isSupported).toBe(true);
  });

  it('should return false for isSupported when API is not available', () => {
    delete (document as any).startViewTransition;

    const { result } = renderHook(() => useViewTransition());

    expect(result.current.isSupported).toBe(false);
  });

  it('should start view transition when supported', () => {
    const updateCallback = jest.fn();

    const { result } = renderHook(() => useViewTransition());

    act(() => {
      result.current.startTransition(updateCallback);
    });

    expect(mockStartViewTransition).toHaveBeenCalledWith(updateCallback);
  });

  it('should return ViewTransition object when supported', () => {
    const { result } = renderHook(() => useViewTransition());

    act(() => {
      const transition = result.current.startTransition(() => {});
      expect(transition).toBe(mockViewTransition);
    });
  });

  it('should execute callback immediately when not supported', () => {
    delete (document as any).startViewTransition;

    const updateCallback = jest.fn();

    const { result } = renderHook(() => useViewTransition());

    act(() => {
      result.current.startTransition(updateCallback);
    });

    expect(updateCallback).toHaveBeenCalled();
  });

  it('should return undefined when not supported', () => {
    delete (document as any).startViewTransition;

    const { result } = renderHook(() => useViewTransition());

    act(() => {
      const transition = result.current.startTransition(() => {});
      expect(transition).toBeUndefined();
    });
  });

  it('should handle async update callbacks', async () => {
    const updateCallback = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const { result } = renderHook(() => useViewTransition());

    await act(async () => {
      await result.current.startTransition(updateCallback);
    });

    expect(mockStartViewTransition).toHaveBeenCalledWith(updateCallback);
  });

  it('should handle ViewTransition errors gracefully', async () => {
    const { logClientWarn } = await import('../utils/client-logger');
    mockStartViewTransition.mockImplementation(() => {
      throw new Error('ViewTransition failed');
    });

    const updateCallback = jest.fn();

    const { result } = renderHook(() => useViewTransition());

    act(() => {
      result.current.startTransition(updateCallback);
    });

    // Should fallback to immediate execution
    expect(updateCallback).toHaveBeenCalled();
  });

  it('should handle SSR (document undefined)', () => {
    // In jsdom, we can't actually make document undefined
    // Instead, test the behavior when startViewTransition is not available
    // (which happens when document is undefined or API is not supported)
    delete (document as any).startViewTransition;

    const { result } = renderHook(() => useViewTransition());

    expect(result.current.isSupported).toBe(false);

    const updateCallback = jest.fn();

    act(() => {
      result.current.startTransition(updateCallback);
    });

    // Should not throw, and callback should be executed immediately
    expect(result.current.isSupported).toBe(false);
    expect(updateCallback).toHaveBeenCalled();
  });

  it('should handle fallback update errors', async () => {
    const { logClientWarn } = await import('../utils/client-logger');
    delete (document as any).startViewTransition;

    // Use async callback that rejects instead of throwing synchronously
    // This matches how the hook handles errors (Promise.resolve().catch())
    const updateCallback = jest.fn(async () => {
      throw new Error('Update failed');
    });

    const { result } = renderHook(() => useViewTransition());

    // The hook calls Promise.resolve(updateCallback()).catch(...)
    // When updateCallback() returns a rejected promise, the .catch() handler runs asynchronously
    act(() => {
      result.current.startTransition(updateCallback);
    });

    // Wait for async error handling (Promise.resolve().catch() is async)
    await waitFor(() => {
      expect(logClientWarn).toHaveBeenCalledWith(
        'useViewTransition: fallback update failed (unsupported)',
        expect.any(Error),
        'useViewTransition.fallback',
        expect.objectContaining({
          component: 'useViewTransition',
        })
      );
    }, { timeout: 1000 });
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useViewTransition());

    const firstStartTransition = result.current.startTransition;

    rerender();

    const secondStartTransition = result.current.startTransition;

    expect(firstStartTransition).toBe(secondStartTransition);
  });

  it('should handle ViewTransition with ready promise', async () => {
    let readyResolve: () => void;
    const readyPromise = new Promise<void>((resolve) => {
      readyResolve = resolve;
    });

    mockViewTransition.ready = readyPromise;

    const { result } = renderHook(() => useViewTransition());

    act(() => {
      const transition = result.current.startTransition(() => {});
      expect(transition).toBe(mockViewTransition);
    });

    // Resolve ready promise
    readyResolve!();
    await readyPromise;

    expect(mockStartViewTransition).toHaveBeenCalled();
  });

  it('should handle ViewTransition with finished promise', async () => {
    let finishedResolve: () => void;
    const finishedPromise = new Promise<void>((resolve) => {
      finishedResolve = resolve;
    });

    mockViewTransition.finished = finishedPromise;

    const { result } = renderHook(() => useViewTransition());

    act(() => {
      const transition = result.current.startTransition(() => {});
      expect(transition).toBe(mockViewTransition);
    });

    // Resolve finished promise
    finishedResolve!();
    await finishedPromise;

    expect(mockStartViewTransition).toHaveBeenCalled();
  });
});
