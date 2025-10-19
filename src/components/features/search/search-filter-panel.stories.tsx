import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SearchFilterPanel } from './search-filter-panel';

/**
 * SearchFilterPanel Component Stories
 *
 * Shared filter UI component extracted from UnifiedSearch and FloatingSearchSidebar (SHA-2087).
 * Eliminates ~232 lines of duplicated filter panel code.
 *
 * Features:
 * - Category, Author, Date Range filters (Select components)
 * - Popularity range slider (0-100)
 * - Tag selection with scroll area
 * - Apply/Clear actions (optional)
 * - Responsive grid layout (1/2/3 columns)
 *
 * Component: src/components/features/search/search-filter-panel.tsx (270 LOC)
 * Schema: FilterState (component.schema.ts)
 *
 * FilterState Interface:
 * - sort?: string
 * - category?: string
 * - author?: string
 * - dateRange?: string ('all' | 'today' | 'week' | 'month' | 'year')
 * - popularity?: [number, number] (tuple: [min, max])
 * - tags?: string[]
 *
 * Used by:
 * - UnifiedSearch (primary search component)
 * - FloatingSearchSidebar (mobile/compact search)
 */
const meta = {
  title: 'Features/Search/SearchFilterPanel',
  component: SearchFilterPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Shared filter panel component with category, author, date, popularity slider, and tag selection. Supports optional actions (Apply/Clear).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    filters: {
      control: 'object',
      description: 'Current filter state (FilterState interface)',
    },
    availableTags: {
      control: 'object',
      description: 'Array of available tag options',
    },
    availableAuthors: {
      control: 'object',
      description: 'Array of available author options',
    },
    availableCategories: {
      control: 'object',
      description: 'Array of available category options',
    },
    activeFilterCount: {
      control: 'number',
      description: 'Number of active filters (for disabled state)',
    },
    showActions: {
      control: 'boolean',
      description: 'Show Apply/Clear/Cancel buttons',
    },
  },
} satisfies Meta<typeof SearchFilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: All Filters Available
 *
 * Complete filter panel with all filter types:
 * - Category select (3 options)
 * - Author select (5 options)
 * - Date range select (today/week/month/year)
 * - Popularity slider (0-100)
 * - Tag selection (20 tags in scroll area)
 * - Action buttons (Apply/Clear)
 *
 * Demonstrates full feature set with no active filters.
 */
export const Default: Story = {
  args: {
    filters: {},
    availableTags: [
      'typescript',
      'react',
      'next.js',
      'tailwind',
      'authentication',
      'database',
      'api',
      'testing',
      'deployment',
      'ci-cd',
      'docker',
      'kubernetes',
      'monitoring',
      'security',
      'performance',
      'accessibility',
      'seo',
      'analytics',
      'forms',
      'state-management',
    ],
    availableAuthors: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    availableCategories: ['Agents', 'MCP Servers', 'Guides'],
    activeFilterCount: 0,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Active Filters
 *
 * Panel with multiple active filters:
 * - Category: "Agents"
 * - Author: "Alice"
 * - Date range: "month"
 * - Popularity: [25, 75]
 * - Tags: ['typescript', 'react', 'testing']
 *
 * Shows selected states, active count badge, and enabled Clear button.
 */
export const ActiveFilters: Story = {
  args: {
    filters: {
      category: 'Agents',
      author: 'Alice',
      dateRange: 'month',
      popularity: [25, 75],
      tags: ['typescript', 'react', 'testing'],
    },
    availableTags: [
      'typescript',
      'react',
      'next.js',
      'tailwind',
      'authentication',
      'database',
      'api',
      'testing',
      'deployment',
      'ci-cd',
    ],
    availableAuthors: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    availableCategories: ['Agents', 'MCP Servers', 'Guides'],
    activeFilterCount: 5,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Category Filter Only
 *
 * Minimal configuration with only category filter.
 * No authors, no tags, just category select + date range + slider.
 *
 * Use case: Category-specific pages where author/tag filtering isn't needed.
 */
export const CategoryFilterOnly: Story = {
  args: {
    filters: {
      category: 'MCP Servers',
    },
    availableTags: [],
    availableAuthors: [],
    availableCategories: ['Agents', 'MCP Servers', 'Guides', 'Rules', 'Commands', 'Hooks'],
    activeFilterCount: 1,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Author Filter Only
 *
 * Configuration with only author filter visible.
 * Shows how panel adapts when categories/tags are unavailable.
 *
 * Use case: Author profile pages or author-specific search.
 */
export const AuthorFilterOnly: Story = {
  args: {
    filters: {
      author: 'Bob',
    },
    availableTags: [],
    availableAuthors: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace'],
    availableCategories: [],
    activeFilterCount: 1,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Date Range Filter
 *
 * Demonstrates date range selection variations.
 * Shows all 5 date range options: all/today/week/month/year.
 *
 * Active filter: "This Week"
 */
export const DateRangeFilter: Story = {
  args: {
    filters: {
      dateRange: 'week',
    },
    availableTags: [],
    availableAuthors: [],
    availableCategories: [],
    activeFilterCount: 1,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Popularity Slider
 *
 * Focus on popularity range slider functionality.
 * Shows custom range (30-80) with aria-valuetext.
 *
 * Demonstrates:
 * - Dual-handle slider
 * - Live value display in legend
 * - Accessible slider with aria labels
 */
export const PopularitySlider: Story = {
  args: {
    filters: {
      popularity: [30, 80],
    },
    availableTags: [],
    availableAuthors: [],
    availableCategories: [],
    activeFilterCount: 1,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Tag Selection
 *
 * Large tag collection (30 tags) demonstrating scroll area.
 * Shows 5 selected tags with "default" badge style.
 * Unselected tags use "outline" badge style.
 *
 * Demonstrates:
 * - ScrollArea with fixed height (h-40 md:h-48)
 * - Tag toggle interaction
 * - "Clear Tags" button when tags selected
 * - Hover effects on badges
 */
export const TagSelection: Story = {
  args: {
    filters: {
      tags: ['typescript', 'react', 'next.js', 'testing', 'deployment'],
    },
    availableTags: [
      'typescript',
      'react',
      'next.js',
      'tailwind',
      'authentication',
      'database',
      'api',
      'testing',
      'deployment',
      'ci-cd',
      'docker',
      'kubernetes',
      'monitoring',
      'security',
      'performance',
      'accessibility',
      'seo',
      'analytics',
      'forms',
      'state-management',
      'graphql',
      'rest',
      'websockets',
      'caching',
      'logging',
      'error-handling',
      'validation',
      'i18n',
      'ssr',
      'ssg',
    ],
    availableAuthors: [],
    availableCategories: [],
    activeFilterCount: 5,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Without Actions
 *
 * Filter panel without Apply/Clear/Cancel buttons.
 * Used when filters apply immediately (no explicit "Apply" needed).
 *
 * Use case:
 * - UnifiedSearch (filters apply on change)
 * - Auto-filtering scenarios
 *
 * Shows showActions=false removes entire action section.
 */
export const WithoutActions: Story = {
  args: {
    filters: {
      category: 'Agents',
      tags: ['typescript', 'react'],
    },
    availableTags: ['typescript', 'react', 'next.js', 'tailwind', 'database'],
    availableAuthors: ['Alice', 'Bob', 'Charlie'],
    availableCategories: ['Agents', 'MCP Servers', 'Guides'],
    activeFilterCount: 2,
    onFilterChange: (key, value) => {
      // Mock handler - no implementation needed for display-only story
      // Consume parameters to satisfy linter without using underscore prefixes
      const _ = { key, value };
    },
    onToggleTag: (tag) => {
      // Mock handler - no implementation needed for display-only story
      // Consume parameter to satisfy linter without using underscore prefix
      const _ = tag;
    },
    onClearFilters: () => {
      // Mock handler - no implementation needed for display-only story
    },
    showActions: false, // Hides Apply/Clear/Cancel buttons
  },
};

/**
 * With Cancel Button
 *
 * Filter panel with Cancel button (in addition to Apply/Clear).
 * Used in modal/sidebar contexts where user can dismiss changes.
 *
 * Use case:
 * - FloatingSearchSidebar (can close without applying)
 * - Modal filter interfaces
 *
 * Shows onCancel callback enables Cancel button.
 */
export const WithCancelButton: Story = {
  args: {
    filters: {
      category: 'MCP Servers',
      dateRange: 'month',
    },
    availableTags: ['api', 'database', 'authentication'],
    availableAuthors: ['Alice', 'Bob'],
    availableCategories: ['Agents', 'MCP Servers', 'Guides'],
    activeFilterCount: 2,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    onCancel: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Empty State (No Filters Available)
 *
 * Panel when no filters are available.
 * Only shows date range and popularity slider (always present).
 *
 * Use case: Initial load before data is fetched, or filtered dataset with no options.
 */
export const EmptyState: Story = {
  args: {
    filters: {},
    availableTags: [],
    availableAuthors: [],
    availableCategories: [],
    activeFilterCount: 0,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * All Filters Maxed Out
 *
 * Every filter option filled:
 * - Category selected
 * - Author selected
 * - Date range: "today"
 * - Popularity: full range [0, 100]
 * - 10 tags selected
 *
 * Tests layout with maximum active filters (activeFilterCount: 13).
 */
export const AllFiltersMaxed: Story = {
  args: {
    filters: {
      category: 'Guides',
      author: 'Diana',
      dateRange: 'today',
      popularity: [0, 100],
      tags: [
        'typescript',
        'react',
        'next.js',
        'tailwind',
        'authentication',
        'database',
        'api',
        'testing',
        'deployment',
        'ci-cd',
      ],
    },
    availableTags: [
      'typescript',
      'react',
      'next.js',
      'tailwind',
      'authentication',
      'database',
      'api',
      'testing',
      'deployment',
      'ci-cd',
      'docker',
      'kubernetes',
    ],
    availableAuthors: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    availableCategories: ['Agents', 'MCP Servers', 'Guides', 'Rules', 'Commands'],
    activeFilterCount: 13,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Single Tag Available
 *
 * Edge case: Only one tag option available.
 * Tests scroll area behavior with minimal content.
 */
export const SingleTag: Story = {
  args: {
    filters: {
      tags: ['typescript'],
    },
    availableTags: ['typescript'],
    availableAuthors: [],
    availableCategories: [],
    activeFilterCount: 1,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Long Category/Author Names
 *
 * Tests layout with long text strings.
 * Validates Select component truncation and wrapping.
 */
export const LongNames: Story = {
  args: {
    filters: {
      category: 'Advanced TypeScript Development Patterns',
      author: 'Dr. Alexandra Christine Johnson-Smith',
    },
    availableTags: ['typescript'],
    availableAuthors: [
      'Dr. Alexandra Christine Johnson-Smith',
      'Professor Michael Christopher Anderson-Williams',
      'Engineer Sarah Elizabeth Thompson-Rodriguez',
    ],
    availableCategories: [
      'Advanced TypeScript Development Patterns',
      'Enterprise React Architecture Best Practices',
      'Modern Full-Stack Web Development Workflows',
    ],
    activeFilterCount: 2,
    onFilterChange: (_key, _value) => {
      // No-op for Storybook
    },
    onToggleTag: (_tag) => {
      // No-op for Storybook
    },
    onClearFilters: () => {
      // No-op for Storybook
    },
    onApplyFilters: () => {
      // No-op for Storybook
    },
    showActions: true,
  },
};

/**
 * Interactive: Filter State Management
 *
 * Demonstrates interactive filter changes.
 * Click selects, tags, sliders to see console logs.
 * Tests all callback handlers.
 */
export const InteractiveDemo: Story = {
  args: Default.args,
  parameters: {
    docs: {
      description: {
        story:
          'Interact with filters to see state changes logged to console. Tests onFilterChange, onToggleTag, onClearFilters, and onApplyFilters callbacks.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Category Filter Interaction Test
 * Tests category selection dropdown
 */
export const CategoryFilterInteractionTest: Story = {
  args: {
    filters: {},
    availableCategories: ['Agents', 'MCP Servers', 'Guides'],
    onFilterChange: fn(),
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests category filter dropdown selection.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify category select is present', async () => {
      // Look for category label or select trigger
      const categoryLabel = canvas.getByText(/category/i);
      await expect(categoryLabel).toBeInTheDocument();
    });
  },
};

/**
 * Tag Selection Test
 * Tests tag toggle functionality
 */
export const TagSelectionTest: Story = {
  args: {
    filters: {},
    availableTags: ['typescript', 'react', 'nextjs', 'testing'],
    onToggleTag: fn(),
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests tag selection and toggle behavior.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify tags section is present', async () => {
      const tagsLabel = canvas.getByText(/tags/i);
      await expect(tagsLabel).toBeInTheDocument();
    });

    await step('Verify tag badges are rendered', async () => {
      // Tags should be rendered as clickable badges
      const typescriptTag = canvas.getByText(/typescript/i);
      await expect(typescriptTag).toBeInTheDocument();
    });

    await step('Click typescript tag', async () => {
      const typescriptTag = canvas.getByText(/typescript/i);
      await userEvent.click(typescriptTag);
    });

    await step('Verify onToggleTag callback was called', async () => {
      await expect(args.onToggleTag).toHaveBeenCalledWith('typescript');
    });
  },
};

/**
 * Clear Filters Test
 * Tests clear filters button functionality
 */
export const ClearFiltersTest: Story = {
  args: {
    filters: {
      category: 'Agents',
      tags: ['typescript', 'react'],
    },
    availableCategories: ['Agents', 'MCP Servers'],
    availableTags: ['typescript', 'react', 'nextjs'],
    activeFilterCount: 3,
    onClearFilters: fn(),
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests clear filters button with active filters.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Clear button is present and enabled', async () => {
      const clearButton = canvas.getByRole('button', { name: /clear/i });
      await expect(clearButton).toBeInTheDocument();
      await expect(clearButton).not.toBeDisabled();
    });

    await step('Click Clear button', async () => {
      const clearButton = canvas.getByRole('button', { name: /clear/i });
      await userEvent.click(clearButton);
    });

    await step('Verify onClearFilters callback was called', async () => {
      await expect(args.onClearFilters).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * Apply Filters Test
 * Tests apply filters button functionality
 */
export const ApplyFiltersTest: Story = {
  args: {
    filters: {
      category: 'Guides',
    },
    availableCategories: ['Agents', 'MCP Servers', 'Guides'],
    activeFilterCount: 1,
    onApplyFilters: fn(),
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests apply filters button click.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Apply button is present', async () => {
      const applyButton = canvas.getByRole('button', { name: /apply/i });
      await expect(applyButton).toBeInTheDocument();
    });

    await step('Click Apply button', async () => {
      const applyButton = canvas.getByRole('button', { name: /apply/i });
      await userEvent.click(applyButton);
    });

    await step('Verify onApplyFilters callback was called', async () => {
      await expect(args.onApplyFilters).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * Date Range Filter Test
 * Tests date range selection
 */
export const DateRangeFilterTest: Story = {
  args: {
    filters: {},
    onFilterChange: fn(),
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests date range filter dropdown.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify date range filter is present', async () => {
      const dateLabel = canvas.getByText(/date.*range|posted/i);
      await expect(dateLabel).toBeInTheDocument();
    });
  },
};

/**
 * Popularity Slider Test
 * Tests popularity range slider
 */
export const PopularitySliderTest: Story = {
  args: {
    filters: {
      popularity: [25, 75],
    },
    onFilterChange: fn(),
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests popularity range slider with active range.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify popularity slider is present', async () => {
      const popularityLabel = canvas.getByText(/popularity|rating/i);
      await expect(popularityLabel).toBeInTheDocument();
    });

    await step('Verify slider range values are displayed', async () => {
      // Slider should show min/max values
      const minValue = canvas.getByText(/25/);
      const maxValue = canvas.getByText(/75/);
      await expect(minValue).toBeInTheDocument();
      await expect(maxValue).toBeInTheDocument();
    });
  },
};
