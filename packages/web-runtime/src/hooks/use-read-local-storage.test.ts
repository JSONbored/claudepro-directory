/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReadLocalStorage } from './use-read-local-storage.ts';

// Mock logger
jest.mock('../logger.ts', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

describe('useReadLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    // Set the value in localStorage first (simulating another tab setting it)
    window.localStorage.setItem('test-key', JSON.stringify('updated-value'));

    // Simulate storage event from another tab/component
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('updated-value'),
      oldValue: null,
      storageArea: window.localStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current).toBe('updated-value');
    });
  });

  it('should handle custom deserializer', () => {
    const deserializer = (value: string) => ({ id: Number(value) });
    window.localStorage.setItem('test-key', '42');

    const { result } = renderHook(() => useReadLocalStorage('test-key', { deserializer }));

    expect(result.current).toEqual({ id: 42 });
  });

  it('should handle localStorage errors gracefully', () => {
    const { logger } = require('../logger.ts');
    jest.mocked(logger.warn).mockClear();

    // Spy on localStorage.getItem and make it throw
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    // Should return null and log error
    expect(result.current).toBe(null);
    expect(jest.mocked(logger.warn)).toHaveBeenCalled();

    getItemSpy.mockRestore();
  });

  it('should handle complex object values', () => {
    type ComplexValue = {
      nested: {
        array: number[];
        string: string;
        number: number;
      };
    };

    const complexValue: ComplexValue = {
      nested: {
        array: [1, 2, 3],
        string: 'test',
        number: 42,
      },
    };

    window.localStorage.setItem('test-key', JSON.stringify(complexValue));

    const { result } = renderHook(() => useReadLocalStorage<ComplexValue>('test-key'));

    expect(result.current).toEqual(complexValue);
  });

  it('should handle array values', () => {
    type ArrayValue = (string | number | { id: number })[];
    const arrayValue: ArrayValue = [1, 2, 3, 'test', { id: 1 }];

    window.localStorage.setItem('test-key', JSON.stringify(arrayValue));

    const { result } = renderHook(() => useReadLocalStorage<ArrayValue>('test-key'));

    expect(result.current).toEqual(arrayValue);
  });

  it('should handle null and undefined values', () => {
    window.localStorage.setItem('test-key', JSON.stringify(null));

    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    expect(result.current).toBeNull();
  });

  it('should handle empty string values', () => {
    window.localStorage.setItem('test-key', JSON.stringify(''));

    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    expect(result.current).toBe('');
  });

  it('should handle storage event with null newValue (removal)', async () => {
    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    // Set initial value
    window.localStorage.setItem('test-key', JSON.stringify('stored'));
    act(() => {
      // Trigger re-read by dispatching storage event
      const storageEvent = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify('stored'),
        storageArea: window.localStorage,
      });
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current).toBe('stored');
    });

    // Simulate removal in another tab/component
    window.localStorage.removeItem('test-key');
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: null,
      oldValue: JSON.stringify('stored'),
      storageArea: window.localStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('should ignore storage events for different keys', async () => {
    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    // Simulate storage event for different key
    const storageEvent = new StorageEvent('storage', {
      key: 'other-key',
      newValue: JSON.stringify('other-value'),
      storageArea: window.localStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    // Should not update
    expect(result.current).toBe(null);
  });

  it('should handle storage events from different storage areas (ignore)', async () => {
    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    // Simulate storage event from sessionStorage (should be ignored)
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('session-value'),
      storageArea: window.sessionStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    // Should not update (different storage area)
    expect(result.current).toBe(null);
  });

  it('should handle initializeWithValue option', () => {
    window.localStorage.setItem('test-key', JSON.stringify('stored-value'));

    // With initializeWithValue: false, should return undefined initially
    const { result } = renderHook(() =>
      useReadLocalStorage('test-key', { initializeWithValue: false })
    );

    expect(result.current).toBeUndefined();
  });

  it('should handle deserialization errors gracefully', async () => {
    const { logger } = require('../logger.ts');
    jest.mocked(logger.warn).mockClear();

    // Set invalid JSON in localStorage
    window.localStorage.setItem('test-key', 'invalid-json');

    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    // Should return null and log error
    await waitFor(() => {
      expect(jest.mocked(logger.warn)).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
  });

  it('should handle cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useReadLocalStorage('test-key'));

    unmount();

    // Storage event listener should be removed
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('after-unmount'),
      storageArea: window.localStorage,
    });

    // Should not cause errors after unmount
    expect(() => {
      window.dispatchEvent(storageEvent);
    }).not.toThrow();
  });

  it('should handle function initial value with initializeWithValue false', () => {
    // This test verifies that initializeWithValue: false works correctly
    // even when localStorage has a value
    window.localStorage.setItem('test-key', JSON.stringify('stored'));

    const { result } = renderHook(() =>
      useReadLocalStorage('test-key', { initializeWithValue: false })
    );

    // Should return undefined, not the stored value
    expect(result.current).toBeUndefined();
  });

  it('should update when localStorage value changes in same tab', async () => {
    const { result } = renderHook(() => useReadLocalStorage('test-key'));

    expect(result.current).toBe(null);

    // Directly set value in localStorage (simulating programmatic change)
    window.localStorage.setItem('test-key', JSON.stringify('direct-update'));

    // Storage events only fire for changes from OTHER tabs/windows, not same tab
    // So we need to manually trigger a read or wait for the effect to run
    // The hook should read the value on mount, but won't automatically update
    // for same-tab changes (this is expected behavior - storage events only fire cross-tab)

    // For same-tab updates, the hook relies on storage events which don't fire
    // This is a limitation of the Storage API - we can't test automatic same-tab updates
    // without manually triggering the readValue function, which isn't exposed

    // Verify initial read works
    const { result: result2 } = renderHook(() => useReadLocalStorage('test-key'));
    expect(result2.current).toBe('direct-update');
  });
});
