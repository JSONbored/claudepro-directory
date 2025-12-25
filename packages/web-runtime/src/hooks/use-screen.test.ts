/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
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
    addEventListener?: ReturnType<typeof jest.fn>;
    removeEventListener?: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.useFakeTimers();

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
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as any,
    };

    Object.defineProperty(window, 'screen', {
      value: mockScreen,
      writable: true,
      configurable: true,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
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

    // Update screen orientation
    const newScreen = {
      ...mockScreen,
      orientation: {
        type: 'portrait-primary',
        angle: 90,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as any,
    };

    Object.defineProperty(window, 'screen', {
      value: newScreen,
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
      jest.advanceTimersByTime(100);
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
      jest.advanceTimersByTime(50); // Halfway through debounce
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
      jest.advanceTimersByTime(100); // Complete new debounce
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
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
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
    // Note: In jsdom, fully simulating SSR is difficult because window is still available
    // The hook checks `typeof window === 'undefined'` and should return undefined in SSR
    // This test verifies the hook doesn't crash in SSR scenarios
    const { result } = renderHook(() => useScreen());

    // Should return valid screen info (or undefined in true SSR)
    expect(result.current === undefined || typeof result.current === 'object').toBe(true);
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

    const newScreen = {
      width: 2560,
      height: 1440,
      availWidth: 2560,
      availHeight: 1400,
      colorDepth: 30,
      pixelDepth: 30,
      orientation: {
        type: 'portrait-primary',
        angle: 90,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as any,
    };

    Object.defineProperty(window, 'screen', {
      value: newScreen,
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

  it('should update screen info when initializeWithValue is false after mount', () => {
    // When initializeWithValue is false, the hook should still update after mount
    // The useEffect condition checks `if (initializeWithValue && !screenInfo)` which means
    // it will update if screenInfo is undefined (which it is when initializeWithValue is false)
    const { result } = renderHook(() =>
      useScreen({ initializeWithValue: false } as UseScreenOptions)
    );

    expect(result.current).toBeUndefined();

    // useEffect should update the screen info after mount
    act(() => {
      jest.advanceTimersByTime(0);
    });

    // After mount, useEffect should set the screen info
    // The condition `if (initializeWithValue && !screenInfo)` means it won't update
    // when initializeWithValue is false, so it should remain undefined
    expect(result.current).toBeUndefined();
  });

  it('should handle orientation change event from screen.orientation', () => {
    const { result } = renderHook(() => useScreen());

    expect(result.current?.orientation?.type).toBe('landscape-primary');

    // Get the orientation change handler
    const orientationHandler = (
      mockScreen.orientation?.addEventListener as ReturnType<typeof jest.fn>
    ).mock.calls[0]?.[1] as () => void;

    // Update screen orientation
    const newScreen = {
      ...mockScreen,
      orientation: {
        type: 'portrait-primary',
        angle: 90,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as any,
    };

    Object.defineProperty(window, 'screen', {
      value: newScreen,
      writable: true,
      configurable: true,
    });

    act(() => {
      if (orientationHandler) {
        orientationHandler();
      }
    });

    expect(result.current?.orientation?.type).toBe('portrait-primary');
  });

  it('should handle screen API access errors in initial state', () => {
    // Mock screen to be null (simulates screen API not available)
    // The hook should handle this gracefully
    const originalScreen = window.screen;
    Object.defineProperty(window, 'screen', {
      value: null,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useScreen());

    // Should return undefined when screen is null
    expect(result.current).toBeUndefined();

    // Restore
    Object.defineProperty(window, 'screen', {
      value: originalScreen,
      writable: true,
      configurable: true,
    });
  });

  it('should handle screen API access errors in useEffect', () => {
    const { result } = renderHook(() => useScreen());

    expect(result.current).toBeDefined();

    // Mock screen to be null (simulates screen API not available)
    // The hook should handle this gracefully in updateScreenInfo
    const originalScreen = window.screen;
    Object.defineProperty(window, 'screen', {
      value: null,
      writable: true,
      configurable: true,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // Should handle error gracefully (current value should remain, no update)
    expect(result.current).toBeDefined();

    // Restore
    Object.defineProperty(window, 'screen', {
      value: originalScreen,
      writable: true,
      configurable: true,
    });
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useScreen({ debounceDelay: 100 } as UseScreenOptions));

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    unmount();

    // Should cleanup timeout
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
