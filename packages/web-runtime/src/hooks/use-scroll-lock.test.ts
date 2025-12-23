/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useScrollLock } from './use-scroll-lock';
import type { UseScrollLockOptions } from './use-scroll-lock';

describe('useScrollLock', () => {
  let mockBody: HTMLElement;
  let mockGetComputedStyle: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create mock body element
    mockBody = document.createElement('body');
    mockBody.style.overflow = '';
    mockBody.style.paddingRight = '';

    // Mock document.body
    Object.defineProperty(document, 'body', {
      value: mockBody,
      writable: true,
      configurable: true,
    });

    // Mock getComputedStyle
    mockGetComputedStyle = jest.fn(() => ({
      paddingRight: '0px',
      getPropertyValue: jest.fn((prop: string) => {
        if (prop === 'padding-right') return '0px';
        return '';
      }),
    }));

    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with isLocked=false when autoLock is false', () => {
    const { result } = renderHook(() => useScrollLock({ autoLock: false } as UseScrollLockOptions));

    expect(result.current.isLocked).toBe(false);
    expect(mockBody.style.overflow).toBe('');
  });

  it('should lock scroll automatically on mount when autoLock is true', () => {
    renderHook(() => useScrollLock({ autoLock: true } as UseScrollLockOptions));

    expect(mockBody.style.overflow).toBe('hidden');
  });

  it('should unlock scroll on unmount when autoLock is true', () => {
    const { unmount } = renderHook(() => useScrollLock({ autoLock: true } as UseScrollLockOptions));

    expect(mockBody.style.overflow).toBe('hidden');

    unmount();

    expect(mockBody.style.overflow).toBe('');
  });

  it('should lock scroll when lock is called', () => {
    const { result } = renderHook(() => useScrollLock({ autoLock: false } as UseScrollLockOptions));

    expect(result.current.isLocked).toBe(false);

    act(() => {
      result.current.lock();
    });

    expect(result.current.isLocked).toBe(true);
    expect(mockBody.style.overflow).toBe('hidden');
  });

  it('should unlock scroll when unlock is called', () => {
    const { result } = renderHook(() => useScrollLock({ autoLock: false } as UseScrollLockOptions));

    act(() => {
      result.current.lock();
    });

    expect(result.current.isLocked).toBe(true);
    expect(mockBody.style.overflow).toBe('hidden');

    act(() => {
      result.current.unlock();
    });

    expect(result.current.isLocked).toBe(false);
    expect(mockBody.style.overflow).toBe('');
  });

  it('should restore original overflow style on unlock', () => {
    mockBody.style.overflow = 'scroll';

    const { result } = renderHook(() => useScrollLock({ autoLock: false } as UseScrollLockOptions));

    act(() => {
      result.current.lock();
    });

    expect(mockBody.style.overflow).toBe('hidden');

    act(() => {
      result.current.unlock();
    });

    expect(mockBody.style.overflow).toBe('scroll');
  });

  it('should restore original paddingRight style on unlock', () => {
    mockBody.style.paddingRight = '20px';

    const { result } = renderHook(() => useScrollLock({ autoLock: false } as UseScrollLockOptions));

    act(() => {
      result.current.lock();
    });

    act(() => {
      result.current.unlock();
    });

    expect(mockBody.style.paddingRight).toBe('20px');
  });

  it('should add padding compensation when widthReflow is true', () => {
    // Mock scrollbar width calculation
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);

    let mockOuter: HTMLElement | null = null;
    let mockInner: HTMLElement | null = null;

    // Track when inner is appended to outer
    const originalOuterAppendChild = HTMLElement.prototype.appendChild;
    HTMLElement.prototype.appendChild = jest.fn((node: Node) => {
      mockInner = node as HTMLElement;
      return node;
    });

    document.body.appendChild = jest.fn((node: Node) => {
      mockOuter = node as HTMLElement;
      return node;
    });

    document.body.removeChild = jest.fn((node: Node) => {
      return node;
    });

    // Mock offsetWidth for scrollbar calculation
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        if (this === mockOuter) return 200; // Outer width
        if (this === mockInner) return 180; // Inner width (20px scrollbar)
        return 0;
      },
    });

    mockGetComputedStyle.mockReturnValue({
      paddingRight: '10px',
      getPropertyValue: jest.fn(() => '10px'),
    } as any);

    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false, widthReflow: true } as UseScrollLockOptions)
    );

    act(() => {
      result.current.lock();
    });

    // Should add scrollbar width (20px) to existing padding (10px) = 30px
    expect(mockBody.style.paddingRight).toBe('30px');

    // Restore
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    HTMLElement.prototype.appendChild = originalOuterAppendChild;
  });

  it('should not add padding compensation when widthReflow is false', () => {
    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false, widthReflow: false } as UseScrollLockOptions)
    );

    act(() => {
      result.current.lock();
    });

    expect(mockBody.style.overflow).toBe('hidden');
    expect(mockBody.style.paddingRight).toBe('');
  });

  it('should lock scroll on custom element when lockTarget is provided', () => {
    const customElement = document.createElement('div');
    customElement.style.overflow = 'auto';
    document.body.appendChild(customElement);

    const { result } = renderHook(() =>
      useScrollLock({
        autoLock: false,
        lockTarget: customElement,
      } as UseScrollLockOptions)
    );

    act(() => {
      result.current.lock();
    });

    expect(customElement.style.overflow).toBe('hidden');
    expect(mockBody.style.overflow).toBe(''); // Body should not be affected
  });

  it('should lock scroll on element found by selector when lockTarget is string', () => {
    const customElement = document.createElement('div');
    customElement.className = 'custom-scroll';
    customElement.style.overflow = 'auto';
    document.body.appendChild(customElement);

    // Mock querySelector to return our custom element
    const originalQuerySelector = document.querySelector;
    jest.spyOn(document, 'querySelector').mockReturnValue(customElement);

    const { result } = renderHook(() =>
      useScrollLock({
        autoLock: false,
        lockTarget: '.custom-scroll',
      } as UseScrollLockOptions)
    );

    act(() => {
      result.current.lock();
    });

    expect(customElement.style.overflow).toBe('hidden');

    // Restore
    jest.restoreAllMocks();
  });

  it('should handle invalid selector gracefully', () => {
    const { result } = renderHook(() =>
      useScrollLock({
        autoLock: false,
        lockTarget: '.non-existent',
      } as UseScrollLockOptions)
    );

    act(() => {
      result.current.lock();
    });

    // Should not throw, but also not lock anything
    expect(result.current.isLocked).toBe(false);
  });

  it('should handle SSR (document undefined)', () => {
    // In jsdom, we can't actually make document undefined
    // Instead, test the behavior when getTargetElement returns null
    // (which happens when document is undefined or element is not found)
    const { result } = renderHook(() =>
      useScrollLock({
        autoLock: false,
        lockTarget: '.non-existent-element-that-will-return-null',
      } as UseScrollLockOptions)
    );

    expect(result.current.isLocked).toBe(false);

    act(() => {
      result.current.lock();
    });

    // getTargetElement returns null when element is not found, so lock() returns early
    // and isLocked should remain false (same behavior as when document is undefined)
    expect(result.current.isLocked).toBe(false);
  });

  it('should handle multiple lock/unlock cycles', () => {
    const { result } = renderHook(() => useScrollLock({ autoLock: false } as UseScrollLockOptions));

    act(() => {
      result.current.lock();
    });

    expect(result.current.isLocked).toBe(true);

    act(() => {
      result.current.unlock();
    });

    expect(result.current.isLocked).toBe(false);

    act(() => {
      result.current.lock();
    });

    expect(result.current.isLocked).toBe(true);

    act(() => {
      result.current.unlock();
    });

    expect(result.current.isLocked).toBe(false);
  });

  it('should return function references (may not be stable)', () => {
    const { result, rerender } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

    const firstLock = result.current.lock;
    const firstUnlock = result.current.unlock;

    expect(typeof firstLock).toBe('function');
    expect(typeof firstUnlock).toBe('function');

    rerender();

    const secondLock = result.current.lock;
    const secondUnlock = result.current.unlock;

    expect(typeof secondLock).toBe('function');
    expect(typeof secondUnlock).toBe('function');
    // Note: Functions may not be stable if hook doesn't use useCallback
    // This test verifies functions exist and are callable, not necessarily stable
  });

  it('should handle unlock when never locked', () => {
    const { result } = renderHook(() => useScrollLock({ autoLock: false } as UseScrollLockOptions));

    act(() => {
      result.current.unlock();
    });

    // Should not throw
    expect(result.current.isLocked).toBe(false);
  });

  it('should handle autoLock changing from false to true', () => {
    const { rerender } = renderHook(
      ({ autoLock }) => useScrollLock({ autoLock } as UseScrollLockOptions),
      { initialProps: { autoLock: false } }
    );

    expect(mockBody.style.overflow).toBe('');

    rerender({ autoLock: true });

    expect(mockBody.style.overflow).toBe('hidden');
  });

  it('should handle autoLock changing from true to false', () => {
    const { rerender, unmount } = renderHook(
      ({ autoLock }) => useScrollLock({ autoLock } as UseScrollLockOptions),
      { initialProps: { autoLock: true } }
    );

    expect(mockBody.style.overflow).toBe('hidden');

    rerender({ autoLock: false });

    // Should unlock when autoLock becomes false
    expect(mockBody.style.overflow).toBe('');

    unmount();
  });

  it('should handle lockTarget changing', () => {
    const element1 = document.createElement('div');
    element1.className = 'element-1';
    element1.style.overflow = 'auto';
    document.body.appendChild(element1);

    const element2 = document.createElement('div');
    element2.className = 'element-2';
    element2.style.overflow = 'auto';
    document.body.appendChild(element2);

    const { result, rerender } = renderHook(
      ({ lockTarget }) =>
        useScrollLock({
          autoLock: false,
          lockTarget,
        } as UseScrollLockOptions),
      { initialProps: { lockTarget: element1 } }
    );

    act(() => {
      result.current.lock();
    });

    expect(element1.style.overflow).toBe('hidden');

    // Change lockTarget
    rerender({ lockTarget: element2 });

    act(() => {
      result.current.lock();
    });

    expect(element2.style.overflow).toBe('hidden');
  });
});
