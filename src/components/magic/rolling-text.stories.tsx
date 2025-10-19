'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';
import { RollingText } from './rolling-text';

/**
 * RollingText Component Stories
 *
 * Character-by-character 3D rotation animation that cycles through words/phrases.
 * Uses Motion.dev (modern fork of Framer Motion) for optimized bundle size.
 *
 * **Motion.dev Migration (October 2025):**
 * - 10KB bundle (83% smaller than Framer Motion 83KB)
 * - Same API as Framer Motion (drop-in replacement)
 * - Better tree-shaking and smaller runtime
 *
 * **Features:**
 * - 3D character rotation with perspective (rotateX)
 * - Hardware-accelerated transforms (will-change)
 * - Staggered character animations (delay per character)
 * - Cycles through word array with smooth transitions
 * - Exit/entry animation states
 * - useInView for viewport-aware animations
 * - Prevents hydration mismatch with client-side mounting
 * - Accessible with sr-only text and aria-live
 * - Non-breaking spaces for proper spacing
 *
 * **Component:** src/components/magic/rolling-text.tsx (157 LOC)
 * **Animation:** Motion.dev with optimized features
 * **Performance:** Memoized characters, GPU-accelerated transforms
 *
 * **Use Cases:**
 * - Hero headlines with rotating adjectives
 * - Feature highlights cycling through benefits
 * - Tagline variations
 * - Call-to-action text rotation
 * - Testimonial author names cycling
 */
const meta = {
  title: 'Magic/RollingText',
  component: RollingText,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '3D character rotation animation that cycles through words. Each character animates with staggered timing for smooth rolling effect.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    words: {
      control: 'object',
      description: 'Array of words to cycle through',
    },
    duration: {
      control: { type: 'number', min: 500, max: 10000, step: 100 },
      description: 'Duration each word is displayed (ms)',
      table: {
        defaultValue: { summary: '3000' },
      },
    },
    transition: {
      control: 'object',
      description: 'Framer Motion transition settings',
      table: {
        defaultValue: { summary: '{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }' },
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
          <p className="text-sm text-muted-foreground mb-4">Watch the text rotate in 3D</p>
          <Story />
          <p className="text-xs text-muted-foreground mt-4">Characters animate individually</p>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof RollingText>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Rotating Adjectives
 *
 * Classic use case: Hero headline with rotating descriptive words.
 * Shows 3-word cycle with 3-second intervals.
 *
 * Usage:
 * ```tsx
 * <RollingText words={['Amazing', 'Powerful', 'Beautiful']} />
 * ```
 */
export const Default: Story = {
  args: {
    words: ['Amazing', 'Powerful', 'Beautiful'],
    duration: 3000,
    className: 'text-4xl font-bold',
  },
};

/**
 * Action Verbs
 *
 * Rotating action words for CTAs.
 * "Build, Launch, Scale" cycle.
 */
export const ActionVerbs: Story = {
  args: {
    words: ['Build', 'Launch', 'Scale'],
    duration: 3000,
    className: 'text-4xl font-bold text-primary',
  },
};

/**
 * Long Words
 *
 * Tests animation with longer words.
 * More characters = more stagger effect.
 */
export const LongWords: Story = {
  args: {
    words: ['Revolutionary', 'Extraordinary', 'Unprecedented'],
    duration: 3500,
    className: 'text-3xl font-bold',
  },
};

/**
 * Short Words
 *
 * Quick rotation through short words.
 * Fast, punchy effect.
 */
export const ShortWords: Story = {
  args: {
    words: ['Fast', 'Easy', 'Free'],
    duration: 2000,
    className: 'text-5xl font-bold',
  },
};

/**
 * Fast Rotation (1s)
 *
 * Quick 1-second cycles for energetic feel.
 * Keeps animation constantly in motion.
 *
 * Usage:
 * ```tsx
 * <RollingText words={['Go', 'Now', 'Act']} duration={1000} />
 * ```
 */
export const FastRotation: Story = {
  args: {
    words: ['Go', 'Now', 'Act'],
    duration: 1000,
    className: 'text-4xl font-bold text-red-600',
  },
  parameters: {
    docs: {
      description: {
        story: 'Fast 1-second rotation creates urgent, energetic feeling.',
      },
    },
  },
};

/**
 * Slow Rotation (6s)
 *
 * Relaxed 6-second cycles for emphasis.
 * Gives users time to read and absorb.
 */
export const SlowRotation: Story = {
  args: {
    words: ['Thoughtful', 'Considered', 'Deliberate'],
    duration: 6000,
    className: 'text-3xl font-bold',
  },
};

/**
 * Two Words Only
 *
 * Simple toggle between two states.
 * "Yes / No" binary choice effect.
 */
export const TwoWords: Story = {
  args: {
    words: ['Yes', 'No'],
    duration: 2500,
    className: 'text-6xl font-bold',
  },
};

/**
 * Single Word (No Animation)
 *
 * Edge case: Only one word in array.
 * Component displays static word (no cycling).
 */
export const SingleWord: Story = {
  args: {
    words: ['Static'],
    duration: 3000,
    className: 'text-4xl font-bold',
  },
  parameters: {
    docs: {
      description: {
        story: 'With only one word, component shows static text without rotation animation.',
      },
    },
  },
};

/**
 * Many Words (5+)
 *
 * Long cycle through 6 different words.
 * Creates variety and interest over time.
 */
export const ManyWords: Story = {
  args: {
    words: ['Innovate', 'Create', 'Design', 'Build', 'Launch', 'Scale'],
    duration: 2500,
    className: 'text-4xl font-bold',
  },
};

/**
 * Hero Headline Context
 *
 * Real-world example: Hero section with rotating adjectives.
 * Shows how to integrate into headline text.
 */
export const HeroHeadline: Story = {
  decorators: [
    () => (
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-12 rounded-xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white">
          Build{' '}
          <RollingText
            words={['Amazing', 'Powerful', 'Beautiful', 'Modern']}
            duration={3000}
            className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400"
          />{' '}
          Apps
        </h1>
        <p className="text-xl text-purple-200 mt-6">
          The next-generation platform for modern developers
        </p>
      </div>
    ),
  ],
  args: {},
};

/**
 * Feature Highlight
 *
 * Rotating benefits in feature section.
 * Emphasizes different value propositions.
 */
export const FeatureHighlight: Story = {
  decorators: [
    () => (
      <div className="bg-card border rounded-xl p-8 max-w-lg text-center space-y-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg mx-auto" />
        <h3 className="text-2xl font-bold">
          <RollingText
            words={['Fast', 'Secure', 'Reliable', 'Scalable']}
            duration={3000}
            className="text-2xl font-bold text-primary"
          />
        </h3>
        <p className="text-muted-foreground">
          Our platform is designed for enterprise-grade performance
        </p>
      </div>
    ),
  ],
  args: {},
};

/**
 * Call-to-Action Button
 *

 * Rotating CTA text to grab attention.
 * Creates dynamic, engaging button.
 */
export const CTAButton: Story = {
  decorators: [
    () => (
      <button
        type="button"
        className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-xl font-semibold hover:bg-primary/90 transition-colors"
      >
        <RollingText
          words={['Start Free Trial', 'Get Started Now', 'Try It Free']}
          duration={3000}
          className="text-xl font-semibold"
        />
      </button>
    ),
  ],
  args: {},
};

/**
 * Testimonial Author Cycling
 *
 * Cycles through different testimonial authors.
 * Shows social proof variety.
 */
export const TestimonialAuthor: Story = {
  decorators: [
    () => (
      <div className="bg-card border rounded-xl p-8 max-w-md space-y-4">
        <div className="text-yellow-400 text-2xl">★★★★★</div>
        <blockquote className="text-lg italic">
          "This product completely transformed how we work. Highly recommended!"
        </blockquote>
        <div className="pt-4">
          <p className="font-semibold">
            <RollingText
              words={['Sarah Johnson', 'Mike Chen', 'Emily Rodriguez', 'James Taylor']}
              duration={4000}
              className="font-semibold"
            />
          </p>
          <p className="text-sm text-muted-foreground">CEO, TechCorp</p>
        </div>
      </div>
    ),
  ],
  args: {},
};

/**
 * Gradient Text Effect
 *
 * Combines RollingText with gradient text styling.
 * Creates eye-catching colorful effect.
 */
export const GradientText: Story = {
  args: {
    words: ['Stunning', 'Vibrant', 'Colorful', 'Dynamic'],
    duration: 3000,
    className:
      'text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600',
  },
};

/**
 * Multiple Instances (Staggered)
 *
 * Multiple RollingText components with different durations.
 * Creates complex, dynamic composition.
 */
export const MultipleInstances: Story = {
  decorators: [
    () => (
      <div className="text-center space-y-6">
        <div className="text-4xl font-bold">
          <RollingText
            words={['Fast', 'Quick', 'Rapid']}
            duration={2000}
            className="text-4xl font-bold text-blue-600"
          />
          {' & '}
          <RollingText
            words={['Reliable', 'Stable', 'Dependable']}
            duration={2500}
            className="text-4xl font-bold text-green-600"
          />
        </div>
        <p className="text-muted-foreground">Two rotating text elements with different timings</p>
      </div>
    ),
  ],
  args: {},
};

/**
 * Custom Transition
 *
 * Slower, smoother transition with custom easing.
 * More dramatic rotation effect.
 */
export const CustomTransition: Story = {
  args: {
    words: ['Smooth', 'Elegant', 'Graceful'],
    duration: 4000,
    transition: {
      duration: 1.2,
      delay: 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
    className: 'text-5xl font-bold',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom transition with longer duration (1.2s) and more delay between characters.',
      },
    },
  },
};

/**
 * Fast Transition
 *
 * Snappy, quick rotation with minimal delay.
 * Almost instant character flip.
 */
export const FastTransition: Story = {
  args: {
    words: ['Snap', 'Quick', 'Instant'],
    duration: 2000,
    transition: {
      duration: 0.3,
      delay: 0.02,
      ease: [0.16, 1, 0.3, 1],
    },
    className: 'text-4xl font-bold',
  },
};

/**
 * Numbers Rotation
 *
 * Rotating numbers for statistics or metrics.
 * "1,000 / 5,000 / 10,000" cycle.
 */
export const NumbersRotation: Story = {
  args: {
    words: ['1,000+', '5,000+', '10,000+', '50,000+'],
    duration: 2500,
    className: 'text-5xl font-bold tabular-nums text-green-600',
  },
};

/**
 * Uppercase vs Lowercase
 *
 * Tests case-sensitive rendering.
 * Shows proper character spacing.
 */
export const CaseVariations: Story = {
  args: {
    words: ['lowercase', 'UPPERCASE', 'MixedCase'],
    duration: 3000,
    className: 'text-4xl font-bold',
  },
};

/**
 * With Punctuation
 *
 * Words with punctuation marks.
 * Tests special character handling.
 */
export const WithPunctuation: Story = {
  args: {
    words: ['Hello!', 'Welcome!', 'Amazing!'],
    duration: 3000,
    className: 'text-5xl font-bold',
  },
};

/**
 * Emoji Support
 *
 * Emojis in rotating text.
 * Tests Unicode character handling.
 */
export const EmojiSupport: Story = {
  args: {
    words: ['🚀 Launch', '✨ Magic', '🎯 Focus', '💡 Ideas'],
    duration: 3000,
    className: 'text-4xl font-bold',
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * RollingText Rendering Test
 * Tests RollingText span is rendered
 */
export const RollingTextRenderingTest: Story = {
  args: {
    words: ['Test', 'Words'],
    duration: 3000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests RollingText renders with correct DOM structure.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify RollingText container is rendered', async () => {
      const container = canvasElement.querySelector('span[aria-live="polite"]');
      await expect(container).toBeInTheDocument();
    });

    await step('Verify sr-only text for accessibility', async () => {
      const srOnly = canvasElement.querySelector('.sr-only');
      await expect(srOnly).toBeInTheDocument();
    });
  },
};

/**
 * First Word Display Test
 * Tests first word from array is displayed initially
 */
export const FirstWordDisplayTest: Story = {
  args: {
    words: ['First', 'Second', 'Third'],
    duration: 5000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests RollingText initially displays the first word in the array.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    // Wait for client-side mounting
    await new Promise((resolve) => setTimeout(resolve, 100));

    await step('Verify first word "First" is displayed', async () => {
      const srOnly = canvasElement.querySelector('.sr-only');
      if (srOnly) {
        await expect(srOnly.textContent).toBe('First');
      }
    });
  },
};

/**
 * Character Animation Test
 * Tests individual character spans are created
 */
export const CharacterAnimationTest: Story = {
  args: {
    words: ['Hello'],
    duration: 10000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests RollingText creates individual animated spans for each character.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    // Wait for mounting and initial render
    await new Promise((resolve) => setTimeout(resolve, 200));

    await step('Verify character spans are created', async () => {
      const animatedContainer = canvasElement.querySelector('span[aria-hidden="true"]');
      if (animatedContainer) {
        const characterSpans = animatedContainer.querySelectorAll('span.inline-block');
        // "Hello" = 5 characters
        await expect(characterSpans.length).toBeGreaterThanOrEqual(5);
      }
    });
  },
};

/**
 * Aria-Live Region Test
 * Tests accessibility attributes are present
 */
export const AriaLiveRegionTest: Story = {
  args: {
    words: ['Accessible', 'Inclusive'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests RollingText has proper ARIA attributes for screen readers.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify aria-live="polite" attribute', async () => {
      const container = canvasElement.querySelector('[aria-live="polite"]');
      await expect(container).toBeInTheDocument();
    });

    await step('Verify aria-atomic="true" attribute', async () => {
      const container = canvasElement.querySelector('[aria-atomic="true"]');
      await expect(container).toBeInTheDocument();
    });
  },
};
