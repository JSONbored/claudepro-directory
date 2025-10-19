'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import type { ForYouFeedResponse } from '@/src/lib/schemas/personalization.schema';
import { ForYouFeedClient } from './for-you-feed-client';

/**
 * ForYouFeedClient Component Stories
 *
 * Personalized recommendations feed with category filtering and analytics tracking.
 *
 * Component: src/components/features/personalization/for-you-feed-client.tsx (161 LOC)
 * Used in: /for-you page
 * Dependencies: UnifiedCardGrid, ConfigCard, analytics tracker
 */
const meta = {
  title: 'Features/Personalization/ForYouFeedClient',
  component: ForYouFeedClient,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ForYouFeedClient>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData: ForYouFeedResponse = {
  recommendations: [
    {
      slug: 'react-expert',
      title: 'React Expert',
      description: 'React development specialist',
      category: 'agents',
      tags: ['react', 'frontend'],
      author: 'John Doe',
      popularity: 95,
      view_count: 1200,
      source: 'trending',
      reason: 'Popular in your interests',
    },
    {
      slug: 'supabase-mcp',
      title: 'Supabase MCP',
      description: 'Supabase integration',
      category: 'mcp',
      tags: ['supabase', 'database'],
      author: 'Jane Smith',
      popularity: 88,
      view_count: 800,
      source: 'collaborative',
      reason: 'Users like you enjoyed this',
    },
  ],
  user_has_history: true,
  sources_used: ['trending', 'collaborative'],
  generated_at: '2025-01-15T10:00:00Z',
};

export const Default: Story = {
  args: {
    initialData: mockData,
  },
};

export const SingleCategory: Story = {
  args: {
    initialData: {
      ...mockData,
      recommendations: mockData.recommendations.filter((r) => r.category === 'agents'),
    },
  },
};

export const EmptyRecommendations: Story = {
  args: {
    initialData: {
      ...mockData,
      recommendations: [],
    },
  },
};

export const CategoryFilterTest: Story = {
  args: {
    initialData: mockData,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "All" button exists', async () => {
      const allButton = canvas.getByRole('button', { name: /^All$/i });
      await expect(allButton).toBeInTheDocument();
    });

    await step('Click category filter', async () => {
      const categoryButton = canvas.getByRole('button', { name: /agents/i });
      await userEvent.click(categoryButton);
    });
  },
};
