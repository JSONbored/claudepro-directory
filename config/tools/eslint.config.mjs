/**
 * ESLint configuration for architectural rules and code quality
 * Primary linting and formatting tool for the codebase
 *
 * Located in config/tools/ to match codebase organization pattern
 */

import eslint from '@eslint/js';
import eslintPluginBoundaries from 'eslint-plugin-boundaries';
import eslintPluginJSDoc from 'eslint-plugin-jsdoc';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import-x';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
// @ts-expect-error - Dynamic import for custom plugin
import architecturalRules from './eslint-plugin-architectural-rules.js';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Phase 1: Type-checked rules for better type safety (requires type information)
  ...tseslint.configs.recommendedTypeChecked,
  // Phase 1: Strict rules for maximum code quality
  ...tseslint.configs.strict,
  // Phase 1: Stylistic rules for consistency
  ...tseslint.configs.stylistic,
  // Phase 2: Unicorn plugin for modern JavaScript/TypeScript patterns
  eslintPluginUnicorn.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // Enable TypeScript project service for type-checked rules
        projectService: {
          allowDefaultProject: ['*.ts', '*.tsx'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'architectural-rules': architecturalRules,
      boundaries: eslintPluginBoundaries,
      jsdoc: eslintPluginJSDoc,
      'import-x': importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'react-hooks': reactHooksPlugin,
      // Note: unicorn plugin is already included via eslintPluginUnicorn.configs.recommended
    },
    settings: {
      // Phase 3: Boundaries plugin configuration
      boundaries: [
        {
          type: 'apps',
          pattern: 'apps/**',
          capture: ['appName'],
        },
        {
          type: 'packages',
          pattern: 'packages/**',
          capture: ['packageName'],
        },
        {
          type: 'config',
          pattern: 'config/**',
        },
      ],
      'boundaries/elements': [
        {
          type: 'apps',
          pattern: 'apps/*',
        },
        {
          type: 'packages',
          pattern: 'packages/*',
        },
        {
          type: 'config',
          pattern: 'config/*',
        },
      ],
      // Phase 3: Define architectural boundaries
      'boundaries/include': ['apps/**', 'packages/**', 'config/**'],
      // Import plugin settings
      'import-x/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      // TypeScript ESLint overrides (less strict for gradual adoption)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Disable some strict rules that might be too opinionated initially
      '@typescript-eslint/strict-boolean-expressions': 'off', // Can enable later
      '@typescript-eslint/no-floating-promises': 'warn', // Warn instead of error
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      // Logger & Error Instrumentation Rules - Comprehensive Pino Enforcement
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/prevent-raw-userid-logging': 'error',
      'architectural-rules/prefer-child-logger-over-setbindings': 'error',
      // Missing Instrumentation Detection Rules
      'architectural-rules/detect-missing-rpc-error-logging': 'error',
      'architectural-rules/detect-missing-edge-logging-setup': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/detect-missing-logging-in-api-routes': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/array-type': 'off', // Allow both Array<T> and T[]
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/require-await': 'error',
      // Enhanced TypeScript rules
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',

      // Phase 2: Unicorn plugin rules (selected from recommended)
      'unicorn/consistent-function-scoping': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/filename-case': ['warn', { case: 'kebabCase' }],
      'unicorn/prevent-abbreviations': 'off', // Too strict for our codebase
      'unicorn/prefer-export-from': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/expiring-todo-comments': 'warn',
      'unicorn/prefer-code-point': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/no-null': 'off', // Too strict - we use null in many places
      'unicorn/prefer-global-this': 'warn',
      'unicorn/no-nested-ternary': 'error',
      'unicorn/prefer-native-coercion-functions': 'warn',
      'unicorn/explicit-length-check': 'warn',
      // Enhanced Unicorn rules
      'unicorn/no-array-method-this-argument': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/no-useless-undefined': 'error',

      // Phase 3: Boundaries plugin rules
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'apps',
              allow: ['packages'],
            },
            {
              from: 'packages',
              allow: ['packages'],
            },
            {
              from: 'config',
              allow: ['packages'],
            },
          ],
        },
      ],

      // Phase 4: JSDoc plugin rules (for public APIs)
      'jsdoc/require-param': 'off', // Too strict for all files
      'jsdoc/require-returns': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/check-types': 'warn', // Warn on incorrect JSDoc types

      // Import plugin rules
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-cycle': ['error', { maxDepth: 3 }],
      'import-x/no-duplicates': 'error',
      'import-x/no-unresolved': 'off', // TypeScript handles this

      // JSX A11y rules (accessibility) - only for TSX files
      'jsx-a11y/alt-text': 'off', // Will be enabled for TSX files only
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/aria-props': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',

      // Custom architectural rules
      'architectural-rules/require-request-id-in-logger': 'error',
      'architectural-rules/require-error-handler': 'error',
      'architectural-rules/require-error-logging-in-catch': 'error',
      'architectural-rules/no-server-imports-in-client': 'error',
      'architectural-rules/no-direct-auth-getuser': 'error',
      'architectural-rules/no-data-layer-violations': 'error',
      // New custom rules
      'architectural-rules/require-database-types-for-enums': 'error',
      'architectural-rules/no-hardcoded-enum-values': 'error',
      'architectural-rules/require-section-logging': 'error',
      'architectural-rules/require-use-logged-async-in-client': 'error',
      'architectural-rules/require-safe-action-middleware': 'error',
      'architectural-rules/no-direct-database-access-in-actions': 'error',
      'architectural-rules/require-edge-logging': 'error',
    },
  },
  {
    files: [
      '../../packages/web-runtime/src/data/**/*.ts',
      '../../packages/web-runtime/src/data/**/*.tsx',
    ],
    rules: {
      'architectural-rules/require-request-id-in-logger': 'error',
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
    },
  },
  {
    files: ['../../packages/data-layer/src/services/**/*.ts'],
    rules: {
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/detect-missing-rpc-error-logging': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
    },
  },
  {
    files: ['../../packages/data-layer/src/utils/**/*.ts'],
    rules: {
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
    },
  },
  {
    files: ['../../packages/edge-runtime/src/**/*.ts'],
    rules: {
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
    },
  },
  {
    files: ['../../apps/web/src/app/**/*.tsx', '../../apps/web/src/app/**/*.ts'],
    rules: {
      'architectural-rules/require-request-id-in-logger': 'error',
      'architectural-rules/require-error-logging-in-catch': 'error',
      'architectural-rules/require-section-logging': 'error',
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/prevent-raw-userid-logging': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
    },
  },
  {
    files: ['../../apps/web/src/components/**/*.tsx', '../../apps/web/src/components/**/*.ts'],
    rules: {
      'architectural-rules/no-server-imports-in-client': 'error',
      'architectural-rules/require-use-logged-async-in-client': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
    },
  },
  {
    // React and JSX A11y rules only for TSX files
    files: ['**/*.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      // Note: jsx-a11y/no-dangerously-set-innerhtml rule not available in this version
      // Using eslint-disable comments in code where needed
      'jsx-a11y/click-events-have-key-events': 'warn', // Warn for now, can be error later
    },
  },
  {
    files: ['../../apps/web/src/app/api/**/*.ts'],
    rules: {
      'architectural-rules/require-error-handler': 'error',
      'architectural-rules/no-direct-auth-getuser': 'error',
      'architectural-rules/no-data-layer-violations': 'error',
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
      'architectural-rules/detect-missing-logging-in-api-routes': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
    },
  },
  {
    files: ['../../packages/web-runtime/src/actions/**/*.ts'],
    rules: {
      'architectural-rules/require-safe-action-middleware': 'error',
      'architectural-rules/no-direct-database-access-in-actions': 'error',
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
    },
  },
  {
    files: ['../../apps/edge/functions/**/*.ts'],
    rules: {
      'architectural-rules/require-edge-logging': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-edge-init-request-logging': 'error',
      'architectural-rules/require-edge-trace-request-complete': 'error',
      'architectural-rules/prefer-logger-helpers-in-edge': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
      'architectural-rules/detect-missing-edge-logging-setup': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
    },
  },
  {
    // Error boundary files must use standardized logging
    files: [
      '**/error.tsx',
      '**/error.ts',
      '**/global-error.tsx',
      '**/*error-boundary*.tsx',
      '**/*error-boundary*.ts',
    ],
    rules: {
      'architectural-rules/require-error-boundary-logging': 'error',
    },
  },
  {
    // Files containing createErrorBoundaryFallback must use structured logging
    files: ['**/*error-handler*.ts', '**/*error-handler*.tsx'],
    rules: {
      'architectural-rules/require-error-boundary-fallback-logging': 'error',
    },
  },
  {
    files: ['../../apps/web/src/**/*.ts', '../../apps/web/src/**/*.tsx'],
    rules: {
      'architectural-rules/no-direct-auth-getuser': 'error',
      'architectural-rules/no-data-layer-violations': 'error',
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/prevent-raw-userid-logging': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
    },
  },
  {
    files: ['../../packages/**/*.ts', '../../packages/**/*.tsx'],
    rules: {
      'architectural-rules/require-request-id-in-logger': 'error',
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
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
