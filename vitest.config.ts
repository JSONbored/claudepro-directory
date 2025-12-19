import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Vitest Configuration
 *
 * Test files should be co-located with source files using *.test.ts naming.
 * Example: content.ts → content.test.ts (same directory)
 *
 * This matches the existing pattern (resend.test.ts) and keeps related code together.
 *
 * Environment:
 * - .tsx test files use 'jsdom' (React component tests)
 * - .ts test files use 'node' (server-side/utility tests)
 *
 * Projects:
 * - Enables parallel test runs across packages for improved CI/CD performance
 * - Each package runs in isolation with its own configuration
 */
export default defineConfig({
  test: {
    // Enable global test functions (describe, it, expect, vi)
    globals: true,

    // Use threads pool for better performance (faster than default 'forks' pool)
    pool: 'threads',
    maxWorkers: '50%', // Use 50% of available CPU cores

    // Enable test result caching for faster re-runs
    // Cache is invalidated when source files or dependencies change
    cache: {
      dir: '.vitest-cache',
    },

    // Optional: Enable profiling for performance debugging (set VITEST_PROFILE=1)
    execArgv: process.env.VITEST_PROFILE
      ? [
          '--cpu-prof',
          '--cpu-prof-dir=test-runner-profile',
          '--heap-prof',
          '--heap-prof-dir=test-runner-profile',
        ]
      : [],

    // Environment based on file extension
    // Component tests (.tsx) need jsdom, server tests (.ts) use node
    // NOTE: .spec.ts files are Playwright E2E tests, excluded from Vitest
    environment: 'node',
    environmentMatchGlobs: [
      // React component tests need jsdom
      ['**/*.test.tsx', 'jsdom'],
      // Server-side tests use node (default)
      ['**/*.test.ts', 'node'],
    ],

    // Include test files (only in source directories, not node_modules)
    // NOTE: .spec.ts files are Playwright E2E tests, not Vitest unit tests
    // Only include .test.ts files for Vitest unit tests
    include: [
      'packages/**/*.test.{ts,tsx}',
      'apps/**/*.test.{ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      '**/node_modules/**', // Explicitly exclude all node_modules
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.generated.{ts,tsx}', // Exclude auto-generated files
      'apps/edge/functions/**', // Edge functions use Deno, test separately
      '**/*.spec.{ts,tsx}', // Exclude Playwright E2E tests (.spec.ts files)
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/*.generated.{ts,tsx}', // Exclude generated files
        '**/dist/**',
        '**/.next/**',
        '**/node_modules/**',
        '**/*.config.{ts,js,mjs}', // Exclude config files
        '**/vitest.setup.ts',
        '**/vitest.config.ts',
        'apps/edge/functions/**', // Edge functions tested separately
        // Exclude test files themselves
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**',
        '**/tests/**',
      ],
      // Coverage thresholds - increased to maintain high code quality
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
        // Per-file thresholds for critical paths
        // These are checked in addition to global thresholds
        '**/packages/web-runtime/src/data/**': {
          lines: 85,
          functions: 85,
          branches: 75,
          statements: 85,
        },
        '**/packages/web-runtime/src/actions/**': {
          lines: 85,
          functions: 85,
          branches: 75,
          statements: 85,
        },
        '**/packages/data-layer/src/services/**': {
          lines: 85,
          functions: 85,
          branches: 75,
          statements: 85,
        },
      },
    },

    // Setup files run before all tests
    setupFiles: ['./vitest.setup.ts'],

    // Test timeout (5 seconds default, increase for slow tests)
    testTimeout: 5000,

    // Reporter configuration
    reporters: ['verbose'],

    // Watch mode configuration
    watch: false, // Disable by default (use test:watch script)

    // Projects for parallel test execution across packages
    projects: [
      {
        test: {
          name: 'shared-runtime',
          root: './packages/shared-runtime',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'node',
          pool: 'threads',
          // Smaller package with fewer tests - use fewer workers
          maxWorkers: process.env.CI ? 1 : 2,
          minWorkers: 1,
          sequence: {
            groupOrder: 1,
          },
        },
      },
      {
        test: {
          name: 'data-layer',
          root: './packages/data-layer',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'node',
          pool: 'threads',
          // Smaller package with fewer tests - use fewer workers
          maxWorkers: process.env.CI ? 1 : 2,
          minWorkers: 1,
          sequence: {
            groupOrder: 2,
          },
        },
      },
      {
        test: {
          name: 'web-runtime-node',
          root: './packages/web-runtime',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.test.tsx', 'src/hooks/**/*.test.ts'],
          environment: 'node',
          pool: 'threads',
          // Medium package - balance workers for performance
          maxWorkers: process.env.CI ? 2 : 3,
          minWorkers: 1,
          sequence: {
            groupOrder: 3,
          },
        },
      },
      {
        test: {
          name: 'web-runtime-hooks',
          root: './packages/web-runtime',
          include: ['src/hooks/**/*.test.ts'],
          environment: 'jsdom',
          pool: 'threads',
          // React hook tests need jsdom - slightly more resource intensive
          maxWorkers: process.env.CI ? 2 : 3,
          minWorkers: 1,
          sequence: {
            groupOrder: 3.5,
          },
        },
      },
      {
        test: {
          name: 'web-runtime-react',
          root: './packages/web-runtime',
          include: ['src/**/*.test.tsx'],
          environment: 'jsdom',
          pool: 'threads',
          // React tests need jsdom - slightly more resource intensive
          maxWorkers: process.env.CI ? 2 : 3,
          minWorkers: 1,
          sequence: {
            groupOrder: 4,
          },
        },
      },
      {
        test: {
          name: 'generators',
          root: './packages/generators',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'node',
          pool: 'threads',
          // Smaller package with fewer tests - use fewer workers
          maxWorkers: process.env.CI ? 1 : 2,
          minWorkers: 1,
          sequence: {
            groupOrder: 5,
          },
        },
      },
      {
        test: {
          name: 'web-app',
          root: './apps/web',
          include: ['src/**/*.test.{ts,tsx}'],
          environmentMatchGlobs: [
            ['**/*.test.tsx', 'jsdom'],
            ['**/*.test.ts', 'node'],
          ],
          pool: 'threads',
          // Larger app with more tests - can use more workers
          // Use percentage for local (75% of cores), fixed for CI (better predictability)
          maxWorkers: process.env.CI ? 4 : '75%',
          minWorkers: 1,
          sequence: {
            groupOrder: 6,
          },
        },
      },
    ],
  },

  // Path aliases (match tsconfig.json and Next.js config)
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@heyclaude/web-runtime': resolve(__dirname, './packages/web-runtime/src'),
      '@heyclaude/data-layer': resolve(__dirname, './packages/data-layer/src'),
      // Use src for tests to avoid needing dist build
      // Handle both base import and subpath imports for shared-runtime
      '@heyclaude/shared-runtime/schemas/env': resolve(
        __dirname,
        './packages/shared-runtime/src/schemas/env.ts'
      ),
      '@heyclaude/shared-runtime': resolve(
        __dirname,
        './packages/shared-runtime/src/index.ts'
      ),
      '@heyclaude/database-types': resolve(
        __dirname,
        './packages/database-types/src'
      ),
      '@heyclaude/edge-runtime': resolve(
        __dirname,
        './packages/edge-runtime/src'
      ),
    },
    // Ensure mocks take precedence over actual module resolution
    // 'development' condition allows using source files in tests (from package.json exports)
    conditions: ['development', 'import', 'module', 'browser', 'default'],
  },
});
