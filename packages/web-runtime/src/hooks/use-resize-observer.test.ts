/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useResizeObserver } from './use-resize-observer';
import type { UseResizeObserverOptions } from './use-resize-observer';
import { useRef } from 'react';

describe('useResizeObserver', () => {
  let mockResizeObserver: any;
  let mockObserve: ReturnType<typeof jest.fn>;
  let mockDisconnect: ReturnType<typeof jest.fn>;
  let resizeCallback: ((entries: ResizeObserverEntry[]) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();

    mockResizeObserver = jest.fn((callback: (entries: ResizeObserverEntry[]) => void) => {
      resizeCallback = callback;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
      };
    });

    global.ResizeObserver = mockResizeObserver as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with undefined dimensions', () => {
    const ref = { current: null };

    const { result } = renderHook(() =>
      useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>)
    );

    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
  });

  it('should observe element when ref is attached', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() => useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>));

    expect(mockResizeObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalledWith(element, { box: 'content-box' });
  });

  it('should update size when element is resized', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>)
    );

    // Simulate resize
    act(() => {
      if (resizeCallback) {
        const mockEntry = {
          contentBoxSize: [{ inlineSize: 200, blockSize: 150 }],
          borderBoxSize: [],
          devicePixelContentBoxSize: [],
          contentRect: { width: 200, height: 150 },
          target: element,
        } as ResizeObserverEntry;

        resizeCallback([mockEntry]);
      }
    });

    expect(result.current.width).toBe(200);
    expect(result.current.height).toBe(150);
  });

  it('should use content-box by default', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() => useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>));

    expect(mockObserve).toHaveBeenCalledWith(element, { box: 'content-box' });
  });

  it('should use border-box when specified', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() =>
      useResizeObserver({
        ref,
        box: 'border-box',
      } as UseResizeObserverOptions<HTMLElement>)
    );

    expect(mockObserve).toHaveBeenCalledWith(element, { box: 'border-box' });
  });

  it('should use device-pixel-content-box when specified', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() =>
      useResizeObserver({
        ref,
        box: 'device-pixel-content-box',
      } as UseResizeObserverOptions<HTMLElement>)
    );

    expect(mockObserve).toHaveBeenCalledWith(element, {
      box: 'device-pixel-content-box',
    });
  });

  it('should use borderBoxSize when box is border-box', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResizeObserver({
        ref,
        box: 'border-box',
      } as UseResizeObserverOptions<HTMLElement>)
    );

    act(() => {
      if (resizeCallback) {
        const mockEntry = {
          borderBoxSize: [{ inlineSize: 250, blockSize: 200 }],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
          contentRect: { width: 200, height: 150 },
          target: element,
        } as ResizeObserverEntry;

        resizeCallback([mockEntry]);
      }
    });

    expect(result.current.width).toBe(250);
    expect(result.current.height).toBe(200);
  });

  it('should use devicePixelContentBoxSize when box is device-pixel-content-box', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResizeObserver({
        ref,
        box: 'device-pixel-content-box',
      } as UseResizeObserverOptions<HTMLElement>)
    );

    act(() => {
      if (resizeCallback) {
        const mockEntry = {
          devicePixelContentBoxSize: [{ inlineSize: 300, blockSize: 250 }],
          contentBoxSize: [],
          borderBoxSize: [],
          contentRect: { width: 200, height: 150 },
          target: element,
        } as ResizeObserverEntry;

        resizeCallback([mockEntry]);
      }
    });

    expect(result.current.width).toBe(300);
    expect(result.current.height).toBe(250);
  });

  it('should fallback to contentRect when box sizes are undefined', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>)
    );

    act(() => {
      if (resizeCallback) {
        const mockEntry = {
          contentBoxSize: [],
          borderBoxSize: [],
          devicePixelContentBoxSize: [],
          contentRect: { width: 300, height: 250 },
          target: element,
        } as ResizeObserverEntry;

        resizeCallback([mockEntry]);
      }
    });

    expect(result.current.width).toBe(300);
    expect(result.current.height).toBe(250);
  });

  it('should call onResize callback when provided', () => {
    const element = document.createElement('div');
    const ref = { current: element };
    const onResize = jest.fn();

    const { result } = renderHook(() =>
      useResizeObserver({
        ref,
        onResize,
      } as UseResizeObserverOptions<HTMLElement>)
    );

    act(() => {
      if (resizeCallback) {
        const mockEntry = {
          contentBoxSize: [{ inlineSize: 200, blockSize: 150 }],
          borderBoxSize: [],
          devicePixelContentBoxSize: [],
          contentRect: { width: 200, height: 150 },
          target: element,
        } as ResizeObserverEntry;

        resizeCallback([mockEntry]);
      }
    });

    expect(onResize).toHaveBeenCalledWith({ width: 200, height: 150 });
    // Should not update state when callback is provided
    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
  });

  it('should disconnect observer on unmount', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    const { unmount } = renderHook(() =>
      useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>)
    );

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle null ref gracefully', () => {
    const ref = { current: null };

    const { result } = renderHook(() =>
      useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>)
    );

    expect(result.current.width).toBeUndefined();
    expect(mockResizeObserver).not.toHaveBeenCalled();
  });

  it('should handle ResizeObserver not available', () => {
    const originalResizeObserver = global.ResizeObserver;
    // @ts-expect-error - Intentionally setting ResizeObserver to undefined
    global.ResizeObserver = undefined;

    const element = document.createElement('div');
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>)
    );

    expect(result.current.width).toBeUndefined();

    // Restore
    global.ResizeObserver = originalResizeObserver;
  });

  it('should handle empty entries array', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>)
    );

    act(() => {
      if (resizeCallback) {
        resizeCallback([]);
      }
    });

    // Should not update
    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
  });

  it('should update when ref changes', () => {
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    const ref = { current: element1 };

    const { rerender } = renderHook(
      ({ ref }) => useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>),
      { initialProps: { ref } }
    );

    expect(mockObserve).toHaveBeenCalledWith(element1, { box: 'content-box' });

    ref.current = element2;
    rerender({ ref });

    // Should observe new element
    expect(mockObserve).toHaveBeenCalledWith(element2, { box: 'content-box' });
  });

  it('should handle box option changing', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    const { rerender } = renderHook(
      ({ box }) => useResizeObserver({ ref, box } as UseResizeObserverOptions<HTMLElement>),
      { initialProps: { box: 'content-box' as const } }
    );

    expect(mockObserve).toHaveBeenCalledWith(element, { box: 'content-box' });

    rerender({ box: 'border-box' });

    // Should disconnect old observer and create new one
    expect(mockDisconnect).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalledWith(element, { box: 'border-box' });
  });

  it('should handle onResize callback changing', () => {
    const element = document.createElement('div');
    const ref = { current: element };
    const onResize1 = jest.fn();
    const onResize2 = jest.fn();

    const { rerender } = renderHook(
      ({ onResize }) =>
        useResizeObserver({ ref, onResize } as UseResizeObserverOptions<HTMLElement>),
      { initialProps: { onResize: onResize1 } }
    );

    act(() => {
      if (resizeCallback) {
        const mockEntry = {
          contentBoxSize: [{ inlineSize: 200, blockSize: 150 }],
          borderBoxSize: [],
          devicePixelContentBoxSize: [],
          contentRect: { width: 200, height: 150 },
          target: element,
        } as ResizeObserverEntry;

        resizeCallback([mockEntry]);
      }
    });

    expect(onResize1).toHaveBeenCalledWith({ width: 200, height: 150 });

    rerender({ onResize: onResize2 });

    act(() => {
      if (resizeCallback) {
        const mockEntry = {
          contentBoxSize: [{ inlineSize: 300, blockSize: 250 }],
          borderBoxSize: [],
          devicePixelContentBoxSize: [],
          contentRect: { width: 300, height: 250 },
          target: element,
        } as ResizeObserverEntry;

        resizeCallback([mockEntry]);
      }
    });

    expect(onResize2).toHaveBeenCalledWith({ width: 300, height: 250 });
  });

  it('should handle contentBoxSize array with multiple entries (use first)', () => {
    const element = document.createElement('div');
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResizeObserver({ ref } as UseResizeObserverOptions<HTMLElement>)
    );

    act(() => {
      if (resizeCallback) {
        const mockEntry = {
          contentBoxSize: [
            { inlineSize: 200, blockSize: 150 },
            { inlineSize: 300, blockSize: 250 },
          ],
          borderBoxSize: [],
          devicePixelContentBoxSize: [],
          contentRect: { width: 200, height: 150 },
          target: element,
        } as ResizeObserverEntry;

        resizeCallback([mockEntry]);
      }
    });

    // Should use first entry
    expect(result.current.width).toBe(200);
    expect(result.current.height).toBe(150);
  });
});
