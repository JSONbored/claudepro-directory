import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTernaryDarkMode } from './use-ternary-dark-mode';
import type { TernaryDarkModeOptions, TernaryDarkMode } from './use-ternary-dark-mode';

// Mock useLocalStorage
const mockSetValue = vi.fn();
let mockStoredValue: TernaryDarkMode = 'system';

vi.mock('./use-local-storage', () => ({
  useLocalStorage: vi.fn((key: string, options: any) => {
    return {
      value: mockStoredValue ?? options.defaultValue ?? 'system',
      setValue: mockSetValue,
      removeValue: vi.fn(),
    };
  }),
}));

describe('useTernaryDarkMode', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockMediaQueryList: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStoredValue = 'system';
    mockSetValue.mockClear();

    // Mock matchMedia
    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };

    mockMatchMedia = vi.fn((query: string) => {
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

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0]?.[1];
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

    expect(mockSetValue).toHaveBeenCalledWith('system');

    // Update stored value for next toggle
    mockStoredValue = 'system';
    act(() => {
      result.current.toggleTernaryDarkMode();
    });

    expect(mockSetValue).toHaveBeenCalledWith('dark');

    // Update stored value for next toggle
    mockStoredValue = 'dark';
    act(() => {
      result.current.toggleTernaryDarkMode();
    });

    expect(mockSetValue).toHaveBeenCalledWith('light');
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
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0]?.[1];
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
    expect(useLocalStorage).toHaveBeenCalledWith(
      'custom-key',
      expect.any(Object)
    );
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

    expect(firstSetTernary).toBe(secondSetTernary);
    expect(firstToggle).toBe(secondToggle);
  });
});
