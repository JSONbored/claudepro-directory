import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReadLocalStorage } from './use-read-local-storage.ts';

// Mock logger
vi.mock('../logger.ts', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('useReadLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('should return null when key does not exist', () => {
    const { result } = renderHook(() => useReadLocalStorage('non-existent-key'));

    expect(result.current).toBe(null);
  });

  it('should return stored value', () => {
    window.localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    expect(result.current).toBe('stored-value');
  });

  it('should return undefined during SSR when initializeWithValue is false', () => {
    const originalWindow = global.window;
    delete (global as any).window;

    const { result } = renderHook(() =>
      useReadLocalStorage('test-key', { initializeWithValue: false })
    );

    expect(result.current).toBeUndefined();

    global.window = originalWindow;
  });

  it('should update when localStorage changes', async () => {
    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    expect(result.current).toBe(null);

    // Simulate storage event from another tab/component
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('updated-value'),
      storageArea: window.localStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current).toBe('updated-value');
  });

  it('should handle custom deserializer', () => {
    const deserializer = (value: string) => ({ id: Number(value) });
    window.localStorage.setItem('test-key', '42');

    const { result } = renderHook(() => useReadLocalStorage('test-key', { deserializer }));

    expect(result.current).toEqual({ id: 42 });
  });

  it('should handle localStorage errors gracefully', () => {
    const originalGetItem = window.localStorage.getItem;
    window.localStorage.getItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    expect(result.current).toBe(null);

    window.localStorage.getItem = originalGetItem;
  });
});
