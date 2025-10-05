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
import { CopyLLMsButton } from '@/src/components/shared/copy-llms-button';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { ArrowLeft, Copy } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
  const { copied, copy } = useCopyToClipboard({
    onSuccess: () => {
      toast.success('Copied!', {
        description: `${typeName} content has been copied to your clipboard.`,
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

  // Handle action clicks based on type
  const handleActionClick = (action: SerializableAction) => {
    // Generic toast for all action types
    toast.success(`${action.label}`, {
      description: `Copy the ${typeName.toLowerCase()} content and follow the installation instructions.`,
    });
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
              {typeName}
            </Badge>
            <Badge variant="outline" className={UI_CLASSES.TEXT_XS}>
              {category}
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
          <Button onClick={() => handleActionClick(primaryAction)} className={UI_CLASSES.MIN_W_0}>
            {primaryAction.label}
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

          {/* Copy for AI button */}
          <CopyLLMsButton
            llmsTxtUrl={`/${category}/${item.slug}/llms.txt`}
            variant="outline"
            size="default"
            className={UI_CLASSES.MIN_W_0}
          />

          {secondaryActions?.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={() => handleActionClick(action)}
              className={UI_CLASSES.MIN_W_0}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
