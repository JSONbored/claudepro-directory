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
 */
export default defineConfig({
  test: {
    // Enable global test functions (describe, it, expect, vi)
    globals: true,
    
    // Environment based on file extension
    // Component tests (.tsx) need jsdom, server tests (.ts) use node
    environment: 'node',
    environmentMatchGlobs: [
      // React component tests need jsdom
      ['**/*.test.tsx', 'jsdom'],
      ['**/*.spec.tsx', 'jsdom'],
      // Server-side tests use node (default)
      ['**/*.test.ts', 'node'],
      ['**/*.spec.ts', 'node'],
    ],
    
    // Include test files (only in source directories, not node_modules)
    include: [
      'packages/**/*.{test,spec}.{ts,tsx}',
      'apps/**/*.{test,spec}.{ts,tsx}',
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
      // Coverage thresholds - start conservative, increase over time
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
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
  },
  
  // Path aliases (match tsconfig.json and Next.js config)
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@heyclaude/web-runtime': resolve(__dirname, './packages/web-runtime/src'),
      '@heyclaude/data-layer': resolve(__dirname, './packages/data-layer/src'),
      // Use src for tests to avoid needing dist build
      // Point to index.ts explicitly to ensure proper module resolution
      '@heyclaude/shared-runtime': resolve(__dirname, './packages/shared-runtime/src/index.ts'),
      '@heyclaude/database-types': resolve(__dirname, './packages/database-types/src'),
      '@heyclaude/edge-runtime': resolve(__dirname, './packages/edge-runtime/src'),
    },
    // Ensure mocks take precedence over actual module resolution
    // 'development' condition allows using source files in tests (from package.json exports)
    conditions: ['development', 'import', 'module', 'browser', 'default'],
  },
});
