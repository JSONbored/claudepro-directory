/**
 * Jest Configuration
 *
 * Test files should be co-located with source files using *.test.ts naming.
 * Example: content.ts → content.test.ts (same directory)
 *
 * Environment:
 * - .tsx test files use 'jsdom' (React component tests)
 * - .ts test files use 'node' (server-side/utility tests)
 */

const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment (default: 'node')
  testEnvironment: 'node',
  
  // Setup files run before all tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Module name mapper for TypeScript path aliases
  moduleNameMapper: {
    // Map @heyclaude/shared-runtime subpath exports to source files
    '^@heyclaude/shared-runtime/schemas/env$': '<rootDir>/packages/shared-runtime/src/schemas/env.ts',
    '^@heyclaude/shared-runtime/infisical/cache$': '<rootDir>/packages/shared-runtime/src/infisical/cache.ts',
    '^@heyclaude/shared-runtime/infisical/client$': '<rootDir>/packages/shared-runtime/src/infisical/client.ts',
    '^@heyclaude/shared-runtime/infisical$': '<rootDir>/packages/shared-runtime/src/infisical/client.ts',
    '^@heyclaude/shared-runtime/logger/config$': '<rootDir>/packages/shared-runtime/src/logger/config.ts',
    '^@heyclaude/shared-runtime/logger/index$': '<rootDir>/packages/shared-runtime/src/logger/index.ts',
    '^@heyclaude/shared-runtime/logger$': '<rootDir>/packages/shared-runtime/src/logger/index.ts',
    '^@heyclaude/shared-runtime/error-handling$': '<rootDir>/packages/shared-runtime/src/error-handling.ts',
    '^@heyclaude/shared-runtime/privacy$': '<rootDir>/packages/shared-runtime/src/privacy.ts',
    '^@heyclaude/shared-runtime/env$': '<rootDir>/packages/shared-runtime/src/env.ts',
    '^@heyclaude/shared-runtime/platform$': '<rootDir>/packages/shared-runtime/src/platform/index.ts',
    '^@heyclaude/shared-runtime/rate-limit$': '<rootDir>/packages/shared-runtime/src/rate-limit.ts',
    '^@heyclaude/shared-runtime/proxy/guards$': '<rootDir>/packages/shared-runtime/src/proxy/guards.ts',
    '^@heyclaude/shared-runtime/utils/serialize$': '<rootDir>/packages/shared-runtime/src/utils/serialize.ts',
    // Map @heyclaude/database-types subpath exports (must come before general pattern)
    '^@heyclaude/database-types/postgres-types$': '<rootDir>/packages/database-types/src/postgres-types/index.ts',
    '^@heyclaude/database-types/postgres-types/(.*)$': '<rootDir>/packages/database-types/src/postgres-types/$1.ts',
    '^@heyclaude/database-types/prisma/zod/schemas$': '<rootDir>/packages/database-types/src/prisma/zod/schemas/index.ts',
    '^@heyclaude/database-types/prisma/zod/(.*)$': '<rootDir>/packages/database-types/src/prisma/zod/$1.ts',
    '^@heyclaude/database-types/prisma/browser$': '<rootDir>/packages/database-types/src/prisma/browser.ts',
    '^@heyclaude/database-types/prisma$': '<rootDir>/packages/database-types/src/prisma/index.ts',
    '^@heyclaude/database-types/prisma/(.*)$': '<rootDir>/packages/database-types/src/prisma/$1.ts',
    // Map @heyclaude/data-layer subpath exports
    '^@heyclaude/data-layer/prisma/client$': '<rootDir>/packages/data-layer/src/prisma/client.ts',
    '^@heyclaude/data-layer/prisma$': '<rootDir>/packages/data-layer/src/prisma/index.ts',
    '^@heyclaude/data-layer/services/trending$': '<rootDir>/packages/data-layer/src/services/trending.ts',
    // Map @heyclaude/web-runtime/utils/* subpath exports (must come before general pattern)
    '^@heyclaude/web-runtime/utils/(.*)$': '<rootDir>/packages/web-runtime/src/utils/$1',
    // Map @heyclaude/web-runtime/prisma-zod-schemas (must come before general pattern)
    '^@heyclaude/web-runtime/prisma-zod-schemas$': '<rootDir>/packages/web-runtime/src/prisma-zod-schemas.ts',
    // Map @heyclaude/* packages to their source files (must come after subpath exports)
    '^@heyclaude/(.*)$': '<rootDir>/packages/$1/src',
    // Map @/* to apps/web/*
    '^@/(.*)$': '<rootDir>/apps/web/$1',
    // Map @test-utils/* to config/tests/utils/*
    '^@test-utils/(.*)$': '<rootDir>/config/tests/utils/$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Use tsconfig.json for TypeScript compilation
        tsconfig: {
          // Base compiler options from tsconfig.base.json
          target: 'ES2022',
          lib: ['dom', 'dom.iterable', 'esnext'],
          module: 'commonjs', // Jest requires CommonJS
          moduleResolution: 'node', // Jest requires node resolution
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          strictBindCallApply: true,
          noImplicitAny: true,
          noImplicitReturns: true,
          noImplicitThis: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
          noFallthroughCasesInSwitch: true,
          noPropertyAccessFromIndexSignature: true,
          noImplicitOverride: true,
          allowImportingTsExtensions: false, // Jest doesn't support .ts extensions
          esModuleInterop: true,
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'react-jsx', // Transform JSX for Jest (was 'preserve' which prevented JSX parsing)
          // Path mappings from root tsconfig.json
          baseUrl: '.',
          paths: {
            '@/*': ['./apps/web/*'],
            '@/src/*': ['./apps/web/src/*'],
          },
        },
      },
    ],
  },
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.next/',
    '/coverage/',
    '/.turbo/',
    '/build/',
  ],
  
  // Transform ignore patterns - don't transform pre-built dist files
  // Exception: Transform next-safe-action (ESM module) for real middleware testing
  transformIgnorePatterns: [
    '/node_modules/(?!(next-safe-action)/)',
    // Don't transform prismocker dist files (they're already compiled)
    '/packages/prismocker/dist/',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'packages/**/src/**/*.{ts,tsx}',
    'apps/**/src/**/*.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/.next/**',
  ],
  
  // Coverage thresholds (optional - can be configured later)
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },
  
  // Projects configuration for monorepo (optional - can use single config for now)
  // projects: [
  //   '<rootDir>/packages/data-layer',
  //   '<rootDir>/packages/web-runtime',
  //   '<rootDir>/packages/shared-runtime',
  // ],
  
  // Globals (Jest 28+ uses @jest/globals instead)
  // globals: {
  //   'ts-jest': {
  //     tsconfig: {
  //       extends: './tsconfig.json',
  //     },
  //   },
  // },
  
  // Removed forceExit: true - we now properly flush loggers in jest.setup.ts
  // This ensures all async operations (Pino logger buffers) complete before Jest exits
  // forceExit was masking the issue rather than fixing it
  
  // Increase test timeout for slow tests (default is 5000ms)
  testTimeout: 10000,
};

