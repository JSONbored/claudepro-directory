/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useMultipleIntersectionObserver } from './use-multiple-intersection-observer';
import type { UseMultipleIntersectionObserverOptions } from './use-multiple-intersection-observer';

describe('useMultipleIntersectionObserver', () => {
  let mockIntersectionObserver: any;
  let mockObserve: ReturnType<typeof jest.fn>;
  let mockUnobserve: ReturnType<typeof jest.fn>;
  let mockDisconnect: ReturnType<typeof jest.fn>;
  let intersectionCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockObserve = jest.fn();
    mockUnobserve = jest.fn();
    mockDisconnect = jest.fn();

    mockIntersectionObserver = jest.fn(
      (
        callback: (entries: IntersectionObserverEntry[]) => void,
        options?: IntersectionObserverInit
      ) => {
        intersectionCallback = callback;
        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect,
        };
      }
    );

    global.IntersectionObserver = mockIntersectionObserver as any;

    // Mock document.getElementById
    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      const element = document.createElement('div');
      element.id = id;
      return element;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with empty entries map', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    expect(result.current.entries.size).toBe(0);
    expect(typeof result.current.observeElements).toBe('function');
    expect(typeof result.current.getMostVisibleId).toBe('function');
  });

  it('should create IntersectionObserver with default options', () => {
    renderHook(() => useMultipleIntersectionObserver());

    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: 0,
      root: null,
      rootMargin: '0%',
    });
  });

  it('should create IntersectionObserver with custom options', () => {
    renderHook(() =>
      useMultipleIntersectionObserver({
        threshold: [0, 0.5, 1],
        rootMargin: '-20% 0px',
        root: document.body,
      } as UseMultipleIntersectionObserverOptions)
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: [0, 0.5, 1],
      root: document.body,
      rootMargin: '-20% 0px',
    });
  });

  it('should observe elements when observeElements is called', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1', 'element-2']);
    });

    expect(mockObserve).toHaveBeenCalledTimes(2);
  });

  it('should update entries when intersection changes', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1']);
    });

    const element1 = document.getElementById('element-1')!;

    act(() => {
      if (intersectionCallback) {
        const mockEntry = {
          target: element1,
          isIntersecting: true,
          intersectionRatio: 0.8,
          boundingClientRect: { top: 100 } as DOMRectReadOnly,
        } as IntersectionObserverEntry;

        intersectionCallback([mockEntry]);
      }
    });

    expect(result.current.entries.size).toBe(1);
    expect(result.current.entries.get('element-1')).toBeDefined();
    expect(result.current.entries.get('element-1')?.isIntersecting).toBe(true);
  });

  it('should unobserve elements removed from list', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1', 'element-2']);
    });

    const element1 = document.getElementById('element-1')!;
    const element2 = document.getElementById('element-2')!;

    act(() => {
      result.current.observeElements(['element-2']); // Remove element-1
    });

    expect(mockUnobserve).toHaveBeenCalledWith(element1);
    expect(mockUnobserve).not.toHaveBeenCalledWith(element2);
  });

  it('should not observe elements already being observed', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1']);
    });

    const initialObserveCount = mockObserve.mock.calls.length;

    act(() => {
      result.current.observeElements(['element-1']); // Same element
    });

    expect(mockObserve).toHaveBeenCalledTimes(initialObserveCount);
  });

  it('should get most visible element ID', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1', 'element-2', 'element-3']);
    });

    const element1 = document.getElementById('element-1')!;
    const element2 = document.getElementById('element-2')!;
    const element3 = document.getElementById('element-3')!;

    act(() => {
      if (intersectionCallback) {
        const entries = [
          {
            target: element1,
            isIntersecting: true,
            intersectionRatio: 0.3,
            boundingClientRect: { top: 200 } as DOMRectReadOnly,
          },
          {
            target: element2,
            isIntersecting: true,
            intersectionRatio: 0.8,
            boundingClientRect: { top: 100 } as DOMRectReadOnly,
          },
          {
            target: element3,
            isIntersecting: true,
            intersectionRatio: 0.5,
            boundingClientRect: { top: 150 } as DOMRectReadOnly,
          },
        ] as IntersectionObserverEntry[];

        intersectionCallback(entries);
      }
    });

    // element-2 has highest intersectionRatio (0.8)
    expect(result.current.getMostVisibleId()).toBe('element-2');
  });

  it('should return null when no visible elements', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    expect(result.current.getMostVisibleId()).toBeNull();
  });

  it('should call onChange callback when entries change', () => {
    const onChange = jest.fn();

    const { result } = renderHook(() =>
      useMultipleIntersectionObserver({ onChange } as UseMultipleIntersectionObserverOptions)
    );

    act(() => {
      result.current.observeElements(['element-1']);
    });

    const element1 = document.getElementById('element-1')!;

    act(() => {
      if (intersectionCallback) {
        const mockEntry = {
          target: element1,
          isIntersecting: true,
          intersectionRatio: 0.5,
          boundingClientRect: { top: 100 } as DOMRectReadOnly,
        } as IntersectionObserverEntry;

        intersectionCallback([mockEntry]);
      }
    });

    expect(onChange).toHaveBeenCalledWith(expect.any(Map));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 1,
      })
    );
  });

  it('should not call onChange when entries are empty', () => {
    const onChange = jest.fn();

    renderHook(() =>
      useMultipleIntersectionObserver({ onChange } as UseMultipleIntersectionObserverOptions)
    );

    // onChange should not be called when entries are empty
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useMultipleIntersectionObserver());

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle SSR (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const { result } = renderHook(() => useMultipleIntersectionObserver());

    expect(result.current.entries.size).toBe(0);

    // Restore
    global.window = originalWindow;
  });

  it('should handle missing element IDs gracefully', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    act(() => {
      result.current.observeElements(['non-existent']);
    });

    // Should not throw, but also not observe
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('should handle elements without IDs in entries', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1']);
    });

    const elementWithoutId = document.createElement('div');
    // No ID set

    act(() => {
      if (intersectionCallback) {
        const mockEntry = {
          target: elementWithoutId,
          isIntersecting: true,
          intersectionRatio: 0.5,
          boundingClientRect: { top: 100 } as DOMRectReadOnly,
        } as IntersectionObserverEntry;

        intersectionCallback([mockEntry]);
      }
    });

    // Should not add entry without ID
    expect(result.current.entries.size).toBe(0);
  });

  it('should sort by intersectionRatio then by top position', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1', 'element-2']);
    });

    const element1 = document.getElementById('element-1')!;
    const element2 = document.getElementById('element-2')!;

    act(() => {
      if (intersectionCallback) {
        const entries = [
          {
            target: element1,
            isIntersecting: true,
            intersectionRatio: 0.5,
            boundingClientRect: { top: 200 } as DOMRectReadOnly,
          },
          {
            target: element2,
            isIntersecting: true,
            intersectionRatio: 0.5, // Same ratio
            boundingClientRect: { top: 100 } as DOMRectReadOnly, // But higher (smaller top)
          },
        ] as IntersectionObserverEntry[];

        intersectionCallback(entries);
      }
    });

    // element-2 should win (same ratio, but higher on page)
    expect(result.current.getMostVisibleId()).toBe('element-2');
  });

  it('should handle elements with intersectionRatio 0 but isIntersecting false', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1']);
    });

    const element1 = document.getElementById('element-1')!;

    act(() => {
      if (intersectionCallback) {
        const mockEntry = {
          target: element1,
          isIntersecting: false,
          intersectionRatio: 0,
          boundingClientRect: { top: 100 } as DOMRectReadOnly,
        } as IntersectionObserverEntry;

        intersectionCallback([mockEntry]);
      }
    });

    // Should not be considered visible
    expect(result.current.getMostVisibleId()).toBeNull();
  });

  it('should handle multiple calls to observeElements', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1']);
    });

    act(() => {
      result.current.observeElements(['element-1', 'element-2']);
    });

    // Should observe element-2 (new element)
    expect(mockObserve).toHaveBeenCalledTimes(2);
  });

  it('should update entries for multiple elements', () => {
    const { result } = renderHook(() => useMultipleIntersectionObserver());

    act(() => {
      result.current.observeElements(['element-1', 'element-2']);
    });

    const element1 = document.getElementById('element-1')!;
    const element2 = document.getElementById('element-2')!;

    act(() => {
      if (intersectionCallback) {
        const entries = [
          {
            target: element1,
            isIntersecting: true,
            intersectionRatio: 0.5,
            boundingClientRect: { top: 100 } as DOMRectReadOnly,
          },
          {
            target: element2,
            isIntersecting: true,
            intersectionRatio: 0.7,
            boundingClientRect: { top: 150 } as DOMRectReadOnly,
          },
        ] as IntersectionObserverEntry[];

        intersectionCallback(entries);
      }
    });

    expect(result.current.entries.size).toBe(2);
    expect(result.current.entries.get('element-1')).toBeDefined();
    expect(result.current.entries.get('element-2')).toBeDefined();
  });
});
