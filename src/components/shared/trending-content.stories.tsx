'use client';

import type { Meta, StoryObj } from '@storybook/react';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { TrendingContent } from './trending-content';

// Mock data generator
const generateMockContent = (count: number, prefix: string): UnifiedContentItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    slug: `${prefix}-${i + 1}`,
    title: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Item ${i + 1}`,
    description: `This is a description for ${prefix} item ${i + 1}. It provides an overview of what this content is about.`,
    category: 'agents' as const,
    author: 'Author Name',
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
    views: Math.floor(Math.random() * 10000),
    downloads: Math.floor(Math.random() * 5000),
    bookmarks: Math.floor(Math.random() * 1000),
    featured: i < 2,
    verified: true,
    tags: ['tag1', 'tag2', 'tag3'],
  }));
};

const meta = {
  title: 'Shared/TrendingContent',
  component: TrendingContent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tabbed interface for displaying trending, popular, and recent content. Memoized for performance with 10-20+ items per tab. Features badge rankings for top 3 trending items.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    trending: {
      control: false,
      description: 'Array of trending content items',
    },
    popular: {
      control: false,
      description: 'Array of popular content items',
    },
    recent: {
      control: false,
      description: 'Array of recently added content items',
    },
  },
} satisfies Meta<typeof TrendingContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default with all tabs populated
 */
export const Default: Story = {
  args: {
    trending: generateMockContent(12, 'trending'),
    popular: generateMockContent(12, 'popular'),
    recent: generateMockContent(12, 'recent'),
  },
};

/**
 * With many items
 */
export const ManyItems: Story = {
  args: {
    trending: generateMockContent(30, 'trending'),
    popular: generateMockContent(30, 'popular'),
    recent: generateMockContent(30, 'recent'),
  },
};

/**
 * With few items
 */
export const FewItems: Story = {
  args: {
    trending: generateMockContent(3, 'trending'),
    popular: generateMockContent(3, 'popular'),
    recent: generateMockContent(3, 'recent'),
  },
};

/**
 * Empty trending tab
 */
export const EmptyTrending: Story = {
  args: {
    trending: [],
    popular: generateMockContent(12, 'popular'),
    recent: generateMockContent(12, 'recent'),
  },
};

/**
 * Empty popular tab
 */
export const EmptyPopular: Story = {
  args: {
    trending: generateMockContent(12, 'trending'),
    popular: [],
    recent: generateMockContent(12, 'recent'),
  },
};

/**
 * Empty recent tab
 */
export const EmptyRecent: Story = {
  args: {
    trending: generateMockContent(12, 'trending'),
    popular: generateMockContent(12, 'popular'),
    recent: [],
  },
};

/**
 * All tabs empty
 */
export const AllEmpty: Story = {
  args: {
    trending: [],
    popular: [],
    recent: [],
  },
};

/**
 * Different content types
 */
export const DifferentTypes: Story = {
  args: {
    trending: [
      ...generateMockContent(4, 'agent'),
      ...generateMockContent(4, 'mcp').map((item) => ({ ...item, category: 'mcp' as const })),
      ...generateMockContent(4, 'command').map((item) => ({
        ...item,
        category: 'commands' as const,
      })),
    ],
    popular: generateMockContent(12, 'popular'),
    recent: generateMockContent(12, 'recent'),
  },
};

/**
 * With high engagement metrics
 */
export const HighEngagement: Story = {
  args: {
    trending: generateMockContent(12, 'trending').map((item, i) => ({
      ...item,
      views: 50000 + i * 1000,
      downloads: 10000 + i * 500,
      bookmarks: 2000 + i * 100,
    })),
    popular: generateMockContent(12, 'popular').map((item, i) => ({
      ...item,
      views: 100000 + i * 2000,
      downloads: 20000 + i * 1000,
      bookmarks: 5000 + i * 200,
    })),
    recent: generateMockContent(12, 'recent'),
  },
};

/**
 * In page context
 */
export const InPageContext: Story = {
  render: (args) => (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold">Discover Content</h1>
        <p className="text-xl text-muted-foreground">
          Explore trending agents, popular tools, and recently added content.
        </p>
      </header>
      <TrendingContent {...args} />
    </div>
  ),
  args: {
    trending: generateMockContent(15, 'trending'),
    popular: generateMockContent(15, 'popular'),
    recent: generateMockContent(15, 'recent'),
  },
};

/**
 * Mobile layout
 */
export const MobileLayout: Story = {
  args: {
    trending: generateMockContent(9, 'trending'),
    popular: generateMockContent(9, 'popular'),
    recent: generateMockContent(9, 'recent'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet layout
 */
export const TabletLayout: Story = {
  args: {
    trending: generateMockContent(12, 'trending'),
    popular: generateMockContent(12, 'popular'),
    recent: generateMockContent(12, 'recent'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Tab interaction demo
 */
export const TabInteractionDemo: Story = {
  render: (args) => (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-card max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Interactive Tabs Demo</h2>
        <p className="text-muted-foreground mb-2">
          Click between the tabs to see different content categories:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
          <li>
            <strong>Trending:</strong> Content gaining traction this week (top 3 get rank badges)
          </li>
          <li>
            <strong>Popular:</strong> Most viewed and downloaded content overall
          </li>
          <li>
            <strong>Recent:</strong> Newly added content sorted by date
          </li>
        </ul>
      </div>
      <TrendingContent {...args} />
    </div>
  ),
  args: {
    trending: generateMockContent(12, 'trending'),
    popular: generateMockContent(12, 'popular'),
    recent: generateMockContent(12, 'recent'),
  },
};

/**
 * With featured items
 */
export const WithFeaturedItems: Story = {
  args: {
    trending: generateMockContent(12, 'trending').map((item, i) => ({
      ...item,
      featured: i < 3,
    })),
    popular: generateMockContent(12, 'popular').map((item, i) => ({
      ...item,
      featured: i < 2,
    })),
    recent: generateMockContent(12, 'recent').map((item, i) => ({
      ...item,
      featured: i === 0,
    })),
  },
};

/**
 * Performance showcase
 */
export const PerformanceShowcase: Story = {
  render: (args) => (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-card max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">Performance Optimization</h2>
        <p className="text-muted-foreground mb-4">
          This component is memoized to prevent unnecessary re-renders:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Only re-renders when trending/popular/recent data changes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Renders 10-20+ ConfigCard items per tab efficiently</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Prevents expensive DOM operations on parent state changes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Uses React.memo() for optimal performance</span>
          </li>
        </ul>
      </div>
      <TrendingContent {...args} />
    </div>
  ),
  args: {
    trending: generateMockContent(20, 'trending'),
    popular: generateMockContent(20, 'popular'),
    recent: generateMockContent(20, 'recent'),
  },
};

/**
 * Rank badges showcase
 */
export const RankBadgesShowcase: Story = {
  render: (args) => (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-card max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Rank Badges</h2>
        <p className="text-muted-foreground">
          The top 3 trending items display rank badges (#1, #2, #3) in the top-right corner of their
          cards. This helps highlight the most popular content this week.
        </p>
      </div>
      <TrendingContent {...args} />
    </div>
  ),
  args: {
    trending: generateMockContent(12, 'trending'),
    popular: generateMockContent(12, 'popular'),
    recent: generateMockContent(12, 'recent'),
  },
};

/**
 * Category badges showcase
 */
export const CategoryBadgesShowcase: Story = {
  render: (args) => (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-card max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Category Badges</h2>
        <p className="text-muted-foreground">
          Each card displays its category (Agents, MCP, Commands, etc.) to help users quickly
          identify content types. The showCategory prop is enabled for all cards in trending views.
        </p>
      </div>
      <TrendingContent {...args} />
    </div>
  ),
  args: {
    trending: [
      ...generateMockContent(4, 'agent').map((item) => ({ ...item, category: 'agents' as const })),
      ...generateMockContent(4, 'mcp').map((item) => ({ ...item, category: 'mcp' as const })),
      ...generateMockContent(4, 'command').map((item) => ({
        ...item,
        category: 'commands' as const,
      })),
    ],
    popular: generateMockContent(12, 'popular'),
    recent: generateMockContent(12, 'recent'),
  },
};
