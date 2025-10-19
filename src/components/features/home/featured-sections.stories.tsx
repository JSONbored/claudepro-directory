'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { FeaturedSections } from './featured-sections';

/**
 * FeaturedSections Component Stories
 *
 * Dynamic featured content sections for the homepage.
 * Config-driven, performance-optimized with memoization.
 *
 * Features:
 * - Config-driven rendering via HOMEPAGE_FEATURED_CATEGORIES
 * - Memoized components (FeaturedSection + FeaturedSections)
 * - useMemo for sliced arrays (performance optimization)
 * - Dynamic section generation from config
 * - UnifiedCardGrid integration with ConfigCard
 * - Featured Jobs section (hardcoded CTA)
 * - "View all" links for each category
 * - Responsive grid layout
 * - 6 items max per section
 * - ExternalLink icons
 *
 * Component: src/components/features/home/featured-sections.tsx (123 LOC)
 * Used in: Homepage (/), home-page-client.tsx
 * Dependencies: UnifiedCardGrid, ConfigCard, Button, HOMEPAGE_FEATURED_CATEGORIES
 *
 * Props:
 * ```ts
 * interface FeaturedSectionsProps {
 *   categories: Record<string, readonly UnifiedContentItem[]>;
 * }
 * ```
 *
 * Architecture:
 * - **FeaturedSection** (memoized inner component)
 *   - Single category section
 *   - Title + "View all" link
 *   - UnifiedCardGrid with ConfigCard
 *   - Shows first 6 items (sliced with useMemo)
 *
 * - **FeaturedSections** (memoized outer component)
 *   - Maps over HOMEPAGE_FEATURED_CATEGORIES
 *   - Renders FeaturedSection for each category
 *   - Skips categories with no config or no items
 *   - Featured Jobs section at bottom (hardcoded)
 *
 * Performance Optimizations (SHA-2086 Fix):
 * - memo() on FeaturedSection: Prevents re-renders on parent state changes
 * - memo() on FeaturedSections: Prevents re-renders when categories prop stable
 * - useMemo() for items.slice(0, 6): Prevents array re-creation
 * - Impact: ~180ms savings per state change (30 cards × 6ms each)
 *
 * Config-Driven Design (SHA-XXXX):
 * - HOMEPAGE_FEATURED_CATEGORIES: ['agents', 'mcp', 'rules', 'commands', 'hooks']
 * - UNIFIED_CATEGORY_REGISTRY: Category metadata (pluralTitle, urlSlug)
 * - Add new featured category = update config array only
 * - Zero component code changes needed
 *
 * Section Structure:
 * 1. Dynamic Featured Sections (from HOMEPAGE_FEATURED_CATEGORIES)
 *    - Featured {pluralTitle} (e.g., "Featured Agents")
 *    - "View all" link → /{urlSlug}
 *    - 6 cards in UnifiedCardGrid
 *    - ConfigCard for each item
 *
 * 2. Featured Jobs Section (hardcoded)
 *    - "Featured Jobs" heading
 *    - "View all" link → /jobs
 *    - Muted card container with Briefcase icon
 *    - "Find Your Next AI Role" heading
 *    - Description text
 *    - "Browse Job Opportunities" button
 *
 * Layout:
 * - Vertical stack (space-y-16)
 * - Bottom margin (mb-16)
 * - Section header: flex items-center justify-between
 * - Title: text-2xl font-bold
 * - View all: text-accent hover:underline
 *
 * Memoization Benefits:
 * - FeaturedSection: Only re-renders when items prop changes
 * - FeaturedSections: Only re-renders when categories prop changes
 * - useMemo: Prevents items.slice(0, 6) re-execution
 * - Prevents cascading re-renders to 30+ cards
 *
 * @see Research Report: "Performance Optimization with React.memo"
 * @see SHA-2086: Featured sections re-render optimization
 * @see SHA-2102: Component extraction for modularity
 */
const meta = {
  title: 'Features/Home/FeaturedSections',
  component: FeaturedSections,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dynamic featured content sections for homepage. Config-driven, memoized for performance.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-7xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FeaturedSections>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockAgents: UnifiedContentItem[] = [
  {
    slug: 'react-expert',
    title: 'React Development Expert',
    description: 'Specialized agent for React 19 development with best practices',
    category: 'agents',
    tags: ['react', 'frontend', 'hooks'],
    verified: true,
    featured: true,
    popularity: 95,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    slug: 'python-ml',
    title: 'Python ML Specialist',
    description: 'Machine learning expert with scikit-learn and PyTorch knowledge',
    category: 'agents',
    tags: ['python', 'ml', 'ai'],
    verified: true,
    featured: true,
    popularity: 92,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-14'),
  },
  {
    slug: 'typescript-guru',
    title: 'TypeScript Type System Guru',
    description: 'Advanced TypeScript patterns and type system expertise',
    category: 'agents',
    tags: ['typescript', 'types', 'advanced'],
    verified: false,
    featured: true,
    popularity: 88,
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-13'),
  },
  {
    slug: 'nextjs-optimizer',
    title: 'Next.js Performance Optimizer',
    description: 'Optimize Next.js apps for production with best practices',
    category: 'agents',
    tags: ['nextjs', 'performance', 'optimization'],
    verified: true,
    featured: true,
    popularity: 90,
    createdAt: new Date('2025-01-04'),
    updatedAt: new Date('2025-01-12'),
  },
  {
    slug: 'api-architect',
    title: 'API Architecture Expert',
    description: 'RESTful and GraphQL API design with scalability focus',
    category: 'agents',
    tags: ['api', 'rest', 'graphql'],
    verified: true,
    featured: true,
    popularity: 87,
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-11'),
  },
  {
    slug: 'security-specialist',
    title: 'Security Best Practices',
    description: 'Web application security and vulnerability prevention',
    category: 'agents',
    tags: ['security', 'best-practices', 'web'],
    verified: true,
    featured: true,
    popularity: 93,
    createdAt: new Date('2025-01-06'),
    updatedAt: new Date('2025-01-10'),
  },
];

const mockMCP: UnifiedContentItem[] = [
  {
    slug: 'supabase-mcp',
    title: 'Supabase MCP Server',
    description: 'Full Supabase integration with auth, database, and storage',
    category: 'mcp',
    tags: ['supabase', 'database', 'auth'],
    verified: true,
    featured: true,
    popularity: 94,
    createdAt: new Date('2025-01-07'),
    updatedAt: new Date('2025-01-16'),
  },
  {
    slug: 'github-mcp',
    title: 'GitHub MCP Server',
    description: 'GitHub API integration for repos, issues, and PRs',
    category: 'mcp',
    tags: ['github', 'git', 'api'],
    verified: true,
    featured: true,
    popularity: 91,
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    slug: 'stripe-mcp',
    title: 'Stripe Payments MCP',
    description: 'Stripe payment processing and subscription management',
    category: 'mcp',
    tags: ['stripe', 'payments', 'billing'],
    verified: false,
    featured: true,
    popularity: 89,
    createdAt: new Date('2025-01-09'),
    updatedAt: new Date('2025-01-14'),
  },
  {
    slug: 'openai-mcp',
    title: 'OpenAI MCP Server',
    description: 'OpenAI API integration for GPT-4 and DALL-E',
    category: 'mcp',
    tags: ['openai', 'gpt-4', 'ai'],
    verified: true,
    featured: true,
    popularity: 96,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-13'),
  },
  {
    slug: 'aws-mcp',
    title: 'AWS Services MCP',
    description: 'AWS SDK integration for S3, Lambda, and DynamoDB',
    category: 'mcp',
    tags: ['aws', 'cloud', 's3'],
    verified: true,
    featured: true,
    popularity: 85,
    createdAt: new Date('2025-01-11'),
    updatedAt: new Date('2025-01-12'),
  },
  {
    slug: 'vercel-mcp',
    title: 'Vercel Deployment MCP',
    description: 'Vercel API for deployments and project management',
    category: 'mcp',
    tags: ['vercel', 'deployment', 'hosting'],
    verified: true,
    featured: true,
    popularity: 88,
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-11'),
  },
];

const mockRules: UnifiedContentItem[] = [
  {
    slug: 'react-best-practices',
    title: 'React Best Practices',
    description: 'Comprehensive React coding standards and patterns',
    category: 'rules',
    tags: ['react', 'best-practices', 'patterns'],
    verified: true,
    featured: true,
    popularity: 92,
    createdAt: new Date('2025-01-13'),
    updatedAt: new Date('2025-01-17'),
  },
  {
    slug: 'typescript-strict',
    title: 'TypeScript Strict Mode',
    description: 'Enforce strict TypeScript rules for type safety',
    category: 'rules',
    tags: ['typescript', 'strict', 'types'],
    verified: true,
    featured: true,
    popularity: 90,
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-16'),
  },
  {
    slug: 'api-design',
    title: 'API Design Guidelines',
    description: 'RESTful API design principles and conventions',
    category: 'rules',
    tags: ['api', 'rest', 'design'],
    verified: false,
    featured: true,
    popularity: 86,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
];

/**
 * Default: Full Featured Sections
 *
 * Shows all featured sections with multiple categories.
 * Demonstrates dynamic rendering from HOMEPAGE_FEATURED_CATEGORIES config.
 *
 * Usage:
 * ```tsx
 * <FeaturedSections
 *   categories={{
 *     agents: [...],
 *     mcp: [...],
 *     rules: [...]
 *   }}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    categories: {
      agents: mockAgents,
      mcp: mockMCP,
      rules: mockRules,
    },
  },
};

/**
 * Single Category
 *
 * Shows only one featured category (agents).
 * Other categories skipped (no items).
 */
export const SingleCategory: Story = {
  args: {
    categories: {
      agents: mockAgents,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Single category displayed. Others skipped due to no items.',
      },
    },
  },
};

/**
 * Two Categories
 *
 * Shows agents and MCP featured sections.
 */
export const TwoCategories: Story = {
  args: {
    categories: {
      agents: mockAgents,
      mcp: mockMCP,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Two categories: agents and MCP servers.',
      },
    },
  },
};

/**
 * Empty Categories
 *
 * No categories provided, shows only Featured Jobs section.
 */
export const EmptyCategories: Story = {
  args: {
    categories: {},
  },
  parameters: {
    docs: {
      description: {
        story: 'No content categories. Only Featured Jobs section visible.',
      },
    },
  },
};

/**
 * Six Items Per Section
 *
 * Shows maximum 6 items per category (sliced with useMemo).
 * Even if more items provided, only first 6 displayed.
 */
export const SixItemsPerSection: Story = {
  args: {
    categories: {
      agents: mockAgents, // 6 items
      mcp: mockMCP, // 6 items
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Each section shows maximum 6 items. Sliced with useMemo for performance.',
      },
    },
  },
};

/**
 * Fewer Than Six Items
 *
 * Shows section with only 3 items.
 * No padding or empty cards.
 */
export const FewerThanSixItems: Story = {
  args: {
    categories: {
      rules: mockRules, // 3 items only
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Section with only 3 items. No padding or empty cards.',
      },
    },
  },
};

/**
 * Featured Jobs Section
 *
 * Shows hardcoded Featured Jobs section at bottom.
 *
 * Features:
 * - "Featured Jobs" heading
 * - "View all" link → /jobs
 * - Muted card container
 * - Briefcase icon (h-12 w-12, muted)
 * - "Find Your Next AI Role" heading
 * - Description text
 * - "Browse Job Opportunities" button
 */
export const FeaturedJobsSection: Story = {
  args: {
    categories: {
      agents: mockAgents,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Scroll to bottom to see Featured Jobs section with Briefcase icon and CTA button.',
      },
    },
  },
};

/**
 * Section Headers
 *
 * Shows section header layout: title + "View all" link.
 *
 * Visual:
 * - flex items-center justify-between
 * - Title: text-2xl font-bold
 * - "View all": text-accent hover:underline
 * - ExternalLink icon (h-4 w-4)
 */
export const SectionHeaders: Story = {
  args: {
    categories: {
      agents: mockAgents,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Section headers: title (2xl bold) + "View all" link (accent color) with icon.',
      },
    },
  },
};

/**
 * Responsive Grid
 *
 * Shows responsive grid layout via UnifiedCardGrid.
 *
 * Grid Behavior:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 * - ConfigCard for each item
 */
export const ResponsiveGrid: Story = {
  args: {
    categories: {
      agents: mockAgents,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Resize viewport to see responsive grid: 1 col (mobile), 2 col (tablet), 3 col (desktop).',
      },
    },
  },
};

/**
 * Vertical Spacing
 *
 * Shows vertical spacing between sections.
 *
 * Spacing:
 * - Between sections: space-y-16
 * - Bottom margin: mb-16
 * - Section header margin: mb-8
 */
export const VerticalSpacing: Story = {
  args: {
    categories: {
      agents: mockAgents,
      mcp: mockMCP,
      rules: mockRules,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Vertical spacing: 16 units between sections, 8 units below headers.',
      },
    },
  },
};

/**
 * Config-Driven Rendering
 *
 * Demonstrates config-driven section generation.
 *
 * Config Sources:
 * - HOMEPAGE_FEATURED_CATEGORIES: ['agents', 'mcp', 'rules', ...]
 * - UNIFIED_CATEGORY_REGISTRY: { agents: { pluralTitle: 'Agents', urlSlug: 'agents' } }
 *
 * Flow:
 * 1. Map over HOMEPAGE_FEATURED_CATEGORIES
 * 2. Get items from categories prop
 * 3. Get config from UNIFIED_CATEGORY_REGISTRY
 * 4. Skip if no config or no items
 * 5. Render FeaturedSection with title and href from config
 *
 * Benefits:
 * - Add new category = update config array only
 * - Zero component code changes
 * - Consistent section structure
 */
export const ConfigDrivenRendering: Story = {
  args: {
    categories: {
      agents: mockAgents,
      mcp: mockMCP,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sections generated from HOMEPAGE_FEATURED_CATEGORIES. Add category = update config.',
      },
    },
  },
};

/**
 * Memoization Performance
 *
 * Demonstrates memoization benefits.
 *
 * Optimizations:
 * - memo(FeaturedSection): Prevents re-renders on parent state changes
 * - memo(FeaturedSections): Prevents re-renders when categories prop stable
 * - useMemo(items.slice(0, 6)): Prevents array re-creation
 *
 * Impact (SHA-2086):
 * - Previous: All 30 cards re-rendered on search/tab/filter changes
 * - Current: Zero re-renders if categories prop unchanged
 * - Savings: ~180ms per state change (30 cards × 6ms each)
 *
 * When Re-Renders Occur:
 * - FeaturedSection: Only when items prop changes
 * - FeaturedSections: Only when categories prop changes
 * - Cards: Only when individual item props change
 */
export const MemoizationPerformance: Story = {
  args: {
    categories: {
      agents: mockAgents,
      mcp: mockMCP,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Memoization prevents unnecessary re-renders. ~180ms savings per state change (SHA-2086).',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Section Rendering Test
 * Tests featured sections render
 */
export const SectionRenderingTest: Story = {
  args: {
    categories: {
      agents: mockAgents,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify section title exists', async () => {
      const title = canvas.getByText(/Featured Agents/i);
      await expect(title).toBeInTheDocument();
    });

    await step('Verify "View all" link exists', async () => {
      const link = canvas.getByText(/View all/i);
      await expect(link).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests featured sections render with title and "View all" link.',
      },
    },
  },
};

/**
 * Featured Jobs Test
 * Tests Featured Jobs section renders
 */
export const FeaturedJobsTest: Story = {
  args: {
    categories: {},
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "Featured Jobs" heading exists', async () => {
      const heading = canvas.getByText(/Featured Jobs/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify "Find Your Next AI Role" heading exists', async () => {
      const heading = canvas.getByText(/Find Your Next AI Role/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify "Browse Job Opportunities" button exists', async () => {
      const button = canvas.getByRole('link', { name: /Browse Job Opportunities/i });
      await expect(button).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests Featured Jobs section renders with heading, description, and button.',
      },
    },
  },
};

/**
 * Multiple Sections Test
 * Tests multiple categories render
 */
export const MultipleSectionsTest: Story = {
  args: {
    categories: {
      agents: mockAgents,
      mcp: mockMCP,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify agents section exists', async () => {
      const agentsTitle = canvas.getByText(/Featured Agents/i);
      await expect(agentsTitle).toBeInTheDocument();
    });

    await step('Verify MCP section exists', async () => {
      // Need to get all elements since "Featured" appears multiple times
      const allHeadings = canvas.getAllByText(/Featured/i);
      const mcpHeading = allHeadings.find((el) => el.textContent?.includes('MCP'));
      await expect(mcpHeading).toBeTruthy();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests multiple featured sections render for different categories.',
      },
    },
  },
};

/**
 * Empty State Test
 * Tests component with no categories
 */
export const EmptyStateTest: Story = {
  args: {
    categories: {},
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Featured Jobs section still renders', async () => {
      const heading = canvas.getByText(/Featured Jobs/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify no category sections render', async () => {
      const agentsTitle = canvas.queryByText(/Featured Agents/i);
      await expect(agentsTitle).toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests empty state: no category sections, only Featured Jobs visible.',
      },
    },
  },
};

/**
 * View All Links Test
 * Tests "View all" links for each section
 */
export const ViewAllLinksTest: Story = {
  args: {
    categories: {
      agents: mockAgents,
      mcp: mockMCP,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify multiple "View all" links exist', async () => {
      const links = canvas.getAllByText(/View all/i);
      // At least 2 for agents + mcp, plus 1 for Featured Jobs
      await expect(links.length).toBeGreaterThanOrEqual(2);
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests "View all" links render for each featured section.',
      },
    },
  },
};
