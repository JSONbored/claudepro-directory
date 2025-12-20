import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from './use-dark-mode';
import type { UseDarkModeOptions } from './use-dark-mode';

// Mock useLocalStorage
const mockSetValue = vi.fn();
let mockStoredValue: string | null = null;

vi.mock('./use-local-storage', () => ({
  useLocalStorage: vi.fn((key: string, options: any) => {
    return {
      value: mockStoredValue ?? options.defaultValue ?? null,
      setValue: mockSetValue,
      removeValue: vi.fn(),
    };
  }),
}));

describe('useDarkMode', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockMediaQueryList: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStoredValue = null;
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

    // Mock document.documentElement
    document.documentElement.classList.remove('dark');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with OS preference when no stored preference', () => {
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDarkMode).toBe(true);
  });

  it('should use stored preference over OS preference', () => {
    mockStoredValue = 'false';
    mockMediaQueryList.matches = true; // OS prefers dark

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDarkMode).toBe(false);
  });

  it('should apply dark class to document root when isDarkMode is true', () => {
    mockMediaQueryList.matches = true;

    renderHook(() => useDarkMode());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should remove dark class from document root when isDarkMode is false', () => {
    mockMediaQueryList.matches = false;

    renderHook(() => useDarkMode());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should not apply dark class when applyDarkClass is false', () => {
    mockMediaQueryList.matches = true;

    renderHook(() => useDarkMode({ applyDarkClass: false } as UseDarkModeOptions));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should toggle dark mode', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDarkMode).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(mockSetValue).toHaveBeenCalledWith('true');
  });

  it('should enable dark mode', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useDarkMode());

    act(() => {
      result.current.enable();
    });

    expect(mockSetValue).toHaveBeenCalledWith('true');
  });

  it('should disable dark mode', () => {
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useDarkMode());

    act(() => {
      result.current.disable();
    });

    expect(mockSetValue).toHaveBeenCalledWith('false');
  });

  it('should set dark mode to specific value', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useDarkMode());

    act(() => {
      result.current.set(true);
    });

    expect(mockSetValue).toHaveBeenCalledWith('true');

    act(() => {
      result.current.set(false);
    });

    expect(mockSetValue).toHaveBeenCalledWith('false');
  });

  it('should listen for OS preference changes when no stored preference', () => {
    mockMediaQueryList.matches = false;

    renderHook(() => useDarkMode());

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should not update OS preference when stored preference exists', () => {
    mockStoredValue = 'true';
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDarkMode).toBe(true);

    // Simulate OS preference change
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0]?.[1];
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: true } as MediaQueryListEvent);
      });
    }

    // Should still be true (stored preference takes precedence)
    expect(result.current.isDarkMode).toBe(true);
  });

  it('should use custom localStorage key', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() =>
      useDarkMode({ localStorageKey: 'custom-key' } as UseDarkModeOptions)
    );

    act(() => {
      result.current.toggle();
    });

    // Verify setValue was called (stored via useLocalStorage)
    expect(mockSetValue).toHaveBeenCalled();
  });

  it('should handle SSR (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const { result } = renderHook(() => useDarkMode({ defaultValue: false } as UseDarkModeOptions));

    expect(result.current.isDarkMode).toBe(false);

    // Restore
    global.window = originalWindow;
  });

  it('should handle matchMedia error gracefully', () => {
    mockMatchMedia.mockImplementation(() => {
      throw new Error('matchMedia not supported');
    });

    const { result } = renderHook(() => useDarkMode({ defaultValue: false } as UseDarkModeOptions));

    expect(result.current.isDarkMode).toBe(false);
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useDarkMode());

    const firstToggle = result.current.toggle;
    const firstEnable = result.current.enable;
    const firstDisable = result.current.disable;
    const firstSet = result.current.set;

    rerender();

    const secondToggle = result.current.toggle;
    const secondEnable = result.current.enable;
    const secondDisable = result.current.disable;
    const secondSet = result.current.set;

    expect(firstToggle).toBe(secondToggle);
    expect(firstEnable).toBe(secondEnable);
    expect(firstDisable).toBe(secondDisable);
    expect(firstSet).toBe(secondSet);
  });
});
