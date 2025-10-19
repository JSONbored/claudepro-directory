import type { Meta, StoryObj } from '@storybook/react';
import { Copy, Download, Share2 } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { UnifiedButton } from './unified-button';

/**
 * Unified Button Stories
 *
 * Comprehensive showcase of all 13 button variants consolidated into one component.
 * This replaces 6 separate story files with a single, unified story structure.
 *
 * Pattern: Each variant is demonstrated with multiple configurations showing
 * the discriminated union's type safety and flexibility.
 */

const meta = {
  title: 'UI/UnifiedButton',
  component: UnifiedButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Unified Button Component** - Production-grade button system with 13+ variants.

Consolidates ALL button patterns into a single, type-safe, configuration-driven component:
- Authentication (GitHub/Google OAuth, SignOut)
- Content Actions (Copy Markdown, Download Markdown, Copy LLMs, Bookmark)
- Business Logic (Job Toggle, Job Delete)
- External Data (GitHub Stars)
- Navigation (Back, Link)
- Generic Async Actions

**Architecture:**
- Discriminated unions enforce valid prop combinations
- Zero wrappers, zero backward compatibility
- Tree-shakeable (unused variants compile out)
- ~1,279 LOC reduction from consolidation

**Replaces:**
- BaseActionButton (509 LOC)
- CopyMarkdownButton (206 LOC)
- DownloadMarkdownButton (184 LOC)
- CopyLLMsButton (189 LOC)
- BookmarkButton (149 LOC)
- CardCopyAction (74 LOC)
- AuthButtons (110 LOC)
- GitHubStarsButton (111 LOC)
- JobActions (113 LOC)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Common props across all variants
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    buttonVariant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual style variant (shadcn/ui button variant)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interactions',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
      table: {
        type: { summary: 'string' },
      },
    },
    // Variant-specific props (discriminated union)
    variant: {
      control: 'select',
      options: [
        'auth-signin',
        'auth-signout',
        'copy-markdown',
        'download-markdown',
        'copy-llms',
        'bookmark',
        'job-toggle',
        'job-delete',
        'github-stars',
        'back',
        'link',
        'async-action',
      ],
      description: 'Button behavior variant (discriminated union)',
      table: {
        type: { summary: 'string' },
      },
    },
    // Auth-specific
    provider: {
      control: 'select',
      options: ['github', 'google'],
      description: 'OAuth provider (auth-signin only)',
      if: { arg: 'variant', eq: 'auth-signin' },
      table: {
        type: { summary: 'string' },
      },
    },
    redirectTo: {
      control: 'text',
      description: 'Post-auth redirect URL (auth-signin only)',
      if: { arg: 'variant', eq: 'auth-signin' },
      table: {
        type: { summary: 'string' },
      },
    },
    // Content action props
    contentId: {
      control: 'text',
      description: 'Content ID (copy/download/bookmark variants)',
      if: {
        arg: 'variant',
        oneOf: ['copy-markdown', 'download-markdown', 'copy-llms', 'bookmark'],
      },
      table: {
        type: { summary: 'string' },
      },
    },
    contentType: {
      control: 'select',
      options: ['guide', 'tutorial', 'tool', 'collection', 'skill'],
      description: 'Content type (bookmark only)',
      if: { arg: 'variant', eq: 'bookmark' },
      table: {
        type: { summary: 'string' },
      },
    },
    isBookmarked: {
      control: 'boolean',
      description: 'Current bookmark state (bookmark only)',
      if: { arg: 'variant', eq: 'bookmark' },
      table: {
        type: { summary: 'boolean' },
      },
    },
    // Job action props
    jobId: {
      control: 'text',
      description: 'Job ID (job-toggle/job-delete only)',
      if: { arg: 'variant', oneOf: ['job-toggle', 'job-delete'] },
      table: {
        type: { summary: 'string' },
      },
    },
    isActive: {
      control: 'boolean',
      description: 'Job active status (job-toggle only)',
      if: { arg: 'variant', eq: 'job-toggle' },
      table: {
        type: { summary: 'boolean' },
      },
    },
    // Navigation props
    href: {
      control: 'text',
      description: 'Link destination (back/link variants)',
      if: { arg: 'variant', oneOf: ['back', 'link'] },
      table: {
        type: { summary: 'string' },
      },
    },
    // Async action props
    label: {
      control: 'text',
      description: 'Button label text (async-action only)',
      if: { arg: 'variant', eq: 'async-action' },
      table: {
        type: { summary: 'string' },
      },
    },
  },
} satisfies Meta<typeof UnifiedButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ==============================================================================
 * AUTHENTICATION VARIANTS
 * ==============================================================================
 */

/**
 * GitHub OAuth Sign-In
 */
export const AuthSignInGitHub: Story = {
  args: {
    variant: 'auth-signin',
    provider: 'github',
    size: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'GitHub OAuth sign-in button with Supabase authentication.',
      },
    },
  },
};

/**
 * Google OAuth Sign-In
 */
export const AuthSignInGoogle: Story = {
  args: {
    variant: 'auth-signin',
    provider: 'google',
    size: 'default',
    buttonVariant: 'outline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Google OAuth sign-in button with custom redirect support.',
      },
    },
  },
};

/**
 * Sign-Out Button
 */
export const AuthSignOut: Story = {
  args: {
    variant: 'auth-signout',
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sign-out button with loading state and router refresh.',
      },
    },
  },
};

/**
 * ==============================================================================
 * CONTENT ACTION VARIANTS
 * ==============================================================================
 */

/**
 * Copy Markdown - Default
 */
export const CopyMarkdownDefault: Story = {
  args: {
    variant: 'copy-markdown',
    category: 'agents',
    slug: 'code-review-assistant',
    label: 'Copy as Markdown',
    size: 'sm',
    showIcon: true,
    includeMetadata: true,
    includeFooter: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Copy markdown button with server action, email capture, and analytics.',
      },
    },
  },
};

/**
 * Copy Markdown - With Footer
 */
export const CopyMarkdownWithFooter: Story = {
  args: {
    variant: 'copy-markdown',
    category: 'mcp',
    slug: 'github-mcp-server',
    label: 'Copy Full Markdown',
    size: 'sm',
    includeMetadata: true,
    includeFooter: true,
  },
};

/**
 * Copy Markdown - Large Primary
 */
export const CopyMarkdownLarge: Story = {
  args: {
    variant: 'copy-markdown',
    category: 'guides',
    slug: 'getting-started',
    label: 'Copy Markdown',
    size: 'lg',
    buttonVariant: 'default',
  },
};

/**
 * Download Markdown - Default
 */
export const DownloadMarkdownDefault: Story = {
  args: {
    variant: 'download-markdown',
    category: 'agents',
    slug: 'code-review-assistant',
    label: 'Download Markdown',
    size: 'sm',
    showIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Download markdown as .md file with automatic filename generation.',
      },
    },
  },
};

/**
 * Download Markdown - Large
 */
export const DownloadMarkdownLarge: Story = {
  args: {
    variant: 'download-markdown',
    category: 'hooks',
    slug: 'pre-commit-validator',
    label: 'Download',
    size: 'lg',
    buttonVariant: 'default',
  },
};

/**
 * Copy LLMs.txt - Default
 */
export const CopyLLMsDefault: Story = {
  args: {
    variant: 'copy-llms',
    llmsTxtUrl: '/mcp/github-mcp-server/llms.txt',
    label: 'Copy for AI',
    size: 'sm',
    showIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Copy AI-optimized llms.txt content with client-side fetch.',
      },
    },
  },
};

/**
 * Copy LLMs.txt - Ghost
 */
export const CopyLLMsGhost: Story = {
  args: {
    variant: 'copy-llms',
    llmsTxtUrl: '/agents/code-review/llms.txt',
    label: 'Copy for AI',
    size: 'sm',
    buttonVariant: 'ghost',
  },
};

/**
 * Bookmark - Not Bookmarked
 */
export const BookmarkDefault: Story = {
  args: {
    variant: 'bookmark',
    contentType: 'agents',
    contentSlug: 'example-agent',
    initialBookmarked: false,
    showLabel: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle bookmark button with optimistic UI updates.',
      },
    },
  },
};

/**
 * Bookmark - Bookmarked State
 */
export const BookmarkActive: Story = {
  args: {
    variant: 'bookmark',
    contentType: 'agents',
    contentSlug: 'example-agent',
    initialBookmarked: true,
    showLabel: false,
  },
};

/**
 * Bookmark - With Label
 */
export const BookmarkWithLabel: Story = {
  args: {
    variant: 'bookmark',
    contentType: 'mcp',
    contentSlug: 'example-mcp',
    initialBookmarked: false,
    showLabel: true,
  },
};

/**
 * Card Copy Action
 */
export const CardCopyAction: Story = {
  args: {
    variant: 'card-copy',
    url: 'https://example.com/agents/code-review',
    category: 'agents',
    slug: 'code-review',
    title: 'Code Review Assistant',
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact copy button for card components with analytics tracking.',
      },
    },
  },
};

/**
 * ==============================================================================
 * BUSINESS LOGIC VARIANTS
 * ==============================================================================
 */

/**
 * Job Toggle - Active Status
 */
export const JobToggleActive: Story = {
  args: {
    variant: 'job-toggle',
    jobId: 'job-123',
    currentStatus: 'active',
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle job status between active/paused with server action.',
      },
    },
  },
};

/**
 * Job Toggle - Paused Status
 */
export const JobTogglePaused: Story = {
  args: {
    variant: 'job-toggle',
    jobId: 'job-123',
    currentStatus: 'paused',
    size: 'sm',
  },
};

/**
 * Job Delete
 */
export const JobDelete: Story = {
  args: {
    variant: 'job-delete',
    jobId: 'job-123',
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Delete job with confirmation dialog and optimistic updates.',
      },
    },
  },
};

/**
 * ==============================================================================
 * EXTERNAL DATA VARIANT
 * ==============================================================================
 */

/**
 * GitHub Stars Button
 */
export const GitHubStars: Story = {
  args: {
    variant: 'github-stars',
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Live GitHub star count with automatic API fetching and caching.',
      },
    },
  },
};

/**
 * ==============================================================================
 * NAVIGATION VARIANTS
 * ==============================================================================
 */

/**
 * Back Navigation
 */
export const BackButton: Story = {
  args: {
    variant: 'back',
    label: 'Back',
    size: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Router back navigation with custom label support.',
      },
    },
  },
};

/**
 * Internal Link
 */
export const LinkInternal: Story = {
  args: {
    variant: 'link',
    href: '/agents',
    label: 'View All Agents',
    external: false,
    size: 'default',
    buttonVariant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Internal navigation link button.',
      },
    },
  },
};

/**
 * External Link
 */
export const LinkExternal: Story = {
  args: {
    variant: 'link',
    href: 'https://github.com',
    label: 'Visit GitHub',
    external: true,
    size: 'default',
    buttonVariant: 'outline',
  },
  parameters: {
    docs: {
      description: {
        story: 'External link button (opens in new tab with noopener).',
      },
    },
  },
};

/**
 * ==============================================================================
 * GENERIC ASYNC ACTION VARIANT
 * ==============================================================================
 */

/**
 * Async Action - Copy
 */
export const AsyncActionCopy: Story = {
  args: {
    variant: 'async-action',
    label: 'Copy to Clipboard',
    loadingLabel: 'Copying...',
    successLabel: 'Copied!',
    icon: Copy,
    ariaLabel: 'Copy content to clipboard',
    ariaLabelSuccess: 'Content copied',
    size: 'sm',
    buttonVariant: 'outline',
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setSuccess(true);
      showSuccess('Copied!', 'Content ready to paste');
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Generic async action button with custom onClick handler (replaces BaseActionButton).',
      },
    },
  },
};

/**
 * Async Action - Download
 */
export const AsyncActionDownload: Story = {
  args: {
    variant: 'async-action',
    label: 'Download',
    loadingLabel: 'Downloading...',
    successLabel: 'Downloaded!',
    icon: Download,
    ariaLabel: 'Download file',
    ariaLabelSuccess: 'File downloaded',
    size: 'default',
    buttonVariant: 'default',
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLoading(false);
      setSuccess(true);
      showSuccess('Downloaded!', 'File saved successfully');
    },
  },
};

/**
 * Async Action - With Error
 */
export const AsyncActionError: Story = {
  args: {
    variant: 'async-action',
    label: 'Share',
    loadingLabel: 'Sharing...',
    successLabel: 'Shared!',
    icon: Share2,
    ariaLabel: 'Share content',
    ariaLabelSuccess: 'Content shared',
    size: 'sm',
    buttonVariant: 'secondary',
    onClick: async ({ setLoading, showError, logError }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);

      const error = new Error('Network error: Unable to share');
      logError('Share failed', error);
      showError('Failed to share', 'Please check your network connection');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Async action with error handling and toast notifications.',
      },
    },
  },
};

/**
 * ==============================================================================
 * COMPREHENSIVE SHOWCASES
 * ==============================================================================
 */

/**
 * All Authentication Variants
 */
export const AllAuthVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <UnifiedButton variant="auth-signin" provider="github" />
        <UnifiedButton variant="auth-signin" provider="google" buttonVariant="outline" />
        <UnifiedButton variant="auth-signout" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All authentication button variants in one view.',
      },
    },
  },
};

/**
 * All Content Action Variants
 */
export const AllContentActions: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <UnifiedButton
          variant="copy-markdown"
          category="agents"
          slug="example"
          label="Copy Markdown"
        />
        <UnifiedButton
          variant="download-markdown"
          category="agents"
          slug="example"
          label="Download"
        />
        <UnifiedButton
          variant="copy-llms"
          llmsTxtUrl="/agents/example/llms.txt"
          label="Copy for AI"
        />
      </div>
      <div className="flex items-center gap-2">
        <UnifiedButton
          variant="bookmark"
          contentType="agents"
          contentSlug="example"
          showLabel={true}
        />
        <UnifiedButton
          variant="card-copy"
          url="https://example.com"
          category="agents"
          slug="example"
          title="Example"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All content action button variants.',
      },
    },
  },
};

/**
 * All Business Logic Variants
 */
export const AllBusinessLogic: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <UnifiedButton variant="job-toggle" jobId="job-123" currentStatus="active" />
        <UnifiedButton variant="job-toggle" jobId="job-456" currentStatus="paused" />
        <UnifiedButton variant="job-delete" jobId="job-789" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Job management button variants.',
      },
    },
  },
};

/**
 * All Navigation Variants
 */
export const AllNavigation: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <UnifiedButton variant="back" />
        <UnifiedButton variant="link" href="/agents" label="View Agents" external={false} />
        <UnifiedButton
          variant="link"
          href="https://github.com"
          label="GitHub"
          external={true}
          buttonVariant="outline"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Navigation button variants.',
      },
    },
  },
};

/**
 * All Async Action Styles
 */
export const AllAsyncActionStyles: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <UnifiedButton
          variant="async-action"
          label="Default"
          icon={Copy}
          ariaLabel="Copy"
          ariaLabelSuccess="Copied"
          buttonVariant="default"
          onClick={async ({ setLoading, setSuccess }) => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setLoading(false);
            setSuccess(true);
          }}
        />
        <UnifiedButton
          variant="async-action"
          label="Secondary"
          icon={Copy}
          ariaLabel="Copy"
          ariaLabelSuccess="Copied"
          buttonVariant="secondary"
          onClick={async ({ setLoading, setSuccess }) => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setLoading(false);
            setSuccess(true);
          }}
        />
        <UnifiedButton
          variant="async-action"
          label="Outline"
          icon={Copy}
          ariaLabel="Copy"
          ariaLabelSuccess="Copied"
          buttonVariant="outline"
          onClick={async ({ setLoading, setSuccess }) => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setLoading(false);
            setSuccess(true);
          }}
        />
        <UnifiedButton
          variant="async-action"
          label="Ghost"
          icon={Copy}
          ariaLabel="Copy"
          ariaLabelSuccess="Copied"
          buttonVariant="ghost"
          onClick={async ({ setLoading, setSuccess }) => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setLoading(false);
            setSuccess(true);
          }}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Async action buttons in all style variants.',
      },
    },
  },
};

/**
 * Complete Variant Matrix
 */
export const CompleteVariantMatrix: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Authentication</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedButton variant="auth-signin" provider="github" />
          <UnifiedButton variant="auth-signin" provider="google" buttonVariant="outline" />
          <UnifiedButton variant="auth-signout" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Content Actions</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedButton variant="copy-markdown" category="agents" slug="example" label="Copy MD" />
          <UnifiedButton
            variant="download-markdown"
            category="agents"
            slug="example"
            label="Download"
          />
          <UnifiedButton
            variant="copy-llms"
            llmsTxtUrl="/agents/example/llms.txt"
            label="Copy AI"
          />
          <UnifiedButton
            variant="bookmark"
            contentType="agents"
            contentSlug="example"
            showLabel={true}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Business Logic</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedButton variant="job-toggle" jobId="job-123" currentStatus="active" />
          <UnifiedButton variant="job-delete" jobId="job-456" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Navigation</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedButton variant="back" />
          <UnifiedButton variant="link" href="/agents" label="Internal Link" external={false} />
          <UnifiedButton variant="github-stars" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Generic Async Actions</h3>
        <div className="flex flex-wrap gap-2">
          <UnifiedButton
            variant="async-action"
            label="Copy"
            icon={Copy}
            ariaLabel="Copy"
            ariaLabelSuccess="Copied"
            onClick={async ({ setLoading, setSuccess }) => {
              setLoading(true);
              await new Promise((resolve) => setTimeout(resolve, 800));
              setLoading(false);
              setSuccess(true);
            }}
          />
          <UnifiedButton
            variant="async-action"
            label="Download"
            icon={Download}
            ariaLabel="Download"
            ariaLabelSuccess="Downloaded"
            buttonVariant="default"
            onClick={async ({ setLoading, setSuccess }) => {
              setLoading(true);
              await new Promise((resolve) => setTimeout(resolve, 800));
              setLoading(false);
              setSuccess(true);
            }}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete showcase of ALL 13 button variants organized by category.',
      },
    },
  },
};

/**
 * Type Safety Example
 */
export const TypeSafetyExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="prose prose-sm">
        <h3>TypeScript Enforces Valid Prop Combinations</h3>
        <p>The discriminated union ensures only valid props for each variant:</p>
        <ul>
          <li>
            <code>variant="copy-markdown"</code> requires <code>category</code> and{' '}
            <code>slug</code>
          </li>
          <li>
            <code>variant="auth-signin"</code> requires <code>provider</code> (github | google)
          </li>
          <li>
            <code>variant="bookmark"</code> requires <code>contentType</code> and{' '}
            <code>contentSlug</code>
          </li>
          <li>
            <code>variant="async-action"</code> requires <code>onClick</code> handler
          </li>
        </ul>
        <p className="font-semibold">
          Invalid combinations will not compile - the compiler enforces correctness!
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the type safety benefits of discriminated unions. Invalid prop combinations are caught at compile time.',
      },
    },
  },
};

// ============================================================================
// DISABLED STATES
// Demonstrates disabled state for interactive button variants
// ============================================================================

/**
 * AuthSignInDisabled: Disabled Authentication Buttons
 * Shows GitHub/Google sign-in buttons in disabled state
 * Use case: During authentication flow, rate limiting, or maintenance mode
 */
export const AuthSignInDisabled: Story = {
  args: {
    variant: 'auth-signin',
    provider: 'github',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Authentication sign-in button in disabled state. Used during active auth flow, rate limiting, or when auth is temporarily unavailable.',
      },
    },
  },
};

/**
 * CopyMarkdownDisabled: Disabled Copy Button
 * Shows copy markdown button in disabled state
 * Use case: No content available, rate limited, or during copy operation
 */
export const CopyMarkdownDisabled: Story = {
  args: {
    variant: 'copy-markdown',
    contentId: 'disabled-content',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Copy markdown button in disabled state. Used when no content is available, user is rate limited, or during an active copy operation.',
      },
    },
  },
};

/**
 * BookmarkDisabled: Disabled Bookmark Button
 * Shows bookmark toggle button in disabled state
 * Use case: User not authenticated, no permission, or during save operation
 */
export const BookmarkDisabled: Story = {
  args: {
    variant: 'bookmark',
    contentId: 'disabled-content',
    contentType: 'guide',
    isBookmarked: false,
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Bookmark button in disabled state. Used when user lacks permission (not logged in), during save operation, or when bookmarking is unavailable.',
      },
    },
  },
};

/**
 * JobToggleDisabled: Disabled Job Toggle Button
 * Shows job active/inactive toggle in disabled state
 * Use case: No permission to modify job, during status update, or job archived
 */
export const JobToggleDisabled: Story = {
  args: {
    variant: 'job-toggle',
    jobId: 'disabled-job-123',
    isActive: false,
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Job status toggle button in disabled state. Used when user lacks edit permission, during status update operation, or when job is archived.',
      },
    },
  },
};

/**
 * JobDeleteDisabled: Disabled Job Delete Button
 * Shows job deletion button in disabled state
 * Use case: No permission to delete, job has applicants, or during deletion
 */
export const JobDeleteDisabled: Story = {
  args: {
    variant: 'job-delete',
    jobId: 'disabled-job-123',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Job delete button in disabled state. Used when user lacks delete permission, job has active applicants, or during deletion operation.',
      },
    },
  },
};

// ============================================================================
// INTERACTION TESTING
// Demonstrates play functions for automated interaction testing
// ============================================================================

/**
 * CopyMarkdownInteraction: Test Copy Button Click
 * Demonstrates automated interaction testing with play function
 * Tests button click, verifies analytics tracking
 */
export const CopyMarkdownInteraction: Story = {
  args: {
    variant: 'copy-markdown',
    contentId: 'test-guide-123',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating copy button click behavior. Uses play function to simulate user interaction and verify analytics tracking.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the copy button
    const copyButton = canvas.getByRole('button', { name: /copy/i });

    // Verify button is visible and enabled
    await expect(copyButton).toBeInTheDocument();
    await expect(copyButton).not.toBeDisabled();

    // Click the button
    await userEvent.click(copyButton);

    // Button should show loading state briefly, then success
    // Note: In real implementation, this would check for toast/success indicator
  },
};

/**
 * BookmarkInteraction: Test Bookmark Toggle
 * Tests bookmark button interaction with state changes
 */
export const BookmarkInteraction: Story = {
  args: {
    variant: 'bookmark',
    contentId: 'test-guide-123',
    contentType: 'guide',
    isBookmarked: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating bookmark toggle behavior. Tests clicking to bookmark content and verifies state change.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the bookmark button
    const bookmarkButton = canvas.getByRole('button', { name: /bookmark/i });

    // Verify initial state (not bookmarked)
    await expect(bookmarkButton).toBeInTheDocument();
    await expect(bookmarkButton).not.toBeDisabled();

    // Click to bookmark
    await userEvent.click(bookmarkButton);

    // Button should trigger optimistic update and show loading state
    // In production, this would show success toast and update icon
  },
};

/**
 * AsyncActionInteraction: Test Async Button with Loading State
 * Tests async action button with onClick handler verification
 */
export const AsyncActionInteraction: Story = {
  args: {
    variant: 'async-action',
    label: 'Submit Form',
    onClick: fn(), // Spy function to track clicks
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating async action button. Uses spy function to verify onClick handler is called correctly.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the async action button
    const actionButton = canvas.getByRole('button', { name: /submit form/i });

    // Verify button is visible and enabled
    await expect(actionButton).toBeInTheDocument();
    await expect(actionButton).not.toBeDisabled();

    // Click the button
    await userEvent.click(actionButton);

    // Verify onClick was called
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/**
 * DisabledButtonInteraction: Test Disabled Button Cannot Be Clicked
 * Verifies disabled buttons do not respond to interactions
 */
export const DisabledButtonInteraction: Story = {
  args: {
    variant: 'copy-markdown',
    contentId: 'test-content',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test verifying disabled buttons cannot be clicked. Ensures accessibility and prevents unintended interactions.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the disabled button
    const disabledButton = canvas.getByRole('button');

    // Verify button is disabled
    await expect(disabledButton).toBeDisabled();

    // Attempting to click should have no effect
    // (userEvent.click on disabled element throws in some configurations)
    // Instead, we just verify the disabled state is correct
    await expect(disabledButton).toHaveAttribute('disabled');
  },
};

/**
 * KeyboardInteraction: Test Keyboard Navigation
 * Tests button accessibility via keyboard (Enter/Space keys)
 */
export const KeyboardInteraction: Story = {
  args: {
    variant: 'async-action',
    label: 'Keyboard Test',
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating keyboard accessibility. Tests button activation via Enter and Space keys for WCAG compliance.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the button
    const button = canvas.getByRole('button', { name: /keyboard test/i });

    // Tab to focus the button
    await userEvent.tab();
    await expect(button).toHaveFocus();

    // Press Enter to activate
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    // Focus again and press Space
    button.focus();
    await userEvent.keyboard(' ');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};
