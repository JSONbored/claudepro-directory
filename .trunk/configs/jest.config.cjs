/**
 * Jest Configuration
 * 
 * Moved to .trunk/configs/ for Trunk integration
 * 
 * Test files should be co-located with source files using *.test.ts naming.
 * Example: content.ts → content.test.ts (same directory)
 *
 * Environment:
 * - .tsx test files use 'jsdom' (React component tests)
 * - .ts test files use 'node' (server-side/utility tests)
 */

const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../tsconfig.json');

module.exports = {
  // CRITICAL: Set rootDir to project root (not .trunk/configs/)
  // This ensures all path mappings work correctly
  rootDir: '../..',
  
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // CRITICAL: When package.json has "type": "module", Jest tries to parse files as ESM
  // We must explicitly tell Jest NOT to treat TypeScript files as ESM
  // ts-jest will transform them to CommonJS
  // This is the key difference from safemocker - they don't have "type": "module" in package.json
  extensionsToTreatAsEsm: [], // Don't treat any files as ESM - ts-jest handles transformation
  
  // CRITICAL: Force Jest to use CommonJS module system (overrides package.json "type": "module")
  // This ensures Jest doesn't try to parse TypeScript files as ESM before ts-jest transforms them
  testEnvironmentOptions: {
    // Ensure Node.js doesn't treat test files as ESM
  },
  
  // Test environment (default: 'node')
  testEnvironment: 'node',
  
  // Setup files run before all tests
  // Path is relative to rootDir (project root)
  // Since rootDir is '../..' (project root), and jest.setup.ts is in .trunk/configs/,
  // we use the path relative to project root
  setupFilesAfterEnv: ['<rootDir>/.trunk/configs/jest.setup.ts'],
  
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
    '^@heyclaude/data-layer/utils/request-cache$': '<rootDir>/packages/data-layer/src/utils/request-cache.ts',
    '^@heyclaude/data-layer/utils/rpc-error-logging$': '<rootDir>/packages/data-layer/src/utils/rpc-error-logging.ts',
    // Map @heyclaude/web-runtime/api/* subpath exports (must come before general pattern)
    '^@heyclaude/web-runtime/api/(.*)$': '<rootDir>/packages/web-runtime/src/api/$1',
    // Map @heyclaude/web-runtime/server/* subpath exports (must come before general pattern)
    '^@heyclaude/web-runtime/server/(.*)$': '<rootDir>/packages/web-runtime/src/server/$1',
    // Map @heyclaude/web-runtime/logging/* subpath exports (must come before general pattern)
    '^@heyclaude/web-runtime/logging/(.*)$': '<rootDir>/packages/web-runtime/src/logging/$1',
    // Map @heyclaude/web-runtime/auth/* subpath exports (must come before general pattern)
    '^@heyclaude/web-runtime/auth/(.*)$': '<rootDir>/packages/web-runtime/src/auth/$1',
    // Map @heyclaude/web-runtime/utils/* subpath exports (must come before general pattern)
    '^@heyclaude/web-runtime/utils/(.*)$': '<rootDir>/packages/web-runtime/src/utils/$1',
    // Map @heyclaude/web-runtime/actions/logger and errors FIRST (imported as ../logger.ts and ../errors.ts from actions)
    // These must come before the general actions/* pattern
    '^@heyclaude/web-runtime/actions/logger$': '<rootDir>/packages/web-runtime/src/logger.ts',
    '^@heyclaude/web-runtime/actions/errors$': '<rootDir>/packages/web-runtime/src/errors.ts',
    // Map @heyclaude/web-runtime/actions/* subpath exports (must come after specific logger/errors mappings)
    '^@heyclaude/web-runtime/actions/(.*)$': '<rootDir>/packages/web-runtime/src/actions/$1',
    // Map @heyclaude/web-runtime/supabase/* subpath exports (must come before general pattern)
    '^@heyclaude/web-runtime/supabase/(.*)$': '<rootDir>/packages/web-runtime/src/supabase/$1',
    // Map @heyclaude/web-runtime/pulse subpath export (must come before general pattern)
    '^@heyclaude/web-runtime/pulse$': '<rootDir>/packages/web-runtime/src/pulse.ts',
    // Map @heyclaude/web-runtime/server/fetch-helpers (must come before general pattern)
    '^@heyclaude/web-runtime/server/fetch-helpers$': '<rootDir>/packages/web-runtime/src/server/fetch-helpers.ts',
    // Map @heyclaude/web-runtime/prisma-zod-schemas (must come before general pattern)
    '^@heyclaude/web-runtime/prisma-zod-schemas$': '<rootDir>/packages/web-runtime/src/prisma-zod-schemas.ts',
    // Map @heyclaude/mcp-server subpath exports (must come before general pattern)
    // These mappings respect package.json exports field
    '^@heyclaude/mcp-server/tools/categories$': '<rootDir>/packages/mcp-server/src/mcp/tools/categories.ts',
    '^@heyclaude/mcp-server/tools/detail$': '<rootDir>/packages/mcp-server/src/mcp/tools/detail.ts',
    '^@heyclaude/mcp-server/tools/featured$': '<rootDir>/packages/mcp-server/src/mcp/tools/featured.ts',
    '^@heyclaude/mcp-server/tools/popular$': '<rootDir>/packages/mcp-server/src/mcp/tools/popular.ts',
    '^@heyclaude/mcp-server/tools/recent$': '<rootDir>/packages/mcp-server/src/mcp/tools/recent.ts',
    '^@heyclaude/mcp-server/tools/search$': '<rootDir>/packages/mcp-server/src/mcp/tools/search.ts',
    '^@heyclaude/mcp-server/tools/trending$': '<rootDir>/packages/mcp-server/src/mcp/tools/trending.ts',
    '^@heyclaude/mcp-server/tools$': '<rootDir>/packages/mcp-server/src/mcp/tools/index.ts',
    '^@heyclaude/mcp-server/types/runtime$': '<rootDir>/packages/mcp-server/src/types/runtime.ts',
    '^@heyclaude/mcp-server/lib/env-config$': '<rootDir>/packages/mcp-server/src/lib/env-config.ts',
    '^@heyclaude/mcp-server/lib/env-utils$': '<rootDir>/packages/mcp-server/src/lib/env-utils.ts',
    '^@heyclaude/mcp-server/lib/errors$': '<rootDir>/packages/mcp-server/src/lib/errors.ts',
    '^@heyclaude/mcp-server/lib/logger-utils$': '<rootDir>/packages/mcp-server/src/lib/logger-utils.ts',
    '^@heyclaude/mcp-server/lib/platform-formatters$': '<rootDir>/packages/mcp-server/src/lib/platform-formatters.ts',
    '^@heyclaude/mcp-server/lib/schemas$': '<rootDir>/packages/mcp-server/src/lib/schemas.ts',
    '^@heyclaude/mcp-server/lib/storage-utils$': '<rootDir>/packages/mcp-server/src/lib/storage-utils.ts',
    '^@heyclaude/mcp-server/lib/usage-hints$': '<rootDir>/packages/mcp-server/src/lib/usage-hints.ts',
    '^@heyclaude/mcp-server/lib/utils$': '<rootDir>/packages/mcp-server/src/lib/utils.ts',
    '^@heyclaude/mcp-server/middleware/rate-limit$': '<rootDir>/packages/mcp-server/src/middleware/rate-limit.ts',
    '^@heyclaude/mcp-server/middleware/request-deduplication$': '<rootDir>/packages/mcp-server/src/middleware/request-deduplication.ts',
    '^@heyclaude/mcp-server/cache/cache-headers$': '<rootDir>/packages/mcp-server/src/cache/cache-headers.ts',
    '^@heyclaude/mcp-server/cache/kv-cache$': '<rootDir>/packages/mcp-server/src/cache/kv-cache.ts',
    '^@heyclaude/mcp-server/observability/metrics$': '<rootDir>/packages/mcp-server/src/observability/metrics.ts',
    '^@heyclaude/mcp-server/routes/health$': '<rootDir>/packages/mcp-server/src/routes/health.ts',
    '^@heyclaude/mcp-server/routes/oauth-authorize$': '<rootDir>/packages/mcp-server/src/routes/oauth-authorize.ts',
    '^@heyclaude/mcp-server/routes/oauth-metadata$': '<rootDir>/packages/mcp-server/src/routes/oauth-metadata.ts',
    '^@heyclaude/mcp-server/routes/oauth-token$': '<rootDir>/packages/mcp-server/src/routes/oauth-token.ts',
    '^@heyclaude/mcp-server/routes/oauth/shared$': '<rootDir>/packages/mcp-server/src/routes/oauth/shared.ts',
    '^@heyclaude/mcp-server/routes/openapi$': '<rootDir>/packages/mcp-server/src/routes/openapi.ts',
    '^@heyclaude/mcp-server/mcp/server$': '<rootDir>/packages/mcp-server/src/mcp/server.ts',
    '^@heyclaude/mcp-server/mcp/resources$': '<rootDir>/packages/mcp-server/src/mcp/resources/index.ts',
    '^@heyclaude/mcp-server/mcp/prompts$': '<rootDir>/packages/mcp-server/src/mcp/prompts/index.ts',
    '^@heyclaude/mcp-server/server$': '<rootDir>/packages/mcp-server/src/server/node-server.ts',
    '^@heyclaude/mcp-server/cli$': '<rootDir>/packages/mcp-server/src/cli.ts',
    '^@heyclaude/mcp-server/adapters$': '<rootDir>/packages/mcp-server/src/adapters/api-proxy.ts',
    '^@heyclaude/mcp-server/adapters/cloudflare-worker$': '<rootDir>/packages/mcp-server/src/adapters/cloudflare-worker.ts',
    // Map @heyclaude/* packages to their source files (must come after subpath exports)
    '^@heyclaude/(.*)$': '<rootDir>/packages/$1/src',
    // Map @/* to apps/web/*
    '^@/(.*)$': '<rootDir>/apps/web/$1',
    // Map @test-utils/* to config/tests/utils/*
    '^@test-utils/(.*)$': '<rootDir>/config/tests/utils/$1',
    // Map next-safe-action to our mock (solves ESM compatibility issue)
    // This ensures Jest uses our CommonJS-compatible mock instead of trying to import the ESM module
    '^next-safe-action$': '<rootDir>/packages/web-runtime/src/actions/__mocks__/next-safe-action.ts',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // CRITICAL: When package.json has "type": "module", Jest tries to parse files as ESM
        // We must explicitly tell ts-jest to use CommonJS transformation
        // This matches safemocker's jest.config.cjs which works perfectly
        isolatedModules: false, // Allow type checking during transformation
        // CRITICAL: Force CommonJS output format (overrides package.json "type": "module")
        // This is the key difference - safemocker doesn't have "type": "module" so it works
        // We need to explicitly override it here
        compiler: 'typescript',
        // Use tsconfig.json for TypeScript compilation
        tsconfig: {
          // Base compiler options from tsconfig.base.json
          target: 'ES2022',
          lib: ['dom', 'dom.iterable', 'esnext'],
          module: 'commonjs', // CRITICAL: Jest requires CommonJS (overrides package.json "type": "module")
          moduleResolution: 'node', // Jest requires node resolution
          esModuleInterop: true,
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
  // Match both .test.ts (Jest) and .spec.ts (Playwright) files
  // Note: Playwright spec files will fail in Jest but that's OK - they're run separately
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
  // Exception: Transform @jsonbored/safemocker (ESM module) - our mock imports from it
  transformIgnorePatterns: [
    '/node_modules/(?!(next-safe-action|@jsonbored/safemocker)/)',
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
  
  // JUnit XML reporter for Trunk Flaky Tests integration
  // Outputs test results in JUnit XML format for Trunk cloud analysis
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '../../.trunk/test-results/jest',
        outputName: 'junit.xml',
        addFileAttribute: 'true',
        reportTestSuiteErrors: 'true',
        suiteName: 'Jest Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
};

