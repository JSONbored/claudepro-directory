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
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { ArrowLeft, Copy } from '@/lib/icons';
import type { UnifiedContentItem } from '@/lib/schemas/component.schema';
import type { ContentTypeConfig } from '@/lib/types/content-type-config';
import { UI_CLASSES } from '@/lib/ui-constants';

export interface DetailHeaderActionsProps {
  item: UnifiedContentItem;
  config: ContentTypeConfig;
  hasContent: boolean;
  displayTitle: string;
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
  config,
  hasContent,
  displayTitle,
  onCopyContent,
}: DetailHeaderActionsProps) {
  const router = useRouter();
  const { copied, copy } = useCopyToClipboard({
    onSuccess: () => {
      toast.success('Copied!', {
        description: `${config.typeName} content has been copied to your clipboard.`,
      });
    },
    onError: () => {
      toast.error('Copy failed', {
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

  return (
    <>
      {/* Back navigation */}
      <div className={UI_CLASSES.MB_6}>
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
      <div
        className={`${UI_CLASSES.FLEX_COL} lg:flex-row lg:${UI_CLASSES.ITEMS_START} lg:${UI_CLASSES.JUSTIFY_BETWEEN} ${UI_CLASSES.GAP_6}`}
      >
        <div className={UI_CLASSES.FLEX_1}>
          <div className={`flex items-center ${UI_CLASSES.GAP_3} ${UI_CLASSES.MB_4}`}>
            <Badge variant="secondary" className={`${UI_CLASSES.TEXT_XS} font-medium`}>
              {config.typeName}
            </Badge>
            <Badge variant="outline" className={UI_CLASSES.TEXT_XS}>
              {item.category}
            </Badge>
          </div>

          <h1 className={`text-4xl ${UI_CLASSES.FONT_BOLD} tracking-tight ${UI_CLASSES.MB_4}`}>
            {displayTitle}
          </h1>

          {item.description && (
            <p className={`text-xl text-muted-foreground ${UI_CLASSES.MB_6} leading-relaxed`}>
              {item.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className={`${UI_CLASSES.FLEX_COL} sm:flex-row ${UI_CLASSES.GAP_3}`}>
          <Button onClick={() => config.primaryAction.handler(item)} className={UI_CLASSES.MIN_W_0}>
            {config.primaryAction.icon}
            {config.primaryAction.label}
          </Button>

          {hasContent && (
            <Button variant="outline" onClick={handleCopyContent} className={UI_CLASSES.MIN_W_0}>
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

          {config.secondaryActions?.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={() => action.handler(item)}
              className={UI_CLASSES.MIN_W_0}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
