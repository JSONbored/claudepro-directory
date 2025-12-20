import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScreen } from './use-screen';
import type { UseScreenOptions } from './use-screen';

describe('useScreen', () => {
  let mockScreen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
    orientation: ScreenOrientation | null;
    addEventListener?: ReturnType<typeof vi.fn>;
    removeEventListener?: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    mockScreen = {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      orientation: {
        type: 'landscape-primary',
        angle: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any,
    };

    Object.defineProperty(window, 'screen', {
      value: mockScreen,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with screen properties when initializeWithValue is true', () => {
    const { result } = renderHook(() => useScreen());

    expect(result.current).toEqual({
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      orientation: expect.objectContaining({
        type: 'landscape-primary',
        angle: 0,
      }),
    });
  });

  it('should initialize with undefined when initializeWithValue is false', () => {
    const { result } = renderHook(() =>
      useScreen({ initializeWithValue: false } as UseScreenOptions)
    );

    expect(result.current).toBeUndefined();
  });

  it('should update screen info on window resize', () => {
    const { result } = renderHook(() => useScreen());

    expect(result.current?.width).toBe(1920);

    // Simulate screen change
    Object.defineProperty(window, 'screen', {
      value: {
        ...mockScreen,
        width: 2560,
        height: 1440,
      },
      writable: true,
      configurable: true,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current?.width).toBe(2560);
    expect(result.current?.height).toBe(1440);
  });

  it('should update screen info on orientationchange', () => {
    const { result } = renderHook(() => useScreen());

    Object.defineProperty(window, 'screen', {
      value: {
        ...mockScreen,
        orientation: {
          type: 'portrait-primary',
          angle: 90,
        } as any,
      },
      writable: true,
      configurable: true,
    });

    act(() => {
      window.dispatchEvent(new Event('orientationchange'));
    });

    expect(result.current?.orientation?.type).toBe('portrait-primary');
  });

  it('should debounce resize events when debounceDelay is provided', () => {
    const { result } = renderHook(() => useScreen({ debounceDelay: 100 } as UseScreenOptions));

    expect(result.current?.width).toBe(1920);

    Object.defineProperty(window, 'screen', {
      value: { ...mockScreen, width: 1600 },
      writable: true,
      configurable: true,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // Should not update immediately
    expect(result.current?.width).toBe(1920);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current?.width).toBe(1600);
  });

  it('should cancel previous debounce when new resize occurs', () => {
    const { result } = renderHook(() => useScreen({ debounceDelay: 100 } as UseScreenOptions));

    act(() => {
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'screen', {
        value: { ...mockScreen, width: 1600 },
        writable: true,
        configurable: true,
      });
    });

    act(() => {
      vi.advanceTimersByTime(50); // Halfway through debounce
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'screen', {
        value: { ...mockScreen, width: 1280 },
        writable: true,
        configurable: true,
      });
    });

    act(() => {
      vi.advanceTimersByTime(100); // Complete new debounce
    });

    expect(result.current?.width).toBe(1280);
  });

  it('should listen for screen orientation changes', () => {
    renderHook(() => useScreen());

    if (mockScreen.orientation) {
      expect(mockScreen.orientation.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    }
  });

  it('should remove event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useScreen());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

    if (mockScreen.orientation) {
      expect(mockScreen.orientation.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    }
  });

  it('should handle SSR (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const { result } = renderHook(() => useScreen());

    expect(result.current).toBeUndefined();

    // Restore
    global.window = originalWindow;
  });

  it('should handle screen API errors gracefully', () => {
    Object.defineProperty(window, 'screen', {
      value: null,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useScreen());

    expect(result.current).toBeUndefined();
  });

  it('should handle missing orientation property', () => {
    Object.defineProperty(window, 'screen', {
      value: {
        ...mockScreen,
        orientation: null,
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useScreen());

    expect(result.current?.orientation).toBeNull();
  });

  it('should update all screen properties', () => {
    const { result } = renderHook(() => useScreen());

    Object.defineProperty(window, 'screen', {
      value: {
        width: 2560,
        height: 1440,
        availWidth: 2560,
        availHeight: 1400,
        colorDepth: 30,
        pixelDepth: 30,
        orientation: {
          type: 'portrait-primary',
          angle: 90,
        } as any,
      },
      writable: true,
      configurable: true,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toEqual({
      width: 2560,
      height: 1440,
      availWidth: 2560,
      availHeight: 1400,
      colorDepth: 30,
      pixelDepth: 30,
      orientation: expect.objectContaining({
        type: 'portrait-primary',
        angle: 90,
      }),
    });
  });
});
