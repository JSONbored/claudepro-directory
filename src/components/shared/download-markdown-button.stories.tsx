import type { Meta, StoryObj } from '@storybook/react';
import { DownloadMarkdownButton, DownloadMarkdownButtonIcon } from './download-markdown-button';

const meta = {
  title: 'Shared/DownloadMarkdownButton',
  component: DownloadMarkdownButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'One-click download button for markdown-formatted content. Provides markdown files with proper metadata and attribution footer. Uses BaseActionButton for unified state management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    category: {
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
      description: 'Content category for download',
    },
    slug: {
      control: 'text',
      description: 'Content slug identifier',
    },
    label: {
      control: 'text',
      description: 'Button label text',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size variant',
    },
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Button style variant',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show download icon',
    },
  },
} satisfies Meta<typeof DownloadMarkdownButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default download button with outline styling
 */
export const Default: Story = {
  args: {
    category: 'agents',
    slug: 'code-review-assistant',
    label: 'Download Markdown',
    size: 'sm',
    variant: 'outline',
    showIcon: true,
  },
};

/**
 * MCP server download button
 */
export const McpServer: Story = {
  args: {
    category: 'mcp',
    slug: 'github-mcp-server',
    label: 'Download Markdown',
    size: 'sm',
    variant: 'outline',
  },
};

/**
 * Command download button
 */
export const Command: Story = {
  args: {
    category: 'commands',
    slug: 'generate-tests',
    label: 'Download Markdown',
    size: 'sm',
    variant: 'outline',
  },
};

/**
 * Guide download button
 */
export const Guide: Story = {
  args: {
    category: 'guides',
    slug: 'getting-started',
    label: 'Download Guide',
    size: 'default',
    variant: 'secondary',
  },
};

/**
 * Large primary button
 */
export const LargePrimary: Story = {
  args: {
    category: 'agents',
    slug: 'api-builder',
    label: 'Download Now',
    size: 'lg',
    variant: 'default',
  },
};

/**
 * Ghost variant button
 */
export const Ghost: Story = {
  args: {
    category: 'rules',
    slug: 'best-practices',
    label: 'Download',
    size: 'sm',
    variant: 'ghost',
  },
};

/**
 * Button without icon
 */
export const NoIcon: Story = {
  args: {
    category: 'collections',
    slug: 'starter-pack',
    label: 'Download Collection',
    size: 'default',
    variant: 'default',
    showIcon: false,
  },
};

/**
 * Icon-only button variant
 */
export const IconOnly: StoryObj<typeof DownloadMarkdownButtonIcon> = {
  render: (args) => <DownloadMarkdownButtonIcon {...args} />,
  args: {
    category: 'agents',
    slug: 'code-review-assistant',
    variant: 'ghost',
  },
};

/**
 * Icon-only with outline variant
 */
export const IconOnlyOutline: StoryObj<typeof DownloadMarkdownButtonIcon> = {
  render: (args) => <DownloadMarkdownButtonIcon {...args} />,
  args: {
    category: 'mcp',
    slug: 'filesystem-server',
    variant: 'outline',
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <DownloadMarkdownButton
          category="agents"
          slug="example-1"
          label="Default"
          variant="default"
          size="sm"
        />
        <DownloadMarkdownButton
          category="agents"
          slug="example-2"
          label="Secondary"
          variant="secondary"
          size="sm"
        />
        <DownloadMarkdownButton
          category="agents"
          slug="example-3"
          label="Outline"
          variant="outline"
          size="sm"
        />
        <DownloadMarkdownButton
          category="agents"
          slug="example-4"
          label="Ghost"
          variant="ghost"
          size="sm"
        />
      </div>
      <div className="flex gap-2 items-center">
        <DownloadMarkdownButtonIcon category="agents" slug="example-5" variant="ghost" />
        <DownloadMarkdownButtonIcon category="agents" slug="example-6" variant="outline" />
      </div>
    </div>
  ),
};

/**
 * Interactive demo
 */
export const InteractiveDemo: Story = {
  args: {
    category: 'agents',
    slug: 'interactive-example',
    label: 'Download Markdown',
    size: 'default',
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click to download markdown file. The server action is mocked in Storybook. In production, this generates a .md file with full metadata and attribution.',
      },
    },
  },
};
