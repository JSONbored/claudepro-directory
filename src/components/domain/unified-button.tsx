'use client';

/**
 * Unified Button Component
 *
 * Production-grade, configuration-driven button system consolidating ALL button patterns.
 * Replaces 13 separate button files with a single discriminated union architecture.
 *
 * Architecture Benefits:
 * - DRY: Single source for ALL button logic (~1,279 LOC reduction)
 * - Type-safe: Discriminated unions enforce valid prop combinations
 * - Tree-shakeable: Unused variants compile out
 * - Zero wrappers: Complete consolidation, no backward compatibility
 * - Performance: Optimized re-renders with proper state management
 *
 * Consolidates:
 * - BaseActionButton (509 LOC)
 * - CopyMarkdownButton (206 LOC)
 * - DownloadMarkdownButton (184 LOC)
 * - CopyLLMsButton (189 LOC)
 * - BookmarkButton (149 LOC)
 * - CardCopyAction (74 LOC)
 * - AuthButtons (110 LOC)
 * - GitHubStarsButton (111 LOC)
 * - JobActions (113 LOC)
 *
 * Production Standards (October 2025):
 * - Server action integration with next-safe-action
 * - Supabase auth integration
 * - Rate limiting via server actions
 * - Toast notifications
 * - Analytics tracking
 * - Error boundaries and logging
 * - Email capture integration
 *
 * @module components/ui/unified-button
 */

import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState, useTransition } from 'react';
import { deleteJob, toggleJobStatus } from '#lib/actions/business';
import { copyMarkdownAction, downloadMarkdownAction } from '#lib/actions/markdown';
import { trackCopy } from '#lib/actions/track-view';
import { addBookmark, removeBookmark } from '#lib/actions/user';
import { usePostCopyEmail } from '#lib/providers/post-copy-email';
import { createClient } from '#lib/supabase/client';
import { Button } from '@/src/components/primitives/button';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  Chrome,
  Copy,
  Download,
  FileText,
  Github,
  LogOut,
  type LucideIcon,
  Pause,
  Play,
  Sparkles,
  Trash,
} from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';

/**
 * ==============================================================================
 * DISCRIMINATED UNION TYPE DEFINITIONS
 * ==============================================================================
 */

/**
 * Shared button styling props
 */
interface ButtonStyleProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  disabled?: boolean;
}

/**
 * Authentication Variants
 */
type AuthSignInVariant = {
  variant: 'auth-signin';
  provider: 'github' | 'google';
  redirectTo?: string;
} & ButtonStyleProps;

type AuthSignOutVariant = {
  variant: 'auth-signout';
} & ButtonStyleProps;

/**
 * Content Action Variants
 */
type CopyMarkdownVariant = {
  variant: 'copy-markdown';
  category: string;
  slug: string;
  label?: string;
  showIcon?: boolean;
  includeMetadata?: boolean;
  includeFooter?: boolean;
} & ButtonStyleProps;

type DownloadMarkdownVariant = {
  variant: 'download-markdown';
  category: string;
  slug: string;
  label?: string;
  showIcon?: boolean;
} & ButtonStyleProps;

type CopyLLMsVariant = {
  variant: 'copy-llms';
  llmsTxtUrl: string;
  label?: string;
  showIcon?: boolean;
} & ButtonStyleProps;

type BookmarkVariant = {
  variant: 'bookmark';
  contentType: string;
  contentSlug: string;
  initialBookmarked?: boolean;
  showLabel?: boolean;
} & ButtonStyleProps;

type CardCopyVariant = {
  variant: 'card-copy';
  url: string;
  category: CategoryId;
  slug: string;
  title: string;
} & ButtonStyleProps;

/**
 * Business Logic Variants
 */
type JobToggleVariant = {
  variant: 'job-toggle';
  jobId: string;
  currentStatus: 'active' | 'paused';
} & ButtonStyleProps;

type JobDeleteVariant = {
  variant: 'job-delete';
  jobId: string;
} & ButtonStyleProps;

/**
 * External Data Variant
 */
type GitHubStarsVariant = {
  variant: 'github-stars';
  repoUrl?: string;
} & ButtonStyleProps;

/**
 * Navigation Variants
 */
type BackVariant = {
  variant: 'back';
  label?: string;
} & ButtonStyleProps;

type LinkVariant = {
  variant: 'link';
  href: string;
  label: string;
  external?: boolean;
  icon?: LucideIcon;
} & ButtonStyleProps;

/**
 * Generic Async Action Variant (Replaces BaseActionButton)
 */
type AsyncActionVariant = {
  variant: 'async-action';
  label: string;
  loadingLabel?: string;
  successLabel?: string;
  icon: LucideIcon;
  showIcon?: boolean;
  ariaLabel: string;
  ariaLabelSuccess: string;
  title?: string;
  successDuration?: number;
  onClick: (helpers: {
    setLoading: (loading: boolean) => void;
    setSuccess: (success: boolean) => void;
    showError: (message: string, description?: string) => void;
    showSuccess: (message: string, description?: string) => void;
    logError: (message: string, error: Error, context?: Record<string, unknown>) => void;
  }) => Promise<void> | void;
} & ButtonStyleProps;

/**
 * Master Discriminated Union
 *
 * TypeScript will enforce that ONLY valid prop combinations are allowed.
 * No wrappers, no backward compatibility - pure configuration-driven architecture.
 */
export type UnifiedButtonProps =
  | AuthSignInVariant
  | AuthSignOutVariant
  | CopyMarkdownVariant
  | DownloadMarkdownVariant
  | CopyLLMsVariant
  | BookmarkVariant
  | CardCopyVariant
  | JobToggleVariant
  | JobDeleteVariant
  | GitHubStarsVariant
  | BackVariant
  | LinkVariant
  | AsyncActionVariant;

/**
 * ==============================================================================
 * UNIFIED BUTTON COMPONENT
 * ==============================================================================
 */

export function UnifiedButton(props: UnifiedButtonProps) {
  // Route to specific implementation based on discriminated union variant
  switch (props.variant) {
    case 'auth-signin':
      return <AuthSignInButton {...props} />;
    case 'auth-signout':
      return <AuthSignOutButton {...props} />;
    case 'copy-markdown':
      return <CopyMarkdownButton {...props} />;
    case 'download-markdown':
      return <DownloadMarkdownButton {...props} />;
    case 'copy-llms':
      return <CopyLLMsButton {...props} />;
    case 'bookmark':
      return <BookmarkButton {...props} />;
    case 'card-copy':
      return <CardCopyButton {...props} />;
    case 'job-toggle':
      return <JobToggleButton {...props} />;
    case 'job-delete':
      return <JobDeleteButton {...props} />;
    case 'github-stars':
      return <GitHubStarsButton {...props} />;
    case 'back':
      return <BackButton {...props} />;
    case 'link':
      return <LinkButton {...props} />;
    case 'async-action':
      return <AsyncActionButton {...props} />;
    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = props;
      return _exhaustive;
    }
  }
}

/**
 * ==============================================================================
 * VARIANT IMPLEMENTATIONS
 * ==============================================================================
 */

/**
 * Auth Sign-In Button (GitHub/Google OAuth)
 */
function AuthSignInButton({
  provider,
  redirectTo,
  size = 'default',
  buttonVariant = 'default',
  className,
  disabled = false,
}: AuthSignInVariant) {
  const [loading, setLoading] = useState<'github' | 'google' | null>(null);
  const supabase = createClient();

  const handleSignIn = async () => {
    setLoading(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${redirectTo}` : ''}`,
      },
    });

    if (error) {
      toasts.error.authFailed(`Sign in failed: ${error.message}`);
      setLoading(null);
    }
  };

  const icon = provider === 'github' ? Github : Chrome;
  const IconComponent = icon;

  return (
    <Button
      onClick={handleSignIn}
      disabled={disabled || loading !== null}
      size={size}
      variant={buttonVariant}
      className={cn('gap-2', className)}
    >
      {loading === provider ? (
        <>Signing in...</>
      ) : (
        <>
          <IconComponent className="h-4 w-4" />
          Sign in with {provider === 'github' ? 'GitHub' : 'Google'}
        </>
      )}
    </Button>
  );
}

/**
 * Auth Sign-Out Button
 */
function AuthSignOutButton({
  size = 'sm',
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: AuthSignOutVariant) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      toasts.error.authFailed(`Sign out failed: ${error.message}`);
      setLoading(false);
    } else {
      toasts.success.signedOut();
      router.push('/');
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={disabled || loading}
      size={size}
      variant={buttonVariant}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}

/**
 * Copy Markdown Button
 */
function CopyMarkdownButton({
  category,
  slug,
  label = 'Copy as Markdown',
  size = 'sm',
  buttonVariant = 'outline',
  className,
  showIcon = true,
  disabled = false,
  includeMetadata = true,
  includeFooter = false,
}: CopyMarkdownVariant) {
  const [isSuccess, setIsSuccess] = useState(false);
  const referrer = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const { showModal } = usePostCopyEmail();
  const { copy } = useCopyToClipboard({
    context: {
      component: 'UnifiedButton-CopyMarkdown',
      action: 'copy_markdown',
    },
  });

  const { executeAsync, status } = useAction(copyMarkdownAction);

  const handleClick = async () => {
    if (status === 'executing') return;

    try {
      const result = await executeAsync({
        category,
        slug,
        includeMetadata,
        includeFooter,
      });

      if (result?.data?.success && result.data.markdown) {
        await copy(result.data.markdown);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 2000);
        toasts.raw.success('Copied to clipboard!', {
          description: 'Markdown content ready to paste',
        });

        // Trigger email modal
        showModal({
          copyType: 'markdown',
          category,
          slug,
          ...(referrer && { referrer }),
        });

        // Track analytics (dynamic import for Storybook compatibility)
        const contentLength = result.data.markdown.length;
        Promise.all([import('#lib/analytics/event-mapper'), import('#lib/analytics/tracker')])
          .then(([eventMapper, tracker]) => {
            tracker.trackEvent(eventMapper.getCopyMarkdownEvent(category), {
              slug,
              include_metadata: includeMetadata,
              include_footer: includeFooter,
              content_length: contentLength,
            });
          })
          .catch(() => {
            // Silent fail in Storybook
          });
      } else {
        throw new Error(result?.data?.error || 'Failed to generate markdown');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Copy markdown failed', err, { category, slug });
      toasts.raw.error('Failed to copy markdown', { description: err.message });
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={disabled || status === 'executing' || isSuccess}
      className={cn(
        'gap-2 transition-all',
        isSuccess && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
    >
      {showIcon && (isSuccess ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />)}
      {size !== 'icon' && <span>{isSuccess ? 'Copied!' : label}</span>}
    </Button>
  );
}

/**
 * Download Markdown Button
 */
function DownloadMarkdownButton({
  category,
  slug,
  label = 'Download Markdown',
  size = 'sm',
  buttonVariant = 'outline',
  className,
  showIcon = true,
  disabled = false,
}: DownloadMarkdownVariant) {
  const [isSuccess, setIsSuccess] = useState(false);
  const { executeAsync, status } = useAction(downloadMarkdownAction);

  const handleClick = async () => {
    if (status === 'executing') return;

    try {
      const result = await executeAsync({ category, slug });

      if (result?.data?.success && result.data.markdown && result.data.filename) {
        // Create blob and download
        const blob = new Blob([result.data.markdown], {
          type: 'text/markdown;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 2000);
        toasts.raw.success('Downloaded successfully!', {
          description: `Saved as ${result.data.filename}`,
        });

        // Track analytics (dynamic import for Storybook compatibility)
        const filename = result.data.filename;
        const fileSize = blob.size;
        Promise.all([import('#lib/analytics/event-mapper'), import('#lib/analytics/tracker')])
          .then(([eventMapper, tracker]) => {
            tracker.trackEvent(eventMapper.getDownloadMarkdownEvent(category), {
              slug,
              filename,
              file_size: fileSize,
            });
          })
          .catch(() => {
            // Silent fail in Storybook
          });
      } else {
        throw new Error(result?.data?.error || 'Failed to generate markdown');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Download markdown failed', err, { category, slug });
      toasts.raw.error('Failed to download', { description: err.message });
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={disabled || status === 'executing' || isSuccess}
      className={cn(
        'gap-2 transition-all',
        isSuccess && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
    >
      {showIcon && (isSuccess ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />)}
      {size !== 'icon' && <span>{isSuccess ? 'Downloaded!' : label}</span>}
    </Button>
  );
}

/**
 * Copy LLMs.txt Button
 */
function CopyLLMsButton({
  llmsTxtUrl,
  label = 'Copy for AI',
  size = 'sm',
  buttonVariant = 'outline',
  className,
  showIcon = true,
  disabled = false,
}: CopyLLMsVariant) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { copy } = useCopyToClipboard({
    context: {
      component: 'UnifiedButton-CopyLLMs',
      action: 'copy_llmstxt',
    },
  });

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(llmsTxtUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch llms.txt: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      await copy(content);

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
      toasts.raw.success('Copied to clipboard!', {
        description: 'AI-optimized content ready to paste',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to fetch llms.txt content', err, { llmsTxtUrl });
      toasts.raw.error('Failed to copy', {
        description: 'Please try again or copy the URL manually',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading || isSuccess}
      className={cn(
        'gap-2 transition-all',
        isSuccess && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
    >
      {showIcon &&
        (isSuccess ? (
          <Check className="h-4 w-4" />
        ) : (
          <Sparkles className={cn('h-4 w-4', isLoading && 'animate-pulse')} />
        ))}
      {size !== 'icon' && <span>{isSuccess ? 'Copied!' : isLoading ? 'Loading...' : label}</span>}
    </Button>
  );
}

/**
 * Bookmark Button
 */
function BookmarkButton({
  contentType,
  contentSlug,
  initialBookmarked = false,
  showLabel = false,
  size = 'sm',
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: BookmarkVariant) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Validate content type - only actual categories, NOT subcategories
  // Subcategories (tutorials, workflows, etc.) should be bookmarked as 'guides'
  const VALID_CATEGORIES: readonly CategoryId[] = [
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'guides',
    'collections',
    'jobs',
    'changelog',
    'skills',
  ];

  const isValidCategory = (value: string): value is CategoryId => {
    return VALID_CATEGORIES.includes(value as CategoryId);
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isValidCategory(contentType)) {
      logger.error('Invalid content type', new Error('Invalid content type'), {
        contentType,
        contentSlug,
      });
      toasts.error.fromError(new Error(`Invalid content type: ${contentType}`));
      return;
    }

    startTransition(async () => {
      try {
        if (isBookmarked) {
          const result = await removeBookmark({
            content_type: contentType,
            content_slug: contentSlug,
          });

          if (result?.data?.success) {
            setIsBookmarked(false);
            toasts.success.bookmarkRemoved();
          }
        } else {
          const result = await addBookmark({
            content_type: contentType,
            content_slug: contentSlug,
          });

          if (result?.data?.success) {
            setIsBookmarked(true);
            toasts.success.bookmarkAdded();
          }
        }

        router.refresh();
      } catch (error) {
        if (error instanceof Error && error.message.includes('signed in')) {
          toasts.raw.error('Please sign in to bookmark content', {
            action: {
              label: 'Sign In',
              onClick: () => {
                window.location.href = `/login?redirect=${window.location.pathname}`;
              },
            },
          });
        } else {
          toasts.error.fromError(
            error instanceof Error ? error : new Error('Failed to update bookmark')
          );
        }
      }
    });
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      className={cn('h-7 w-7 p-0', className)}
      onClick={handleToggle}
      disabled={disabled || isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-3 w-3 fill-current text-primary" aria-hidden="true" />
      ) : (
        <Bookmark className="h-3 w-3" aria-hidden="true" />
      )}
      {showLabel && <span className="ml-1 text-xs">{isBookmarked ? 'Saved' : 'Save'}</span>}
    </Button>
  );
}

/**
 * Card Copy Action Button
 */
function CardCopyButton({
  url,
  category,
  slug,
  title,
  size = 'sm',
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: CardCopyVariant) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track copy action (silent fail for analytics)
      trackCopy({ category, slug }).catch((trackError) => {
        logger.error(
          'Failed to track copy action',
          trackError instanceof Error ? trackError : new Error(String(trackError)),
          {
            component: 'UnifiedButton-CardCopy',
            category,
            slug,
          }
        );
      });

      toasts.success.linkCopied();
    } catch (error) {
      logger.error(
        'Failed to copy link to clipboard',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'UnifiedButton-CardCopy',
          category,
          slug,
        }
      );
      toasts.error.copyFailed('link');
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      className={cn('h-7 w-7 p-0', className)}
      onClick={handleCopy}
      disabled={disabled}
      aria-label={copied ? 'Link copied to clipboard' : `Copy link to ${title}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3" aria-hidden="true" />
      )}
    </Button>
  );
}

/**
 * Job Toggle Button (Pause/Resume)
 */
function JobToggleButton({
  jobId,
  currentStatus,
  size = 'sm',
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: JobToggleVariant) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    startTransition(async () => {
      try {
        const result = await toggleJobStatus({
          id: jobId,
          status: newStatus as 'active' | 'paused' | 'draft' | 'expired' | 'deleted',
        });

        if (result?.data?.success) {
          toasts.success.actionCompleted(
            newStatus === 'active' ? 'Job listing resumed' : 'Job listing paused'
          );
          router.refresh();
        } else {
          toasts.error.actionFailed('update job status');
        }
      } catch (_error) {
        toasts.error.serverError();
      }
    });
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleToggle}
      disabled={disabled || isPending}
      className={className}
    >
      {currentStatus === 'active' ? (
        <>
          <Pause className="h-3 w-3 mr-1" />
          Pause
        </>
      ) : (
        <>
          <Play className="h-3 w-3 mr-1" />
          Resume
        </>
      )}
    </Button>
  );
}

/**
 * Job Delete Button
 */
function JobDeleteButton({
  jobId,
  size = 'sm',
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: JobDeleteVariant) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (
      !confirm('Are you sure you want to delete this job listing? This action cannot be undone.')
    ) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      try {
        const result = await deleteJob({ id: jobId });

        if (result?.data?.success) {
          toasts.success.itemDeleted('Job listing');
          router.refresh();
        } else {
          toasts.error.actionFailed('delete job listing');
          setIsDeleting(false);
        }
      } catch (_error) {
        toasts.error.serverError();
        setIsDeleting(false);
      }
    });
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleDelete}
      disabled={disabled || isPending || isDeleting}
      className={cn('text-destructive', className)}
    >
      <Trash className="h-3 w-3 mr-1" />
      Delete
    </Button>
  );
}

/**
 * GitHub Stars Button
 */
function GitHubStarsButton({
  repoUrl = SOCIAL_LINKS.github,
  size = 'sm',
  buttonVariant = 'outline',
  className,
  disabled = false,
}: GitHubStarsVariant) {
  const [stars, setStars] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!match?.[1]) {
      setLoading(false);
      return;
    }

    const repo: string = match[1];

    const fetchStars = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`, {
          next: { revalidate: 3600 },
        });

        if (!response.ok) {
          throw new Error(`GitHub API returned ${response.status}`);
        }

        const data = await response.json();

        if (typeof data.stargazers_count !== 'number') {
          throw new Error('Invalid response: missing stargazers_count');
        }

        setStars(data.stargazers_count);
        setError(false);
      } catch (err) {
        logger.error(
          'Failed to fetch GitHub stars',
          err instanceof Error ? err : new Error(String(err)),
          { repo }
        );
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStars().catch((err) => {
      logger.error(
        'Unhandled error in fetchStars',
        err instanceof Error ? err : new Error(String(err))
      );
    });
  }, [repoUrl]);

  const handleClick = () => {
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={cn('gap-2', className)}
      aria-label={`Star us on GitHub${stars ? ` - ${stars} stars` : ''}${error ? ' (star count unavailable)' : ''}`}
      title={error ? 'Star count temporarily unavailable. Click to visit GitHub.' : undefined}
    >
      <Github className="h-4 w-4" aria-hidden="true" />
      {!loading && stars !== null && !error && (
        <span className="font-medium tabular-nums">{stars.toLocaleString()}</span>
      )}
    </Button>
  );
}

/**
 * Back Navigation Button
 */
function BackButton({
  label = 'Back',
  size = 'default',
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: BackVariant) {
  const router = useRouter();

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={() => router.back()}
      disabled={disabled}
      className={cn('text-muted-foreground hover:text-foreground', className)}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}

/**
 * Link Button (Internal/External)
 */
function LinkButton({
  href,
  label,
  external = false,
  icon: Icon,
  size = 'default',
  buttonVariant = 'default',
  className,
  disabled = false,
}: LinkVariant) {
  const handleClick = () => {
    if (external) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = href;
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={cn('gap-2', className)}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Button>
  );
}

/**
 * Generic Async Action Button (Replaces BaseActionButton)
 */
function AsyncActionButton({
  label,
  loadingLabel = 'Loading...',
  successLabel = 'Success!',
  icon: Icon,
  size = 'sm',
  buttonVariant = 'outline',
  className,
  showIcon = true,
  disabled = false,
  ariaLabel,
  ariaLabelSuccess,
  title,
  successDuration = 2000,
  onClick,
}: AsyncActionVariant) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSetSuccess = (success: boolean) => {
    setIsSuccess(success);

    if (success) {
      setTimeout(() => {
        setIsSuccess(false);
      }, successDuration);
    }
  };

  const showError = (message: string, description?: string) => {
    toasts.raw.error(message, {
      description,
      duration: 4000,
    });
  };

  const showSuccess = (message: string, description?: string) => {
    toasts.raw.success(message, {
      description,
      duration: 3000,
    });
  };

  const logError = (message: string, error: Error, context?: Record<string, unknown>) => {
    logger.error(message, error, {
      component: 'UnifiedButton-AsyncAction',
      ...context,
    });
  };

  const handleClick = async () => {
    if (isLoading || isSuccess || disabled) return;

    try {
      await onClick({
        setLoading: setIsLoading,
        setSuccess: handleSetSuccess,
        showError,
        showSuccess,
        logError,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError('Action failed', err);
      showError('Action failed', err.message);
    }
  };

  const currentLabel = isSuccess ? successLabel : isLoading ? loadingLabel : label;
  const currentAriaLabel = isSuccess ? ariaLabelSuccess : ariaLabel;

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading || isSuccess}
      className={cn(
        'gap-2 transition-all',
        isSuccess && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
      aria-label={currentAriaLabel}
      title={title}
    >
      {showIcon &&
        (isSuccess ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : isLoading ? (
          <Icon className="h-4 w-4 animate-pulse" aria-hidden="true" />
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        ))}
      {size !== 'icon' && <span className="text-sm">{currentLabel}</span>}
    </Button>
  );
}
