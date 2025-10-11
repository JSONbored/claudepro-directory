import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration
 *
 * Production-safe testing configuration for Next.js 15.5+ with React 19.1+
 *
 * **Key Features:**
 * - Zero production bundle impact (test files excluded from builds)
 * - TypeScript path aliases (@/src/*)
 * - React 19 support with automatic JSX runtime
 * - Happy-DOM for fast React rendering tests
 * - Global test utilities (describe, it, expect)
 * - Coverage reporting with v8 provider
 *
 * **Performance:**
 * - Parallel test execution with worker threads
 * - Fast DOM environment (happy-dom > jsdom)
 * - Optimized for monorepo structure
 *
 * @see https://vitest.dev/config/
 */
export default defineConfig({
  plugins: [
    react({
      // Enable React 19 features
      jsxRuntime: 'automatic',
    }),
    tsconfigPaths(),
  ],
  test: {
    // Environment configuration
    environment: 'happy-dom', // Faster than jsdom, better React 19 support
    globals: true, // Enable global test APIs (describe, it, expect)

    // Setup files run before each test file
    setupFiles: ['./tests/setup.tsx'],

    // Test file patterns
    include: [
      'src/**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],

    // Exclude patterns (production-safe)
    exclude: [
      'node_modules',
      '.next',
      'dist',
      'build',
      'coverage',
      '**/*.d.ts',
      '**/*.config.*',
      '**/mockData/**',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8', // Faster than istanbul, native code coverage
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',

      // Exclude from coverage
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.stories.tsx',
        '**/mockData/**',
        'src/app/**', // Exclude App Router (test with E2E)
        'src/middleware.ts', // Test with E2E
        'scripts/**',
        'config/**',
      ],

      // Coverage thresholds (start conservative, increase over time)
      // Current baseline: 6% lines, 10% functions, 29% branches, 6% statements
      // Target: Incrementally increase as we add tests
      thresholds: {
        lines: 5, // Start at 5%, increase to 70% over time
        functions: 8, // Start at 8%, increase to 70% over time
        branches: 25, // Start at 25%, increase to 65% over time
        statements: 5, // Start at 5%, increase to 70% over time
      },
    },

    // Timeouts
    testTimeout: 10000, // 10 seconds per test
    hookTimeout: 10000, // 10 seconds for beforeEach/afterEach

    // Performance: Parallel execution with worker threads
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false, // Enable parallel execution
        useAtomics: true, // Better performance for worker communication
      },
    },

    // Reporter configuration
    reporters: process.env.CI ? ['verbose', 'json'] : ['verbose'],

    // Snapshot configuration
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },

  // Path resolution (matches tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/src': path.resolve(__dirname, './src'),
    },
  },
});
