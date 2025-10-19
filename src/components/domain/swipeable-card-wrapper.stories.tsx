import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, within } from 'storybook/test';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { SwipeableCardWrapper } from './swipeable-card-wrapper';

/**
 * SwipeableCardWrapper Storybook Stories
 *
 * Mobile gesture wrapper for cards using Motion.dev drag utilities.
 * Enables quick actions via swipe gestures on touch devices.
 *
 * **Features (BONUS-3 - October 2025):**
 * - Swipe right → Copy/Share action (green indicator)
 * - Swipe left → Bookmark/Save action (blue indicator)
 * - Auto-detects mobile (touch capability + screen width < 1024px)
 * - Visual feedback during drag (color indicators at edges)
 * - Spring physics for natural feel (stiffness 400, damping 30)
 * - Respects prefers-reduced-motion
 * - 100px minimum threshold to trigger action
 *
 * **Architecture:**
 * - Uses Motion.dev `drag` prop with directional constraints
 * - Wraps any card component as children
 * - Progressive enhancement (desktop: no gestures, mobile: gestures)
 * - Accessibility: Gesture actions MUST have button alternatives
 *
 * **Bundle Impact:** ~2KB gzipped
 *
 * **Usage:**
 * ```tsx
 * <SwipeableCardWrapper
 *   onSwipeRight={() => copyToClipboard()}
 *   onSwipeLeft={() => addBookmark()}
 *   enableGestures={true}
 * >
 *   <Card>...</Card>
 * </SwipeableCardWrapper>
 * ```
 */

const meta = {
  title: 'Cards/SwipeableCardWrapper',
  component: SwipeableCardWrapper,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'mobile1', // Show mobile by default (gestures are mobile-only)
    },
    docs: {
      description: {
        component: `
**Swipeable Card Wrapper** - Mobile gesture support for cards.

**Gestures:**
- **Swipe Right (→)**: Primary action (copy, share)
- **Swipe Left (←)**: Secondary action (bookmark, save)

**Detection:**
- Auto-detects touch capability via \`'ontouchstart' in window\`
- Checks screen width < 1024px for mobile layout
- Desktop: Wrapper passes through with no gestures

**Visual Feedback:**
- **Right swipe**: Green background gradient appears from left edge
- **Left swipe**: Blue background gradient appears from right edge
- **Drag amount**: Opacity increases with swipe distance

**Performance:**
- GPU-accelerated transforms (translateX)
- Optimized with Motion.dev (10KB vs Framer Motion 83KB)
- Spring rebound on release for natural feel

**Accessibility:**
- Gesture-only actions MUST have button alternatives for desktop/keyboard users
- Respects prefers-reduced-motion (disables gestures)
- Touch targets meet 44x44px minimum (WCAG 2.1 AA)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    enableGestures: {
      control: 'boolean',
      description: 'Enable swipe gestures (auto-detects mobile)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    onSwipeRight: {
      action: 'swipeRight',
      description: 'Callback for swipe right gesture (copy/share)',
      table: {
        type: { summary: '(() => void | Promise<void>) | undefined' },
      },
    },
    onSwipeLeft: {
      action: 'swipeLeft',
      description: 'Callback for swipe left gesture (bookmark/save)',
      table: {
        type: { summary: '(() => void | Promise<void>) | undefined' },
      },
    },
    children: {
      control: false,
      description: 'Card component to wrap with swipe functionality',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
  },
} satisfies Meta<typeof SwipeableCardWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ==============================================================================
 * BASIC EXAMPLES
 * ==============================================================================
 */

/**
 * Default (Gestures Disabled)
 * Wrapper with gestures disabled - card behaves normally
 */
export const Default: Story = {
  args: {
    enableGestures: false,
    children: (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Standard Card</CardTitle>
          <CardDescription>Gestures disabled - card behaves normally</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No swipe gestures active. This is the default behavior for desktop or when
            enableGestures=false.
          </p>
        </CardContent>
      </Card>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state with gestures disabled. Card behaves like a normal card without swipe functionality.',
      },
    },
  },
};

/**
 * Gestures Enabled
 * Wrapper with swipe gestures active (mobile only)
 */
export const GesturesEnabled: Story = {
  args: {
    enableGestures: true,
    onSwipeRight: fn(), // Mock callback
    onSwipeLeft: fn(), // Mock callback
    children: (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Swipeable Card</CardTitle>
          <CardDescription>Try swiping left or right on mobile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-green-500/20 text-green-600">
                →
              </span>
              <span>Swipe right: Copy URL</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/20 text-blue-600">
                ←
              </span>
              <span>Swipe left: Bookmark</span>
            </p>
          </div>
        </CardContent>
      </Card>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: `
Swipe gestures enabled.

**Try it:**
1. Switch to mobile viewport (top toolbar)
2. Swipe the card right/left
3. Watch for color indicators (green/blue)
4. Check Actions panel for callback logs

**Mobile Detection:** Only active if touch capability detected AND screen width < 1024px.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * VISUAL VARIANTS
 * ==============================================================================
 */

/**
 * With Visual Indicators
 * Shows the color indicators clearly during swipe
 */
export const WithVisualIndicators: Story = {
  args: {
    enableGestures: true,
    onSwipeRight: fn(),
    onSwipeLeft: fn(),
    children: (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Visual Feedback</span>
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded bg-green-500/20 flex items-center justify-center text-green-600 text-xs font-bold">
                →
              </div>
              <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-600 text-xs font-bold">
                ←
              </div>
            </div>
          </CardTitle>
          <CardDescription>Watch the edges during swipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 rounded bg-green-500/10 border border-green-500/30">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Right Swipe (→)
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                Green gradient appears from left edge
              </p>
            </div>
            <div className="p-3 rounded bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Left Swipe (←)</p>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                Blue gradient appears from right edge
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: `
Visual indicators demonstration:
- **Green**: Right swipe (copy action)
- **Blue**: Left swipe (bookmark action)
- **Opacity**: Increases with swipe distance
- **Threshold**: 100px minimum to trigger action
        `,
      },
    },
  },
};

/**
 * Real-World Example: Config Card
 * Shows how swipeable wrapper integrates with actual card components
 */
export const RealWorldExample: Story = {
  args: {
    enableGestures: true,
    onSwipeRight: fn(async () => {
      // Mock copy to clipboard
      await navigator.clipboard?.writeText('https://claudepro.directory/agents/code-reviewer');
      console.log('✅ Copied URL to clipboard');
    }),
    onSwipeLeft: fn(async () => {
      // Mock bookmark action
      console.log('🔖 Added to bookmarks');
    }),
    children: (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-500/10 text-green-600 border border-green-500/30 text-xs font-medium">
                  Agent
                </span>
              </div>
              <CardTitle className="text-lg font-semibold">Code Review Agent</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1 line-clamp-2">
                AI-powered code review agent that analyzes pull requests and suggests improvements.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
              typescript
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
              code-review
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
              ai
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>by DevTools Team</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 text-primary">
                👁 12.5K
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Real-world integration** with config card styling.

**Actions:**
- **Swipe Right**: Copies \`https://claudepro.directory/agents/code-reviewer\` to clipboard
- **Swipe Left**: Adds agent to bookmarks

This is exactly how ConfigCard uses SwipeableCardWrapper in production.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * RESPONSIVE TESTING
 * ==============================================================================
 */

/**
 * Mobile vs Desktop Comparison
 * Shows behavior difference across viewports
 */
export const ResponsiveComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Mobile Viewport (Gestures Active)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Switch to mobile viewport (top toolbar) to enable swipe gestures.
        </p>
        <SwipeableCardWrapper
          enableGestures={true}
          onSwipeRight={fn(() => console.log('✅ Copied to clipboard'))}
          onSwipeLeft={fn(() => console.log('🔖 Bookmarked'))}
        >
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Mobile Card</CardTitle>
              <CardDescription>Swipe gestures enabled on mobile</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Try swiping left or right!</p>
            </CardContent>
          </Card>
        </SwipeableCardWrapper>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Desktop Viewport (Gestures Disabled)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          On desktop (width ≥ 1024px), swipe gestures are automatically disabled. Use action buttons
          instead.
        </p>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Desktop Card</CardTitle>
            <CardDescription>Use action buttons instead of gestures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <button className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">
                Copy URL
              </button>
              <button className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90">
                Bookmark
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Responsive behavior demonstration:**

**Mobile (<1024px):**
- Touch capability detected
- Swipe gestures enabled
- Visual indicators on drag
- Quick actions without buttons

**Desktop (≥1024px):**
- Swipe gestures disabled
- Action buttons provided instead
- Better for mouse/trackpad users
- Meets accessibility requirements

**Progressive Enhancement:** Gestures enhance mobile UX but aren't required. Desktop users get equivalent button-based actions.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * ACCESSIBILITY & EDGE CASES
 * ==============================================================================
 */

/**
 * Accessibility Considerations
 * Shows proper accessible implementation
 */
export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
          ⚠️ Accessibility Requirements
        </h3>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
          <li>Gesture-only actions MUST have button alternatives</li>
          <li>Respects prefers-reduced-motion (disables gestures)</li>
          <li>Visual feedback for all gesture states</li>
          <li>Minimum 100px threshold prevents accidental triggers</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Correct Implementation ✅</h3>
        <SwipeableCardWrapper enableGestures={true} onSwipeRight={fn()} onSwipeLeft={fn()}>
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Accessible Card</CardTitle>
              <CardDescription>Gestures + Button alternatives</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                Mobile: Swipe left/right
                <br />
                Desktop/Keyboard: Use buttons below
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-2 text-sm bg-green-500/20 text-green-700 dark:text-green-400 rounded border border-green-500/30">
                  📋 Copy
                </button>
                <button className="px-3 py-2 text-sm bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded border border-blue-500/30">
                  🔖 Bookmark
                </button>
              </div>
            </CardContent>
          </Card>
        </SwipeableCardWrapper>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 text-destructive">Incorrect Implementation ❌</h3>
        <SwipeableCardWrapper enableGestures={true} onSwipeRight={fn()} onSwipeLeft={fn()}>
          <Card className="w-full max-w-md opacity-50">
            <CardHeader>
              <CardTitle>Inaccessible Card</CardTitle>
              <CardDescription>Gestures only, no alternatives</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">
                ❌ No button alternatives provided
                <br />❌ Desktop/keyboard users cannot access actions
                <br />❌ Fails WCAG 2.1 AA compliance
              </p>
            </CardContent>
          </Card>
        </SwipeableCardWrapper>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Critical Accessibility Rule:**

Gesture-based actions MUST have equivalent button alternatives for:
- Desktop users (no touch screens)
- Keyboard-only navigation
- Screen reader users
- Users with motor impairments

**Best Practices:**
1. Provide visible action buttons on desktop
2. Test with keyboard navigation
3. Verify with screen readers
4. Respect prefers-reduced-motion
5. Use semantic HTML for actions
        `,
      },
    },
  },
};

/**
 * Prefers Reduced Motion
 * Shows how wrapper respects user preferences
 */
export const ReducedMotionExample: Story = {
  args: {
    enableGestures: true,
    onSwipeRight: fn(),
    onSwipeLeft: fn(),
    children: (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reduced Motion Support</CardTitle>
          <CardDescription>Respects prefers-reduced-motion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded bg-muted">
            <p className="text-sm font-medium mb-2">Testing:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open browser DevTools (F12)</li>
              <li>Toggle "prefers-reduced-motion" in Rendering panel</li>
              <li>Try swiping - gestures will be disabled</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Respects User Preferences:**

When \`prefers-reduced-motion: reduce\` is detected:
- Swipe gestures are disabled
- No drag animations occur
- User can still access actions via buttons
- Meets WCAG 2.1 AA animation requirements

**Browser DevTools Testing:**
1. Open DevTools (F12)
2. Go to Rendering tab
3. Check "Emulate prefers-reduced-motion: reduce"
4. Verify gestures are disabled
        `,
      },
    },
  },
};
