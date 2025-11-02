'use client';

/**
 * Unified Button - Database-first button system with 12 variants (auth, content actions, navigation)
 */

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState, useTransition } from 'react';
import { usePostCopyEmail } from '@/src/components/infra/providers/post-copy-email-provider';
import { Button } from '@/src/components/primitives/button';
import { useButtonSuccess } from '@/src/hooks/use-button-success';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { trackInteraction } from '@/src/lib/actions/analytics.actions';
import { deleteJob, toggleJobStatus } from '@/src/lib/actions/business.actions';
import { trackUsage } from '@/src/lib/actions/content.actions';
import { getGitHubStars } from '@/src/lib/actions/github.actions';
import { copyMarkdownAction, downloadMarkdownAction } from '@/src/lib/actions/markdown-actions';
import { addBookmark, removeBookmark } from '@/src/lib/actions/user.actions';
import { type CategoryId, isValidCategory } from '@/src/lib/config/category-config';
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
import { createClient } from '@/src/lib/supabase/client';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';

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
  category: CategoryId;
  slug: string;
  label?: string;
  showIcon?: boolean;
  includeMetadata?: boolean;
  includeFooter?: boolean;
} & ButtonStyleProps;

type DownloadMarkdownVariant = {
  variant: 'download-markdown';
  category: CategoryId;
  slug: string;
  label?: string;
  showIcon?: boolean;
} & ButtonStyleProps;

type CopyLLMsVariant = {
  variant: 'copy-llms';
  llmsTxtUrl: string;
  label?: string;
  showIcon?: boolean;
  category?: CategoryId;
  slug?: string;
  contentId?: string;
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
      <LogOut className="mr-2 h-4 w-4" />
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
  const { isSuccess, triggerSuccess } = useButtonSuccess();
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
        triggerSuccess();
        toasts.raw.success('Copied to clipboard!', {
          description: 'Markdown content ready to paste',
        });

        // Track usage with database-first trackUsage()
        if (result.data.content_id) {
          trackUsage({
            content_id: result.data.content_id,
            action_type: 'copy',
          }).catch(() => {
            // Intentionally empty - analytics failures should not affect UX
          });
        }

        // Trigger email modal
        showModal({
          copyType: 'markdown',
          category,
          slug,
          ...(referrer && { referrer }),
        });

        // Track analytics (fire-and-forget)
        const contentLength = result.data.markdown.length;
        import('@/src/lib/analytics/tracker')
          .then((tracker) => {
            tracker.trackEvent('markdown_copied', {
              category,
              slug,
              contentLength,
              copyCount: 1,
            });
          })
          .catch(() => {
            // Intentionally empty - analytics failures should not affect UX
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
    <motion.div animate={isSuccess ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3 }}>
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
    </motion.div>
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
  const { isSuccess, triggerSuccess } = useButtonSuccess();
  const { executeAsync, status } = useAction(downloadMarkdownAction);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(category === 'skills');
  const [contentId, setContentId] = useState<string | null>(null);
  const supabase = createClient();

  // Skills category: Fetch storage_url from database
  useEffect(() => {
    if (category !== 'skills') return;

    const fetchStorageData = async () => {
      const { data, error } = await supabase
        .from('content')
        .select('id, storage_url')
        .eq('category', 'skills')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        setZipUrl(data.storage_url);
        setContentId(data.id);
      }
      setIsLoadingUrl(false);
    };

    fetchStorageData().catch(() => {
      // Intentionally empty - fetch errors handled by setting loading state to false
      setIsLoadingUrl(false);
    });
  }, [category, slug, supabase]);

  // Skills category: Download ZIP from Supabase Storage with trackUsage()
  if (category === 'skills') {
    const handleZipClick = async () => {
      if (contentId) {
        trackUsage({
          content_id: contentId,
          action_type: 'download_zip',
        }).catch(() => {
          // Intentionally empty - analytics failures should not affect UX
        });
      }
    };

    return (
      <Button
        variant={buttonVariant}
        size={size}
        asChild
        disabled={disabled || isLoadingUrl || !zipUrl}
        className={cn('gap-2 transition-all', className)}
      >
        <a href={zipUrl || '#'} download onClick={handleZipClick}>
          {showIcon && <Download className="h-4 w-4" />}
          <span>{isLoadingUrl ? 'Loading...' : 'Download ZIP'}</span>
        </a>
      </Button>
    );
  }

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

        triggerSuccess();
        toasts.raw.success('Downloaded successfully!', {
          description: `Saved as ${result.data.filename}`,
        });

        // Track usage with database-first trackUsage()
        if (result.data.content_id) {
          trackUsage({
            content_id: result.data.content_id,
            action_type: 'download_markdown',
          }).catch(() => {
            // Intentional
          });
        }

        // Track analytics (fire-and-forget)
        const fileSize = blob.size;
        import('@/src/lib/analytics/tracker')
          .then((tracker) => {
            tracker.trackEvent('markdown_downloaded', {
              category,
              slug,
              fileSize,
              downloadCount: 1,
            });
          })
          .catch(() => {
            // Intentional
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
    <motion.div animate={isSuccess ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3 }}>
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
    </motion.div>
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
  category,
  slug,
  contentId,
}: CopyLLMsVariant) {
  const [isLoading, setIsLoading] = useState(false);
  const { isSuccess, triggerSuccess } = useButtonSuccess();
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

      triggerSuccess();
      toasts.raw.success('Copied to clipboard!', {
        description: 'AI-optimized content ready to paste',
      });

      // Track usage with database-first trackUsage() (uses prop from server component)
      if (contentId) {
        trackUsage({
          content_id: contentId,
          action_type: 'llmstxt',
        }).catch(() => {
          // Intentional
        });
      }

      // Track analytics (fire-and-forget)
      if (category && slug) {
        import('@/src/lib/analytics/tracker')
          .then((tracker) => {
            tracker.trackEvent('llmstxt_copied', {
              category,
              slug,
              contentLength: content.length,
            });
          })
          .catch(() => {
            // Intentional
          });
      }
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
    <motion.div animate={isSuccess ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3 }}>
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
          ) : isLoading ? (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
          ) : (
            <Sparkles className="h-4 w-4" />
          ))}
        {size !== 'icon' && <span>{isSuccess ? 'Copied!' : isLoading ? 'Loading...' : label}</span>}
      </Button>
    </motion.div>
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

  // Note: Validate content type - only actual categories, NOT subcategories
  // Subcategories (tutorials, workflows, etc.) should be bookmarked as 'guides'

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Type guard validation
    if (!isValidCategory(contentType)) {
      logger.error('Invalid content type', new Error('Invalid content type'), {
        contentType,
        contentSlug,
      });
      toasts.error.fromError(new Error(`Invalid content type: ${contentType}`));
      return;
    }

    const validatedCategory = contentType;

    startTransition(async () => {
      try {
        if (isBookmarked) {
          const result = await removeBookmark({
            content_type: validatedCategory,
            content_slug: contentSlug,
          });

          if (result?.data?.success) {
            setIsBookmarked(false);
            toasts.success.bookmarkRemoved();
          }
        } else {
          const result = await addBookmark({
            content_type: validatedCategory,
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

      // Track copy action (fire-and-forget)
      trackInteraction({
        interaction_type: 'copy',
        content_type: category,
        content_slug: slug,
      }).catch(() => {
        // Intentional
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
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';

    startTransition(async () => {
      try {
        const result = await toggleJobStatus({
          id: jobId,
          status: newStatus as 'draft' | 'pending_review' | 'active' | 'expired' | 'rejected',
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
          <Pause className="mr-1 h-3 w-3" />
          Pause
        </>
      ) : (
        <>
          <Play className="mr-1 h-3 w-3" />
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
      <Trash className="mr-1 h-3 w-3" />
      Delete
    </Button>
  );
}

/**
 * GitHub Stars Button - Database-first with 1-hour caching
 */
function GitHubStarsButton({
  repoUrl = SOCIAL_LINKS.github,
  size = 'sm',
  buttonVariant = 'outline',
  className,
  disabled = false,
}: GitHubStarsVariant) {
  const [stars, setStars] = useState<number | null>(null);
  const { executeAsync, status } = useAction(getGitHubStars);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const result = await executeAsync({ repo_url: repoUrl });

        if (
          result &&
          'data' in result &&
          result.data &&
          typeof result.data === 'object' &&
          'stars' in result.data
        ) {
          setStars(result.data.stars as number);
        }
      } catch (err) {
        logger.error(
          'Failed to fetch GitHub stars',
          err instanceof Error ? err : new Error(String(err)),
          { repoUrl }
        );
      }
    };

    fetchStars().catch(() => {
      // Intentional
    });
  }, [repoUrl, executeAsync]);

  const handleClick = () => {
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };

  const isLoading = status === 'executing';
  const hasError = status === 'hasErrored';

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={cn('gap-2', className)}
      aria-label={`Star us on GitHub${stars ? ` - ${stars} stars` : ''}${hasError ? ' (star count unavailable)' : ''}`}
      title={hasError ? 'Star count temporarily unavailable. Click to visit GitHub.' : undefined}
    >
      <Github className="h-4 w-4" aria-hidden="true" />
      {!isLoading && stars !== null && !hasError && (
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
      <ArrowLeft className="mr-2 h-4 w-4" />
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
  const { isSuccess, triggerSuccess } = useButtonSuccess(successDuration);

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
        setSuccess: triggerSuccess,
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
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </motion.div>
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        ))}
      {size !== 'icon' && <span className="text-sm">{currentLabel}</span>}
    </Button>
  );
}
