'use client';

/**
 * DetailHeader - Header section for unified detail pages
 *
 * Extracts header rendering logic from unified-detail-page.tsx (lines 512-614)
 * Handles: Back navigation, title, description, badges, action buttons
 *
 * @see components/unified-detail-page.tsx - Original implementation
 */

import { ArrowLeft, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type { UnifiedContentItem } from '@/lib/schemas';
import { nonEmptyString } from '@/lib/schemas/primitives';
import type { ContentTypeConfig } from '@/lib/types/content-type-config';

/**
 * Schema for DetailHeader props using primitives
 */
const detailHeaderPropsSchema = z.object({
  displayTitle: nonEmptyString,
  item: z.custom<UnifiedContentItem>(),
  config: z.custom<ContentTypeConfig>(),
  onCopyContent: z.function().optional(),
});

export type DetailHeaderProps = z.infer<typeof detailHeaderPropsSchema>;

/**
 * DetailHeader Component
 *
 * Renders the header section with back button, title, description, badges, and action buttons
 */
export const DetailHeader = memo(function DetailHeader({
  displayTitle,
  item,
  config,
  onCopyContent,
}: DetailHeaderProps) {
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

  const hasContent =
    ('content' in item && typeof (item as { content?: string }).content === 'string') ||
    ('configuration' in item && (item as { configuration?: object }).configuration);

  return (
    <div className="border-b border-border/50 bg-card/30">
      <div className="container mx-auto px-4 py-8">
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
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {item.description}
              </p>
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
      </div>
    </div>
  );
});
