import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { AlertTriangle, Settings, Zap } from '@/src/lib/icons';
import { UnifiedContentSection } from './unified-content-section';

/**
 * UnifiedContentSection Storybook Stories
 *
 * Comprehensive showcase of all 6 section variants consolidated into one component.
 * Demonstrates proper data/presentation separation and discriminated union type safety.
 *
 * **Architecture:**
 * - Client component ('use client') - Storybook compatible
 * - Accepts pre-processed data (HTML strings) from server-side data layer
 * - Configuration-driven with discriminated union type safety
 * - Zero backward compatibility - modern patterns only
 *
 * **Consolidation:**
 * - Replaces: BulletListSection, ContentSection, ConfigurationSection, UsageExamplesSection, TroubleshootingSection, InstallationSection
 * - 6 files (921 LOC) → 1 file (~520 LOC)
 * - ~401 LOC eliminated (44% reduction)
 */

const meta = {
  title: 'Pages/UnifiedContentSection',
  component: UnifiedContentSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Unified Content Section Component** - Configuration-driven section rendering with discriminated union.

**Architecture Improvement:**
- **DATA LAYER (Server):** All async operations (syntax highlighting) at page level
- **PRESENTATION LAYER (Client):** This component receives pre-processed HTML and renders UI

**Consolidates 6 Components:**
- \`BulletListSection\` (120 LOC) → \`bullets\` variant
- \`ContentSection\` (83 LOC) → \`content\` variant
- \`ConfigurationSection\` (207 LOC) → \`configuration\` variant (json/multi/hook)
- \`UsageExamplesSection\` (251 LOC) → \`examples\` variant
- \`TroubleshootingSection\` (105 LOC) → \`troubleshooting\` variant
- \`InstallationSection\` (155 LOC) → \`installation\` variant

**Benefits:**
- ✅ Proper separation of concerns (data vs presentation)
- ✅ Parallel async processing at page level
- ✅ Storybook-compatible (no server dependencies)
- ✅ Testable in isolation
- ✅ Type-safe discriminated union
- ✅ ~401 LOC reduction (44%)
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UnifiedContentSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock pre-highlighted HTML for Storybook (simulates server-side rendering)
const MOCK_HIGHLIGHTED_CODE = `<pre class="overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm"><code style="display: block; background: transparent;"><span style="color: #c678dd;">const</span> <span style="color: #e06c75;">greeting</span> <span style="color: #abb2bf;">=</span> <span style="color: #98c379;">"Hello, World!"</span><span style="color: #abb2bf;">;</span>
<span style="color: #c678dd;">console</span><span style="color: #abb2bf;">.</span><span style="color: #61afef;">log</span><span style="color: #abb2bf;">(</span><span style="color: #e06c75;">greeting</span><span style="color: #abb2bf;">);</span></code></pre>`;

const MOCK_JSON_CONFIG = `<pre class="overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm"><code style="display: block; background: transparent;"><span style="color: #abb2bf;">{</span>
  <span style="color: #e06c75;">"name"</span><span style="color: #abb2bf;">:</span> <span style="color: #98c379;">"example-config"</span><span style="color: #abb2bf;">,</span>
  <span style="color: #e06c75;">"version"</span><span style="color: #abb2bf;">:</span> <span style="color: #98c379;">"1.0.0"</span>
<span style="color: #abb2bf;">}</span></code></pre>`;

/**
 * ==============================================================================
 * BULLETS VARIANT
 * ==============================================================================
 */

/**
 * Bullets - Features List
 */
export const BulletsFeatures: Story = {
  args: {
    variant: 'bullets',
    title: 'Features',
    description: 'Key capabilities and functionality',
    items: [
      'Type-safe configuration with Zod validation',
      'Server-side syntax highlighting with Shiki',
      'Automatic code language detection',
      'Mobile-optimized responsive layout',
      'SEO-friendly with structured data markup',
    ],
    icon: Zap,
    bulletColor: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Bullets variant with primary color - used for features, use cases, etc.',
      },
    },
  },
};

/**
 * Bullets - Requirements List (Orange)
 */
export const BulletsRequirements: Story = {
  args: {
    variant: 'bullets',
    title: 'Requirements',
    description: 'Prerequisites and dependencies',
    items: [
      'Node.js 18.0.0 or higher',
      'TypeScript 5.0 or higher',
      'React 18.0 or higher',
      'Next.js 14.0 or higher',
    ],
    icon: AlertTriangle,
    bulletColor: 'orange',
  },
  parameters: {
    docs: {
      description: {
        story: 'Bullets variant with orange color - used for requirements, warnings.',
      },
    },
  },
};

/**
 * Bullets - Mono Variant
 */
export const BulletsMono: Story = {
  args: {
    variant: 'bullets',
    title: 'Environment Variables',
    description: 'Required configuration keys',
    items: ['NEXT_PUBLIC_API_URL', 'DATABASE_URL', 'AUTH_SECRET', 'REDIS_URL'],
    icon: Settings,
    bulletColor: 'accent',
    textVariant: 'mono',
  },
  parameters: {
    docs: {
      description: {
        story: 'Bullets variant with monospace text - used for environment variables, config keys.',
      },
    },
  },
};

/**
 * ==============================================================================
 * CONTENT VARIANT
 * ==============================================================================
 */

/**
 * Content - Code Display
 */
export const ContentCode: Story = {
  args: {
    variant: 'content',
    title: 'Agent Content',
    description: 'The main content for this agent.',
    html: MOCK_HIGHLIGHTED_CODE,
    code: 'const greeting = "Hello, World!";\nconsole.log(greeting);',
    language: 'typescript',
    filename: 'example.ts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Content variant displaying code with pre-rendered syntax highlighting.',
      },
    },
  },
};

/**
 * ==============================================================================
 * CONFIGURATION VARIANT
 * ==============================================================================
 */

/**
 * Configuration - JSON Format
 */
export const ConfigurationJSON: Story = {
  args: {
    variant: 'configuration',
    format: 'json',
    html: MOCK_JSON_CONFIG,
    code: '{\n  "name": "example-config",\n  "version": "1.0.0"\n}',
    filename: 'config.json',
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration variant with JSON format - used for agents, rules, commands.',
      },
    },
  },
};

/**
 * Configuration - Multi Format (MCP Servers)
 */
export const ConfigurationMulti: Story = {
  args: {
    variant: 'configuration',
    format: 'multi',
    configs: [
      {
        key: 'claudeDesktop',
        html: MOCK_JSON_CONFIG,
        code: '{\n  "mcpServers": {\n    "example": {}\n  }\n}',
        filename: 'claude_desktop_config.json',
      },
      {
        key: 'claudeCode',
        html: MOCK_JSON_CONFIG,
        code: '{\n  "mcpServers": {\n    "example": {}\n  }\n}',
        filename: 'claude_code_config.json',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration variant with multi-format - used for MCP servers with multiple config files.',
      },
    },
  },
};

/**
 * Configuration - Hook Format
 */
export const ConfigurationHook: Story = {
  args: {
    variant: 'configuration',
    format: 'hook',
    hookConfig: {
      html: MOCK_JSON_CONFIG,
      code: '{\n  "hooks": {\n    "pre-commit": {}\n  }\n}',
      filename: 'hooks.json',
    },
    scriptContent: {
      html: `<pre class="overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm"><code>#!/bin/bash\necho "Running pre-commit hook"</code></pre>`,
      code: '#!/bin/bash\necho "Running pre-commit hook"',
      filename: 'pre-commit.sh',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration variant with hook format - used for hook configs with script content.',
      },
    },
  },
};

/**
 * ==============================================================================
 * USAGE EXAMPLES VARIANT
 * ==============================================================================
 */

/**
 * Usage Examples
 */
export const UsageExamples: Story = {
  args: {
    variant: 'examples',
    title: 'Usage Examples',
    description: 'Practical code examples demonstrating common use cases',
    examples: [
      {
        title: 'Basic Setup',
        description: 'Initialize the configuration with default settings',
        html: MOCK_HIGHLIGHTED_CODE,
        code: 'const config = createConfig();\nconsole.log(config);',
        language: 'typescript',
        filename: 'basic-setup.ts',
      },
      {
        title: 'Advanced Configuration',
        description: 'Customize settings for production use',
        html: MOCK_HIGHLIGHTED_CODE,
        code: 'const config = createConfig({\n  env: "production"\n});',
        language: 'typescript',
        filename: 'advanced-config.ts',
      },
    ],
    maxLines: 20,
    showLineNumbers: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Usage examples variant with multiple code snippets and schema.org markup.',
      },
    },
  },
};

/**
 * ==============================================================================
 * TROUBLESHOOTING VARIANT
 * ==============================================================================
 */

/**
 * Troubleshooting - Simple Strings
 */
export const TroubleshootingSimple: Story = {
  args: {
    variant: 'troubleshooting',
    description: 'Common issues and solutions',
    items: [
      'Clear your browser cache if changes are not reflecting',
      'Restart the development server after changing environment variables',
      'Check that all required dependencies are installed',
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Troubleshooting variant with simple string tips.',
      },
    },
  },
};

/**
 * Troubleshooting - Issue/Solution Pairs
 */
export const TroubleshootingDetailed: Story = {
  args: {
    variant: 'troubleshooting',
    description: 'Common issues and their solutions',
    items: [
      {
        issue: 'Module not found error',
        solution:
          'Run npm install to install missing dependencies. Ensure all imports are correct.',
      },
      {
        issue: 'Syntax highlighting not working',
        solution: 'Verify that Shiki is properly configured and all language grammars are loaded.',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Troubleshooting variant with structured issue/solution pairs.',
      },
    },
  },
};

/**
 * ==============================================================================
 * INSTALLATION VARIANT
 * ==============================================================================
 */

/**
 * Installation - Claude Code
 */
export const InstallationClaudeCode: Story = {
  args: {
    variant: 'installation',
    installation: {
      claudeCode: {
        steps: [
          'Open Claude Code settings',
          'Navigate to Extensions',
          'Add the configuration to your settings file',
        ],
        configPath: {
          macos: '~/.config/claude-code/config.json',
          linux: '~/.config/claude-code/config.json',
          windows: '%APPDATA%\\claude-code\\config.json',
        },
      },
      requirements: ['Claude Code version 1.0.0 or higher', 'Node.js 18+ for running scripts'],
    },
    item: {
      slug: 'example-hook',
      category: 'hooks' as const,
      description: 'Example hook',
      author: 'Example Team',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Installation variant for Claude Code setup.',
      },
    },
  },
};

/**
 * Installation - Claude Desktop (MCP)
 */
export const InstallationClaudeDesktop: Story = {
  args: {
    variant: 'installation',
    installation: {
      claudeDesktop: {
        steps: [
          'Open Claude Desktop settings',
          'Navigate to MCP Servers',
          'Add the configuration to your settings file',
          'Restart Claude Desktop',
        ],
        configPath: {
          macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
          linux: '~/.config/Claude/claude_desktop_config.json',
          windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
        },
      },
      requirements: [
        'Claude Desktop version 0.7.0 or higher',
        'Internet connection for server communication',
      ],
    },
    item: {
      slug: 'example-mcp',
      category: 'mcp' as const,
      description: 'Example MCP server',
      author: 'MCP Team',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Installation variant for Claude Desktop MCP server setup.',
      },
    },
  },
};

/**
 * ==============================================================================
 * VARIANT COMPARISON
 * ==============================================================================
 */

/**
 * All Variants Comparison
 */
export const AllVariantsComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Bullets Variant</h3>
        <UnifiedContentSection
          variant="bullets"
          title="Features"
          items={['Feature 1', 'Feature 2', 'Feature 3']}
          icon={Zap}
          bulletColor="primary"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Content Variant</h3>
        <UnifiedContentSection
          variant="content"
          title="Code Content"
          html={MOCK_HIGHLIGHTED_CODE}
          code={'const x = 1;'}
          language="typescript"
          filename="example.ts"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Configuration Variant (JSON)</h3>
        <UnifiedContentSection
          variant="configuration"
          format="json"
          html={MOCK_JSON_CONFIG}
          code={'{"key": "value"}'}
          filename="config.json"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Troubleshooting Variant</h3>
        <UnifiedContentSection
          variant="troubleshooting"
          description="Common issues"
          items={['Clear cache', 'Restart server']}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compare all major variants side-by-side.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Bullets Variant Test
 * Tests bullets variant renders title, description, and bullet points
 */
export const BulletsVariantTest: Story = {
  args: {
    variant: 'bullets',
    title: 'Test Bullets Section',
    description: 'Test description for bullets',
    bullets: [
      { text: 'Bullet point 1' },
      { text: 'Bullet point 2' },
      { text: 'Bullet point 3', icon: Zap },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests bullets variant displays title, description, and all bullet points.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify section title is displayed', async () => {
      const title = canvas.getByText(/test bullets section/i);
      await expect(title).toBeInTheDocument();
    });

    await step('Verify section description is displayed', async () => {
      const description = canvas.getByText(/test description for bullets/i);
      await expect(description).toBeInTheDocument();
    });

    await step('Verify all bullet points are displayed', async () => {
      const bullet1 = canvas.getByText(/bullet point 1/i);
      const bullet2 = canvas.getByText(/bullet point 2/i);
      const bullet3 = canvas.getByText(/bullet point 3/i);

      await expect(bullet1).toBeInTheDocument();
      await expect(bullet2).toBeInTheDocument();
      await expect(bullet3).toBeInTheDocument();
    });
  },
};

/**
 * Content Variant Test
 * Tests content variant renders title, description, and HTML content
 */
export const ContentVariantTest: Story = {
  args: {
    variant: 'content',
    title: 'Test Content Section',
    description: 'Test description for content',
    html: '<p>This is test HTML content.</p><p>Second paragraph.</p>',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests content variant displays title, description, and HTML content.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify section title is displayed', async () => {
      const title = canvas.getByText(/test content section/i);
      await expect(title).toBeInTheDocument();
    });

    await step('Verify section description is displayed', async () => {
      const description = canvas.getByText(/test description for content/i);
      await expect(description).toBeInTheDocument();
    });

    await step('Verify HTML content is rendered', async () => {
      const htmlContent = canvas.getByText(/this is test html content/i);
      await expect(htmlContent).toBeInTheDocument();
    });
  },
};

/**
 * Configuration Variant Test (JSON Format)
 * Tests configuration variant with JSON format
 */
export const ConfigurationJSONTest: Story = {
  args: {
    variant: 'configuration',
    format: 'json',
    html: '{"key": "value", "setting": "enabled"}',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests configuration variant displays JSON configuration.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify configuration content is displayed', async () => {
      // JSON should be rendered as code
      const config = canvasElement.querySelector('pre, code');
      await expect(config).toBeInTheDocument();
    });
  },
};

/**
 * Examples Variant Test
 * Tests examples variant renders title and example items
 */
export const ExamplesVariantTest: Story = {
  args: {
    variant: 'examples',
    title: 'Test Examples',
    description: 'Example usage scenarios',
    examples: [
      { title: 'Example 1', code: 'console.log("test 1")' },
      { title: 'Example 2', code: 'console.log("test 2")' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests examples variant displays title and code examples.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify section title is displayed', async () => {
      const title = canvas.getByText(/test examples/i);
      await expect(title).toBeInTheDocument();
    });

    await step('Verify example titles are displayed', async () => {
      const example1 = canvas.getByText(/example 1/i);
      const example2 = canvas.getByText(/example 2/i);

      await expect(example1).toBeInTheDocument();
      await expect(example2).toBeInTheDocument();
    });
  },
};

/**
 * Section Icon Test
 * Tests section with custom icon
 */
export const SectionIconTest: Story = {
  args: {
    variant: 'bullets',
    title: 'Section with Icon',
    description: 'Testing icon display',
    icon: Settings,
    bullets: [{ text: 'Test bullet' }],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests section displays custom icon alongside title.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify section title is displayed', async () => {
      const title = canvas.getByText(/section with icon/i);
      await expect(title).toBeInTheDocument();
    });

    await step('Verify icon is rendered', async () => {
      // Icon should be an SVG element
      const icons = canvasElement.querySelectorAll('svg');
      await expect(icons.length).toBeGreaterThan(0);
    });
  },
};
