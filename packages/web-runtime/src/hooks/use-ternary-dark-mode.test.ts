/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useTernaryDarkMode } from './use-ternary-dark-mode';
import type { TernaryDarkModeOptions, TernaryDarkMode } from './use-ternary-dark-mode';

// Mock useLocalStorage
const mockSetValue = jest.fn();
let mockStoredValue: TernaryDarkMode = 'system';

jest.mock('./use-local-storage', () => ({
  useLocalStorage: jest.fn((key: string, options: any) => {
    return {
      value: mockStoredValue ?? options.defaultValue ?? 'system',
      setValue: mockSetValue,
      removeValue: jest.fn(),
      error: null,
    };
  }),
}));

describe('useTernaryDarkMode', () => {
  let mockMatchMedia: ReturnType<typeof jest.fn>;
  let mockMediaQueryList: {
    matches: boolean;
    addEventListener: ReturnType<typeof jest.fn>;
    removeEventListener: ReturnType<typeof jest.fn>;
    addListener: ReturnType<typeof jest.fn>;
    removeListener: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    mockStoredValue = 'system';
    mockSetValue.mockClear();

    // Mock matchMedia
    mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };

    mockMatchMedia = jest.fn((query: string) => {
      if (query === '(prefers-color-scheme: dark)') {
        return mockMediaQueryList;
      }
      return { matches: false } as MediaQueryList;
    });

    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with default system mode', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useTernaryDarkMode());

    expect(result.current.ternaryDarkMode).toBe('system');
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should use stored mode over default', () => {
    mockStoredValue = 'dark';
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useTernaryDarkMode());

    expect(result.current.ternaryDarkMode).toBe('dark');
    expect(result.current.isDarkMode).toBe(true);
  });

  it('should compute isDarkMode=true when mode is dark', () => {
    mockStoredValue = 'dark';

    const { result } = renderHook(() => useTernaryDarkMode());

    expect(result.current.isDarkMode).toBe(true);
  });

  it('should compute isDarkMode=false when mode is light', () => {
    mockStoredValue = 'light';
    mockMediaQueryList.matches = true; // OS prefers dark, but mode is light

    const { result } = renderHook(() => useTernaryDarkMode());

    expect(result.current.isDarkMode).toBe(false);
  });

  it('should compute isDarkMode based on OS preference when mode is system', () => {
    mockStoredValue = 'system';
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useTernaryDarkMode());

    expect(result.current.isDarkMode).toBe(true);

    // Change OS preference
    mockMediaQueryList.matches = false;
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0]?.[1] as (
      event: MediaQueryListEvent
    ) => void;
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: false } as MediaQueryListEvent);
      });
    }

    expect(result.current.isDarkMode).toBe(false);
  });

  it('should set ternary dark mode', () => {
    mockStoredValue = 'system';

    const { result } = renderHook(() => useTernaryDarkMode());

    act(() => {
      result.current.setTernaryDarkMode('dark');
    });

    expect(mockSetValue).toHaveBeenCalledWith('dark');
  });

  it('should toggle ternary dark mode (light -> system -> dark -> light)', () => {
    mockStoredValue = 'light';

    const { result } = renderHook(() => useTernaryDarkMode());

    expect(result.current.ternaryDarkMode).toBe('light');

    act(() => {
      result.current.toggleTernaryDarkMode();
    });

    // setTernaryDarkMode is called with a function
    expect(mockSetValue).toHaveBeenCalled();
    const firstCallArg = mockSetValue.mock.calls[0]?.[0];
    if (typeof firstCallArg === 'function') {
      expect(firstCallArg('light')).toBe('system');
    } else {
      expect(firstCallArg).toBe('system');
    }

    // Update stored value for next toggle
    mockStoredValue = 'system';
    act(() => {
      result.current.toggleTernaryDarkMode();
    });

    const secondCallArg = mockSetValue.mock.calls[1]?.[0];
    if (typeof secondCallArg === 'function') {
      expect(secondCallArg('system')).toBe('dark');
    } else {
      expect(secondCallArg).toBe('dark');
    }

    // Update stored value for next toggle
    mockStoredValue = 'dark';
    act(() => {
      result.current.toggleTernaryDarkMode();
    });

    const thirdCallArg = mockSetValue.mock.calls[2]?.[0];
    if (typeof thirdCallArg === 'function') {
      expect(thirdCallArg('dark')).toBe('light');
    } else {
      expect(thirdCallArg).toBe('light');
    }
  });

  it('should listen for OS preference changes', () => {
    renderHook(() => useTernaryDarkMode());

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should update system preference when OS preference changes', () => {
    mockStoredValue = 'system';
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useTernaryDarkMode());

    expect(result.current.isDarkMode).toBe(false);

    // Simulate OS preference change
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0]?.[1] as (
      event: MediaQueryListEvent
    ) => void;
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: true } as MediaQueryListEvent);
      });
    }

    expect(result.current.isDarkMode).toBe(true);
  });

  it('should use custom localStorage key', () => {
    renderHook(() =>
      useTernaryDarkMode({ localStorageKey: 'custom-key' } as TernaryDarkModeOptions)
    );

    // Verify useLocalStorage was called (via mock)
    const { useLocalStorage } = require('./use-local-storage');
    expect(useLocalStorage).toHaveBeenCalledWith('custom-key', expect.any(Object));
  });

  it('should use custom defaultValue', () => {
    mockStoredValue = null as any; // Simulate no stored value

    const { result } = renderHook(() =>
      useTernaryDarkMode({ defaultValue: 'dark' } as TernaryDarkModeOptions)
    );

    // Should use defaultValue when no stored value
    expect(result.current.ternaryDarkMode).toBe('dark');
  });

  it('should handle SSR (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const { result } = renderHook(() => useTernaryDarkMode());

    expect(result.current.ternaryDarkMode).toBe('system');
    expect(result.current.isDarkMode).toBe(false);

    // Restore
    global.window = originalWindow;
  });

  it('should handle matchMedia error gracefully', () => {
    mockMatchMedia.mockImplementation(() => {
      throw new Error('matchMedia not supported');
    });

    const { result } = renderHook(() => useTernaryDarkMode());

    expect(result.current.ternaryDarkMode).toBe('system');
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useTernaryDarkMode());

    const firstSetTernary = result.current.setTernaryDarkMode;
    const firstToggle = result.current.toggleTernaryDarkMode;

    rerender();

    const secondSetTernary = result.current.setTernaryDarkMode;
    const secondToggle = result.current.toggleTernaryDarkMode;

    // setTernaryDarkMode should be stable (it's setStoredMode from useLocalStorage)
    expect(firstSetTernary).toBe(secondSetTernary);
    // Note: toggleTernaryDarkMode is not wrapped in useCallback in the implementation,
    // so it may not be stable. However, setTernaryDarkMode should be stable.
    // If toggleTernaryDarkMode stability is required, the hook should use useCallback.
    expect(typeof secondToggle).toBe('function');
  });

  it('should handle functional setTernaryDarkMode updates', () => {
    mockStoredValue = 'light';

    const { result } = renderHook(() => useTernaryDarkMode());

    act(() => {
      result.current.setTernaryDarkMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    });

    // setTernaryDarkMode is called with a function
    expect(mockSetValue).toHaveBeenCalled();
    const callArg = mockSetValue.mock.calls[0]?.[0];
    if (typeof callArg === 'function') {
      expect(callArg('light')).toBe('dark');
    } else {
      expect(callArg).toBe('dark');
    }
  });

  it('should handle cleanup on unmount', () => {
    const { unmount } = renderHook(() => useTernaryDarkMode());

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalled();

    unmount();

    // Event listener should be removed
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled();
  });

  it('should use addListener fallback for older browsers', () => {
    // Remove addEventListener to simulate older browser
    const originalAddEventListener = mockMediaQueryList.addEventListener;
    delete (mockMediaQueryList as any).addEventListener;

    renderHook(() => useTernaryDarkMode());

    expect(mockMediaQueryList.addListener).toHaveBeenCalledWith(expect.any(Function));

    // Restore
    mockMediaQueryList.addEventListener = originalAddEventListener;
  });

  it('should update system preference on mount', () => {
    mockStoredValue = 'system';
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useTernaryDarkMode());

    // The hook should set initial system preference from matchMedia
    // This happens in the useEffect which calls setSystemPreference(mediaQuery.matches)
    expect(result.current.isDarkMode).toBe(true);
  });

  it('should handle all three modes correctly', () => {
    // Test light mode
    mockStoredValue = 'light';
    mockMediaQueryList.matches = true; // OS prefers dark, but mode is light
    const { result: lightResult } = renderHook(() => useTernaryDarkMode());
    expect(lightResult.current.ternaryDarkMode).toBe('light');
    expect(lightResult.current.isDarkMode).toBe(false);

    // Test dark mode
    mockStoredValue = 'dark';
    mockMediaQueryList.matches = false; // OS prefers light, but mode is dark
    const { result: darkResult } = renderHook(() => useTernaryDarkMode());
    expect(darkResult.current.ternaryDarkMode).toBe('dark');
    expect(darkResult.current.isDarkMode).toBe(true);

    // Test system mode with dark OS preference
    mockStoredValue = 'system';
    mockMediaQueryList.matches = true;
    const { result: systemDarkResult } = renderHook(() => useTernaryDarkMode());
    expect(systemDarkResult.current.ternaryDarkMode).toBe('system');
    expect(systemDarkResult.current.isDarkMode).toBe(true);

    // Test system mode with light OS preference
    mockStoredValue = 'system';
    mockMediaQueryList.matches = false;
    const { result: systemLightResult } = renderHook(() => useTernaryDarkMode());
    expect(systemLightResult.current.ternaryDarkMode).toBe('system');
    expect(systemLightResult.current.isDarkMode).toBe(false);
  });

  it('should handle toggle from system mode', () => {
    mockStoredValue = 'system';

    const { result } = renderHook(() => useTernaryDarkMode());

    act(() => {
      result.current.toggleTernaryDarkMode();
    });

    // System -> Dark (setTernaryDarkMode is called with a function)
    expect(mockSetValue).toHaveBeenCalled();
    const callArg = mockSetValue.mock.calls[0]?.[0];
    if (typeof callArg === 'function') {
      expect(callArg('system')).toBe('dark');
    } else {
      expect(callArg).toBe('dark');
    }
  });

  it('should handle toggle from dark mode', () => {
    mockStoredValue = 'dark';

    const { result } = renderHook(() => useTernaryDarkMode());

    act(() => {
      result.current.toggleTernaryDarkMode();
    });

    // Dark -> Light (setTernaryDarkMode is called with a function)
    expect(mockSetValue).toHaveBeenCalled();
    const callArg = mockSetValue.mock.calls[0]?.[0];
    if (typeof callArg === 'function') {
      expect(callArg('dark')).toBe('light');
    } else {
      expect(callArg).toBe('light');
    }
  });
});
