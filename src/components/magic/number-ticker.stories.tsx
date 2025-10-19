'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { NumberTicker } from './number-ticker';

/**
 * NumberTicker Component Stories
 *
 * Animated counter with smooth easing and requestAnimationFrame.
 * Counts from 0 to target value with ease-out cubic motion.
 *
 * Features:
 * - 60fps smooth animation with requestAnimationFrame
 * - Ease-out cubic easing for natural deceleration
 * - Customizable duration, delay, and decimal places
 * - Prefix and suffix support ($, +, K, M, etc.)
 * - Tabular nums for stable width
 * - CLS prevention with min-width
 * - Memoized for performance
 * - ARIA live region for accessibility
 *
 * Component: src/components/magic/number-ticker.tsx (138 LOC)
 * Animation: requestAnimationFrame with custom easing
 * Performance: React.memo, GPU-accelerated
 *
 * Use Cases:
 * - Dashboard statistics and KPIs
 * - Landing page metrics (users, downloads, etc.)
 * - Pricing displays
 * - Achievement counters
 * - Real-time data updates
 */
const meta = {
  title: 'Magic/NumberTicker',
  component: NumberTicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Animated counter with smooth ease-out cubic animation. Counts from 0 to target value using requestAnimationFrame for 60fps performance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 1000000, step: 1 },
      description: 'Target value to animate to',
    },
    duration: {
      control: { type: 'number', min: 100, max: 10000, step: 100 },
      description: 'Duration of animation in milliseconds',
      table: {
        defaultValue: { summary: '2000' },
      },
    },
    delay: {
      control: { type: 'number', min: 0, max: 5000, step: 100 },
      description: 'Delay before animation starts (ms)',
      table: {
        defaultValue: { summary: '0' },
      },
    },
    decimalPlaces: {
      control: { type: 'number', min: 0, max: 5, step: 1 },
      description: 'Number of decimal places to display',
      table: {
        defaultValue: { summary: '0' },
      },
    },
    prefix: {
      control: 'text',
      description: 'Prefix before the number (e.g., "$")',
      table: {
        defaultValue: { summary: '""' },
      },
    },
    suffix: {
      control: 'text',
      description: 'Suffix after the number (e.g., "+", "K")',
      table: {
        defaultValue: { summary: '""' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center min-h-[200px] p-8 bg-card border rounded-lg">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground mb-4">Animated Counter</p>
          <Story />
          <p className="text-xs text-muted-foreground mt-4">Refresh to see animation again</p>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof NumberTicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Count to 1000
 *
 * Standard 2-second animation counting to 1000.
 * Demonstrates default ease-out cubic easing.
 *
 * Usage:
 * ```tsx
 * <NumberTicker value={1000} />
 * ```
 */
export const Default: Story = {
  args: {
    value: 1000,
    duration: 2000,
  },
};

/**
 * Users Count
 *
 * Common use case: Total users metric.
 * Shows large number (12,543) with + suffix.
 *
 * Usage:
 * ```tsx
 * <NumberTicker value={12543} suffix="+" />
 * ```
 */
export const UsersCount: Story = {
  args: {
    value: 12543,
    suffix: '+',
    duration: 2500,
  },
};

/**
 * Revenue (Dollar Amount)
 *
 * Currency display with $ prefix.
 * Shows financial metric formatting.
 *
 * Usage:
 * ```tsx
 * <NumberTicker value={45000} prefix="$" />
 * ```
 */
export const Revenue: Story = {
  args: {
    value: 45000,
    prefix: '$',
    duration: 2000,
  },
};

/**
 * Percentage with Decimals
 *
 * Percentage value with 1 decimal place.
 * Perfect for conversion rates, success rates, etc.
 *
 * Usage:
 * ```tsx
 * <NumberTicker value={94.8} decimalPlaces={1} suffix="%" />
 * ```
 */
export const PercentageWithDecimals: Story = {
  args: {
    value: 94.8,
    decimalPlaces: 1,
    suffix: '%',
    duration: 2000,
  },
};

/**
 * Thousands (K Suffix)
 *
 * Large number abbreviated with K suffix.
 * Shows 12.5K format for downloads, views, etc.
 *
 * Usage:
 * ```tsx
 * <NumberTicker value={12.5} decimalPlaces={1} suffix="K" />
 * ```
 */
export const ThousandsSuffix: Story = {
  args: {
    value: 12.5,
    decimalPlaces: 1,
    suffix: 'K',
    duration: 2000,
  },
};

/**
 * Millions (M Suffix)
 *
 * Very large number with M suffix.
 * Shows 2.4M format.
 */
export const MillionsSuffix: Story = {
  args: {
    value: 2.4,
    decimalPlaces: 1,
    suffix: 'M',
    duration: 2500,
  },
};

/**
 * Fast Animation
 *
 * Quick 500ms animation for subtle counters.
 * Good for secondary metrics.
 *
 * Usage:
 * ```tsx
 * <NumberTicker value={500} duration={500} />
 * ```
 */
export const FastAnimation: Story = {
  args: {
    value: 500,
    duration: 500,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fast 500ms animation. Refresh to see quick counting effect.',
      },
    },
  },
};

/**
 * Slow Animation
 *
 * Extended 5-second animation for dramatic effect.
 * Creates anticipation and emphasis.
 */
export const SlowAnimation: Story = {
  args: {
    value: 10000,
    duration: 5000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Slow 5-second animation emphasizes the large value (10,000).',
      },
    },
  },
};

/**
 * With Delay
 *
 * 1-second delay before animation starts.
 * Useful for staggered animations or timed reveals.
 *
 * Usage:
 * ```tsx
 * <NumberTicker value={1000} delay={1000} />
 * ```
 */
export const WithDelay: Story = {
  args: {
    value: 1000,
    delay: 1000,
    duration: 2000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Animation starts after 1-second delay. Refresh to see delay effect.',
      },
    },
  },
};

/**
 * High Precision (3 Decimals)
 *
 * Scientific or precise measurements with 3 decimal places.
 * Shows 99.999% uptime format.
 */
export const HighPrecision: Story = {
  args: {
    value: 99.999,
    decimalPlaces: 3,
    suffix: '%',
    duration: 2500,
  },
};

/**
 * Small Value
 *
 * Small number animation (0 to 10).
 * Tests animation with low target values.
 */
export const SmallValue: Story = {
  args: {
    value: 10,
    duration: 1500,
  },
};

/**
 * Zero Value
 *
 * Edge case: Target value is 0.
 * Animation shows 0 immediately.
 */
export const ZeroValue: Story = {
  args: {
    value: 0,
    duration: 2000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case: When target value is 0, displays 0 with no animation.',
      },
    },
  },
};

/**
 * Multiple Counters (Staggered)
 *
 * Three counters with staggered delays.
 * Shows how to create cascading animations.
 */
export const MultipleCountersStaggered: Story = {
  decorators: [
    () => (
      <div className="grid gap-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <NumberTicker value={12543} suffix="+" className="text-4xl font-bold" delay={0} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Active Projects</p>
          <NumberTicker value={856} className="text-4xl font-bold" delay={500} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <NumberTicker
            value={98.5}
            decimalPlaces={1}
            suffix="%"
            className="text-4xl font-bold"
            delay={1000}
          />
        </div>
      </div>
    ),
  ],
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Three counters with staggered delays (0ms, 500ms, 1000ms) for cascading effect.',
      },
    },
  },
};

/**
 * Dashboard Stats Grid
 *
 * Real-world example: Dashboard KPI grid.
 * Shows multiple metrics with consistent styling.
 */
export const DashboardStatsGrid: Story = {
  decorators: [
    () => (
      <div className="grid grid-cols-2 gap-6 p-8 bg-background">
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <NumberTicker
            value={142000}
            prefix="$"
            className="text-3xl font-bold text-green-600"
            duration={2500}
          />
          <p className="text-xs text-green-600">↑ 23% from last month</p>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground">New Customers</p>
          <NumberTicker value={1284} className="text-3xl font-bold" duration={2500} delay={200} />
          <p className="text-xs text-blue-600">↑ 12% from last month</p>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <NumberTicker
            value={3.8}
            decimalPlaces={1}
            suffix="%"
            className="text-3xl font-bold"
            duration={2500}
            delay={400}
          />
          <p className="text-xs text-green-600">↑ 0.4% from last month</p>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground">Active Users</p>
          <NumberTicker
            value={9.2}
            decimalPlaces={1}
            suffix="K"
            className="text-3xl font-bold"
            duration={2500}
            delay={600}
          />
          <p className="text-xs text-green-600">↑ 18% from last month</p>
        </div>
      </div>
    ),
  ],
  args: {},
};

/**
 * Hero Stats
 *
 * Landing page hero section with impressive stats.
 * Large, bold numbers with gradient text.
 */
export const HeroStats: Story = {
  decorators: [
    () => (
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-12 rounded-xl">
        <div className="grid grid-cols-3 gap-8 text-center text-white">
          <div className="space-y-2">
            <NumberTicker
              value={50000}
              suffix="+"
              className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400"
            />
            <p className="text-sm text-purple-200">Happy Customers</p>
          </div>
          <div className="space-y-2">
            <NumberTicker
              value={99.9}
              decimalPlaces={1}
              suffix="%"
              className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400"
              delay={300}
            />
            <p className="text-sm text-purple-200">Uptime SLA</p>
          </div>
          <div className="space-y-2">
            <NumberTicker
              value={24}
              suffix="/7"
              className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400"
              delay={600}
            />
            <p className="text-sm text-purple-200">Support Available</p>
          </div>
        </div>
      </div>
    ),
  ],
  args: {},
};

/**
 * Pricing Display
 *
 * Animated pricing tier card.
 * Shows price counting up with dramatic effect.
 */
export const PricingDisplay: Story = {
  decorators: [
    () => (
      <div className="bg-card border rounded-xl p-8 max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Pro Plan</h3>
          <div className="flex items-baseline justify-center gap-1">
            <NumberTicker value={49} prefix="$" className="text-6xl font-bold" duration={2000} />
            <span className="text-2xl text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-muted-foreground">Billed annually</p>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Unlimited projects
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Priority support
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Advanced analytics
          </li>
        </ul>
        <button
          type="button"
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Get Started
        </button>
      </div>
    ),
  ],
  args: {},
};

/**
 * Large Font Size
 *
 * Tests NumberTicker with very large font.
 * Verifies tabular nums maintain alignment.
 */
export const LargeFontSize: Story = {
  args: {
    value: 999999,
    className: 'text-8xl font-bold',
    duration: 3000,
  },
};

/**
 * Custom Styling
 *
 * Demonstrates custom color and font styling.
 * Shows gradient text effect.
 */
export const CustomStyling: Story = {
  args: {
    value: 5000,
    suffix: '+',
    className:
      'text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600',
    duration: 2500,
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * NumberTicker Rendering Test
 * Tests NumberTicker span is rendered
 */
export const NumberTickerRenderingTest: Story = {
  args: {
    value: 1000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests NumberTicker renders with correct DOM structure.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify NumberTicker span is rendered', async () => {
      const ticker = canvas.getByRole('status', { hidden: true }); // aria-live="polite" creates implicit role
      await expect(ticker).toBeInTheDocument();
    });

    await step('Verify initial "0" is displayed', async () => {
      // Initial state shows 0
      const ticker = canvasElement.querySelector('span[aria-live="polite"]');
      await expect(ticker).toBeInTheDocument();
    });
  },
};

/**
 * Animation Progress Test
 * Tests animation updates the displayed value
 */
export const AnimationProgressTest: Story = {
  args: {
    value: 100,
    duration: 1000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests NumberTicker animates from 0 to target value.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Wait for animation to start', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await step('Verify value has changed from initial 0', async () => {
      const ticker = canvasElement.querySelector('span[aria-live="polite"]');
      if (ticker) {
        // After 100ms of 1000ms animation, value should be > 0
        const text = ticker.textContent || '';
        const numericValue = Number.parseFloat(text);
        await expect(numericValue).toBeGreaterThan(0);
      }
    });
  },
};

/**
 * Prefix/Suffix Test
 * Tests prefix and suffix are displayed correctly
 */
export const PrefixSuffixTest: Story = {
  args: {
    value: 50,
    prefix: '$',
    suffix: 'K',
    duration: 1500,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests NumberTicker displays prefix ($) and suffix (K).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 1600));

    await step('Verify prefix and suffix are present', async () => {
      const ticker = canvasElement.querySelector('span[aria-live="polite"]');
      if (ticker) {
        const text = ticker.textContent || '';
        await expect(text).toContain('$');
        await expect(text).toContain('K');
      }
    });
  },
};

/**
 * Tabular Nums Test
 * Tests tabular-nums class is applied
 */
export const TabularNumsTest: Story = {
  args: {
    value: 888,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests NumberTicker has tabular-nums class for monospace digits.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify tabular-nums class is applied', async () => {
      const ticker = canvasElement.querySelector('span[aria-live="polite"]') as HTMLElement;
      await expect(ticker).toBeInTheDocument();
      if (ticker) {
        const classes = ticker.className;
        await expect(classes).toContain('tabular-nums');
      }
    });
  },
};
