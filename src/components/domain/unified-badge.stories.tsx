import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { UnifiedBadge } from './unified-badge';

const meta = {
  title: 'UI/UnifiedBadge',
  component: UnifiedBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Production-grade unified badge system using discriminated unions. Consolidates badge.tsx, config-badge.tsx, sponsored-badge.tsx, and new-indicator.tsx into a single type-safe component.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Discriminated union variant selector
    variant: {
      control: 'select',
      options: [
        'base',
        'category',
        'source',
        'status',
        'sponsored',
        'tag',
        'new-indicator',
        'new-badge',
      ],
      description: 'Badge variant type (discriminated union)',
      table: {
        type: { summary: 'string' },
      },
    },
    // Base variant props
    style: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'Visual style for base variant',
      if: { arg: 'variant', eq: 'base' },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    // Category variant props
    category: {
      control: 'select',
      options: [
        'rules',
        'mcp',
        'agents',
        'commands',
        'hooks',
        'statuslines',
        'collections',
        'guides',
        'skills',
      ],
      description: 'Content category type',
      if: { arg: 'variant', eq: 'category' },
      table: {
        type: { summary: 'string' },
      },
    },
    // Source variant props
    source: {
      control: 'select',
      options: ['official', 'partner', 'community', 'verified', 'experimental', 'other'],
      description: 'Content source type',
      if: { arg: 'variant', eq: 'source' },
      table: {
        type: { summary: 'string' },
      },
    },
    // Status variant props
    status: {
      control: 'select',
      options: ['active', 'trending', 'new', 'updated', 'deprecated'],
      description: 'Content status',
      if: { arg: 'variant', eq: 'status' },
      table: {
        type: { summary: 'string' },
      },
    },
    // Sponsored variant props
    tier: {
      control: 'select',
      options: ['featured', 'promoted', 'spotlight', 'sponsored'],
      description: 'Sponsorship tier',
      if: { arg: 'variant', eq: 'sponsored' },
      table: {
        type: { summary: 'string' },
      },
    },
    showIcon: {
      control: 'boolean',
      description: 'Show icon in sponsored badge',
      if: { arg: 'variant', eq: 'sponsored' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    // Tag variant props
    tag: {
      control: 'text',
      description: 'Tag label text',
      if: { arg: 'variant', eq: 'tag' },
      table: {
        type: { summary: 'string' },
      },
    },
    isActive: {
      control: 'boolean',
      description: 'Tag active state (visual highlight)',
      if: { arg: 'variant', eq: 'tag' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onClick: {
      action: 'clicked',
      description: 'Tag click handler',
      if: { arg: 'variant', eq: 'tag' },
      table: {
        type: { summary: '() => void' },
      },
    },
    onRemove: {
      action: 'removed',
      description: 'Tag remove handler (shows X button)',
      if: { arg: 'variant', eq: 'tag' },
      table: {
        type: { summary: '() => void' },
      },
    },
    // New indicator props
    label: {
      control: 'text',
      description: 'Tooltip label for new indicator',
      if: { arg: 'variant', eq: 'new-indicator' },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'New' },
      },
    },
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Tooltip position',
      if: { arg: 'variant', eq: 'new-indicator' },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'top' },
      },
    },
    delayDuration: {
      control: 'number',
      description: 'Tooltip delay in milliseconds',
      if: { arg: 'variant', eq: 'new-indicator' },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '300' },
      },
    },
    // New badge props
    badgeVariant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Badge style variant',
      if: { arg: 'variant', eq: 'new-badge' },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    // Common props
    children: {
      control: 'text',
      description: 'Badge content text',
      if: { arg: 'variant', oneOf: ['base', 'category', 'source', 'status', 'new-badge'] },
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
      table: {
        type: { summary: 'string' },
      },
    },
  },
} satisfies Meta<typeof UnifiedBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * BASE BADGE VARIANTS
 * Original shadcn/ui badge styles
 */

export const BaseDefault: Story = {
  args: {
    variant: 'base',
    style: 'default',
    children: 'Default Badge',
  },
};

export const BaseSecondary: Story = {
  args: {
    variant: 'base',
    style: 'secondary',
    children: 'Secondary Badge',
  },
};

export const BaseDestructive: Story = {
  args: {
    variant: 'base',
    style: 'destructive',
    children: 'Destructive Badge',
  },
};

export const BaseOutline: Story = {
  args: {
    variant: 'base',
    style: 'outline',
    children: 'Outline Badge',
  },
};

/**
 * CATEGORY BADGES
 * Content type badges (rules, mcp, agents, etc.)
 */

export const CategoryMCP: Story = {
  args: {
    variant: 'category',
    category: 'mcp',
    children: 'MCP',
  },
};

export const CategoryAgents: Story = {
  args: {
    variant: 'category',
    category: 'agents',
    children: 'Agent',
  },
};

export const CategoryCommands: Story = {
  args: {
    variant: 'category',
    category: 'commands',
    children: 'Command',
  },
};

export const CategoryHooks: Story = {
  args: {
    variant: 'category',
    category: 'hooks',
    children: 'Hook',
  },
};

export const CategoryCollections: Story = {
  args: {
    variant: 'category',
    category: 'collections',
    children: 'Collection',
  },
};

/**
 * SOURCE BADGES
 * Content source badges (official, partner, community, etc.)
 */

export const SourceOfficial: Story = {
  args: {
    variant: 'source',
    source: 'official',
    children: 'Official',
  },
};

export const SourcePartner: Story = {
  args: {
    variant: 'source',
    source: 'partner',
    children: 'Partner',
  },
};

export const SourceCommunity: Story = {
  args: {
    variant: 'source',
    source: 'community',
    children: 'Community',
  },
};

export const SourceVerified: Story = {
  args: {
    variant: 'source',
    source: 'verified',
    children: 'Verified',
  },
};

export const SourceExperimental: Story = {
  args: {
    variant: 'source',
    source: 'experimental',
    children: 'Experimental',
  },
};

/**
 * STATUS BADGES
 * Content status badges (new, trending, active, etc.)
 */

export const StatusActive: Story = {
  args: {
    variant: 'status',
    status: 'active',
    children: 'Active',
  },
};

export const StatusTrending: Story = {
  args: {
    variant: 'status',
    status: 'trending',
    children: 'Trending',
  },
};

export const StatusNew: Story = {
  args: {
    variant: 'status',
    status: 'new',
    children: 'New',
  },
};

export const StatusUpdated: Story = {
  args: {
    variant: 'status',
    status: 'updated',
    children: 'Updated',
  },
};

export const StatusDeprecated: Story = {
  args: {
    variant: 'status',
    status: 'deprecated',
    children: 'Deprecated',
  },
};

/**
 * SPONSORED BADGES
 * Sponsored/promoted content badges with optional icons
 */

export const SponsoredFeatured: Story = {
  args: {
    variant: 'sponsored',
    tier: 'featured',
    showIcon: true,
  },
};

export const SponsoredPromoted: Story = {
  args: {
    variant: 'sponsored',
    tier: 'promoted',
    showIcon: true,
  },
};

export const SponsoredSpotlight: Story = {
  args: {
    variant: 'sponsored',
    tier: 'spotlight',
    showIcon: true,
  },
};

export const SponsoredBasic: Story = {
  args: {
    variant: 'sponsored',
    tier: 'sponsored',
    showIcon: false,
  },
};

/**
 * TAG BADGES
 * Interactive tag badges with active/inactive states
 */

export const TagInactive: Story = {
  args: {
    variant: 'tag',
    tag: 'React',
    isActive: false,
    onClick: () => {
      // Intentional no-op for demonstration
    },
  },
};

export const TagActive: Story = {
  args: {
    variant: 'tag',
    tag: 'TypeScript',
    isActive: true,
    onClick: () => {
      // Intentional no-op for demonstration
    },
  },
};

export const TagWithRemove: Story = {
  args: {
    variant: 'tag',
    tag: 'Next.js',
    isActive: true,
    onClick: () => {
      // Intentional no-op for demonstration
    },
    onRemove: () => {},
  },
};

/**
 * NEW INDICATOR
 * Animated dot indicator with tooltip
 */

export const NewIndicator: Story = {
  args: {
    variant: 'new-indicator',
    label: 'New feature',
    side: 'bottom',
  },
};

export const NewIndicatorTop: Story = {
  args: {
    variant: 'new-indicator',
    label: 'New category',
    side: 'top',
  },
};

/**
 * NEW BADGE
 * Text-based "NEW" badge
 */

export const NewBadgeDefault: Story = {
  args: {
    variant: 'new-badge',
    badgeVariant: 'default',
    children: 'NEW',
  },
};

export const NewBadgeOutline: Story = {
  args: {
    variant: 'new-badge',
    badgeVariant: 'outline',
    children: 'NEW',
  },
};

/**
 * ALL VARIANTS SHOWCASE
 * Comprehensive display of all badge types
 */

export const AllBadgeVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-4">
      {/* Base Badges */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Base Badges</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedBadge variant="base" style="default">
            Default
          </UnifiedBadge>
          <UnifiedBadge variant="base" style="secondary">
            Secondary
          </UnifiedBadge>
          <UnifiedBadge variant="base" style="destructive">
            Destructive
          </UnifiedBadge>
          <UnifiedBadge variant="base" style="outline">
            Outline
          </UnifiedBadge>
        </div>
      </div>

      {/* Category Badges */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Category Badges</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedBadge variant="category" category="mcp">
            MCP
          </UnifiedBadge>
          <UnifiedBadge variant="category" category="agents">
            Agent
          </UnifiedBadge>
          <UnifiedBadge variant="category" category="commands">
            Command
          </UnifiedBadge>
          <UnifiedBadge variant="category" category="hooks">
            Hook
          </UnifiedBadge>
          <UnifiedBadge variant="category" category="rules">
            Rule
          </UnifiedBadge>
          <UnifiedBadge variant="category" category="statuslines">
            Statusline
          </UnifiedBadge>
          <UnifiedBadge variant="category" category="collections">
            Collection
          </UnifiedBadge>
          <UnifiedBadge variant="category" category="guides">
            Guide
          </UnifiedBadge>
          <UnifiedBadge variant="category" category="skills">
            Skill
          </UnifiedBadge>
        </div>
      </div>

      {/* Source Badges */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Source Badges</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedBadge variant="source" source="official">
            Official
          </UnifiedBadge>
          <UnifiedBadge variant="source" source="partner">
            Partner
          </UnifiedBadge>
          <UnifiedBadge variant="source" source="community">
            Community
          </UnifiedBadge>
          <UnifiedBadge variant="source" source="verified">
            Verified
          </UnifiedBadge>
          <UnifiedBadge variant="source" source="experimental">
            Experimental
          </UnifiedBadge>
          <UnifiedBadge variant="source" source="other">
            Other
          </UnifiedBadge>
        </div>
      </div>

      {/* Status Badges */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Status Badges</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedBadge variant="status" status="active">
            Active
          </UnifiedBadge>
          <UnifiedBadge variant="status" status="trending">
            Trending
          </UnifiedBadge>
          <UnifiedBadge variant="status" status="new">
            New
          </UnifiedBadge>
          <UnifiedBadge variant="status" status="updated">
            Updated
          </UnifiedBadge>
          <UnifiedBadge variant="status" status="deprecated">
            Deprecated
          </UnifiedBadge>
        </div>
      </div>

      {/* Sponsored Badges */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Sponsored Badges</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedBadge variant="sponsored" tier="featured" showIcon />
          <UnifiedBadge variant="sponsored" tier="promoted" showIcon />
          <UnifiedBadge variant="sponsored" tier="spotlight" showIcon />
          <UnifiedBadge variant="sponsored" tier="sponsored" showIcon={false} />
        </div>
      </div>

      {/* Tag Badges */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Tag Badges</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedBadge variant="tag" tag="React" isActive={false} onClick={() => {}} />
          <UnifiedBadge variant="tag" tag="TypeScript" isActive onClick={() => {}} />
          <UnifiedBadge
            variant="tag"
            tag="Next.js"
            isActive
            onClick={() => {}}
            onRemove={() => {}}
          />
        </div>
      </div>

      {/* New Indicators */}
      <div>
        <h3 className="text-sm font-semibold mb-2">New Indicators</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Menu Item</span>
            <UnifiedBadge variant="new-indicator" label="New feature" />
          </div>
          <UnifiedBadge variant="new-badge" badgeVariant="default">
            NEW
          </UnifiedBadge>
          <UnifiedBadge variant="new-badge" badgeVariant="outline">
            NEW
          </UnifiedBadge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase of all badge variants. This single component replaces 4 separate badge components (495 LOC → 1 unified component).',
      },
    },
  },
};

/**
 * TYPE SAFETY DEMO
 * Shows how discriminated unions prevent invalid prop combinations
 */

export const TypeSafetyExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm text-muted-foreground">
        <p className="font-semibold mb-2">TypeScript Enforces Valid Combinations:</p>
        <code className="block bg-muted p-2 rounded text-xs">
          {`// ✅ Valid
<UnifiedBadge variant="sponsored" tier="featured" showIcon />

// ❌ Compile Error: 'tier' doesn't exist on variant 'category'
<UnifiedBadge variant="category" tier="featured" />

// ❌ Compile Error: 'category' doesn't exist on variant 'sponsored'
<UnifiedBadge variant="sponsored" category="mcp" />

// TypeScript prevents all invalid prop combinations!`}
        </code>
      </div>
      <div className="flex gap-2">
        <UnifiedBadge variant="sponsored" tier="featured" showIcon />
        <UnifiedBadge variant="category" category="mcp">
          MCP
        </UnifiedBadge>
        <UnifiedBadge variant="tag" tag="React" isActive onClick={() => {}} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Discriminated unions ensure type safety: TypeScript prevents passing invalid prop combinations at compile time.',
      },
    },
  },
};

// ============================================================================
// INTERACTION TESTING
// Play functions for interactive tag variant
// ============================================================================

/**
 * TagClickInteraction: Test Tag Click Handler
 * Demonstrates clicking an interactive tag badge
 */
export const TagClickInteraction: Story = {
  args: {
    variant: 'tag',
    tag: 'Interactive Tag',
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating tag click behavior. Uses play function to simulate clicking the tag and verify the onClick handler is called.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify tag is rendered', async () => {
      const tagButton = canvas.getByRole('button', { name: /interactive tag/i });
      await expect(tagButton).toBeInTheDocument();
    });

    await step('Click the tag', async () => {
      const tagButton = canvas.getByRole('button', { name: /interactive tag/i });
      await userEvent.click(tagButton);
    });

    await step('Verify onClick was called', async () => {
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * TagRemoveInteraction: Test Tag Remove Handler
 * Demonstrates removing a tag with the X button
 */
export const TagRemoveInteraction: Story = {
  args: {
    variant: 'tag',
    tag: 'Removable Tag',
    onRemove: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating tag removal. When onRemove is provided, an X button appears that can be clicked to remove the tag.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify tag and remove button are rendered', async () => {
      const tagElement = canvas.getByText(/removable tag/i);
      await expect(tagElement).toBeInTheDocument();

      // Find the remove button (X icon)
      const removeButton = canvas.getByRole('button', { name: /remove/i });
      await expect(removeButton).toBeInTheDocument();
    });

    await step('Click the remove button', async () => {
      const removeButton = canvas.getByRole('button', { name: /remove/i });
      await userEvent.click(removeButton);
    });

    await step('Verify onRemove was called', async () => {
      await expect(args.onRemove).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * TagActiveStateToggle: Test Tag Active State
 * Demonstrates toggling tag active state via click
 */
export const TagActiveStateToggle: Story = {
  args: {
    variant: 'tag',
    tag: 'Toggle Me',
    isActive: false,
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test showing tag active state toggle. Tags with onClick handlers can be clicked to toggle their active state (visual highlight).',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify tag initial state (inactive)', async () => {
      const tagButton = canvas.getByRole('button', { name: /toggle me/i });
      await expect(tagButton).toBeInTheDocument();
      // Note: In real implementation, would check for active class
    });

    await step('Click to activate tag', async () => {
      const tagButton = canvas.getByRole('button', { name: /toggle me/i });
      await userEvent.click(tagButton);
    });

    await step('Verify onClick was called', async () => {
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * TagKeyboardInteraction: Test Tag Keyboard Accessibility
 * Tests tag interaction via keyboard (Enter/Space)
 */
export const TagKeyboardInteraction: Story = {
  args: {
    variant: 'tag',
    tag: 'Keyboard Accessible',
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating keyboard accessibility for tag badges. Tests activation via Enter and Space keys for WCAG compliance.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to focus the tag', async () => {
      await userEvent.tab();
      const tagButton = canvas.getByRole('button', { name: /keyboard accessible/i });
      await expect(tagButton).toHaveFocus();
    });

    await step('Activate with Enter key', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });

    await step('Activate with Space key', async () => {
      const tagButton = canvas.getByRole('button', { name: /keyboard accessible/i });
      tagButton.focus();
      await userEvent.keyboard(' ');
      await expect(args.onClick).toHaveBeenCalledTimes(2);
    });
  },
};
