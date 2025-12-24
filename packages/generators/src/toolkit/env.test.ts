/**
 * Environment Variable Toolkit Tests
 *
 * Tests for the shared environment variable loading utility used by generator scripts.
 * This utility ensures env vars are loaded from Infisical (local dev) or platform (CI/Build).
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock env schema - define everything inside factory to avoid hoisting issues
jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  // Define mockEnv inside factory (no top-level variables)
  const mockEnv: Record<string, string | undefined> = {
    VERCEL: undefined,
    VERCEL_ENV: undefined,
    CI: undefined,
    GITHUB_ACTIONS: undefined,
    TEST_VAR: 'test-value',
  };
  
  // Store on globalThis for test access
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__generatorsMockEnv = mockEnv;
  }
  
  return {
    env: new Proxy(mockEnv, {
      get: (target, prop: string) => target[prop],
      set: (target, prop: string, value) => {
        target[prop] = value;
        return true;
      },
    }),
  };
});

// Get mockEnv from globalThis for test access
const getMockEnv = (): Record<string, string | undefined> => {
  return (globalThis as any).__generatorsMockEnv as Record<string, string | undefined>;
};

// Mock logger - define inside factory to avoid hoisting issues
jest.mock('./logger.ts', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  
  // Store on globalThis for test access
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__generatorsMockLogger = mockLogger;
  }
  
  return {
    logger: mockLogger,
  };
});

// Get mockLogger from globalThis for test access
const getMockLogger = () => (globalThis as any).__generatorsMockLogger as {
  info: ReturnType<typeof jest.fn>;
  warn: ReturnType<typeof jest.fn>;
  error: ReturnType<typeof jest.fn>;
};
const mockLogger = getMockLogger();

// Import after mocks
import { ensureEnvVars } from './env';

describe('Environment Variable Toolkit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock env
    const currentMockEnv = getMockEnv();
    Object.keys(currentMockEnv).forEach((key) => {
      delete currentMockEnv[key];
    });
    Object.assign(currentMockEnv, {
      VERCEL: undefined,
      VERCEL_ENV: undefined,
      CI: undefined,
      GITHUB_ACTIONS: undefined,
      TEST_VAR: 'test-value',
    });
  });

  describe('ensureEnvVars', () => {
    it('should pass when all required vars are present', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.TEST_VAR = 'test-value';
      currentMockEnv.ANOTHER_VAR = 'another-value';

      await expect(
        ensureEnvVars(['TEST_VAR', 'ANOTHER_VAR'])
      ).resolves.not.toThrow();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Environment variables already loaded'),
        expect.objectContaining({ command: 'env' })
      );
    });

    it('should detect Infisical as source when not in CI', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.TEST_VAR = 'test-value';
      currentMockEnv.VERCEL = undefined;
      currentMockEnv.VERCEL_ENV = undefined;

      await ensureEnvVars(['TEST_VAR']);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Infisical'),
        expect.objectContaining({ source: 'Infisical' })
      );
    });

    it('should detect Platform as source when in Vercel', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.TEST_VAR = 'test-value';
      currentMockEnv.VERCEL = '1';
      currentMockEnv.VERCEL_ENV = 'production';

      await ensureEnvVars(['TEST_VAR']);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Platform'),
        expect.objectContaining({ source: 'Platform (Vercel/CI)' })
      );
    });

    it('should warn about missing optional vars', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.TEST_VAR = 'test-value';

      await ensureEnvVars(['TEST_VAR'], ['OPTIONAL_VAR']);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('optional vars missing'),
        expect.objectContaining({ missingOptionalVarsCount: 1 })
      );
    });

    it('should throw error in CI when required vars are missing', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.CI = 'true';
      currentMockEnv.MISSING_VAR = undefined;

      await expect(ensureEnvVars(['MISSING_VAR'])).rejects.toThrow(
        'Missing required environment variables in CI/Build'
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Missing environment variables in CI/Build'),
        expect.objectContaining({ environment: 'ci' })
      );
    });

    it('should detect Vercel CI environment', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.VERCEL = '1';
      currentMockEnv.MISSING_VAR = undefined;

      await expect(ensureEnvVars(['MISSING_VAR'])).rejects.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ environment: 'vercel' })
      );
    });

    it('should detect GitHub Actions CI environment', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.GITHUB_ACTIONS = 'true';
      currentMockEnv.MISSING_VAR = undefined;

      await expect(ensureEnvVars(['MISSING_VAR'])).rejects.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ environment: 'github' })
      );
    });

    it('should throw error in local dev when required vars are missing', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.CI = undefined;
      currentMockEnv.VERCEL = undefined;
      currentMockEnv.MISSING_VAR = undefined;

      await expect(ensureEnvVars(['MISSING_VAR'])).rejects.toThrow(
        'Missing required environment variables'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Missing required environment variables'),
        expect.objectContaining({ missingVarsCount: 1 })
      );
    });

    it('should include Infisical instructions in local dev error', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.CI = undefined;
      currentMockEnv.MISSING_VAR = undefined;

      await expect(ensureEnvVars(['MISSING_VAR'])).rejects.toThrow(
        'infisical run --env=dev'
      );
    });

    it('should handle multiple missing vars', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.CI = undefined;
      currentMockEnv.MISSING_VAR_1 = undefined;
      currentMockEnv.MISSING_VAR_2 = undefined;

      await expect(
        ensureEnvVars(['MISSING_VAR_1', 'MISSING_VAR_2'])
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ missingVarsCount: 2 })
      );
    });

    it('should handle empty optional vars list', async () => {
      const currentMockEnv = getMockEnv();
      currentMockEnv.TEST_VAR = 'test-value';
      const currentMockLogger = getMockLogger();
      currentMockLogger.info.mockClear();

      await expect(ensureEnvVars(['TEST_VAR'], [])).resolves.not.toThrow();

      expect(currentMockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Environment variables already loaded'),
        expect.objectContaining({ command: 'env' })
      );
    });
  });
});

