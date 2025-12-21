/**
 * Infisical Cache Tests
 *
 * Comprehensive tests for Infisical secret cache functionality:
 * - Cache initialization
 * - Secret caching and retrieval
 * - Global cache registration
 * - Error handling
 * - Concurrent initialization
 * - Edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock server-only to prevent import errors
vi.mock('server-only', () => ({}));

// Mock Infisical client module
const mockIsInfisicalEnabled = vi.fn(() => true);
const mockGetInfisicalEnvironment = vi.fn(() => 'dev' as const);
const mockGetInfisicalSecret = vi.fn();

vi.mock('./client.ts', () => ({
  isInfisicalEnabled: () => mockIsInfisicalEnabled(),
  getInfisicalEnvironment: () => mockGetInfisicalEnvironment(),
  getInfisicalSecret: mockGetInfisicalSecret,
}));

// Import after mocks
import {
  initializeInfisicalSecrets,
  getInfisicalCachedSecret,
  isInfisicalCacheInitialized,
  hasInfisicalCacheError,
  getInfisicalCacheError,
  clearInfisicalCache,
  getCachedSecretNames,
} from './cache';

describe('Infisical Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearInfisicalCache();
    vi.clearAllMocks();
    mockIsInfisicalEnabled.mockReturnValue(true);
    mockGetInfisicalEnvironment.mockReturnValue('dev');
    mockGetInfisicalSecret.mockReset();

    // Clear global cache
    delete (globalThis as any).__INFISICAL_CACHE__;
  });

  afterEach(() => {
    clearInfisicalCache();
    vi.restoreAllMocks();
  });

  describe('initializeInfisicalSecrets', () => {
    it('should initialize cache with secrets', async () => {
      mockGetInfisicalSecret
        .mockResolvedValueOnce('secret-value-1')
        .mockResolvedValueOnce('secret-value-2');

      await initializeInfisicalSecrets(['SECRET_1', 'SECRET_2']);

      expect(isInfisicalCacheInitialized()).toBe(true);
      expect(getInfisicalCachedSecret('SECRET_1')).toBe('secret-value-1');
      expect(getInfisicalCachedSecret('SECRET_2')).toBe('secret-value-2');
    });

    it('should use COMMON_SECRET_NAMES when no list provided', async () => {
      mockGetInfisicalSecret.mockResolvedValue('test-value');

      await initializeInfisicalSecrets();

      // Should fetch common secrets
      expect(mockGetInfisicalSecret).toHaveBeenCalled();
      expect(isInfisicalCacheInitialized()).toBe(true);
    });

    it('should skip initialization when Infisical is disabled', async () => {
      mockIsInfisicalEnabled.mockReturnValue(false);

      await initializeInfisicalSecrets(['SECRET_1']);

      expect(isInfisicalCacheInitialized()).toBe(true);
      expect(getInfisicalCachedSecret('SECRET_1')).toBeUndefined();
      expect(mockGetInfisicalSecret).not.toHaveBeenCalled();
    });

    it('should handle individual secret fetch failures', async () => {
      mockGetInfisicalSecret
        .mockResolvedValueOnce('success-value')
        .mockRejectedValueOnce(new Error('Secret not found'));

      await initializeInfisicalSecrets(['SUCCESS_SECRET', 'FAILED_SECRET']);

      expect(isInfisicalCacheInitialized()).toBe(true);
      expect(getInfisicalCachedSecret('SUCCESS_SECRET')).toBe('success-value');
      // Failed secret should be cached as undefined to avoid repeated API calls
      expect(getInfisicalCachedSecret('FAILED_SECRET')).toBeUndefined();
      // Individual failures don't set initializationError
      expect(hasInfisicalCacheError()).toBe(false);
    });

    it('should register cache on global object', async () => {
      mockGetInfisicalSecret.mockResolvedValue('test-value');

      await initializeInfisicalSecrets(['TEST_SECRET']);

      const globalCache = (globalThis as any).__INFISICAL_CACHE__;
      expect(globalCache).toBeDefined();
      expect(globalCache.isInitialized()).toBe(true);
      expect(globalCache.getSecret('TEST_SECRET')).toBe('test-value');
      expect(globalCache.getCachedSecretNames()).toContain('TEST_SECRET');
    });

    it('should handle initialization errors gracefully', async () => {
      // Simulate error by making getInfisicalSecret throw during initialization
      // This tests the catch block that sets initializationError
      const initError = new Error('Initialization failed');
      // Make the entire initialization fail (e.g., if isInfisicalEnabled throws)
      mockIsInfisicalEnabled.mockImplementation(() => {
        throw initError;
      });

      await initializeInfisicalSecrets(['TEST_SECRET']);

      expect(isInfisicalCacheInitialized()).toBe(true);
      expect(hasInfisicalCacheError()).toBe(true);
      const error = getInfisicalCacheError();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Initialization failed');
    });

    it('should not throw on subsequent calls after error', async () => {
      const initError = new Error('Initialization failed');
      mockGetInfisicalSecret.mockRejectedValue(initError);

      await initializeInfisicalSecrets(['TEST_SECRET']);
      // Second call should not throw
      await expect(initializeInfisicalSecrets(['TEST_SECRET'])).resolves.not.toThrow();
    });

    it('should wait for concurrent initialization', async () => {
      let resolveSecret: (value: string) => void;
      const secretPromise = new Promise<string>((resolve) => {
        resolveSecret = resolve;
      });
      mockGetInfisicalSecret.mockReturnValue(secretPromise);

      // Start two concurrent initializations
      const init1 = initializeInfisicalSecrets(['TEST_SECRET']);
      const init2 = initializeInfisicalSecrets(['TEST_SECRET']);

      // Resolve secret
      resolveSecret!('test-value');
      await secretPromise;

      await Promise.all([init1, init2]);

      // Should only fetch once
      expect(mockGetInfisicalSecret).toHaveBeenCalledTimes(1);
      expect(getInfisicalCachedSecret('TEST_SECRET')).toBe('test-value');
    });

    it('should return immediately if already initialized', async () => {
      mockGetInfisicalSecret.mockResolvedValue('value-1');
      await initializeInfisicalSecrets(['SECRET_1']);

      // Second call should return immediately
      mockGetInfisicalSecret.mockResolvedValue('value-2');
      await initializeInfisicalSecrets(['SECRET_2']);

      // Should not fetch again
      expect(mockGetInfisicalSecret).toHaveBeenCalledTimes(1);
      expect(getInfisicalCachedSecret('SECRET_1')).toBe('value-1');
      expect(getInfisicalCachedSecret('SECRET_2')).toBeUndefined();
    });

    it('should fetch secrets in parallel', async () => {
      const fetchOrder: string[] = [];
      mockGetInfisicalSecret.mockImplementation(async (name: string) => {
        fetchOrder.push(name);
        return `value-${name}`;
      });

      await initializeInfisicalSecrets(['SECRET_1', 'SECRET_2', 'SECRET_3']);

      // All secrets should be fetched (order may vary due to parallel execution)
      expect(fetchOrder).toHaveLength(3);
      expect(fetchOrder).toContain('SECRET_1');
      expect(fetchOrder).toContain('SECRET_2');
      expect(fetchOrder).toContain('SECRET_3');
    });
  });

  describe('getInfisicalCachedSecret', () => {
    it('should return cached secret value', async () => {
      mockGetInfisicalSecret.mockResolvedValue('cached-value');
      await initializeInfisicalSecrets(['TEST_SECRET']);

      const value = getInfisicalCachedSecret('TEST_SECRET');

      expect(value).toBe('cached-value');
    });

    it('should return undefined for non-existent secret', async () => {
      await initializeInfisicalSecrets(['EXISTING_SECRET']);

      const value = getInfisicalCachedSecret('NONEXISTENT_SECRET');

      expect(value).toBeUndefined();
    });

    it('should return undefined when cache not initialized', () => {
      const value = getInfisicalCachedSecret('TEST_SECRET');
      expect(value).toBeUndefined();
    });
  });

  describe('isInfisicalCacheInitialized', () => {
    it('should return false before initialization', () => {
      expect(isInfisicalCacheInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      mockGetInfisicalSecret.mockResolvedValue('value');
      await initializeInfisicalSecrets(['TEST_SECRET']);

      expect(isInfisicalCacheInitialized()).toBe(true);
    });

    it('should return true after failed initialization', async () => {
      mockGetInfisicalSecret.mockRejectedValue(new Error('Failed'));
      await initializeInfisicalSecrets(['TEST_SECRET']);

      expect(isInfisicalCacheInitialized()).toBe(true);
    });
  });

  describe('hasInfisicalCacheError', () => {
    it('should return false when no error occurred', async () => {
      mockGetInfisicalSecret.mockResolvedValue('value');
      await initializeInfisicalSecrets(['TEST_SECRET']);

      expect(hasInfisicalCacheError()).toBe(false);
    });

    it('should return true when initialization failed', async () => {
      const error = new Error('Failed');
      // Make isInfisicalEnabled throw to trigger the catch block
      mockIsInfisicalEnabled.mockImplementation(() => {
        throw error;
      });
      await initializeInfisicalSecrets(['TEST_SECRET']);

      expect(hasInfisicalCacheError()).toBe(true);
    });
  });

  describe('getInfisicalCacheError', () => {
    it('should return null when no error occurred', async () => {
      mockGetInfisicalSecret.mockResolvedValue('value');
      await initializeInfisicalSecrets(['TEST_SECRET']);

      expect(getInfisicalCacheError()).toBeNull();
    });

    it('should return error when initialization failed', async () => {
      const error = new Error('Initialization failed');
      // Make isInfisicalEnabled throw to trigger the catch block
      mockIsInfisicalEnabled.mockImplementation(() => {
        throw error;
      });
      await initializeInfisicalSecrets(['TEST_SECRET']);

      const cachedError = getInfisicalCacheError();
      expect(cachedError).toBeInstanceOf(Error);
      expect(cachedError?.message).toContain('Initialization failed');
    });
  });

  describe('clearInfisicalCache', () => {
    it('should clear all cached secrets', async () => {
      mockGetInfisicalSecret.mockResolvedValue('value');
      await initializeInfisicalSecrets(['SECRET_1', 'SECRET_2']);

      clearInfisicalCache();

      expect(getInfisicalCachedSecret('SECRET_1')).toBeUndefined();
      expect(getInfisicalCachedSecret('SECRET_2')).toBeUndefined();
      expect(isInfisicalCacheInitialized()).toBe(false);
    });

    it('should clear internal cache state', async () => {
      mockGetInfisicalSecret.mockResolvedValue('value');
      await initializeInfisicalSecrets(['TEST_SECRET']);

      expect(getInfisicalCachedSecret('TEST_SECRET')).toBe('value');
      expect(isInfisicalCacheInitialized()).toBe(true);

      clearInfisicalCache();

      expect(getInfisicalCachedSecret('TEST_SECRET')).toBeUndefined();
      expect(isInfisicalCacheInitialized()).toBe(false);
      // Note: Global cache registration is not cleared by clearInfisicalCache()
      // It will be overwritten on next initialization
    });

    it('should reset initialization state', async () => {
      mockGetInfisicalSecret.mockResolvedValue('value');
      await initializeInfisicalSecrets(['TEST_SECRET']);

      clearInfisicalCache();

      // Should be able to initialize again
      mockGetInfisicalSecret.mockResolvedValue('new-value');
      await initializeInfisicalSecrets(['NEW_SECRET']);

      expect(getInfisicalCachedSecret('NEW_SECRET')).toBe('new-value');
    });
  });

  describe('getCachedSecretNames', () => {
    it('should return all cached secret names', async () => {
      mockGetInfisicalSecret
        .mockResolvedValueOnce('value-1')
        .mockResolvedValueOnce('value-2')
        .mockResolvedValueOnce('value-3');

      await initializeInfisicalSecrets(['SECRET_1', 'SECRET_2', 'SECRET_3']);

      const names = getCachedSecretNames();

      expect(names).toHaveLength(3);
      expect(names).toContain('SECRET_1');
      expect(names).toContain('SECRET_2');
      expect(names).toContain('SECRET_3');
    });

    it('should return empty array when cache is empty', () => {
      const names = getCachedSecretNames();
      expect(names).toEqual([]);
    });

    it('should include secrets that failed to fetch (cached as undefined)', async () => {
      mockGetInfisicalSecret
        .mockResolvedValueOnce('success-value')
        .mockRejectedValueOnce(new Error('Failed'));

      await initializeInfisicalSecrets(['SUCCESS_SECRET', 'FAILED_SECRET']);

      const names = getCachedSecretNames();

      // Both should be in cache (failed one cached as undefined)
      expect(names).toContain('SUCCESS_SECRET');
      expect(names).toContain('FAILED_SECRET');
    });
  });
});

