import type { Meta, StoryObj } from '@storybook/react';
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
    },
    showActions: {
      control: 'boolean',
      description: 'Show action buttons',
    },
    showAuthor: {
      control: 'boolean',
      description: 'Show author in footer',
    },
    disableNavigation: {
      control: 'boolean',
      description: 'Disable card click navigation',
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
