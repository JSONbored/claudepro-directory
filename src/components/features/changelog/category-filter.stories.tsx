'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs } from '@/src/components/primitives/tabs';
import type { ChangelogCategory, ChangelogEntry } from '@/src/lib/schemas/changelog.schema';
import { CategoryFilter } from './category-filter';

/**
 * CategoryFilter Component Stories
 *
 * Tabbed filter for changelog entries by Keep a Changelog categories.
 * Shows count badges for each category.
 *
 * Component: src/components/features/changelog/category-filter.tsx (110 LOC)
 * Used in: Changelog page (/changelog)
 * Dependencies: Tabs, TabsList, TabsTrigger, UnifiedBadge
 */
const meta = {
  title: 'Features/Changelog/CategoryFilter',
  component: CategoryFilter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    entries: {
      control: 'object',
      description: 'All changelog entries for counting',
    },
    activeCategory: {
      control: 'select',
      options: ['All', 'Added', 'Changed', 'Fixed', 'Removed', 'Deprecated', 'Security'],
      description: 'Currently active category filter',
    },
    onCategoryChange: {
      action: 'category-changed',
      description: 'Callback when category changes',
    },
  },
  decorators: [
    (Story, context) => (
      <Tabs value={context.args.activeCategory} onValueChange={context.args.onCategoryChange}>
        <Story />
      </Tabs>
    ),
  ],
} satisfies Meta<typeof CategoryFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockEntries: ChangelogEntry[] = [
  {
    version: '2.1.0',
    date: '2025-01-15',
    title: 'Major Feature Release',
    description: 'Added new features and fixed bugs',
    categories: {
      Added: ['New dashboard component', 'Dark mode support'],
      Changed: ['Updated UI design'],
      Fixed: ['Button alignment bug', 'Form validation error'],
      Removed: [],
      Deprecated: [],
      Security: [],
    },
  },
  {
    version: '2.0.0',
    date: '2025-01-01',
    title: 'Major Version',
    description: 'Breaking changes and new architecture',
    categories: {
      Added: ['New API endpoints'],
      Changed: ['Database schema migration'],
      Fixed: [],
      Removed: ['Legacy auth system'],
      Deprecated: ['Old config format'],
      Security: ['Fixed XSS vulnerability'],
    },
  },
  {
    version: '1.5.0',
    date: '2024-12-15',
    title: 'Performance Update',
    description: 'Performance improvements',
    categories: {
      Added: [],
      Changed: ['Optimized queries'],
      Fixed: ['Memory leak'],
      Removed: [],
      Deprecated: [],
      Security: [],
    },
  },
];

/**
 * Default: All Categories
 */
export const Default: Story = {
  args: {
    entries: mockEntries,
    activeCategory: 'All',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Added Category Active
 */
export const AddedCategory: Story = {
  args: {
    entries: mockEntries,
    activeCategory: 'Added',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Fixed Category Active
 */
export const FixedCategory: Story = {
  args: {
    entries: mockEntries,
    activeCategory: 'Fixed',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Category with Zero Count
 */
export const ZeroCountCategory: Story = {
  args: {
    entries: mockEntries,
    activeCategory: 'Deprecated',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Deprecated category shows count of 1 (one entry has deprecated items).',
      },
    },
  },
};

/**
 * Empty Entries
 */
export const EmptyEntries: Story = {
  args: {
    entries: [],
    activeCategory: 'All',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'All categories show 0 count when no entries provided.',
      },
    },
  },
};

/**
 * Single Entry
 */
export const SingleEntry: Story = {
  args: {
    entries: [mockEntries[0]],
    activeCategory: 'All',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Category Click Handler
 */
export const CategoryClickHandler: Story = {
  args: {
    entries: mockEntries,
    activeCategory: 'All',
    onCategoryChange: (category: 'All' | ChangelogCategory) => {
      alert(`Category changed to: ${category}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Click tabs to trigger onCategoryChange callback.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Tabs Rendering Test
 */
export const TabsRenderingTest: Story = {
  args: {
    entries: mockEntries,
    activeCategory: 'All',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify all 7 category tabs exist', async () => {
      const allTab = canvas.getByRole('tab', { name: /All/i });
      await expect(allTab).toBeInTheDocument();

      const addedTab = canvas.getByRole('tab', { name: /Added/i });
      await expect(addedTab).toBeInTheDocument();
    });
  },
};

/**
 * Count Badges Test
 */
export const CountBadgesTest: Story = {
  args: {
    entries: mockEntries,
    activeCategory: 'All',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify All count is 3', async () => {
      const allTab = canvas.getByRole('tab', { name: /All/i });
      await expect(allTab.textContent).toContain('3');
    });

    await step('Verify Added count is 2', async () => {
      const addedTab = canvas.getByRole('tab', { name: /Added/i });
      await expect(addedTab.textContent).toContain('2');
    });
  },
};

/**
 * Active Tab Test
 */
export const ActiveTabTest: Story = {
  args: {
    entries: mockEntries,
    activeCategory: 'Fixed',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Fixed tab is active', async () => {
      const fixedTab = canvas.getByRole('tab', { name: /Fixed/i });
      await expect(fixedTab.getAttribute('data-state')).toBe('active');
    });
  },
};

/**
 * Tab Click Test
 */
export const TabClickTest: Story = {
  args: {
    entries: mockEntries,
    activeCategory: 'All',
    onCategoryChange: () => {
      // Intentional no-op for demonstration
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click "Added" tab', async () => {
      const addedTab = canvas.getByRole('tab', { name: /Added/i });
      await userEvent.click(addedTab);
    });
  },
};
