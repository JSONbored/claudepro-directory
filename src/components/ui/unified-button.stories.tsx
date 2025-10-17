import type { Meta, StoryObj } from '@storybook/react';
import { Copy, Download, Share2, Sparkles } from 'lucide-react';
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
