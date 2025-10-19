import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { UnifiedSidebar } from './unified-sidebar';

/**
 * Unified Sidebar Stories
 *
 * Comprehensive showcase of the unified sidebar component with all mode variants.
 * Demonstrates configuration-driven architecture and dynamic content loading.
 *
 * **Component Features:**
 * - Three modes: category, unified, content
 * - Search and filter functionality
 * - Category navigation with icons
 * - Trending guides (API-fetched)
 * - Recent guides
 * - Related guides (content mode)
 * - Table of contents (content mode)
 *
 * **Architecture:**
 * - Client component with API integration
 * - Memoized with shallowEqual for performance
 * - Responsive sticky sidebar (top-20)
 * - Server-rendered CategoryNavigationCard
 *
 * **Production Standards:**
 * - TypeScript types (no runtime Zod validation)
 * - API route integration (/api/guides/trending)
 * - Silent fallbacks for optional features
 * - SSR-safe with deterministic IDs
 */

const meta = {
  title: 'Layout/UnifiedSidebar',
  component: UnifiedSidebar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Unified Sidebar Component** - Configuration-driven sidebar with three operational modes.

**Modes:**
- \`category\`: Category-wide navigation (guides index, category pages)
- \`unified\`: Universal navigation (all content types)
- \`content\`: Content-specific features (TOC, related guides)

**Features:**
- Search and filter guides
- Category navigation with icons
- Trending guides (API-fetched, silent fail)
- Recent guides (static data)
- Related guides (content mode only)
- Table of contents (content mode only)
- Quick links footer

**Performance:**
- Memoized with custom shallowEqual comparator
- Sticky positioning with overflow scroll
- Lazy API fetching for trending data
- Client-side state management
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['category', 'unified', 'content'],
      description: 'Sidebar operational mode',
    },
    currentCategory: {
      control: 'text',
      description: 'Current active category',
    },
  },
} satisfies Meta<typeof UnifiedSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ==============================================================================
 * MOCK DATA
 * ==============================================================================
 */

/**
 * Mock trending guides data
 */
const mockTrendingGuides = [
  {
    title: 'Getting Started with Claude AI',
    slug: '/guides/use-cases/getting-started',
    views: '12,450 views',
  },
  {
    title: 'Advanced Automation Workflows',
    slug: '/guides/workflows/automation',
    views: '8,320 views',
  },
  {
    title: 'Building Custom MCP Servers',
    slug: '/guides/tutorials/mcp-servers',
    views: '6,890 views',
  },
  {
    title: 'Prompt Engineering Best Practices',
    slug: '/guides/use-cases/prompting',
    views: '5,670 views',
  },
  {
    title: 'Integration with Development Tools',
    slug: '/guides/workflows/dev-tools',
    views: '4,230 views',
  },
];

/**
 * Mock recent guides data
 */
const mockRecentGuides = [
  {
    title: 'Getting Started with Claude',
    slug: '/guides/use-cases/getting-started',
    date: new Date().toLocaleDateString(),
  },
  {
    title: 'Advanced Automation',
    slug: '/guides/workflows/automation',
    date: new Date(Date.now() - 86400000).toLocaleDateString(),
  },
  {
    title: 'Development Tips',
    slug: '/guides/tutorials/development',
    date: new Date(Date.now() - 172800000).toLocaleDateString(),
  },
];

/**
 * Mock related guides data
 */
const mockRelatedGuides = [
  {
    title: 'Introduction to MCP Servers',
    slug: '/guides/tutorials/mcp-intro',
    category: 'tutorials',
  },
  {
    title: 'Building Agents with Claude',
    slug: '/guides/use-cases/agents',
    category: 'use-cases',
  },
  {
    title: 'Workflow Automation Guide',
    slug: '/guides/workflows/automation-basics',
    category: 'workflows',
  },
  {
    title: 'Custom Command Creation',
    slug: '/guides/tutorials/commands',
    category: 'tutorials',
  },
];

/**
 * Mock content data with TOC
 */
const mockContentData = {
  title: 'Getting Started with Claude AI',
  description: 'A comprehensive guide to getting started with Claude AI',
  keywords: ['claude', 'ai', 'getting-started', 'tutorial'],
  dateUpdated: '2025-01-15',
  category: 'use-cases',
  content: `# Getting Started with Claude AI

## Introduction

Claude is an advanced AI assistant built by Anthropic.

## Setting Up Your Environment

Learn how to configure your development environment.

## First Steps

Your first interactions with Claude.

## Advanced Features

Explore more powerful capabilities.

## Best Practices

Tips for getting the most out of Claude.

## Troubleshooting

Common issues and solutions.

## Next Steps

Where to go from here.`,
};

/**
 * ==============================================================================
 * CATEGORY MODE VARIANT
 * ==============================================================================
 */

/**
 * Category Mode - Use Cases
 * Default sidebar for category index pages
 */
export const CategoryModeUseCases: Story = {
  args: {
    mode: 'category',
    currentCategory: 'use-cases',
  },
  parameters: {
    docs: {
      description: {
        story: `
Category mode for Use Cases index page.

**Features Shown:**
- Search bar with filter toggle
- Category navigation (use-cases active)
- Trending guides section
- Recent guides section
- Quick links footer

**Use Case:**
Shown on \`/guides/use-cases\` index page.
        `,
      },
    },
  },
};

/**
 * Category Mode - Tutorials
 */
export const CategoryModeTutorials: Story = {
  args: {
    mode: 'category',
    currentCategory: 'tutorials',
  },
  parameters: {
    docs: {
      description: {
        story: 'Category mode with tutorials category active.',
      },
    },
  },
};

/**
 * Category Mode - Workflows
 */
export const CategoryModeWorkflows: Story = {
  args: {
    mode: 'category',
    currentCategory: 'workflows',
  },
  parameters: {
    docs: {
      description: {
        story: 'Category mode with workflows category active.',
      },
    },
  },
};

/**
 * Category Mode - Collections
 */
export const CategoryModeCollections: Story = {
  args: {
    mode: 'category',
    currentCategory: 'collections',
  },
  parameters: {
    docs: {
      description: {
        story: 'Category mode with collections category active.',
      },
    },
  },
};

/**
 * ==============================================================================
 * UNIFIED MODE VARIANT
 * ==============================================================================
 */

/**
 * Unified Mode - All Categories
 * Universal sidebar for guides index page
 */
export const UnifiedMode: Story = {
  args: {
    mode: 'unified',
  },
  parameters: {
    docs: {
      description: {
        story: `
Unified mode for main guides index page.

**Features Shown:**
- Search bar with filter toggle
- Category navigation (no category active)
- Trending guides section
- Recent guides section
- Quick links footer

**Use Case:**
Shown on \`/guides\` main index page.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * CONTENT MODE VARIANT
 * ==============================================================================
 */

/**
 * Content Mode - Full Features
 * Content-specific sidebar for individual guide pages
 */
export const ContentModeFull: Story = {
  args: {
    mode: 'content',
    contentData: mockContentData,
    relatedGuides: mockRelatedGuides,
    currentCategory: 'use-cases',
  },
  parameters: {
    docs: {
      description: {
        story: `
Content mode with all features enabled.

**Features Shown:**
- Search bar with filter toggle
- Category navigation (use-cases active)
- Trending guides section
- **Table of Contents** (content mode only)
- **Related Guides** (content mode only)
- Recent guides section
- Quick links footer

**Use Case:**
Shown on individual guide pages like \`/guides/use-cases/getting-started\`.

**Content-Specific Features:**
- Table of Contents: Auto-generated from markdown headings
- Related Guides: Context-aware recommendations
        `,
      },
    },
  },
};

/**
 * Content Mode - No Related Guides
 */
export const ContentModeNoRelated: Story = {
  args: {
    mode: 'content',
    contentData: mockContentData,
    relatedGuides: [],
    currentCategory: 'tutorials',
  },
  parameters: {
    docs: {
      description: {
        story: 'Content mode without related guides (new content, no matches yet).',
      },
    },
  },
};

/**
 * Content Mode - Short Content (No TOC)
 */
export const ContentModeShort: Story = {
  args: {
    mode: 'content',
    contentData: {
      title: 'Quick Tip',
      description: 'A short guide',
      category: 'use-cases',
      content: '# Quick Tip\n\nThis is a short guide with no headings.',
    },
    relatedGuides: mockRelatedGuides,
    currentCategory: 'use-cases',
  },
  parameters: {
    docs: {
      description: {
        story: 'Content mode with short content (no TOC, no ## headings).',
      },
    },
  },
};

/**
 * ==============================================================================
 * RELATED GUIDES VARIANT
 * ==============================================================================
 */

/**
 * With Related Guides - Maximum
 * Shows truncation behavior with many related guides
 */
export const WithManyRelatedGuides: Story = {
  args: {
    mode: 'content',
    contentData: mockContentData,
    relatedGuides: [
      ...mockRelatedGuides,
      {
        title: 'Hook Configuration Guide',
        slug: '/guides/tutorials/hooks',
        category: 'tutorials',
      },
      {
        title: 'Status Line Customization',
        slug: '/guides/tutorials/statuslines',
        category: 'tutorials',
      },
      {
        title: 'Advanced Rules',
        slug: '/guides/use-cases/rules',
        category: 'use-cases',
      },
    ],
    currentCategory: 'use-cases',
  },
  parameters: {
    docs: {
      description: {
        story: `
Related guides with truncation.

**Behavior:**
- Shows first 3 related guides
- "View all (7)" link for remaining guides
- Demonstrates truncation UX
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * EMPTY STATE VARIANTS
 * ==============================================================================
 */

/**
 * Empty State - No Data
 * Sidebar with no trending/recent guides
 */
export const EmptyState: Story = {
  args: {
    mode: 'category',
    currentCategory: 'use-cases',
  },
  parameters: {
    docs: {
      description: {
        story: `
Empty state when no trending/recent data is available.

**Features Shown:**
- Search and category navigation (always present)
- "Getting Started" placeholder card
- Quick links footer

**Use Case:**
Shown when API fails or no data is available yet.
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify search bar is present', async () => {
      const searchInput = canvas.getByPlaceholderText(/search guides/i);
      await expect(searchInput).toBeInTheDocument();
    });

    await step('Verify category navigation is present', async () => {
      // Category navigation should always be visible
      const navigation = canvas.getByRole('navigation');
      await expect(navigation).toBeInTheDocument();
    });
  },
};

/**
 * ==============================================================================
 * LOADING STATE VARIANT
 * ==============================================================================
 */

/**
 * Loading State - Trending Data
 * Shows loading indicator while fetching trending guides
 */
export const LoadingState: Story = {
  args: {
    mode: 'category',
    currentCategory: 'tutorials',
  },
  parameters: {
    docs: {
      description: {
        story: `
Loading state while fetching trending guides from API.

**Behavior:**
- "Loading trending guides..." text shown
- Component mounts and triggers API fetch
- Silent fallback if fetch fails

**API Integration:**
Fetches from \`/api/guides/trending?category=guides&limit=5\`
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * COMPREHENSIVE SHOWCASE
 * ==============================================================================
 */

/**
 * All Modes Comparison
 */
export const AllModesComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-3">Category Mode (use-cases)</h3>
        <div className="max-w-xs">
          <UnifiedSidebar mode="category" currentCategory="use-cases" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Unified Mode (all categories)</h3>
        <div className="max-w-xs">
          <UnifiedSidebar mode="unified" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Content Mode (with TOC + Related)</h3>
        <div className="max-w-xs">
          <UnifiedSidebar
            mode="content"
            contentData={mockContentData}
            relatedGuides={mockRelatedGuides}
            currentCategory="use-cases"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all three sidebar modes.',
      },
    },
  },
};

/**
 * Interactive Demo - All Features
 */
export const InteractiveDemo: Story = {
  args: {
    mode: 'content',
    contentData: mockContentData,
    relatedGuides: mockRelatedGuides,
    currentCategory: 'use-cases',
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive demo with all features enabled.

**Try These Interactions:**
1. Type in the search bar
2. Click the filter button (shows active filters)
3. Click category icons to see active state
4. Hover over trending guides
5. Click related guides links
6. Click TOC links (would scroll to heading)

**State Management:**
- Search query: Client state
- Filter toggle: Client state
- Trending data: API fetch on mount
- Recent data: Static initialization
        `,
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Search Interaction Test
 * Tests search input functionality
 */
export const SearchInteraction: Story = {
  args: {
    mode: 'category',
    currentCategory: 'use-cases',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests search bar interaction and filtering behavior.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Type search query into search bar', async () => {
      const searchInput = canvas.getByPlaceholderText(/search guides/i);
      await userEvent.type(searchInput, 'automation');
    });

    await step('Verify search query is entered', async () => {
      const searchInput = canvas.getByPlaceholderText(/search guides/i);
      await expect(searchInput).toHaveValue('automation');
    });

    await step('Clear search query', async () => {
      const searchInput = canvas.getByPlaceholderText(/search guides/i);
      await userEvent.clear(searchInput);
      await expect(searchInput).toHaveValue('');
    });
  },
};

/**
 * Category Navigation Test
 * Tests category selection and active state
 */
export const CategoryNavigationTest: Story = {
  args: {
    mode: 'unified',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests category navigation with icon buttons.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify category navigation is rendered', async () => {
      const navigation = canvas.getByRole('navigation');
      await expect(navigation).toBeInTheDocument();
    });

    await step('Verify category buttons are present', async () => {
      // Look for category buttons (use-cases, tutorials, workflows, collections)
      const buttons = canvas.getAllByRole('link');
      await expect(buttons.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Content Mode TOC Test
 * Tests table of contents rendering in content mode
 */
export const ContentModeTOCTest: Story = {
  args: {
    mode: 'content',
    contentData: mockContentData,
    relatedGuides: mockRelatedGuides,
    currentCategory: 'use-cases',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests table of contents generation from content headings.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify table of contents is rendered', async () => {
      // Look for TOC section heading
      const tocHeading = canvas.getByText(/on this page|table of contents/i);
      await expect(tocHeading).toBeInTheDocument();
    });

    await step('Verify TOC links are generated from content headings', async () => {
      // TOC should include headings from mockContentData
      const introLink = canvas.getByText(/introduction/i);
      await expect(introLink).toBeInTheDocument();
    });
  },
};

/**
 * Related Guides Test
 * Tests related guides section in content mode
 */
export const RelatedGuidesTest: Story = {
  args: {
    mode: 'content',
    contentData: mockContentData,
    relatedGuides: mockRelatedGuides,
    currentCategory: 'use-cases',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests related guides rendering and links.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify related guides section is rendered', async () => {
      const relatedHeading = canvas.getByText(/related guides/i);
      await expect(relatedHeading).toBeInTheDocument();
    });

    await step('Verify related guide links are present', async () => {
      // Check for first related guide from mockRelatedGuides
      const firstGuide = canvas.getByText(/introduction to mcp servers/i);
      await expect(firstGuide).toBeInTheDocument();
    });
  },
};

/**
 * Mode Switching Test
 * Tests different mode variants rendering different features
 */
export const ModeSwitchingTest: Story = {
  args: {
    mode: 'category',
    currentCategory: 'tutorials',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests that different modes show appropriate features.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify category mode shows trending section', async () => {
      // Category mode should show trending guides
      const trendingHeading = canvas.getByText(/trending|popular/i);
      await expect(trendingHeading).toBeInTheDocument();
    });

    await step('Verify category mode does NOT show TOC (content-only feature)', async () => {
      // TOC should only appear in content mode
      const tocHeading = canvas.queryByText(/on this page|table of contents/i);
      await expect(tocHeading).not.toBeInTheDocument();
    });
  },
};
