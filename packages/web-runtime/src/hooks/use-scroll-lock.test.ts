import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollLock } from './use-scroll-lock';
import type { UseScrollLockOptions } from './use-scroll-lock';

describe('useScrollLock', () => {
  let mockBody: HTMLElement;
  let mockGetComputedStyle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
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
    mockGetComputedStyle = vi.fn(() => ({
      paddingRight: '0px',
      getPropertyValue: vi.fn((prop: string) => {
        if (prop === 'padding-right') return '0px';
        return '';
      }),
    }));

    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with isLocked=false when autoLock is false', () => {
    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

    expect(result.current.isLocked).toBe(false);
    expect(mockBody.style.overflow).toBe('');
  });

  it('should lock scroll automatically on mount when autoLock is true', () => {
    renderHook(() => useScrollLock({ autoLock: true } as UseScrollLockOptions));

    expect(mockBody.style.overflow).toBe('hidden');
  });

  it('should unlock scroll on unmount when autoLock is true', () => {
    const { unmount } = renderHook(() =>
      useScrollLock({ autoLock: true } as UseScrollLockOptions)
    );

    expect(mockBody.style.overflow).toBe('hidden');

    unmount();

    expect(mockBody.style.overflow).toBe('');
  });

  it('should lock scroll when lock is called', () => {
    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

    expect(result.current.isLocked).toBe(false);

    act(() => {
      result.current.lock();
    });

    expect(result.current.isLocked).toBe(true);
    expect(mockBody.style.overflow).toBe('hidden');
  });

  it('should unlock scroll when unlock is called', () => {
    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

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

    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

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

    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

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

    document.body.appendChild = vi.fn((node: Node) => {
      mockOuter = node as HTMLElement;
      return node;
    });

    document.body.removeChild = vi.fn((node: Node) => {
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
      getPropertyValue: vi.fn(() => '10px'),
    });

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
    const originalDocument = global.document;
    // @ts-expect-error - Intentionally setting document to undefined for SSR test
    global.document = undefined;

    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

    expect(result.current.isLocked).toBe(false);

    act(() => {
      result.current.lock();
    });

    // Should not throw, but also not lock anything
    expect(result.current.isLocked).toBe(false);

    // Restore
    global.document = originalDocument;
  });

  it('should handle multiple lock/unlock cycles', () => {
    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

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

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

    const firstLock = result.current.lock;
    const firstUnlock = result.current.unlock;

    rerender();

    const secondLock = result.current.lock;
    const secondUnlock = result.current.unlock;

    expect(firstLock).toBe(secondLock);
    expect(firstUnlock).toBe(secondUnlock);
  });

  it('should handle unlock when never locked', () => {
    const { result } = renderHook(() =>
      useScrollLock({ autoLock: false } as UseScrollLockOptions)
    );

    act(() => {
      result.current.unlock();
    });

    // Should not throw
    expect(result.current.isLocked).toBe(false);
  });
});
