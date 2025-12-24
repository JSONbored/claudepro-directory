/**
 * Jest Configuration for Prismocker
 *
 * Standalone Jest configuration for the prismocker package.
 * This package is completely standalone and can be copied to a separate repo.
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/src/**/*.test.ts',
    // Exclude example files - they're documentation, not actual tests
    '!**/examples/**/*.test.ts',
  ],
  // Test directories in order of execution
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/examples/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/examples/',
  ],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'commonjs',
          moduleResolution: 'node',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          allowImportingTsExtensions: false,
        },
      },
    ],
  },
  // CRITICAL: Map .js imports to .ts files
  // TypeScript allows .js extensions in imports for ESM compatibility,
  // but Jest needs to resolve them to actual .ts source files
  moduleNameMapper: {
    // Map .js imports within src/ to .ts files
    '^(\\.\\.?/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/bin/**',
  ],
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  // Increase test timeout for complex operations
  testTimeout: 10000,
};

