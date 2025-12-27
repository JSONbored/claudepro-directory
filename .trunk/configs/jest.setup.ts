/**
 * Jest Setup File
 *
 * This file runs before all tests to set up the test environment.
 * It mocks Next.js APIs and other Node.js-specific modules that aren't
 * available in the test environment.
 */

import '@testing-library/jest-dom';

// Fix for React 18/19 compatibility in tests
if (typeof globalThis.IS_REACT_ACT_ENVIRONMENT === 'undefined') {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
}

// ============================================================================
// Global Module Mocks
// ============================================================================

// Mock @heyclaude/shared-runtime globally to prevent module resolution issues
// This MUST be hoisted before any module that imports it (like logger.ts)
jest.mock('@heyclaude/shared-runtime', () => {
  return {
    // Mock functions that need to be spies
    createPinoConfig: jest.fn((options?: { service?: string }) => ({
      level: 'info',
      ...(options?.service && { service: options.service }),
    })),
    normalizeError: jest.fn((error: unknown) => {
      if (error instanceof Error) return error;
      return new Error(String(error));
    }),
    logError: jest.fn(),
    logInfo: jest.fn(),
    logWarn: jest.fn(),
    createUtilityContext: jest.fn((domain, action, meta) => ({ domain, action, ...meta })),
    withTimeout: jest.fn((promise) => promise),
    TimeoutError: class TimeoutError extends Error {
      constructor(
        message: string,
        public readonly timeoutMs?: number
      ) {
        super(message);
        this.name = 'TimeoutError';
      }
    },
    TIMEOUT_PRESETS: { rpc: 30000, external: 10000, storage: 15000 },
    // Export commonly used utilities that might be imported
    getEnvVar: jest.fn((key: string) => process.env[key]),
    hashUserId: jest.fn((userId: string) => `hashed_${userId}`),
    buildSecurityHeaders: jest.fn(() => ({})),
    // Use empty objects for config constants (can be extended if needed)
    APP_CONFIG: {},
    SECURITY_CONFIG: {},
    ROUTES: {},
    EXTERNAL_SERVICES: {},
    TIME_CONSTANTS: {},
  };
});

// ============================================================================
// Next.js API Mocks
// ============================================================================

// Mock next/headers - used by server actions and components
jest.mock('next/headers', () => ({
  headers: jest.fn(() =>
    Promise.resolve(
      new Headers({
        'user-agent': 'test-user-agent',
        'x-forwarded-for': '127.0.0.1',
      })
    )
  ),
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      getAll: jest.fn(() => []),
    })
  ),
}));

// Mock next/cache - used by fetchCached and other caching utilities
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn), // Return function as-is (no caching in tests)
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

// Mock server-only - prevents import errors in tests
jest.mock('server-only', () => ({}));

// ============================================================================
// Prisma Client Mock
// ============================================================================

// CRITICAL: Jest automatically uses __mocks__ directory
// The mock file at __mocks__/@prisma/client.ts will be automatically used
// when any code imports from '@prisma/client'
// No explicit jest.mock() needed - Jest handles it automatically
//
// All imports of PrismaClient from @prisma/client will now use
// PrismockerClient instead, providing in-memory database for all tests.
//
// Note: POSTGRES_PRISMA_URL is provided via Infisical in test command, but Prismocker
// doesn't require it (uses in-memory storage).

// ============================================================================
// Environment Variables
// ============================================================================

// Set default test environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
// Provide POSTGRES_PRISMA_URL for tests (Prismocker doesn't need it, but some code checks for it)
process.env.POSTGRES_PRISMA_URL =
  process.env.POSTGRES_PRISMA_URL || 'postgresql://test:test@localhost:5432/test';

// ============================================================================
// Global Test Utilities
// ============================================================================

// Add any global test utilities here
// Example: helper functions, custom matchers, etc.

// ============================================================================
// Global Test Cleanup
// ============================================================================

import { afterAll } from '@jest/globals';

// Ensure all async operations complete before Jest exits
// This prevents "worker process has failed to exit gracefully" errors
afterAll(async () => {
  // CRITICAL: Flush all Pino logger instances to ensure async logs are written
  // Pino uses async logging by default, which means log messages are buffered
  // and written asynchronously. We need to flush them before Jest exits.

  // Import logger instances (they may not be imported in all tests, so we import here)
  // Use dynamic imports to avoid circular dependencies and ensure loggers are initialized
  const flushLoggers = async () => {
    try {
      // Flush web-runtime logger (if it exists)
      // Paths are relative to project root (rootDir is '../..' in jest.config.cjs)
      // Since this file is in .trunk/configs/, we need to go up two levels to reach project root
      try {
        const { logger: webRuntimeLogger } = await import('../../packages/web-runtime/src/logger.ts');
        if (webRuntimeLogger && typeof webRuntimeLogger.flush === 'function') {
          await new Promise<void>((resolve, reject) => {
            webRuntimeLogger.flush((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      } catch {
        // Logger may not be initialized in all test contexts, ignore
      }

      // Flush shared-runtime logger (if it exists)
      try {
        const sharedRuntimeLogger = await import('../../packages/shared-runtime/src/logger/index.ts');
        if (sharedRuntimeLogger.logger && typeof sharedRuntimeLogger.logger.flush === 'function') {
          await new Promise<void>((resolve, reject) => {
            sharedRuntimeLogger.logger.flush((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      } catch {
        // Logger may not be initialized in all test contexts, ignore
      }

      // Flush data-layer logger (if it exists)
      try {
        const { logger: dataLayerLogger } =
          await import('../../packages/data-layer/src/utils/rpc-error-logging.ts');
        if (dataLayerLogger && typeof dataLayerLogger.flush === 'function') {
          await new Promise<void>((resolve, reject) => {
            dataLayerLogger.flush((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      } catch {
        // Logger may not be initialized in all test contexts, ignore
      }
    } catch {
      // Ignore errors during cleanup - tests may have already completed
    }
  };

  // Flush all loggers
  await flushLoggers();

  // Additional cleanup: Clear request cache to ensure no lingering references
  // Paths are relative to project root (rootDir in jest.config.cjs)
  try {
    const { clearRequestCache } = await import('../../packages/data-layer/src/utils/request-cache.ts');
    clearRequestCache();
  } catch {
    // Request cache may not be initialized in all test contexts, ignore
  }

  // Give a small buffer for any remaining async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 50));
});
