import type { Meta, StoryObj } from '@storybook/react';
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
    onClick: () => {},
  },
};

export const TagActive: Story = {
  args: {
    variant: 'tag',
    tag: 'TypeScript',
    isActive: true,
    onClick: () => {},
  },
};

export const TagWithRemove: Story = {
  args: {
    variant: 'tag',
    tag: 'Next.js',
    isActive: true,
    onClick: () => {},
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

/**
 * MobileSmall: Small Mobile Viewport (320px)
 * Tests component on smallest modern mobile devices
 */
export const MobileSmall: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  },
};

/**
 * MobileLarge: Large Mobile Viewport (414px)
 * Tests component on larger modern mobile devices
 */
export const MobileLarge: Story = {
  globals: {
    viewport: { value: 'mobile2' },
  },
};

/**
 * Tablet: Tablet Viewport (834px)
 * Tests component on tablet devices
 */
export const Tablet: Story = {
  globals: {
    viewport: { value: 'tablet' },
  },
};

/**
 * DarkTheme: Dark Mode Theme
 * Tests component appearance in dark mode
 */
export const DarkTheme: Story = {
  globals: {
    theme: 'dark',
  },
};

/**
 * LightTheme: Light Mode Theme
 * Tests component appearance in light mode
 */
export const LightTheme: Story = {
  globals: {
    theme: 'light',
  },
};
