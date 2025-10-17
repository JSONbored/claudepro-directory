/**
 * Storybook Configuration for claudepro-directory
 *
 * Production-ready Storybook setup for Next.js 15 with React 19.
 * Configured for responsive component development and visual testing.
 *
 * **Features:**
 * - Next.js 15 framework integration
 * - TypeScript support
 * - Viewport addon for responsive testing
 * - Accessibility testing (a11y)
 * - Visual regression with Chromatic
 * - Dark mode support
 *
 * @see https://storybook.js.org/docs/nextjs
 */

import type { StorybookConfig } from '@storybook/nextjs-vite';
import path from 'path';

const config: StorybookConfig = {
  /**
   * Story file patterns
   * Searches src/ for all .stories.tsx files (MDX pattern removed - not used)
   */
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  /**
   * Storybook Addons
   * Essential addons for responsive component development
   *
   * NOTE: In Storybook 9.x with Vite, essentials (controls, actions, backgrounds, etc.)
   * and viewport functionality are bundled into @storybook/nextjs-vite - no separate
   * packages needed. Configure viewports in preview.ts via parameters.viewport.
   *
   * IMPORTANT: @storybook/addon-vitest is NOT included due to known React module
   * resolution conflicts with Next.js 15. Use Playwright or Vitest separately.
   * @see https://github.com/storybookjs/storybook/issues/31760
   */
  addons: [
    '@chromatic-com/storybook', // Visual regression testing
    '@storybook/addon-docs', // Auto-generated documentation
    '@storybook/addon-a11y', // Accessibility testing
    '@storybook/addon-links', // Story navigation
  ],

  /**
   * Framework Configuration
   * Next.js 15 with Vite builder (10-20x faster than Webpack)
   */
  framework: {
    name: '@storybook/nextjs-vite',
    options: {
      // Vite builder is faster and simpler than Webpack
      // Next.js features are auto-mocked (router, navigation, etc.)
    },
  },

  /**
   * Static Assets
   * Serve public directory for images, fonts, etc.
   */
  staticDirs: ['../public'],

  /**
   * TypeScript Configuration
   * Ensures type-checking in stories
   */
  typescript: {
    check: true, // Enable type-checking
    reactDocgen: 'react-docgen-typescript', // Auto-generate prop tables
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => {
        // Exclude props from node_modules
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules');
        }
        return true;
      },
    },
  },

  /**
   * Core Configuration
   * Performance and build optimizations
   */
  core: {
    disableTelemetry: true, // Privacy: Disable telemetry
  },

  /**
   * Vite Configuration
   * Path aliases and subpath imports resolution for mocking server actions
   */
  viteFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../'),
        // FIX: @storybook/nextjs-vite@9.1.12 packaging bug
        // Package declares "./config/preview" export but dist/config/ doesn't exist
        // Workaround: Redirect broken import to actual file location
        '@storybook/nextjs-vite/dist/config/preview.mjs': path.resolve(
          __dirname,
          '../node_modules/@storybook/nextjs-vite/dist/preview.mjs'
        ),

        // ========================================
        // STORYBOOK MOCK INFRASTRUCTURE
        // ========================================
        // Replace production server-only modules with browser-compatible mocks.
        // This allows components to render in Storybook without Node.js dependencies.
        //
        // Pattern: Each .mock.ts file exports the same interface as production
        // but with no-op/passthrough implementations.
        //
        // Maintainability: Add new mocks here as needed. Keep alphabetical.
        // ========================================

        // Server Actions (Next.js 'use server')
        '#lib/actions/user': path.resolve(__dirname, '../src/lib/actions/user.actions.mock.ts'),
        '#lib/actions/track-view': path.resolve(__dirname, '../src/lib/actions/track-view.mock.ts'),
        '#lib/actions/business': path.resolve(__dirname, '../src/lib/actions/business.actions.mock.ts'),

        // Server Infrastructure (Node.js modules)
        // CRITICAL: Must include ALL path variants (absolute, @/ alias, with/without .ts)
        // Vite resolves @/ first, then looks for the file, so we need absolute paths too
        '@/src/lib/cache.server': path.resolve(__dirname, '../src/lib/cache.server.mock.ts'),
        '@/src/lib/cache.server.ts': path.resolve(__dirname, '../src/lib/cache.server.mock.ts'),
        [path.resolve(__dirname, '../src/lib/cache.server')]: path.resolve(__dirname, '../src/lib/cache.server.mock.ts'),
        [path.resolve(__dirname, '../src/lib/cache.server.ts')]: path.resolve(__dirname, '../src/lib/cache.server.mock.ts'),

        '@/src/lib/security/validators': path.resolve(__dirname, '../src/lib/security/validators.mock.ts'),
        '@/src/lib/security/validators.ts': path.resolve(__dirname, '../src/lib/security/validators.mock.ts'),
        [path.resolve(__dirname, '../src/lib/security/validators')]: path.resolve(__dirname, '../src/lib/security/validators.mock.ts'),
        [path.resolve(__dirname, '../src/lib/security/validators.ts')]: path.resolve(__dirname, '../src/lib/security/validators.mock.ts'),
      };

      // CRITICAL: Enable Node.js subpath imports with 'storybook' condition
      // This resolves #lib/actions/* imports to .mock.ts files in Storybook
      // while using real .ts files in production (configured in package.json "imports")
      // @see package.json "imports" field for conditional mapping
      config.resolve.conditions = ['storybook', ...(config.resolve.conditions || [])];
    }
    return config;
  },

  /**
   * Documentation
   * Auto-generate docs pages for components
   */
  docs: {
    autodocs: 'tag', // Generate docs for stories with 'tags: ['autodocs']'
  },
};

export default config;