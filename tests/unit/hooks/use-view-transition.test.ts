/**
 * View Transitions API Hook Tests
 *
 * Tests for the useViewTransition hook which provides browser feature
 * detection and progressive enhancement for the View Transitions API.
 *
 * Coverage:
 * - Browser support detection
 * - Transition execution with supported API
 * - Graceful fallback when API not supported
 * - Error handling
 * - SSR safety
 *
 * @see src/hooks/use-view-transition.ts
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useViewTransition } from '@/src/hooks/use-view-transition';

describe('useViewTransition', () => {
  let originalStartViewTransition: typeof document.startViewTransition | undefined;

  beforeEach(() => {
    // Store original value
    originalStartViewTransition = (document as Document & { startViewTransition?: unknown })
      .startViewTransition as typeof document.startViewTransition | undefined;
  });

  afterEach(() => {
    // Restore original value
    if (originalStartViewTransition === undefined) {
      (document as Document & { startViewTransition?: unknown }).startViewTransition = undefined;
    } else {
      (document as Document & { startViewTransition?: unknown }).startViewTransition =
        originalStartViewTransition;
    }
    vi.restoreAllMocks();
  });

  describe('Browser Support Detection', () => {
    it('should detect View Transitions API support', () => {
      // Mock supported browser by adding startViewTransition
      Object.defineProperty(document, 'startViewTransition', {
        value: vi.fn(),
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useViewTransition());

      expect(result.current.isSupported).toBe(true);
    });

    it('should detect lack of View Transitions API support', () => {
      // Remove startViewTransition to simulate unsupported browser
      const originalMethod = document.startViewTransition;

      // @ts-expect-error - Testing unsupported environment
      delete document.startViewTransition;

      const { result } = renderHook(() => useViewTransition());

      expect(result.current.isSupported).toBe(false);

      // Restore
      if (originalMethod) {
        document.startViewTransition = originalMethod;
      }
    });

    it('should handle SSR environment safely', () => {
      // Mock SSR by removing startViewTransition
      const originalMethod = document.startViewTransition;

      // @ts-expect-error - Testing unsupported environment
      delete document.startViewTransition;

      const { result } = renderHook(() => useViewTransition());

      expect(result.current.isSupported).toBe(false);

      // Restore
      if (originalMethod) {
        document.startViewTransition = originalMethod;
      }
    });

    it('should memoize support detection', () => {
      Object.defineProperty(document, 'startViewTransition', {
        value: vi.fn(),
        writable: true,
        configurable: true,
      });

      const { result, rerender } = renderHook(() => useViewTransition());

      const firstSupported = result.current.isSupported;
      rerender();
      const secondSupported = result.current.isSupported;

      expect(firstSupported).toBe(secondSupported);
    });
  });

  describe('Transition Execution - Supported API', () => {
    it('should call startViewTransition when supported', () => {
      const mockStartViewTransition = vi.fn().mockReturnValue({
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      });

      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useViewTransition());
      const updateCallback = vi.fn();

      act(() => {
        result.current.startTransition(updateCallback);
      });

      expect(mockStartViewTransition).toHaveBeenCalledWith(updateCallback);
      expect(mockStartViewTransition).toHaveBeenCalledTimes(1);
    });

    it('should return ViewTransition object when supported', () => {
      const mockViewTransition = {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      };

      Object.defineProperty(document, 'startViewTransition', {
        value: vi.fn().mockReturnValue(mockViewTransition),
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useViewTransition());

      const transition = result.current.startTransition(() => {
        // Empty callback for testing
      });

      expect(transition).toBe(mockViewTransition);
    });

    it('should execute async update callbacks', async () => {
      const mockStartViewTransition = vi.fn((cb) => {
        cb();
        return {
          finished: Promise.resolve(),
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
        };
      });

      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useViewTransition());
      const asyncCallback = vi.fn().mockResolvedValue(undefined);

      await act(async () => {
        result.current.startTransition(asyncCallback);
      });

      expect(mockStartViewTransition).toHaveBeenCalledWith(asyncCallback);
    });
  });

  describe('Fallback Behavior - Unsupported API', () => {
    it('should execute callback immediately when not supported', async () => {
      // Remove startViewTransition to simulate unsupported browser
      const originalMethod = document.startViewTransition;

      // @ts-expect-error - Testing unsupported environment
      delete document.startViewTransition;

      const { result } = renderHook(() => useViewTransition());
      const updateCallback = vi.fn();

      await act(async () => {
        result.current.startTransition(updateCallback);
      });

      expect(updateCallback).toHaveBeenCalled();

      // Restore
      if (originalMethod) {
        document.startViewTransition = originalMethod;
      }
    });

    it('should return undefined when not supported', () => {
      (document as Document & { startViewTransition?: unknown }).startViewTransition = undefined;

      const { result } = renderHook(() => useViewTransition());

      const transition = result.current.startTransition(() => {
        // Empty callback for testing
      });

      expect(transition).toBeUndefined();
    });

    it('should handle async callbacks in fallback mode', async () => {
      (document as Document & { startViewTransition?: unknown }).startViewTransition = undefined;

      const { result } = renderHook(() => useViewTransition());
      const asyncCallback = vi.fn().mockResolvedValue('result');

      await act(async () => {
        const transition = result.current.startTransition(asyncCallback);
        expect(transition).toBeUndefined();
      });

      // Give promise time to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(asyncCallback).toHaveBeenCalled();
    });

    it('should silently handle errors in fallback mode', async () => {
      (document as Document & { startViewTransition?: unknown }).startViewTransition = undefined;

      const { result } = renderHook(() => useViewTransition());
      const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'));

      // Should not throw
      await act(async () => {
        result.current.startTransition(errorCallback);
      });

      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should fallback to immediate execution on API error', async () => {
      const mockStartViewTransition = vi.fn().mockImplementation(() => {
        throw new Error('View Transition failed');
      });

      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useViewTransition());
      const updateCallback = vi.fn();

      // Should not throw
      await act(async () => {
        const transition = result.current.startTransition(updateCallback);
        expect(transition).toBeUndefined();
      });

      // Give promise time to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(updateCallback).toHaveBeenCalled();
    });

    it('should return undefined on API error', () => {
      Object.defineProperty(document, 'startViewTransition', {
        value: vi.fn().mockImplementation(() => {
          throw new Error('API Error');
        }),
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useViewTransition());

      const transition = result.current.startTransition(() => {
        // Empty callback for testing
      });

      expect(transition).toBeUndefined();
    });

    it('should suppress console warnings in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // Suppress console warnings in test
      });

      Object.defineProperty(document, 'startViewTransition', {
        value: vi.fn().mockImplementation(() => {
          throw new Error('Test error');
        }),
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useViewTransition());

      act(() => {
        result.current.startTransition(() => {
          // Empty callback for testing
        });
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Callback Stability', () => {
    it('should maintain stable startTransition reference', () => {
      Object.defineProperty(document, 'startViewTransition', {
        value: vi.fn(),
        writable: true,
        configurable: true,
      });

      const { result, rerender } = renderHook(() => useViewTransition());

      const firstRef = result.current.startTransition;
      rerender();
      const secondRef = result.current.startTransition;

      expect(firstRef).toBe(secondRef);
    });

    it('should work with multiple sequential transitions', () => {
      const mockStartViewTransition = vi.fn().mockReturnValue({
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      });

      Object.defineProperty(document, 'startViewTransition', {
        value: mockStartViewTransition,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useViewTransition());

      act(() => {
        result.current.startTransition(() => {
          // Empty callback for testing
        });
        result.current.startTransition(() => {
          // Empty callback for testing
        });
        result.current.startTransition(() => {
          // Empty callback for testing
        });
      });

      expect(mockStartViewTransition).toHaveBeenCalledTimes(3);
    });
  });
});
