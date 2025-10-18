/**
 * Storybook Preview Configuration
 *
 * Global configuration for all stories including decorators, parameters, and viewports.
 * Wraps all stories with necessary providers (ThemeProvider, Next.js router mocks, etc.)
 *
 * **Features:**
 * - Dark mode support (next-themes)
 * - TailwindCSS styling
 * - Responsive viewport presets
 * - Accessibility testing
 * - Auto-generated controls
 * - Next.js router mocks (useRouter, usePathname, etc.)
 *
 * @see https://storybook.js.org/docs/nextjs/configure/overview#configure-story-rendering
 */

import type { Preview } from '@storybook/nextjs';
import { ThemeProvider } from 'next-themes';
import React from 'react';

// Import Tailwind CSS styles
import '../src/app/globals.css';

// Import viewport presets from Storybook-specific export (avoids server dependencies)
import { VIEWPORT_PRESETS, BREAKPOINTS } from '../src/lib/ui-constants.storybook';

// Import PostCopyEmailProvider mock for unified-button stories
import { PostCopyEmailProvider } from '../src/components/infra/providers/post-copy-email-provider.mock';

/**
 * Global Decorator: Wraps all stories with ThemeProvider and PostCopyEmailProvider
 * Provides dark mode support and email capture context to all components
 *
 * Note: Using createElement instead of JSX for Storybook SWC compatibility
 */
const withThemeProvider = (Story: React.ComponentType) => {
  return React.createElement(
    ThemeProvider,
    {
      attribute: 'class',
      defaultTheme: 'system',
      enableSystem: true,
      disableTransitionOnChange: false,
    },
    React.createElement(
      PostCopyEmailProvider,
      {},
      React.createElement(
        'div',
        { className: 'min-h-screen bg-background text-foreground' },
        React.createElement(Story)
      )
    )
  );
};

/**
 * Preview Configuration
 */
const preview: Preview = {
  /**
   * Global Decorators
   * Applied to all stories automatically
   */
  decorators: [withThemeProvider],

  /**
   * Global Parameters
   * Configure addon behavior
   */
  parameters: {
    /**
     * Next.js Configuration
     * CRITICAL: Enable App Router support for next/navigation hooks (useRouter, usePathname, etc.)
     * This allows components using Next.js 15 App Router features to work in Storybook
     * @see https://storybook.js.org/docs/get-started/frameworks/nextjs
     */
    nextjs: {
      appDirectory: true, // Required for App Router components
    },

    /**
     * HTML Head Configuration
     * Disable CSP for Storybook development environment
     */
    html: {
      head: {
        nonce: undefined, // Disable nonce-based CSP in Storybook
      },
    },

    /**
     * Controls Addon
     * Auto-generate controls from component props
     */
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true, // Expand controls by default
    },

    /**
     * Actions Addon
     * Log component events (onClick, onChange, etc.)
     *
     * NOTE: argTypesRegex removed per Storybook 9.x recommendation.
     * Use explicit actions with fn() from @storybook/test in stories instead.
     * @see https://storybook.js.org/docs/essentials/actions#via-storybooktest-fn-spy-function
     */
    actions: {},

    /**
     * Backgrounds Addon
     * Test components on different backgrounds
     */
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0a0a0a',
        },
        {
          name: 'gray',
          value: '#f5f5f5',
        },
      ],
    },

    /**
     * Viewport Addon
     * CRITICAL: Responsive viewport switching using BREAKPOINTS from ui-constants.ts
     *
     * This ensures Storybook uses the SAME breakpoints as:
     * - Playwright tests (config/tools/playwright.config.ts)
     * - Tailwind CSS (md:, lg:, xl: prefixes)
     * - Visual regression tests
     *
     * Single source of truth: src/lib/ui-constants.ts
     */
    viewport: {
      viewports: {
        // Mobile Viewports
        mobile: {
          name: `Mobile (${BREAKPOINTS.mobile}px)`,
          styles: {
            width: `${BREAKPOINTS.mobile}px`,
            height: '568px',
          },
          type: 'mobile',
        },
        iphoneSE: {
          name: 'iPhone SE',
          styles: {
            width: `${VIEWPORT_PRESETS.iphoneSE.width}px`,
            height: `${VIEWPORT_PRESETS.iphoneSE.height}px`,
          },
          type: 'mobile',
        },
        iphone13: {
          name: 'iPhone 13',
          styles: {
            width: `${VIEWPORT_PRESETS.iphone13.width}px`,
            height: `${VIEWPORT_PRESETS.iphone13.height}px`,
          },
          type: 'mobile',
        },

        // Tablet Viewports
        tablet: {
          name: `Tablet (${BREAKPOINTS.tablet}px)`,
          styles: {
            width: `${BREAKPOINTS.tablet}px`,
            height: '1024px',
          },
          type: 'tablet',
        },
        ipadPortrait: {
          name: 'iPad Portrait',
          styles: {
            width: `${VIEWPORT_PRESETS.ipadPortrait.width}px`,
            height: `${VIEWPORT_PRESETS.ipadPortrait.height}px`,
          },
          type: 'tablet',
        },
        ipadLandscape: {
          name: 'iPad Landscape',
          styles: {
            width: `${VIEWPORT_PRESETS.ipadLandscape.width}px`,
            height: `${VIEWPORT_PRESETS.ipadLandscape.height}px`,
          },
          type: 'tablet',
        },

        // Desktop Viewports
        desktop: {
          name: `Desktop (${BREAKPOINTS.desktop}px)`,
          styles: {
            width: `${BREAKPOINTS.desktop}px`,
            height: '768px',
          },
          type: 'desktop',
        },
        wide: {
          name: `Wide (${BREAKPOINTS.wide}px)`,
          styles: {
            width: `${BREAKPOINTS.wide}px`,
            height: '800px',
          },
          type: 'desktop',
        },
        laptop: {
          name: 'Laptop (13")',
          styles: {
            width: `${VIEWPORT_PRESETS.laptop.width}px`,
            height: `${VIEWPORT_PRESETS.laptop.height}px`,
          },
          type: 'desktop',
        },

        // Large Desktop Viewports
        ultra: {
          name: `Ultra (${BREAKPOINTS.ultra}px)`,
          styles: {
            width: `${BREAKPOINTS.ultra}px`,
            height: '1080px',
          },
          type: 'desktop',
        },
        desktop1080p: {
          name: '1080p Monitor',
          styles: {
            width: `${VIEWPORT_PRESETS.desktop1080p.width}px`,
            height: `${VIEWPORT_PRESETS.desktop1080p.height}px`,
          },
          type: 'desktop',
        },
      },
      // Default to desktop viewport
      defaultViewport: 'desktop',
    },

    /**
     * Layout Addon
     * Configure story layout
     */
    layout: 'padded', // Options: 'centered' | 'fullscreen' | 'padded'

    /**
     * Docs Addon
     * Auto-documentation configuration
     */
    docs: {
      toc: true, // Show table of contents
    },
  },

  /**
   * Global Types
   * Define toolbar items
   */
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
          { value: 'system', icon: 'graphbar', title: 'System' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;