import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalStorage, PROHIBITED_LOCALSTORAGE_PATTERNS } from './use-local-storage.ts';

// Mock dependencies
vi.mock('../logger.ts', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock('../data.ts', () => ({
  ParseStrategy: {
    VALIDATED_JSON: 'VALIDATED_JSON',
  },
  safeParse: vi.fn((value, schema) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }),
}));

vi.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  isDevelopment: false,
}));

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with default value when no stored value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { defaultValue: 'default' }));

    expect(result.current.value).toBe('default');
  });

  it('should load value from localStorage', () => {
    window.localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', { defaultValue: 'default' }));

    expect(result.current.value).toBe('stored-value');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { defaultValue: 'initial' }));

    act(() => {
      result.current.setValue('updated');
    });

    expect(result.current.value).toBe('updated');
    expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should remove value from localStorage', () => {
    window.localStorage.setItem('test-key', JSON.stringify('value'));

    const { result } = renderHook(() => useLocalStorage('test-key', { defaultValue: 'default' }));

    act(() => {
      result.current.removeValue();
    });

    expect(result.current.value).toBe('default');
    expect(window.localStorage.getItem('test-key')).toBeNull();
  });

  it('should handle functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { defaultValue: 0 }));

    act(() => {
      result.current.setValue((prev) => (prev as number) + 1);
    });

    expect(result.current.value).toBe(1);
  });

  it('should sync across tabs', async () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { defaultValue: 'initial', syncAcrossTabs: true })
    );

    // Simulate storage event from another tab
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('updated-from-other-tab'),
      storageArea: window.localStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current.value).toBe('updated-from-other-tab');
    });
  });

  it('should not sync when syncAcrossTabs is false', async () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { defaultValue: 'initial', syncAcrossTabs: false })
    );

    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('updated-from-other-tab'),
      storageArea: window.localStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    // Should not update
    expect(result.current.value).toBe('initial');
  });

  it('should handle custom serializer/deserializer', () => {
    const serializer = (value: { id: number }) => `${value.id}`;
    const deserializer = (value: string) => ({ id: Number(value) });

    const { result } = renderHook(() =>
      useLocalStorage('test-key', {
        defaultValue: { id: 0 },
        serialize: serializer,
        deserialize: deserializer,
      })
    );

    act(() => {
      result.current.setValue({ id: 42 });
    });

    expect(result.current.value).toEqual({ id: 42 });
    expect(window.localStorage.getItem('test-key')).toBe('42');
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.setItem to throw
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', { defaultValue: 'default' }));

    act(() => {
      result.current.setValue('new-value');
    });

    // Should not crash, error should be set
    expect(result.current.error).toBeTruthy();

    window.localStorage.setItem = originalSetItem;
  });

  it('should warn about sensitive key patterns in development', async () => {
    vi.mocked(await import('@heyclaude/shared-runtime/schemas/env')).isDevelopment = true;
    const { logger } = await import('../logger.ts');

    renderHook(() => useLocalStorage('user-password', { defaultValue: 'default' }));

    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'user-password',
      }),
      expect.stringContaining('sensitive pattern')
    );
  });

  it('should not warn about safe keys', () => {
    const { logger } = require('../logger.ts');

    renderHook(() => useLocalStorage('user-preference', { defaultValue: 'default' }));

    expect(vi.mocked(logger.warn)).not.toHaveBeenCalled();
  });

  it('should handle SSR safely', () => {
    // Simulate SSR by removing window
    const originalWindow = global.window;
    delete (global as any).window;

    const { result } = renderHook(() => useLocalStorage('test-key', { defaultValue: 'default' }));

    expect(result.current.value).toBe('default');

    // Restore window
    global.window = originalWindow;
  });
});

describe('PROHIBITED_LOCALSTORAGE_PATTERNS', () => {
  it('should contain expected sensitive patterns', () => {
    expect(PROHIBITED_LOCALSTORAGE_PATTERNS).toContain('password');
    expect(PROHIBITED_LOCALSTORAGE_PATTERNS).toContain('token');
    expect(PROHIBITED_LOCALSTORAGE_PATTERNS).toContain('secret');
    expect(PROHIBITED_LOCALSTORAGE_PATTERNS).toContain('auth');
  });
});
