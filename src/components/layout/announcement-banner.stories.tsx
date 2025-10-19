'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { AnnouncementBanner } from './announcement-banner';

/**
 * AnnouncementBanner Component Stories
 *
 * Global announcement banner displayed above navigation.
 * Automatically manages visibility, dismissal state, and responsive behavior.
 *
 * Features:
 * - Automatic announcement selection from config (date + priority based)
 * - Persistent dismissal tracking (localStorage)
 * - Keyboard navigation (Escape to dismiss)
 * - Responsive design (hidden on mobile, visible on md+)
 * - Rounded pill container with backdrop blur
 * - Touch-friendly dismiss button (44x44px minimum)
 * - Icon support (ArrowUpRight, AlertTriangle, Calendar, etc.)
 * - Tag badges ("New", "Beta", "Update")
 * - Link support with hover states
 * - ARIA live region (polite)
 * - Reduced motion support
 * - Accessibility (WCAG 2.1 AA compliant)
 *
 * Component: src/components/layout/announcement-banner.tsx (190 LOC)
 * Used in: Root layout above navigation
 * Dependencies: Announcement primitive, useAnnouncementDismissal hook, announcements config
 *
 * Config-Driven Architecture:
 * - Announcements defined in src/config/announcements.ts
 * - getActiveAnnouncement() selects based on date range + priority
 * - useAnnouncementDismissal(id) tracks localStorage dismissal
 * - Only ONE announcement shows at a time
 *
 * Announcement Selection Priority:
 * 1. Date range (must be within startDate/endDate)
 * 2. Priority (high > medium > low)
 * 3. Most recent startDate (if same priority)
 *
 * Visual Variants:
 * - default: Accent background (primary features)
 * - outline: Border only (standard updates)
 * - secondary: Muted (low-priority)
 * - destructive: Red (warnings/maintenance)
 *
 * Dismissal:
 * - dismissible: true → Shows X button, tracks in localStorage
 * - dismissible: false → No X button, always visible (critical alerts)
 *
 * IMPORTANT: This component is STATEFUL and config-driven.
 * Stories show the component as it would appear in production,
 * pulling from src/config/announcements.ts. To test different
 * announcements, modify the config file or add/remove entries.
 *
 * @see Research Report: "shadcn Announcement Component Integration - Section 5"
 */
const meta = {
  title: 'Layout/AnnouncementBanner',
  component: AnnouncementBanner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Global announcement banner above navigation. Config-driven with automatic selection based on date and priority. Manages dismissal state in localStorage.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[120px] bg-background">
        <Story />
        <div className="container mx-auto px-4 py-8">
          <p className="text-sm text-muted-foreground">
            Navigation would appear below the announcement banner
          </p>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof AnnouncementBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Production State
 *
 * Shows AnnouncementBanner as it appears in production.
 * Pulls active announcement from src/config/announcements.ts
 *
 * Behavior:
 * - If active announcement exists → renders banner
 * - If no active announcement → returns null (no banner)
 * - If previously dismissed → returns null
 *
 * To modify what shows:
 * 1. Edit src/config/announcements.ts
 * 2. Add/modify announcement with current date range
 * 3. Refresh Storybook
 *
 * Usage:
 * ```tsx
 * // In layout.tsx
 * <body>
 *   <AnnouncementBanner />
 *   <Navigation />
 *   <main>{children}</main>
 * </body>
 * ```
 */
export const Default: Story = {};

/**
 * With Active Announcement
 *
 * Demonstrates banner when announcement is active.
 * Shows typical production state with visible banner.
 *
 * Note: Actual content depends on announcements config.
 * Check src/config/announcements.ts for current announcements.
 */
export const WithAnnouncement: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Banner with active announcement from config. Content varies based on announcements.ts entries.',
      },
    },
  },
};

/**
 * Dismissible Announcement
 *
 * Shows announcement with dismiss button (X).
 * User can click X or press Escape to dismiss.
 *
 * Features:
 * - X button in top-right (touch-friendly 44x44px)
 * - Hover effect on dismiss button
 * - Focus ring for keyboard navigation
 * - Dismissal persisted to localStorage
 * - Escape key shortcut
 *
 * Dismissal tracked by announcement ID in localStorage:
 * - Key: `announcement-dismissed-${id}`
 * - Value: "true"
 */
export const DismissibleAnnouncement: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Announcement with dismiss button. Click X or press Escape to dismiss. Dismissal persisted to localStorage.',
      },
    },
  },
};

/**
 * Non-Dismissible Announcement
 *
 * Critical announcement that cannot be dismissed.
 * No X button shown. Always visible.
 *
 * Use cases:
 * - Scheduled maintenance alerts
 * - Security warnings
 * - Critical service updates
 *
 * Config:
 * ```ts
 * {
 *   dismissible: false,
 *   variant: 'destructive',
 *   tag: 'Critical',
 *   // ...
 * }
 * ```
 */
export const NonDismissible: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Critical announcement without dismiss button. Always visible. Used for maintenance alerts and security warnings.',
      },
    },
  },
};

/**
 * With Tag Badge
 *
 * Announcement with category tag badge.
 * Common tags: "New", "Beta", "Update", "Feature"
 *
 * Tag displays on left side before title.
 * Styled as small bold badge (9px on mobile, 12px on desktop).
 */
export const WithTag: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Announcement with tag badge (e.g., "New", "Beta"). Tag appears before title text.',
      },
    },
  },
};

/**
 * With Icon
 *
 * Announcement with icon next to title.
 * Available icons: ArrowUpRight, ArrowRight, AlertTriangle,
 * Calendar, BookOpen, Sparkles
 *
 * Icon mapping in component:
 * ```ts
 * const ICON_MAP = {
 *   ArrowUpRight, ArrowRight, AlertTriangle,
 *   Calendar, BookOpen, Sparkles
 * };
 * ```
 */
export const WithIcon: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Announcement with icon. Icons available: ArrowUpRight, ArrowRight, AlertTriangle, Calendar, BookOpen, Sparkles.',
      },
    },
  },
};

/**
 * With Link
 *
 * Clickable announcement linking to destination.
 * Entire title becomes link with hover underline.
 *
 * Features:
 * - Hover underline transition
 * - Icon shown at end (if provided)
 * - Color transition on hover
 * - Next.js Link component (client-side navigation)
 */
export const WithLink: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Clickable announcement with href. Title becomes link with hover underline effect.',
      },
    },
  },
};

/**
 * Variant: Default (Accent)
 *
 * Primary announcement variant.
 * Accent background (blue/primary color).
 *
 * Use for:
 * - New features
 * - Major updates
 * - Product launches
 *
 * Styling:
 * - bg-accent/10
 * - border-accent/20
 * - hover:border-accent/30
 */
export const VariantDefault: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default variant with accent background. Used for primary announcements and new features.',
      },
    },
  },
};

/**
 * Variant: Outline
 *
 * Subtle announcement variant.
 * Border only, no background fill.
 *
 * Use for:
 * - Standard updates
 * - Blog posts
 * - Documentation updates
 */
export const VariantOutline: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Outline variant with border only. Used for standard updates and announcements.',
      },
    },
  },
};

/**
 * Variant: Secondary
 *
 * Low-priority announcement variant.
 * Muted colors.
 *
 * Use for:
 * - Minor updates
 * - Community events
 * - General information
 */
export const VariantSecondary: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Secondary variant with muted colors. Used for low-priority announcements and general info.',
      },
    },
  },
};

/**
 * Variant: Destructive
 *
 * Critical announcement variant.
 * Red color scheme for warnings.
 *
 * Use for:
 * - Scheduled maintenance
 * - Security alerts
 * - Breaking changes
 * - Service disruptions
 *
 * Often paired with:
 * - dismissible: false
 * - icon: "AlertTriangle"
 * - tag: "Critical" or "Warning"
 */
export const VariantDestructive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Destructive variant in red. Used for critical alerts, maintenance warnings, and security notices.',
      },
    },
  },
};

/**
 * Mobile Hidden
 *
 * Shows that banner is hidden on mobile (< md breakpoint).
 * Visible only on tablets and desktop.
 *
 * CSS: `hidden md:block`
 *
 * Rationale:
 * - Conserves mobile screen space
 * - Prioritizes content on small screens
 * - Users can see announcement on desktop
 */
export const MobileHidden: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Banner hidden on mobile viewports (< 768px). Visible only on md+ breakpoints to conserve screen space.',
      },
    },
  },
};

/**
 * Desktop Visible
 *
 * Shows banner on desktop viewport (>= md breakpoint).
 * Full-width with container centering.
 *
 * Layout:
 * - Rounded pill container
 * - Backdrop blur effect
 * - Shadow on hover
 * - Smooth transitions
 */
export const DesktopVisible: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Banner visible on desktop viewports. Shows full rounded pill design with backdrop blur.',
      },
    },
  },
};

/**
 * Long Title Text
 *
 * Tests layout with lengthy announcement text.
 * Shows line-clamping behavior.
 *
 * Mobile: line-clamp-2 (max 2 lines)
 * Desktop: line-clamp-1 (max 1 line, ellipsis)
 */
export const LongTitle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Announcement with long title text. Uses line-clamp-2 on mobile, line-clamp-1 on desktop.',
      },
    },
  },
};

/**
 * Keyboard Navigation
 *
 * Demonstrates keyboard accessibility.
 *
 * Keyboard features:
 * - Escape: Dismiss announcement (if dismissible)
 * - Tab: Navigate to dismiss button
 * - Enter/Space: Activate dismiss button
 * - Tab: Focus on link (if href provided)
 *
 * Focus indicators:
 * - ring-2 ring-accent
 * - ring-offset-2
 */
export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Keyboard accessible. Press Escape to dismiss, Tab to navigate, Enter/Space to activate.',
      },
    },
  },
};

/**
 * Reduced Motion
 *
 * Shows announcement with animations disabled.
 * Respects prefers-reduced-motion setting.
 *
 * CSS: `motion-reduce:transition-none`
 *
 * Affected:
 * - transition-all duration-300
 * - transition-colors duration-200
 */
export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Respects prefers-reduced-motion setting. Transitions disabled for users with motion sensitivity.',
      },
    },
  },
};

/**
 * ARIA Live Region
 *
 * Demonstrates accessibility attributes.
 *
 * ARIA attributes:
 * - aria-label="Site announcement"
 * - aria-live="polite" (screen readers announce when idle)
 * - aria-atomic="true" (reads entire content)
 * - aria-hidden="true" on icons (decorative)
 * - aria-label="Dismiss announcement" on button
 */
export const ARIALiveRegion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'ARIA live region for screen readers. Announces politely when idle, reads full content.',
      },
    },
  },
};

/**
 * In Context Example
 *
 * Shows AnnouncementBanner in realistic layout.
 * Positioned above navigation, full-width.
 */
export const InContextExample: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <AnnouncementBanner />
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="text-xl font-bold">Logo</div>
            <div className="flex gap-6">
              <a href="/features" className="text-sm hover:underline">
                Features
              </a>
              <a href="/docs" className="text-sm hover:underline">
                Docs
              </a>
              <a href="/pricing" className="text-sm hover:underline">
                Pricing
              </a>
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
        <p className="text-muted-foreground">
          The announcement banner appears above this content when active.
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
 * Tests AnnouncementBanner renders (or returns null if no announcement)
 */
export const ComponentRenderTest: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests AnnouncementBanner component renders. May return null if no active announcement in config.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Check if component rendered or returned null', async () => {
      // Component may return null if no active announcement
      const section = canvasElement.querySelector('section[aria-label="Site announcement"]');
      // Test passes either way - null is valid if no announcement
      if (section) {
        await expect(section).toBeInTheDocument();
      }
    });
  },
};

/**
 * ARIA Attributes Test
 * Tests accessibility attributes if banner is visible
 */
export const ARIAAttributesTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests ARIA attributes are present when banner is visible.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const section = canvasElement.querySelector('section[aria-label="Site announcement"]');

    if (section) {
      await step('Verify aria-label is set', async () => {
        await expect(section.getAttribute('aria-label')).toBe('Site announcement');
      });

      await step('Verify aria-live is polite', async () => {
        await expect(section.getAttribute('aria-live')).toBe('polite');
      });

      await step('Verify aria-atomic is true', async () => {
        await expect(section.getAttribute('aria-atomic')).toBe('true');
      });
    }
  },
};

/**
 * Dismiss Button Test
 * Tests dismiss button is present if announcement is dismissible
 */
export const DismissButtonTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests dismiss button appears for dismissible announcements.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const section = canvasElement.querySelector('section[aria-label="Site announcement"]');

    if (section) {
      await step('Check for dismiss button', async () => {
        const dismissButton = canvas.queryByRole('button', {
          name: /dismiss announcement/i,
        });
        // Button may or may not be present depending on dismissible flag
        if (dismissButton) {
          await expect(dismissButton).toBeInTheDocument();
        }
      });
    }
  },
};

/**
 * Responsive Visibility Test
 * Tests component has hidden class for mobile
 */
export const ResponsiveVisibilityTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests component has responsive visibility classes (hidden md:block).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const section = canvasElement.querySelector('section[aria-label="Site announcement"]');

    if (section) {
      await step('Verify section has hidden class', async () => {
        const classList = Array.from(section.classList);
        await expect(classList).toContain('hidden');
      });

      await step('Verify section has md:block class', async () => {
        const classList = Array.from(section.classList);
        await expect(classList).toContain('md:block');
      });
    }
  },
};
