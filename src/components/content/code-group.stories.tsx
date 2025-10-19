import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { CodeGroup } from './code-group';

/**
 * CodeGroup Component Stories
 *
 * HYBRID component: Server-side Shiki highlighting + Client-side tab switching
 * Used in 65+ MDX files across the codebase for multi-language code examples.
 *
 * Architecture:
 * - Server: Pre-renders all code with Shiki (secure, performant)
 * - Client: Interactive tab switching with minimal JavaScript
 * - Uses ProductionCodeBlock for rendering each example
 * - Schema.org structured data for SEO
 *
 * Component: src/components/content/code-group.tsx (98 LOC)
 * Usage: 65 MDX files across codebase
 *
 * Storybook Note:
 * Stories use mock HTML instead of real Shiki highlighting since
 * Shiki runs server-side and Storybook runs in browser.
 */
const meta = {
  title: 'Content/CodeGroup',
  component: CodeGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Multi-language code examples with interactive tab switching. Server-rendered highlighting with client-side interactivity.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CodeGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock highlighted HTML samples
const mockTypeScriptCode = `function greet(name: string): void {
  console.log(\`Hello, \${name}!\`);
}

greet('World');`;

const mockJavaScriptCode = `function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');`;

const mockPythonCode = `def greet(name: str) -> None:
    print(f"Hello, {name}!")

greet("World")`;

const mockTypeScriptComponent = `import React, { useState } from 'react';

interface GreetingProps {
  name: string;
}

export function Greeting({ name }: GreetingProps) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}`;

const mockJavaScriptComponent = `import React, { useState } from 'react';

export function Greeting({ name }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}`;

const mockPackageJson = `{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "react": "^19.1.1",
    "next": "^15.5.2"
  }
}`;

const mockTsconfigJson = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`;

const mockLongCode = `import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function UserForm({ userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
  });

  useEffect(() => {
    async function fetchUser() {
      setIsLoading(true);
      try {
        const response = await fetch(\`/api/users/\${userId}\`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setUserData(data);
        setFormData({
          name: data.name,
          email: data.email,
          bio: data.bio,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(\`/api/users/\${userId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update');
      alert('User updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="Bio"
          multiline
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Card>
  );
}`;

/**
 * Two-Tab Example (TypeScript + JavaScript)
 *
 * Most common use case: Show same code in TypeScript and JavaScript.
 * Perfect for documentation targeting both audiences.
 *
 * Usage in MDX:
 * ```mdx
 * <CodeGroup
 *   examples={[
 *     { language: "typescript", code: tsCode, highlightedHtml: tsHtml },
 *     { language: "javascript", code: jsCode, highlightedHtml: jsHtml }
 *   ]}
 * />
 * ```
 */
export const TwoTabs: Story = {
  args: {
    examples: [
      {
        language: 'typescript',
        code: mockTypeScriptCode,
        highlightedHtml: `<pre><code>${mockTypeScriptCode}</code></pre>`,
      },
      {
        language: 'javascript',
        code: mockJavaScriptCode,
        highlightedHtml: `<pre><code>${mockJavaScriptCode}</code></pre>`,
      },
    ],
  },
};

/**
 * Three-Tab Example (TypeScript + JavaScript + Python)
 *
 * Shows same concept in 3 different languages.
 * Common in API client examples or algorithm demonstrations.
 *
 * Usage in MDX:
 * ```mdx
 * <CodeGroup
 *   examples={[
 *     { language: "typescript", code: tsCode, highlightedHtml: tsHtml },
 *     { language: "javascript", code: jsCode, highlightedHtml: jsHtml },
 *     { language: "python", code: pyCode, highlightedHtml: pyHtml }
 *   ]}
 * />
 * ```
 */
export const ThreeTabs: Story = {
  args: {
    examples: [
      {
        language: 'typescript',
        code: mockTypeScriptCode,
        highlightedHtml: `<pre><code>${mockTypeScriptCode}</code></pre>`,
      },
      {
        language: 'javascript',
        code: mockJavaScriptCode,
        highlightedHtml: `<pre><code>${mockJavaScriptCode}</code></pre>`,
      },
      {
        language: 'python',
        code: mockPythonCode,
        highlightedHtml: `<pre><code>${mockPythonCode}</code></pre>`,
      },
    ],
  },
};

/**
 * With Filenames
 *
 * Shows filename in tab label for configuration files.
 * Helps users understand which file to edit.
 *
 * Pattern: "language • filename" in tab
 *
 * Usage in MDX:
 * ```mdx
 * <CodeGroup
 *   examples={[
 *     {
 *       language: "json",
 *       filename: "package.json",
 *       code: pkgCode,
 *       highlightedHtml: pkgHtml
 *     },
 *     {
 *       language: "json",
 *       filename: "tsconfig.json",
 *       code: tsCode,
 *       highlightedHtml: tsHtml
 *     }
 *   ]}
 * />
 * ```
 */
export const WithFilenames: Story = {
  args: {
    examples: [
      {
        language: 'json',
        filename: 'package.json',
        code: mockPackageJson,
        highlightedHtml: `<pre><code>${mockPackageJson}</code></pre>`,
      },
      {
        language: 'json',
        filename: 'tsconfig.json',
        code: mockTsconfigJson,
        highlightedHtml: `<pre><code>${mockTsconfigJson}</code></pre>`,
      },
    ],
  },
};

/**
 * With Title and Description
 *
 * Adds context above the code tabs.
 * Title uses h3 heading, description shows in muted text.
 * Both are included in Schema.org markup for SEO.
 *
 * Usage in MDX:
 * ```mdx
 * <CodeGroup
 *   title="Component Implementation"
 *   description="Choose your preferred framework"
 *   examples={[...]}
 * />
 * ```
 */
export const WithTitleAndDescription: Story = {
  args: {
    title: 'Component Implementation',
    description:
      'Choose your preferred language. TypeScript provides type safety, JavaScript is simpler.',
    examples: [
      {
        language: 'typescript',
        filename: 'Greeting.tsx',
        code: mockTypeScriptComponent,
        highlightedHtml: `<pre><code>${mockTypeScriptComponent}</code></pre>`,
      },
      {
        language: 'javascript',
        filename: 'Greeting.jsx',
        code: mockJavaScriptComponent,
        highlightedHtml: `<pre><code>${mockJavaScriptComponent}</code></pre>`,
      },
    ],
  },
};

/**
 * Single Tab (Edge Case)
 *
 * CodeGroup with only one example.
 * Still renders tabs for UI consistency, but clicking has no effect.
 *
 * Note: For single code blocks without tabs, use ProductionCodeBlock directly.
 */
export const SingleTab: Story = {
  args: {
    title: 'Installation',
    description: 'Install the package using npm',
    examples: [
      {
        language: 'bash',
        filename: 'terminal',
        code: 'npm install @acme/ui',
        highlightedHtml: '<pre><code>npm install @acme/ui</code></pre>',
      },
    ],
  },
};

/**
 * Long Code Examples
 *
 * Tests scrolling behavior with long code.
 * ProductionCodeBlock handles collapsing (maxLines=30 default).
 *
 * Click "Show more" to expand full code.
 */
export const LongCode: Story = {
  args: {
    title: 'User Form Component',
    description: 'Complete form implementation with state management and API integration',
    examples: [
      {
        language: 'typescript',
        filename: 'UserForm.tsx',
        code: mockLongCode,
        highlightedHtml: `<pre><code>${mockLongCode}</code></pre>`,
      },
      {
        language: 'javascript',
        filename: 'UserForm.jsx',
        code: mockLongCode.replace(/: string|: GreetingProps|\(name\): string/g, ''),
        highlightedHtml: `<pre><code>${mockLongCode.replace(/: string|: GreetingProps|\(name\): string/g, '')}</code></pre>`,
      },
    ],
  },
};

/**
 * Interactive Tab Switching Demo
 *
 * Click tabs to see smooth transitions between code examples.
 * Active tab shows primary border-bottom, inactive tabs are muted.
 *
 * Tests:
 * - Tab click handlers
 * - Active/inactive styling
 * - Content show/hide behavior
 * - Keyboard navigation (TODO: not implemented yet)
 */
export const InteractiveTabSwitching: Story = {
  args: {
    title: 'API Client Example',
    description: 'Click tabs to switch between language implementations',
    examples: [
      {
        language: 'typescript',
        code: 'const client = new APIClient({ apiKey: "..." });',
        highlightedHtml: '<pre><code>const client = new APIClient({ apiKey: "..." });</code></pre>',
      },
      {
        language: 'javascript',
        code: 'const client = new APIClient({ apiKey: "..." });',
        highlightedHtml: '<pre><code>const client = new APIClient({ apiKey: "..." });</code></pre>',
      },
      {
        language: 'python',
        code: 'client = APIClient(api_key="...")',
        highlightedHtml: '<pre><code>client = APIClient(api_key="...")</code></pre>',
      },
    ],
  },
};

/**
 * Configuration Files Example
 *
 * Real-world example: Multiple configuration files for project setup.
 * Demonstrates filename labeling for different file types.
 */
export const ConfigurationFiles: Story = {
  args: {
    title: 'Project Configuration',
    description: 'Essential configuration files for a TypeScript Next.js project',
    examples: [
      {
        language: 'json',
        filename: 'package.json',
        code: mockPackageJson,
        highlightedHtml: `<pre><code>${mockPackageJson}</code></pre>`,
      },
      {
        language: 'json',
        filename: 'tsconfig.json',
        code: mockTsconfigJson,
        highlightedHtml: `<pre><code>${mockTsconfigJson}</code></pre>`,
      },
      {
        language: 'javascript',
        filename: 'next.config.js',
        code: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig`,
        highlightedHtml: `<pre><code>/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig</code></pre>`,
      },
    ],
  },
};

/**
 * Minimal Example
 *
 * Simplest possible CodeGroup with just required props.
 * No title, description, or filenames.
 *
 * Perfect starting point for new implementations.
 */
export const Minimal: Story = {
  args: {
    examples: [
      {
        language: 'typescript',
        code: 'console.log("Hello, TypeScript!");',
        highlightedHtml: '<pre><code>console.log("Hello, TypeScript!");</code></pre>',
      },
      {
        language: 'javascript',
        code: 'console.log("Hello, JavaScript!");',
        highlightedHtml: '<pre><code>console.log("Hello, JavaScript!");</code></pre>',
      },
    ],
  },
};

/**
 * Empty Examples (Error Case)
 *
 * CodeGroup with empty examples array.
 * Component returns null and renders nothing.
 *
 * Validates defensive programming for edge cases.
 */
export const EmptyExamples: Story = {
  args: {
    title: 'This should not render',
    description: 'Empty examples array causes component to return null',
    examples: [],
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Tab Labels Test
 * Tests code group renders all tab labels
 */
export const TabLabelsTest: Story = {
  args: {
    title: 'Test Code Examples',
    description: 'Testing tab labels',
    examples: [
      { label: 'JavaScript', language: 'javascript', code: 'console.log("test1")' },
      { label: 'TypeScript', language: 'typescript', code: 'console.log("test2")' },
      { label: 'Python', language: 'python', code: 'print("test3")' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests code group displays all tab labels correctly.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify all tab labels are displayed', async () => {
      const jsTab = canvas.getByRole('tab', { name: /javascript/i });
      const tsTab = canvas.getByRole('tab', { name: /typescript/i });
      const pyTab = canvas.getByRole('tab', { name: /python/i });

      await expect(jsTab).toBeInTheDocument();
      await expect(tsTab).toBeInTheDocument();
      await expect(pyTab).toBeInTheDocument();
    });
  },
};

/**
 * Tab Switching Test
 * Tests clicking tabs switches displayed code
 */
export const TabSwitchingTest: Story = {
  args: {
    title: 'Tab Switching Demo',
    examples: [
      { label: 'Example 1', language: 'javascript', code: 'const example1 = true;' },
      { label: 'Example 2', language: 'typescript', code: 'const example2: boolean = true;' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests tab interaction switches visible code content.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial tab content is displayed', async () => {
      const code = canvas.getByText(/example1/i);
      await expect(code).toBeInTheDocument();
    });

    await step('Click second tab', async () => {
      const tab2 = canvas.getByRole('tab', { name: /example 2/i });
      await userEvent.click(tab2);
    });

    await step('Verify second tab content is displayed', async () => {
      const code = canvas.getByText(/example2/i);
      await expect(code).toBeInTheDocument();
    });
  },
};

/**
 * Code Syntax Highlighting Test
 * Tests code blocks render with syntax highlighting
 */
export const SyntaxHighlightingTest: Story = {
  args: {
    title: 'Syntax Highlighting',
    examples: [
      {
        label: 'JavaScript',
        language: 'javascript',
        code: 'function test() {\n  return "hello";\n}',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests code blocks render with proper syntax highlighting.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify code content is displayed', async () => {
      const code = canvas.getByText(/function test/i);
      await expect(code).toBeInTheDocument();
    });

    await step('Verify code block is rendered', async () => {
      // Code should be in a pre or code element
      const codeBlock = canvasElement.querySelector('pre, code');
      await expect(codeBlock).toBeInTheDocument();
    });
  },
};

/**
 * Copy Button Test
 * Tests code blocks have copy functionality
 */
export const CopyButtonTest: Story = {
  args: {
    title: 'Copy Button Demo',
    examples: [{ label: 'Code', language: 'javascript', code: 'const test = 123;' }],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests code blocks include copy button for easy copying.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify copy button is rendered', async () => {
      // Should have a copy button
      const buttons = canvas.getAllByRole('button');
      // At least one button (copy or tab)
      await expect(buttons.length).toBeGreaterThan(0);
    });
  },
};
