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
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { ArrowLeft, Copy } from '@/lib/icons';
import type { UnifiedContentItem } from '@/lib/schemas/component.schema';
import type { ContentTypeConfig } from '@/lib/types/content-type-config';

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
  const [copied, setCopied] = useState(false);

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

    const success = await copyToClipboard(contentToCopy, {
      component: 'detail-header',
      action: 'copy-content',
    });

    setCopied(true);
    if (success) {
      toast.success('Copied!', {
        description: `${config.typeName} content has been copied to your clipboard.`,
      });
    } else {
      toast.error('Copy failed', {
        description: 'Unable to copy content to clipboard.',
      });
    }
    setTimeout(() => setCopied(false), 2000);
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
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="text-xs font-medium">
              {config.typeName}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-4">{displayTitle}</h1>

          {item.description && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{item.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => config.primaryAction.handler(item)} className="min-w-0">
            {config.primaryAction.icon}
            {config.primaryAction.label}
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

          {config.secondaryActions?.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={() => action.handler(item)}
              className="min-w-0"
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
