import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { BookmarkButton } from './bookmark-button';

const meta = {
  title: 'Shared/BookmarkButton',
  component: BookmarkButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toggle bookmark button for content items. Supports multiple content types with optimistic UI updates.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    contentType: {
      control: 'select',
      options: [
        'agents',
        'mcp',
        'rules',
        'commands',
        'hooks',
        'statuslines',
        'guides',
        'collections',
      ],
      description: 'Type of content to bookmark',
    },
    contentSlug: {
      control: 'text',
      description: 'Unique slug identifier for the content',
    },
    initialBookmarked: {
      control: 'boolean',
      description: 'Initial bookmark state',
    },
    showLabel: {
      control: 'boolean',
      description: 'Whether to show Save/Saved label',
    },
  },
} satisfies Meta<typeof BookmarkButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default bookmark button (not bookmarked)
 */
export const Default: Story = {
  args: {
    contentType: 'agents',
    contentSlug: 'example-agent',
    initialBookmarked: false,
    showLabel: false,
  },
};

/**
 * Bookmarked state
 */
export const Bookmarked: Story = {
  args: {
    contentType: 'agents',
    contentSlug: 'example-agent',
    initialBookmarked: true,
    showLabel: false,
  },
};

/**
 * With label (not bookmarked)
 */
export const WithLabel: Story = {
  args: {
    contentType: 'agents',
    contentSlug: 'example-agent',
    initialBookmarked: false,
    showLabel: true,
  },
};

/**
 * With label (bookmarked)
 */
export const WithLabelBookmarked: Story = {
  args: {
    contentType: 'agents',
    contentSlug: 'example-agent',
    initialBookmarked: true,
    showLabel: true,
  },
};

/**
 * MCP content type
 */
export const McpContent: Story = {
  args: {
    contentType: 'mcp',
    contentSlug: 'example-mcp-server',
    initialBookmarked: false,
    showLabel: true,
  },
};

/**
 * Command content type
 */
export const CommandContent: Story = {
  args: {
    contentType: 'commands',
    contentSlug: 'example-command',
    initialBookmarked: false,
    showLabel: true,
  },
};

/**
 * Hook content type
 */
export const HookContent: Story = {
  args: {
    contentType: 'hooks',
    contentSlug: 'example-hook',
    initialBookmarked: true,
    showLabel: false,
  },
};

/**
 * Guide content type
 */
export const GuideContent: Story = {
  args: {
    contentType: 'guides',
    contentSlug: 'getting-started',
    initialBookmarked: false,
    showLabel: true,
  },
};

/**
 * Collection content type
 */
export const CollectionContent: Story = {
  args: {
    contentType: 'collections',
    contentSlug: 'best-practices',
    initialBookmarked: true,
    showLabel: true,
  },
};

/**
 * Interactive demo showing toggle behavior
 */
export const InteractiveDemo: Story = {
  args: {
    contentType: 'agents',
    contentSlug: 'interactive-example',
    initialBookmarked: false,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Click to toggle bookmark state. Server actions are mocked in Storybook.',
      },
    },
  },
};

/**
 * All states showcase
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BookmarkButton
          contentType="agents"
          contentSlug="example-1"
          initialBookmarked={false}
          showLabel={false}
        />
        <span className="text-sm">Not bookmarked (icon only)</span>
      </div>
      <div className="flex items-center gap-2">
        <BookmarkButton
          contentType="agents"
          contentSlug="example-2"
          initialBookmarked={true}
          showLabel={false}
        />
        <span className="text-sm">Bookmarked (icon only)</span>
      </div>
      <div className="flex items-center gap-2">
        <BookmarkButton
          contentType="agents"
          contentSlug="example-3"
          initialBookmarked={false}
          showLabel={true}
        />
        <span className="text-sm">Not bookmarked (with label)</span>
      </div>
      <div className="flex items-center gap-2">
        <BookmarkButton
          contentType="agents"
          contentSlug="example-4"
          initialBookmarked={true}
          showLabel={true}
        />
        <span className="text-sm">Bookmarked (with label)</span>
      </div>
    </div>
  ),
};
