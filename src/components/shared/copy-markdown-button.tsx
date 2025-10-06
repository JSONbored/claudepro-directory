/**
 * Copy Markdown Button Component
 *
 * Provides one-click copying of markdown-formatted content using next-safe-action.
 * Extends existing CopyLLMsButton pattern with server action integration.
 *
 * October 2025 Production Standards:
 * - Leverages existing useCopyToClipboard hook
 * - Uses copyMarkdownAction server action (rate-limited)
 * - Consistent UI patterns with CopyLLMsButton
 * - Toast notifications and loading states
 * - Accessibility compliant
 *
 * @module components/shared/copy-markdown-button
 */

'use client';

import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { toast } from '@/src/components/ui/sonner';
import { useCopyWithEmailCapture } from '@/src/hooks/use-copy-with-email-capture';
import { copyMarkdownAction } from '@/src/lib/actions/markdown-actions';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { Check, FileText } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { cn } from '@/src/lib/utils';

/**
 * Props for CopyMarkdownButton component
 */
export interface CopyMarkdownButtonProps {
  /**
   * Content category (agents, mcp, commands, etc.)
   */
  category: string;

  /**
   * Content slug identifier
   */
  slug: string;

  /**
   * Optional label for the button
   * @default "Copy as Markdown"
   */
  label?: string;

  /**
   * Button size variant
   * @default "sm"
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /**
   * Button style variant
   * @default "outline"
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to show the FileText icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Include frontmatter metadata
   * @default true
   */
  includeMetadata?: boolean;

  /**
   * Include attribution footer
   * @default false (cleaner for most use cases)
   */
  includeFooter?: boolean;
}

/**
 * Button component for copying markdown content to clipboard
 *
 * Uses next-safe-action server action with built-in rate limiting and caching.
 * Provides consistent UX with existing copy buttons while using modern server actions.
 *
 * @param props - Component props
 * @returns Button that fetches markdown and copies to clipboard
 *
 * @example
 * ```tsx
 * <CopyMarkdownButton
 *   category="agents"
 *   slug="api-builder-agent"
 *   label="Copy as Markdown"
 * />
 * ```
 */
export function CopyMarkdownButton({
  category,
  slug,
  label = 'Copy as Markdown',
  size = 'sm',
  variant = 'outline',
  className,
  showIcon = true,
  includeMetadata = true,
  includeFooter = false,
}: CopyMarkdownButtonProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  const referrer = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const { copied, copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: 'markdown',
      category,
      slug,
      ...(referrer ? { referrer } : {}),
    },
    onSuccess: () => {
      toast.success('Copied to clipboard!', {
        description: 'Markdown content ready to paste',
        duration: 3000,
      });
    },
    onError: () => {
      toast.error('Failed to copy', {
        description: 'Please try again',
        duration: 4000,
      });
    },
    context: {
      component: 'CopyMarkdownButton',
      action: 'copy_markdown',
    },
  });

  // Use next-safe-action hook
  const { execute, status } = useAction(copyMarkdownAction, {
    onSuccess: async (result) => {
      if (result.data?.success && result.data.markdown) {
        // Copy the markdown to clipboard
        await copy(result.data.markdown);

        // Track analytics event
        trackEvent(EVENTS.COPY_MARKDOWN, {
          content_category: category,
          content_slug: slug,
          include_metadata: includeMetadata,
          include_footer: includeFooter,
          content_length: result.data.markdown.length,
        });
      } else {
        throw new Error(result.data?.error || 'Failed to generate markdown');
      }
    },
    onError: (error) => {
      const serverError = error.error?.serverError;
      const errorMessage =
        serverError &&
        typeof serverError === 'object' &&
        'message' in serverError &&
        typeof (serverError as { message?: unknown }).message === 'string'
          ? (serverError as { message: string }).message
          : typeof serverError === 'string'
            ? serverError
            : 'Failed to copy';

      logger.error('Copy markdown action failed', new Error(errorMessage), {
        component: 'CopyMarkdownButton',
        category,
        slug,
      });

      toast.error('Failed to copy markdown', {
        description: errorMessage,
        duration: 4000,
      });
    },
  });

  /**
   * Handle copy button click
   */
  const handleCopy = async () => {
    if (isExecuting || copied || status === 'executing') return;

    setIsExecuting(true);

    try {
      await execute({
        category,
        slug,
        includeMetadata,
        includeFooter,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const isLoading = status === 'executing' || isExecuting;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={isLoading || copied}
      className={cn(
        'gap-2 transition-all',
        copied && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
      aria-label={copied ? 'Markdown copied' : 'Copy as markdown'}
    >
      {showIcon &&
        (copied ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : isLoading ? (
          <FileText className="h-4 w-4 animate-pulse" aria-hidden="true" />
        ) : (
          <FileText className="h-4 w-4" aria-hidden="true" />
        ))}
      <span className="text-sm">{copied ? 'Copied!' : isLoading ? 'Loading...' : label}</span>
    </Button>
  );
}

/**
 * Compact icon-only variant of CopyMarkdownButton
 *
 * @param props - Component props (excluding size)
 * @returns Icon button for copying markdown content
 *
 * @example
 * ```tsx
 * <CopyMarkdownButtonIcon category="agents" slug="code-reviewer" />
 * ```
 */
export function CopyMarkdownButtonIcon({
  category,
  slug,
  className,
  variant = 'ghost',
  includeMetadata = true,
  includeFooter = false,
}: Omit<CopyMarkdownButtonProps, 'label' | 'size' | 'showIcon'>) {
  const [isExecuting, setIsExecuting] = useState(false);

  const referrer = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const { copied, copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: 'markdown',
      category,
      slug,
      ...(referrer ? { referrer } : {}),
    },
    onSuccess: () => {
      toast.success('Copied as Markdown!');
    },
    onError: () => {
      toast.error('Failed to copy');
    },
    context: {
      component: 'CopyMarkdownButtonIcon',
      action: 'copy_markdown',
    },
  });

  const { execute, status } = useAction(copyMarkdownAction, {
    onSuccess: async (result) => {
      if (result.data?.success && result.data.markdown) {
        await copy(result.data.markdown);

        // Track analytics event
        trackEvent(EVENTS.COPY_MARKDOWN, {
          content_category: category,
          content_slug: slug,
          include_metadata: includeMetadata,
          include_footer: includeFooter,
          content_length: result.data.markdown.length,
        });
      } else {
        throw new Error(result.data?.error || 'Failed to generate markdown');
      }
    },
    onError: (error) => {
      const serverError = error.error?.serverError;
      const errorMessage =
        serverError &&
        typeof serverError === 'object' &&
        'message' in serverError &&
        typeof (serverError as { message?: unknown }).message === 'string'
          ? (serverError as { message: string }).message
          : typeof serverError === 'string'
            ? serverError
            : 'Failed to copy';

      logger.error('Copy markdown failed', new Error(errorMessage), {
        component: 'CopyMarkdownButtonIcon',
        category,
        slug,
      });
      toast.error('Failed to copy');
    },
  });

  const handleCopy = async () => {
    if (isExecuting || copied || status === 'executing') return;

    setIsExecuting(true);
    try {
      await execute({ category, slug, includeMetadata, includeFooter });
    } finally {
      setIsExecuting(false);
    }
  };

  const isLoading = status === 'executing' || isExecuting;

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleCopy}
      disabled={isLoading || copied}
      className={cn(
        'transition-all',
        copied && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
      aria-label="Copy as markdown"
      title="Copy as Markdown"
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : isLoading ? (
        <FileText className="h-4 w-4 animate-pulse" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
    </Button>
  );
}
