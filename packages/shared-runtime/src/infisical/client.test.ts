/**
 * Infisical Client Tests
 *
 * Comprehensive tests for Infisical SDK client functionality:
 * - Environment detection
 * - Feature flag checking
 * - Client authentication
 * - Secret fetching
 * - Error handling
 * - Edge cases
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { InfisicalSDK } from '@infisical/sdk';

// Mock server-only to prevent import errors
jest.mock('server-only', () => ({}));

// Mock @infisical/sdk - define mocks directly in factory to avoid hoisting issues
jest.mock('@infisical/sdk', () => {
  // Define mocks inside factory (hoisted, so accessible)
  const mockSecrets = jest.fn();
  const mockLogin = jest.fn();
  
  // Store on globalThis for test access
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__infisicalMocks = {
      mockSecrets,
      mockLogin,
    };
  }
  
  const mockAuth = {
    universalAuth: {
      login: mockLogin,
    },
  };
  
  // Create a proper constructor function (not vi.fn() which doesn't work with 'new')
  function MockInfisicalSDK(this: any, _config?: any) {
    // secrets() returns an object with listSecrets method
    this.secrets = jest.fn(() => ({
      listSecrets: mockSecrets,
    }));
    // auth() returns an object with universalAuth property
    this.auth = jest.fn(() => mockAuth);
    return this;
  }

  return {
    InfisicalSDK: MockInfisicalSDK,
  };
});

// Mock env schema - define inside factory to avoid hoisting issues
jest.mock('../schemas/env', () => {
  const mockEnv: Record<string, string | undefined> = {
    NODE_ENV: 'development',
    INFISICAL_CLIENT_ID: 'test-client-id',
    INFISICAL_CLIENT_SECRET: 'test-client-secret',
    INFISICAL_ENABLED: undefined,
    INFISICAL_ENV: undefined,
  };
  
  // Store on globalThis for test access
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__mockEnv = mockEnv;
  }
  
  return {
    env: new Proxy(mockEnv, {
      get: (target, prop: string) => target[prop],
    }),
  };
});

// Get mockEnv from globalThis for test access
const getMockEnv = () => (globalThis as any).__mockEnv as Record<string, string | undefined>;
const mockEnv = getMockEnv();

// Import after mocks
import {
  isInfisicalEnabled,
  getInfisicalClient,
  getInfisicalSecret,
  getInfisicalEnvironment,
  resetInfisicalState,
} from './client';

describe('Infisical Client', () => {
  const getMocks = () => (globalThis as any).__infisicalMocks;

  beforeEach(() => {
    // Reset Infisical module state (clears cached isEnabled, client, etc.)
    resetInfisicalState();

    // Reset mocks
    jest.clearAllMocks();
    const mocks = getMocks();
    mocks.mockSecrets.mockReset();
    mocks.mockLogin.mockReset();

    // Reset env mock
    Object.keys(mockEnv).forEach((key) => {
      delete mockEnv[key];
    });
    Object.assign(mockEnv, {
      NODE_ENV: 'development',
      INFISICAL_CLIENT_ID: 'test-client-id',
      INFISICAL_CLIENT_SECRET: 'test-client-secret',
      INFISICAL_ENABLED: undefined,
      INFISICAL_ENV: undefined,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInfisicalEnvironment', () => {
    it('should return "dev" for development NODE_ENV', () => {
      mockEnv.NODE_ENV = 'development';
      const env = getInfisicalEnvironment();
      expect(env).toBe('dev');
    });

    it('should return "prod" for production NODE_ENV', () => {
      mockEnv.NODE_ENV = 'production';
      const env = getInfisicalEnvironment();
      expect(env).toBe('prod');
    });

    it('should use INFISICAL_ENV when explicitly set', () => {
      mockEnv.INFISICAL_ENV = 'staging';
      const env = getInfisicalEnvironment();
      expect(env).toBe('staging');
    });

    it('should default to "dev" when NODE_ENV is not development or production', () => {
      mockEnv.NODE_ENV = 'test';
      mockEnv.INFISICAL_ENV = undefined;
      const env = getInfisicalEnvironment();
      expect(env).toBe('dev');
    });

    it('should prioritize INFISICAL_ENV over NODE_ENV', () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.INFISICAL_ENV = 'dev';
      const env = getInfisicalEnvironment();
      expect(env).toBe('dev');
    });
  });

  describe('isInfisicalEnabled', () => {
    it('should return true when INFISICAL_ENABLED is "true"', () => {
      mockEnv.INFISICAL_ENABLED = 'true';
      // Reset module state by re-importing (in real test, we'd use a reset function)
      const enabled = isInfisicalEnabled();
      expect(enabled).toBe(true);
    });

    it('should return true when INFISICAL_ENABLED is "1"', () => {
      mockEnv.INFISICAL_ENABLED = '1';
      const enabled = isInfisicalEnabled();
      expect(enabled).toBe(true);
    });

    it('should return false when INFISICAL_ENABLED is "false"', () => {
      mockEnv.INFISICAL_ENABLED = 'false';
      const enabled = isInfisicalEnabled();
      expect(enabled).toBe(false);
    });

    it('should return false for production environment', () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.INFISICAL_ENV = undefined; // Clear INFISICAL_ENV to use NODE_ENV
      mockEnv.INFISICAL_ENABLED = undefined;
      const enabled = isInfisicalEnabled();
      expect(enabled).toBe(false);
    });

    it('should return false for staging environment', () => {
      mockEnv.NODE_ENV = undefined; // Clear NODE_ENV so INFISICAL_ENV takes precedence
      mockEnv.INFISICAL_ENV = 'staging';
      mockEnv.INFISICAL_ENABLED = undefined;
      const enabled = isInfisicalEnabled();
      expect(enabled).toBe(false);
    });

    it('should return true for dev environment with credentials', () => {
      mockEnv.NODE_ENV = 'development';
      mockEnv.INFISICAL_ENABLED = undefined;
      mockEnv.INFISICAL_CLIENT_ID = 'test-id';
      mockEnv.INFISICAL_CLIENT_SECRET = 'test-secret';
      const enabled = isInfisicalEnabled();
      expect(enabled).toBe(true);
    });

    it('should return false for dev environment without credentials', () => {
      mockEnv.NODE_ENV = 'development';
      mockEnv.INFISICAL_ENABLED = undefined;
      mockEnv.INFISICAL_CLIENT_ID = undefined;
      mockEnv.INFISICAL_CLIENT_SECRET = undefined;
      const enabled = isInfisicalEnabled();
      expect(enabled).toBe(false);
    });

    it('should cache the result', () => {
      mockEnv.INFISICAL_ENABLED = 'true';
      const first = isInfisicalEnabled();
      // Change env after first call
      mockEnv.INFISICAL_ENABLED = 'false';
      const second = isInfisicalEnabled();
      // Should return cached value
      expect(first).toBe(second);
    });
  });

  describe('getInfisicalClient', () => {
    it('should return null when Infisical is disabled', async () => {
      mockEnv.INFISICAL_ENABLED = 'false';
      const client = await getInfisicalClient();
      expect(client).toBeNull();
      // InfisicalSDK should not be instantiated when disabled
      // We can't directly check this, but client being null confirms it
    });

    it('should create and authenticate client when enabled', async () => {
      mockEnv.INFISICAL_ENABLED = 'true';
      const mocks = getMocks();
      mocks.mockLogin.mockResolvedValue(undefined);

      const client = await getInfisicalClient();

      expect(client).not.toBeNull();
      expect(mocks.mockLogin).toHaveBeenCalledWith({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });
    });

    it('should throw error when credentials are missing', async () => {
      mockEnv.INFISICAL_ENABLED = 'true';
      mockEnv.INFISICAL_CLIENT_ID = undefined;
      mockEnv.INFISICAL_CLIENT_SECRET = undefined;

      await expect(getInfisicalClient()).rejects.toThrow(
        'Infisical credentials not found'
      );
    });

    it('should cache authenticated client', async () => {
      mockEnv.INFISICAL_ENABLED = 'true';
      const mocks = getMocks();
      mocks.mockLogin.mockResolvedValue(undefined);

      const client1 = await getInfisicalClient();
      const client2 = await getInfisicalClient();

      expect(client1).toBe(client2);
      // Should only authenticate once
      expect(mocks.mockLogin).toHaveBeenCalledTimes(1);
    });

    it('should handle authentication errors', async () => {
      mockEnv.INFISICAL_ENABLED = 'true';
      const authError = new Error('401 Unauthorized');
      const mocks = getMocks();
      mocks.mockLogin.mockRejectedValue(authError);

      await expect(getInfisicalClient()).rejects.toThrow(
        'Infisical authentication failed'
      );
    });

    it('should wait for in-progress authentication', async () => {
      mockEnv.INFISICAL_ENABLED = 'true';
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });
      const mocks = getMocks();
      mocks.mockLogin.mockReturnValue(authPromise);

      // Start two concurrent requests
      const clientPromise1 = getInfisicalClient();
      const clientPromise2 = getInfisicalClient();

      // Resolve authentication
      resolveAuth!();
      await authPromise;

      const client1 = await clientPromise1;
      const client2 = await clientPromise2;

      expect(client1).toBe(client2);
      // Should only authenticate once
      expect(mocks.mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('getInfisicalSecret', () => {
    beforeEach(() => {
      mockEnv.INFISICAL_ENABLED = 'true';
      const mocks = getMocks();
      mocks.mockLogin.mockResolvedValue(undefined);
    });

    it('should return undefined when Infisical is disabled', async () => {
      mockEnv.INFISICAL_ENABLED = 'false';
      const secret = await getInfisicalSecret('TEST_SECRET', 'dev');
      expect(secret).toBeUndefined();
      const mocks = getMocks();
      expect(mocks.mockSecrets).not.toHaveBeenCalled();
    });

    it('should fetch secret from Infisical', async () => {
      const mocks = getMocks();
      mocks.mockSecrets.mockResolvedValue({
        secrets: [
          {
            secretKey: 'TEST_SECRET',
            secretValue: 'test-secret-value',
          },
        ],
      });

      const secret = await getInfisicalSecret('TEST_SECRET', 'dev');

      expect(secret).toBe('test-secret-value');
      expect(mocks.mockSecrets).toHaveBeenCalledWith({
        environment: 'dev',
        projectId: '413cd9a2-c1d8-43d6-b7d3-f12699647b27',
        secretPath: '/',
        recursive: true,
        viewSecretValue: true,
        expandSecretReferences: true,
        includeImports: false,
      });
    });

    it('should return undefined when secret not found', async () => {
      const mocks = getMocks();
      mocks.mockSecrets.mockResolvedValue({
        secrets: [],
      });

      const secret = await getInfisicalSecret('NONEXISTENT_SECRET', 'dev');

      expect(secret).toBeUndefined();
    });

    it('should use custom secret path', async () => {
      const mocks = getMocks();
      mocks.mockSecrets.mockResolvedValue({
        secrets: [
          {
            secretKey: 'TEST_SECRET',
            secretValue: 'test-value',
          },
        ],
      });

      await getInfisicalSecret('TEST_SECRET', 'dev', '/custom/path');

      expect(mocks.mockSecrets).toHaveBeenCalledWith(
        expect.objectContaining({
          secretPath: '/custom/path',
        })
      );
    });

    it('should handle 404 errors gracefully', async () => {
      const notFoundError = new Error('Secret not found');
      notFoundError.message = '404';
      const mocks = getMocks();
      mocks.mockSecrets.mockRejectedValue(notFoundError);

      const secret = await getInfisicalSecret('MISSING_SECRET', 'dev');

      expect(secret).toBeUndefined();
    });

    it('should re-throw authentication errors', async () => {
      const authError = new Error('401 Unauthorized');
      const mocks = getMocks();
      mocks.mockSecrets.mockRejectedValue(authError);

      await expect(getInfisicalSecret('TEST_SECRET', 'dev')).rejects.toThrow(
        '401 Unauthorized'
      );
    });

    it('should handle API errors', async () => {
      const apiError = new Error('500 Internal Server Error');
      const mocks = getMocks();
      mocks.mockSecrets.mockRejectedValue(apiError);

      await expect(getInfisicalSecret('TEST_SECRET', 'dev')).rejects.toThrow(
        '500 Internal Server Error'
      );
    });

    it('should search recursively in subdirectories', async () => {
      const mocks = getMocks();
      mocks.mockSecrets.mockResolvedValue({
        secrets: [
          {
            secretKey: 'NESTED_SECRET',
            secretValue: 'nested-value',
          },
        ],
      });

      await getInfisicalSecret('NESTED_SECRET', 'dev');

      expect(mocks.mockSecrets).toHaveBeenCalledWith(
        expect.objectContaining({
          recursive: true,
        })
      );
    });
  });
});

