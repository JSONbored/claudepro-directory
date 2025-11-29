/**
 * ESLint configuration for the generators package (CLI tools)
 * 
 * Extends the shared config but relaxes server-specific rules that don't
 * apply to CLI tools (no request/response cycle, no requestId, etc.)
 * 
 * CLI tools work with external APIs and dynamic data (database introspection,
 * file system operations, etc.) where strict type checking is less useful.
 */

import sharedConfig from '../../config/tools/eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...sharedConfig,
  // ============================================
  // Generators Package (CLI Tools) - Relaxed Rules
  // CLI tools don't have request/response cycles, so server-specific rules don't apply
  // ============================================
  {
    files: ['src/**/*.ts'],
    rules: {
      // ============================================
      // Server/Request-specific rules that don't apply to CLI
      // ============================================
      'architectural-rules/require-request-id-in-logger': 'off',
      'architectural-rules/detect-incomplete-log-context': 'off',
      'architectural-rules/require-module-in-bindings': 'off',
      'architectural-rules/require-logger-bindings-for-context': 'off',
      'architectural-rules/prefer-child-logger-over-setbindings': 'off',
      'architectural-rules/no-console-in-production-enhanced': 'off',
      'architectural-rules/require-error-normalization': 'off',
      'architectural-rules/require-normalize-error-before-logging': 'off',
      'architectural-rules/require-env-validation-schema': 'off',
      'architectural-rules/no-hardcoded-enum-values': 'off',
      'architectural-rules/enforce-log-context-naming': 'off',

      // ============================================
      // CLI-specific relaxations
      // ============================================
      'n/no-process-exit': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/prefer-top-level-await': 'off',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      'unicorn/consistent-function-scoping': 'warn',

      // ============================================
      // Type safety relaxations for CLI tooling
      // CLI tools work with external APIs, database introspection, etc.
      // ============================================
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',

      // ============================================
      // Style rules relaxed for CLI scripts
      // ============================================
      'unicorn/import-style': 'warn',
      'unicorn/no-array-sort': 'warn',
      'unicorn/no-array-reduce': 'warn',
      'unicorn/no-array-callback-reference': 'warn',

      // ============================================
      // Additional relaxations for CLI edge cases
      // ============================================
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // CLI tools may have constant binary expressions for defaults
      'no-constant-binary-expression': 'warn',
      // Allow deprecated APIs in CLI tools (can be upgraded later)
      'n/no-deprecated-api': 'warn',
      // CLI tools may use ts-nocheck for generated/legacy code
      '@typescript-eslint/ban-ts-comment': 'warn',
      // Logging patterns relaxation for CLI tools
      'architectural-rules/prevent-raw-userid-logging': 'off',
      'architectural-rules/detect-outdated-logging-patterns': 'off',
      // import/no-cycle rule may not be loaded for generators
      'import/no-cycle': 'off',
      // Optional chain isn't always preferred for certain patterns
      '@typescript-eslint/prefer-optional-chain': 'warn',
    },
  },
];
