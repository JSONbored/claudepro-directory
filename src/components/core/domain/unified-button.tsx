'use client';

/**
 * Unified Button - Database-first button system with 12 variants (auth, content actions, navigation)
 */

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { usePostCopyEmail } from '@/src/components/core/infra/providers/post-copy-email-provider';
import { Button } from '@/src/components/primitives/button';
import { useButtonSuccess } from '@/src/hooks/use-button-success';
import { useConfetti } from '@/src/hooks/use-confetti';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { trackUsage } from '@/src/lib/actions/content.actions';
import { addBookmark, removeBookmark } from '@/src/lib/actions/user.actions';
import { type CategoryId, isValidCategory } from '@/src/lib/config/category-config';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { trackInteraction } from '@/src/lib/edge/client';
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
import { SEMANTIC_COLORS } from '@/src/lib/semantic-colors';
import { createClient } from '@/src/lib/supabase/client';
import { STATE_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';
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
        redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`,
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
          <IconComponent className={UI_CLASSES.ICON_SM} />
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
      <LogOut className={UI_CLASSES.ICON_SM_LEADING} />
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}

/**
 * Copy Markdown Button - Edge Function Direct Fetch
 * Fetches markdown directly from edge function (all categories including skills)
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

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        includeMetadata: includeMetadata.toString(),
        includeFooter: includeFooter.toString(),
      });

      // Fetch markdown from edge function (returns plain text markdown)
      const response = await fetch(`/${category}/${slug}.md?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.statusText}`);
      }

      // Get plain text markdown content
      const markdown = await response.text();

      if (!markdown) {
        throw new Error('No markdown content returned');
      }

      // Copy to clipboard
      await copy(markdown);
      triggerSuccess();
      toasts.raw.success('Copied to clipboard!', {
        description: 'Markdown content ready to paste',
      });

      // Track usage with database-first trackUsage() (atomic RPC, 50-100ms faster)
      trackUsage({
        content_type: category,
        content_slug: slug,
        action_type: 'copy',
      }).catch(() => {
        // Intentionally empty - analytics failures should not affect UX
      });

      // Trigger email modal
      showModal({
        copyType: 'markdown',
        category,
        slug,
        ...(referrer && { referrer }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Copy markdown failed', err, { category, slug });
      toasts.raw.error('Failed to copy markdown', { description: err.message });
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
        className={cn('gap-2 transition-all', isSuccess && SEMANTIC_COLORS.SUCCESS, className)}
      >
        {showIcon &&
          (isSuccess ? (
            <Check className={UI_CLASSES.ICON_SM} />
          ) : (
            <FileText className={UI_CLASSES.ICON_SM} />
          ))}
        {size !== 'icon' && <span>{isSuccess ? 'Copied!' : label}</span>}
      </Button>
    </motion.div>
  );
}

/**
 * Download Markdown Button - Edge Function Direct Fetch
 * Downloads markdown .md file for ALL categories (uniform behavior)
 * Skills: This downloads the .md file. Separate ZIP button on detail page.
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
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Fetch markdown from edge function (returns plain text markdown)
      const response = await fetch(
        `/${category}/${slug}.md?includeMetadata=true&includeFooter=true`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.statusText}`);
      }

      // Get plain text markdown and filename from headers
      const markdown = await response.text();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] || `${slug}.md`;

      if (!markdown) {
        throw new Error('No markdown content returned');
      }

      // Create blob and download
      const blob = new Blob([markdown], {
        type: 'text/markdown;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerSuccess();
      toasts.raw.success('Downloaded successfully!', {
        description: `Saved as ${filename}`,
      });

      // Track usage with database-first trackUsage() (atomic RPC, 50-100ms faster)
      trackUsage({
        content_type: category,
        content_slug: slug,
        action_type: 'download_markdown',
      }).catch(() => {
        // Intentionally empty - analytics failures should not affect UX
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Download markdown failed', err, { category, slug });
      toasts.raw.error('Failed to download', { description: err.message });
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
        className={cn('gap-2 transition-all', isSuccess && SEMANTIC_COLORS.SUCCESS, className)}
      >
        {showIcon &&
          (isSuccess ? (
            <Check className={UI_CLASSES.ICON_SM} />
          ) : (
            <Download className={UI_CLASSES.ICON_SM} />
          ))}
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

      // Track usage with database-first trackUsage() (atomic RPC, 50-100ms faster)
      if (category && slug) {
        trackUsage({
          content_type: category,
          content_slug: slug,
          action_type: 'llmstxt',
        }).catch(() => {
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
        className={cn('gap-2 transition-all', isSuccess && SEMANTIC_COLORS.SUCCESS, className)}
      >
        {showIcon &&
          (isSuccess ? (
            <Check className={UI_CLASSES.ICON_SM} />
          ) : isLoading ? (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <Sparkles className={UI_CLASSES.ICON_SM} />
            </motion.div>
          ) : (
            <Sparkles className={UI_CLASSES.ICON_SM} />
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
  const { celebrateBookmark } = useConfetti();

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
            // Celebrate with confetti! 🎉
            celebrateBookmark();
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
      className={cn(UI_CLASSES.ICON_BUTTON_SM, className)}
      onClick={handleToggle}
      disabled={disabled || isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck
          className={`${UI_CLASSES.ICON_XS} fill-current text-primary`}
          aria-hidden="true"
        />
      ) : (
        <Bookmark className={UI_CLASSES.ICON_XS} aria-hidden="true" />
      )}
      {showLabel && (
        <span className={`ml-1 ${UI_CLASSES.TEXT_BADGE}`}>{isBookmarked ? 'Saved' : 'Save'}</span>
      )}
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
      className={cn(UI_CLASSES.ICON_BUTTON_SM, className)}
      onClick={handleCopy}
      disabled={disabled}
      aria-label={copied ? 'Link copied to clipboard' : `Copy link to ${title}`}
    >
      {copied ? (
        <Check className={cn(UI_CLASSES.ICON_XS, SEMANTIC_COLORS.SOCIAL_COPY)} aria-hidden="true" />
      ) : (
        <Copy className={UI_CLASSES.ICON_XS} aria-hidden="true" />
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
  const supabase = createClient();

  const handleToggle = () => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';

    startTransition(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('You must be signed in to manage jobs');
        }

        // Call jobs-handler edge function directly
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/jobs-handler`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              'X-Job-Action': 'toggle',
            },
            body: JSON.stringify({
              id: jobId,
              status: newStatus,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to toggle job status');
        }

        const result = (await response.json()) as { success: boolean };

        if (result.success) {
          toasts.success.actionCompleted(
            newStatus === 'active' ? 'Job listing resumed' : 'Job listing paused'
          );
          router.refresh();
        } else {
          toasts.error.actionFailed('update job status');
        }
      } catch (error) {
        logger.error(
          'Failed to toggle job status',
          error instanceof Error ? error : new Error(String(error)),
          { jobId, newStatus }
        );
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
          <Pause className={UI_CLASSES.ICON_XS_LEADING} />
          Pause
        </>
      ) : (
        <>
          <Play className={UI_CLASSES.ICON_XS_LEADING} />
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
  const supabase = createClient();

  const handleDelete = () => {
    if (
      !confirm('Are you sure you want to delete this job listing? This action cannot be undone.')
    ) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('You must be signed in to delete jobs');
        }

        // Call jobs-handler edge function directly
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/jobs-handler`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              'X-Job-Action': 'delete',
            },
            body: JSON.stringify({ id: jobId }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to delete job');
        }

        const result = (await response.json()) as { success: boolean };

        if (result.success) {
          toasts.success.itemDeleted('Job listing');
          router.refresh();
        } else {
          toasts.error.actionFailed('delete job listing');
          setIsDeleting(false);
        }
      } catch (error) {
        logger.error(
          'Failed to delete job',
          error instanceof Error ? error : new Error(String(error)),
          { jobId }
        );
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
      <Trash className={UI_CLASSES.ICON_XS_LEADING} />
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
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: GitHubStarsVariant) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    const apiUrl = (() => {
      try {
        const { pathname, hostname } = new URL(repoUrl);
        if (hostname === 'github.com') {
          const [, owner, repo] = pathname.split('/');
          if (owner && repo) {
            return `https://api.github.com/repos/${owner}/${repo}`;
          }
        }
      } catch {
        // Intentional noop – fall back to default repo
      }
      return 'https://api.github.com/repos/JSONbored/claudepro-directory';
    })();

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        const count =
          data && typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
        setStars(count);
      })
      .catch(() => setStars(null));
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
      aria-label={`Star us on GitHub${stars ? ` - ${stars} stars` : ''}`}
    >
      <Github className={UI_CLASSES.ICON_SM} aria-hidden="true" />
      {typeof stars === 'number' && (
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
      className={cn('text-muted-foreground', STATE_PATTERNS.HOVER_TEXT_FOREGROUND, className)}
    >
      <ArrowLeft className={UI_CLASSES.ICON_SM_LEADING} />
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
      {Icon && <Icon className={UI_CLASSES.ICON_SM} />}
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
      className={cn('gap-2 transition-all', isSuccess && SEMANTIC_COLORS.SUCCESS, className)}
      aria-label={currentAriaLabel}
      title={title}
    >
      {showIcon &&
        (isSuccess ? (
          <Check className={UI_CLASSES.ICON_SM} aria-hidden="true" />
        ) : isLoading ? (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <Icon className={UI_CLASSES.ICON_SM} aria-hidden="true" />
          </motion.div>
        ) : (
          <Icon className={UI_CLASSES.ICON_SM} aria-hidden="true" />
        ))}
      {size !== 'icon' && <span className="text-sm">{currentLabel}</span>}
    </Button>
  );
}
