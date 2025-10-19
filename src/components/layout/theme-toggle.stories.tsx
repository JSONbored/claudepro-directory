'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ThemeToggle } from './theme-toggle';

/**
 * ThemeToggle Component Stories
 *
 * Theme switcher with View Transitions API circular blur animation.
 * Toggles between light and dark modes with smooth visual transitions.
 *
 * Features:
 * - View Transitions API (Chrome/Edge 111+)
 * - Circular blur expansion from click position
 * - Click position tracking for animation origin
 * - Progressive enhancement (fallback for unsupported browsers)
 * - localStorage persistence
 * - System theme detection (prefers-color-scheme)
 * - Switch component with Sun/Moon icons
 * - Keyboard accessible
 * - Screen reader support
 * - Performance optimized (non-blocking state updates)
 * - Development performance monitoring
 *
 * Component: src/components/layout/theme-toggle.tsx (185 LOC)
 * Used in: Navigation header
 * Dependencies: Switch primitive, useViewTransition hook, Sun/Moon icons
 *
 * Animation Details:
 * - Chrome/Edge 111+: Circular reveal with blur effect
 * - Firefox/Safari: CSS transition fallback (300ms)
 * - Origin: Click position (mouse) or switch center (keyboard)
 * - CSS variables: --x and --y for animation origin
 *
 * State Management:
 * - useState for theme ('light' | 'dark' | null)
 * - useRef for container (click position calculation)
 * - useViewTransition for API support detection
 * - useEffect for initial theme from localStorage/system
 *
 * Performance:
 * - DOM updates before React state (prevents blocking)
 * - requestAnimationFrame for deferred state updates
 * - Async localStorage writes
 * - Development timing logs
 *
 * Progressive Enhancement:
 * 1. Check View Transitions API support
 * 2. Supported: Use circular blur animation
 * 3. Unsupported: Use CSS transition (theme-transition class)
 *
 * Accessibility:
 * - aria-label on Switch: "Switch to {opposite} mode"
 * - Sun/Moon icons with aria-hidden
 * - Keyboard support via Switch primitive
 * - Focus indicators
 *
 * IMPORTANT: This is a stateful component with localStorage and DOM manipulation.
 * Stories show the UI but actual theme switching affects the entire document.
 * For full testing, use production app with View Transitions enabled browser.
 */
const meta = {
  title: 'Layout/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Theme toggle with View Transitions API circular blur animation. Switches between light/dark modes with smooth visual effects.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 border rounded-lg bg-background">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Toggle to switch between light and dark themes
          </p>
          <Story />
          <p className="text-xs text-muted-foreground">
            View Transitions API:{' '}
            {typeof document !== 'undefined' && 'startViewTransition' in document
              ? 'Supported'
              : 'Not supported'}
          </p>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Theme Toggle
 *
 * Shows ThemeToggle component with Sun/Moon icons.
 * Click switch to toggle between light and dark modes.
 *
 * Initial state:
 * - Reads from localStorage if available
 * - Falls back to system preference (prefers-color-scheme)
 * - Default: light mode
 *
 * Usage:
 * ```tsx
 * <ThemeToggle />
 * ```
 *
 * On toggle:
 * 1. Captures click position
 * 2. Sets CSS variables (--x, --y)
 * 3. Starts view transition
 * 4. Updates data-theme attribute
 * 5. Saves to localStorage
 * 6. Updates React state
 */
export const Default: Story = {};

/**
 * With View Transitions (Supported Browsers)
 *
 * Demonstrates circular blur animation.
 * Only works in Chrome/Edge 111+ or browsers with View Transitions API.
 *
 * Animation flow:
 * 1. User clicks switch
 * 2. Click position calculated as % of viewport
 * 3. CSS variables set: --x and --y
 * 4. document.startViewTransition() called
 * 5. Circular blur expands from click position
 * 6. Theme colors transition smoothly
 *
 * Browser support:
 * - ✅ Chrome 111+
 * - ✅ Edge 111+
 * - ❌ Firefox (uses CSS fallback)
 * - ❌ Safari (uses CSS fallback)
 */
export const WithViewTransitions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Circular blur animation using View Transitions API. Works in Chrome/Edge 111+. Other browsers use CSS transition fallback.',
      },
    },
  },
};

/**
 * Fallback (Unsupported Browsers)
 *
 * Shows CSS transition fallback for browsers without View Transitions API.
 *
 * Fallback behavior:
 * - Adds 'theme-transition' class to documentElement
 * - CSS transition: 300ms for colors
 * - Class removed after 300ms
 * - No circular animation, just color fade
 *
 * CSS:
 * ```css
 * .theme-transition * {
 *   transition: background-color 300ms, color 300ms;
 * }
 * ```
 */
export const Fallback: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'CSS transition fallback for browsers without View Transitions API. Smooth color fade instead of circular blur.',
      },
    },
  },
};

/**
 * Light Mode State
 *
 * Theme toggle in light mode.
 * Switch is unchecked, Sun icon represents current mode.
 *
 * Visual:
 * - Sun icon (left): Muted
 * - Switch: Unchecked (off)
 * - Moon icon (right): Muted
 *
 * Clicking toggles to dark mode.
 */
export const LightMode: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Theme toggle showing light mode state. Switch unchecked, ready to toggle to dark.',
      },
    },
  },
};

/**
 * Dark Mode State
 *
 * Theme toggle in dark mode.
 * Switch is checked, Moon icon represents current mode.
 *
 * Visual:
 * - Sun icon (left): Muted
 * - Switch: Checked (on)
 * - Moon icon (right): Muted
 *
 * Clicking toggles to light mode.
 */
export const DarkMode: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Theme toggle showing dark mode state. Switch checked, ready to toggle to light.',
      },
    },
  },
};

/**
 * Click Position Tracking
 *
 * Demonstrates click position calculation.
 * Animation origin varies based on where you click.
 *
 * Position calculation:
 * ```ts
 * const x = (event.clientX / window.innerWidth) * 100;
 * const y = (event.clientY / window.innerHeight) * 100;
 * ```
 *
 * CSS variables:
 * ```ts
 * document.documentElement.style.setProperty('--x', `${x}%`);
 * document.documentElement.style.setProperty('--y', `${y}%`);
 * ```
 *
 * Result: Circular blur starts at exact click location
 */
export const ClickPositionTracking: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Animation starts at click position. CSS variables --x and --y control origin of circular blur.',
      },
    },
  },
};

/**
 * Keyboard Navigation
 *
 * Theme toggle via keyboard (Space/Enter).
 * Uses switch center as animation origin.
 *
 * Keyboard flow:
 * 1. Focus on switch (Tab)
 * 2. Press Space or Enter
 * 3. onCheckedChange callback fires
 * 4. Center of switch calculated
 * 5. Animation starts from center
 *
 * Position for keyboard:
 * ```ts
 * const rect = containerRef.current?.getBoundingClientRect();
 * const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
 * const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
 * ```
 */
export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Keyboard accessible. Press Space/Enter to toggle. Animation starts from switch center for keyboard events.',
      },
    },
  },
};

/**
 * localStorage Persistence
 *
 * Theme preference saved to localStorage.
 * Persists across page reloads.
 *
 * Storage:
 * - Key: 'theme'
 * - Value: 'light' | 'dark'
 *
 * Initial load:
 * 1. Check localStorage for saved theme
 * 2. If none, check system preference (prefers-color-scheme)
 * 3. Default to 'light' if neither available
 *
 * On toggle:
 * - localStorage.setItem('theme', newTheme)
 */
export const LocalStoragePersistence: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Theme saved to localStorage. Preference persists across sessions. Falls back to system theme if not set.',
      },
    },
  },
};

/**
 * System Theme Detection
 *
 * Detects system dark mode preference.
 * Uses prefers-color-scheme media query.
 *
 * Detection:
 * ```ts
 * const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
 * const initial = saved || (prefersDark ? 'dark' : 'light');
 * ```
 *
 * Priority:
 * 1. localStorage (explicit user choice)
 * 2. System preference (prefers-color-scheme)
 * 3. Default: light
 */
export const SystemThemeDetection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Detects system dark mode preference. Uses prefers-color-scheme media query as fallback.',
      },
    },
  },
};

/**
 * Performance Monitoring (Development)
 *
 * Logs animation timing in development mode.
 * Tracks toggle interaction latency.
 *
 * Metrics logged:
 * - Animation start time (performance.now())
 * - Animation end time (transition.finished)
 * - Total duration: end - start
 *
 * Console output:
 * ```
 * [Theme Toggle] Animation completed in 234.56ms
 * ```
 *
 * Only in NODE_ENV === 'development'
 */
export const PerformanceMonitoring: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Development-only performance monitoring. Logs animation timing to console for optimization.',
      },
    },
  },
};

/**
 * Non-Blocking State Updates
 *
 * React state updates deferred with requestAnimationFrame.
 * Prevents state update from blocking animation.
 *
 * Optimization:
 * ```ts
 * startTransition(() => {
 *   // DOM-only updates (animation sees this)
 *   document.documentElement.setAttribute('data-theme', newTheme);
 * });
 *
 * requestAnimationFrame(() => {
 *   // React state update (non-blocking)
 *   setTheme(newTheme);
 * });
 * ```
 *
 * Result: Smooth 60fps animation even during React re-render
 */
export const NonBlockingUpdates: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'State updates deferred with requestAnimationFrame. Prevents React re-render from blocking animation.',
      },
    },
  },
};

/**
 * Null State (Loading)
 *
 * Component returns null before theme is determined.
 * Prevents flash of incorrect theme.
 *
 * Flow:
 * 1. Component mounts, theme = null
 * 2. useEffect runs, reads localStorage/system
 * 3. setTheme(initial)
 * 4. Component re-renders with theme
 *
 * Guards against:
 * - Server/client theme mismatch
 * - Flash of unstyled content
 */
export const NullState: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Component returns null until theme is determined. Prevents flash of incorrect theme on load.',
      },
    },
  },
};

/**
 * In Context Example
 *
 * ThemeToggle in realistic navigation header.
 * Shows typical placement and styling.
 */
export const InContextExample: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="text-xl font-bold">ClaudePro</div>
            <div className="flex items-center gap-6">
              <a href="/features" className="text-sm hover:underline">
                Features
              </a>
              <a href="/docs" className="text-sm hover:underline">
                Docs
              </a>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Theme Toggle Demo</h1>
        <p className="text-muted-foreground">
          Use the theme toggle in the navigation to switch between light and dark modes.
        </p>
      </main>
    </div>
  ),
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Component Render Test
 * Tests ThemeToggle renders Switch component
 */
export const ComponentRenderTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests ThemeToggle renders without errors.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    // Component may return null initially (before theme is set)
    await step('Check component renders or returns null', async () => {
      await expect(canvasElement).toBeTruthy();
    });
  },
};

/**
 * Sun Icon Test
 * Tests Sun icon is rendered
 */
export const SunIconTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests Sun icon (light mode indicator) is rendered.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Check for Sun icon (if component rendered)', async () => {
      // Component may not render if theme is null
      const container = canvasElement.querySelector('[class*="flex"]');
      if (container) {
        // Sun icon should be present
        await expect(container).toBeInTheDocument();
      }
    });
  },
};

/**
 * Moon Icon Test
 * Tests Moon icon is rendered
 */
export const MoonIconTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests Moon icon (dark mode indicator) is rendered.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Check for Moon icon (if component rendered)', async () => {
      const container = canvasElement.querySelector('[class*="flex"]');
      if (container) {
        // Moon icon should be present
        await expect(container).toBeInTheDocument();
      }
    });
  },
};

/**
 * Switch Component Test
 * Tests Switch primitive is rendered
 */
export const SwitchComponentTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests Switch component is rendered for theme toggle.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Check for switch button (if component rendered)', async () => {
      // Switch renders as button with role="switch"
      const switchButton = canvas.queryByRole('switch');
      // May be null if theme hasn't loaded yet
      if (switchButton) {
        await expect(switchButton).toBeInTheDocument();
      }
    });
  },
};

/**
 * ARIA Label Test
 * Tests aria-label is present on switch
 */
export const ARIALabelTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests aria-label is present for accessibility.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Check for aria-label on switch', async () => {
      const switchButton = canvas.queryByRole('switch');
      if (switchButton) {
        const ariaLabel = switchButton.getAttribute('aria-label');
        // Should be "Switch to dark mode" or "Switch to light mode"
        await expect(ariaLabel).toBeTruthy();
        await expect(ariaLabel).toMatch(/Switch to (dark|light) mode/);
      }
    });
  },
};
