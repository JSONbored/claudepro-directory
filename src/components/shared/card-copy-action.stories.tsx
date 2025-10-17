import type { Meta, StoryObj } from '@storybook/react';
import { CardCopyAction } from './card-copy-action';

const meta = {
  title: 'Shared/CardCopyAction',
  component: CardCopyAction,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Reusable copy-to-clipboard button for card components. Provides consistent behavior with toast notifications and analytics tracking.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    url: {
      control: 'text',
      description: 'Full URL to copy to clipboard',
    },
    category: {
      control: 'select',
      options: ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections'],
      description: 'Content category for analytics tracking',
    },
    slug: {
      control: 'text',
      description: 'Content slug for analytics tracking',
    },
    title: {
      control: 'text',
      description: 'Display title for aria-label',
    },
    componentName: {
      control: 'text',
      description: 'Component name for analytics context',
    },
  },
} satisfies Meta<typeof CardCopyAction>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default copy action button
 */
export const Default: Story = {
  args: {
    url: 'https://claudepro.directory/agents/code-review-assistant',
    category: 'agents',
    slug: 'code-review-assistant',
    title: 'Code Review Assistant',
    componentName: 'ConfigCard',
  },
};

/**
 * MCP server card
 */
export const McpServer: Story = {
  args: {
    url: 'https://claudepro.directory/mcp/github-mcp-server',
    category: 'mcp',
    slug: 'github-mcp-server',
    title: 'GitHub MCP Server',
    componentName: 'ConfigCard',
  },
};

/**
 * Command card
 */
export const Command: Story = {
  args: {
    url: 'https://claudepro.directory/commands/generate-tests',
    category: 'commands',
    slug: 'generate-tests',
    title: 'Generate Tests Command',
    componentName: 'ConfigCard',
  },
};

/**
 * Hook card
 */
export const Hook: Story = {
  args: {
    url: 'https://claudepro.directory/hooks/pre-commit-validator',
    category: 'hooks',
    slug: 'pre-commit-validator',
    title: 'Pre-commit Validator Hook',
    componentName: 'ConfigCard',
  },
};

/**
 * Collection card
 */
export const Collection: Story = {
  args: {
    url: 'https://claudepro.directory/collections/best-practices',
    category: 'collections',
    slug: 'best-practices',
    title: 'Best Practices Collection',
    componentName: 'CollectionCard',
  },
};

/**
 * Interactive demo
 */
export const InteractiveDemo: Story = {
  args: {
    url: 'https://claudepro.directory/agents/example',
    category: 'agents',
    slug: 'example',
    title: 'Example Agent',
    componentName: 'ConfigCard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Click to copy the URL. Toast notifications are shown on copy success/failure.',
      },
    },
  },
};
