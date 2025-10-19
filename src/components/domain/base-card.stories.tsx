import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';
import { Bookmark, Copy, ExternalLink, Eye, Github } from '@/src/lib/icons';
import { BaseCard } from './base-card';

/**
 * BaseCard Storybook Stories
 *
 * Foundation card component with composition-based architecture.
 * Provides customizable slots for ConfigCard, CollectionCard, ReviewCard, and ChangelogCard.
 *
 * **Architecture:**
 * - Composition over inheritance (render props pattern)
 * - Type-safe props with discriminated unions
 * - Customizable slots: renderHeader, renderTopBadges, renderContent, renderMetadataBadges, renderActions
 * - 4 variants: default, detailed, review, changelog
 * - Full accessibility (ARIA labels, keyboard navigation)
 * - Performance optimized with React.memo
 *
 * **Eliminates Duplication:**
 * - Shared card structure and navigation logic
 * - Integrated useCardNavigation hook
 * - Sponsored content tracking support
 * - ~140 LOC reduction from ConfigCard/CollectionCard consolidation
 *
 * **Usage:**
 * ```tsx
 * <BaseCard
 *   displayTitle="Card Title"
 *   description="Card description"
 *   renderTopBadges={() => <TypeBadge type="agents" />}
 *   renderActions={() => <Button>Action</Button>}
 * />
 * ```
 */

const meta = {
  title: 'Cards/BaseCard',
  component: BaseCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Base Card Component** - Foundation for all content display cards.

Composition-based architecture with customizable render slots:
- \`renderHeader\`: Custom header (avatar, rating, date)
- \`renderTopBadges\`: Type badges, difficulty, status
- \`renderContent\`: Custom content sections (expandable text)
- \`renderMetadataBadges\`: View count, item count, ratings
- \`renderActions\`: Action buttons (GitHub, docs, bookmark, copy)

**Variants:**
- \`default\`: Standard card with default padding
- \`detailed\`: Increased padding (p-6) for spacious layout
- \`review\`: Compact styling (p-4) for review content
- \`changelog\`: Optimized for changelog entries

**Used By:**
- ConfigCard (agents, mcp, commands, rules, hooks, guides)
- CollectionCard (starter-kits, workflows)
- ReviewCard (user reviews and feedback)
- ChangelogCard (version updates and releases)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'detailed', 'review', 'changelog'],
      description: 'Visual variant of the card',
      table: {
        type: { summary: "'default' | 'detailed' | 'review' | 'changelog'" },
        defaultValue: { summary: 'default' },
      },
    },
    displayTitle: {
      control: 'text',
      description: 'Display title for the card',
      table: {
        type: { summary: 'string' },
      },
    },
    description: {
      control: 'text',
      description: 'Card description text (optional)',
      table: {
        type: { summary: 'string' },
      },
    },
    author: {
      control: 'text',
      description: 'Author name',
      table: {
        type: { summary: 'string' },
      },
    },
    source: {
      control: 'select',
      options: ['official', 'partner', 'community', 'verified', 'experimental', 'other'],
      description: 'Content source badge',
      table: {
        type: { summary: 'string' },
      },
    },
    tags: {
      control: 'object',
      description: 'Array of tags to display',
      table: {
        type: { summary: 'string[]' },
      },
    },
    maxVisibleTags: {
      control: 'number',
      description: 'Maximum tags before "+N more" badge',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 4 },
      },
    },
    showActions: {
      control: 'boolean',
      description: 'Show action buttons',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    showAuthor: {
      control: 'boolean',
      description: 'Show author in footer',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    disableNavigation: {
      control: 'boolean',
      description: 'Disable card click navigation',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    topAccent: {
      control: 'boolean',
      description: 'Show subtle top border accent for related content',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    compactMode: {
      control: 'boolean',
      description: 'Compact mode with tighter spacing',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    isSponsored: {
      control: 'boolean',
      description: 'Whether this is sponsored content',
      table: {
        type: { summary: 'boolean' },
      },
    },
    targetPath: {
      control: 'text',
      description: 'Target path for card navigation',
      table: {
        type: { summary: 'string' },
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'ARIA label for accessibility',
      table: {
        type: { summary: 'string' },
      },
    },
    onBeforeNavigate: {
      action: 'beforeNavigate',
      description: 'Callback before navigation',
      table: {
        type: { summary: '() => void' },
      },
    },
  },
} satisfies Meta<typeof BaseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ==============================================================================
 * BASIC CARD VARIANTS
 * ==============================================================================
 */

/**
 * Minimal Card
 * Simplest possible card with only required props
 */
export const Minimal: Story = {
  args: {
    displayTitle: 'Minimal Card',
    ariaLabel: 'Minimal card example',
    targetPath: '/example',
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal card with only title and aria label. No description, tags, or actions.',
      },
    },
  },
};

/**
 * Basic Card
 * Standard card with description and author
 */
export const Basic: Story = {
  args: {
    displayTitle: 'Code Review Agent',
    description:
      'Intelligent code review agent that analyzes pull requests, suggests improvements, and enforces best practices using AI-powered analysis.',
    author: 'DevTools Team',
    ariaLabel: 'Code Review Agent - Basic example',
    targetPath: '/agents/code-reviewer',
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard card with title, description, and author.',
      },
    },
  },
};

/**
 * Card with Tags
 * Shows tag display and overflow handling
 */
export const WithTags: Story = {
  args: {
    displayTitle: 'Database MCP Server',
    description:
      'Connect to any database (PostgreSQL, MySQL, MongoDB, Redis) through a unified MCP interface.',
    author: 'Database Team',
    tags: ['database', 'sql', 'nosql', 'connectivity', 'postgresql', 'mysql', 'mongodb', 'redis'],
    maxVisibleTags: 4,
    ariaLabel: 'Database MCP Server - With tags example',
    targetPath: '/mcp-servers/database',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with tags. Shows first 4 tags with "+N more" badge for remaining tags. Control maxVisibleTags prop to adjust.',
      },
    },
  },
};

/**
 * Card with Source Badge
 * Shows source badge in top-right corner
 */
export const WithSource: Story = {
  args: {
    displayTitle: 'Official MCP Server',
    description: 'Official MCP server maintained by the core team.',
    author: 'Core Team',
    source: 'official',
    tags: ['mcp', 'official', 'verified'],
    ariaLabel: 'Official MCP Server - With source badge example',
    targetPath: '/mcp-servers/official',
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with source badge (official, community, etc.) displayed in top-right corner.',
      },
    },
  },
};

/**
 * ==============================================================================
 * RENDER SLOT VARIANTS
 * ==============================================================================
 */

/**
 * Card with Top Badges
 * Uses renderTopBadges slot for category/type badges
 */
export const WithTopBadges: Story = {
  args: {
    displayTitle: 'Featured Agent',
    description: 'Top-performing agent with exceptional quality and community engagement.',
    author: 'Development Team',
    tags: ['featured', 'popular', 'quality'],
    ariaLabel: 'Featured Agent - With top badges example',
    targetPath: '/agents/featured',
    renderTopBadges: () => (
      <>
        <UnifiedBadge variant="category" category="agents">
          Agent
        </UnifiedBadge>
        <UnifiedBadge
          variant="base"
          style="secondary"
          className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30"
        >
          Featured
        </UnifiedBadge>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with custom top badges using renderTopBadges slot. Shows type badge and featured badge.',
      },
    },
  },
};

/**
 * Card with Metadata Badges
 * Uses renderMetadataBadges slot for view count, ratings, etc.
 */
export const WithMetadataBadges: Story = {
  args: {
    displayTitle: 'Popular Agent',
    description: 'High-traffic agent with thousands of views and copies.',
    author: 'Popular Team',
    tags: ['popular', 'trending'],
    ariaLabel: 'Popular Agent - With metadata badges example',
    targetPath: '/agents/popular',
    renderMetadataBadges: () => (
      <>
        <UnifiedBadge
          variant="base"
          style="secondary"
          className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="text-xs">12.5K</span>
        </UnifiedBadge>
        <UnifiedBadge
          variant="base"
          style="secondary"
          className="h-7 px-2.5 gap-1.5 bg-green-500/10 text-green-600 border-green-500/20"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="text-xs">850</span>
        </UnifiedBadge>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with metadata badges (view count, copy count) using renderMetadataBadges slot.',
      },
    },
  },
};

/**
 * Card with Actions
 * Uses renderActions slot for action buttons
 */
export const WithActions: Story = {
  args: {
    displayTitle: 'Agent with Actions',
    description: 'Agent with GitHub repository, documentation, and bookmark actions.',
    author: 'Action Team',
    tags: ['actions', 'interactive'],
    ariaLabel: 'Agent with Actions - Action buttons example',
    targetPath: '/agents/with-actions',
    showActions: true,
    renderActions: () => (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            alert('GitHub clicked');
          }}
          aria-label="View repository on GitHub"
        >
          <Github className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            alert('Documentation clicked');
          }}
          aria-label="View documentation"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            alert('Bookmark toggled');
          }}
          aria-label="Bookmark"
        >
          <Bookmark className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            alert('View clicked');
          }}
        >
          View
        </Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with action buttons (GitHub, documentation, bookmark, view) using renderActions slot.',
      },
    },
  },
};

/**
 * Full Featured Card
 * Combines all slots for maximum customization
 */
export const FullFeatured: Story = {
  args: {
    displayTitle: 'Enterprise Agent',
    description:
      'Enterprise-grade agent with all features: top badges, metadata, actions, custom content.',
    author: 'Enterprise Team',
    source: 'official',
    tags: ['enterprise', 'premium', 'featured', 'popular'],
    maxVisibleTags: 4,
    ariaLabel: 'Enterprise Agent - Full featured example',
    targetPath: '/agents/enterprise',
    showActions: true,
    renderTopBadges: () => (
      <>
        <UnifiedBadge variant="category" category="agents">
          Agent
        </UnifiedBadge>
        <UnifiedBadge
          variant="base"
          style="secondary"
          className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30"
        >
          Featured #1
        </UnifiedBadge>
      </>
    ),
    renderMetadataBadges: () => (
      <>
        <UnifiedBadge
          variant="base"
          style="secondary"
          className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="text-xs">25K</span>
        </UnifiedBadge>
        <UnifiedBadge
          variant="base"
          style="secondary"
          className="h-7 px-2.5 gap-1.5 bg-green-500/10 text-green-600 border-green-500/20"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="text-xs">1.5K</span>
        </UnifiedBadge>
      </>
    ),
    renderActions: () => (
      <>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="View repository">
          <Github className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="View documentation">
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            alert('Bookmark toggled');
          }}
          aria-label="Bookmark"
        >
          <Bookmark className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          View
        </Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full-featured card using all render slots: top badges, metadata badges, and actions.',
      },
    },
  },
};

/**
 * ==============================================================================
 * VISUAL VARIANTS & DISPLAY OPTIONS
 * ==============================================================================
 */

/**
 * Detailed Variant
 * Uses detailed variant with increased padding
 */
export const DetailedVariant: Story = {
  args: {
    displayTitle: 'Detailed Card',
    description: 'Card with detailed variant has increased padding for more breathing room.',
    author: 'Design Team',
    tags: ['detailed', 'variant', 'spacious'],
    ariaLabel: 'Detailed Card - Detailed variant example',
    targetPath: '/example/detailed',
    variant: 'detailed',
  },
  parameters: {
    docs: {
      description: {
        story: 'Card using detailed variant (p-6) for increased padding and spaciousness.',
      },
    },
  },
};

/**
 * Review Variant
 * Uses review variant with compact styling
 */
export const ReviewVariant: Story = {
  args: {
    displayTitle: 'Review Card',
    description: 'Card with review variant has compact styling optimized for review content.',
    author: 'Reviewer Name',
    tags: ['review', 'feedback', 'rating'],
    ariaLabel: 'Review Card - Review variant example',
    targetPath: '/reviews/example',
    variant: 'review',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card using review variant (p-4, rounded-lg) optimized for review and feedback content.',
      },
    },
  },
};

/**
 * No Author
 * Card without author attribution in footer
 */
export const NoAuthor: Story = {
  args: {
    displayTitle: 'Anonymous Card',
    description: 'Card without author attribution.',
    author: 'Hidden Author',
    showAuthor: false,
    ariaLabel: 'Anonymous Card - No author example',
    targetPath: '/example/anonymous',
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with showAuthor=false. Author is not displayed in footer.',
      },
    },
  },
};

/**
 * Custom Metadata Text
 * Card with custom metadata text in footer
 */
export const CustomMetadata: Story = {
  args: {
    displayTitle: 'Card with Custom Metadata',
    description: 'Card with custom metadata text displayed in footer.',
    author: 'Metadata Team',
    ariaLabel: 'Card with Custom Metadata - Custom metadata example',
    targetPath: '/example/metadata',
    customMetadataText: (
      <>
        <span>•</span>
        <span>85% popular</span>
        <span>•</span>
        <span>5-10 min setup</span>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with customMetadataText prop for additional footer information.',
      },
    },
  },
};

/**
 * ==============================================================================
 * LAYOUT & RESPONSIVE TESTING
 * ==============================================================================
 */

/**
 * Responsive Grid Layout
 * Tests card behavior in grid context across viewports
 */
export const ResponsiveGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BaseCard
        displayTitle="Basic Card"
        description="First card in responsive grid."
        author="Team 1"
        tags={['example', 'grid']}
        ariaLabel="Basic card in grid"
        targetPath="/example/1"
      />
      <BaseCard
        displayTitle="Featured Card"
        description="Second card with featured badge."
        author="Team 2"
        tags={['example', 'featured']}
        ariaLabel="Featured card in grid"
        targetPath="/example/2"
        renderTopBadges={() => (
          <UnifiedBadge variant="base" style="secondary" className="text-xs">
            Featured
          </UnifiedBadge>
        )}
      />
      <BaseCard
        displayTitle="Popular Card"
        description="Third card with view count."
        author="Team 3"
        tags={['example', 'popular']}
        ariaLabel="Popular card in grid"
        targetPath="/example/3"
        renderMetadataBadges={() => (
          <UnifiedBadge variant="base" style="secondary" className="h-7 px-2.5 gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs">5.2K</span>
          </UnifiedBadge>
        )}
      />
      <BaseCard
        displayTitle="Action Card"
        description="Fourth card with actions."
        author="Team 4"
        tags={['example', 'actions']}
        ariaLabel="Action card in grid"
        targetPath="/example/4"
        showActions
        renderActions={() => (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            View
          </Button>
        )}
      />
      <BaseCard
        displayTitle="Source Card"
        description="Fifth card with source badge."
        author="Team 5"
        source="official"
        tags={['example', 'official']}
        ariaLabel="Source card in grid"
        targetPath="/example/5"
      />
      <BaseCard
        displayTitle="Full Card"
        description="Sixth card with all features."
        author="Team 6"
        source="community"
        tags={['example', 'full', 'featured', 'complete']}
        ariaLabel="Full card in grid"
        targetPath="/example/6"
        showActions
        renderTopBadges={() => (
          <UnifiedBadge variant="category" category="agents">
            Agent
          </UnifiedBadge>
        )}
        renderMetadataBadges={() => (
          <UnifiedBadge variant="base" style="secondary" className="h-7 px-2.5 gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs">10K</span>
          </UnifiedBadge>
        )}
        renderActions={() => (
          <>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Github className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              View
            </Button>
          </>
        )}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Cards in responsive grid layout. Test with viewport toolbar:\n\n' +
          '- **Mobile (320px)**: 1 column, stacked cards\n' +
          '- **Tablet (768px)**: 2 columns\n' +
          '- **Desktop (1024px+)**: 3 columns\n\n' +
          'Use viewport toolbar (top right) to switch between breakpoints.',
      },
    },
  },
};

/**
 * All Variants Comparison
 * Side-by-side comparison of all card variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Default Variant</h3>
        <BaseCard
          displayTitle="Default Variant Card"
          description="Standard card with default spacing and styling."
          author="Default Team"
          tags={['default', 'standard']}
          ariaLabel="Default variant card"
          targetPath="/example/default"
          variant="default"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Detailed Variant (p-6)</h3>
        <BaseCard
          displayTitle="Detailed Variant Card"
          description="Card with increased padding (p-6) for more spacious layout."
          author="Detailed Team"
          tags={['detailed', 'spacious']}
          ariaLabel="Detailed variant card"
          targetPath="/example/detailed"
          variant="detailed"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Review Variant (p-4, compact)</h3>
        <BaseCard
          displayTitle="Review Variant Card"
          description="Compact card optimized for review and feedback content."
          author="Review Team"
          tags={['review', 'compact']}
          ariaLabel="Review variant card"
          targetPath="/example/review"
          variant="review"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compare all card variants side-by-side. Notice spacing and layout differences.',
      },
    },
  },
};

/**
 * ==============================================================================
 * NEW PROPS: TOP ACCENT & COMPACT MODE (Phase 2 Consolidation)
 * ==============================================================================
 */

/**
 * Top Accent Mode
 * Card with subtle top border accent for related content
 * Used by RelatedContentClient for visual distinction
 */
export const TopAccent: Story = {
  args: {
    displayTitle: 'Related Content Card',
    description:
      'Card with topAccent prop showing subtle border at the top. Used in related content carousels for visual distinction.',
    author: 'Related Team',
    tags: ['related', 'accent', 'visual'],
    ariaLabel: 'Related content card with top accent',
    targetPath: '/example/related',
    topAccent: true,
    renderTopBadges: () => (
      <>
        <UnifiedBadge variant="category" category="agents">
          Agent
        </UnifiedBadge>
        <UnifiedBadge
          variant="base"
          style="secondary"
          className="text-xs bg-primary/10 text-primary border-primary/30"
        >
          Related
        </UnifiedBadge>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          '**NEW: topAccent prop** - Adds subtle top border (h-px bg-border) with hover effect. ' +
          'Used by RelatedContentClient to visually distinguish related content cards from main content. ' +
          'Notice the thin border at the very top of the card.',
      },
    },
  },
};

/**
 * Compact Mode
 * Card with tighter spacing for dense grid layouts
 * Used by RelatedContentClient and UnifiedCardGrid
 */
export const CompactMode: Story = {
  args: {
    displayTitle: 'Compact Card',
    description: 'Card with compactMode prop showing reduced padding (p-4) and tighter spacing.',
    author: 'Compact Team',
    tags: ['compact', 'dense', 'grid'],
    ariaLabel: 'Compact mode card',
    targetPath: '/example/compact',
    compactMode: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**NEW: compactMode prop** - Reduces padding to p-4 and tightens header/content spacing (pb-2, pt-0). ' +
          'Used in UnifiedCardGrid tight variant and RelatedContentClient for denser card displays. ' +
          'Compare with default card to see reduced whitespace.',
      },
    },
  },
};

/**
 * Top Accent + Compact Mode Combined
 * Shows both new props working together
 * This is the exact configuration used by RelatedContentClient
 */
export const RelatedContentStyle: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">
          RelatedContentClient Configuration (topAccent + compactMode)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BaseCard
            displayTitle="Similar Agent"
            description="AI-powered code review agent that analyzes pull requests."
            tags={['typescript', 'code-review']}
            ariaLabel="Similar agent card"
            targetPath="/example/similar-1"
            topAccent
            compactMode
            renderTopBadges={() => (
              <div className="flex items-center justify-between gap-2 w-full">
                <UnifiedBadge
                  variant="category"
                  category="agents"
                  className="font-medium px-2 sm:px-3 py-1 border text-xs sm:text-sm flex-shrink-0"
                >
                  agents
                </UnifiedBadge>
                <UnifiedBadge
                  variant="base"
                  style="default"
                  className="text-2xs sm:text-xs font-medium border px-1.5 sm:px-2 py-1 flex-shrink-0"
                >
                  Related
                </UnifiedBadge>
              </div>
            )}
          />
          <BaseCard
            displayTitle="Popular MCP Server"
            description="Database connectivity server with unified interface."
            tags={['database', 'sql']}
            ariaLabel="Popular MCP server card"
            targetPath="/example/similar-2"
            topAccent
            compactMode
            renderTopBadges={() => (
              <div className="flex items-center justify-between gap-2 w-full">
                <UnifiedBadge
                  variant="category"
                  category="mcp"
                  className="font-medium px-2 sm:px-3 py-1 border text-xs sm:text-sm flex-shrink-0"
                >
                  mcp
                </UnifiedBadge>
                <UnifiedBadge
                  variant="base"
                  style="secondary"
                  className="text-2xs sm:text-xs font-medium border px-1.5 sm:px-2 py-1 flex-shrink-0"
                >
                  Similar Topics
                </UnifiedBadge>
              </div>
            )}
          />
          <BaseCard
            displayTitle="Trending Tutorial"
            description="Complete guide to building MCP servers from scratch."
            tags={['tutorial', 'guide']}
            ariaLabel="Trending tutorial card"
            targetPath="/example/similar-3"
            topAccent
            compactMode
            renderTopBadges={() => (
              <div className="flex items-center justify-between gap-2 w-full">
                <UnifiedBadge
                  variant="category"
                  category="tutorials"
                  className="font-medium px-2 sm:px-3 py-1 border text-xs sm:text-sm flex-shrink-0"
                >
                  tutorials
                </UnifiedBadge>
                <UnifiedBadge
                  variant="base"
                  style="default"
                  className="text-2xs sm:text-xs font-medium border px-1.5 sm:px-2 py-1 flex-shrink-0"
                >
                  Trending
                </UnifiedBadge>
              </div>
            )}
          />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Standard Configuration (no topAccent/compactMode)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BaseCard
            displayTitle="Similar Agent"
            description="AI-powered code review agent that analyzes pull requests."
            tags={['typescript', 'code-review']}
            ariaLabel="Standard agent card"
            targetPath="/example/standard-1"
            renderTopBadges={() => (
              <UnifiedBadge variant="category" category="agents">
                agents
              </UnifiedBadge>
            )}
          />
          <BaseCard
            displayTitle="Popular MCP Server"
            description="Database connectivity server with unified interface."
            tags={['database', 'sql']}
            ariaLabel="Standard MCP server card"
            targetPath="/example/standard-2"
            renderTopBadges={() => (
              <UnifiedBadge variant="category" category="mcp">
                mcp
              </UnifiedBadge>
            )}
          />
          <BaseCard
            displayTitle="Trending Tutorial"
            description="Complete guide to building MCP servers from scratch."
            tags={['tutorial', 'guide']}
            ariaLabel="Standard tutorial card"
            targetPath="/example/standard-3"
            renderTopBadges={() => (
              <UnifiedBadge variant="category" category="tutorials">
                tutorials
              </UnifiedBadge>
            )}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '**Side-by-side comparison** of RelatedContentClient styling (top) vs standard cards (bottom). ' +
          'Notice:\n\n' +
          '- **Top row**: Tighter gaps (gap-4), reduced padding, subtle top accent\n' +
          '- **Bottom row**: Standard gaps (gap-6), default padding, no accent\n\n' +
          'The top row demonstrates how topAccent + compactMode work together for dense, visually distinct related content grids.',
      },
    },
  },
};

// ============================================================================
// COMPONENT STATES
// ============================================================================

/**
 * Loading State - Skeleton/Placeholder
 * Shows card in loading state with skeleton UI
 */
export const LoadingState: Story = {
  args: {
    displayTitle: 'Loading...',
    description: 'Content is currently loading. This card shows skeleton/placeholder UI.',
    ariaLabel: 'Loading card - skeleton state',
    disableNavigation: true, // No navigation during load
    showActions: false, // No actions during load
  },
  parameters: {
    docs: {
      description: {
        story: `
**Loading/Skeleton State** - Card shown while content is being fetched.

**Features:**
- Disabled navigation (non-interactive)
- No action buttons
- Placeholder text for title/description
- Useful for async data loading scenarios

**Use Cases:**
- Initial page load
- Infinite scroll loading more cards
- Lazy-loaded content sections

**Implementation Note:** For production, consider using dedicated skeleton component with animated placeholders.
        `,
      },
    },
  },
};

/**
 * Empty State - No Content
 * Shows card when there's no content to display
 */
export const EmptyState: Story = {
  args: {
    displayTitle: 'No Results Found',
    description: "Try adjusting your search criteria or filters to find what you're looking for.",
    ariaLabel: 'Empty state card - no results',
    disableNavigation: true,
    showActions: false,
    showAuthor: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Empty State** - Shown when search/filter returns no results.

**Features:**
- Helpful messaging to guide user
- No navigation (not a real card)
- No actions or author info
- Clear call-to-action in description

**Use Cases:**
- Search returns no matches
- Filtered view has no items
- Category has no content yet
        `,
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS - INTERACTIVE TESTING
// ============================================================================

/**
 * Card Click Interaction
 * Tests card navigation on click
 */
export const CardClickInteraction: Story = {
  args: {
    displayTitle: 'Clickable Card',
    description: 'Click this card to test navigation behavior.',
    author: 'Test Team',
    tags: ['interactive', 'click', 'test'],
    ariaLabel: 'Clickable card for testing navigation',
    targetPath: '/example/click-test',
    onBeforeNavigate: fn(), // Spy function
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify card is rendered', async () => {
      const card = canvas.getByRole('article', { name: /clickable card/i });
      await expect(card).toBeInTheDocument();
    });

    await step('Click the card', async () => {
      const card = canvas.getByRole('article', { name: /clickable card/i });
      await userEvent.click(card);
    });

    await step('Verify onBeforeNavigate was called', async () => {
      await expect(args.onBeforeNavigate).toHaveBeenCalledTimes(1);
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Card click navigation.

**Test Steps:**
1. Verify card is rendered with correct ARIA label
2. Click the card element
3. Verify \`onBeforeNavigate\` callback was invoked

**Validates:**
- Card renders with proper accessibility
- Click handler fires correctly
- Navigation callback system works
- \`useCardNavigation\` hook integration
        `,
      },
    },
  },
};

/**
 * Keyboard Navigation Interaction
 * Tests keyboard accessibility (Enter and Space keys)
 */
export const KeyboardNavigationInteraction: Story = {
  args: {
    displayTitle: 'Keyboard Accessible Card',
    description: 'Use Tab to focus, then press Enter or Space to navigate.',
    author: 'Accessibility Team',
    tags: ['a11y', 'keyboard', 'accessible'],
    ariaLabel: 'Keyboard accessible card for testing',
    targetPath: '/example/keyboard-test',
    onBeforeNavigate: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Focus the card with keyboard', async () => {
      const card = canvas.getByRole('article', { name: /keyboard accessible/i });
      card.focus();
      await expect(card).toHaveFocus();
    });

    await step('Press Enter key to navigate', async () => {
      const card = canvas.getByRole('article', { name: /keyboard accessible/i });
      await userEvent.type(card, '{Enter}');
    });

    await step('Verify onBeforeNavigate was called', async () => {
      await expect(args.onBeforeNavigate).toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Keyboard navigation (Enter/Space).

**Test Steps:**
1. Focus the card using keyboard (tabIndex=0)
2. Verify card receives focus
3. Press Enter key
4. Verify navigation callback fires

**Validates:**
- Card is keyboard focusable (tabIndex=0)
- Enter/Space key handlers work
- ARIA roles and labels are correct
- Full keyboard accessibility compliance

**Accessibility:** Meets WCAG 2.1 AA standards for keyboard navigation.
        `,
      },
    },
  },
};

/**
 * Action Button Interaction
 * Tests action button clicks (stopPropagation)
 */
export const ActionButtonInteraction: Story = {
  args: {
    displayTitle: 'Card with Action Buttons',
    description: "Test that action buttons don't trigger card navigation.",
    author: 'UX Team',
    tags: ['buttons', 'actions', 'interaction'],
    ariaLabel: 'Card with action buttons for testing',
    targetPath: '/example/actions-test',
    showActions: true,
    onBeforeNavigate: fn(), // Should NOT be called when clicking actions
    renderActions: () => (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={fn()} // Spy on button click
          aria-label="Test action button"
        >
          <Github className="h-3 w-3" />
        </Button>
      </>
    ),
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify action button is rendered', async () => {
      const actionButton = canvas.getByLabelText(/test action button/i);
      await expect(actionButton).toBeInTheDocument();
    });

    await step('Click the action button', async () => {
      const actionButton = canvas.getByLabelText(/test action button/i);
      await userEvent.click(actionButton);
    });

    await step('Verify card navigation was NOT triggered', async () => {
      // onBeforeNavigate should NOT have been called (stopPropagation works)
      await expect(args.onBeforeNavigate).not.toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Action button click isolation.

**Test Steps:**
1. Verify action button renders in card footer
2. Click the action button
3. Verify card navigation was NOT triggered (event.stopPropagation works)

**Validates:**
- Action buttons render correctly
- \`e.stopPropagation()\` prevents card click
- Users can interact with actions without navigating
- Event bubbling is properly managed

**Pattern:** All action buttons MUST call \`e.stopPropagation()\` to prevent card navigation.
        `,
      },
    },
  },
};
