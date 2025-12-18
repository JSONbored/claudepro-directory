import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewTransition } from './use-view-transition';

// Mock dependencies
vi.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  isDevelopment: false,
}));

vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock('../errors', () => ({
  normalizeError: vi.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

vi.mock('../utils/client-logger', () => ({
  logClientWarn: vi.fn(),
}));

describe('useViewTransition', () => {
  let mockStartViewTransition: ReturnType<typeof vi.fn>;
  let mockViewTransition: {
    updateCallback: () => void | Promise<void>;
    finished: Promise<void>;
    ready: Promise<void>;
    skipTransition: () => void;
  };

  beforeEach(() => {
    mockViewTransition = {
      updateCallback: vi.fn(),
      finished: Promise.resolve(),
      ready: Promise.resolve(),
      skipTransition: vi.fn(),
    };

    mockStartViewTransition = vi.fn((callback: () => void | Promise<void>) => {
      mockViewTransition.updateCallback = callback;
      return mockViewTransition;
    });

    Object.defineProperty(document, 'startViewTransition', {
      value: mockStartViewTransition,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    const updateCallback = vi.fn();

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

    const updateCallback = vi.fn();

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
    const updateCallback = vi.fn(async () => {
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

    const updateCallback = vi.fn();

    const { result } = renderHook(() => useViewTransition());

    act(() => {
      result.current.startTransition(updateCallback);
    });

    // Should fallback to immediate execution
    expect(updateCallback).toHaveBeenCalled();
  });

  it('should handle SSR (document undefined)', () => {
    const originalDocument = global.document;
    // @ts-expect-error - Intentionally setting document to undefined for SSR test
    global.document = undefined;

    const { result } = renderHook(() => useViewTransition());

    expect(result.current.isSupported).toBe(false);

    const updateCallback = vi.fn();

    act(() => {
      result.current.startTransition(updateCallback);
    });

    // Should not throw
    expect(result.current.isSupported).toBe(false);

    // Restore
    global.document = originalDocument;
  });

  it('should handle fallback update errors', async () => {
    const { logClientWarn } = await import('../utils/client-logger');
    delete (document as any).startViewTransition;

    const updateCallback = vi.fn(() => {
      throw new Error('Update failed');
    });

    const { result } = renderHook(() => useViewTransition());

    act(() => {
      result.current.startTransition(updateCallback);
    });

    // Should log warning but not throw
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(logClientWarn).toHaveBeenCalled();
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useViewTransition());

    const firstStartTransition = result.current.startTransition;

    rerender();

    const secondStartTransition = result.current.startTransition;

    expect(firstStartTransition).toBe(secondStartTransition);
  });
});
