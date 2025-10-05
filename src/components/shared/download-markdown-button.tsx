/**
 * Download Markdown Button Component
 *
 * Provides one-click download of markdown-formatted content as .md files.
 * Uses next-safe-action for server-side markdown generation with caching.
 *
 * October 2025 Production Standards:
 * - Server action with rate limiting (30 req/min)
 * - Proper file download handling
 * - Toast notifications and loading states
 * - Accessibility compliant
 * - Consistent with existing button patterns
 *
 * @module components/shared/download-markdown-button
 */

'use client';

import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { toast } from '@/src/components/ui/sonner';
import { downloadMarkdownAction } from '@/src/lib/actions/markdown-actions';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { Check, Download } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { cn } from '@/src/lib/utils';

/**
 * Props for DownloadMarkdownButton component
 */
export interface DownloadMarkdownButtonProps {
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
   * @default "Download Markdown"
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
   * Whether to show the Download icon
   * @default true
   */
  showIcon?: boolean;
}

/**
 * Button component for downloading markdown content as .md file
 *
 * Uses next-safe-action server action with built-in rate limiting.
 * Downloads always include full metadata and attribution footer.
 *
 * @param props - Component props
 * @returns Button that triggers markdown file download
 *
 * @example
 * ```tsx
 * <DownloadMarkdownButton
 *   category="agents"
 *   slug="api-builder-agent"
 *   label="Download as Markdown"
 * />
 * ```
 */
export function DownloadMarkdownButton({
  category,
  slug,
  label = 'Download Markdown',
  size = 'sm',
  variant = 'outline',
  className,
  showIcon = true,
}: DownloadMarkdownButtonProps) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Use next-safe-action hook
  const { execute, status } = useAction(downloadMarkdownAction, {
    onSuccess: (result) => {
      if (result.data?.success && result.data.markdown && result.data.filename) {
        // Create blob and download
        const blob = new Blob([result.data.markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsDownloaded(true);

        // Show success toast
        toast.success('Downloaded successfully!', {
          description: `Saved as ${result.data.filename}`,
          duration: 3000,
        });

        // Track analytics event
        trackEvent(EVENTS.DOWNLOAD_MARKDOWN, {
          content_category: category,
          content_slug: slug,
          filename: result.data.filename,
          file_size: blob.size,
        });

        // Reset state after 2 seconds
        setTimeout(() => {
          setIsDownloaded(false);
        }, 2000);
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
            : 'Failed to download';

      logger.error('Download markdown action failed', new Error(errorMessage), {
        component: 'DownloadMarkdownButton',
        category,
        slug,
      });

      toast.error('Failed to download', {
        description: errorMessage,
        duration: 4000,
      });
    },
  });

  /**
   * Handle download button click
   */
  const handleDownload = async () => {
    if (isExecuting || isDownloaded || status === 'executing') return;

    setIsExecuting(true);

    try {
      await execute({
        category,
        slug,
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
      onClick={handleDownload}
      disabled={isLoading || isDownloaded}
      className={cn(
        'gap-2 transition-all',
        isDownloaded && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
      aria-label={isDownloaded ? 'File downloaded' : 'Download as markdown file'}
    >
      {showIcon &&
        (isDownloaded ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : isLoading ? (
          <Download className="h-4 w-4 animate-pulse" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        ))}
      <span className="text-sm">
        {isDownloaded ? 'Downloaded!' : isLoading ? 'Downloading...' : label}
      </span>
    </Button>
  );
}

/**
 * Compact icon-only variant of DownloadMarkdownButton
 *
 * @param props - Component props (excluding size)
 * @returns Icon button for downloading markdown
 *
 * @example
 * ```tsx
 * <DownloadMarkdownButtonIcon category="agents" slug="code-reviewer" />
 * ```
 */
export function DownloadMarkdownButtonIcon({
  category,
  slug,
  className,
  variant = 'ghost',
}: Omit<DownloadMarkdownButtonProps, 'label' | 'size' | 'showIcon'>) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const { execute, status } = useAction(downloadMarkdownAction, {
    onSuccess: (result) => {
      if (result.data?.success && result.data.markdown && result.data.filename) {
        const blob = new Blob([result.data.markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsDownloaded(true);
        toast.success('Downloaded!');

        // Track analytics event
        trackEvent(EVENTS.DOWNLOAD_MARKDOWN, {
          content_category: category,
          content_slug: slug,
          filename: result.data.filename,
          file_size: blob.size,
        });

        setTimeout(() => setIsDownloaded(false), 2000);
      } else {
        throw new Error(result.data?.error || 'Download failed');
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
            : 'Failed to download';

      logger.error('Download markdown failed', new Error(errorMessage), {
        component: 'DownloadMarkdownButtonIcon',
        category,
        slug,
      });
      toast.error('Failed to download');
    },
  });

  const handleDownload = async () => {
    if (isExecuting || isDownloaded || status === 'executing') return;

    setIsExecuting(true);
    try {
      await execute({ category, slug });
    } finally {
      setIsExecuting(false);
    }
  };

  const isLoading = status === 'executing' || isExecuting;

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleDownload}
      disabled={isLoading || isDownloaded}
      className={cn(
        'transition-all',
        isDownloaded && 'border-green-500/50 bg-green-500/10 text-green-400',
        className
      )}
      aria-label="Download as markdown file"
      title="Download Markdown"
    >
      {isDownloaded ? (
        <Check className="h-4 w-4" />
      ) : isLoading ? (
        <Download className="h-4 w-4 animate-pulse" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}
