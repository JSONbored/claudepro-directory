/**
 * ESLint configuration for the shared-runtime package
 *
 * Extends the shared config with minimal relaxations for legitimate utility library needs:
 * - Request context rules (utilities don't have request context by design)
 * - Internal imports (relative imports within the same package are correct)
 */

import sharedConfig from '../../config/tools/eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...sharedConfig,
  {
    files: ['src/**/*.ts'],
    rules: {
      // ============================================
      // Request context rules - utilities don't have request context
      // These are legitimately off because utility functions are called
      // from various contexts and can't know about request IDs
      // ============================================
      'architectural-rules/require-request-id-in-logger': 'off',
      'architectural-rules/detect-incomplete-log-context': 'off',

      // ============================================
      // Internal imports - relative imports within the same package are correct
      // Import map paths are for external consumers, not internal imports
      // ============================================
      'architectural-rules/no-relative-imports-in-import-map-packages': 'off',

      // ============================================
      // Env validation - this package DEFINES the env validation
      // ============================================
      'architectural-rules/require-env-validation-schema': 'off',
    },
  },
];
