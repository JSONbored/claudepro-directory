/**
 * Environment Variable Tests
 *
 * Comprehensive tests for environment variable access with Infisical integration:
 * - readEnv() with Infisical cache priority
 * - getEnvObject() with Infisical cache merging
 * - NEXT_PUBLIC_* variable handling
 * - Cache behavior
 * - Fallback to process.env
 * - Infisical integration edge cases
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock server-only to prevent import errors
jest.mock('server-only', () => ({}));

// Mock Infisical cache module
const mockInfisicalCache = {
  getSecret: jest.fn(),
  isInitialized: jest.fn(),
  getCachedSecretNames: jest.fn(),
};

// Setup global cache mock
beforeEach(() => {
  (globalThis as any).__INFISICAL_CACHE__ = mockInfisicalCache;
  jest.clearAllMocks();
  mockInfisicalCache.isInitialized.mockReturnValue(false);
  mockInfisicalCache.getSecret.mockReturnValue(undefined);
  mockInfisicalCache.getCachedSecretNames.mockReturnValue([]);
});

afterEach(() => {
  delete (globalThis as any).__INFISICAL_CACHE__;
  // Clear process.env test values
  delete process.env.TEST_VAR;
  delete process.env.NEXT_PUBLIC_TEST;
  delete process.env.INFISICAL_TEST_VAR;
  jest.restoreAllMocks();
});

// Import after mocks
import { getEnvVar, getEnvObject, clearEnvCache } from './env';

describe('Environment Variables with Infisical Integration', () => {
  beforeEach(() => {
    clearEnvCache();
  });

  describe('getEnvVar - Infisical Priority', () => {
    it('should prioritize Infisical cache over process.env', () => {
      process.env.TEST_VAR = 'process-env-value';
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getSecret.mockReturnValue('infisical-value');

      const value = getEnvVar('TEST_VAR');

      expect(value).toBe('infisical-value');
      expect(mockInfisicalCache.getSecret).toHaveBeenCalledWith('TEST_VAR');
    });

    it('should fallback to process.env when Infisical cache not initialized', () => {
      process.env.TEST_VAR = 'process-env-value';
      mockInfisicalCache.isInitialized.mockReturnValue(false);

      const value = getEnvVar('TEST_VAR');

      expect(value).toBe('process-env-value');
    });

    it('should fallback to process.env when secret not in Infisical cache', () => {
      process.env.TEST_VAR = 'process-env-value';
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getSecret.mockReturnValue(undefined);

      const value = getEnvVar('TEST_VAR');

      expect(value).toBe('process-env-value');
    });

    it('should skip Infisical for NEXT_PUBLIC_* variables', () => {
      process.env.NEXT_PUBLIC_TEST = 'next-public-value';
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getSecret.mockReturnValue('infisical-value');

      const value = getEnvVar('NEXT_PUBLIC_TEST');

      expect(value).toBe('next-public-value');
      expect(mockInfisicalCache.getSecret).not.toHaveBeenCalled();
    });

    it('should cache resolved values', () => {
      process.env.TEST_VAR = 'process-env-value';
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getSecret.mockReturnValue('infisical-value');

      const value1 = getEnvVar('TEST_VAR');
      // Clear Infisical cache to test envCache
      mockInfisicalCache.isInitialized.mockReturnValue(false);
      const value2 = getEnvVar('TEST_VAR');

      expect(value1).toBe('infisical-value');
      expect(value2).toBe('infisical-value'); // Should use cached value
    });

    it('should handle undefined values from both sources', () => {
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getSecret.mockReturnValue(undefined);

      const value = getEnvVar('NONEXISTENT_VAR');

      expect(value).toBeUndefined();
    });

    it('should normalize empty strings to undefined', () => {
      process.env.EMPTY_VAR = '';
      mockInfisicalCache.isInitialized.mockReturnValue(false);

      const value = getEnvVar('EMPTY_VAR');

      expect(value).toBeUndefined();
    });

    it('should normalize empty strings from Infisical to undefined', () => {
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getSecret.mockReturnValue('');

      const value = getEnvVar('EMPTY_VAR');

      expect(value).toBeUndefined();
    });
  });

  describe('getEnvObject - Infisical Integration', () => {
    it('should merge Infisical secrets into env object', () => {
      process.env.REGULAR_VAR = 'process-value';
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getCachedSecretNames.mockReturnValue(['INFISICAL_VAR']);
      mockInfisicalCache.getSecret.mockImplementation((name: string) => {
        if (name === 'INFISICAL_VAR') return 'infisical-value';
        return undefined;
      });

      const envObj = getEnvObject();

      expect(envObj.REGULAR_VAR).toBe('process-value');
      expect(envObj.INFISICAL_VAR).toBe('infisical-value');
    });

    it('should prioritize Infisical values over process.env', () => {
      process.env.CONFLICT_VAR = 'process-value';
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getCachedSecretNames.mockReturnValue(['CONFLICT_VAR']);
      mockInfisicalCache.getSecret.mockReturnValue('infisical-value');

      const envObj = getEnvObject();

      expect(envObj.CONFLICT_VAR).toBe('infisical-value');
    });

    it('should skip NEXT_PUBLIC_* vars from Infisical cache', () => {
      process.env.NEXT_PUBLIC_TEST = 'next-public-value';
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getCachedSecretNames.mockReturnValue([
        'NEXT_PUBLIC_TEST',
        'REGULAR_VAR',
      ]);
      mockInfisicalCache.getSecret.mockImplementation((name: string) => {
        if (name === 'NEXT_PUBLIC_TEST') return 'infisical-next-public';
        if (name === 'REGULAR_VAR') return 'infisical-regular';
        return undefined;
      });

      const envObj = getEnvObject();

      expect(envObj.NEXT_PUBLIC_TEST).toBe('next-public-value');
      expect(envObj.REGULAR_VAR).toBe('infisical-regular');
    });

    it('should not include Infisical secrets when cache not initialized', () => {
      process.env.REGULAR_VAR = 'process-value';
      mockInfisicalCache.isInitialized.mockReturnValue(false);

      const envObj = getEnvObject();

      expect(envObj.REGULAR_VAR).toBe('process-value');
      expect(envObj.INFISICAL_VAR).toBeUndefined();
    });

    it('should include all process.env variables', () => {
      process.env.VAR_1 = 'value-1';
      process.env.VAR_2 = 'value-2';
      mockInfisicalCache.isInitialized.mockReturnValue(false);

      const envObj = getEnvObject();

      expect(envObj.VAR_1).toBe('value-1');
      expect(envObj.VAR_2).toBe('value-2');
    });

    it('should normalize all values (empty strings to undefined)', () => {
      process.env.EMPTY_VAR = '';
      process.env.NORMAL_VAR = 'normal-value';
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getCachedSecretNames.mockReturnValue(['EMPTY_INFISICAL']);
      mockInfisicalCache.getSecret.mockImplementation((name: string) => {
        if (name === 'EMPTY_INFISICAL') return '';
        return undefined;
      });

      const envObj = getEnvObject();

      expect(envObj.EMPTY_VAR).toBeUndefined();
      expect(envObj.EMPTY_INFISICAL).toBeUndefined();
      expect(envObj.NORMAL_VAR).toBe('normal-value');
    });

    it('should handle build phase correctly', () => {
      const originalPhase = process.env.NEXT_PHASE;
      process.env.NEXT_PHASE = 'phase-production-build';
      process.env.BUILD_VAR = 'build-value';

      const envObj = getEnvObject();

      expect(envObj.BUILD_VAR).toBe('build-value');

      // Restore
      if (originalPhase) {
        process.env.NEXT_PHASE = originalPhase;
      } else {
        delete process.env.NEXT_PHASE;
      }
    });
  });

  describe('Cache Behavior', () => {
    it('should cache values after first access', () => {
      process.env.CACHE_TEST = 'cached-value';
      mockInfisicalCache.isInitialized.mockReturnValue(false);

      const value1 = getEnvVar('CACHE_TEST');
      // Remove from process.env to test cache
      delete process.env.CACHE_TEST;
      const value2 = getEnvVar('CACHE_TEST');

      expect(value1).toBe('cached-value');
      expect(value2).toBe('cached-value'); // Should use cache
    });

    it('should clear cache when clearEnvCache is called', () => {
      process.env.CACHE_TEST = 'cached-value';
      mockInfisicalCache.isInitialized.mockReturnValue(false);

      getEnvVar('CACHE_TEST');
      clearEnvCache();
      delete process.env.CACHE_TEST;

      const value = getEnvVar('CACHE_TEST');
      expect(value).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle global cache not being set', () => {
      delete (globalThis as any).__INFISICAL_CACHE__;
      process.env.TEST_VAR = 'fallback-value';

      const value = getEnvVar('TEST_VAR');

      expect(value).toBe('fallback-value');
    });

    it('should handle Infisical cache returning null', () => {
      mockInfisicalCache.isInitialized.mockReturnValue(true);
      mockInfisicalCache.getSecret.mockReturnValue(null as any);
      process.env.TEST_VAR = 'fallback-value';

      const value = getEnvVar('TEST_VAR');

      expect(value).toBe('fallback-value');
    });

    it('should handle concurrent access', () => {
      process.env.CONCURRENT_VAR = 'concurrent-value';
      mockInfisicalCache.isInitialized.mockReturnValue(false);

      const values = Array.from({ length: 10 }, () => getEnvVar('CONCURRENT_VAR'));

      expect(values.every((v) => v === 'concurrent-value')).toBe(true);
    });
  });
});

