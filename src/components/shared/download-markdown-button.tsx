/**
 * Download Markdown Button Component
 *
 * Provides one-click download of markdown-formatted content as .md files.
 * Refactored to use BaseActionButton for consistency and reduced code duplication.
 *
 * October 2025 Production Standards:
 * - Leverages BaseActionButton for unified state management
 * - Server action with rate limiting (30 req/min)
 * - Proper file download handling
 * - Toast notifications and loading states
 * - Accessibility compliant
 *
 * @module components/shared/download-markdown-button
 */

'use client';

import { useAction } from 'next-safe-action/hooks';
import { BaseActionButton, BaseActionButtonIcon } from '@/src/components/shared/base-action-button';
import { downloadMarkdownAction } from '@/src/lib/actions/markdown-actions';
import { getDownloadMarkdownEvent } from '@/src/lib/analytics/event-mapper';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { Download } from '@/src/lib/icons';

/**
 * Props for DownloadMarkdownButton component
 */
export interface DownloadMarkdownButtonProps {
  category: string;
  slug: string;
  label?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  showIcon?: boolean;
}

/**
 * Button component for downloading markdown content as .md file
 *
 * Uses BaseActionButton for unified state management and UX.
 * Downloads always include full metadata and attribution footer.
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
  const { executeAsync, status } = useAction(downloadMarkdownAction);

  return (
    <BaseActionButton
      label={label}
      loadingLabel="Downloading..."
      successLabel="Downloaded!"
      icon={Download}
      size={size}
      variant={variant}
      showIcon={showIcon}
      ariaLabel="Download as markdown file"
      ariaLabelSuccess="File downloaded"
      componentName="DownloadMarkdownButton"
      {...(className && { className })}
      onClick={async ({ setLoading, setSuccess, showSuccess, showError, logError }) => {
        if (status === 'executing') return;

        setLoading(true);

        try {
          // executeAsync returns a Promise with the action's result
          const result = await executeAsync({ category, slug });

          // next-safe-action properly infers the type from the action's return
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

            setSuccess(true);
            showSuccess('Downloaded successfully!', `Saved as ${result.data.filename}`);

            // Track analytics event
            const eventName = getDownloadMarkdownEvent(category);
            trackEvent(eventName, {
              slug,
              filename: result.data.filename,
              file_size: blob.size,
            });
          } else {
            throw new Error(result?.data?.error || 'Failed to generate markdown');
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logError('Download markdown action failed', err, { category, slug });
          showError('Failed to download', err.message);
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}

/**
 * Compact icon-only variant of DownloadMarkdownButton
 */
export function DownloadMarkdownButtonIcon({
  category,
  slug,
  className,
  variant = 'ghost',
}: Omit<DownloadMarkdownButtonProps, 'label' | 'size' | 'showIcon'>) {
  const { executeAsync, status } = useAction(downloadMarkdownAction);

  return (
    <BaseActionButtonIcon
      icon={Download}
      variant={variant}
      ariaLabel="Download as markdown file"
      ariaLabelSuccess="File downloaded"
      title="Download Markdown"
      componentName="DownloadMarkdownButtonIcon"
      {...(className && { className })}
      onClick={async ({ setLoading, setSuccess, showSuccess, showError, logError }) => {
        if (status === 'executing') return;

        setLoading(true);

        try {
          // executeAsync returns a Promise with the action's result
          const result = await executeAsync({ category, slug });

          // next-safe-action properly infers the type from the action's return
          if (result?.data?.success && result.data.markdown && result.data.filename) {
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

            setSuccess(true);
            showSuccess('Downloaded!');

            // Track analytics event
            const eventName = getDownloadMarkdownEvent(category);
            trackEvent(eventName, {
              slug,
              filename: result.data.filename,
              file_size: blob.size,
            });
          } else {
            throw new Error(result?.data?.error || 'Download failed');
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logError('Download markdown failed', err, { category, slug });
          showError('Failed to download');
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}
