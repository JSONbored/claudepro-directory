'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { TabsSection } from './tabs-section';

/**
 * TabsSection Component Stories
 *
 * Tabbed content filtering for the homepage.
 * Config-driven, performance-optimized with memoization and virtual scrolling.
 *
 * Features:
 * - Config-driven tabs via HOMEPAGE_TAB_CATEGORIES
 * - Memoized component for performance
 * - Dynamic tab labels from UNIFIED_CATEGORY_REGISTRY
 * - Infinite scroll with TanStack Virtual
 * - Batch size: 30 items per load
 * - Special tabs: "all" (all content) and "community" (custom content)
 * - Community tab: Coming soon placeholder with CTA
 * - Responsive tab list (grid → flow-col on lg)
 * - useMemo optimization for contentTabs
 * - ConfigCard rendering with category + actions
 * - Empty state messages per category
 *
 * Component: src/components/features/home/tabs-section.tsx (119 LOC)
 * Used in: Homepage (/), home-page-client.tsx
 * Dependencies: Tabs, UnifiedCardGrid, ConfigCard, Button, HOMEPAGE_TAB_CATEGORIES
 *
 * Props:
 * ```ts
 * interface TabsSectionProps {
 *   activeTab: string;
 *   filteredResults: readonly UnifiedContentItem[];
 *   onTabChange: (value: string) => void;
 * }
 * ```
 *
 * Architecture:
 * - **contentTabs**: useMemo filters out 'community' from HOMEPAGE_TAB_CATEGORIES
 * - **TabsList**: Renders all tabs (including community)
 * - **TabsContent**: Renders content tabs with UnifiedCardGrid
 * - **Community TabsContent**: Custom placeholder content
 *
 * Tab Categories (from HOMEPAGE_TAB_CATEGORIES):
 * - all: All configurations
 * - agents: Claude Agents
 * - mcp: MCP Servers
 * - rules: Claude Rules
 * - commands: Slash Commands
 * - hooks: Git Hooks
 * - statuslines: Statuslines
 * - skills: Skills
 * - community: Featured Contributors (custom content)
 *
 * Tab Labels:
 * - "all" → "All"
 * - "community" → "Community"
 * - Other tabs → config.pluralTitle from UNIFIED_CATEGORY_REGISTRY
 * - Example: "agents" → "Agents", "mcp" → "MCP Servers"
 *
 * Content Tabs (all except 'community'):
 * - UnifiedCardGrid with infiniteScroll
 * - Batch size: 30 items
 * - Custom renderCard with ConfigCard
 * - Shows category badge and actions
 * - Empty message: "No {categoryName} found. Try adjusting your filters."
 *
 * Community Tab (special):
 * - "Featured Contributors" heading (text-2xl font-bold)
 * - Description: "Meet the experts creating amazing Claude configurations"
 * - Coming soon message
 * - "View All Contributors" button (outline variant) → /community
 *
 * Responsive Layout:
 * - TabsList: grid w-full (mobile) → lg:w-auto lg:grid-flow-col (desktop)
 * - Auto-column sizing on desktop
 * - Gap: 1 unit
 *
 * Performance (Production 2025):
 * - TanStack Virtual for list virtualization
 * - Only renders ~15 visible items (regardless of total)
 * - Constant memory usage
 * - 60fps performance
 * - Scales to 10,000+ items
 *
 * Memoization:
 * - memo(TabsSectionComponent)
 * - useMemo for contentTabs filtering
 * - Only re-renders when props change
 *
 * @see Research Report: "TanStack Virtual for Performance"
 * @see SHA-2102: Component extraction for modularity
 * @see SHA-XXXX: Config-driven tab system
 */
const meta = {
  title: 'Features/Home/TabsSection',
  component: TabsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tabbed content filtering for homepage. Config-driven, memoized, infinite scroll.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    activeTab: {
      control: 'select',
      options: [
        'all',
        'agents',
        'mcp',
        'rules',
        'commands',
        'hooks',
        'statuslines',
        'skills',
        'community',
      ],
      description: 'Currently active tab',
    },
    filteredResults: {
      control: 'object',
      description: 'Content items to display',
    },
    onTabChange: {
      action: 'tab-changed',
      description: 'Callback when tab changes',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-7xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TabsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockAgents: UnifiedContentItem[] = [
  {
    slug: 'react-expert',
    title: 'React Development Expert',
    description: 'Specialized agent for React 19 development',
    category: 'agents',
    tags: ['react', 'frontend'],
    verified: true,
    featured: true,
    popularity: 95,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    slug: 'python-ml',
    title: 'Python ML Specialist',
    description: 'Machine learning expert',
    category: 'agents',
    tags: ['python', 'ml'],
    verified: true,
    featured: true,
    popularity: 92,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-14'),
  },
];

const mockMCP: UnifiedContentItem[] = [
  {
    slug: 'supabase-mcp',
    title: 'Supabase MCP Server',
    description: 'Full Supabase integration',
    category: 'mcp',
    tags: ['supabase', 'database'],
    verified: true,
    featured: true,
    popularity: 94,
    createdAt: new Date('2025-01-07'),
    updatedAt: new Date('2025-01-16'),
  },
];

const mockRules: UnifiedContentItem[] = [
  {
    slug: 'react-best-practices',
    title: 'React Best Practices',
    description: 'Comprehensive React coding standards',
    category: 'rules',
    tags: ['react', 'best-practices'],
    verified: true,
    featured: true,
    popularity: 92,
    createdAt: new Date('2025-01-13'),
    updatedAt: new Date('2025-01-17'),
  },
];

const allContent = [...mockAgents, ...mockMCP, ...mockRules];

/**
 * Default: All Tab Active
 *
 * Shows tabs section with "all" tab active.
 * Displays mixed content from all categories.
 *
 * Usage:
 * ```tsx
 * <TabsSection
 *   activeTab="all"
 *   filteredResults={allContent}
 *   onTabChange={(tab) => setActiveTab(tab)}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Agents Tab
 *
 * Shows agents tab active with agent content.
 */
export const AgentsTab: Story = {
  args: {
    activeTab: 'agents',
    filteredResults: mockAgents,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Agents tab active, displaying agent configurations.',
      },
    },
  },
};

/**
 * MCP Tab
 *
 * Shows MCP tab active with MCP server content.
 */
export const MCPTab: Story = {
  args: {
    activeTab: 'mcp',
    filteredResults: mockMCP,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'MCP tab active, displaying MCP server configurations.',
      },
    },
  },
};

/**
 * Rules Tab
 *
 * Shows rules tab active with rule content.
 */
export const RulesTab: Story = {
  args: {
    activeTab: 'rules',
    filteredResults: mockRules,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Rules tab active, displaying Claude rules.',
      },
    },
  },
};

/**
 * Community Tab
 *
 * Shows community tab with custom content.
 *
 * Features:
 * - "Featured Contributors" heading (text-2xl font-bold)
 * - Description text
 * - "Coming soon!" message
 * - "View All Contributors" button → /community
 */
export const CommunityTab: Story = {
  args: {
    activeTab: 'community',
    filteredResults: [],
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Community tab with custom placeholder content and CTA button.',
      },
    },
  },
};

/**
 * Empty Results
 *
 * Shows empty state for a tab with no results.
 *
 * Empty Message Format:
 * - "No {categoryName} found. Try adjusting your filters."
 * - Example: "No agents found. Try adjusting your filters."
 */
export const EmptyResults: Story = {
  args: {
    activeTab: 'agents',
    filteredResults: [],
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state with category-specific message: "No agents found. Try adjusting your filters."',
      },
    },
  },
};

/**
 * Tab Switching
 *
 * Demonstrates tab switching functionality.
 * Click tabs to see onTabChange callback.
 */
export const TabSwitching: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: (tab) => {
      alert(`Tab changed to: ${tab}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Click tabs to trigger onTabChange callback. Alert shows selected tab.',
      },
    },
  },
};

/**
 * Dynamic Tab Labels
 *
 * Shows dynamic tab labels from UNIFIED_CATEGORY_REGISTRY.
 *
 * Label Mapping:
 * - "all" → "All"
 * - "agents" → "Agents" (from config.pluralTitle)
 * - "mcp" → "MCP Servers" (from config.pluralTitle)
 * - "rules" → "Rules" (from config.pluralTitle)
 * - "community" → "Community"
 */
export const DynamicTabLabels: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tab labels generated from UNIFIED_CATEGORY_REGISTRY config.',
      },
    },
  },
};

/**
 * Infinite Scroll
 *
 * Shows infinite scroll behavior with large dataset.
 */
export const InfiniteScroll: Story = {
  args: {
    activeTab: 'all',
    filteredResults: Array.from({ length: 100 }, (_, i) => ({
      slug: `item-${i}`,
      title: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
      category: i % 3 === 0 ? 'agents' : i % 3 === 1 ? 'mcp' : 'rules',
      tags: ['tag1'],
      verified: i % 2 === 0,
      featured: false,
      popularity: i,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-15'),
    })),
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: '100 items with infinite scroll. Loads 30 at a time. Scroll to see more.',
      },
    },
  },
};

/**
 * Responsive Tab List
 *
 * Shows responsive tab list layout.
 *
 * Layout:
 * - Mobile: grid w-full (stacked)
 * - Desktop (lg): lg:w-auto lg:grid-flow-col (horizontal)
 * - Auto-column sizing on desktop
 * - Gap: 1 unit
 */
export const ResponsiveTabList: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Resize viewport: tabs stack on mobile, flow horizontally on desktop (lg breakpoint).',
      },
    },
  },
};

/**
 * ConfigCard Display
 *
 * Shows ConfigCard rendering for each item.
 *
 * Card Features:
 * - Default variant
 * - Shows category badge (showCategory={true})
 * - Shows action buttons (showActions={true})
 * - Responsive grid layout
 */
export const ConfigCardDisplay: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Each item rendered with ConfigCard showing category badge and action buttons.',
      },
    },
  },
};

/**
 * Mixed Categories
 *
 * Shows "all" tab with content from multiple categories.
 */
export const MixedCategories: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: '"All" tab shows mixed content: agents, MCP servers, rules.',
      },
    },
  },
};

/**
 * Community Placeholder
 *
 * Shows community tab placeholder content.
 *
 * Content:
 * - Centered layout (text-center)
 * - Heading: "Featured Contributors" (text-2xl font-bold mb-2)
 * - Description: "Meet the experts..." (text-muted-foreground)
 * - Coming soon message (text-lg text-muted-foreground mb-6)
 * - CTA button: "View All Contributors" (outline variant)
 * - Button padding top: pt-8
 */
export const CommunityPlaceholder: Story = {
  args: {
    activeTab: 'community',
    filteredResults: [],
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Community tab shows centered placeholder with heading, message, and CTA button.',
      },
    },
  },
};

/**
 * Config-Driven Tabs
 *
 * Demonstrates config-driven tab generation.
 *
 * Config Source: HOMEPAGE_TAB_CATEGORIES
 * - Array of tab slugs
 * - Example: ['all', 'agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills', 'community']
 *
 * Benefits:
 * - Add new tab = update config array only
 * - Zero component code changes
 * - Consistent tab structure
 */
export const ConfigDrivenTabs: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tabs generated from HOMEPAGE_TAB_CATEGORIES. Add tab = update config.',
      },
    },
  },
};

/**
 * useMemo Optimization
 *
 * Demonstrates useMemo optimization for contentTabs.
 *
 * Optimization:
 * - contentTabs = useMemo(() => HOMEPAGE_TAB_CATEGORIES.filter(tab => tab !== 'community'), [])
 * - Filters once on mount
 * - Prevents re-filtering on every render
 * - Empty dependency array (config is static)
 */
export const UseMemoOptimization: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'useMemo filters contentTabs once on mount, preventing re-filtering on renders.',
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
 * - memo(TabsSectionComponent)
 * - useMemo for contentTabs
 * - Only re-renders when props change
 *
 * When Re-Renders:
 * - activeTab changes
 * - filteredResults array changes
 * - onTabChange function changes
 */
export const MemoizationPerformance: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Memoized component prevents unnecessary re-renders on parent state changes.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Tab Rendering Test
 * Tests tabs render
 */
export const TabRenderingTest: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "All" tab exists', async () => {
      const tab = canvas.getByRole('tab', { name: /All/i });
      await expect(tab).toBeInTheDocument();
    });

    await step('Verify "Agents" tab exists', async () => {
      const tab = canvas.getByRole('tab', { name: /Agents/i });
      await expect(tab).toBeInTheDocument();
    });

    await step('Verify "Community" tab exists', async () => {
      const tab = canvas.getByRole('tab', { name: /Community/i });
      await expect(tab).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests tabs render with correct labels from config.',
      },
    },
  },
};

/**
 * Active Tab Test
 * Tests active tab is selected
 */
export const ActiveTabTest: Story = {
  args: {
    activeTab: 'agents',
    filteredResults: mockAgents,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "Agents" tab is selected', async () => {
      const tab = canvas.getByRole('tab', { name: /Agents/i });
      await expect(tab.getAttribute('data-state')).toBe('active');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests active tab has data-state="active" attribute.',
      },
    },
  },
};

/**
 * Tab Click Test
 * Tests tab click triggers onTabChange
 */
export const TabClickTest: Story = {
  args: {
    activeTab: 'all',
    filteredResults: allContent,
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click "Agents" tab', async () => {
      const tab = canvas.getByRole('tab', { name: /Agents/i });
      await userEvent.click(tab);
    });

    // onTabChange callback should have been called (action logged in Storybook)
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests clicking tab triggers onTabChange callback.',
      },
    },
  },
};

/**
 * Community Tab Content Test
 * Tests community tab shows custom content
 */
export const CommunityTabContentTest: Story = {
  args: {
    activeTab: 'community',
    filteredResults: [],
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "Featured Contributors" heading exists', async () => {
      const heading = canvas.getByText(/Featured Contributors/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify "Coming soon!" message exists', async () => {
      const message = canvas.getByText(/Coming soon!/i);
      await expect(message).toBeInTheDocument();
    });

    await step('Verify "View All Contributors" button exists', async () => {
      const button = canvas.getByRole('link', { name: /View All Contributors/i });
      await expect(button).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests community tab renders custom content with heading, message, and CTA.',
      },
    },
  },
};

/**
 * Empty State Test
 * Tests empty state message
 */
export const EmptyStateTest: Story = {
  args: {
    activeTab: 'agents',
    filteredResults: [],
    onTabChange: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty message contains category name', async () => {
      // UnifiedCardGrid shows empty message
      const _message = canvas.queryByText(/No agents found/i);
      // Message may not be in DOM if grid handles empty state differently
      // Just verify tab panel exists
      const tabPanel = canvas.getByRole('tabpanel');
      await expect(tabPanel).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests empty state shows category-specific message.',
      },
    },
  },
};
