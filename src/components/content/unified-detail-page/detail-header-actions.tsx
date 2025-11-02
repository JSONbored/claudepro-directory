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
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedButton } from '@/src/components/domain/unified-button';
import type { CopyType } from '@/src/components/features/growth/unified-newsletter-capture';
import { Button } from '@/src/components/primitives/button';
import { useCopyWithEmailCapture } from '@/src/hooks/use-copy-with-email-capture';
import { trackInteraction } from '@/src/lib/actions/analytics.actions';
import type { CategoryId } from '@/src/lib/config/category-config';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { ArrowLeft, Check, Copy } from '@/src/lib/icons';
import { toasts } from '@/src/lib/utils/toast.utils';

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

    // Track user interaction for analytics and personalization
    trackInteraction({
      interaction_type: 'copy',
      content_type: category,
      content_slug: item.slug,
    }).catch(() => {});
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
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main content header */}
      <div className={'flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'}>
        <div className="flex-1">
          <div className={'mb-4 flex items-center gap-3'}>
            <UnifiedBadge variant="base" style="secondary" className={'font-medium text-xs'}>
              {typeName}
            </UnifiedBadge>
            <UnifiedBadge variant="base" style="outline" className="text-xs">
              {category}
            </UnifiedBadge>
          </div>

          <h1 className={'mb-4 font-bold text-4xl tracking-tight'}>{displayTitle}</h1>

          {item.description && (
            <p className={'mb-6 text-muted-foreground text-xl leading-relaxed'}>
              {item.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className={'flex flex-col gap-3 sm:flex-row'}>
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
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Content
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Copy for AI button */}
          <UnifiedButton
            variant="copy-llms"
            llmsTxtUrl={`/${category}/${item.slug}/llms.txt`}
            category={category}
            slug={item.slug}
            contentId={item.id}
            buttonVariant="outline"
            size="default"
            className="min-w-0"
          />

          {/* Copy as Markdown button */}
          <UnifiedButton
            variant="copy-markdown"
            category={category}
            slug={item.slug}
            buttonVariant="outline"
            size="default"
            className="min-w-0"
          />

          {/* Download Markdown button */}
          <UnifiedButton
            variant="download-markdown"
            category={category}
            slug={item.slug}
            buttonVariant="outline"
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
