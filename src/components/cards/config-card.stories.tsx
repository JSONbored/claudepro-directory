/**
 * ConfigCard Storybook Stories
 *
 * Component isolation and responsive viewport testing for ConfigCard.
 * Tests all variants, states, and responsive behavior across breakpoints.
 *
 * **Usage:**
 * ```bash
 * npm run storybook
 * # Navigate to Features → Content → ConfigCard
 * # Use viewport toolbar to test mobile/tablet/desktop
 * ```
 *
 * **Viewport Testing:**
 * - Use Storybook's viewport toolbar (top right) to switch between:
 *   - Mobile (320px) - Single column layout
 *   - Tablet (768px) - Two column layout
 *   - Desktop (1024px) - Three column layout
 *   - Wide (1280px) - Full width layout
 *   - Ultra (1920px) - Maximum width layout
 *
 * **Why This Matters:**
 * - Fast iteration: Change code, see results instantly
 * - Test all variants: Default, featured, sponsored, new, collection
 * - Responsive testing: One-click viewport switching
 * - Visual QA: Compare variants side-by-side
 * - Living documentation: Component API and usage examples
 *
 * @see src/components/features/content/config-card.tsx - Component implementation
 * @see RESPONSIVE_DESIGN.md - Responsive design architecture
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { ConfigCard } from './config-card';

/**
 * ConfigCard Meta Configuration
 * Defines component metadata and global settings for all stories
 */
const meta = {
  title: 'Cards/ConfigCard',
  component: ConfigCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays configuration content (agents, MCP servers, commands, rules, hooks, guides, collections) with consistent card structure. Built on BaseCard with support for featured items, sponsored content, ratings, and responsive layouts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Visual variant of the card',
    },
    showCategory: {
      control: 'boolean',
      description: 'Show category badge',
    },
    showActions: {
      control: 'boolean',
      description: 'Show action buttons',
    },
  },
} satisfies Meta<typeof ConfigCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Sample Data
 * Realistic content items for story testing
 */
const sampleAgent: UnifiedContentItem = {
  slug: 'code-reviewer',
  title: 'Code Review Agent',
  description:
    'Intelligent code review agent that analyzes pull requests, suggests improvements, and enforces best practices using AI-powered analysis.',
  category: 'agents',
  author: 'DevTools Team',
  tags: ['code-review', 'quality', 'automation', 'ai'],
  repository: 'https://github.com/example/code-reviewer',
  documentationUrl: 'https://docs.example.com/code-reviewer',
  source: 'official',
  popularity: 85,
  isNew: false,
};

const sampleFeaturedAgent = {
  ...sampleAgent,
  slug: 'featured-agent',
  title: 'Featured AI Agent',
  description:
    "This week's top-performing agent selected by our algorithm. Exceptional quality, documentation, and community engagement.",
  _featured: {
    rank: 1,
    score: 98.5,
  },
  viewCount: 12500,
  copyCount: 850,
  _rating: {
    average: 4.8,
    count: 142,
  },
} as UnifiedContentItem;

const sampleSponsoredAgent = {
  ...sampleAgent,
  slug: 'sponsored-agent',
  title: 'Premium Enterprise Agent',
  description:
    'Enterprise-grade agent with advanced features, priority support, and professional documentation. Built for production environments.',
  isSponsored: true,
  sponsoredId: 'sponsor-123',
  sponsorTier: 'featured',
  position: 1,
  viewCount: 25000,
  copyCount: 1500,
} as UnifiedContentItem;

const sampleNewAgent: UnifiedContentItem = {
  ...sampleAgent,
  slug: 'new-agent',
  title: 'Brand New Agent',
  description: 'Just released! Fresh agent with cutting-edge features and modern architecture.',
  isNew: true,
  viewCount: 250,
};

const sampleMcpServer = {
  slug: 'database-connector',
  title: 'Database MCP Server',
  description:
    'Connect to any database (PostgreSQL, MySQL, MongoDB, Redis) through a unified MCP interface. Supports connection pooling and query optimization.',
  category: 'mcp',
  author: 'Database Team',
  tags: ['database', 'sql', 'nosql', 'connectivity'],
  repository: 'https://github.com/example/db-mcp',
  source: 'community',
  viewCount: 8500,
  copyCount: 420,
} as UnifiedContentItem;

const sampleCollection = {
  slug: 'enterprise-starter-kit',
  title: 'Enterprise Starter Kit',
  description:
    'Complete production-ready setup with authentication, database, API, monitoring, and deployment configuration. Perfect for enterprise applications.',
  category: 'collections',
  author: 'Architecture Team',
  tags: ['enterprise', 'starter', 'production', 'complete'],
  collectionType: 'starter-kit',
  difficulty: 'intermediate',
  itemCount: 12,
  viewCount: 15000,
  _rating: {
    average: 4.9,
    count: 89,
  },
} as UnifiedContentItem;

/**
 * Stories
 * Each story represents a specific state or variant of ConfigCard
 */

/**
 * Default Agent Card
 * Standard agent card with basic information
 */
export const DefaultAgent: Story = {
  args: {
    item: sampleAgent,
    variant: 'default',
    showCategory: true,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard agent card with category badge, tags, and action buttons.',
      },
    },
  },
};

/**
 * Featured Agent Card
 * Agent selected by weekly algorithm with #1 ranking
 * Shows BorderBeam animation, featured badge, and enhanced metrics
 */
export const FeaturedAgent: Story = {
  args: {
    item: sampleFeaturedAgent,
    variant: 'default',
    showCategory: true,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Featured agent with #1 ranking. Shows golden border beam animation, featured badge with rank, view count, copy count, and star rating.',
      },
    },
  },
};

/**
 * Sponsored Agent Card
 * Premium placement with sponsor badge and enhanced visibility
 */
export const SponsoredAgent: Story = {
  args: {
    item: sampleSponsoredAgent,
    variant: 'default',
    showCategory: true,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sponsored agent with premium placement. Shows sponsor badge, enhanced metrics, and priority positioning.',
      },
    },
  },
};

/**
 * New Agent Card
 * Recently added content with "New" indicator
 */
export const NewAgent: Story = {
  args: {
    item: sampleNewAgent,
    variant: 'default',
    showCategory: true,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Newly added agent (0-7 days old) with "New" indicator badge.',
      },
    },
  },
};

/**
 * MCP Server Card
 * Different category with distinct styling
 */
export const McpServer: Story = {
  args: {
    item: sampleMcpServer,
    variant: 'default',
    showCategory: true,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'MCP server card with category-specific badge and metrics.',
      },
    },
  },
};

/**
 * Collection Card
 * Shows collection-specific metadata (type, difficulty, item count)
 */
export const Collection: Story = {
  args: {
    item: sampleCollection,
    variant: 'default',
    showCategory: true,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Collection card with type badge (Starter Kit), difficulty level, item count, and rating.',
      },
    },
  },
};

/**
 * Detailed Variant
 * Increased spacing for detailed layouts
 */
export const DetailedVariant: Story = {
  args: {
    item: sampleAgent,
    variant: 'detailed',
    showCategory: true,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Detailed variant with increased spacing for detailed layouts.',
      },
    },
  },
};

/**
 * No Category Badge
 * Hide category badge when context is obvious (e.g., on /agents page)
 */
export const NoCategory: Story = {
  args: {
    item: sampleAgent,
    variant: 'default',
    showCategory: false,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card without category badge (useful when category is implicit from page context).',
      },
    },
  },
};

/**
 * No Actions
 * Read-only card without interactive buttons
 */
export const NoActions: Story = {
  args: {
    item: sampleAgent,
    variant: 'default',
    showCategory: true,
    showActions: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only card without action buttons (useful for preview/listing contexts).',
      },
    },
  },
};

/**
 * Responsive Grid Layout
 * Tests card behavior in grid context across viewports
 */
export const ResponsiveGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ConfigCard item={sampleAgent} variant="default" showCategory showActions />
      <ConfigCard item={sampleFeaturedAgent} variant="default" showCategory showActions />
      <ConfigCard item={sampleSponsoredAgent} variant="default" showCategory showActions />
      <ConfigCard item={sampleNewAgent} variant="default" showCategory showActions />
      <ConfigCard item={sampleMcpServer} variant="default" showCategory showActions />
      <ConfigCard item={sampleCollection} variant="default" showCategory showActions />
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
 * Side-by-side comparison of all major variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Default Agent</h3>
        <ConfigCard item={sampleAgent} variant="default" showCategory showActions />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Featured (#1)</h3>
        <ConfigCard item={sampleFeaturedAgent} variant="default" showCategory showActions />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Sponsored (Premium)</h3>
        <ConfigCard item={sampleSponsoredAgent} variant="default" showCategory showActions />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">New Content</h3>
        <ConfigCard item={sampleNewAgent} variant="default" showCategory showActions />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Collection</h3>
        <ConfigCard item={sampleCollection} variant="default" showCategory showActions />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Compare all major card variants side-by-side. Useful for visual QA and design consistency checks.',
      },
    },
  },
};
