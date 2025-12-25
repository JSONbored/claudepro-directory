/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useIntersectionObserver } from './use-intersection-observer.ts';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

describe('useIntersectionObserver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.IntersectionObserver = mockIntersectionObserver as any;
    mockIntersectionObserver.mockImplementation((callback) => {
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
        callback,
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with initialIsIntersecting', () => {
    const { result } = renderHook(() => useIntersectionObserver({ initialIsIntersecting: true }));

    expect(result.current.isIntersecting).toBe(true);
  });

  it('should initialize with false when initialIsIntersecting is not provided', () => {
    const { result } = renderHook(() => useIntersectionObserver());

    expect(result.current.isIntersecting).toBe(false);
  });

  it('should observe element when ref is set and effect runs', () => {
    const element = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold });
        // Set ref immediately in render
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect by changing threshold (this causes effect to re-run and see the ref)
    rerender({ threshold: 0.1 });

    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it('should not observe when ref is null', () => {
    renderHook(() => useIntersectionObserver());

    // Effect runs but elementRef.current is null, so observer is not created
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('should disconnect on unmount', () => {
    const element = document.createElement('div');
    const { result, unmount, rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold });
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect to create observer
    rerender({ threshold: 0.1 });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should call onChange callback when intersection changes', () => {
    const onChange = jest.fn();
    const element = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold, onChange });
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect to create observer
    rerender({ threshold: 0.1 });

    // Simulate intersection change
    const observerInstance = mockIntersectionObserver.mock.results[0]?.value;
    const entry = {
      isIntersecting: true,
      intersectionRatio: 1,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      if (observerInstance?.callback) {
        observerInstance.callback([entry]);
      }
    });

    expect(onChange).toHaveBeenCalledWith(true, entry);
    expect(result.current.isIntersecting).toBe(true);
    expect(result.current.entry).toBe(entry);
  });

  it('should update isIntersecting when intersection changes to false', () => {
    const element = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ threshold }) => {
        // Start with initialIsIntersecting: false, then element becomes intersecting, then false again
        const hookResult = useIntersectionObserver({ threshold, initialIsIntersecting: false });
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect to create observer
    rerender({ threshold: 0.1 });

    const observerInstance = mockIntersectionObserver.mock.results[0]?.value;

    // First, make it intersecting
    const entry1 = {
      isIntersecting: true,
      intersectionRatio: 1,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      if (observerInstance?.callback) {
        observerInstance.callback([entry1]);
      }
    });

    expect(result.current.isIntersecting).toBe(true);

    // Then make it not intersecting
    const entry2 = {
      isIntersecting: false,
      intersectionRatio: 0,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      if (observerInstance?.callback) {
        observerInstance.callback([entry2]);
      }
    });

    expect(result.current.isIntersecting).toBe(false);
    expect(result.current.entry).toBe(entry2);
  });

  it('should freeze once visible when freezeOnceVisible is true', () => {
    const element = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold, freezeOnceVisible: true });
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect to create observer
    rerender({ threshold: 0.1 });

    const observerInstance = mockIntersectionObserver.mock.results[0]?.value;
    const entry = {
      isIntersecting: true,
      intersectionRatio: 1,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      if (observerInstance?.callback) {
        observerInstance.callback([entry]);
      }
    });

    expect(result.current.isIntersecting).toBe(true);

    // Simulate becoming not intersecting
    const entry2 = {
      isIntersecting: false,
      intersectionRatio: 0,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      if (observerInstance?.callback) {
        observerInstance.callback([entry2]);
      }
    });

    // Should remain true (frozen)
    expect(result.current.isIntersecting).toBe(true);
  });

  it('should not freeze when freezeOnceVisible is false', () => {
    const element = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold, freezeOnceVisible: false });
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect to create observer
    rerender({ threshold: 0.1 });

    const observerInstance = mockIntersectionObserver.mock.results[0]?.value;
    const entry1 = {
      isIntersecting: true,
      intersectionRatio: 1,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      if (observerInstance?.callback) {
        observerInstance.callback([entry1]);
      }
    });

    expect(result.current.isIntersecting).toBe(true);

    const entry2 = {
      isIntersecting: false,
      intersectionRatio: 0,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      if (observerInstance?.callback) {
        observerInstance.callback([entry2]);
      }
    });

    // Should update to false (not frozen)
    expect(result.current.isIntersecting).toBe(false);
  });

  it('should create observer with custom options', () => {
    const root = document.createElement('div');
    const element = document.createElement('div');
    const { rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({
          threshold,
          root: root,
          rootMargin: '10px',
        });
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: [0, 0.5, 1] as number | number[] } }
    );

    // Trigger effect
    rerender({ threshold: [0, 0.5, 1] as number | number[] });

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: [0, 0.5, 1],
        root: root,
        rootMargin: '10px',
      })
    );
  });

  it('should create observer with default options', () => {
    const element = document.createElement('div');
    const { rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold });
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect
    rerender({ threshold: 0.1 });

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.1,
        root: null,
        rootMargin: '0%',
      })
    );
  });

  it('should handle ref changing from null to element', () => {
    const element = document.createElement('div');
    const { rerender } = renderHook(
      ({ threshold, setRef }) => {
        const hookResult = useIntersectionObserver({ threshold });
        // Only set ref when setRef is true
        if (hookResult.ref && setRef) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0, setRef: false } }
    );

    // Initially, ref is not set, so observer should not be created
    expect(mockObserve).not.toHaveBeenCalled();

    // Now set ref and trigger effect
    rerender({ threshold: 0.1, setRef: true });

    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it('should handle ref changing from element to null', () => {
    const element = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold });
        // Set ref in render
        if (hookResult.ref && threshold === 0) {
          hookResult.ref(element);
        } else if (hookResult.ref && threshold === 0.1) {
          hookResult.ref(null);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect to create observer with element
    rerender({ threshold: 0.1 });

    expect(mockObserve).toHaveBeenCalledWith(element);

    // Change threshold again to trigger effect with null ref
    rerender({ threshold: 0.2 });

    // Observer should be disconnected when ref becomes null
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle empty entries array', () => {
    const onChange = jest.fn();
    const element = document.createElement('div');
    const { rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold, onChange });
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect to create observer
    rerender({ threshold: 0.1 });

    const observerInstance = mockIntersectionObserver.mock.results[0]?.value;

    act(() => {
      if (observerInstance?.callback) {
        observerInstance.callback([]);
      }
    });

    // Should not crash, onChange should not be called with empty array
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should handle multiple entries (use first)', () => {
    const onChange = jest.fn();
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold, onChange });
        if (hookResult.ref) {
          hookResult.ref(element1);
        }
        return hookResult;
      },
      { initialProps: { threshold: 0 } }
    );

    // Trigger effect to create observer
    rerender({ threshold: 0.1 });

    const observerInstance = mockIntersectionObserver.mock.results[0]?.value;
    const entry1 = {
      isIntersecting: true,
      intersectionRatio: 1,
      target: element1,
    } as IntersectionObserverEntry;
    const entry2 = {
      isIntersecting: false,
      intersectionRatio: 0,
      target: element2,
    } as IntersectionObserverEntry;

    act(() => {
      if (observerInstance?.callback) {
        observerInstance.callback([entry1, entry2]);
      }
    });

    // Should use first entry
    expect(onChange).toHaveBeenCalledWith(true, entry1);
    expect(result.current.isIntersecting).toBe(true);
    expect(result.current.entry).toBe(entry1);
  });

  it('should handle SSR (IntersectionObserver undefined)', () => {
    const originalIntersectionObserver = global.IntersectionObserver;
    // @ts-expect-error - Testing SSR scenario
    global.IntersectionObserver = undefined;

    // Should not throw
    const { result } = renderHook(() => useIntersectionObserver());

    const element = document.createElement('div');
    act(() => {
      result.current.ref(element);
    });

    // Should not observe when IntersectionObserver is undefined
    expect(mockObserve).not.toHaveBeenCalled();

    // Restore
    global.IntersectionObserver = originalIntersectionObserver;
  });

  it('should update when options change', () => {
    const element = document.createElement('div');
    const { rerender } = renderHook(
      ({ threshold }) => {
        const hookResult = useIntersectionObserver({ threshold });
        if (hookResult.ref) {
          hookResult.ref(element);
        }
        return hookResult;
      },
      {
        initialProps: { threshold: 0 },
      }
    );

    // Trigger initial effect
    rerender({ threshold: 0.1 });

    const initialCallCount = mockIntersectionObserver.mock.calls.length;

    // Change threshold to trigger effect re-run
    rerender({ threshold: 0.5 });

    // Observer should be recreated when options change
    // (old one disconnected, new one created)
    expect(mockDisconnect).toHaveBeenCalled();
    expect(mockIntersectionObserver.mock.calls.length).toBeGreaterThan(initialCallCount);
  });
});
