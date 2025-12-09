/**
 * ESLint configuration for architectural rules and code quality
 * Primary linting and formatting tool for the codebase
 *
 * Plugins:
 * - @eslint/js: Core ESLint rules
 * - @eslint/json: JSON file linting
 * - typescript-eslint: TypeScript support with type-checked rules
 * - eslint-plugin-unicorn: Modern JavaScript/TypeScript patterns
 * - eslint-plugin-boundaries: Monorepo architecture enforcement
 * - eslint-plugin-jsdoc: JSDoc documentation linting
 * - eslint-plugin-import-x: Import ordering and cycle detection
 * - eslint-plugin-jsx-a11y: Accessibility rules for JSX
 * - eslint-plugin-react-hooks: React hooks rules (ALL 17 recommended rules included)
 * - eslint-plugin-react: React-specific linting rules (ALL 22 recommended rules included)
 * - @next/eslint-plugin-next: Next.js rules (ALL 21 rules from core-web-vitals config)
 * - eslint-plugin-vitest: Vitest testing best practices
 * - eslint-plugin-n: Node.js-specific rules
 * - eslint-plugin-better-tailwindcss: Tailwind CSS linting
 * - eslint-plugin-perfectionist: Sorting and consistency
 * - eslint-plugin-prettier: Prettier integration
 * - eslint-config-prettier: Disables conflicting ESLint formatting rules
 * - eslint-plugin-security: Security vulnerability detection
 * - eslint-plugin-sonarjs: Code smells, complexity, bug patterns
 * - eslint-plugin-promise: Promise/async-await best practices
 * - eslint-plugin-array-func: Array method optimizations
 * - eslint-plugin-de-morgan: Logical consistency (De Morgan's laws)
 * - eslint-plugin-turbo: Turborepo-specific rules
 * - architectural-rules: Custom rules for logging, security, architecture
 *
 * Next.js Integration:
 * - Uses @next/eslint-plugin-next directly (per Next.js docs for complex setups)
 * - Includes ALL recommended rules from eslint-config-next/core-web-vitals:
 *   - 21 Next.js rules (from nextPlugin.configs['core-web-vitals'].rules)
 *   - 22 React rules (manually added, matching eslint-config-next/core-web-vitals)
 *   - 17 React Hooks rules (manually added, matching eslint-config-next/core-web-vitals)
 * - Includes ALL TypeScript rules from eslint-config-next/typescript (20 rules)
 * - Uses eslint-config-prettier/flat (per Next.js docs for flat config)
 * - Includes all ignore patterns from eslint-config-next (.next/**, out/**, build/**, next-env.d.ts)
 *
 * Located in config/tools/ to match codebase organization pattern
 */

import eslint from '@eslint/js';
import jsonPlugin from '@eslint/json';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginArrayFunc from 'eslint-plugin-array-func';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginBoundaries from 'eslint-plugin-boundaries';
import eslintPluginDeMorgan from 'eslint-plugin-de-morgan';
import eslintPluginJSDoc from 'eslint-plugin-jsdoc';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginSecurity from 'eslint-plugin-security';
import eslintPluginSonarjs from 'eslint-plugin-sonarjs';
import eslintPluginTurbo from 'eslint-plugin-turbo';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginVitest from 'eslint-plugin-vitest';
import importPlugin from 'eslint-plugin-import-x';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import nextPlugin from '@next/eslint-plugin-next';
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
  // Next.js ESLint Plugin - Client/Server boundary detection and Next.js best practices
  // Using core-web-vitals config (upgrades Core Web Vitals rules from warnings to errors)
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    settings: {
      next: {
        rootDir: 'apps/web',
      },
    },
    rules: {
      // Use core-web-vitals config (recommended by Next.js docs)
      // This includes all recommended rules + upgrades Core Web Vitals rules to errors
      ...nextPlugin.configs['core-web-vitals'].rules,
      // Configure no-html-link-for-pages to use App Router directory
      '@next/next/no-html-link-for-pages': ['error', 'apps/web/src/app'],
      // Additional rules that might catch segment config issues
      '@next/next/no-async-client-component': 'error', // Prevents async client components
    },
  },
  // Prettier config - must be last to override conflicting formatting rules
  // Note: eslintConfigPrettier disables conflicting ESLint formatting rules
  // but import-x/order can still conflict during auto-fix
  eslintConfigPrettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // Enable TypeScript project service for type-checked rules
        // Performance: projectService is faster than project: true and handles monorepos better
        projectService: {
          // Only allow default project for files that don't match any tsconfig.json
          // This reduces unnecessary type checking overhead
          allowDefaultProject: ['*.config.{js,mjs,cjs}', '*.setup.{ts,js}'],
        },
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
        // Performance optimization: parse JSDoc only when needed
        // 'all' = parse all JSDoc (slower but more accurate)
        // 'none' = skip JSDoc parsing (fastest, but loses JSDoc-based type info)
        // 'type-info' = parse only for type information (balanced)
        // Using 'type-info' for better performance while keeping type checking
        jsDocParsingMode: 'type-info', // Optimized: only parse JSDoc for type information
      },
    },
    // ESLint 9 performance optimizations
    linterOptions: {
      // Prevent inline config overrides for better performance
      // Set to true to disable inline configs (faster, but less flexible)
      noInlineConfig: false, // Keep false to allow inline configs when needed
      // Report unused disable directives (helps clean up unnecessary suppressions)
      reportUnusedDisableDirectives: 'warn',
    },
    plugins: {
      'architectural-rules': architecturalRules,
      'array-func': eslintPluginArrayFunc,
      boundaries: eslintPluginBoundaries,
      'de-morgan': eslintPluginDeMorgan,
      jsdoc: eslintPluginJSDoc,
      'import-x': importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
      'react-hooks': reactHooksPlugin,
      react: eslintPluginReact,
      n: eslintPluginN,
      'better-tailwindcss': eslintPluginBetterTailwindcss,
      perfectionist: eslintPluginPerfectionist,
      prettier: eslintPluginPrettier,
      promise: eslintPluginPromise,
      security: eslintPluginSecurity,
      sonarjs: eslintPluginSonarjs,
      turbo: eslintPluginTurbo,
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
        // Safelist for classes that are valid but not detected by the plugin
        // prose classes are from @tailwindcss/typography plugin (used for markdown content)
        // Custom component classes defined in globals.css @layer components
        safelist: [
          'prose',
          'prose-invert',
          'prose-slate',
          'prose-neutral',
          'prose-sm',
          'dark:prose-invert',
          'not-prose',
          'transition-colors-smooth',
          'card-gradient',
          'glow-effect',
        ],
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
      '@typescript-eslint/no-unsafe-assignment': 'off',
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
      // TypeScript rules from eslint-config-next/typescript (per Next.js docs for TypeScript projects)
      '@typescript-eslint/ban-ts-comment': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-array-constructor': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-duplicate-enum-values': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-empty-object-type': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-extra-non-null-assertion': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-misused-new': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-namespace': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-require-imports': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-this-alias': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-unnecessary-type-constraint': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-unsafe-declaration-merging': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-unsafe-function-type': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/no-unused-expressions': 'warn', // From eslint-config-next/typescript
      '@typescript-eslint/no-wrapper-object-types': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/prefer-as-const': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/prefer-namespace-keyword': 'error', // From eslint-config-next/typescript
      '@typescript-eslint/triple-slash-reference': 'error', // From eslint-config-next/typescript
      // Additional TypeScript ESLint rules for better type safety
      '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-return-this-type': 'warn',

      // ============================================
      // React Plugin Rules
      // Includes ALL recommended rules from eslint-plugin-react (as used by eslint-config-next/core-web-vitals)
      // ============================================
      // Core React rules (from eslint-config-next/core-web-vitals - ALL 22 rules)
      'react/display-name': 'off', // Too strict for HOCs, but included in Next.js config
      'react/jsx-key': 'error',
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error', // Missing: Added to match eslint-config-next
      'react/no-unescaped-entities': 'warn', // Missing: Added to match eslint-config-next (can be disabled per docs)
      'react/no-unsafe': 'warn', // Missing: Added to match eslint-config-next
      'react/require-render-return': 'error', // Missing: Added to match eslint-config-next
      // Additional React rules (beyond Next.js recommended)
      'react/jsx-no-leaked-render': 'error',
      'react/no-unstable-nested-components': 'error',
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
      // Note: Prettier runs as an ESLint rule and can conflict with import-x/order during --fix
      // Workaround: Run `pnpm prettier --write` after `pnpm lint:build --fix` to resolve conflicts
      'prettier/prettier': 'warn', // Run Prettier as an ESLint rule

      // ============================================
      // Perfectionist Rules (NEW - Sorting)
      // All auto-fixable with --fix
      // ============================================
      // DISABLED: perfectionist/sort-imports conflicts with import-x/order
      // Using import-x/order instead for import sorting
      'perfectionist/sort-imports': 'off', // Conflicts with import-x/order
      'perfectionist/sort-interfaces': ['warn', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-object-types': ['warn', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-union-types': ['warn', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-intersection-types': ['warn', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-enums': ['warn', { type: 'natural', order: 'asc' }],

      // ============================================
      // Logger & Error Instrumentation Rules
      // ============================================
      // NOTE: Based on packages/shared-runtime/src/logger/index.ts (single source of truth)
      // - Pino uses object-first API: logger.error({ err, ...context }, "message")
      // - Use logger.child({ operation, route }) for request-scoped context (NOT createLogger())
      // - Always normalize errors: const normalized = normalizeError(error, "fallback")
      // - Use 'err' key for errors (Pino standard)
      'architectural-rules/require-pino-object-first-api': 'error', // Enforce object-first (Pino native)
      'architectural-rules/require-logger-child-for-context': 'error', // Prevent createLogger() for request context
      'architectural-rules/require-normalize-error': 'error', // Consolidated: requires normalizeError + err key + object-first
      'architectural-rules/require-logging-context': 'error', // Requires logger.child({ operation, route })
      'architectural-rules/no-console-calls': 'error', // Consolidated: prevents console.* (with auto-fix)
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-custom-serializers': 'error',
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
      'architectural-rules/require-rpc-error-handling': 'error', // Consolidated: includes detect-missing-rpc-error-logging
      'architectural-rules/require-edge-logging-setup': 'error', // Consolidated: includes require-edge-logging, require-edge-init-request-logging, require-edge-trace-request-complete, detect-missing-edge-logging-setup
      'architectural-rules/require-async-for-await-in-iife': 'error', // New: Detects await in non-async IIFE (for config files)
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
      'unicorn/no-nested-ternary': 'error',
      // Performance rules (auto-fixable)
      'unicorn/prefer-set-has': 'warn', // Set.has vs Array.includes - auto-fixable
      'unicorn/prefer-array-find': 'error', // find vs filter[0]
      // Security rules
      'unicorn/no-array-callback-reference': 'error', // Prevents bugs
      // Code quality rules
      'unicorn/no-abusive-eslint-disable': 'error', // Enforce specific rule disabling
      'unicorn/expiring-todo-comments': 'warn', // Time-based TODOs
      'unicorn/prefer-top-level-await': 'error', // Modern async patterns

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
      'jsdoc/require-param': 'warn',
      'jsdoc/require-returns': 'warn',
      'jsdoc/require-description': 'warn',
      'jsdoc/check-types': 'warn',

      // ============================================
      // Import-X Plugin Rules (Enhanced)
      // ============================================
      // Note: import-x/order is auto-fixable and can conflict with Prettier during --fix
      // The conflict occurs because both try to format imports differently
      // Solution: Keep as 'error' for linting, but be aware of circular fixes during --fix
      // Consider running Prettier separately after ESLint --fix to resolve conflicts
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
      // DISABLED: Conflicts with exports-last when exports are mixed with imports
      // import-x/order already handles newlines between import groups
      'import-x/newline-after-import': 'off', // Conflicts with import-x/exports-last
      'import-x/no-named-as-default': 'warn',
      'import-x/consistent-type-specifier-style': ['error', 'prefer-inline'],
      'import-x/no-extraneous-dependencies': 'warn', // Detects unused dependencies
      // DISABLED: Conflicts with newline-after-import and can cause circular fixes
      // Prefer manual export organization or disable if causing issues
      'import-x/exports-last': 'off', // Conflicts with newline-after-import, causing circular fixes

      // ============================================
      // Security Plugin Rules
      // ============================================
      'security/detect-object-injection': 'warn', // SQL injection, XSS prevention
      'security/detect-eval-with-expression': 'error', // Unsafe eval
      'security/detect-non-literal-fs-filename': 'warn', // File system security
      'security/detect-unsafe-regex': 'error', // ReDoS prevention
      'security/detect-buffer-noassert': 'warn',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-new-buffer': 'warn',
      'security/detect-no-csrf-before-method-override': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'warn',

      // ============================================
      // SonarJS Plugin Rules (Code Quality)
      // ============================================
      'sonarjs/cognitive-complexity': ['warn', 15], // Function complexity threshold
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }], // Magic strings
      'sonarjs/no-small-switch': 'warn', // Switch statement optimization
      'sonarjs/prefer-immediate-return': 'warn', // Early returns
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',
      'sonarjs/prefer-while': 'warn',
      'sonarjs/no-collapsible-if': 'warn', // Simplify nested ifs
      'sonarjs/no-redundant-parentheses': 'warn',
      'sonarjs/expression-complexity': ['warn', { max: 4 }], // Expression complexity
      'sonarjs/max-switch-cases': ['warn', 30], // Switch statement size
      'sonarjs/no-nested-assignment': 'warn',
      'sonarjs/no-parameter-reassignment': 'warn',
      'sonarjs/no-unused-function-argument': 'warn',
      'sonarjs/no-function-declaration-in-block': 'warn',

      // ============================================
      // Promise Plugin Rules
      // ============================================
      'promise/always-return': 'error', // Promises must return
      'promise/catch-or-return': 'error', // Error handling
      'promise/no-callback-in-promise': 'warn',
      'promise/no-nesting': 'warn', // Avoid nested promises
      'promise/no-promise-in-callback': 'warn',
      'promise/no-return-in-finally': 'warn',
      'promise/param-names': 'error', // Consistent parameter names
      'promise/prefer-await-to-callbacks': 'warn',
      'promise/prefer-await-to-then': 'warn', // Modern async patterns
      'promise/valid-params': 'warn',

      // ============================================
      // Array-Func Plugin Rules (Performance)
      // ============================================
      // DISABLED: prefer-array-from can conflict with spread operators and cause circular fixes
      // Keep other array-func rules that don't conflict
      'array-func/prefer-array-from': 'off', // Conflicts with spread operators, causing circular fixes
      'array-func/avoid-reverse': 'warn', // Avoid reverse + map
      'array-func/prefer-flat-map': 'warn', // flatMap vs map + flat
      'array-func/prefer-flat': 'warn', // flat vs concat
      'array-func/from-map': 'warn', // Optimize map usage

      // ============================================
      // De Morgan Plugin Rules (Logical Consistency)
      // ============================================
      // DISABLED: Can conflict with @typescript-eslint/prefer-nullish-coalescing and
      // @typescript-eslint/prefer-optional-chain, causing circular fixes
      // These rules are valuable but need manual review to avoid conflicts
      'de-morgan/no-negated-conjunction': 'off', // Conflicts with TypeScript ESLint rules, causing circular fixes
      'de-morgan/no-negated-disjunction': 'off', // Conflicts with TypeScript ESLint rules, causing circular fixes

      // ============================================
      // Turbo Plugin Rules
      // ============================================
      'turbo/no-undeclared-env-vars': 'error', // Env var validation

      // ============================================
      // JSX A11y Rules (Enhanced)
      // ============================================
      'jsx-a11y/alt-text': 'warn', // Will be enabled for TSX files only
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',

      // ============================================
      // Custom Architectural Rules
      // ============================================
      // NOTE: require-request-id-in-logger was deleted - requestId removed from logger
      // Use require-logging-context instead (uses logger.child pattern)
      'architectural-rules/require-error-handler': 'error',
      'architectural-rules/require-error-logging-in-catch': 'error',
      // New AST-based validation rules (migrated from standalone validators)
      // NOTE: require-logging-context already defined above (consolidated with require-logger-bindings-for-context)
      'architectural-rules/require-error-handling-server-components': 'error',
      'architectural-rules/require-error-handling-client-components': 'error',
      'architectural-rules/require-cache-components': 'error',
      'architectural-rules/require-nextjs-async-params': 'error',
      'architectural-rules/require-connection-deferral': 'error',
      'architectural-rules/require-dangerously-set-inner-html-sanitization': 'error',
      'architectural-rules/require-nextjs-16-metadata-params': 'error',
      'architectural-rules/require-authentication-for-protected-resources': 'error',
      'architectural-rules/require-server-action-wrapper': 'error',
      'architectural-rules/require-nextresponse-await': 'error',
      'architectural-rules/require-mcp-tool-schema': 'error',
      'architectural-rules/require-mcp-tool-handler': 'error',
      'architectural-rules/no-console-calls': 'error',
      'architectural-rules/require-zod-schema-for-api-routes': 'error',
      'architectural-rules/require-normalize-error': 'error',
      'architectural-rules/require-env-var-validation': 'error',
      'architectural-rules/require-pino-object-first-api': 'error',
      'architectural-rules/require-logger-child-for-context': 'error',
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
      'architectural-rules/require-edge-logging-setup': 'error', // Consolidated edge logging rule

      // Next.js & React Server Components Rules
      // NOTE: require-proper-dynamic-exports was deleted - Cache Components makes it unnecessary
      'architectural-rules/no-mixed-server-client-patterns': 'error',
      // NOTE: require-suspense-for-async-components was deleted - rule was too simplistic (only checked for import, not actual usage)
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
      'architectural-rules/require-error-boundary-in-route-groups': 'error',
      'architectural-rules/no-localstorage-for-auth-data': 'error',
      'architectural-rules/require-child-logger-in-async-functions': 'warn',
      'architectural-rules/require-loading-tsx-for-async-pages': 'warn',
    },
  },
  // ============================================
  // TSX Files - React & A11y Rules
  // ============================================
  {
    files: ['**/*.tsx'],
    rules: {
      // ============================================
      // React Hooks Rules
      // Includes ALL recommended rules from eslint-plugin-react-hooks (as used by eslint-config-next)
      // ============================================
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Additional React Hooks rules from eslint-config-next/core-web-vitals
      'react-hooks/static-components': 'error',
      'react-hooks/use-memo': 'error',
      'react-hooks/component-hook-factories': 'error',
      'react-hooks/preserve-manual-memoization': 'error',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/immutability': 'error',
      'react-hooks/globals': 'error',
      'react-hooks/refs': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/error-boundaries': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/set-state-in-render': 'error',
      'react-hooks/unsupported-syntax': 'warn',
      'react-hooks/config': 'error',
      'react-hooks/gating': 'error',
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
  // Performance: Disable expensive type-checked rules for test files
  // ============================================
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      parserOptions: {
        // Performance: Disable type checking for test files (faster linting)
        // Test files don't need strict type checking - they're already validated by TypeScript compiler
        projectService: false,
      },
    },
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
      'architectural-rules/require-logging-context': 'error', // Use logger.child() instead of setBindings
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
    },
  },
  {
    files: ['../../packages/data-layer/src/services/**/*.ts'],
    rules: {
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-logging-context': 'error', // Use logger.child() instead of setBindings
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      // NOTE: detect-missing-rpc-error-logging consolidated into require-rpc-error-handling
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
    },
  },
  {
    files: ['../../packages/data-layer/src/utils/**/*.ts'],
    rules: {
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
    },
  },
  {
    files: ['../../packages/edge-runtime/src/**/*.ts'],
    rules: {
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
    },
  },
  {
    files: ['../../apps/web/src/app/**/*.tsx', '../../apps/web/src/app/**/*.ts'],
    rules: {
      'architectural-rules/require-logging-context': 'error', // Use logger.child() instead of setBindings
      'architectural-rules/require-error-logging-in-catch': 'error',
      'architectural-rules/require-section-logging': 'error',
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/prevent-raw-userid-logging': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
    },
  },
  {
    // Account layout has blocking operations properly wrapped in Suspense boundary
    // This is the correct Next.js pattern for authenticated layouts
    files: ['../../apps/web/src/app/account/layout.tsx'],
    rules: {
      'architectural-rules/no-blocking-operations-in-layouts': 'off',
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
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-logging-context': 'error', // Use logger.child() instead of setBindings
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
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
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
    },
  },
  {
    files: ['../../apps/edge/functions/**/*.ts'],
    rules: {
      'architectural-rules/require-edge-logging-setup': 'error', // Consolidated: includes require-edge-logging, require-edge-init-request-logging, require-edge-trace-request-complete, detect-missing-edge-logging-setup
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/prefer-logger-helpers-in-edge': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-logging-context': 'error', // Use logger.child() instead of setBindings (consolidated: includes require-logger-bindings-for-context)
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
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
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/prevent-raw-userid-logging': 'error',
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
    },
  },
  {
    files: ['../../packages/**/*.ts', '../../packages/**/*.tsx'],
    rules: {
      'architectural-rules/require-logging-context': 'error', // Use logger.child() instead of setBindings (consolidated: includes require-logger-bindings-for-context)
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
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
        // Performance: Disable type checking for public scripts (plain JS, no types)
        project: null,
        projectService: null,
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'off',
    },
  },
  // ============================================
  // JSON Files Configuration
  // ============================================
  {
    files: ['**/*.json'],
    ignores: ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'],
    plugins: {
      json: jsonPlugin,
    },
    language: 'json/json',
    rules: {
      // JSON linting rules (from @eslint/json)
      'json/no-duplicate-keys': 'error',
      'json/no-empty-keys': 'error',
      'json/no-irregular-whitespace': 'error',
      'json/no-trailing-commas': 'error',
      'json/no-unsafe-values': 'error',
      'json/valid-json-number': 'error',
    },
  },
  {
    files: ['**/*.jsonc', '.vscode/*.json'],
    plugins: {
      json: jsonPlugin,
    },
    language: 'json/jsonc',
    rules: {
      'json/no-duplicate-keys': 'error',
      'json/no-empty-keys': 'error',
      'json/no-irregular-whitespace': 'error',
      'json/no-trailing-commas': 'warn', // JSONC allows trailing commas
      'json/no-unsafe-values': 'error',
      'json/valid-json-number': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**', // From eslint-config-next/core-web-vitals
      'out/**', // From eslint-config-next/core-web-vitals
      'build/**', // From eslint-config-next/core-web-vitals
      'next-env.d.ts', // From eslint-config-next/core-web-vitals
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
      // Ignore lock files and package manager files
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
      'bun.lockb',
    ],
  }
);
