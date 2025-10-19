'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ProductionCodeBlock } from './production-code-block';

const meta = {
  title: 'UI/ProductionCodeBlock',
  component: ProductionCodeBlock,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Production code block with max-height constraint, smooth expand/collapse, 1-click copy, and mobile optimization. Features custom scrollbar styling, optional line numbers, and filename display. Server-rendered with client interactivity.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    html: {
      control: 'text',
      description: 'Pre-rendered HTML from Shiki (server-side)',
    },
    code: {
      control: 'text',
      description: 'Raw code for copy functionality',
    },
    language: {
      control: 'text',
      description: 'Programming language',
    },
    filename: {
      control: 'text',
      description: 'Optional filename to display',
    },
    maxLines: {
      control: 'number',
      description: 'Maximum visible lines before collapsing',
    },
    showLineNumbers: {
      control: 'boolean',
      description: 'Show line numbers',
    },
  },
} satisfies Meta<typeof ProductionCodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleJavaScriptCode = `function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');`;

const samplePythonCode = `def greet(name: str) -> None:
    print(f"Hello, {name}!")

greet("World")`;

const sampleLongCode = `import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ComplexComponent({ data }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/data');
        const json = await response.json();
        setResult(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <h2>Results</h2>
      <pre>{JSON.stringify(result, null, 2)}</pre>
      <Button onClick={() => setResult(null)}>Clear</Button>
    </Card>
  );
}`;

/**
 * Default code block
 */
export const Default: Story = {
  args: {
    html: `<pre><code>${sampleJavaScriptCode}</code></pre>`,
    code: sampleJavaScriptCode,
    language: 'javascript',
  },
};

/**
 * With filename
 */
export const WithFilename: Story = {
  args: {
    html: `<pre><code>${sampleJavaScriptCode}</code></pre>`,
    code: sampleJavaScriptCode,
    language: 'javascript',
    filename: 'greet.js',
  },
};

/**
 * Python code
 */
export const PythonCode: Story = {
  args: {
    html: `<pre><code>${samplePythonCode}</code></pre>`,
    code: samplePythonCode,
    language: 'python',
    filename: 'greet.py',
  },
};

/**
 * TypeScript code
 */
export const TypeScriptCode: Story = {
  args: {
    html: `<pre><code>${sampleLongCode}</code></pre>`,
    code: sampleLongCode,
    language: 'typescript',
    filename: 'ComplexComponent.tsx',
  },
};

/**
 * Long code that needs collapsing
 */
export const LongCode: Story = {
  args: {
    html: `<pre><code>${sampleLongCode}</code></pre>`,
    code: sampleLongCode,
    language: 'typescript',
    filename: 'ComplexComponent.tsx',
    maxLines: 10,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Long code blocks are automatically collapsed with an expand/collapse button. Default max is 20 lines.',
      },
    },
  },
};

/**
 * With line numbers
 */
export const WithLineNumbers: Story = {
  args: {
    html: `<pre><code>${sampleJavaScriptCode}</code></pre>`,
    code: sampleJavaScriptCode,
    language: 'javascript',
    filename: 'greet.js',
    showLineNumbers: true,
  },
};

/**
 * Without language badge
 */
export const WithoutLanguageBadge: Story = {
  args: {
    html: `<pre><code>${sampleJavaScriptCode}</code></pre>`,
    code: sampleJavaScriptCode,
  },
};

/**
 * Plain text
 */
export const PlainText: Story = {
  args: {
    html: `<pre><code>This is plain text content
without any syntax highlighting.

It can span multiple lines
and include any characters.</code></pre>`,
    code: `This is plain text content
without any syntax highlighting.

It can span multiple lines
and include any characters.`,
    language: 'text',
  },
};

/**
 * JSON code
 */
export const JsonCode: Story = {
  args: {
    html: `<pre><code>{
  "name": "claude-pro-directory",
  "version": "1.0.0",
  "description": "A directory of Claude resources",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}</code></pre>`,
    code: `{
  "name": "claude-pro-directory",
  "version": "1.0.0",
  "description": "A directory of Claude resources",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}`,
    language: 'json',
    filename: 'package.json',
  },
};

/**
 * Bash script
 */
export const BashScript: Story = {
  args: {
    html: `<pre><code>#!/bin/bash

# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build</code></pre>`,
    code: `#!/bin/bash

# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build`,
    language: 'bash',
    filename: 'deploy.sh',
  },
};

/**
 * Short code snippet
 */
export const ShortSnippet: Story = {
  args: {
    html: `<pre><code>const greeting = "Hello, World!";</code></pre>`,
    code: `const greeting = "Hello, World!";`,
    language: 'javascript',
  },
};

/**
 * Custom max lines
 */
export const CustomMaxLines: Story = {
  args: {
    html: `<pre><code>${sampleLongCode}</code></pre>`,
    code: sampleLongCode,
    language: 'typescript',
    filename: 'example.tsx',
    maxLines: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom maxLines prop set to 5 instead of the default 20.',
      },
    },
  },
};

/**
 * Multiple code blocks
 */
export const MultipleBlocks: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold mb-3">JavaScript Example</h3>
        <ProductionCodeBlock
          html={`<pre><code>${sampleJavaScriptCode}</code></pre>`}
          code={sampleJavaScriptCode}
          language="javascript"
          filename="greet.js"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Python Example</h3>
        <ProductionCodeBlock
          html={`<pre><code>${samplePythonCode}</code></pre>`}
          code={samplePythonCode}
          language="python"
          filename="greet.py"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Complex TypeScript Component</h3>
        <ProductionCodeBlock
          html={`<pre><code>${sampleLongCode}</code></pre>`}
          code={sampleLongCode}
          language="typescript"
          filename="ComplexComponent.tsx"
          maxLines={10}
        />
      </div>
    </div>
  ),
};

/**
 * In article context
 */
export const InArticleContext: Story = {
  render: () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <article className="prose dark:prose-invert">
        <h1>How to Create a React Component</h1>
        <p>
          React components are the building blocks of React applications. Here's a simple example of
          a functional component:
        </p>
      </article>

      <ProductionCodeBlock
        html={`<pre><code>${sampleJavaScriptCode}</code></pre>`}
        code={sampleJavaScriptCode}
        language="javascript"
        filename="Greeting.jsx"
      />

      <article className="prose dark:prose-invert">
        <p>
          This component accepts a name prop and displays a greeting message. You can use it in your
          application like this:
        </p>
      </article>

      <ProductionCodeBlock
        html={`<pre><code>import { Greeting } from './Greeting';

function App() {
  return <Greeting name="World" />;
}</code></pre>`}
        code={`import { Greeting } from './Greeting';

function App() {
  return <Greeting name="World" />;
}`}
        language="javascript"
        filename="App.jsx"
      />
    </div>
  ),
};

/**
 * Interactive copy demo
 */
export const InteractiveCopyDemo: Story = {
  args: {
    html: `<pre><code>${sampleJavaScriptCode}</code></pre>`,
    code: sampleJavaScriptCode,
    language: 'javascript',
    filename: 'example.js',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click the copy button to copy the code to your clipboard. Toast notifications are shown on success/failure.',
      },
    },
  },
};

/**
 * Expand/collapse demo
 */
export const ExpandCollapseDemo: Story = {
  args: {
    html: `<pre><code>${sampleLongCode}</code></pre>`,
    code: sampleLongCode,
    language: 'typescript',
    filename: 'example.tsx',
    maxLines: 8,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Long code blocks show an expand/collapse button. Click it to see the full code or collapse it back.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Code Rendering Test
 * Tests code block renders code content
 */
export const CodeRenderingTest: Story = {
  args: {
    code: 'const greeting = "Hello, World!";\nconsole.log(greeting);',
    language: 'javascript',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests code block displays code content correctly.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify code content is displayed', async () => {
      const code = canvas.getByText(/const greeting/i);
      await expect(code).toBeInTheDocument();
    });

    await step('Verify code block element is rendered', async () => {
      const codeBlock = canvasElement.querySelector('pre, code');
      await expect(codeBlock).toBeInTheDocument();
    });
  },
};

/**
 * Copy Button Test
 * Tests copy button is rendered and accessible
 */
export const CopyButtonRenderTest: Story = {
  args: {
    code: 'npm install package-name',
    language: 'bash',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests copy button renders for easy code copying.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify copy button is rendered', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy/i });
      await expect(copyButton).toBeInTheDocument();
    });

    await step('Verify code content is displayed', async () => {
      const code = canvas.getByText(/npm install/i);
      await expect(code).toBeInTheDocument();
    });
  },
};

/**
 * Language Label Test
 * Tests language label displays correctly
 */
export const LanguageLabelTest: Story = {
  args: {
    code: 'function example() { return true; }',
    language: 'typescript',
    showLanguage: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests language label displays when showLanguage is true.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify language label is displayed', async () => {
      const langLabel = canvas.getByText(/typescript/i);
      await expect(langLabel).toBeInTheDocument();
    });

    await step('Verify code content is displayed', async () => {
      const code = canvas.getByText(/function example/i);
      await expect(code).toBeInTheDocument();
    });
  },
};
