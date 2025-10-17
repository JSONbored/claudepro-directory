import type { Meta, StoryObj } from '@storybook/react';
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
