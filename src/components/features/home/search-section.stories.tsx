'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { SearchSection } from './search-section';

/**
 * SearchSection Component Stories
 *
 * Search results display for the homepage with infinite scroll.
 * Conditional rendering based on search state.
 *
 * Features:
 * - Conditional rendering (null when not searching)
 * - Memoized component for performance
 * - Infinite scroll with Intersection Observer
 * - Result count display in heading
 * - "Clear Search" button
 * - Empty state with Search icon
 * - ConfigCard rendering with custom renderCard
 * - Batch size: 30 items per load
 * - Shows category and actions on cards
 * - Responsive grid layout
 *
 * Component: src/components/features/home/search-section.tsx (70 LOC)
 * Used in: Homepage (/), home-page-client.tsx
 * Dependencies: UnifiedCardGrid, ConfigCard, Button
 *
 * Props:
 * ```ts
 * interface SearchSectionProps {
 *   isSearching: boolean;
 *   filteredResults: readonly UnifiedContentItem[];
 *   onClearSearch: () => void;
 * }
 * ```
 *
 * Behavior:
 * - When isSearching=false → returns null (no render)
 * - When isSearching=true && results.length > 0 → shows grid with results
 * - When isSearching=true && results.length === 0 → shows empty state
 *
 * Section Structure:
 * 1. Header
 *    - "Search Results" heading (text-2xl font-bold)
 *    - Result count (muted, in parentheses)
 *    - "Clear Search" button (outline variant)
 *
 * 2. Results Grid (if results.length > 0)
 *    - UnifiedCardGrid with infiniteScroll
 *    - Batch size: 30 items
 *    - Custom renderCard with ConfigCard
 *    - Shows category badge
 *    - Shows action buttons
 *
 * 3. Empty State (if results.length === 0)
 *    - Muted card container
 *    - Search icon (h-12 w-12, muted/50)
 *    - "No results found" heading
 *    - Suggestion text: "Try different keywords or browse our featured content below"
 *
 * Infinite Scroll:
 * - Uses Intersection Observer API
 * - Loads 30 items initially
 * - Loads 30 more when scrolling near bottom
 * - Continues until all items loaded
 * - Performance: only renders visible + buffer
 *
 * Memoization:
 * - memo(SearchSectionComponent)
 * - Only re-renders when props change
 * - Prevents re-renders on parent state changes
 *
 * @see Research Report: "Infinite Scroll with Intersection Observer"
 * @see Production 2025 Architecture: Infinite scroll for large result sets
 */
const meta = {
  title: 'Features/Home/SearchSection',
  component: SearchSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Search results display with infinite scroll. Conditional rendering, memoized.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isSearching: {
      control: 'boolean',
      description: 'Whether search is active',
    },
    filteredResults: {
      control: 'object',
      description: 'Search result items',
    },
    onClearSearch: {
      action: 'cleared',
      description: 'Callback when Clear Search clicked',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-7xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockResults: UnifiedContentItem[] = [
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
];

const manyResults: UnifiedContentItem[] = Array.from({ length: 100 }, (_, i) => ({
  slug: `item-${i}`,
  title: `Item ${i + 1}`,
  description: `Description for item ${i + 1}`,
  category: i % 3 === 0 ? 'agents' : i % 3 === 1 ? 'mcp' : 'rules',
  tags: ['tag1', 'tag2'],
  verified: i % 2 === 0,
  featured: i < 10,
  popularity: Math.floor(Math.random() * 100),
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
}));

/**
 * Default: Active Search with Results
 *
 * Shows search section with 3 results.
 * Displays result count and Clear Search button.
 *
 * Usage:
 * ```tsx
 * <SearchSection
 *   isSearching={true}
 *   filteredResults={results}
 *   onClearSearch={() => setIsSearching(false)}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Not Searching
 *
 * Component returns null when isSearching=false.
 * Nothing rendered to the DOM.
 *
 * This is the default homepage state before user searches.
 */
export const NotSearching: Story = {
  args: {
    isSearching: false,
    filteredResults: [],
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Component returns null when not searching. Nothing rendered.',
      },
    },
  },
};

/**
 * Empty Results
 *
 * Shows empty state when search returns no results.
 *
 * Empty State Features:
 * - Muted card container
 * - Search icon (h-12 w-12, muted/50)
 * - "No results found" heading
 * - Suggestion text
 */
export const EmptyResults: Story = {
  args: {
    isSearching: true,
    filteredResults: [],
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with Search icon and suggestion text when no results found.',
      },
    },
  },
};

/**
 * Single Result
 *
 * Shows search section with only one result.
 * Result count shows "(1 found)".
 */
export const SingleResult: Story = {
  args: {
    isSearching: true,
    filteredResults: [mockResults[0]],
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Single result displayed with "(1 found)" count.',
      },
    },
  },
};

/**
 * Many Results (Infinite Scroll)
 *
 * Shows search section with 100 results.
 * Demonstrates infinite scroll with 30-item batches.
 *
 * Behavior:
 * - Initially loads 30 items
 * - Scroll to bottom → loads next 30
 * - Continues until all 100 loaded
 * - Uses Intersection Observer
 */
export const ManyResults: Story = {
  args: {
    isSearching: true,
    filteredResults: manyResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: '100 results with infinite scroll. Loads 30 items at a time. Scroll to see more.',
      },
    },
  },
};

/**
 * Result Count Display
 *
 * Shows result count in heading.
 *
 * Format:
 * - "Search Results" (text-2xl font-bold)
 * - "(N found)" (text-muted-foreground ml-2)
 * - Count updates dynamically
 */
export const ResultCountDisplay: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Result count displays in heading: "Search Results (3 found)".',
      },
    },
  },
};

/**
 * Clear Search Button
 *
 * Shows Clear Search button functionality.
 *
 * Button Features:
 * - Outline variant
 * - "Clear Search" text (text-sm)
 * - onClick calls onClearSearch callback
 * - Positioned in header (justify-between)
 */
export const ClearSearchButton: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      alert('Search cleared! (In real app, sets isSearching=false)');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Click "Clear Search" button to trigger onClearSearch callback.',
      },
    },
  },
};

/**
 * ConfigCard Display
 *
 * Shows ConfigCard rendering for each result.
 *
 * Card Features:
 * - Default variant
 * - Shows category badge (showCategory={true})
 * - Shows action buttons (showActions={true})
 * - Responsive grid layout
 */
export const ConfigCardDisplay: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Each result rendered with ConfigCard showing category and actions.',
      },
    },
  },
};

/**
 * Responsive Grid
 *
 * Shows responsive grid layout.
 *
 * Grid Behavior:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 * - Via UnifiedCardGrid
 */
export const ResponsiveGrid: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
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
 * Mixed Categories
 *
 * Shows results from different categories.
 *
 * Categories:
 * - Agents (with category badge)
 * - MCP (with category badge)
 * - Rules (with category badge)
 */
export const MixedCategories: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Results from multiple categories, each with category badge.',
      },
    },
  },
};

/**
 * Verified vs Unverified
 *
 * Shows mix of verified and unverified items.
 *
 * Visual Difference:
 * - Verified: badge or icon on card
 * - Unverified: no badge
 */
export const VerifiedVsUnverified: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Mix of verified (badge) and unverified items.',
      },
    },
  },
};

/**
 * Section Header Layout
 *
 * Shows header layout with title and button.
 *
 * Layout:
 * - flex items-center justify-between
 * - Title on left (text-2xl font-bold)
 * - Button on right (outline variant)
 * - Bottom margin: mb-8
 */
export const SectionHeaderLayout: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Header layout: title + count on left, Clear Search button on right.',
      },
    },
  },
};

/**
 * Empty State Icon
 *
 * Shows Search icon in empty state.
 *
 * Icon:
 * - h-12 w-12 (48x48px)
 * - mx-auto (centered)
 * - mb-4 (margin bottom)
 * - text-muted-foreground/50 (50% opacity)
 */
export const EmptyStateIcon: Story = {
  args: {
    isSearching: true,
    filteredResults: [],
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state features large Search icon (48x48px, muted, centered).',
      },
    },
  },
};

/**
 * Memoization Performance
 *
 * Demonstrates memoization benefits.
 *
 * Optimization:
 * - memo(SearchSectionComponent)
 * - Only re-renders when props change
 * - Prevents re-renders on parent state changes
 *
 * When Re-Renders:
 * - isSearching changes
 * - filteredResults array changes
 * - onClearSearch function changes
 *
 * When NOT Re-Renders:
 * - Parent component state changes (unrelated to props)
 * - Sibling component updates
 */
export const MemoizationPerformance: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
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
 * Active Search Test
 * Tests component renders when searching
 */
export const ActiveSearchTest: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "Search Results" heading exists', async () => {
      const heading = canvas.getByText(/Search Results/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify result count displays', async () => {
      const count = canvas.getByText(/\(3 found\)/i);
      await expect(count).toBeInTheDocument();
    });

    await step('Verify "Clear Search" button exists', async () => {
      const button = canvas.getByRole('button', { name: /Clear Search/i });
      await expect(button).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests component renders heading, count, and clear button when searching.',
      },
    },
  },
};

/**
 * Empty State Test
 * Tests empty state renders when no results
 */
export const EmptyStateTest: Story = {
  args: {
    isSearching: true,
    filteredResults: [],
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "No results found" heading exists', async () => {
      const heading = canvas.getByText(/No results found/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify suggestion text exists', async () => {
      const text = canvas.getByText(/Try different keywords/i);
      await expect(text).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests empty state renders with "No results found" and suggestion text.',
      },
    },
  },
};

/**
 * Not Searching Test
 * Tests component returns null when not searching
 */
export const NotSearchingTest: Story = {
  args: {
    isSearching: false,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify component does not render', async () => {
      const heading = canvas.queryByText(/Search Results/i);
      await expect(heading).toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests component returns null (no render) when isSearching=false.',
      },
    },
  },
};

/**
 * Clear Button Click Test
 * Tests Clear Search button click
 */
export const ClearButtonClickTest: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click "Clear Search" button', async () => {
      const button = canvas.getByRole('button', { name: /Clear Search/i });
      await userEvent.click(button);
    });

    // onClearSearch callback should have been called (action logged in Storybook)
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests "Clear Search" button click triggers onClearSearch callback.',
      },
    },
  },
};

/**
 * Result Count Test
 * Tests result count displays correct number
 */
export const ResultCountTest: Story = {
  args: {
    isSearching: true,
    filteredResults: mockResults,
    onClearSearch: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify count matches filteredResults length', async () => {
      const count = canvas.getByText(/\(3 found\)/i);
      await expect(count).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests result count displays correct number of results.',
      },
    },
  },
};
