/**
 * Vitest Setup File
 * 
 * This file runs before all tests to set up the test environment.
 * It mocks Next.js APIs and other Node.js-specific modules that aren't
 * available in the test environment.
 */

import { vi } from 'vitest';

// ============================================================================
// Global Module Mocks (must be hoisted before any test files)
// ============================================================================

// Mock @heyclaude/shared-runtime globally to prevent module resolution issues
// This MUST be hoisted before any module that imports it (like logger.ts)
// Using async factory to ensure proper module resolution via alias
vi.mock('@heyclaude/shared-runtime', async () => {
  // The alias should resolve this, but if it doesn't, the mock will still work
  // Try to import actual module using the alias path to get all exports
  let actualExports: any = {};
  try {
    // Use the file path that vitest's alias should resolve to
    const modulePath = await import('./packages/shared-runtime/src/index.ts').catch(() => null);
    if (modulePath) {
      actualExports = modulePath;
    }
  } catch {
    // If import fails, we'll use mocks only
  }
  
  return {
    // Mock functions that need to be spies
    createPinoConfig: vi.fn((options?: { service?: string }) => ({
      level: 'info',
      ...(options?.service && { service: options.service }),
    })),
    normalizeError: vi.fn((error: unknown) => {
      if (error instanceof Error) return error;
      return new Error(String(error));
    }),
    logError: vi.fn(),
    logInfo: vi.fn(),
    logWarn: vi.fn(),
    createUtilityContext: vi.fn((domain, action, meta) => ({ domain, action, ...meta })),
    withTimeout: vi.fn((promise) => promise),
    TimeoutError: class TimeoutError extends Error {
      constructor(message: string, public readonly timeoutMs?: number) {
        super(message);
        this.name = 'TimeoutError';
      }
    },
    TIMEOUT_PRESETS: { rpc: 30000, external: 10000, storage: 15000 },
    // Export commonly used utilities that might be imported
    getEnvVar: vi.fn((key: string) => process.env[key]),
    hashUserId: vi.fn((userId: string) => `hashed_${userId}`),
    buildSecurityHeaders: vi.fn(() => ({})),
    // Use actual exports if available, otherwise use empty objects
    APP_CONFIG: actualExports.APP_CONFIG || {},
    SECURITY_CONFIG: actualExports.SECURITY_CONFIG || {},
    ROUTES: actualExports.ROUTES || {},
    EXTERNAL_SERVICES: actualExports.EXTERNAL_SERVICES || {},
    TIME_CONSTANTS: actualExports.TIME_CONSTANTS || {},
    // Re-export any other non-function exports from actual module
    ...Object.keys(actualExports).reduce((acc, key) => {
      if (!acc[key] && typeof actualExports[key] !== 'function' && !key.startsWith('_')) {
        acc[key] = actualExports[key];
      }
      return acc;
    }, {} as Record<string, unknown>),
  };
});

// ============================================================================
// Next.js API Mocks
// ============================================================================

// Mock next/headers - used by server actions and components
vi.mock('next/headers', () => ({
  headers: vi.fn(() =>
    Promise.resolve(
      new Headers({
        'user-agent': 'test-user-agent',
        'x-forwarded-for': '127.0.0.1',
      })
    )
  ),
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(() => []),
    })
  ),
}));

// Mock next/cache - used by fetchCached and other caching utilities
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn), // Return function as-is (no caching in tests)
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock server-only - prevents import errors in tests
vi.mock('server-only', () => ({}));

// ============================================================================
// Environment Variables
// ============================================================================

// Set default test environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// ============================================================================
// Global Test Utilities
// ============================================================================

// Add any global test utilities here
// Example: helper functions, custom matchers, etc.
