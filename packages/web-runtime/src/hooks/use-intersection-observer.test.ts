import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIntersectionObserver } from './use-intersection-observer.ts';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
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
  vi.clearAllMocks();
});

describe('useIntersectionObserver', () => {
  it('should initialize with initialIsIntersecting', () => {
    const { result } = renderHook(() => useIntersectionObserver({ initialIsIntersecting: true }));

    expect(result.current.isIntersecting).toBe(true);
  });

  it('should observe element when ref is set', () => {
    const { result } = renderHook(() => useIntersectionObserver());

    const element = document.createElement('div');
    act(() => {
      result.current.ref(element);
    });

    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it('should disconnect on unmount', () => {
    const { result, unmount } = renderHook(() => useIntersectionObserver());

    const element = document.createElement('div');
    act(() => {
      result.current.ref(element);
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should call onChange callback when intersection changes', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver({ onChange }));

    const element = document.createElement('div');
    act(() => {
      result.current.ref(element);
    });

    // Simulate intersection change
    const observerInstance = mockIntersectionObserver.mock.results[0].value;
    const entry = {
      isIntersecting: true,
      intersectionRatio: 1,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      observerInstance.callback([entry]);
    });

    expect(onChange).toHaveBeenCalledWith(true, entry);
    expect(result.current.isIntersecting).toBe(true);
  });

  it('should freeze once visible when freezeOnceVisible is true', () => {
    const { result } = renderHook(() => useIntersectionObserver({ freezeOnceVisible: true }));

    const element = document.createElement('div');
    act(() => {
      result.current.ref(element);
    });

    const observerInstance = mockIntersectionObserver.mock.results[0].value;
    const entry = {
      isIntersecting: true,
      intersectionRatio: 1,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      observerInstance.callback([entry]);
    });

    expect(result.current.isIntersecting).toBe(true);

    // Simulate becoming not intersecting
    const entry2 = {
      isIntersecting: false,
      intersectionRatio: 0,
      target: element,
    } as IntersectionObserverEntry;

    act(() => {
      observerInstance.callback([entry2]);
    });

    // Should remain true (frozen)
    expect(result.current.isIntersecting).toBe(true);
  });
});
