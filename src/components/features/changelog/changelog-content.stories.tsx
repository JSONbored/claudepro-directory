'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import type { ChangelogEntry } from '@/src/lib/schemas/changelog.schema';
import { ChangelogContent } from './changelog-content';

const meta = {
  title: 'Features/Changelog/ChangelogContent',
  component: ChangelogContent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChangelogContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockEntry: ChangelogEntry = {
  version: '2.1.0',
  date: '2025-01-15',
  title: 'Major Feature Release',
  description: 'Added new features and fixed bugs',
  tldr: 'This release adds dark mode support and fixes critical performance issues.',
  content: '## What Changed\n\nAdded dark mode support and improved performance.',
  categories: {
    Added: ['Dark mode', 'New dashboard'],
    Changed: ['Updated UI design'],
    Fixed: ['Button alignment bug'],
    Removed: [],
    Deprecated: [],
    Security: [],
  },
  slug: '2-1-0',
};

export const Default: Story = {
  args: {
    entry: mockEntry,
  },
};

export const WithoutTLDR: Story = {
  args: {
    entry: { ...mockEntry, tldr: undefined },
  },
};

export const AllCategories: Story = {
  args: {
    entry: {
      ...mockEntry,
      categories: {
        Added: ['Feature'],
        Changed: ['Update'],
        Fixed: ['Bug'],
        Removed: ['Old feature'],
        Deprecated: ['API'],
        Security: ['Vuln fix'],
      },
    },
  },
};

export const TLDRTest: Story = {
  args: {
    entry: mockEntry,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify TL;DR heading exists', async () => {
      const heading = canvas.getByText(/TL;DR/i);
      await expect(heading).toBeInTheDocument();
    });
  },
};
