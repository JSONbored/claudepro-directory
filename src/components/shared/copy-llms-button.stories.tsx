import type { Meta, StoryObj } from '@storybook/react';
import { CopyLLMsButton, CopyLLMsButtonIcon } from './copy-llms-button';

const meta = {
  title: 'Shared/CopyLLMsButton',
  component: CopyLLMsButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'One-click button for copying llms.txt content for AI assistant usage. Fetches content client-side and uses BaseActionButton for consistent UX.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    llmsTxtUrl: {
      control: 'text',
      description: 'URL to the llms.txt endpoint',
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
      description: 'Whether to show Sparkles icon',
    },
  },
} satisfies Meta<typeof CopyLLMsButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default copy LLMs button
 */
export const Default: Story = {
  args: {
    llmsTxtUrl: '/mcp/github-mcp-server/llms.txt',
    label: 'Copy for AI',
    size: 'sm',
    variant: 'outline',
    showIcon: true,
  },
};

/**
 * Large primary button
 */
export const LargePrimary: Story = {
  args: {
    llmsTxtUrl: '/mcp/github-mcp-server/llms.txt',
    label: 'Copy AI Context',
    size: 'lg',
    variant: 'default',
    showIcon: true,
  },
};

/**
 * Small outline button
 */
export const SmallOutline: Story = {
  args: {
    llmsTxtUrl: '/agents/code-review/llms.txt',
    label: 'Copy for AI',
    size: 'sm',
    variant: 'outline',
    showIcon: true,
  },
};

/**
 * Secondary variant
 */
export const Secondary: Story = {
  args: {
    llmsTxtUrl: '/commands/generate-tests/llms.txt',
    label: 'Copy for AI',
    size: 'default',
    variant: 'secondary',
    showIcon: true,
  },
};

/**
 * Ghost variant
 */
export const Ghost: Story = {
  args: {
    llmsTxtUrl: '/hooks/pre-commit/llms.txt',
    label: 'Copy Context',
    size: 'sm',
    variant: 'ghost',
    showIcon: true,
  },
};

/**
 * Without icon
 */
export const NoIcon: Story = {
  args: {
    llmsTxtUrl: '/mcp/github-mcp-server/llms.txt',
    label: 'Copy for AI',
    size: 'sm',
    variant: 'outline',
    showIcon: false,
  },
};

/**
 * Icon-only variant
 */
export const IconOnly: StoryObj<typeof CopyLLMsButtonIcon> = {
  render: (args) => <CopyLLMsButtonIcon {...args} />,
  args: {
    llmsTxtUrl: '/mcp/github-mcp-server/llms.txt',
    variant: 'ghost',
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CopyLLMsButton llmsTxtUrl="/mcp/example/llms.txt" label="Default" variant="default" />
        <CopyLLMsButton llmsTxtUrl="/mcp/example/llms.txt" label="Secondary" variant="secondary" />
        <CopyLLMsButton llmsTxtUrl="/mcp/example/llms.txt" label="Outline" variant="outline" />
        <CopyLLMsButton llmsTxtUrl="/mcp/example/llms.txt" label="Ghost" variant="ghost" />
        <CopyLLMsButtonIcon llmsTxtUrl="/mcp/example/llms.txt" variant="ghost" />
      </div>
    </div>
  ),
};
