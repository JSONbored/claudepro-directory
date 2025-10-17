'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { InlineEmailCTA } from './inline-email-cta';

const meta = {
  title: 'Growth/InlineEmailCTA',
  component: InlineEmailCTA,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Reusable email capture CTA with multiple variants for different contexts. Integrates with NewsletterForm component with contextual messaging based on content category.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['hero', 'inline', 'minimal', 'card'],
      description: 'Visual variant for different contexts',
    },
    context: {
      control: 'text',
      description: 'Context for analytics tracking',
    },
    category: {
      control: 'select',
      options: ['agents', 'mcp', 'commands', 'rules', 'hooks', 'guides', 'default'],
      description: 'Optional content category for contextual messaging',
    },
    headline: {
      control: 'text',
      description: 'Custom headline (overrides default)',
    },
    description: {
      control: 'text',
      description: 'Custom description (overrides default)',
    },
  },
} satisfies Meta<typeof InlineEmailCTA>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Hero variant - Large, prominent for landing pages
 */
export const Hero: Story = {
  args: {
    variant: 'hero',
    context: 'homepage',
  },
};

/**
 * Hero variant with agents category
 */
export const HeroAgents: Story = {
  args: {
    variant: 'hero',
    context: 'agents-page',
    category: 'agents',
  },
};

/**
 * Hero variant with MCP category
 */
export const HeroMcp: Story = {
  args: {
    variant: 'hero',
    context: 'mcp-page',
    category: 'mcp',
  },
};

/**
 * Inline variant - Mid-content card
 */
export const Inline: Story = {
  args: {
    variant: 'inline',
    context: 'content-detail',
  },
};

/**
 * Inline variant with commands category
 */
export const InlineCommands: Story = {
  args: {
    variant: 'inline',
    context: 'content-detail',
    category: 'commands',
  },
};

/**
 * Inline variant with guides category
 */
export const InlineGuides: Story = {
  args: {
    variant: 'inline',
    context: 'content-detail',
    category: 'guides',
  },
};

/**
 * Minimal variant - Compact single-line
 */
export const Minimal: Story = {
  args: {
    variant: 'minimal',
    context: 'category-page',
  },
};

/**
 * Minimal variant with rules category
 */
export const MinimalRules: Story = {
  args: {
    variant: 'minimal',
    context: 'category-page',
    category: 'rules',
  },
};

/**
 * Card variant - Grid item size
 */
export const Card: Story = {
  args: {
    variant: 'card',
    context: 'browse-page',
  },
};

/**
 * Card variant with hooks category
 */
export const CardHooks: Story = {
  args: {
    variant: 'card',
    context: 'browse-page',
    category: 'hooks',
  },
};

/**
 * Custom headline and description
 */
export const CustomContent: Story = {
  args: {
    variant: 'inline',
    context: 'custom',
    headline: 'Join Our Growing Community',
    description: 'Get exclusive access to premium content and early feature releases.',
  },
};

/**
 * Hero with custom content
 */
export const HeroCustom: Story = {
  args: {
    variant: 'hero',
    context: 'custom',
    headline: 'Never Miss an Update',
    description:
      'Subscribe to our newsletter for the latest Claude tools, guides, and community highlights delivered directly to your inbox.',
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-12 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">Hero Variant</h2>
        <InlineEmailCTA variant="hero" context="showcase" category="agents" />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Inline Variant</h2>
        <InlineEmailCTA variant="inline" context="showcase" category="mcp" />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Minimal Variant</h2>
        <InlineEmailCTA variant="minimal" context="showcase" category="commands" />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Card Variant</h2>
        <div className="max-w-sm">
          <InlineEmailCTA variant="card" context="showcase" category="guides" />
        </div>
      </div>
    </div>
  ),
};

/**
 * All categories showcase
 */
export const AllCategories: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold mb-3">Agents</h2>
        <InlineEmailCTA variant="inline" context="showcase" category="agents" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">MCP Servers</h2>
        <InlineEmailCTA variant="inline" context="showcase" category="mcp" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Commands</h2>
        <InlineEmailCTA variant="inline" context="showcase" category="commands" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Rules</h2>
        <InlineEmailCTA variant="inline" context="showcase" category="rules" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Hooks</h2>
        <InlineEmailCTA variant="inline" context="showcase" category="hooks" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Guides</h2>
        <InlineEmailCTA variant="inline" context="showcase" category="guides" />
      </div>
    </div>
  ),
};

/**
 * In content context
 */
export const InContentContext: Story = {
  render: () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <article className="prose dark:prose-invert">
        <h1>Getting Started with Claude Agents</h1>
        <p>
          Claude agents are powerful tools that help automate tasks and enhance your productivity.
          This guide will walk you through everything you need to know.
        </p>
        <h2>What are Claude Agents?</h2>
        <p>
          Agents are specialized configurations that give Claude specific capabilities and
          behaviors. They can help with code review, writing, research, and much more.
        </p>
      </article>

      <InlineEmailCTA variant="inline" context="guide-content" category="agents" />

      <article className="prose dark:prose-invert">
        <h2>Creating Your First Agent</h2>
        <p>To create an agent, you'll need to define its purpose, capabilities, and constraints.</p>
      </article>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how the CTA looks when placed within article content.',
      },
    },
  },
};

/**
 * Grid layout with cards
 */
export const GridLayout: Story = {
  render: () => (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Browse Collections</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mock cards */}
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="font-semibold text-lg mb-2">Collection 1</h3>
          <p className="text-sm text-muted-foreground">Sample content card</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="font-semibold text-lg mb-2">Collection 2</h3>
          <p className="text-sm text-muted-foreground">Sample content card</p>
        </div>
        <InlineEmailCTA variant="card" context="grid" category="agents" />
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="font-semibold text-lg mb-2">Collection 3</h3>
          <p className="text-sm text-muted-foreground">Sample content card</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="font-semibold text-lg mb-2">Collection 4</h3>
          <p className="text-sm text-muted-foreground">Sample content card</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the card variant integrated into a grid layout with other content cards.',
      },
    },
  },
};
