/**
 * UnifiedTracker Storybook Stories
 *
 * Consolidation of ViewTracker + PageViewTracker into configuration-driven component.
 *
 * **Variants:**
 * - 'view': Basic view tracking with configurable delay (default: 1000ms)
 * - 'page-view': Analytics event tracking with optional sourcePage (default: 0ms delay)
 *
 * **Architectural Improvements:**
 * - Discriminated union for type safety
 * - Shared useTrackingEffect hook (DRY)
 * - Unified error handling
 * - Configurable delay for performance optimization
 * - Subpath imports (#lib) for Storybook compatibility
 *
 * @module components/shared/unified-tracker.stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedTracker } from './unified-tracker';

const meta = {
  title: 'Infra/UnifiedTracker',
  component: UnifiedTracker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**UnifiedTracker** - Consolidation of ViewTracker + PageViewTracker

Invisible tracking component that fires view/analytics events on mount.

### Variants

#### View Variant
- **Purpose**: Basic view tracking (increments view count in database)
- **Default Delay**: 1000ms (1 second)
- **Use Case**: Track page/content views after user has spent time on page

#### Page-View Variant
- **Purpose**: Analytics event tracking (fires analytics events)
- **Default Delay**: 0ms (immediate)
- **Use Case**: Track page views for analytics dashboards

### Architectural Fixes

1. ✅ **92% Code Duplication** → Shared \`useTrackingEffect\` hook
2. ✅ **Inconsistent Error Handling** → Unified try-catch with silent failures
3. ✅ **Missing Abstraction** → Extracted shared hook
4. ✅ **Inconsistent Timing** → Configurable delay parameter
5. ✅ **Type Safety Issues** → Discriminated union with proper types
6. ✅ **Import Inconsistency** → Standardized on #lib subpath imports

### Usage

\`\`\`tsx
// Basic view tracking (1s delay)
<UnifiedTracker variant="view" category="agents" slug="example-agent" />

// Immediate view tracking
<UnifiedTracker variant="view" category="agents" slug="example-agent" delay={0} />

// Analytics event tracking
<UnifiedTracker variant="page-view" category="agents" slug="example-agent" sourcePage="home" />
\`\`\`

### Notes

- Component returns \`null\` (invisible)
- Tracking fires on mount only (not on re-renders)
- Errors are handled silently (no console noise)
- Server actions are mocked in Storybook
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['view', 'page-view'],
      description: 'Tracking variant',
    },
    category: {
      control: 'text',
      description: 'Content category (agents, mcp-servers, rules, commands, hooks)',
    },
    slug: {
      control: 'text',
      description: 'Content slug identifier',
    },
    delay: {
      control: 'number',
      description:
        'Delay in ms before tracking fires (default: 1000ms for view, 0ms for page-view)',
    },
    sourcePage: {
      control: 'text',
      description: '(page-view only) Source page identifier',
      if: { arg: 'variant', eq: 'page-view' },
    },
  },
} satisfies Meta<typeof UnifiedTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// VIEW VARIANT - Basic View Tracking
// ============================================================================

/**
 * Basic view tracking with default 1 second delay.
 * Use this for tracking content views after user has spent time on page.
 */
export const ViewDefault: Story = {
  args: {
    variant: 'view',
    category: 'agents',
    slug: 'example-agent',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default view tracking with 1 second delay. This gives the user time to engage with content before counting the view.',
      },
    },
  },
};

/**
 * View tracking with immediate execution (no delay).
 * Use when you want to track views immediately on mount.
 */
export const ViewImmediate: Story = {
  args: {
    variant: 'view',
    category: 'agents',
    slug: 'example-agent',
    delay: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Immediate view tracking without delay. Useful for quick navigation scenarios.',
      },
    },
  },
};

/**
 * View tracking with custom 3 second delay.
 * Use for deeper engagement tracking.
 */
export const ViewCustomDelay: Story = {
  args: {
    variant: 'view',
    category: 'agents',
    slug: 'advanced-agent',
    delay: 3000,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom 3 second delay before tracking. Ensures user has meaningful engagement with content.',
      },
    },
  },
};

/**
 * View tracking for MCP servers category
 */
export const ViewMCPServer: Story = {
  args: {
    variant: 'view',
    category: 'mcp-servers',
    slug: 'file-system-mcp',
  },
  parameters: {
    docs: {
      description: {
        story: 'View tracking for MCP server content.',
      },
    },
  },
};

/**
 * View tracking for rules category
 */
export const ViewRule: Story = {
  args: {
    variant: 'view',
    category: 'rules',
    slug: 'typescript-patterns',
  },
  parameters: {
    docs: {
      description: {
        story: 'View tracking for rule content.',
      },
    },
  },
};

/**
 * View tracking for commands category
 */
export const ViewCommand: Story = {
  args: {
    variant: 'view',
    category: 'commands',
    slug: 'git-workflow',
  },
  parameters: {
    docs: {
      description: {
        story: 'View tracking for command content.',
      },
    },
  },
};

/**
 * View tracking for hooks category
 */
export const ViewHook: Story = {
  args: {
    variant: 'view',
    category: 'hooks',
    slug: 'pre-commit',
  },
  parameters: {
    docs: {
      description: {
        story: 'View tracking for hook content.',
      },
    },
  },
};

// ============================================================================
// PAGE-VIEW VARIANT - Analytics Event Tracking
// ============================================================================

/**
 * Basic analytics event tracking with default immediate execution.
 * Use this for analytics dashboards and user journey tracking.
 */
export const PageViewDefault: Story = {
  args: {
    variant: 'page-view',
    category: 'agents',
    slug: 'example-agent',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default page-view tracking fires immediately on mount. Used for analytics event tracking.',
      },
    },
  },
};

/**
 * Analytics event tracking with source page attribution.
 * Use for tracking user navigation paths.
 */
export const PageViewWithSource: Story = {
  args: {
    variant: 'page-view',
    category: 'agents',
    slug: 'example-agent',
    sourcePage: 'home',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Page-view tracking with source page attribution. Helps understand user navigation patterns.',
      },
    },
  },
};

/**
 * Analytics event tracking with custom delay.
 * Use when you want to delay analytics events.
 */
export const PageViewCustomDelay: Story = {
  args: {
    variant: 'page-view',
    category: 'agents',
    slug: 'advanced-agent',
    sourcePage: 'search',
    delay: 500,
  },
  parameters: {
    docs: {
      description: {
        story: 'Page-view tracking with 500ms delay before firing analytics event.',
      },
    },
  },
};

/**
 * Analytics event tracking from trending page
 */
export const PageViewFromTrending: Story = {
  args: {
    variant: 'page-view',
    category: 'agents',
    slug: 'popular-agent',
    sourcePage: 'trending',
  },
  parameters: {
    docs: {
      description: {
        story: 'Track views originating from trending page.',
      },
    },
  },
};

/**
 * Analytics event tracking from for-you page
 */
export const PageViewFromForYou: Story = {
  args: {
    variant: 'page-view',
    category: 'mcp-servers',
    slug: 'recommended-mcp',
    sourcePage: 'for-you',
  },
  parameters: {
    docs: {
      description: {
        story: 'Track views from personalized recommendations.',
      },
    },
  },
};

/**
 * Analytics event tracking from community page
 */
export const PageViewFromCommunity: Story = {
  args: {
    variant: 'page-view',
    category: 'commands',
    slug: 'community-command',
    sourcePage: 'community',
  },
  parameters: {
    docs: {
      description: {
        story: 'Track views from community page.',
      },
    },
  },
};

/**
 * Analytics event tracking from board page
 */
export const PageViewFromBoard: Story = {
  args: {
    variant: 'page-view',
    category: 'rules',
    slug: 'popular-rule',
    sourcePage: 'board',
  },
  parameters: {
    docs: {
      description: {
        story: 'Track views from board/collection page.',
      },
    },
  },
};

// ============================================================================
// EDGE CASES & TESTING
// ============================================================================

/**
 * Multiple trackers on same page (different categories)
 */
export const MultipleTrackers: Story = {
  render: () => (
    <>
      <UnifiedTracker variant="view" category="agents" slug="agent-1" />
      <UnifiedTracker variant="view" category="mcp-servers" slug="mcp-1" />
      <UnifiedTracker variant="page-view" category="rules" slug="rule-1" sourcePage="home" />
    </>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Multiple trackers can coexist on the same page. Each fires independently based on its configuration.',
      },
    },
  },
};

/**
 * View tracker with zero delay (behaves like page-view)
 */
export const ViewZeroDelay: Story = {
  args: {
    variant: 'view',
    category: 'agents',
    slug: 'quick-view',
    delay: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'View variant with zero delay behaves similarly to page-view variant (immediate execution).',
      },
    },
  },
};

/**
 * Page-view tracker with long delay (behaves like view)
 */
export const PageViewLongDelay: Story = {
  args: {
    variant: 'page-view',
    category: 'agents',
    slug: 'delayed-analytics',
    sourcePage: 'search',
    delay: 2000,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Page-view variant with 2 second delay. Useful for tracking only engaged users in analytics.',
      },
    },
  },
};
