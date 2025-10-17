import type { Meta, StoryObj } from '@storybook/react';
import { CopyMarkdownButton, CopyMarkdownButtonIcon } from './copy-markdown-button';

const meta = {
  title: 'Shared/CopyMarkdownButton',
  component: CopyMarkdownButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Button for copying markdown-formatted content using server actions. Integrates with email capture and analytics tracking.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    category: {
      control: 'text',
      description: 'Content category',
    },
    slug: {
      control: 'text',
      description: 'Content slug',
    },
    label: {
      control: 'text',
      description: 'Button label',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Button size',
    },
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Button variant',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show FileText icon',
    },
    includeMetadata: {
      control: 'boolean',
      description: 'Include metadata in markdown',
    },
    includeFooter: {
      control: 'boolean',
      description: 'Include footer in markdown',
    },
  },
} satisfies Meta<typeof CopyMarkdownButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default copy markdown button
 */
export const Default: Story = {
  args: {
    category: 'agents',
    slug: 'code-review-assistant',
    label: 'Copy as Markdown',
    size: 'sm',
    variant: 'outline',
    showIcon: true,
    includeMetadata: true,
    includeFooter: false,
  },
};

/**
 * With metadata and footer
 */
export const WithMetadataAndFooter: Story = {
  args: {
    category: 'mcp',
    slug: 'github-mcp-server',
    label: 'Copy Full Markdown',
    size: 'sm',
    variant: 'outline',
    showIcon: true,
    includeMetadata: true,
    includeFooter: true,
  },
};

/**
 * Without metadata
 */
export const WithoutMetadata: Story = {
  args: {
    category: 'commands',
    slug: 'generate-tests',
    label: 'Copy Content Only',
    size: 'sm',
    variant: 'outline',
    showIcon: true,
    includeMetadata: false,
    includeFooter: false,
  },
};

/**
 * Large primary button
 */
export const LargePrimary: Story = {
  args: {
    category: 'guides',
    slug: 'getting-started',
    label: 'Copy Markdown',
    size: 'lg',
    variant: 'default',
    showIcon: true,
    includeMetadata: true,
    includeFooter: false,
  },
};

/**
 * Secondary variant
 */
export const Secondary: Story = {
  args: {
    category: 'hooks',
    slug: 'pre-commit-validator',
    label: 'Copy as Markdown',
    size: 'default',
    variant: 'secondary',
    showIcon: true,
    includeMetadata: true,
    includeFooter: false,
  },
};

/**
 * Ghost variant
 */
export const Ghost: Story = {
  args: {
    category: 'collections',
    slug: 'best-practices',
    label: 'Copy Markdown',
    size: 'sm',
    variant: 'ghost',
    showIcon: true,
    includeMetadata: true,
    includeFooter: false,
  },
};

/**
 * Without icon
 */
export const NoIcon: Story = {
  args: {
    category: 'agents',
    slug: 'example',
    label: 'Copy as Markdown',
    size: 'sm',
    variant: 'outline',
    showIcon: false,
    includeMetadata: true,
    includeFooter: false,
  },
};

/**
 * Icon-only variant
 */
export const IconOnly: StoryObj<typeof CopyMarkdownButtonIcon> = {
  render: (args) => <CopyMarkdownButtonIcon {...args} />,
  args: {
    category: 'agents',
    slug: 'code-review',
    variant: 'ghost',
    includeMetadata: true,
    includeFooter: false,
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CopyMarkdownButton category="agents" slug="example" label="Default" variant="default" />
        <CopyMarkdownButton
          category="agents"
          slug="example"
          label="Secondary"
          variant="secondary"
        />
        <CopyMarkdownButton category="agents" slug="example" label="Outline" variant="outline" />
        <CopyMarkdownButton category="agents" slug="example" label="Ghost" variant="ghost" />
        <CopyMarkdownButtonIcon category="agents" slug="example" variant="ghost" />
      </div>
    </div>
  ),
};
