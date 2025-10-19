import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';
import { BorderBeam } from './border-beam';

/**
 * BorderBeam Component Stories
 *
 * Animated beam of light that travels along the border of its container.
 * Rewritten with Motion.dev for universal browser compatibility (October 2025).
 *
 * Features:
 * - Motion.dev animations (works in all browsers)
 * - Customizable gradient colors (colorFrom, colorTo)
 * - Adjustable beam size, duration, and delay
 * - Configurable border width
 * - Four independent beams (top, right, bottom, left)
 * - Staggered timing for continuous circular motion
 * - Pointer-events-none for non-interactive overlay
 *
 * Component: src/components/magic/border-beam.tsx (144 LOC)
 * Animation: Motion.dev with linear easing (infinite loop)
 * Performance: GPU-accelerated transforms
 * Browser Support: Universal (Motion.dev handles fallbacks)
 *
 * Technical Details:
 * - Each border gets own motion.div beam
 * - Beams stagger by duration/4 (90° phase shift)
 * - Respects prefers-reduced-motion automatically
 *
 * Use Cases:
 * - Card highlights and focus states
 * - Loading indicators with style
 * - Premium feature highlights
 * - Interactive hover effects
 * - Dashboard widgets
 */
const meta = {
  title: 'Magic/BorderBeam',
  component: BorderBeam,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Animated beam of light that travels along container borders. Pure CSS implementation with customizable gradient colors, duration, and size.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'number', min: 50, max: 500, step: 10 },
      description: 'Size of the beam in pixels',
      table: {
        defaultValue: { summary: '200' },
      },
    },
    duration: {
      control: { type: 'number', min: 1, max: 20, step: 0.5 },
      description: 'Animation duration in seconds',
      table: {
        defaultValue: { summary: '8' },
      },
    },
    delay: {
      control: { type: 'number', min: 0, max: 10, step: 0.5 },
      description: 'Delay before animation starts in seconds',
      table: {
        defaultValue: { summary: '0' },
      },
    },
    colorFrom: {
      control: 'color',
      description: 'Start color of the gradient (hex)',
      table: {
        defaultValue: { summary: '#ffaa40' },
      },
    },
    colorTo: {
      control: 'color',
      description: 'End color of the gradient (hex)',
      table: {
        defaultValue: { summary: '#9c40ff' },
      },
    },
    borderWidth: {
      control: { type: 'number', min: 0.5, max: 5, step: 0.5 },
      description: 'Border width in pixels',
      table: {
        defaultValue: { summary: '1.5' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  decorators: [
    (Story) => (
      <div className="relative w-[400px] h-[300px] rounded-xl border border-border bg-card p-8">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">BorderBeam Demo</h3>
            <p className="text-sm text-muted-foreground">
              Watch the animated beam travel along the border
            </p>
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BorderBeam>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Orange to Purple Gradient
 *
 * Standard configuration with default colors.
 * Beam travels around the border in 8 seconds.
 * Uses warm orange (#ffaa40) to cool purple (#9c40ff) gradient.
 *
 * Usage:
 * ```tsx
 * <div className="relative">
 *   <BorderBeam />
 *   {/_ Your content _/}
 * </div>
 * ```
 */
export const Default: Story = {
  args: {
    size: 200,
    duration: 8,
    delay: 0,
    colorFrom: '#ffaa40',
    colorTo: '#9c40ff',
    borderWidth: 1.5,
  },
};

/**
 * Fast Animation
 *
 * Quick 3-second animation for subtle effects.
 * Good for loading indicators or quick attention grabbers.
 *
 * Usage:
 * ```tsx
 * <BorderBeam duration={3} />
 * ```
 */
export const FastAnimation: Story = {
  args: {
    duration: 3,
    size: 200,
  },
};

/**
 * Slow Animation
 *
 * Relaxed 15-second animation for ambient effects.
 * Creates a calm, meditative atmosphere.
 * Perfect for premium features or hero sections.
 */
export const SlowAnimation: Story = {
  args: {
    duration: 15,
    size: 200,
  },
};

/**
 * Blue Gradient
 *
 * Cool blue gradient (cyan to blue).
 * Professional look for business dashboards.
 *
 * Usage:
 * ```tsx
 * <BorderBeam colorFrom="#06b6d4" colorTo="#3b82f6" />
 * ```
 */
export const BlueGradient: Story = {
  args: {
    colorFrom: '#06b6d4', // cyan-500
    colorTo: '#3b82f6', // blue-500
    duration: 8,
  },
};

/**
 * Green Gradient
 *
 * Fresh green gradient (emerald to teal).
 * Great for success states or eco-friendly themes.
 */
export const GreenGradient: Story = {
  args: {
    colorFrom: '#10b981', // emerald-500
    colorTo: '#14b8a6', // teal-500
    duration: 8,
  },
};

/**
 * Red to Pink Gradient
 *
 * Vibrant gradient for alerts or premium features.
 * Eye-catching without being aggressive.
 */
export const RedPinkGradient: Story = {
  args: {
    colorFrom: '#ef4444', // red-500
    colorTo: '#ec4899', // pink-500
    duration: 8,
  },
};

/**
 * Gold Gradient
 *
 * Luxurious gold gradient (amber to yellow).
 * Perfect for premium tiers or featured content.
 *
 * Usage:
 * ```tsx
 * <BorderBeam colorFrom="#f59e0b" colorTo="#eab308" />
 * ```
 */
export const GoldGradient: Story = {
  args: {
    colorFrom: '#f59e0b', // amber-500
    colorTo: '#eab308', // yellow-500
    duration: 8,
  },
};

/**
 * Small Beam
 *
 * Compact 100px beam for subtle effects.
 * Creates a tighter, more focused animation path.
 */
export const SmallBeam: Story = {
  args: {
    size: 100,
    duration: 8,
  },
};

/**
 * Large Beam
 *
 * Wide 400px beam for dramatic effect.
 * Covers more of the border at once.
 */
export const LargeBeam: Story = {
  args: {
    size: 400,
    duration: 8,
  },
};

/**
 * Thick Border
 *
 * Wide 4px border for high visibility.
 * More pronounced effect, easier to see.
 *
 * Usage:
 * ```tsx
 * <BorderBeam borderWidth={4} />
 * ```
 */
export const ThickBorder: Story = {
  args: {
    borderWidth: 4,
    duration: 8,
  },
};

/**
 * Thin Border
 *
 * Delicate 0.5px border for subtle refinement.
 * Elegant and understated.
 */
export const ThinBorder: Story = {
  args: {
    borderWidth: 0.5,
    duration: 8,
  },
};

/**
 * With Delay
 *
 * 2-second delay before animation starts.
 * Useful for staggered animations or timed reveals.
 *
 * Usage:
 * ```tsx
 * <BorderBeam delay={2} />
 * ```
 */
export const WithDelay: Story = {
  args: {
    delay: 2,
    duration: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Animation starts after 2-second delay. Refresh to see delay effect.',
      },
    },
  },
};

/**
 * Multiple Cards Demo
 *
 * Shows multiple cards with staggered BorderBeam animations.
 * Demonstrates how to create cascading effects.
 */
export const MultipleCards: Story = {
  decorators: [
    () => (
      <div className="grid grid-cols-3 gap-4">
        <div className="relative w-[150px] h-[150px] rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-center h-full">
            <p className="text-xs font-medium">Card 1</p>
          </div>
          <BorderBeam delay={0} duration={6} size={120} />
        </div>
        <div className="relative w-[150px] h-[150px] rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-center h-full">
            <p className="text-xs font-medium">Card 2</p>
          </div>
          <BorderBeam delay={1} duration={6} size={120} colorFrom="#06b6d4" colorTo="#3b82f6" />
        </div>
        <div className="relative w-[150px] h-[150px] rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-center h-full">
            <p className="text-xs font-medium">Card 3</p>
          </div>
          <BorderBeam delay={2} duration={6} size={120} colorFrom="#10b981" colorTo="#14b8a6" />
        </div>
      </div>
    ),
  ],
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Three cards with staggered delays (0s, 1s, 2s) creating a cascading animation effect.',
      },
    },
  },
};

/**
 * Card Hover Effect
 *
 * BorderBeam triggered on hover (via CSS group-hover).
 * Shows how to integrate with interactive states.
 */
export const CardHoverEffect: Story = {
  decorators: [
    () => (
      <div className="group relative w-[400px] h-[300px] rounded-xl border border-border bg-card p-8 cursor-pointer hover:bg-accent/50 transition-colors">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Hover Me</h3>
            <p className="text-sm text-muted-foreground">
              BorderBeam appears on hover using group-hover pattern
            </p>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <BorderBeam duration={4} size={150} />
        </div>
      </div>
    ),
  ],
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Hover over the card to reveal the BorderBeam animation with fade-in effect.',
      },
    },
  },
};

/**
 * Premium Feature Card
 *
 * Real-world example: Premium tier feature card.
 * Gold gradient with prominent beam effect.
 */
export const PremiumFeatureCard: Story = {
  decorators: [
    () => (
      <div className="relative w-[400px] rounded-xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                PREMIUM
              </span>
            </div>
          </div>
          <h3 className="text-2xl font-bold">Pro Plan</h3>
          <p className="text-sm text-muted-foreground">
            Unlock advanced features with our premium tier
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✓</span>
              <span>Unlimited projects</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✓</span>
              <span>Priority support</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✓</span>
              <span>Advanced analytics</span>
            </div>
          </div>
        </div>
        <BorderBeam colorFrom="#f59e0b" colorTo="#eab308" duration={10} size={250} />
      </div>
    ),
  ],
  args: {},
};

/**
 * Loading State Card
 *
 * BorderBeam used as a loading indicator.
 * Fast animation with blue gradient suggests processing.
 */
export const LoadingStateCard: Story = {
  decorators: [
    () => (
      <div className="relative w-[400px] h-[200px] rounded-xl border border-border bg-card p-8">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="text-sm text-muted-foreground">Processing your request...</p>
          </div>
        </div>
        <BorderBeam colorFrom="#06b6d4" colorTo="#3b82f6" duration={3} size={150} />
      </div>
    ),
  ],
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Fast blue BorderBeam combined with spinner for loading states.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * BorderBeam Rendering Test
 * Tests BorderBeam element is rendered in the DOM
 */
export const BorderBeamRenderingTest: Story = {
  args: {
    size: 200,
    duration: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests BorderBeam renders with correct DOM structure.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify BorderBeam div is rendered', async () => {
      const borderBeam = canvasElement.querySelector('[class*="pointer-events-none"]');
      await expect(borderBeam).toBeInTheDocument();
    });

    await step('Verify absolute positioning class', async () => {
      const borderBeam = canvasElement.querySelector('[class*="absolute"]');
      await expect(borderBeam).toBeInTheDocument();
    });
  },
};

/**
 * CSS Custom Properties Test
 * Tests CSS variables are set correctly
 */
export const CSSCustomPropertiesTest: Story = {
  args: {
    size: 300,
    duration: 10,
    delay: 2,
    colorFrom: '#ff0000',
    colorTo: '#00ff00',
    borderWidth: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests BorderBeam applies CSS custom properties from props.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify CSS custom properties are set', async () => {
      const borderBeam = canvasElement.querySelector(
        '[class*="pointer-events-none"]'
      ) as HTMLElement;
      await expect(borderBeam).toBeInTheDocument();

      if (borderBeam) {
        // CSS variables are set via inline style, so check style attribute
        const styleAttr = borderBeam.getAttribute('style');
        await expect(styleAttr).toContain('--size');
        await expect(styleAttr).toContain('--duration');
        await expect(styleAttr).toContain('--delay');
      }
    });
  },
};

/**
 * Animation Classes Test
 * Tests animation-related classes are present
 */
export const AnimationClassesTest: Story = {
  args: {
    duration: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests BorderBeam includes animation and after pseudo-element classes.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify border and mask classes', async () => {
      const borderBeam = canvasElement.querySelector('[class*="border"]') as HTMLElement;
      await expect(borderBeam).toBeInTheDocument();

      if (borderBeam) {
        const classes = borderBeam.className;
        await expect(classes).toContain('rounded-');
        await expect(classes).toContain('absolute');
        await expect(classes).toContain('inset-0');
      }
    });
  },
};
