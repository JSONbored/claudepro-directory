import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { UnifiedContentBlock } from '@/src/components/content/unified-content-block';

/**
 * UnifiedContentBlock Storybook Stories
 *
 * **Consolidated content display component** - Eliminates 6 separate components (447 LOC → 200 LOC).
 *
 * **Architecture:**
 * - Discriminated union with 'variant' prop
 * - NO wrappers, NO backward compatibility layers
 * - Type-safe with Zod validation
 * - Consistent Schema.org markup across all variants
 * - Shared UI patterns (Card, UnifiedBadge, Tabs)
 *
 * **Consolidates:**
 * - CaseStudy (100 LOC) - Business case studies
 * - FeatureGrid (95 LOC) - Feature showcase grids
 * - TLDRSummary (51 LOC) - Opening summaries
 * - ExpertQuote (55 LOC) - Expert quotes with attribution
 * - QuickReference (73 LOC) - Reference tables
 * - ContentTabs (73 LOC) - Tabbed content organization
 *
 * **Impact:** 247 LOC reduction (55%)
 *
 * **Usage:**
 * ```tsx
 * // Case Study
 * <UnifiedContentBlock
 *   variant="case-study"
 *   company="Acme Corp"
 *   challenge="Challenge description"
 *   solution="Solution description"
 *   results="Results achieved"
 * />
 *
 * // Feature Grid
 * <UnifiedContentBlock
 *   variant="feature-grid"
 *   features={[{ title: "...", description: "..." }]}
 *   title="Key Features"
 * />
 * ```
 */

const meta = {
  title: 'Content/UnifiedContentBlock',
  component: UnifiedContentBlock,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Unified Content Block Component** - Single source of truth for all content display patterns.

**Consolidation Impact:**
- Eliminates 6 separate components (447 LOC)
- Reduces to ~200 LOC (55% reduction)
- Single component to maintain
- Consistent theming across all content blocks
- Shared schema validation
- Centralized accessibility rules

**Variants:**
- \`case-study\`: Business case studies with metrics and testimonials
- \`feature-grid\`: Feature showcase grids (2/3/4 columns)
- \`tldr\`: Opening summaries with key takeaways
- \`expert-quote\`: Expert quotes with author attribution
- \`quick-reference\`: Reference tables for commands/shortcuts
- \`content-tabs\`: Tabbed content organization

**Used In:**
- MDX content files (27+ files use FeatureGrid, 23+ use ContentTabs, 17+ use QuickReference)
- Technical documentation
- Marketing content
- Tutorial guides
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'case-study',
        'feature-grid',
        'tldr',
        'expert-quote',
        'quick-reference',
        'content-tabs',
      ],
      description: 'Content display variant',
    },
  },
} satisfies Meta<typeof UnifiedContentBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// STORY 1: CASE STUDY VARIANT
// ============================================================================

export const CaseStudy: Story = {
  args: {
    variant: 'case-study',
    company: 'TechCorp Solutions',
    industry: 'SaaS',
    challenge:
      'TechCorp struggled with inefficient code reviews, taking 3-5 days per PR and missing critical issues. Developer productivity was declining, and technical debt was accumulating.',
    solution:
      'Implemented Claude Code for automated code review, configured with company-specific rules and coding standards. Integrated with GitHub Actions for seamless PR workflow.',
    results:
      'Reduced code review time by 70%, caught 95% of common issues automatically, and improved developer satisfaction scores by 40%. Technical debt accumulation decreased by 60%.',
    metrics: [
      { label: 'Review Time', value: '4hrs', trend: 'down' },
      { label: 'Issues Caught', value: '95%', trend: 'up' },
      { label: 'Developer Satisfaction', value: '+40%', trend: 'up' },
    ],
    testimonial: {
      quote:
        'Claude Code transformed our development workflow. What used to take days now takes hours, and code quality has never been better.',
      author: 'Sarah Chen',
      role: 'VP of Engineering',
    },
  },
};

// ============================================================================
// STORY 2: FEATURE GRID VARIANT (2 COLUMNS)
// ============================================================================

export const FeatureGrid2Columns: Story = {
  args: {
    variant: 'feature-grid',
    title: 'Key Features',
    description: 'Powerful capabilities that set Claude Code apart',
    columns: 2,
    features: [
      {
        title: 'Intelligent Code Review',
        description:
          'AI-powered analysis that understands context, patterns, and best practices specific to your codebase.',
        badge: 'Core',
      },
      {
        title: 'Custom Rules Engine',
        description:
          'Define your own coding standards and conventions. Claude Code enforces them consistently across all PRs.',
        badge: 'Pro',
      },
      {
        title: 'Multi-Language Support',
        description:
          'Works with TypeScript, Python, Go, Rust, and 20+ other languages. Understands framework-specific patterns.',
      },
      {
        title: 'GitHub Integration',
        description:
          'Seamlessly integrates with GitHub Actions. Automatic PR comments, inline suggestions, and status checks.',
        badge: 'Popular',
      },
    ],
  },
};

// ============================================================================
// STORY 3: FEATURE GRID VARIANT (3 COLUMNS)
// ============================================================================

export const FeatureGrid3Columns: Story = {
  args: {
    variant: 'feature-grid',
    title: 'Advanced Capabilities',
    description: 'Enterprise-grade features for large teams',
    columns: 3,
    features: [
      {
        title: 'Security Scanning',
        description:
          'Detect vulnerabilities, secrets, and security anti-patterns before they reach production.',
        badge: 'Security',
      },
      {
        title: 'Performance Analysis',
        description:
          'Identify performance bottlenecks, inefficient algorithms, and optimization opportunities.',
        badge: 'Performance',
      },
      {
        title: 'Dependency Management',
        description:
          'Track outdated packages, security advisories, and breaking changes in dependencies.',
      },
      {
        title: 'Test Coverage',
        description:
          'Analyze test coverage, suggest missing test cases, and identify untested code paths.',
      },
      {
        title: 'Documentation Lint',
        description: 'Ensure code is well-documented with JSDoc, docstrings, and inline comments.',
      },
      {
        title: 'Team Analytics',
        description:
          'Track code quality metrics, review velocity, and team productivity over time.',
        badge: 'Enterprise',
      },
    ],
  },
};

// ============================================================================
// STORY 4: TLDR VARIANT
// ============================================================================

export const TLDR: Story = {
  args: {
    variant: 'tldr',
    title: 'TL;DR',
    content:
      'Claude Code is an AI-powered code review assistant that integrates with your GitHub workflow. It analyzes pull requests, enforces coding standards, catches bugs, and provides intelligent suggestions - reducing review time by 70% while improving code quality.',
    keyPoints: [
      'Automated code review with AI-powered analysis',
      'Custom rules engine for team-specific standards',
      'Seamless GitHub integration with PR comments',
      'Multi-language support (20+ languages)',
      'Security scanning and vulnerability detection',
    ],
  },
};

// ============================================================================
// STORY 5: EXPERT QUOTE VARIANT (WITH IMAGE)
// ============================================================================

export const ExpertQuoteWithImage: Story = {
  args: {
    variant: 'expert-quote',
    quote:
      "Claude Code represents a paradigm shift in how we think about code review. It's not replacing human reviewers - it's augmenting them, handling the tedious checks so engineers can focus on architecture and design decisions.",
    author: 'Dr. Emily Rodriguez',
    role: 'Director of Engineering',
    company: 'GitHub',
    imageUrl: 'https://i.pravatar.cc/150?img=5',
  },
};

// ============================================================================
// STORY 6: EXPERT QUOTE VARIANT (NO IMAGE)
// ============================================================================

export const ExpertQuoteWithoutImage: Story = {
  args: {
    variant: 'expert-quote',
    quote:
      'The ROI of Claude Code was immediate. Within the first week, it caught three critical bugs that would have made it to production. The tool has paid for itself many times over.',
    author: 'Marcus Thompson',
    role: 'CTO',
    company: 'DataStream Inc',
  },
};

// ============================================================================
// STORY 7: QUICK REFERENCE VARIANT (1 COLUMN)
// ============================================================================

export const QuickReference1Column: Story = {
  args: {
    variant: 'quick-reference',
    title: 'Quick Reference: Common Commands',
    description: 'Essential Claude Code CLI commands',
    columns: 1,
    items: [
      {
        label: 'claude-code review',
        value: 'Review current branch',
        description: 'Analyzes all changes in the current branch and provides feedback',
      },
      {
        label: 'claude-code config',
        value: 'Manage configuration',
        description: 'View and edit Claude Code configuration settings',
      },
      {
        label: 'claude-code rules add',
        value: 'Add custom rule',
        description: 'Define a new custom linting or review rule',
      },
      {
        label: 'claude-code status',
        value: 'Check system status',
        description: 'View API quota, active rules, and integration status',
      },
    ],
  },
};

// ============================================================================
// STORY 8: QUICK REFERENCE VARIANT (2 COLUMNS)
// ============================================================================

export const QuickReference2Columns: Story = {
  args: {
    variant: 'quick-reference',
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow with these shortcuts',
    columns: 2,
    items: [
      {
        label: 'Cmd + K',
        value: 'Open command palette',
        description: 'Access all Claude Code commands',
      },
      {
        label: 'Cmd + Shift + R',
        value: 'Start review',
        description: 'Begin reviewing current file',
      },
      { label: 'Cmd + .', value: 'Quick fix', description: 'Apply suggested fix at cursor' },
      { label: 'Cmd + /', value: 'Toggle comment', description: 'Add or remove comment' },
      {
        label: 'Cmd + Shift + F',
        value: 'Format document',
        description: 'Auto-format current file',
      },
      {
        label: 'Cmd + Shift + E',
        value: 'Explain code',
        description: 'Get AI explanation of selection',
      },
    ],
  },
};

// ============================================================================
// STORY 9: CONTENT TABS VARIANT
// ============================================================================

export const ContentTabs: Story = {
  args: {
    variant: 'content-tabs',
    title: 'Installation Methods',
    description: 'Choose the installation method that works best for your environment',
    items: [
      {
        value: 'npm',
        label: 'npm',
        content: (
          <div>
            <p className="mb-2">Install Claude Code using npm:</p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>npm install -g @anthropic/claude-code</code>
            </pre>
            <p className="mt-4 text-sm text-muted-foreground">
              Requires Node.js 18+ and npm 9+. Works on macOS, Linux, and Windows.
            </p>
          </div>
        ),
      },
      {
        value: 'yarn',
        label: 'Yarn',
        content: (
          <div>
            <p className="mb-2">Install Claude Code using Yarn:</p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>yarn global add @anthropic/claude-code</code>
            </pre>
            <p className="mt-4 text-sm text-muted-foreground">
              Requires Node.js 18+ and Yarn 1.22+. Recommended for monorepo projects.
            </p>
          </div>
        ),
      },
      {
        value: 'brew',
        label: 'Homebrew',
        content: (
          <div>
            <p className="mb-2">Install Claude Code using Homebrew (macOS/Linux):</p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>brew install anthropic/tap/claude-code</code>
            </pre>
            <p className="mt-4 text-sm text-muted-foreground">
              Easiest installation method for macOS users. Automatic updates via brew upgrade.
            </p>
          </div>
        ),
      },
      {
        value: 'docker',
        label: 'Docker',
        content: (
          <div>
            <p className="mb-2">Run Claude Code in a Docker container:</p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>
                docker pull anthropic/claude-code:latest{'\n'}docker run -it anthropic/claude-code
              </code>
            </pre>
            <p className="mt-4 text-sm text-muted-foreground">
              Isolated environment with all dependencies included. Perfect for CI/CD pipelines.
            </p>
          </div>
        ),
      },
    ],
  },
};

// ============================================================================
// STORY 10: ALL VARIANTS SHOWCASE
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">Case Study Variant</h2>
        <UnifiedContentBlock
          variant="case-study"
          company="Example Corp"
          challenge="The challenge description"
          solution="The solution implemented"
          results="The results achieved"
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Feature Grid Variant</h2>
        <UnifiedContentBlock
          variant="feature-grid"
          title="Features"
          columns={2}
          features={[
            { title: 'Feature 1', description: 'Description 1' },
            { title: 'Feature 2', description: 'Description 2' },
          ]}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">TLDR Variant</h2>
        <UnifiedContentBlock
          variant="tldr"
          content="Summary content"
          keyPoints={['Point 1', 'Point 2', 'Point 3']}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Expert Quote Variant</h2>
        <UnifiedContentBlock
          variant="expert-quote"
          quote="An insightful quote about the product"
          author="Expert Name"
          role="Title"
          company="Company"
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Reference Variant</h2>
        <UnifiedContentBlock
          variant="quick-reference"
          title="Reference"
          columns={1}
          items={[
            { label: 'Command 1', value: 'Description 1' },
            { label: 'Command 2', value: 'Description 2' },
          ]}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Content Tabs Variant</h2>
        <UnifiedContentBlock
          variant="content-tabs"
          items={[
            { value: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
            { value: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
          ]}
        />
      </div>
    </div>
  ),
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Case Study Variant Test
 * Tests case study variant renders all sections correctly
 */
export const CaseStudyVariantTest: Story = {
  args: {
    variant: 'case-study',
    company: 'Test Company',
    industry: 'Technology',
    challenge: 'Challenge description for testing',
    solution: 'Solution description for testing',
    results: 'Results achieved for testing',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests case study variant displays company, challenge, solution, and results.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify company name is displayed', async () => {
      const company = canvas.getByText(/test company/i);
      await expect(company).toBeInTheDocument();
    });

    await step('Verify challenge section is displayed', async () => {
      const challenge = canvas.getByText(/challenge description/i);
      await expect(challenge).toBeInTheDocument();
    });

    await step('Verify solution section is displayed', async () => {
      const solution = canvas.getByText(/solution description/i);
      await expect(solution).toBeInTheDocument();
    });

    await step('Verify results section is displayed', async () => {
      const results = canvas.getByText(/results achieved/i);
      await expect(results).toBeInTheDocument();
    });
  },
};

/**
 * Feature Grid Variant Test
 * Tests feature grid variant renders features correctly
 */
export const FeatureGridVariantTest: Story = {
  args: {
    variant: 'feature-grid',
    title: 'Test Features',
    features: [
      { title: 'Feature 1', description: 'Description 1', icon: 'Check' },
      { title: 'Feature 2', description: 'Description 2', icon: 'Star' },
      { title: 'Feature 3', description: 'Description 3', icon: 'Zap' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests feature grid variant displays title and feature cards.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify grid title is displayed', async () => {
      const title = canvas.getByText(/test features/i);
      await expect(title).toBeInTheDocument();
    });

    await step('Verify all feature titles are displayed', async () => {
      const feature1 = canvas.getByText(/feature 1/i);
      const feature2 = canvas.getByText(/feature 2/i);
      const feature3 = canvas.getByText(/feature 3/i);

      await expect(feature1).toBeInTheDocument();
      await expect(feature2).toBeInTheDocument();
      await expect(feature3).toBeInTheDocument();
    });

    await step('Verify feature descriptions are displayed', async () => {
      const desc1 = canvas.getByText(/description 1/i);
      const desc2 = canvas.getByText(/description 2/i);
      const desc3 = canvas.getByText(/description 3/i);

      await expect(desc1).toBeInTheDocument();
      await expect(desc2).toBeInTheDocument();
      await expect(desc3).toBeInTheDocument();
    });
  },
};

/**
 * TLDR Variant Test
 * Tests TLDR variant renders summary and key points
 */
export const TLDRVariantTest: Story = {
  args: {
    variant: 'tldr',
    summary: 'Test summary content for quick overview',
    keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests TLDR variant displays summary and key takeaways.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify summary is displayed', async () => {
      const summary = canvas.getByText(/test summary content/i);
      await expect(summary).toBeInTheDocument();
    });

    await step('Verify all key points are displayed', async () => {
      const point1 = canvas.getByText(/key point 1/i);
      const point2 = canvas.getByText(/key point 2/i);
      const point3 = canvas.getByText(/key point 3/i);

      await expect(point1).toBeInTheDocument();
      await expect(point2).toBeInTheDocument();
      await expect(point3).toBeInTheDocument();
    });
  },
};

/**
 * Expert Quote Variant Test
 * Tests expert quote variant renders quote and attribution
 */
export const ExpertQuoteVariantTest: Story = {
  args: {
    variant: 'expert-quote',
    quote: 'This is a test expert quote for validation',
    author: 'Test Author',
    role: 'Senior Engineer',
    company: 'Test Corp',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests expert quote variant displays quote, author, role, and company.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify quote text is displayed', async () => {
      const quote = canvas.getByText(/this is a test expert quote/i);
      await expect(quote).toBeInTheDocument();
    });

    await step('Verify author name is displayed', async () => {
      const author = canvas.getByText(/test author/i);
      await expect(author).toBeInTheDocument();
    });

    await step('Verify role is displayed', async () => {
      const role = canvas.getByText(/senior engineer/i);
      await expect(role).toBeInTheDocument();
    });

    await step('Verify company is displayed', async () => {
      const company = canvas.getByText(/test corp/i);
      await expect(company).toBeInTheDocument();
    });
  },
};

/**
 * Quick Reference Variant Test
 * Tests quick reference variant renders reference table
 */
export const QuickReferenceVariantTest: Story = {
  args: {
    variant: 'quick-reference',
    title: 'Test Commands',
    items: [
      { label: 'Command 1', description: 'Description 1' },
      { label: 'Command 2', description: 'Description 2' },
      { label: 'Command 3', description: 'Description 3' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests quick reference variant displays reference table with labels and descriptions.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify reference title is displayed', async () => {
      const title = canvas.getByText(/test commands/i);
      await expect(title).toBeInTheDocument();
    });

    await step('Verify all command labels are displayed', async () => {
      const cmd1 = canvas.getByText(/command 1/i);
      const cmd2 = canvas.getByText(/command 2/i);
      const cmd3 = canvas.getByText(/command 3/i);

      await expect(cmd1).toBeInTheDocument();
      await expect(cmd2).toBeInTheDocument();
      await expect(cmd3).toBeInTheDocument();
    });

    await step('Verify all descriptions are displayed', async () => {
      const desc1 = canvas.getByText(/description 1/i);
      const desc2 = canvas.getByText(/description 2/i);
      const desc3 = canvas.getByText(/description 3/i);

      await expect(desc1).toBeInTheDocument();
      await expect(desc2).toBeInTheDocument();
      await expect(desc3).toBeInTheDocument();
    });
  },
};

/**
 * Content Tabs Variant Test
 * Tests content tabs variant renders tabs and content
 */
export const ContentTabsVariantTest: Story = {
  args: {
    variant: 'content-tabs',
    tabs: [
      { value: 'tab1', label: 'Tab 1', content: <div>Tab 1 Content</div> },
      { value: 'tab2', label: 'Tab 2', content: <div>Tab 2 Content</div> },
      { value: 'tab3', label: 'Tab 3', content: <div>Tab 3 Content</div> },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests content tabs variant displays tab labels and tab content switching.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify all tab labels are displayed', async () => {
      const tab1 = canvas.getByRole('tab', { name: /tab 1/i });
      const tab2 = canvas.getByRole('tab', { name: /tab 2/i });
      const tab3 = canvas.getByRole('tab', { name: /tab 3/i });

      await expect(tab1).toBeInTheDocument();
      await expect(tab2).toBeInTheDocument();
      await expect(tab3).toBeInTheDocument();
    });

    await step('Verify initial tab content is displayed', async () => {
      // First tab should be active by default
      const content = canvas.getByText(/tab 1 content/i);
      await expect(content).toBeInTheDocument();
    });

    await step('Click Tab 2 to switch content', async () => {
      const tab2 = canvas.getByRole('tab', { name: /tab 2/i });
      await userEvent.click(tab2);
    });

    await step('Verify Tab 2 content is displayed after click', async () => {
      const content = canvas.getByText(/tab 2 content/i);
      await expect(content).toBeInTheDocument();
    });
  },
};
