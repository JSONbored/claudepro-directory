/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionStorage } from './use-session-storage.ts';

// Mock logger
jest.mock('../logger.ts', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

describe('useSessionStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
  });

  it('should initialize with default value when no stored value', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');
  });

  it('should load value from sessionStorage', () => {
    window.sessionStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() => useSessionStorage('test-key', 'default'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update sessionStorage when value changes', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(window.sessionStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should remove value from sessionStorage', () => {
    window.sessionStorage.setItem('test-key', JSON.stringify('value'));

    const { result } = renderHook(() => useSessionStorage('test-key', 'default'));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe('default');
    expect(window.sessionStorage.getItem('test-key')).toBeNull();
  });

  it('should handle functional updates', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 0));

    act(() => {
      result.current[1]((prev) => (prev as number) + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should handle custom serializer/deserializer', () => {
    const serializer = (value: { id: number }) => `${value.id}`;
    const deserializer = (value: string) => ({ id: Number(value) });

    const { result } = renderHook(() =>
      useSessionStorage('test-key', { id: 0 }, { serializer, deserializer })
    );

    act(() => {
      result.current[1]({ id: 42 });
    });

    expect(result.current[0]).toEqual({ id: 42 });
    expect(window.sessionStorage.getItem('test-key')).toBe('42');
  });

  it('should handle sessionStorage errors gracefully', async () => {
    const { logger } = require('../logger.ts');
    jest.mocked(logger.warn).mockClear();

    // Spy on sessionStorage.setItem and make it throw
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useSessionStorage('test-key', 'default'));

    act(() => {
      result.current[1]('new-value');
    });

    // Verify sessionStorage.setItem was called (and threw)
    expect(setItemSpy).toHaveBeenCalled();

    // Verify error was logged
    await waitFor(() => {
      expect(jest.mocked(logger.warn)).toHaveBeenCalled();
    });

    // Value should still be updated (state update happens before storage)
    expect(result.current[0]).toBe('new-value');

    setItemSpy.mockRestore();
  });

  it('should handle SSR safely', () => {
    const originalWindow = global.window;
    delete (global as any).window;

    const { result } = renderHook(() => useSessionStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');

    global.window = originalWindow;
  });

  it('should handle function initial value', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', () => 'computed-initial'));

    expect(result.current[0]).toBe('computed-initial');
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

    const initialValue: ComplexValue = { nested: { array: [], string: '', number: 0 } };

    const { result } = renderHook(() => useSessionStorage('test-key', initialValue));

    act(() => {
      result.current[1](complexValue);
    });

    expect(result.current[0]).toEqual(complexValue);
    expect(window.sessionStorage.getItem('test-key')).toBe(JSON.stringify(complexValue));
  });

  it('should handle array values', () => {
    type ArrayValue = (string | number | { id: number })[];
    const arrayValue: ArrayValue = [1, 2, 3, 'test', { id: 1 }];

    const { result } = renderHook(() => useSessionStorage<ArrayValue>('test-key', []));

    act(() => {
      result.current[1](arrayValue);
    });

    expect(result.current[0]).toEqual(arrayValue);
    expect(window.sessionStorage.getItem('test-key')).toBe(JSON.stringify(arrayValue));
  });

  it('should handle null and undefined values', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', null));

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
    expect(window.sessionStorage.getItem('test-key')).toBe(JSON.stringify(null));
  });

  it('should handle empty string values', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', ''));

    act(() => {
      result.current[1]('');
    });

    expect(result.current[0]).toBe('');
    expect(window.sessionStorage.getItem('test-key')).toBe(JSON.stringify(''));
  });

  it('should handle storage event from other components', async () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial'));

    // Simulate storage event from another component
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('updated-from-other-component'),
      oldValue: JSON.stringify('initial'),
      storageArea: window.sessionStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe('updated-from-other-component');
    });
  });

  it('should ignore storage events for different keys', async () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial'));

    // Simulate storage event for different key
    const storageEvent = new StorageEvent('storage', {
      key: 'other-key',
      newValue: JSON.stringify('other-value'),
      storageArea: window.sessionStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    // Should not update
    expect(result.current[0]).toBe('initial');
  });

  it('should handle storage event with null newValue (removal)', async () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial'));

    // Set initial value
    act(() => {
      result.current[1]('stored');
    });

    expect(result.current[0]).toBe('stored');

    // Simulate removal in another component
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: null,
      oldValue: JSON.stringify('stored'),
      storageArea: window.sessionStorage,
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe('initial');
    });
  });

  it('should handle multiple functional updates', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 0));

    // React batches state updates, so we need separate act() calls
    act(() => {
      result.current[1]((prev) => (prev as number) + 1);
    });

    act(() => {
      result.current[1]((prev) => (prev as number) + 1);
    });

    act(() => {
      result.current[1]((prev) => (prev as number) + 1);
    });

    expect(result.current[0]).toBe(3);
  });

  it('should handle initializeWithValue option', () => {
    window.sessionStorage.setItem('test-key', JSON.stringify('stored-value'));

    // With initializeWithValue: false, should use initial value
    const { result } = renderHook(() =>
      useSessionStorage('test-key', 'default', { initializeWithValue: false })
    );

    expect(result.current[0]).toBe('default');
  });

  it('should handle cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useSessionStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('stored');
    });

    unmount();

    // Storage event listener should be removed
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('after-unmount'),
      storageArea: window.sessionStorage,
    });

    // Should not cause errors after unmount
    expect(() => {
      window.dispatchEvent(storageEvent);
    }).not.toThrow();
  });

  it('should handle deserialization errors gracefully', async () => {
    const { logger } = require('../logger.ts');
    jest.mocked(logger.warn).mockClear();

    // Set invalid JSON in sessionStorage
    window.sessionStorage.setItem('test-key', 'invalid-json');

    const { result } = renderHook(() => useSessionStorage('test-key', 'default'));

    // Should fall back to default value and log error
    await waitFor(() => {
      expect(jest.mocked(logger.warn)).toHaveBeenCalled();
    });

    expect(result.current[0]).toBe('default');
  });
});
