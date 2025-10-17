'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  CopyableCodeBlock,
  CopyableHeading,
  ExternalLinkComponent,
  InternalLinkComponent,
} from './mdx-components';

const meta = {
  title: 'Shared/MDXComponents',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Specialized components for MDX content rendering. Includes copyable headings with anchor links, copyable code blocks with email capture, external links with icons, and internal links. Used within MDX content rendering.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

/**
 * Copyable headings showcase
 */
export const CopyableHeadings: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-muted-foreground mb-4">
          Hover over headings to see the copy link icon. Click to copy the anchor link.
        </p>
      </div>

      <CopyableHeading level={1} id="heading-1">
        Level 1 Heading
      </CopyableHeading>

      <p className="text-muted-foreground">
        This is some content under the first heading. The heading above has an anchor link that can
        be copied.
      </p>

      <CopyableHeading level={2} id="heading-2">
        Level 2 Heading
      </CopyableHeading>

      <p className="text-muted-foreground">
        Level 2 headings are slightly smaller. They also support copying the anchor link.
      </p>

      <CopyableHeading level={3} id="heading-3">
        Level 3 Heading
      </CopyableHeading>

      <p className="text-muted-foreground">
        Level 3 headings are the smallest. All heading levels support the same copy functionality.
      </p>
    </div>
  ),
};

/**
 * Copyable code block
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
 * External links
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
 * Internal links
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
 * Mixed content showcase
 */
export const MixedContent: StoryObj = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <CopyableHeading level={1} id="article-title">
        Complete MDX Article Example
      </CopyableHeading>

      <p className="text-muted-foreground">
        This showcase demonstrates all MDX components together in a realistic article context.
      </p>

      <CopyableHeading level={2} id="introduction">
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

      <CopyableHeading level={2} id="code-example">
        Code Example
      </CopyableHeading>

      <p className="text-muted-foreground mb-4">Here's a simple example of using the Claude API:</p>

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

      <CopyableHeading level={3} id="explanation">
        Explanation
      </CopyableHeading>

      <div className="prose dark:prose-invert">
        <p>
          This code creates a client instance and sends a message to Claude. For more details, refer
          to the{' '}
          <ExternalLinkComponent href="https://docs.anthropic.com">
            API documentation
          </ExternalLinkComponent>
          .
        </p>
      </div>

      <CopyableHeading level={2} id="next-steps">
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
  ),
};

/**
 * Heading levels comparison
 */
export const HeadingLevels: StoryObj = {
  render: () => (
    <div className="space-y-8 max-w-3xl">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Heading Size Comparison</h2>
        <p className="text-muted-foreground">All heading levels with copy functionality.</p>
      </div>

      <div className="space-y-6">
        <div>
          <CopyableHeading level={1} id="h1-example">
            This is a Level 1 Heading
          </CopyableHeading>
          <p className="text-sm text-muted-foreground mt-2">
            Largest size, typically used for page titles
          </p>
        </div>

        <div>
          <CopyableHeading level={2} id="h2-example">
            This is a Level 2 Heading
          </CopyableHeading>
          <p className="text-sm text-muted-foreground mt-2">Used for major sections</p>
        </div>

        <div>
          <CopyableHeading level={3} id="h3-example">
            This is a Level 3 Heading
          </CopyableHeading>
          <p className="text-sm text-muted-foreground mt-2">Used for subsections</p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Code block with nested elements
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
 * Interactive copy demo
 */
export const InteractiveCopy: StoryObj = {
  render: () => (
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
          <CopyableHeading level={2} id="copy-test">
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
  ),
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
 * In article layout
 */
export const ArticleLayout: StoryObj = {
  render: () => (
    <div className="max-w-4xl mx-auto">
      <article className="prose dark:prose-invert max-w-none">
        <CopyableHeading level={1} id="main-title">
          Building AI Agents with Claude
        </CopyableHeading>

        <p className="lead">
          Learn how to create powerful AI agents using Claude's advanced capabilities.
        </p>

        <CopyableHeading level={2} id="getting-started">
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

        <CopyableHeading level={2} id="example-code">
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

        <CopyableHeading level={3} id="explanation">
          How It Works
        </CopyableHeading>

        <p>
          This agent accepts a user message and processes it using Claude. The system prompt defines
          the agent's behavior and capabilities.
        </p>

        <CopyableHeading level={2} id="resources">
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
  ),
  parameters: {
    layout: 'padded',
  },
};
