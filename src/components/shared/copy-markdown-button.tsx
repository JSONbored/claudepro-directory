/**
 * Copy Markdown Button Component
 *
 * Provides one-click copying of markdown-formatted content using next-safe-action.
 * Refactored to use BaseActionButton for consistency and reduced code duplication.
 *
 * October 2025 Production Standards:
 * - Leverages BaseActionButton for unified state management
 * - Uses copyMarkdownAction server action (rate-limited)
 * - Consistent UI patterns with other action buttons
 * - Toast notifications and loading states
 * - Accessibility compliant
 *
 * @module components/shared/copy-markdown-button
 */

'use client';

import { useAction } from 'next-safe-action/hooks';
import { BaseActionButton, BaseActionButtonIcon } from '@/src/components/shared/base-action-button';
import { useCopyWithEmailCapture } from '@/src/hooks/use-copy-with-email-capture';
import { copyMarkdownAction } from '@/src/lib/actions/markdown-actions';
import { getCopyMarkdownEvent } from '@/src/lib/analytics/event-mapper';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { FileText } from '@/src/lib/icons';

/**
 * Props for CopyMarkdownButton component
 */
export interface CopyMarkdownButtonProps {
  category: string;
  slug: string;
  label?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  showIcon?: boolean;
  includeMetadata?: boolean;
  includeFooter?: boolean;
}

/**
 * Button component for copying markdown content to clipboard
 *
 * Uses BaseActionButton for unified state management and UX.
 * Integrates with server action and email capture hook.
 *
 * @param props - Component props
 * @returns Button that fetches markdown and copies to clipboard
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
  const referrer = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const { copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: 'markdown',
      category,
      slug,
      ...(referrer ? { referrer } : {}),
    },
    context: {
      component: 'CopyMarkdownButton',
      action: 'copy_markdown',
    },
  });

  const { executeAsync, status } = useAction(copyMarkdownAction);

  return (
    <BaseActionButton
      label={label}
      loadingLabel="Loading..."
      successLabel="Copied!"
      icon={FileText}
      size={size}
      variant={variant}
      showIcon={showIcon}
      ariaLabel="Copy as markdown"
      ariaLabelSuccess="Markdown copied"
      componentName="CopyMarkdownButton"
      {...(className && { className })}
      onClick={async ({ setLoading, setSuccess, showSuccess, showError, logError }) => {
        if (status === 'executing') return;

        setLoading(true);

        try {
          // executeAsync returns a Promise with the action's result
          const result = await executeAsync({
            category,
            slug,
            includeMetadata,
            includeFooter,
          });

          // next-safe-action properly infers the type from the action's return
          if (result?.data?.success && result.data.markdown) {
            await copy(result.data.markdown);
            setSuccess(true);
            showSuccess('Copied to clipboard!', 'Markdown content ready to paste');

            // Track analytics event
            const eventName = getCopyMarkdownEvent(category);
            trackEvent(eventName, {
              slug,
              include_metadata: includeMetadata,
              include_footer: includeFooter,
              content_length: result.data.markdown.length,
            });
          } else {
            throw new Error(result?.data?.error || 'Failed to generate markdown');
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logError('Copy markdown action failed', err, { category, slug });
          showError('Failed to copy markdown', err.message);
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}

/**
 * Compact icon-only variant of CopyMarkdownButton
 */
export function CopyMarkdownButtonIcon({
  category,
  slug,
  className,
  variant = 'ghost',
  includeMetadata = true,
  includeFooter = false,
}: Omit<CopyMarkdownButtonProps, 'label' | 'size' | 'showIcon'>) {
  const referrer = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const { copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: 'markdown',
      category,
      slug,
      ...(referrer ? { referrer } : {}),
    },
    context: {
      component: 'CopyMarkdownButtonIcon',
      action: 'copy_markdown',
    },
  });

  const { executeAsync, status } = useAction(copyMarkdownAction);

  return (
    <BaseActionButtonIcon
      icon={FileText}
      variant={variant}
      ariaLabel="Copy as markdown"
      ariaLabelSuccess="Markdown copied"
      title="Copy as Markdown"
      componentName="CopyMarkdownButtonIcon"
      {...(className && { className })}
      onClick={async ({ setLoading, setSuccess, showSuccess, showError, logError }) => {
        if (status === 'executing') return;

        setLoading(true);

        try {
          // executeAsync returns a Promise with the action's result
          const result = await executeAsync({ category, slug, includeMetadata, includeFooter });

          // next-safe-action properly infers the type from the action's return
          if (result?.data?.success && result.data.markdown) {
            await copy(result.data.markdown);
            setSuccess(true);
            showSuccess('Copied as Markdown!');

            // Track analytics event
            const eventName = getCopyMarkdownEvent(category);
            trackEvent(eventName, {
              slug,
              include_metadata: includeMetadata,
              include_footer: includeFooter,
              content_length: result.data.markdown.length,
            });
          } else {
            throw new Error(result?.data?.error || 'Failed to generate markdown');
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logError('Copy markdown failed', err, { category, slug });
          showError('Failed to copy');
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}
