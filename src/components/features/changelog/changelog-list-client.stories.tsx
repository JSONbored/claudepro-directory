'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import type { ChangelogEntry } from '@/src/lib/schemas/changelog.schema';
import { ChangelogListClient } from './changelog-list-client';

const meta = {
  title: 'Features/Changelog/ChangelogListClient',
  component: ChangelogListClient,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChangelogListClient>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockEntries: ChangelogEntry[] = [
  {
    version: '2.1.0',
    date: '2025-01-15',
    title: 'Major Feature Release',
    description: 'New features',
    tldr: 'Dark mode and performance',
    content: 'Content',
    categories: {
      Added: ['Dark mode'],
      Changed: ['UI'],
      Fixed: ['Bug'],
      Removed: [],
      Deprecated: [],
      Security: [],
    },
    slug: '2-1-0',
  },
  {
    version: '2.0.0',
    date: '2025-01-01',
    title: 'Major Version',
    description: 'Breaking changes',
    tldr: undefined,
    content: 'Content',
    categories: {
      Added: ['API'],
      Changed: [],
      Fixed: [],
      Removed: ['Legacy'],
      Deprecated: [],
      Security: ['XSS fix'],
    },
    slug: '2-0-0',
  },
];

export const Default: Story = {
  args: {
    entries: mockEntries,
  },
};

export const EmptyEntries: Story = {
  args: {
    entries: [],
  },
};

export const SingleEntry: Story = {
  args: {
    entries: [mockEntries[0]],
  },
};

export const EntriesRenderTest: Story = {
  args: {
    entries: mockEntries,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify entries render', async () => {
      const title = canvas.getByText(/Major Feature Release/i);
      await expect(title).toBeInTheDocument();
    });
  },
};
