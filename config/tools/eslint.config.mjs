/**
 * ESLint configuration for architectural rules and code quality
 * Primary linting and formatting tool for the codebase
 *
 * Plugins:
 * - @eslint/js: Core ESLint rules
 * - typescript-eslint: TypeScript support with type-checked rules
 * - eslint-plugin-unicorn: Modern JavaScript/TypeScript patterns
 * - eslint-plugin-boundaries: Monorepo architecture enforcement
 * - eslint-plugin-jsdoc: JSDoc documentation linting
 * - eslint-plugin-import-x: Import ordering and cycle detection
 * - eslint-plugin-jsx-a11y: Accessibility rules for JSX
 * - eslint-plugin-react-hooks: React hooks rules
 * - eslint-plugin-react: React-specific linting rules
 * - eslint-plugin-vitest: Vitest testing best practices
 * - eslint-plugin-n: Node.js-specific rules
 * - eslint-plugin-better-tailwindcss: Tailwind CSS linting
 * - eslint-plugin-perfectionist: Sorting and consistency
 * - eslint-plugin-prettier: Prettier integration
 * - eslint-config-prettier: Disables conflicting ESLint formatting rules
 * - architectural-rules: Custom rules for logging, security, architecture
 *
 * Located in config/tools/ to match codebase organization pattern
 */

import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginBoundaries from 'eslint-plugin-boundaries';
import eslintPluginJSDoc from 'eslint-plugin-jsdoc';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginVitest from 'eslint-plugin-vitest';
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
  // Prettier config - must be last to override conflicting formatting rules
  eslintConfigPrettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // Enable TypeScript project service for type-checked rules
        projectService: {
          allowDefaultProject: ['*.ts', '*.tsx'],
        },
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'architectural-rules': architecturalRules,
      boundaries: eslintPluginBoundaries,
      jsdoc: eslintPluginJSDoc,
      'import-x': importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'react-hooks': reactHooksPlugin,
      react: eslintPluginReact,
      n: eslintPluginN,
      'better-tailwindcss': eslintPluginBetterTailwindcss,
      perfectionist: eslintPluginPerfectionist,
      prettier: eslintPluginPrettier,
      // Note: unicorn plugin is already included via eslintPluginUnicorn.configs.recommended
    },
    settings: {
      // React plugin settings
      react: {
        version: 'detect',
      },
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
      // Better Tailwind CSS settings for Tailwind v4 (CSS-based config)
      'better-tailwindcss': {
        entryPoint: 'apps/web/src/app/globals.css',
      },
    },
    rules: {
      // ============================================
      // TypeScript ESLint Rules (Enhanced)
      // ============================================
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableNumber: true,
          allowNullableObject: true,
        },
      ],
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/array-type': 'off', // Allow both Array<T> and T[]
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      // Enhanced TypeScript rules
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/unbound-method': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'warn',

      // ============================================
      // React Plugin Rules (NEW)
      // ============================================
      'react/jsx-no-leaked-render': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/hook-use-state': 'warn',
      'react/jsx-no-useless-fragment': 'warn',
      'react/no-danger': 'warn',
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/no-unknown-property': 'error',
      'react/prop-types': 'off', // TypeScript handles this
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/display-name': 'off', // Too strict for HOCs

      // ============================================
      // Node.js Plugin Rules (NEW)
      // ============================================
      'n/no-deprecated-api': 'error',
      'n/no-unsupported-features/node-builtins': 'off', // Let TypeScript handle this
      'n/prefer-global/buffer': ['error', 'always'],
      'n/prefer-global/process': ['error', 'always'],
      'n/no-process-exit': 'warn',
      'n/no-sync': 'off', // Sometimes sync is appropriate
      'n/no-missing-import': 'off', // TypeScript handles this
      'n/no-missing-require': 'off', // TypeScript handles this
      'n/no-unpublished-import': 'off', // Monorepo setup
      'n/no-unpublished-require': 'off', // Monorepo setup
      'n/no-extraneous-import': 'off', // Monorepo handles this

      // ============================================
      // Better Tailwind CSS Rules
      // ============================================
      'better-tailwindcss/no-duplicate-classes': 'warn',
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
      'better-tailwindcss/enforce-consistent-class-order': 'off', // Disabled: Prettier with prettier-plugin-tailwindcss handles sorting
      'better-tailwindcss/no-unregistered-classes': 'warn', // Enabled to catch typos and invalid classes

      // ============================================
      // Prettier Rules
      // ============================================
      'prettier/prettier': 'warn', // Run Prettier as an ESLint rule

      // ============================================
      // Perfectionist Rules (NEW - Sorting)
      // All auto-fixable with --fix
      // ============================================
      'perfectionist/sort-imports': 'off', // Using import-x/order instead
      'perfectionist/sort-interfaces': ['warn', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-object-types': ['warn', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-union-types': ['warn', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-intersection-types': ['warn', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-enums': ['warn', { type: 'natural', order: 'asc' }],

      // ============================================
      // Logger & Error Instrumentation Rules
      // ============================================
      'architectural-rules/enforce-message-first-logger-api': 'error',
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/no-console-in-production-enhanced': 'error',
      'architectural-rules/require-error-normalization': 'error',
      'architectural-rules/require-normalize-error-before-logging': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-logger-bindings-for-context': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/prevent-raw-userid-logging': 'error',
      'architectural-rules/prefer-child-logger-over-setbindings': 'error',
      // PII & Audit Rules (added for enhanced logging instrumentation)
      'architectural-rules/warn-pii-field-logging': 'warn', // Informational - redaction handles it
      'architectural-rules/require-audit-level-for-mutations': 'warn', // Suggest audit/security levels
      // Log Level Usage Rules
      'architectural-rules/suggest-warn-for-recoverable-errors': 'warn', // Suggest warn instead of error for recoverable failures
      // Modernization Rules
      'architectural-rules/require-record-string-unknown-for-log-context': 'error',
      'architectural-rules/enforce-bracket-notation-for-log-context-access': 'error',
      'architectural-rules/prevent-base-log-context-usage': 'error',
      'architectural-rules/prevent-direct-pino-logger-usage': 'error',
      'architectural-rules/require-context-creation-functions': 'warn',
      // Missing Instrumentation Detection Rules
      'architectural-rules/detect-missing-rpc-error-logging': 'error',
      'architectural-rules/detect-missing-edge-logging-setup': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/detect-missing-logging-in-api-routes': 'error',

      // ============================================
      // Unicorn Plugin Rules (Enhanced)
      // ============================================
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
      'unicorn/no-array-method-this-argument': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/no-useless-undefined': 'error',
      // Enhanced Unicorn rules
      'unicorn/prefer-string-replace-all': 'warn',
      'unicorn/prefer-at': 'warn',
      'unicorn/prefer-object-from-entries': 'warn',
      'unicorn/no-negated-condition': 'warn',
      'unicorn/throw-new-error': 'error',
      // Disabled: Auto-fix conflicts with Prettier (Prettier removes parentheses that this rule wants to add)
      // Developers should manually refactor nested ternaries to if/else statements for better readability
      'unicorn/no-nested-ternary': 'off',

      // ============================================
      // Boundaries Plugin Rules
      // ============================================
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

      // ============================================
      // JSDoc Plugin Rules
      // ============================================
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/check-types': 'warn',

      // ============================================
      // Import-X Plugin Rules (Enhanced)
      // ============================================
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
      // Enhanced Import-X rules
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'warn',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-named-as-default': 'warn',
      'import-x/consistent-type-specifier-style': ['error', 'prefer-inline'],

      // ============================================
      // JSX A11y Rules (Enhanced)
      // ============================================
      'jsx-a11y/alt-text': 'off', // Will be enabled for TSX files only
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/aria-props': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',

      // ============================================
      // Custom Architectural Rules
      // ============================================
      'architectural-rules/require-request-id-in-logger': 'error',
      'architectural-rules/require-error-handler': 'error',
      'architectural-rules/require-error-logging-in-catch': 'error',
      'architectural-rules/no-server-imports-in-client': 'error',
      'architectural-rules/no-direct-auth-getuser': 'error',
      'architectural-rules/no-data-layer-violations': 'error',
      'architectural-rules/no-relative-imports-in-import-map-packages': 'error',
      'architectural-rules/require-database-types-for-enums': 'error',
      'architectural-rules/no-hardcoded-enum-values': 'error',
      'architectural-rules/require-section-logging': 'error',
      'architectural-rules/require-use-logged-async-in-client': 'error',
      'architectural-rules/require-safe-action-middleware': 'error',
      'architectural-rules/no-direct-database-access-in-actions': 'error',
      'architectural-rules/require-edge-logging': 'error',

      // Next.js & React Server Components Rules
      'architectural-rules/require-proper-dynamic-exports': 'warn',
      'architectural-rules/no-mixed-server-client-patterns': 'error',
      'architectural-rules/require-suspense-for-async-components': 'off',
      'architectural-rules/no-client-component-data-fetching': 'warn',

      // Supabase & Database Rules
      'architectural-rules/require-supabase-client-context': 'error',
      'architectural-rules/require-rpc-error-handling': 'error',
      'architectural-rules/no-direct-database-queries-in-components': 'error',
      'architectural-rules/require-generated-types-for-database-queries': 'warn',

      // Cache & Performance Rules
      'architectural-rules/require-cache-tags-for-mutations': 'warn',
      'architectural-rules/no-uncached-database-calls': 'off',
      'architectural-rules/require-parallel-fetching': 'off',
      'architectural-rules/no-blocking-operations-in-layouts': 'warn',

      // Environment Variables & Configuration Rules
      'architectural-rules/require-env-validation-schema': 'warn',
      'architectural-rules/no-hardcoded-urls': 'warn',
      'architectural-rules/require-feature-flag-validation': 'off',

      // Server Actions & Form Handling Rules
      'architectural-rules/require-zod-schema-for-server-actions': 'error',
      'architectural-rules/require-database-enum-types-in-schemas': 'error',
      'architectural-rules/require-rate-limiting-for-public-actions': 'warn',
      'architectural-rules/no-sensitive-data-in-action-metadata': 'error',

      // TypeScript & Type Safety Rules
      'architectural-rules/require-explicit-return-types-for-data-functions': 'off',
      'architectural-rules/no-type-assertions-without-comment': 'off',
      'architectural-rules/require-props-interface-for-components': 'off',
      'architectural-rules/no-any-in-public-api': 'warn',

      // Security & Data Validation Rules
      'architectural-rules/require-input-sanitization-before-database': 'off',
      'architectural-rules/no-admin-client-in-non-admin-context': 'error',
      'architectural-rules/require-auth-check-before-sensitive-operations': 'warn',
      'architectural-rules/no-exposed-secrets-in-client-code': 'error',

      // API Routes & Edge Functions Rules
      'architectural-rules/require-http-method-validation': 'warn',
      'architectural-rules/require-request-validation-in-api-routes': 'error',
      'architectural-rules/require-cors-headers-for-public-apis': 'off',
      'architectural-rules/no-long-running-operations-in-edge-functions': 'off',

      // Testing & Quality Rules
      'architectural-rules/require-test-file-for-complex-functions': 'off',
      'architectural-rules/require-error-test-cases': 'off',
      'architectural-rules/no-focused-tests-in-ci': 'error',

      // Performance & Bundle Size Rules
      'architectural-rules/no-large-dependencies-in-client-bundles': 'off',
      'architectural-rules/require-dynamic-import-for-heavy-components': 'off',
      'architectural-rules/no-blocking-third-party-scripts': 'warn',

      // Accessibility & UX Rules
      'architectural-rules/require-loading-states-for-async-operations': 'off',
      'architectural-rules/require-error-messages-for-forms': 'off',
      'architectural-rules/no-missing-alt-text-on-dynamic-images': 'warn',

      // Code Organization & Architecture Rules
      'architectural-rules/enforce-barrel-export-pattern': 'off',
      'architectural-rules/no-circular-dependencies-advanced': 'off',
      'architectural-rules/enforce-package-boundaries-enhanced': 'error',

      // Additional High-Value Rules
      'architectural-rules/require-metadata-for-generatemetadata': 'warn',
      'architectural-rules/require-error-boundary-in-route-groups': 'off',
      'architectural-rules/no-localstorage-for-auth-data': 'error',
      'architectural-rules/require-child-logger-in-async-functions': 'warn',
      'architectural-rules/require-loading-tsx-for-async-pages': 'off',
    },
  },
  // ============================================
  // TSX Files - React & A11y Rules
  // ============================================
  {
    files: ['**/*.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // JSX A11y rules (accessibility)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      // Enhanced A11y rules
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
    },
  },
  // ============================================
  // Vitest Test Files Configuration (NEW)
  // ============================================
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    plugins: {
      vitest: eslintPluginVitest,
    },
    rules: {
      // Vitest best practices
      'vitest/expect-expect': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-commented-out-tests': 'warn',
      'vitest/valid-expect': 'error',
      'vitest/no-conditional-expect': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/prefer-to-be': 'warn',
      'vitest/require-top-level-describe': 'warn',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-duplicate-hooks': 'error',
      'vitest/valid-title': 'error',
      'vitest/prefer-to-have-length': 'warn',
      'vitest/prefer-to-be-truthy': 'warn',
      'vitest/prefer-to-be-falsy': 'warn',
      'vitest/no-standalone-expect': 'error',
      // Relax some rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  // ============================================
  // Package-specific Logging Rules
  // ============================================
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
    files: [
      '../../apps/web/public/scripts/*.js',
      '../../apps/web/public/scripts/**/*.js',
      '**/apps/web/public/scripts/*.js',
      '**/apps/web/public/scripts/**/*.js',
    ],
    languageOptions: {
      parserOptions: {
        project: null,
        projectService: null,
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'off',
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
      'apps/web/public/scripts/**/*.js',
      '../../apps/web/public/scripts/**/*.js',
      'public/scripts/**/*.js',
      '**/public/scripts/**/*.js',
      'apps/web/public/service-worker.js',
      '../../apps/web/public/service-worker.js',
      'public/service-worker.js',
      '**/public/service-worker.js',
    ],
  }
);
