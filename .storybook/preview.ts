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

import type { Preview, Decorator } from '@storybook/react';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import React from 'react';

// Import Tailwind CSS styles
import '../src/app/globals.css';

// Import viewport presets from Storybook-specific export (avoids server dependencies)
import { VIEWPORT_PRESETS, BREAKPOINTS } from '../src/lib/ui-constants.storybook';

// Import PostCopyEmailProvider mock for unified-button stories
import { PostCopyEmailProvider } from '../src/components/infra/providers/post-copy-email-provider.mock';

/**
 * Theme Sync Component
 * Syncs Storybook toolbar theme selection with next-themes
 * Receives theme from decorator via props instead of useGlobals
 */
const ThemeSync = ({ children, theme: toolbarTheme }: { children: React.ReactNode; theme?: string }) => {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (toolbarTheme && (toolbarTheme === 'light' || toolbarTheme === 'dark' || toolbarTheme === 'system')) {
      setTheme(toolbarTheme);
    }
  }, [toolbarTheme, setTheme]);

  return React.createElement(React.Fragment, {}, children);
};

/**
 * Global Decorator: Wraps all stories with ThemeProvider and PostCopyEmailProvider
 * Provides dark mode support and email capture context to all components
 *
 * CRITICAL FIX: Changed attribute from 'class' to 'data-theme' to match production
 * Production uses: document.documentElement.setAttribute('data-theme', newTheme)
 * TailwindCSS reads: [data-theme='dark'] for dark mode styles
 *
 * Note: Using createElement instead of JSX for Storybook SWC compatibility
 */
const withThemeProvider: Decorator = (Story, context) => {
  // Get theme from story-level globals (overrides toolbar) or toolbar selection
  // Story-level globals take priority to allow theme variant stories to work
  const storyGlobals = context.parameters?.globals as { theme?: string } | undefined;
  const toolbarTheme = context.globals.theme as string | undefined;
  const effectiveTheme = storyGlobals?.theme || toolbarTheme;

  return React.createElement(
    ThemeProvider,
    {
      attribute: 'data-theme',       // FIXED: Was 'class', now matches production
      defaultTheme: effectiveTheme || 'dark',  // Use effective theme or default to dark
      enableSystem: true,
      disableTransitionOnChange: false,
      storageKey: 'storybook-theme',  // Separate from production storage
      forcedTheme: effectiveTheme,      // Force the theme (story-level or toolbar)
    },
    React.createElement(
      ThemeSync,
      { theme: effectiveTheme },
      React.createElement(
        PostCopyEmailProvider,
        {},
        React.createElement(
          'div',
          { className: 'min-h-screen bg-background text-foreground' },
          React.createElement(Story)
        )
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
        // Mobile Viewports (matching Storybook MINIMAL_VIEWPORTS standard)
        mobile1: {
          name: 'Small mobile',
          styles: {
            width: '320px',
            height: '568px',
          },
          type: 'mobile',
        },
        mobile2: {
          name: 'Large mobile',
          styles: {
            width: '414px',
            height: '896px',
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

        // Tablet Viewports (matching Storybook MINIMAL_VIEWPORTS standard)
        tablet: {
          name: 'Tablet',
          styles: {
            width: '834px',
            height: '1112px',
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
   *
   * FIXED: Changed defaultValue from 'light' to 'dark' to match site default
   * This toolbar now controls the ThemeProvider via ThemeSync component
   */
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'dark',  // FIXED: Match site default (dark mode)
      toolbar: {
        title: 'Theme',
        icon: 'circle',  // FIXED: dark icon for dark default
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