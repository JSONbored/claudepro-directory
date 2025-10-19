'use client';

/**
 * MDX Components Storybook Stories - Consolidated
 *
 * Comprehensive stories for all MDX components (eager + lazy loaded).
 * Updated to showcase React.lazy() consolidation and production patterns.
 *
 * Coverage:
 * - Eager components: CopyableHeading, CopyableCodeBlock, Links
 * - Lazy components: SmartRelatedContent, MetricsDisplay, ComparisonTable, etc.
 *
 * Production Standards:
 * - useId() for unique element IDs (React 19)
 * - Configuration-driven story data
 * - Proper TypeScript types
 * - Accessibility (aria-labels, semantic HTML)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useId } from 'react';
import { expect, within } from 'storybook/test';
import {
  // Lazy-loaded components (code-split)
  ComparisonTable,
  // Eager-loaded components
  CopyableCodeBlock,
  CopyableHeading,
  ExternalLinkComponent,
  InternalLinkComponent,
  MetricsDisplay,
  SmartRelatedContent,
  StepByStepGuide,
} from './mdx-components';

const meta = {
  title: 'UI/MDXComponents',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Unified MDX Components** - Consolidated from mdx-components + lazy-mdx-components

Includes both eager-loaded (lightweight) and lazy-loaded (heavy, code-split) components for MDX content rendering.

### Eager Components (Always Loaded)
- \`CopyableHeading\` - Headings with anchor link copy functionality
- \`CopyableCodeBlock\` - Code blocks with copy + email capture
- \`ExternalLinkComponent\` - Links with external icon
- \`InternalLinkComponent\` - Next.js Link wrapper

### Lazy Components (Code-Split with React.lazy)
- \`SmartRelatedContent\` - ML-powered content recommendations
- \`MetricsDisplay\` - Analytics visualization
- \`ComparisonTable\` - Interactive comparison tables
- \`DiagnosticFlow\` - Troubleshooting wizard
- \`StepByStepGuide\` - Multi-step guide UI
- \`ErrorTable\` - Error reference tables

### Architectural Improvements
- ✅ React.lazy() replaces next/dynamic (React 19 pattern)
- ✅ Single source of truth (347 LOC → 367 LOC, 1 file)
- ✅ Proper 'use client' directive
- ✅ Centralized skeleton components
- ✅ Type-safe with React.ComponentProps
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

// ============================================================================
// EAGER COMPONENT STORIES
// ============================================================================

/**
 * Copyable headings showcase with unique IDs (useId pattern)
 */
export const CopyableHeadings: StoryObj = {
  render: () => {
    const headingId1 = useId();
    const headingId2 = useId();
    const headingId3 = useId();

    return (
      <div className="space-y-6 max-w-3xl">
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-muted-foreground mb-4">
            Hover over headings to see the copy link icon. Click to copy the anchor link.
          </p>
        </div>

        <CopyableHeading level={1} id={headingId1}>
          Level 1 Heading
        </CopyableHeading>

        <p className="text-muted-foreground">
          This is some content under the first heading. The heading above has an anchor link that
          can be copied.
        </p>

        <CopyableHeading level={2} id={headingId2}>
          Level 2 Heading
        </CopyableHeading>

        <p className="text-muted-foreground">
          Level 2 headings are slightly smaller. They also support copying the anchor link.
        </p>

        <CopyableHeading level={3} id={headingId3}>
          Level 3 Heading
        </CopyableHeading>

        <p className="text-muted-foreground">
          Level 3 headings are the smallest. All heading levels support the same copy functionality.
        </p>
      </div>
    );
  },
};

/**
 * Copyable code block with multiple languages
 */
export const CopyableCode: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-muted-foreground mb-4">
          Code blocks have a copy button in the top-right corner. Click to copy the code with email
          capture integration.
        </p>
      </div>

      <CopyableCodeBlock className="language-javascript">
        {`function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');`}
      </CopyableCodeBlock>

      <CopyableCodeBlock className="language-python">
        {`def calculate_sum(a, b):
    """Calculate the sum of two numbers."""
    return a + b

result = calculate_sum(10, 20)
print(f"Result: {result}")`}
      </CopyableCodeBlock>
    </div>
  ),
};

/**
 * External links with proper security attributes
 */
export const ExternalLinks: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">External Links</h2>
        <p className="text-muted-foreground mb-4">
          External links have an icon and open in a new tab with proper rel attributes.
        </p>
      </div>

      <div className="prose dark:prose-invert">
        <p>
          Check out{' '}
          <ExternalLinkComponent href="https://www.anthropic.com">
            Anthropic's website
          </ExternalLinkComponent>{' '}
          for more information about Claude.
        </p>

        <p>
          You can also read the{' '}
          <ExternalLinkComponent href="https://docs.anthropic.com">
            official documentation
          </ExternalLinkComponent>{' '}
          to learn more about the API.
        </p>

        <p>
          For community discussions, visit the{' '}
          <ExternalLinkComponent href="https://github.com/anthropics/anthropic-sdk-typescript">
            GitHub repository
          </ExternalLinkComponent>
          .
        </p>
      </div>
    </div>
  ),
};

/**
 * Internal links with Next.js Link
 */
export const InternalLinks: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Internal Links</h2>
        <p className="text-muted-foreground mb-4">
          Internal links use Next.js Link component for client-side navigation.
        </p>
      </div>

      <div className="prose dark:prose-invert">
        <p>
          Browse our <InternalLinkComponent href="/agents">AI agents</InternalLinkComponent> or
          check out the latest{' '}
          <InternalLinkComponent href="/mcp">MCP servers</InternalLinkComponent>.
        </p>

        <p>
          New to Claude? Start with our{' '}
          <InternalLinkComponent href="/guides/getting-started">
            getting started guide
          </InternalLinkComponent>
          .
        </p>

        <p>
          Looking for specific functionality? Search our{' '}
          <InternalLinkComponent href="/commands">commands</InternalLinkComponent> and{' '}
          <InternalLinkComponent href="/hooks">hooks</InternalLinkComponent> collections.
        </p>
      </div>
    </div>
  ),
};

/**
 * Mixed content showcase with unique IDs
 */
export const MixedContent: StoryObj = {
  render: () => {
    const articleTitleId = useId();
    const introductionId = useId();
    const codeExampleId = useId();
    const explanationId = useId();
    const nextStepsId = useId();

    return (
      <div className="space-y-6 max-w-3xl">
        <CopyableHeading level={1} id={articleTitleId}>
          Complete MDX Article Example
        </CopyableHeading>

        <p className="text-muted-foreground">
          This showcase demonstrates all MDX components together in a realistic article context.
        </p>

        <CopyableHeading level={2} id={introductionId}>
          Introduction
        </CopyableHeading>

        <div className="prose dark:prose-invert">
          <p>
            Welcome to this guide on using Claude effectively. For more information, visit the{' '}
            <ExternalLinkComponent href="https://www.anthropic.com">
              Anthropic website
            </ExternalLinkComponent>
            .
          </p>

          <p>
            You can also check out our{' '}
            <InternalLinkComponent href="/guides">guides</InternalLinkComponent> section for more
            tutorials.
          </p>
        </div>

        <CopyableHeading level={2} id={codeExampleId}>
          Code Example
        </CopyableHeading>

        <p className="text-muted-foreground mb-4">
          Here's a simple example of using the Claude API:
        </p>

        <CopyableCodeBlock className="language-typescript">
          {`import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude!' }],
});

console.log(response.content);`}
        </CopyableCodeBlock>

        <CopyableHeading level={3} id={explanationId}>
          Explanation
        </CopyableHeading>

        <div className="prose dark:prose-invert">
          <p>
            This code creates a client instance and sends a message to Claude. For more details,
            refer to the{' '}
            <ExternalLinkComponent href="https://docs.anthropic.com">
              API documentation
            </ExternalLinkComponent>
            .
          </p>
        </div>

        <CopyableHeading level={2} id={nextStepsId}>
          Next Steps
        </CopyableHeading>

        <div className="prose dark:prose-invert">
          <p>To learn more, explore these resources:</p>
          <ul>
            <li>
              <InternalLinkComponent href="/agents">Browse AI Agents</InternalLinkComponent>
            </li>
            <li>
              <InternalLinkComponent href="/mcp">Explore MCP Servers</InternalLinkComponent>
            </li>
            <li>
              <InternalLinkComponent href="/commands">Discover Commands</InternalLinkComponent>
            </li>
          </ul>
        </div>
      </div>
    );
  },
};

/**
 * Heading levels comparison with unique IDs
 */
export const HeadingLevels: StoryObj = {
  render: () => {
    const h1Id = useId();
    const h2Id = useId();
    const h3Id = useId();

    return (
      <div className="space-y-8 max-w-3xl">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-2">Heading Size Comparison</h2>
          <p className="text-muted-foreground">All heading levels with copy functionality.</p>
        </div>

        <div className="space-y-6">
          <div>
            <CopyableHeading level={1} id={h1Id}>
              This is a Level 1 Heading
            </CopyableHeading>
            <p className="text-sm text-muted-foreground mt-2">
              Largest size, typically used for page titles
            </p>
          </div>

          <div>
            <CopyableHeading level={2} id={h2Id}>
              This is a Level 2 Heading
            </CopyableHeading>
            <p className="text-sm text-muted-foreground mt-2">Used for major sections</p>
          </div>

          <div>
            <CopyableHeading level={3} id={h3Id}>
              This is a Level 3 Heading
            </CopyableHeading>
            <p className="text-sm text-muted-foreground mt-2">Used for subsections</p>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Code block with nested elements (simulates syntax highlighting)
 */
export const CodeBlockNested: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Complex Code Block</h2>
        <p className="text-muted-foreground">
          Code blocks can contain nested React elements from syntax highlighting.
        </p>
      </div>

      <CopyableCodeBlock className="language-jsx">
        <code>
          <span className="token keyword">import</span> React{' '}
          <span className="token keyword">from</span> <span className="token string">'react'</span>
          {'\n'}
          {'\n'}
          <span className="token keyword">export</span>{' '}
          <span className="token keyword">function</span>{' '}
          <span className="token function">Component</span>
          {'() {'}
          {'\n'}
          {'  '}
          <span className="token keyword">return</span>{' '}
          <span className="token tag">
            <span className="token punctuation">&lt;</span>div
            <span className="token punctuation">&gt;</span>
          </span>
          Hello
          <span className="token tag">
            <span className="token punctuation">&lt;/</span>div
            <span className="token punctuation">&gt;</span>
          </span>
          {'\n'}
          {'}'}
        </code>
      </CopyableCodeBlock>
    </div>
  ),
};

/**
 * Link styling variations
 */
export const LinkStyling: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Link Styling</h2>
        <p className="text-muted-foreground">
          Both internal and external links have hover effects and proper styling.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <p className="font-medium mb-2">Internal Links:</p>
          <div className="space-x-4">
            <InternalLinkComponent href="/agents">Agents</InternalLinkComponent>
            <InternalLinkComponent href="/mcp">MCP</InternalLinkComponent>
            <InternalLinkComponent href="/guides">Guides</InternalLinkComponent>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="font-medium mb-2">External Links:</p>
          <div className="space-x-4">
            <ExternalLinkComponent href="https://anthropic.com">Anthropic</ExternalLinkComponent>
            <ExternalLinkComponent href="https://docs.anthropic.com">Docs</ExternalLinkComponent>
            <ExternalLinkComponent href="https://github.com">GitHub</ExternalLinkComponent>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Interactive copy demo with unique IDs
 */
export const InteractiveCopy: StoryObj = {
  render: () => {
    const copyTestId = useId();

    return (
      <div className="space-y-6 max-w-3xl">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-2">Interactive Copy Demo</h2>
          <p className="text-muted-foreground mb-4">
            Try copying from these elements. Toast notifications will appear on success.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Copy heading link:</p>
            <CopyableHeading level={2} id={copyTestId}>
              Hover and click the copy icon
            </CopyableHeading>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Copy code:</p>
            <CopyableCodeBlock className="language-javascript">
              {`const message = "Click the copy button!";
console.log(message);`}
            </CopyableCodeBlock>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing copy functionality. Click copy buttons to see toast notifications.',
      },
    },
  },
};

/**
 * Article layout with unique IDs
 */
export const ArticleLayout: StoryObj = {
  render: () => {
    const mainTitleId = useId();
    const gettingStartedId = useId();
    const exampleCodeId = useId();
    const explanationId = useId();
    const resourcesId = useId();

    return (
      <div className="max-w-4xl mx-auto">
        <article className="prose dark:prose-invert max-w-none">
          <CopyableHeading level={1} id={mainTitleId}>
            Building AI Agents with Claude
          </CopyableHeading>

          <p className="lead">
            Learn how to create powerful AI agents using Claude's advanced capabilities.
          </p>

          <CopyableHeading level={2} id={gettingStartedId}>
            Getting Started
          </CopyableHeading>

          <p>
            Before building agents, make sure you have access to the Claude API. Visit{' '}
            <ExternalLinkComponent href="https://console.anthropic.com">
              Anthropic Console
            </ExternalLinkComponent>{' '}
            to get your API key.
          </p>

          <p>
            For more background, check out our{' '}
            <InternalLinkComponent href="/guides/introduction">
              introduction guide
            </InternalLinkComponent>
            .
          </p>

          <CopyableHeading level={2} id={exampleCodeId}>
            Example Code
          </CopyableHeading>

          <p>Here's a simple agent implementation:</p>

          <CopyableCodeBlock className="language-typescript">
            {`interface Agent {
  name: string;
  systemPrompt: string;
  tools: Tool[];
}

async function runAgent(agent: Agent, userMessage: string) {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: agent.systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return response;
}`}
          </CopyableCodeBlock>

          <CopyableHeading level={3} id={explanationId}>
            How It Works
          </CopyableHeading>

          <p>
            This agent accepts a user message and processes it using Claude. The system prompt
            defines the agent's behavior and capabilities.
          </p>

          <CopyableHeading level={2} id={resourcesId}>
            Additional Resources
          </CopyableHeading>

          <ul>
            <li>
              <InternalLinkComponent href="/agents">Browse example agents</InternalLinkComponent>
            </li>
            <li>
              <ExternalLinkComponent href="https://docs.anthropic.com">
                Read API documentation
              </ExternalLinkComponent>
            </li>
            <li>
              <InternalLinkComponent href="/guides">Explore more guides</InternalLinkComponent>
            </li>
          </ul>
        </article>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// LAZY COMPONENT STORIES (Code-Split)
// ============================================================================

/**
 * Smart Related Content - Lazy loaded with Suspense
 * NOTE: Storybook mock data - production uses ML/search
 */
export const LazySmartRelated: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Smart Related Content (Lazy Loaded)</h2>
        <p className="text-muted-foreground mb-4">
          Heavy component loaded on-demand with React.lazy(). Shows ML-powered content
          recommendations based on current article context.
        </p>
      </div>

      <SmartRelatedContent
        pathname="/guides/example"
        category="agents"
        contentType="guides"
        currentSlug="example-guide"
        tags={['ai', 'automation', 'claude']}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'SmartRelatedContent is lazy-loaded to reduce bundle size. Uses Suspense with skeleton fallback.',
      },
    },
  },
};

/**
 * Metrics Display - Lazy loaded analytics visualization
 */
export const LazyMetrics: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Metrics Display (Lazy Loaded)</h2>
        <p className="text-muted-foreground mb-4">
          Analytics visualization component loaded on-demand. Shows key performance metrics.
        </p>
      </div>

      <MetricsDisplay
        metrics={[
          { label: 'Total Users', value: '10,482', change: '+12.5%', trend: 'up' },
          { label: 'Active Sessions', value: '3,421', change: '+8.2%', trend: 'up' },
          { label: 'Avg Response Time', value: '124ms', change: '-5.3%', trend: 'down' },
          { label: 'Success Rate', value: '99.7%', change: '+0.2%', trend: 'up' },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'MetricsDisplay is lazy-loaded with Suspense. Shows analytics data visualization.',
      },
    },
  },
};

/**
 * Comparison Table - Lazy loaded interactive table
 */
export const LazyComparison: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Comparison Table (Lazy Loaded)</h2>
        <p className="text-muted-foreground mb-4">
          Interactive comparison table loaded on-demand. Useful for feature comparisons.
        </p>
      </div>

      <ComparisonTable
        title="Model Comparison"
        data={[
          {
            feature: 'Max Tokens',
            'claude-3-5-sonnet': '200K',
            'claude-3-opus': '200K',
            'claude-3-haiku': '200K',
          },
          {
            feature: 'Price (Input)',
            'claude-3-5-sonnet': '$3/MTok',
            'claude-3-opus': '$15/MTok',
            'claude-3-haiku': '$0.25/MTok',
          },
          {
            feature: 'Speed',
            'claude-3-5-sonnet': 'Fast',
            'claude-3-opus': 'Medium',
            'claude-3-haiku': 'Very Fast',
          },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'ComparisonTable is lazy-loaded with Suspense. Displays interactive feature comparisons.',
      },
    },
  },
};

/**
 * All lazy components showcase
 */
export const AllLazyComponents: StoryObj = {
  render: () => (
    <div className="space-y-12 max-w-4xl">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">All Lazy Components</h2>
        <p className="text-muted-foreground mb-4">
          Showcase of all code-split components loaded with React.lazy(). Each has its own Suspense
          boundary for parallel loading.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-semibold mb-4">Smart Related Content</h3>
          <SmartRelatedContent
            pathname="/guides/example"
            category="agents"
            contentType="guides"
            currentSlug="example-guide"
            tags={['ai', 'automation']}
          />
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Metrics Display</h3>
          <MetricsDisplay
            metrics={[
              { label: 'Users', value: '10K', change: '+12%', trend: 'up' },
              { label: 'Sessions', value: '3.4K', change: '+8%', trend: 'up' },
            ]}
          />
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Step-by-Step Guide</h3>
          <StepByStepGuide
            title="Getting Started"
            steps={[
              { title: 'Install SDK', description: 'Install the Anthropic SDK via npm' },
              {
                title: 'Configure API Key',
                description: 'Set your API key in environment variables',
              },
              { title: 'Make First Call', description: 'Send your first message to Claude' },
            ]}
          />
        </section>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates all lazy-loaded components with individual Suspense boundaries for parallel loading (React 19 pattern).',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Copyable Heading Test
 * Tests CopyableHeading renders with copy button
 */
export const CopyableHeadingTest: Story = {
  render: () => {
    const headingId = useId();
    return <CopyableHeading id={headingId}>Test Heading Content</CopyableHeading>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests CopyableHeading displays heading text and copy button.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify heading text is displayed', async () => {
      const heading = canvas.getByText(/test heading content/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify copy button is rendered', async () => {
      // Copy button should be a button element
      const buttons = canvas.getAllByRole('button');
      await expect(buttons.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Copyable Code Block Test
 * Tests CopyableCodeBlock renders code with copy functionality
 */
export const CopyableCodeBlockTest: Story = {
  render: () => (
    <CopyableCodeBlock className="language-javascript">
      console.log('Test code block');
    </CopyableCodeBlock>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tests CopyableCodeBlock displays code and copy button.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify code content is displayed', async () => {
      const code = canvas.getByText(/console\.log/i);
      await expect(code).toBeInTheDocument();
    });

    await step('Verify copy button is rendered', async () => {
      const buttons = canvas.getAllByRole('button');
      await expect(buttons.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Comparison Table Test
 * Tests ComparisonTable renders headers and rows
 */
export const ComparisonTableTest: Story = {
  render: () => (
    <ComparisonTable
      headers={['Feature', 'Option A', 'Option B']}
      rows={[
        ['Speed', 'Fast', 'Faster'],
        ['Price', '$10', '$20'],
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tests ComparisonTable displays headers and comparison data.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify table headers are displayed', async () => {
      const feature = canvas.getByText(/feature/i);
      const optionA = canvas.getByText(/option a/i);
      const optionB = canvas.getByText(/option b/i);

      await expect(feature).toBeInTheDocument();
      await expect(optionA).toBeInTheDocument();
      await expect(optionB).toBeInTheDocument();
    });

    await step('Verify table data is displayed', async () => {
      const speed = canvas.getByText(/speed/i);
      const fast = canvas.getByText(/fast/i);
      const faster = canvas.getByText(/faster/i);

      await expect(speed).toBeInTheDocument();
      await expect(fast).toBeInTheDocument();
      await expect(faster).toBeInTheDocument();
    });
  },
};
