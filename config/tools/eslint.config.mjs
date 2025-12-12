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
      // AUTOFIX RULES SUMMARY
      // ============================================
      // 52 safe autofix rules are enabled across multiple plugins:
      // - Custom Architectural Rules: 11 rules (import paths, quotes, sorting, type assertions, await logError, prefer structuredClone, JSDoc returns, JSDoc params)
      // - TypeScript ESLint: 10 rules (type definitions, assertions, nullish coalescing, optional chaining)
      // - ESLint Plugin Unicorn: 12 rules (export-from, array-find, replace-all, at(), starts-ends-with, math-trunc, etc.)
      // - ESLint Plugin Perfectionist: 13 rules (sorting interfaces, objects, unions, JSX props, switch-case, classes, etc.)
      //   NOTE: sort-array-includes is disabled (crashes ESLint - plugin bug)
      // - ESLint Plugin Import-X: 3 rules (duplicates, path segments, type specifier style)
      // - ESLint Plugin React: 4 rules (self-closing, curly braces, boolean values, sort props)
      // - ESLint Plugin Vitest: 9 rules (test/it consistency, prefer-to-be, toHaveLength, spy-on, comparison-matcher, etc.)
      // - Core ESLint: 4 rules (no-var, prefer-const, object-shorthand, arrow-body-style)
      // All rules are 100% TypeScript-safe and verified to not break compilation.
      // Rules marked with @autofix Safe in JSDoc comments are safe for automatic fixing.
      // ============================================
      // TypeScript ESLint Rules (Enhanced)
      // ============================================
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // ============================================
      // Core ESLint Rules with Safe Autofixes
      // ============================================
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces use of `let`/`const` instead of `var`.
       * @autofix Safe - Only changes keyword, no semantic difference.
       * @example `var x = 1` → `const x = 1` (if never reassigned) or `let x = 1`
       */
      'no-var': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces use of `const` when variable is never reassigned.
       * @autofix Safe - Only changes `let` to `const` when safe.
       * @example `let x = 1` → `const x = 1` (if x never reassigned)
       */
      'prefer-const': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces object shorthand syntax.
       * @autofix Safe - Only changes object syntax, no semantic difference.
       * @param {'always'|'never'} preference - 'always' enforces shorthand
       * @example `{ x: x, y: y }` → `{ x, y }`
       */
      'object-shorthand': ['warn', 'always'],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces consistent arrow function body style.
       * @autofix Safe - Only changes function syntax, no semantic difference.
       * @param {'always'|'as-needed'|'never'} preference - 'as-needed' removes braces when possible
       * @example `() => { return 5 }` → `() => 5` (if as-needed)
       */
      'arrow-body-style': ['warn', 'as-needed'],
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
      '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }], // ✅ AUTOFIX: Safe - syntax-only change (enabled for consistency)
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
      '@typescript-eslint/no-unnecessary-type-arguments': 'warn', // ✅ AUTOFIX: Safe - removes unnecessary type args
      '@typescript-eslint/prefer-function-type': 'warn', // ✅ AUTOFIX: Safe - converts interface to type
      '@typescript-eslint/prefer-readonly': 'warn', // ✅ AUTOFIX: Safe - adds readonly when appropriate
      '@typescript-eslint/prefer-return-this-type': 'warn',
      // Additional TypeScript ESLint stylistic rules with safe autofixes
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // ✅ AUTOFIX: Safe - converts type to interface
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }], // ✅ AUTOFIX: Safe - converts angle bracket to 'as'
      '@typescript-eslint/no-inferrable-types': 'error', // ✅ AUTOFIX: Safe - removes redundant type annotations
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'], // ✅ AUTOFIX: Safe - converts index signature to Record

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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces self-closing tags for empty components.
       * @autofix Safe - Only changes JSX syntax, no semantic difference.
       * @example `<div></div>` → `<div />` (when empty)
       */
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }], // ✅ AUTOFIX: Safe - removes/adds unnecessary braces
      'react/jsx-boolean-value': ['warn', 'never'], // ✅ AUTOFIX: Safe - converts prop={true} to prop
      'react/jsx-sort-props': ['warn', { ignoreCase: true, callbacksLast: true, shorthandFirst: true }], // ✅ AUTOFIX: Safe - reordering only
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
      // Perfectionist Rules (Sorting - All Auto-fixable)
      // ============================================
      // DISABLED: perfectionist/sort-imports conflicts with import-x/order
      // Using import-x/order instead for import sorting
      'perfectionist/sort-imports': 'off', // Conflicts with import-x/order
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts interface properties alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `interface Foo { c: number; a: string; b: boolean }` → sorted alphabetically
       */
      'perfectionist/sort-interfaces': ['warn', { type: 'natural', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts object type properties alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `type Foo = { c: number; a: string }` → sorted alphabetically
       */
      'perfectionist/sort-object-types': ['warn', { type: 'natural', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts union type members alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `type Foo = 'c' | 'a' | 'b'` → `type Foo = 'a' | 'b' | 'c'`
       */
      'perfectionist/sort-union-types': ['warn', { type: 'natural', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts intersection type members alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `type Foo = C & A & B` → `type Foo = A & B & C`
       */
      'perfectionist/sort-intersection-types': ['warn', { type: 'natural', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts enum members alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `enum Foo { C, A, B }` → `enum Foo { A, B, C }`
       */
      'perfectionist/sort-enums': ['warn', { type: 'natural', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts `extends`/`implements` clauses alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `class Foo implements C, A, B` → `class Foo implements A, B, C`
       */
      'perfectionist/sort-heritage-clauses': ['warn', { type: 'alphabetical', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts JSX props alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `<Component c="1" a="2" b="3" />` → `<Component a="2" b="3" c="1" />`
       */
      'perfectionist/sort-jsx-props': ['warn', { type: 'alphabetical', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts object properties alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `{ c: 1, a: 2, b: 3 }` → `{ a: 2, b: 3, c: 1 }`
       */
      'perfectionist/sort-objects': ['warn', { type: 'alphabetical', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts named imports within import statement alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @note Different from import-x/order (which sorts import statements, not named imports)
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `import { c, a, b } from './foo'` → `import { a, b, c } from './foo'`
       */
      'perfectionist/sort-named-imports': ['warn', { type: 'alphabetical', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts named exports alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `export { c, a, b }` → `export { a, b, c }`
       */
      'perfectionist/sort-named-exports': ['warn', { type: 'alphabetical', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts variable declarations alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `const c = 1; const a = 2; const b = 3;` → sorted alphabetically
       */
      'perfectionist/sort-variable-declarations': ['warn', { type: 'alphabetical', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description DISABLED: This rule crashes ESLint in some cases (plugin bug).
       * Sorts array elements used with `.includes()` method.
       * @autofix DISABLED - Plugin has bugs causing ESLint crashes
       * @example `if (['c', 'a', 'b'].includes(x))` → `if (['a', 'b', 'c'].includes(x))`
       */
      'perfectionist/sort-array-includes': 'off', // DISABLED: Crashes ESLint (plugin bug)
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts switch case statements alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example `switch (x) { case 'c': case 'a': case 'b': }` → sorted alphabetically
       */
      'perfectionist/sort-switch-case': ['warn', { type: 'alphabetical', order: 'asc' }],
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts class members (properties, methods, etc.) alphabetically.
       * @autofix Safe - Reordering only, no semantic changes.
       * @param {Object} options - Configuration options
       * @param {'alphabetical'|'natural'|'line-length'} options.type - Sorting method
       * @param {'asc'|'desc'} options.order - Sort direction
       * @example Class members sorted alphabetically within their groups
       */
      'perfectionist/sort-classes': ['warn', { type: 'alphabetical', order: 'asc' }],

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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Requires await for logError() calls in async functions.
       * @autofix Safe - Adds 'await' keyword before logError() calls in async functions. 100% safe because logError is confirmed to be async (returns Promise<void>), and we verify we're in an async function before applying the fix.
       * @example `logError('error', {}, err)` → `await logError('error', {}, err)` (in async functions)
       */
      'architectural-rules/require-await-log-error': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Auto-fix: Replace JSON.parse(JSON.stringify()) with structuredClone().
       * @autofix Safe - 100% safe replacement, structuredClone is the modern standard for deep cloning and handles more cases than JSON round-trip.
       * @example `JSON.parse(JSON.stringify(obj))` → `structuredClone(obj)`
       */
      'architectural-rules/autofix-prefer-structured-clone': 'error',
      'architectural-rules/enforce-log-context-naming': 'error',
      'architectural-rules/require-custom-serializers': 'error',
      'architectural-rules/require-module-in-bindings': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/detect-outdated-logging-patterns': 'error',
      'architectural-rules/detect-missing-logging-in-api-routes': 'error',

      // ============================================
      // Unicorn Plugin Rules (Enhanced)
      // ============================================
      'unicorn/consistent-function-scoping': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/filename-case': ['warn', { case: 'kebabCase' }],
      'unicorn/prevent-abbreviations': 'off', // Too strict for our codebase
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Consolidates re-exports using `export ... from` syntax.
       * @autofix Safe - Syntax-only change, no semantic difference.
       * @example `export { foo } from './bar'` (consolidates multiple re-exports)
       */
      'unicorn/prefer-export-from': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/expiring-todo-comments': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description DISABLED: This rule does NOT autofix in TypeScript files (plugin limitation).
       * The plugin's autofix only works in JavaScript files. Since we require 100% reliable autofixes,
       * this rule is disabled. Manual fixes required if needed.
       * @autofix NOT SUPPORTED in TypeScript - Plugin limitation
       * @example `str.charCodeAt(0)` → `str.codePointAt(0)` (manual fix required)
       */
      'unicorn/prefer-code-point': 'off', // DISABLED: Does not autofix in TS files - not 100% reliable
      'unicorn/prefer-type-error': 'error',
      'unicorn/no-null': 'off', // Too strict - we use null in many places
      'unicorn/prefer-global-this': 'warn',
      'unicorn/no-nested-ternary': 'error',
      'unicorn/prefer-native-coercion-functions': 'warn',
      'unicorn/explicit-length-check': 'warn',
      'unicorn/no-array-method-this-argument': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `find()` over `filter()[0]` for better performance.
       * @autofix Safe - More efficient, same result.
       * @example `array.filter(x => x > 5)[0]` → `array.find(x => x > 5)`
       */
      'unicorn/prefer-array-find': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers ES modules over CommonJS.
       * @autofix Safe - Only fixes in ES module contexts.
       * @example `module.exports = foo` → `export default foo`
       */
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-top-level-await': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Removes unnecessary `undefined` in destructuring defaults.
       * @autofix Safe - Only removes when truly unnecessary.
       * @example `const { x = undefined } = obj` → `const { x } = obj`
       */
      'unicorn/no-useless-undefined': 'error',
      // Enhanced Unicorn rules
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `replaceAll()` over regex with global flag.
       * @autofix Safe - Only fixes when regex is simple string replacement.
       * @example `str.replace(/foo/g, 'bar')` → `str.replaceAll('foo', 'bar')`
       */
      'unicorn/prefer-string-replace-all': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `.at()` for negative array indices.
       * @autofix Safe - Equivalent functionality, more readable.
       * @example `array[array.length - 1]` → `array.at(-1)`
       */
      'unicorn/prefer-at': 'warn',
      'unicorn/prefer-object-from-entries': 'warn',
      'unicorn/no-negated-condition': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Requires `new` keyword when creating Error instances.
       * @autofix Safe - Only adds `new` when missing.
       * @example `throw Error('msg')` → `throw new Error('msg')`
       */
      'unicorn/throw-new-error': 'error',
      // Disabled: Auto-fix conflicts with Prettier (Prettier removes parentheses that this rule wants to add)
      // Developers should manually refactor nested ternaries to if/else statements for better readability
      'unicorn/no-nested-ternary': 'error',
      // Performance rules (auto-fixable)
      'unicorn/prefer-set-has': 'warn', // Set.has vs Array.includes - auto-fixable
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `startsWith()`/`endsWith()` over regex for simple prefix/suffix checks.
       * @autofix Safe - More readable and performant, equivalent functionality.
       * @example `/^foo/.test(str)` → `str.startsWith('foo')`
       * @example `/bar$/.test(str)` → `str.endsWith('bar')`
       */
      'unicorn/prefer-string-starts-ends-with': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `Math.trunc()` over `~~x` or `x | 0` for integer truncation.
       * @autofix Safe - More explicit and readable, equivalent functionality.
       * @example `~~x` → `Math.trunc(x)`
       * @example `x | 0` → `Math.trunc(x)`
       */
      'unicorn/prefer-math-trunc': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `Number.NaN`, `Number.Infinity` over global `NaN`, `Infinity`.
       * @autofix Safe - More explicit, equivalent functionality.
       * @example `NaN` → `Number.NaN`
       * @example `Infinity` → `Number.Infinity`
       */
      'unicorn/prefer-number-properties': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `Date.now()` over `new Date().getTime()` or `+new Date()`.
       * @autofix Safe - More efficient and readable, equivalent functionality.
       * @example `new Date().getTime()` → `Date.now()`
       * @example `+new Date()` → `Date.now()`
       */
      'unicorn/prefer-date-now': 'warn',
      // NOTE: unicorn/prefer-array-find already defined above (line 622), removed duplicate
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Consolidates duplicate imports from the same module.
       * @autofix Safe - Only merges imports from same module.
       * @example Multiple `import { x } from './foo'` statements → single merged import
       */
      'import-x/no-duplicates': 'error',
      'import-x/no-unresolved': 'off', // TypeScript handles this
      // Enhanced Import-X rules
      'import-x/no-self-import': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Removes unnecessary path segments (./, ../).
       * @autofix Safe - Only simplifies paths, no breaking changes.
       * @example `import { x } from '././foo'` → `import { x } from './foo'`
       */
      'import-x/no-useless-path-segments': 'warn',
      'import-x/first': 'error',
      // DISABLED: Conflicts with exports-last when exports are mixed with imports
      // import-x/order already handles newlines between import groups
      'import-x/newline-after-import': 'off', // Conflicts with import-x/exports-last
      'import-x/no-named-as-default': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces consistent type import style (inline vs separate).
       * @autofix Safe - Only changes import syntax.
       * @param {'prefer-inline'|'prefer-top-level'} preference - 'prefer-inline' uses `import { type X }`
       * @example `import type { Foo } from './bar'` → `import { type Foo } from './bar'` (if prefer-inline)
       */
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
      // ============================================
      // Custom Architectural Autofix Rules
      // ============================================
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Auto-fix: Add missing JSDoc @returns tag to functions with explicit return types.
       * @autofix Safe - Only autofixes when return type is explicitly annotated in function signature (100% safe, no inference needed).
       * @example `function fn(): number { return 5; }` with JSDoc comment → adds `@returns {number}`
       */
      'architectural-rules/autofix-jsdoc-returns': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Auto-fix: Add missing JSDoc @param tags to functions with explicit parameter types.
       * @autofix Safe - Only autofixes when parameter types are explicitly annotated in function signature (100% safe, no inference needed).
       * @example `function fn(param: string) {}` with JSDoc comment → adds `@param {string} param`
       */
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Auto-fix: Add missing JSDoc @param tags or add types to existing @param tags for functions with explicit parameter types.
       * @autofix Safe - Only autofixes when parameter types are explicitly annotated in function signature (100% safe, no inference needed).
       * @example `function fn(param: string) {}` with JSDoc comment → adds `@param {string} param` or adds type to existing `@param param`
       */
      'architectural-rules/autofix-jsdoc-param': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description DISABLED AUTOFIX - Too risky: Removing async could break Promise return type inference.
       * Reports unnecessary async but does not autofix.
       */
      'architectural-rules/autofix-remove-unnecessary-async': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description DISABLED: Conflicts with unicorn/no-nested-ternary which has its own autofix.
       * The unicorn rule provides better autofix (refactors to if/else when possible).
       * Reports nested ternaries but does not autofix to avoid conflicts.
       */
      'architectural-rules/autofix-nested-ternary-parentheses': 'off', // DISABLED: Conflicts with unicorn/no-nested-ternary autofix
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Standardizes import path quotes (double → single).
       * @autofix Safe - Simple text replacement, cannot break TypeScript.
       * @example `import { x } from "path"` → `import { x } from 'path'`
       */
      'architectural-rules/autofix-fix-import-quotes': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description DISABLED: Conflicts with Prettier's `semi: true` setting.
       * Prettier correctly handles semicolons based on config, so this rule is unnecessary.
       * @autofix DISABLED - Prettier handles semicolons correctly
       * @note Prettier will autofix semicolon issues via `prettier/prettier` rule
       */
      'architectural-rules/autofix-remove-trailing-semicolons-in-type-imports': 'off', // DISABLED: Conflicts with Prettier
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Sorts import specifiers alphabetically within import statements.
       * @autofix Safe - Reordering only, no semantic changes.
       * @example `import { c, a, b } from './foo'` → `import { a, b, c } from './foo'`
       */
      'architectural-rules/autofix-sort-import-specifiers': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Converts angle bracket type assertions to 'as' syntax.
       * @autofix Safe - Syntax-only change, no semantic difference.
       * @example `<Type>value` → `value as Type`
       */
      'architectural-rules/autofix-consistent-type-assertions': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Removes unnecessary type assertions (`as any`, `as unknown`).
       * @autofix Safe - Only removes when TypeScript confirms it's unnecessary.
       * @example `const x = y as any` → `const x = y` (when y type is already correct)
       */
      'architectural-rules/autofix-remove-unnecessary-type-assertions': 'warn',

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
      'architectural-rules/no-direct-rpc-calls-in-api-routes': 'error',

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
        // Enable type checking for test files to support type-checked rules
        // Some rules like await-thenable require type information
        projectService: {
          allowDefaultProject: ['*.config.{js,mjs,cjs}', '*.setup.{ts,js}'],
        },
        tsconfigRootDir: import.meta.dirname,
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `toBe()` over `toEqual()` for primitive values.
       * @autofix Safe - Only fixes when semantically equivalent (primitives).
       * @example `expect(x).toEqual(5)` → `expect(x).toBe(5)` (when x is primitive)
       */
      'vitest/prefer-to-be': 'warn',
      'vitest/require-top-level-describe': 'warn',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-duplicate-hooks': 'error',
      'vitest/valid-title': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `toHaveLength()` over `.length` assertions.
       * @autofix Safe - Equivalent assertion, more readable.
       * @example `expect(arr.length).toBe(5)` → `expect(arr).toHaveLength(5)`
       */
      'vitest/prefer-to-have-length': 'warn',
      'vitest/prefer-to-be-truthy': 'warn',
      'vitest/prefer-to-be-falsy': 'warn',
      'vitest/no-standalone-expect': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `vi.spyOn()` over direct property assignment for mocks.
       * @autofix Safe - Better mock management, equivalent functionality.
       * @example `obj.prop = vi.fn()` → `vi.spyOn(obj, 'prop')`
       */
      'vitest/prefer-spy-on': 'warn',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers comparison matchers over manual comparisons.
       * @autofix Safe - More semantic, equivalent functionality.
       * @note IMPORTANT: Only works with `.toBe(true)`, NOT `.toBeTruthy()` or `.toBe(false)`
       * @example `expect(x > 5).toBe(true)` → `expect(x).toBeGreaterThan(5)`
       * @example `expect(x < 7).toBe(true)` → `expect(x).toBeLessThan(7)`
       */
      'vitest/prefer-comparison-matcher': 'warn', // Only autofixes .toBe(true), not .toBeTruthy()
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Prefers `await expect(promise).resolves` over `expect(await promise)`.
       * @autofix Safe - Better promise assertion pattern, equivalent functionality.
       * @note Works with both `.toBe(true)` and `.toBeTruthy()`
       * @example `expect(await promise).toBe(true)` → `await expect(promise).resolves.toBe(true)`
       * @example `expect(await promise).toBeTruthy()` → `await expect(promise).resolves.toBeTruthy()`
       */
      'vitest/prefer-expect-resolves': 'warn',
      // Additional Vitest autofix rules
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces consistent test/it usage in test files.
       * @autofix Safe - Only changes function name, no semantic difference.
       * @param {Object} options - Configuration options
       * @param {'it'|'test'} options.fn - Preferred function name
       * @example `it('test', ...)` → `test('test', ...)` (if fn: 'test')
       */
      'vitest/consistent-test-it': ['warn', { fn: 'test' }],
      // NOTE: vitest/consistent-vitest-vi rule does not exist in eslint-plugin-vitest
      // Removed - this rule is not available in the plugin
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Removes `.only()` from focused tests.
       * @autofix Safe - Only removes `.only()`, no other changes.
       * @example `test.only('test', ...)` → `test('test', ...)`
       */
      'vitest/no-focused-tests': 'error',
      // Relax some rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      // Disable rules that conflict with Vitest autofix rules
      '@typescript-eslint/no-unnecessary-condition': 'off', // Conflicts with prefer-comparison-matcher
      'unicorn/no-immediate-mutation': 'off', // Conflicts with prefer-spy-on
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      // NOTE: detect-missing-rpc-error-logging consolidated into require-rpc-error-handling
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/prevent-raw-userid-logging': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/detect-outdated-logging-patterns': 'error',
    },
  },
  {
    files: ['../../apps/web/src/app/api/**/*.ts'],
    rules: {
      'architectural-rules/require-error-handler': 'error',
      'architectural-rules/no-direct-auth-getuser': 'error',
      'architectural-rules/no-data-layer-violations': 'error',
      'architectural-rules/no-direct-rpc-calls-in-api-routes': 'error',
      'architectural-rules/require-pino-object-first-api': 'error', // Pino uses object-first API
      'architectural-rules/require-await-log-error': 'error',
      'architectural-rules/require-normalize-error': 'error', // Consolidated rule
      'architectural-rules/require-logging-context': 'error', // Use logger.child() instead of setBindings
      'architectural-rules/require-module-in-bindings': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
      'architectural-rules/detect-missing-logging-in-api-routes': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/no-console-calls': 'error', // Consolidated rule with auto-fix
      'architectural-rules/detect-missing-error-logging-in-functions': 'error',
      'architectural-rules/detect-incomplete-log-context': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
      'architectural-rules/prefer-barrel-exports-for-logging': 'error',
      'architectural-rules/prevent-raw-userid-logging': 'error',
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Detects and fixes outdated logging import paths.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/request-context.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
      /**
       * @type {import('eslint').Linter.RuleEntry}
       * @description Enforces barrel export usage for logging utilities.
       * @autofix Safe - Simple import path replacement, TypeScript-compatible.
       * @example `'packages/web-runtime/src/utils/logger.ts'` → `'@heyclaude/web-runtime/logging/server'`
       */
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
