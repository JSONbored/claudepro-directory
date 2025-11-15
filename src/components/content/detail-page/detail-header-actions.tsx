'use client';

/**
 * DetailHeaderActions - Client Component for interactive header buttons
 *
 * SPLIT FROM: detail-header.tsx - Isolated client-side interactivity
 * Handles: Back navigation, copy button, primary/secondary actions
 *
 * This component contains all interactive logic (useState, useRouter, onClick handlers)
 * while the parent DetailHeader remains a server component for static content
 *
 * Performance: Only the interactive buttons are client-side, rest is server-rendered
 */

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ContentActionButton } from '@/src/components/core/buttons/shared/content-action-button';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { usePostCopyEmail } from '@/src/components/core/infra/providers/email-capture-modal-provider';
import { Button } from '@/src/components/primitives/ui/button';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { useCopyWithEmailCapture } from '@/src/hooks/use-copy-with-email-capture';
import { trackUsage } from '@/src/lib/actions/content.actions';
import type { CategoryId } from '@/src/lib/data/config/category';
import type { ContentItem } from '@/src/lib/data/content';
import { trackInteraction } from '@/src/lib/edge/client';
import { ArrowLeft, Check, Copy, Download, FileText, Sparkles } from '@/src/lib/icons';
import { STATE_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';
import { logUnhandledPromise } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { CopyType } from '@/src/types/database-overrides';

/**
 * Determine copy type based on content item structure
 */
function determineCopyType(item: ContentItem): CopyType {
  // Check if item has content or configuration (indicates code/config copy)
  if ('content' in item && item.content) return 'code';
  if ('configuration' in item && item.configuration) return 'code';
  // Default to link for other types
  return 'link';
}

/**
 * Serializable action data for client component
 */
export interface SerializableAction {
  label: string;
  type: string; // 'deploy', 'copy', 'view', etc.
}

export interface DetailHeaderActionsProps {
  item: ContentItem;
  typeName: string;
  category: CategoryId;
  hasContent: boolean;
  displayTitle: string;
  primaryAction: SerializableAction;
  secondaryActions?: SerializableAction[];
  onCopyContent?: (() => Promise<void>) | undefined;
}

/**
 * DetailHeaderActions Component (Client Component)
 *
 * Interactive action buttons for the detail header
 * - Back button with router navigation
 * - Copy button with state and toast notifications
 * - Primary and secondary action buttons with click handlers
 */
export function DetailHeaderActions({
  item,
  typeName,
  category,
  hasContent,
  displayTitle,
  primaryAction,
  secondaryActions,
  onCopyContent,
}: DetailHeaderActionsProps) {
  const router = useRouter();
  const referrer = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const { copy: copyToClipboard } = useCopyToClipboard();
  const { showModal } = usePostCopyEmail();
  const { copied, copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: determineCopyType(item),
      category,
      slug: item.slug,
      ...(referrer && { referrer }),
    },
    onSuccess: () => {
      toasts.raw.success('Copied!', {
        description: `${typeName} content has been copied to your clipboard.`,
      });
    },
    onError: () => {
      toasts.raw.error('Copy failed', {
        description: 'Unable to copy content to clipboard.',
      });
    },
    context: {
      component: 'detail-header-actions',
      action: 'copy-content',
    },
  });

  const handleCopyContent = async () => {
    if (onCopyContent) {
      await onCopyContent();
      return;
    }

    // Default copy logic
    const contentToCopy =
      ('content' in item ? (item as { content?: string }).content : '') ??
      ('configuration' in item
        ? typeof (item as unknown as { configuration?: unknown }).configuration === 'string'
          ? (item as unknown as { configuration?: string }).configuration
          : JSON.stringify((item as unknown as { configuration?: unknown }).configuration, null, 2)
        : '') ??
      '';

    await copy(contentToCopy);

    trackInteraction({
      interaction_type: 'copy',
      content_type: category,
      content_slug: item.slug,
    }).catch((error) => {
      logUnhandledPromise('trackInteraction:copy-content', error, {
        slug: item.slug,
        category,
      });
    });
  };

  // Handle action clicks based on type
  const handleActionClick = (action: SerializableAction) => {
    // Handle download action - check for storage_url
    if (action.type === 'download' && 'storage_url' in item && item.storage_url) {
      window.location.href = item.storage_url;
      toasts.raw.success('Download started!', {
        description: `Downloading ${item.title || item.slug} package...`,
      });

      trackInteraction({
        interaction_type: 'download',
        content_type: category,
        content_slug: item.slug,
      }).catch((error) => {
        logUnhandledPromise('trackInteraction:download', error, {
          slug: item.slug,
          category,
        });
      });
      return;
    }

    // Generic toast for other action types
    toasts.raw.success(`${action.label}`, {
      description: `Copy the ${typeName.toLowerCase()} content and follow the installation instructions.`,
    });
  };

  return (
    <>
      {/* Back navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className={`text-muted-foreground ${STATE_PATTERNS.HOVER_TEXT_FOREGROUND}`}
        >
          <ArrowLeft className={UI_CLASSES.ICON_SM_LEADING} />
          Back
        </Button>
      </div>

      {/* Main content header */}
      <div className={`${UI_CLASSES.FLEX_COL_GAP_6} lg:flex-row lg:items-start lg:justify-between`}>
        <div className="flex-1">
          <div className={'mb-4 flex items-center gap-3'}>
            <UnifiedBadge
              variant="base"
              style="secondary"
              className={`${UI_CLASSES.TEXT_BADGE} font-medium`}
            >
              {typeName}
            </UnifiedBadge>
            <UnifiedBadge variant="base" style="outline" className={UI_CLASSES.TEXT_BADGE}>
              {category}
            </UnifiedBadge>
          </div>

          <h1 className={`mb-4 ${UI_CLASSES.HEADING_H1}`}>{displayTitle}</h1>

          {item.description && (
            <p className={`mb-6 ${UI_CLASSES.TEXT_BODY_LG} text-muted-foreground`}>
              {item.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          <Button onClick={() => handleActionClick(primaryAction)} className="min-w-0">
            {primaryAction.label}
          </Button>

          {hasContent && (
            <motion.div
              animate={copied ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Button variant="outline" onClick={handleCopyContent} className="min-w-0">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className={UI_CLASSES.ICON_SM_LEADING} />
                    Copy Content
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Copy for AI button */}
          <ContentActionButton
            url={`/${category}/${item.slug}/llms.txt`}
            action={async (content) => {
              await copyToClipboard(content);
            }}
            label="Copy for AI"
            successMessage="Copied llms.txt to clipboard!"
            icon={Sparkles}
            trackAnalytics={async () => {
              await trackUsage({
                content_type: category,
                content_slug: item.slug,
                action_type: 'llmstxt',
              });
            }}
            variant="outline"
            size="default"
            className="min-w-0"
          />

          {/* Copy as Markdown button */}
          <ContentActionButton
            url={`/${category}/${item.slug}.md?include_metadata=true&include_footer=false`}
            action={async (content) => {
              await copyToClipboard(content);
              showModal({
                copyType: 'markdown',
                category,
                slug: item.slug,
                ...(referrer && { referrer }),
              });
            }}
            label="Copy Markdown"
            successMessage="Copied markdown to clipboard!"
            icon={FileText}
            trackAnalytics={async () => {
              await trackUsage({
                content_type: category,
                content_slug: item.slug,
                action_type: 'copy',
              });
            }}
            variant="outline"
            size="default"
            className="min-w-0"
          />

          {/* Download Markdown button */}
          <ContentActionButton
            url={`/${category}/${item.slug}.md`}
            action={async (content) => {
              const blob = new Blob([content], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${item.slug}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            label="Download"
            successMessage="Downloaded markdown file!"
            icon={Download}
            trackAnalytics={async () => {
              await trackUsage({
                content_type: category,
                content_slug: item.slug,
                action_type: 'download_markdown',
              });
            }}
            variant="outline"
            size="default"
            className="min-w-0"
          />

          {secondaryActions?.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={() => handleActionClick(action)}
              className="min-w-0"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
