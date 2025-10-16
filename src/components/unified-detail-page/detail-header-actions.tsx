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

import { useRouter } from 'next/navigation';
import { CopyLLMsButton } from '@/src/components/shared/copy-llms-button';
import { CopyMarkdownButton } from '@/src/components/shared/copy-markdown-button';
import { DownloadMarkdownButton } from '@/src/components/shared/download-markdown-button';
import type { CopyType } from '@/src/components/shared/post-copy-email-modal';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { useCopyWithEmailCapture } from '@/src/hooks/use-copy-with-email-capture';
import { ArrowLeft, Copy } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { toasts } from '@/src/lib/utils/toast.utils';

/**
 * Determine copy type based on content item structure
 */
function determineCopyType(item: UnifiedContentItem): CopyType {
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
  item: UnifiedContentItem;
  typeName: string;
  category: string;
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
  };

  // Handle action clicks based on type
  const handleActionClick = (action: SerializableAction) => {
    // Generic toast for all action types
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
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Main content header */}
      <div className={'flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'}>
        <div className="flex-1">
          <div className={'flex items-center gap-3 mb-4'}>
            <Badge variant="secondary" className={'text-xs font-medium'}>
              {typeName}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
          </div>

          <h1 className={'text-4xl font-bold tracking-tight mb-4'}>{displayTitle}</h1>

          {item.description && (
            <p className={'text-xl text-muted-foreground mb-6 leading-relaxed'}>
              {item.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className={'flex flex-col sm:flex-row gap-3'}>
          <Button onClick={() => handleActionClick(primaryAction)} className="min-w-0">
            {primaryAction.label}
          </Button>

          {hasContent && (
            <Button variant="outline" onClick={handleCopyContent} className="min-w-0">
              {copied ? (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </>
              )}
            </Button>
          )}

          {/* Copy for AI button */}
          <CopyLLMsButton
            llmsTxtUrl={`/${category}/${item.slug}/llms.txt`}
            variant="outline"
            size="default"
            className="min-w-0"
          />

          {/* Copy as Markdown button */}
          <CopyMarkdownButton
            category={category}
            slug={item.slug}
            variant="outline"
            size="default"
            className="min-w-0"
          />

          {/* Download Markdown button */}
          <DownloadMarkdownButton
            category={category}
            slug={item.slug}
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
