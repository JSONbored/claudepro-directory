'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { PageViewTracker } from './page-view-tracker';

const meta = {
  title: 'Shared/PageViewTracker',
  component: PageViewTracker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Client component for tracking content detail page views. Tracks when users view content pages with content-type-specific events (content_view_agent, content_view_mcp, etc.) for better analytics segmentation in Umami.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    category: {
      control: 'text',
      description: 'Content category (agents, mcp, commands, etc.)',
    },
    slug: {
      control: 'text',
      description: 'Content slug identifier',
    },
    sourcePage: {
      control: 'text',
      description: 'Optional source page for referral tracking',
    },
  },
} satisfies Meta<typeof PageViewTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default agent page view tracker
 */
export const AgentView: Story = {
  args: {
    category: 'agents',
    slug: 'code-review-assistant',
  },
  render: (args) => (
    <div className="p-8 border rounded-lg bg-card max-w-md">
      <h2 className="text-2xl font-bold mb-4">Code Review Assistant</h2>
      <p className="text-muted-foreground mb-4">
        This page includes a PageViewTracker component that fires a tracking event on mount.
      </p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Event: content_view_agent
          <br />
          Slug: {args.slug}
        </p>
      </div>
      <PageViewTracker {...args} />
    </div>
  ),
};

/**
 * MCP server page view tracker
 */
export const McpView: Story = {
  args: {
    category: 'mcp',
    slug: 'github-mcp-server',
  },
  render: (args) => (
    <div className="p-8 border rounded-lg bg-card max-w-md">
      <h2 className="text-2xl font-bold mb-4">GitHub MCP Server</h2>
      <p className="text-muted-foreground mb-4">
        Tracking MCP server view with specific event type.
      </p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Event: content_view_mcp
          <br />
          Slug: {args.slug}
        </p>
      </div>
      <PageViewTracker {...args} />
    </div>
  ),
};

/**
 * Command page view tracker
 */
export const CommandView: Story = {
  args: {
    category: 'commands',
    slug: 'generate-tests',
  },
  render: (args) => (
    <div className="p-8 border rounded-lg bg-card max-w-md">
      <h2 className="text-2xl font-bold mb-4">Generate Tests Command</h2>
      <p className="text-muted-foreground mb-4">Tracking command view.</p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Event: content_view_command
          <br />
          Slug: {args.slug}
        </p>
      </div>
      <PageViewTracker {...args} />
    </div>
  ),
};

/**
 * With source page tracking
 */
export const WithSourcePage: Story = {
  args: {
    category: 'agents',
    slug: 'api-builder',
    sourcePage: '/trending',
  },
  render: (args) => (
    <div className="p-8 border rounded-lg bg-card max-w-md">
      <h2 className="text-2xl font-bold mb-4">API Builder Agent</h2>
      <p className="text-muted-foreground mb-4">
        This view includes source page tracking to understand user navigation patterns.
      </p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Event: content_view_agent
          <br />
          Slug: {args.slug}
          <br />
          Source: {args.sourcePage}
        </p>
      </div>
      <PageViewTracker {...args} />
    </div>
  ),
};

/**
 * Guide page view tracker
 */
export const GuideView: Story = {
  args: {
    category: 'guides',
    slug: 'getting-started',
    sourcePage: '/guides',
  },
  render: (args) => (
    <div className="p-8 border rounded-lg bg-card max-w-md">
      <h2 className="text-2xl font-bold mb-4">Getting Started Guide</h2>
      <p className="text-muted-foreground mb-4">Tracking guide view with referral.</p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Event: content_view_guide
          <br />
          Slug: {args.slug}
          <br />
          Source: {args.sourcePage}
        </p>
      </div>
      <PageViewTracker {...args} />
    </div>
  ),
};

/**
 * Multiple trackers on one page
 */
export const MultipleTrackers: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl p-8">
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-xl font-semibold mb-2">Section 1</h3>
        <p className="text-muted-foreground">
          Each section has its own tracker for granular analytics.
        </p>
        <PageViewTracker category="agents" slug="section-1" />
      </div>

      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-xl font-semibold mb-2">Section 2</h3>
        <p className="text-muted-foreground">Multiple trackers can coexist on the same page.</p>
        <PageViewTracker category="mcp" slug="section-2" />
      </div>

      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-xl font-semibold mb-2">Section 3</h3>
        <p className="text-muted-foreground">Each fires its own tracking event.</p>
        <PageViewTracker category="commands" slug="section-3" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates multiple PageViewTracker components on the same page, each tracking different content.',
      },
    },
  },
};

/**
 * All content types
 */
export const AllContentTypes: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">Content View Tracking by Type</h2>

      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-1">Agent</h3>
        <p className="text-sm text-muted-foreground">Event: content_view_agent</p>
        <PageViewTracker category="agents" slug="example-agent" />
      </div>

      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-1">MCP Server</h3>
        <p className="text-sm text-muted-foreground">Event: content_view_mcp</p>
        <PageViewTracker category="mcp" slug="example-mcp" />
      </div>

      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-1">Command</h3>
        <p className="text-sm text-muted-foreground">Event: content_view_command</p>
        <PageViewTracker category="commands" slug="example-command" />
      </div>

      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-1">Rule</h3>
        <p className="text-sm text-muted-foreground">Event: content_view_rule</p>
        <PageViewTracker category="rules" slug="example-rule" />
      </div>

      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-1">Hook</h3>
        <p className="text-sm text-muted-foreground">Event: content_view_hook</p>
        <PageViewTracker category="hooks" slug="example-hook" />
      </div>

      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-1">Guide</h3>
        <p className="text-sm text-muted-foreground">Event: content_view_guide</p>
        <PageViewTracker category="guides" slug="example-guide" />
      </div>
    </div>
  ),
};

/**
 * In content detail page context
 */
export const InContentPage: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto p-8">
      <article className="space-y-6">
        <header>
          <h1 className="text-4xl font-bold mb-2">Code Review Assistant</h1>
          <p className="text-xl text-muted-foreground">
            An AI agent that helps review code and suggest improvements.
          </p>
        </header>

        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-2">Analytics Tracking Active</p>
          <p className="text-xs text-muted-foreground">
            This page view is being tracked with category-specific analytics.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <h2>Description</h2>
          <p>
            This agent analyzes your code and provides detailed feedback on potential issues, best
            practices, and optimization opportunities.
          </p>

          <h2>Features</h2>
          <ul>
            <li>Automatic code quality checks</li>
            <li>Style guide enforcement</li>
            <li>Security vulnerability detection</li>
            <li>Performance optimization suggestions</li>
          </ul>
        </div>
      </article>

      <PageViewTracker category="agents" slug="code-review-assistant" sourcePage="/trending" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows PageViewTracker in a realistic content detail page context. The tracker is invisible but fires analytics events.',
      },
    },
  },
};

/**
 * Note about rendering
 */
export const RenderingNote: Story = {
  render: () => (
    <div className="p-8 border rounded-lg bg-card max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">About PageViewTracker</h2>
      <div className="space-y-4 text-muted-foreground">
        <p>This component does not render any visible UI elements.</p>
        <p>
          It uses React useEffect to fire analytics events when mounted. The event is fired once per
          component lifecycle.
        </p>
        <p>In production, events are sent to Umami analytics with the following data:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Event name (content_view_[type])</li>
          <li>Content slug</li>
          <li>Page path</li>
          <li>Source page (if provided)</li>
        </ul>
        <p className="text-sm italic">
          Note: In Storybook, analytics events are mocked and logged to the console.
        </p>
      </div>
      <PageViewTracker category="agents" slug="example" />
    </div>
  ),
};
