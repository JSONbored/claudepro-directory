/**
 * Storage Test Helpers
 *
 * Reusable utilities for testing browser storage APIs (localStorage, sessionStorage, cookies).
 * Provides type-safe helpers for common storage testing scenarios.
 *
 * **Features:**
 * - localStorage mocking and testing
 * - sessionStorage mocking and testing
 * - Cookie manipulation and testing
 * - Storage event testing
 * - Quota and error handling
 *
 * @module tests/utils/storage-helpers
 */

import { afterEach } from 'vitest';

// =============================================================================
// Storage Mock Implementation
// =============================================================================

/**
 * Create a mock Storage implementation
 *
 * Mimics browser localStorage/sessionStorage API for testing.
 *
 * @returns Mock Storage object
 */
export function createMockStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
}

/**
 * Mock localStorage for tests
 *
 * Replaces global localStorage with a mock implementation.
 * Automatically restores original after tests.
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   mockLocalStorage();
 * });
 *
 * test('should store data in localStorage', () => {
 *   localStorage.setItem('key', 'value');
 *   expect(localStorage.getItem('key')).toBe('value');
 * });
 * ```
 */
export function mockLocalStorage(): Storage {
  const mockStorage = createMockStorage();
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
  return mockStorage;
}

/**
 * Mock sessionStorage for tests
 *
 * Replaces global sessionStorage with a mock implementation.
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   mockSessionStorage();
 * });
 * ```
 */
export function mockSessionStorage(): Storage {
  const mockStorage = createMockStorage();
  Object.defineProperty(window, 'sessionStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
  return mockStorage;
}

/**
 * Clear all storage types
 *
 * Clears localStorage, sessionStorage, and cookies.
 * Useful for test cleanup.
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   clearAllStorage();
 * });
 * ```
 */
export function clearAllStorage(): void {
  if (typeof window !== 'undefined') {
    window.localStorage?.clear();
    window.sessionStorage?.clear();
    clearAllCookies();
  }
}

// =============================================================================
// localStorage Helpers
// =============================================================================

/**
 * Set item in localStorage with automatic JSON serialization
 *
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 *
 * @example
 * ```ts
 * setLocalStorageItem('user', { id: 1, name: 'John' });
 * ```
 */
export function setLocalStorageItem(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Get item from localStorage with automatic JSON parsing
 *
 * @param key - Storage key
 * @returns Parsed value or null if not found
 *
 * @example
 * ```ts
 * const user = getLocalStorageItem<User>('user');
 * expect(user?.id).toBe(1);
 * ```
 */
export function getLocalStorageItem<T>(key: string): T | null {
  const item = localStorage.getItem(key);
  if (!item) return null;

  try {
    return JSON.parse(item) as T;
  } catch {
    return item as T;
  }
}

/**
 * Expect localStorage to contain key
 *
 * @param key - Expected storage key
 *
 * @example
 * ```ts
 * expectLocalStorageToHaveKey('token');
 * ```
 */
export function expectLocalStorageToHaveKey(key: string): void {
  expect(localStorage.getItem(key)).not.toBeNull();
}

/**
 * Expect localStorage to not contain key
 *
 * @param key - Expected missing storage key
 */
export function expectLocalStorageNotToHaveKey(key: string): void {
  expect(localStorage.getItem(key)).toBeNull();
}

/**
 * Expect localStorage value to equal expected
 *
 * @param key - Storage key
 * @param expectedValue - Expected value (will be JSON compared)
 *
 * @example
 * ```ts
 * expectLocalStorageValue('user', { id: 1, name: 'John' });
 * ```
 */
export function expectLocalStorageValue(key: string, expectedValue: unknown): void {
  const actual = getLocalStorageItem(key);
  expect(actual).toEqual(expectedValue);
}

/**
 * Get all localStorage keys
 *
 * @returns Array of all keys in localStorage
 */
export function getLocalStorageKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

/**
 * Expect localStorage to be empty
 */
export function expectLocalStorageEmpty(): void {
  expect(localStorage.length).toBe(0);
}

// =============================================================================
// sessionStorage Helpers
// =============================================================================

/**
 * Set item in sessionStorage with automatic JSON serialization
 *
 * @param key - Storage key
 * @param value - Value to store
 */
export function setSessionStorageItem(key: string, value: unknown): void {
  sessionStorage.setItem(key, JSON.stringify(value));
}

/**
 * Get item from sessionStorage with automatic JSON parsing
 *
 * @param key - Storage key
 * @returns Parsed value or null
 */
export function getSessionStorageItem<T>(key: string): T | null {
  const item = sessionStorage.getItem(key);
  if (!item) return null;

  try {
    return JSON.parse(item) as T;
  } catch {
    return item as T;
  }
}

/**
 * Expect sessionStorage to contain key
 *
 * @param key - Expected storage key
 */
export function expectSessionStorageToHaveKey(key: string): void {
  expect(sessionStorage.getItem(key)).not.toBeNull();
}

/**
 * Expect sessionStorage value to equal expected
 *
 * @param key - Storage key
 * @param expectedValue - Expected value
 */
export function expectSessionStorageValue(key: string, expectedValue: unknown): void {
  const actual = getSessionStorageItem(key);
  expect(actual).toEqual(expectedValue);
}

// =============================================================================
// Cookie Helpers
// =============================================================================

/**
 * Cookie options for setting cookies
 */
export interface CookieOptions {
  /** Expiration date or max-age in seconds */
  expires?: Date | number;
  /** Cookie path */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** Secure flag */
  secure?: boolean;
  /** SameSite attribute */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /** HttpOnly flag (note: not enforceable in JS) */
  httpOnly?: boolean;
}

/**
 * Set a cookie
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 *
 * @example
 * ```ts
 * setCookie('token', 'abc123', { expires: 7, path: '/', secure: true });
 * ```
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    if (typeof options.expires === 'number') {
      // Max-age in seconds
      cookieString += `; max-age=${options.expires}`;
    } else {
      // Date object
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Get cookie value by name
 *
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 *
 * @example
 * ```ts
 * const token = getCookie('token');
 * expect(token).toBe('abc123');
 * ```
 */
export function getCookie(name: string): string | null {
  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Delete cookie by name
 *
 * @param name - Cookie name
 * @param options - Cookie options (path, domain)
 *
 * @example
 * ```ts
 * deleteCookie('token', { path: '/' });
 * ```
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  setCookie(name, '', {
    ...options,
    expires: new Date(0),
  });
}

/**
 * Get all cookies as an object
 *
 * @returns Object with cookie names as keys
 *
 * @example
 * ```ts
 * const cookies = getAllCookies();
 * expect(cookies.token).toBe('abc123');
 * ```
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};
  const cookieStrings = document.cookie.split(';');

  for (let cookie of cookieStrings) {
    cookie = cookie.trim();
    const [name, ...valueParts] = cookie.split('=');
    if (name) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(valueParts.join('='));
    }
  }

  return cookies;
}

/**
 * Clear all cookies
 *
 * Note: This only clears cookies accessible to JavaScript.
 * HttpOnly cookies cannot be cleared this way.
 */
export function clearAllCookies(): void {
  const cookies = getAllCookies();
  for (const name of Object.keys(cookies)) {
    deleteCookie(name, { path: '/' });
  }
}

/**
 * Expect cookie to exist
 *
 * @param name - Cookie name
 */
export function expectCookieToExist(name: string): void {
  expect(getCookie(name)).not.toBeNull();
}

/**
 * Expect cookie to not exist
 *
 * @param name - Cookie name
 */
export function expectCookieNotToExist(name: string): void {
  expect(getCookie(name)).toBeNull();
}

/**
 * Expect cookie value
 *
 * @param name - Cookie name
 * @param expectedValue - Expected cookie value
 */
export function expectCookieValue(name: string, expectedValue: string): void {
  expect(getCookie(name)).toBe(expectedValue);
}

// =============================================================================
// Storage Event Testing
// =============================================================================

/**
 * Create a storage event
 *
 * Useful for testing storage event listeners.
 *
 * @param key - Storage key
 * @param oldValue - Old value
 * @param newValue - New value
 * @param storageArea - Storage area (localStorage or sessionStorage)
 * @returns StorageEvent
 *
 * @example
 * ```ts
 * const event = createStorageEvent('token', null, 'abc123', localStorage);
 * window.dispatchEvent(event);
 * ```
 */
export function createStorageEvent(
  key: string | null,
  oldValue: string | null,
  newValue: string | null,
  _storageArea: Storage = localStorage
): StorageEvent {
  // Note: storageArea is readonly and cannot be set in StorageEvent constructor
  // It's automatically set by the browser. We keep the parameter for API compatibility
  // but prefix with _ to indicate it's intentionally unused in the test environment.
  return new StorageEvent('storage', {
    key,
    oldValue,
    newValue,
    url: window.location.href,
  });
}

/**
 * Trigger storage event
 *
 * Simulates a storage change from another tab/window.
 *
 * @param key - Storage key
 * @param oldValue - Old value
 * @param newValue - New value
 * @param storageArea - Storage area
 *
 * @example
 * ```ts
 * triggerStorageEvent('token', null, 'abc123');
 * expect(mockListener).toHaveBeenCalled();
 * ```
 */
export function triggerStorageEvent(
  key: string | null,
  oldValue: string | null,
  newValue: string | null,
  storageArea: Storage = localStorage
): void {
  const event = createStorageEvent(key, oldValue, newValue, storageArea);
  window.dispatchEvent(event);
}

/**
 * Mock storage event listener
 *
 * Creates a mock function and registers it as a storage event listener.
 * Automatically cleans up after tests.
 *
 * @returns Mock listener function
 *
 * @example
 * ```ts
 * const listener = mockStorageListener();
 * triggerStorageEvent('token', null, 'abc123');
 * expect(listener).toHaveBeenCalled();
 * ```
 */
export function mockStorageListener(): ReturnType<typeof vi.fn> {
  const listener = vi.fn();
  window.addEventListener('storage', listener);

  afterEach(() => {
    window.removeEventListener('storage', listener);
  });

  return listener;
}

// =============================================================================
// Storage Quota Testing
// =============================================================================

/**
 * Fill storage to capacity
 *
 * Attempts to fill localStorage to test quota exceeded scenarios.
 *
 * @param storage - Storage to fill (default: localStorage)
 *
 * @example
 * ```ts
 * fillStorageToCapacity();
 * expect(() => localStorage.setItem('key', 'value')).toThrow();
 * ```
 */
export function fillStorageToCapacity(storage: Storage = localStorage): void {
  try {
    let i = 0;
    // Try to fill storage with 1MB chunks
    while (i < 10000) {
      const key = `fill_${i}`;
      const value = 'x'.repeat(1024 * 1024); // 1MB
      storage.setItem(key, value);
      i++;
    }
  } catch {
    // Storage is full
  }
}

/**
 * Mock storage quota exceeded
 *
 * Mocks localStorage.setItem to throw QuotaExceededError.
 *
 * @example
 * ```ts
 * mockStorageQuotaExceeded();
 * expect(() => localStorage.setItem('key', 'value')).toThrow();
 * ```
 */
export function mockStorageQuotaExceeded(): void {
  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.setItem = function (key: string, value: string) {
    const error = new Error('QuotaExceededError');
    error.name = 'QuotaExceededError';
    throw error;
  };

  afterEach(() => {
    Storage.prototype.setItem = originalSetItem;
  });
}

// =============================================================================
// Storage Persistence Testing
// =============================================================================

/**
 * Test storage persistence
 *
 * Verifies that data persists across page reloads (simulated).
 *
 * @param storage - Storage to test
 * @param key - Test key
 * @param value - Test value
 *
 * @example
 * ```ts
 * testStoragePersistence(localStorage, 'token', 'abc123');
 * ```
 */
export function testStoragePersistence(storage: Storage, key: string, value: string): void {
  // Set value
  storage.setItem(key, value);

  // Verify it's set
  expect(storage.getItem(key)).toBe(value);

  // Simulate page reload by creating new storage instance
  const mockStorage = createMockStorage();

  // Copy data to new instance
  for (let i = 0; i < storage.length; i++) {
    const storageKey = storage.key(i);
    if (storageKey) {
      const storageValue = storage.getItem(storageKey);
      if (storageValue) {
        mockStorage.setItem(storageKey, storageValue);
      }
    }
  }

  // Verify data persisted
  expect(mockStorage.getItem(key)).toBe(value);
}

// =============================================================================
// Cleanup Utilities
// =============================================================================

/**
 * Auto-cleanup storage after each test
 *
 * Registers afterEach hook to clear all storage.
 *
 * @example
 * ```ts
 * describe('My tests', () => {
 *   autoCleanupStorage();
 *
 *   test('should use localStorage', () => {
 *     localStorage.setItem('key', 'value');
 *   });
 *   // Storage automatically cleared after test
 * });
 * ```
 */
export function autoCleanupStorage(): void {
  afterEach(() => {
    clearAllStorage();
  });
}
