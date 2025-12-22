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
process.env.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL || 'postgresql://test:test@localhost:5432/test';

// ============================================================================
// Global Test Utilities
// ============================================================================

// Add any global test utilities here
// Example: helper functions, custom matchers, etc.

