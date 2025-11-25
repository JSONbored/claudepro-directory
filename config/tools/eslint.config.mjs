/**
 * ESLint configuration for architectural rules
 * Runs alongside Biome to enforce architectural patterns
 *
 * Located in config/tools/ to match codebase organization pattern
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
// @ts-expect-error - Dynamic import for custom plugin
import architecturalRules from './eslint-plugin-architectural-rules.js';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'architectural-rules': architecturalRules,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'architectural-rules/require-request-id-in-logger': 'error',
      'architectural-rules/require-error-handler': 'error',
    },
  },
  {
    files: [
      '../../packages/web-runtime/src/data/**/*.ts',
      '../../packages/web-runtime/src/data/**/*.tsx',
    ],
    rules: {
      'architectural-rules/require-request-id-in-logger': 'error',
    },
  },
  {
    files: ['../../apps/web/src/app/**/*.tsx', '../../apps/web/src/app/**/*.ts'],
    rules: {
      'architectural-rules/require-request-id-in-logger': 'error',
    },
  },
  {
    files: ['../../apps/web/src/app/api/**/*.ts'],
    rules: {
      'architectural-rules/require-error-handler': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'generated/**',
      '**/*.config.js',
      '**/*.config.mjs',
    ],
  }
);
