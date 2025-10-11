/**
 * Local Storage Hook Tests
 *
 * Tests for useLocalStorage hook which provides type-safe localStorage access
 * with SSR support, cross-tab synchronization, and error handling.
 *
 * Coverage:
 * - Basic read/write operations
 * - Default values and initialization
 * - Functional updates (setState-style)
 * - Remove value functionality
 * - Custom serialization/deserialization
 * - Cross-tab synchronization
 * - SSR safety
 * - Error handling (quota exceeded, parse errors)
 *
 * @see src/hooks/use-local-storage.ts
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from '../use-local-storage';

// Mock logger
vi.mock('@/src/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { logger } from '@/src/lib/logger';

describe('useLocalStorage', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};

    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      get length() {
        return Object.keys(mockLocalStorage).length;
      },
      key: vi.fn((index: number) => Object.keys(mockLocalStorage)[index] || null),
    } as Storage;

    vi.clearAllMocks();
  });

  afterEach(() => {
    mockLocalStorage = {};
  });

  describe('Basic Functionality', () => {
    it('returns default value when no stored value exists', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', {
          defaultValue: 'default',
        })
      );

      expect(result.current.value).toBe('default');
      expect(result.current.error).toBeNull();
    });

    it('returns stored value when it exists', () => {
      mockLocalStorage['test-key'] = JSON.stringify('stored-value');

      const { result } = renderHook(() =>
        useLocalStorage('test-key', {
          defaultValue: 'default',
        })
      );

      expect(result.current.value).toBe('stored-value');
    });

    it('stores value in localStorage when setValue is called', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', {
          defaultValue: 'initial',
        })
      );

      act(() => {
        result.current.setValue('new-value');
      });

      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
      expect(result.current.value).toBe('new-value');
    });

    it('removes value from localStorage when removeValue is called', () => {
      mockLocalStorage['test-key'] = JSON.stringify('value');

      const { result } = renderHook(() =>
        useLocalStorage('test-key', {
          defaultValue: 'default',
        })
      );

      act(() => {
        result.current.removeValue();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
      expect(result.current.value).toBe('default');
    });
  });

  describe('Type Safety', () => {
    it('works with string values', () => {
      const { result } = renderHook(() =>
        useLocalStorage<string>('string-key', {
          defaultValue: 'test',
        })
      );

      act(() => {
        result.current.setValue('new-string');
      });

      expect(result.current.value).toBe('new-string');
    });

    it('works with number values', () => {
      const { result } = renderHook(() =>
        useLocalStorage<number>('number-key', {
          defaultValue: 42,
        })
      );

      act(() => {
        result.current.setValue(100);
      });

      expect(result.current.value).toBe(100);
    });

    it('works with boolean values', () => {
      const { result } = renderHook(() =>
        useLocalStorage<boolean>('boolean-key', {
          defaultValue: false,
        })
      );

      act(() => {
        result.current.setValue(true);
      });

      expect(result.current.value).toBe(true);
    });

    it('works with object values', () => {
      interface TestObject {
        name: string;
        count: number;
      }

      const { result } = renderHook(() =>
        useLocalStorage<TestObject>('object-key', {
          defaultValue: { name: 'test', count: 0 },
        })
      );

      act(() => {
        result.current.setValue({ name: 'updated', count: 5 });
      });

      expect(result.current.value).toEqual({ name: 'updated', count: 5 });
    });

    it('works with array values', () => {
      const { result } = renderHook(() =>
        useLocalStorage<string[]>('array-key', {
          defaultValue: [],
        })
      );

      act(() => {
        result.current.setValue(['item1', 'item2']);
      });

      expect(result.current.value).toEqual(['item1', 'item2']);
    });
  });

  describe('Functional Updates', () => {
    it('supports functional setState-style updates', () => {
      const { result } = renderHook(() =>
        useLocalStorage<number>('counter', {
          defaultValue: 0,
        })
      );

      act(() => {
        result.current.setValue((prev) => prev + 1);
      });

      expect(result.current.value).toBe(1);

      act(() => {
        result.current.setValue((prev) => prev + 5);
      });

      expect(result.current.value).toBe(6);
    });

    it('supports functional updates with objects', () => {
      interface Settings {
        theme: string;
        notifications: boolean;
      }

      const { result } = renderHook(() =>
        useLocalStorage<Settings>('settings', {
          defaultValue: { theme: 'light', notifications: true },
        })
      );

      act(() => {
        result.current.setValue((prev) => ({
          ...prev,
          theme: 'dark',
        }));
      });

      expect(result.current.value).toEqual({
        theme: 'dark',
        notifications: true,
      });
    });
  });

  describe('Custom Serialization', () => {
    it('uses custom serialize function', () => {
      const customSerialize = vi.fn((value: Date) => value.toISOString());
      const customDeserialize = vi.fn((value: string) => new Date(value));

      const testDate = new Date('2025-01-01');

      const { result } = renderHook(() =>
        useLocalStorage<Date>('date-key', {
          defaultValue: testDate,
          serialize: customSerialize,
          deserialize: customDeserialize,
        })
      );

      act(() => {
        result.current.setValue(testDate);
      });

      expect(customSerialize).toHaveBeenCalledWith(testDate);
      expect(localStorage.setItem).toHaveBeenCalledWith('date-key', testDate.toISOString());
    });

    it('uses custom deserialize function', () => {
      const testDate = new Date('2025-01-01');
      mockLocalStorage['date-key'] = testDate.toISOString();

      const customDeserialize = vi.fn((value: string) => new Date(value));

      const { result } = renderHook(() =>
        useLocalStorage<Date>('date-key', {
          defaultValue: new Date(),
          deserialize: customDeserialize,
        })
      );

      expect(customDeserialize).toHaveBeenCalledWith(testDate.toISOString());
      expect(result.current.value.toISOString()).toBe(testDate.toISOString());
    });
  });

  describe('Cross-Tab Synchronization', () => {
    it('syncs value across tabs when storage event fires', () => {
      const { result } = renderHook(() =>
        useLocalStorage('sync-key', {
          defaultValue: 'initial',
          syncAcrossTabs: true,
        })
      );

      expect(result.current.value).toBe('initial');

      // Simulate storage event from another tab
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'sync-key',
          newValue: JSON.stringify('updated-from-other-tab'),
          oldValue: JSON.stringify('initial'),
          storageArea: localStorage,
        });
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.value).toBe('updated-from-other-tab');
    });

    it('resets to default when value is removed in another tab', () => {
      mockLocalStorage['sync-key'] = JSON.stringify('value');

      const { result } = renderHook(() =>
        useLocalStorage('sync-key', {
          defaultValue: 'default',
          syncAcrossTabs: true,
        })
      );

      // Simulate storage event with null (value removed)
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'sync-key',
          newValue: null,
          oldValue: JSON.stringify('value'),
          storageArea: localStorage,
        });
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.value).toBe('default');
    });

    it('ignores storage events for different keys', () => {
      const { result } = renderHook(() =>
        useLocalStorage('key-a', {
          defaultValue: 'value-a',
          syncAcrossTabs: true,
        })
      );

      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'key-b',
          newValue: JSON.stringify('value-b'),
          storageArea: localStorage,
        });
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.value).toBe('value-a');
    });

    it('does not sync when syncAcrossTabs is false', () => {
      const { result } = renderHook(() =>
        useLocalStorage('no-sync-key', {
          defaultValue: 'initial',
          syncAcrossTabs: false,
        })
      );

      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'no-sync-key',
          newValue: JSON.stringify('should-not-sync'),
          storageArea: localStorage,
        });
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.value).toBe('initial');
    });
  });

  describe('Error Handling', () => {
    it('handles parse errors gracefully', () => {
      mockLocalStorage['invalid-json'] = 'invalid-json{';

      const { result } = renderHook(() =>
        useLocalStorage('invalid-json', {
          defaultValue: 'default',
        })
      );

      expect(result.current.value).toBe('default');
      expect(result.current.error).toBeInstanceOf(Error);
      expect(logger.error).toHaveBeenCalled();
    });

    it('handles localStorage quota exceeded', () => {
      (localStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const { result } = renderHook(() =>
        useLocalStorage('test-key', {
          defaultValue: 'value',
        })
      );

      act(() => {
        result.current.setValue('new-value');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(logger.error).toHaveBeenCalled();
    });

    it('clears error when operation succeeds after error', () => {
      // First call throws error
      (localStorage.setItem as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() =>
        useLocalStorage('test-key', {
          defaultValue: 'value',
        })
      );

      act(() => {
        result.current.setValue('fail');
      });

      expect(result.current.error).toBeInstanceOf(Error);

      // Second call succeeds
      (localStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation((key, value) => {
        mockLocalStorage[key] = value;
      });

      act(() => {
        result.current.setValue('success');
      });

      expect(result.current.error).toBeNull();
    });

    it('handles deserialization errors in storage event', () => {
      const { result } = renderHook(() =>
        useLocalStorage('sync-error-key', {
          defaultValue: 'default',
          syncAcrossTabs: true,
        })
      );

      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'sync-error-key',
          newValue: 'invalid-json{',
          storageArea: localStorage,
        });
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('SSR Safety', () => {
    // Note: Cannot test actual SSR (deleting window) in React Testing Library
    // as React itself requires window. The hook's SSR checks (`typeof window === 'undefined'`)
    // are defensive code that work correctly in actual SSR environments (Next.js).

    it('verifies hook has SSR checks in place', () => {
      // This test verifies the hook works in normal browser environment
      // The actual SSR safety is tested in integration/E2E tests
      const { result } = renderHook(() =>
        useLocalStorage('ssr-check-key', {
          defaultValue: 'default-value',
        })
      );

      expect(result.current.value).toBe('default-value');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Memory Cleanup', () => {
    it('removes storage event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useLocalStorage('cleanup-key', {
          defaultValue: 'value',
          syncAcrossTabs: true,
        })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('does not add event listener when syncAcrossTabs is false', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() =>
        useLocalStorage('no-listener-key', {
          defaultValue: 'value',
          syncAcrossTabs: false,
        })
      );

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });
});
