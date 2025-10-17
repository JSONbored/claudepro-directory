'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { ViewTracker } from './view-tracker';

const meta = {
  title: 'Shared/ViewTracker',
  component: ViewTracker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Client component for tracking content views in the database. Calls server action trackView after a 1-second delay to ensure page load. Silently handles errors client-side. This component renders nothing but increments view counts for analytics.',
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
  },
} satisfies Meta<typeof ViewTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default agent view tracker
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
        This page includes a ViewTracker component that increments the view count in the database
        after a 1-second delay.
      </p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Category: {args.category}
          <br />
          Slug: {args.slug}
          <br />
          Delay: 1000ms
        </p>
      </div>
      <ViewTracker {...args} />
    </div>
  ),
};

/**
 * MCP server view tracker
 */
export const McpView: Story = {
  args: {
    category: 'mcp',
    slug: 'github-mcp-server',
  },
  render: (args) => (
    <div className="p-8 border rounded-lg bg-card max-w-md">
      <h2 className="text-2xl font-bold mb-4">GitHub MCP Server</h2>
      <p className="text-muted-foreground mb-4">Tracking MCP server view.</p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Category: {args.category}
          <br />
          Slug: {args.slug}
        </p>
      </div>
      <ViewTracker {...args} />
    </div>
  ),
};

/**
 * Command view tracker
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
          Category: {args.category}
          <br />
          Slug: {args.slug}
        </p>
      </div>
      <ViewTracker {...args} />
    </div>
  ),
};

/**
 * Guide view tracker
 */
export const GuideView: Story = {
  args: {
    category: 'guides',
    slug: 'getting-started',
  },
  render: (args) => (
    <div className="p-8 border rounded-lg bg-card max-w-md">
      <h2 className="text-2xl font-bold mb-4">Getting Started Guide</h2>
      <p className="text-muted-foreground mb-4">Tracking guide view.</p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Category: {args.category}
          <br />
          Slug: {args.slug}
        </p>
      </div>
      <ViewTracker {...args} />
    </div>
  ),
};

/**
 * Rule view tracker
 */
export const RuleView: Story = {
  args: {
    category: 'rules',
    slug: 'best-practices',
  },
  render: (args) => (
    <div className="p-8 border rounded-lg bg-card max-w-md">
      <h2 className="text-2xl font-bold mb-4">Best Practices Rule</h2>
      <p className="text-muted-foreground mb-4">Tracking rule view.</p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Category: {args.category}
          <br />
          Slug: {args.slug}
        </p>
      </div>
      <ViewTracker {...args} />
    </div>
  ),
};

/**
 * Hook view tracker
 */
export const HookView: Story = {
  args: {
    category: 'hooks',
    slug: 'pre-commit-validator',
  },
  render: (args) => (
    <div className="p-8 border rounded-lg bg-card max-w-md">
      <h2 className="text-2xl font-bold mb-4">Pre-commit Validator Hook</h2>
      <p className="text-muted-foreground mb-4">Tracking hook view.</p>
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm font-mono">
          Category: {args.category}
          <br />
          Slug: {args.slug}
        </p>
      </div>
      <ViewTracker {...args} />
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
        <h3 className="text-xl font-semibold mb-2">Section 1: Agent</h3>
        <p className="text-muted-foreground">
          Each section can have its own tracker for granular view counts.
        </p>
        <ViewTracker category="agents" slug="section-1" />
      </div>

      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-xl font-semibold mb-2">Section 2: MCP Server</h3>
        <p className="text-muted-foreground">Multiple trackers can coexist on the same page.</p>
        <ViewTracker category="mcp" slug="section-2" />
      </div>

      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-xl font-semibold mb-2">Section 3: Command</h3>
        <p className="text-muted-foreground">Each increments its own view count.</p>
        <ViewTracker category="commands" slug="section-3" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates multiple ViewTracker components on the same page, each tracking different content.',
      },
    },
  },
};

/**
 * How it works
 */
export const HowItWorks: Story = {
  render: () => (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="border rounded-lg bg-card p-6">
        <h2 className="text-2xl font-bold mb-4">How ViewTracker Works</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Component Mounts</h3>
            <p className="text-sm text-muted-foreground">
              When the ViewTracker component mounts on the page, it starts a 1-second timer.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">2. Delay Period</h3>
            <p className="text-sm text-muted-foreground">
              The 1-second delay ensures the page has fully loaded before tracking. This prevents
              counting bounces or incomplete page loads.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">3. Server Action Call</h3>
            <p className="text-sm text-muted-foreground mb-2">
              After the delay, calls the trackView server action:
            </p>
            <div className="p-3 bg-muted rounded font-mono text-xs">
              trackView(&#123; category, slug &#125;)
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">4. Database Update</h3>
            <p className="text-sm text-muted-foreground">
              The server action increments the view count for the content in the database. Errors
              are handled silently to prevent disrupting the user experience.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">5. Cleanup</h3>
            <p className="text-sm text-muted-foreground">
              If the component unmounts before the delay completes, the timer is cleared to prevent
              the server action from running.
            </p>
          </div>
        </div>
      </div>

      <ViewTracker category="agents" slug="example" />
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
          <p className="text-sm font-medium mb-2">View Tracking Active</p>
          <p className="text-xs text-muted-foreground">
            This page view is being counted in the database for analytics purposes.
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

          <h2>Usage</h2>
          <p>To use this agent, simply provide your code and it will analyze it for you.</p>
        </div>
      </article>

      <ViewTracker category="agents" slug="code-review-assistant" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows ViewTracker in a realistic content detail page context. The tracker is invisible but increments the view count.',
      },
    },
  },
};

/**
 * Error handling behavior
 */
export const ErrorHandling: Story = {
  render: () => (
    <div className="p-8 border rounded-lg bg-card max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Error Handling</h2>
      <div className="space-y-4 text-muted-foreground">
        <p>ViewTracker handles errors gracefully:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Errors are caught and silently ignored to prevent disrupting the user experience</li>
          <li>No error messages are shown to users (errors are logged server-side only)</li>
          <li>The page continues to function normally even if view tracking fails</li>
          <li>This ensures view tracking never impacts user experience</li>
        </ul>
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> View tracking failures are logged server-side for monitoring but
            do not affect the client application.
          </p>
        </div>
      </div>
      <ViewTracker category="agents" slug="example" />
    </div>
  ),
};

/**
 * Note about rendering
 */
export const RenderingNote: Story = {
  render: () => (
    <div className="p-8 border rounded-lg bg-card max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">About This Component</h2>
      <div className="space-y-4 text-muted-foreground">
        <p>The ViewTracker component does not render any visible UI elements. It returns null.</p>
        <p>It uses React useEffect to track views:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Runs once when the component mounts</li>
          <li>Waits 1 second to ensure page load is complete</li>
          <li>Calls trackView server action with category and slug</li>
          <li>Cleans up the timer if the component unmounts early</li>
        </ul>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>Important:</strong> Include this component once per page/content item. Multiple
            instances with the same category/slug will increment the count multiple times.
          </p>
        </div>
      </div>
      <ViewTracker category="agents" slug="example" />
    </div>
  ),
};

/**
 * Best practices
 */
export const BestPractices: Story = {
  render: () => (
    <div className="p-8 max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold mb-4">Best Practices</h2>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
            ✓ DO: Include Once Per Content Page
          </h3>
          <div className="p-3 bg-muted rounded font-mono text-xs">
            {`// app/agents/[slug]/page.tsx
export default function AgentPage({ params }) {
  return (
    <div>
      <ViewTracker category="agents" slug={params.slug} />
      {/* Page content */}
    </div>
  );
}`}
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
            ✓ DO: Use Dynamic Values from Route Params
          </h3>
          <p className="text-sm text-muted-foreground">
            Pass the actual category and slug from your route parameters to track the correct
            content.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
            ✗ DON'T: Include Multiple Times for Same Content
          </h3>
          <p className="text-sm text-muted-foreground">
            Avoid using multiple ViewTracker components with the same category/slug on one page, as
            this will inflate view counts.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
            ✗ DON'T: Use on List/Browse Pages
          </h3>
          <p className="text-sm text-muted-foreground">
            Only use ViewTracker on detail pages where users are viewing a single piece of content.
            Don't use it on listing or browse pages.
          </p>
        </div>
      </div>

      <ViewTracker category="agents" slug="example" />
    </div>
  ),
};
