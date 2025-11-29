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

import { Constants } from '@heyclaude/database-types';
import { logger } from '@heyclaude/web-runtime/core';

/**
 * Sanitizes path segment to prevent SSRF/path traversal.
 * Allows a-z, A-Z, 0-9, dash, underscore, dot, NO slash or backslash.
 * Returns null if invalid to allow graceful fallback instead of crashing.
 * Used to construct safe URLs.
 */
function sanitizePathSegment(segment: string): string | null {
  // Only allow a-z, A-Z, 0-9, dash, underscore, dot.
  // No slashes, no backslashes, no semicolon, no control chars.
  // Length restricted to 1-64 characters.
  const SAFE_SEGMENT_REGEX = /^[a-zA-Z0-9._-]{1,64}$/;
  if (!SAFE_SEGMENT_REGEX.test(segment)) {
    return null;
  }
  return segment;
}

import type { Database } from '@heyclaude/database-types';
import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { useCopyToClipboard, usePulse } from '@heyclaude/web-runtime/hooks';
import {
  ArrowLeft,
  Bookmark,
  BookmarkPlus,
  Check,
  Copy,
  Download,
  FileText,
  Sparkles,
} from '@heyclaude/web-runtime/icons';
import type { ContentItem, CopyType } from '@heyclaude/web-runtime/types/component.types';
import { STATE_PATTERNS, toasts, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ContentActionButton } from '@/src/components/core/buttons/shared/content-action-button';
import { ShareMenu } from '@/src/components/core/buttons/social/share-menu';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { usePostCopyEmail } from '@/src/components/core/infra/providers/email-capture-modal-provider';
import { usePinboardDrawer } from '@/src/components/features/navigation/pinboard-drawer-provider';
import { Button } from '@heyclaude/web-runtime/ui';
import { useCopyWithEmailCapture } from '@/src/hooks/use-copy-with-email-capture';
import { usePinboard } from '@heyclaude/web-runtime/hooks';

/**
 * Determine copy type based on content item structure
 */
function determineCopyType(
  item:
    | ContentItem
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        ContentItem)
): CopyType {
  // Handle Json type - cast to ContentItem for property access
  const contentItem = item as ContentItem;

  // Check if item has content or configuration (indicates code/config copy)
  if ('content' in contentItem && contentItem.content) return 'code';
  if ('configuration' in contentItem && contentItem.configuration) return 'code';
  // Default to link for other types
  return 'link';
}

/**
 * Safely extracts content or configuration from item as a string for copying
 * Returns null if no usable content exists (prevents copying empty strings)
 */
function getContentForCopy(
  item:
    | ContentItem
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        ContentItem)
): string | null {
  // Handle Json type - cast to ContentItem for property access
  const contentItem = item as ContentItem;

  // Check for content first
  if (
    'content' in contentItem &&
    typeof contentItem.content === 'string' &&
    contentItem.content.trim().length > 0
  ) {
    return contentItem.content;
  }

  // Fall back to configuration
  if ('configuration' in contentItem) {
    const cfg = contentItem.configuration;
    if (typeof cfg === 'string' && cfg.trim().length > 0) return cfg;
    if (cfg != null) {
      const jsonStr = JSON.stringify(cfg, null, 2);
      if (jsonStr.trim().length > 0) return jsonStr;
    }
  }

  return null;
}

/**
 * Serializable action data for client component
 *
 * Action types used in the codebase:
 * - 'download': Downloads a file (handled specially in handleActionClick)
 * - 'scroll': Scrolls to a section
 * - 'github_link': Links to GitHub
 * - 'notification': Shows a notification
 * - 'copy_command': Copies a command
 * - 'copy_script': Copies a script
 * - 'deploy': Default fallback action
 * - 'info': Generic info action
 * - 'custom': Custom action type
 */
export type SerializableActionType =
  | 'download'
  | 'scroll'
  | 'github_link'
  | 'notification'
  | 'copy_command'
  | 'copy_script'
  | 'deploy'
  | 'info'
  | 'custom';

export interface SerializableAction {
  label: string;
  type: SerializableActionType;
}

export interface DetailHeaderActionsProps {
  item:
    | ContentItem
    | Database['public']['Functions']['get_content_detail_complete']['Returns']['content'];
  typeName: string;
  category: Database['public']['Enums']['content_category'];
  hasContent: boolean;
  displayTitle: string;
  primaryAction: SerializableAction;
  secondaryActions?: SerializableAction[];
  /**
   * Optional custom copy handler.
   *
   * NOTE: If provided, this completely replaces the default copy behavior.
   * The caller is responsible for:
   * - Triggering Pulse copy analytics (if desired)
   * - Showing the email capture modal (if desired)
   * - Handling clipboard operations
   * - Showing success/error toasts
   *
   * If you want to augment the default behavior rather than replace it,
   * consider using the default implementation and handling additional logic
   * in the component that uses DetailHeaderActions.
   */
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
  // Cast item to ContentItem for property access (content is Json type)
  const contentItem = item as ContentItem;

  const pulse = usePulse();
  const { copied, copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: determineCopyType(contentItem),
      category,
      slug: contentItem.slug,
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
  const { pinnedItems, togglePin, isPinned } = usePinboard();
  const { openDrawer: openPinboardDrawer } = usePinboardDrawer();
  const pinned = isPinned(category, contentItem.slug);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${category}/${contentItem.slug}`
      : '';

  const handleTogglePin = () => {
    // Capture state BEFORE toggling to show correct toast
    const wasPinned = pinned;

    const tags = Array.isArray((contentItem as { tags?: string[] }).tags)
      ? ((contentItem as { tags?: string[] }).tags ?? []).filter(
          (tag): tag is string => typeof tag === 'string'
        )
      : undefined;

    togglePin({
      category,
      slug: contentItem.slug,
      title: displayTitle || contentItem.title || contentItem.slug,
      typeName,
      description: contentItem.description ?? '',
      ...(tags ? { tags } : {}),
      thumbnailUrl:
        'thumbnail_url' in contentItem && typeof contentItem.thumbnail_url === 'string'
          ? contentItem.thumbnail_url
          : null,
    });

    if (wasPinned) {
      toasts.raw.success('Removed from pinboard', {
        description: 'This item was removed from your local pinboard.',
      });
    } else {
      toasts.raw.success('Pinned for later', {
        description: 'Saved locally—open the pinboard to revisit it anytime.',
        action: {
          label: 'View Pinboard',
          onClick: openPinboardDrawer,
        },
      });
    }
  };

  const handleCopyContent = async () => {
    if (onCopyContent) {
      await onCopyContent();
      return;
    }

    // Default copy logic
    const contentToCopy = getContentForCopy(contentItem);

    // Short-circuit if no content to copy
    if (!contentToCopy) {
      toasts.raw.error('Nothing to copy', {
        description: 'No content is available to copy.',
      });
      return;
    }

    await copy(contentToCopy);

    pulse.copy({ category, slug: contentItem.slug }).catch((error) => {
      logUnhandledPromise('trackInteraction:copy-content', error, {
        slug: contentItem.slug,
        category,
      });
    });
  };

  // Check if download is available for this item
  const hasMcpbDownload =
    category === Constants.public.Enums.content_category[1] && // 'mcp'
    'mcpb_storage_url' in contentItem &&
    contentItem.mcpb_storage_url &&
    typeof contentItem.mcpb_storage_url === 'string';

  const hasStorageDownload =
    category === Constants.public.Enums.content_category[6] && // 'skills'
    'storage_url' in contentItem &&
    contentItem.storage_url &&
    typeof contentItem.storage_url === 'string';

  const hasDownloadAvailable = hasMcpbDownload || hasStorageDownload;

  /**
   * Handle download for MCPB or Storage content
   */
  const handleDownload = (
    downloadType: 'mcpb' | 'zip',
    contentItem: ContentItem,
    category: Database['public']['Enums']['content_category'],
    pulse: ReturnType<typeof usePulse>
  ) => {
    const safeSlug = sanitizePathSegment(contentItem.slug);
    if (!safeSlug) {
      toasts.raw.error('Invalid content slug', {
        description: 'The download link is not available.',
      });
      return;
    }

    const downloadUrl =
      downloadType === 'mcpb'
        ? `/api/content/mcp/${safeSlug}?format=storage`
        : `/api/content/skills/${safeSlug}?format=storage`;

    window.location.href = downloadUrl;
    pulse
      .download({
        category,
        slug: contentItem.slug,
        action_type: downloadType === 'mcpb' ? 'download_mcpb' : 'download_zip',
      })
      .catch((error) => {
        logUnhandledPromise(
          downloadType === 'mcpb' ? 'trackInteraction:download_mcpb' : 'trackInteraction:download',
          error,
          {
            slug: contentItem.slug,
            category,
          }
        );
      });

    toasts.raw.success('Download started!', {
      description: `Downloading ${contentItem.title || contentItem.slug} package...`,
    });
  };

  // Handle action clicks based on type
  const handleActionClick = (action: SerializableAction) => {
    // Handle download action
    if (action.type === 'download') {
      // For MCP content, use edge function proxy for .mcpb files (ensures Cloudflare caching)
      if (hasMcpbDownload) {
        handleDownload('mcpb', contentItem, category, pulse);
        return;
      }

      // For Skills content, use direct storage URL
      if (hasStorageDownload) {
        handleDownload('zip', contentItem, category, pulse);
        return;
      }

      // Download action clicked but no download available
      toasts.raw.error('Download unavailable', {
        description: 'This package is not yet available for download.',
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
        <motion.div
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className={`text-muted-foreground ${STATE_PATTERNS.HOVER_TEXT_FOREGROUND}`}
          >
            <ArrowLeft className={UI_CLASSES.ICON_SM_LEADING} />
            Back
          </Button>
        </motion.div>
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

          {contentItem.description && (
            <p className={`mb-6 ${UI_CLASSES.TEXT_BODY_LG} text-muted-foreground`}>
              {contentItem.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          {/* Share Menu - multiple platform options */}
          <ShareMenu
            url={shareUrl}
            title={displayTitle}
            description={contentItem.description ?? undefined}
            utmCampaign={category}
            onShare={(platform) => {
              pulse.share({ platform, category, slug: contentItem.slug, url: shareUrl }).catch(() => {
                // Silent fail for analytics
              });
            }}
          />

          <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
            <Button
              variant={pinned ? 'secondary' : 'outline'}
              onClick={handleTogglePin}
              className="min-w-0"
            >
              {pinned ? (
                <>
                  <Bookmark className={UI_CLASSES.ICON_SM_LEADING} />
                  Pinned
                </>
              ) : (
                <>
                  <BookmarkPlus className={UI_CLASSES.ICON_SM_LEADING} />
                  Pin for later
                </>
              )}
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="ghost"
              className="min-w-0 justify-start border border-border/50 border-dashed"
              onClick={openPinboardDrawer}
            >
              <Bookmark className={UI_CLASSES.ICON_SM_LEADING} />
              View pinboard ({pinnedItems.length})
            </Button>
          </motion.div>

          {/* Primary action button - only show if not a download action, or if download is available */}
          {(!(primaryAction.type === 'download') || hasDownloadAvailable) && (
            <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
              <Button onClick={() => handleActionClick(primaryAction)} className="min-w-0">
                {primaryAction.label}
              </Button>
            </motion.div>
          )}

          {/* Conditional download button - show when download is available but primaryAction is not download */}
          {hasDownloadAvailable && primaryAction.type !== 'download' && (
            <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
              <Button
                onClick={() => {
                  if (hasMcpbDownload) {
                    handleDownload('mcpb', contentItem, category, pulse);
                  } else if (hasStorageDownload) {
                    handleDownload('zip', contentItem, category, pulse);
                  }
                }}
                className="min-w-0"
              >
                <Download className={UI_CLASSES.ICON_SM_LEADING} />
                {category === Constants.public.Enums.content_category[1] ? 'Download .mcpb' : 'Download'} {/* mcp */}
              </Button>
            </motion.div>
          )}

          {hasContent && (
            <motion.div
              whileTap={{ scale: 0.97 }}
              animate={copied ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Button variant="outline" onClick={handleCopyContent} className="min-w-0">
                {copied ? (
                  <>
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                    </motion.span>
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
          {(() => {
            const safeCategory = sanitizePathSegment(category);
            const safeSlug = sanitizePathSegment(contentItem.slug);
            if (!(safeCategory && safeSlug)) {
              // Log warning but don't crash - gracefully skip this button
              logger.warn('DetailHeaderActions: Invalid category or slug for AI copy button', {
                category,
                slug: contentItem.slug,
              });
              return null;
            }
            return (
              <ContentActionButton
                url={`/${safeCategory}/${safeSlug}/llms.txt`}
                action={async (content) => {
                  await copyToClipboard(content);
                }}
                label="Copy for AI"
                successMessage="Copied llms.txt to clipboard!"
                icon={Sparkles}
                trackAnalytics={async () => {
                  await pulse.copy({
                    category,
                    slug: contentItem.slug,
                    metadata: { action_type: 'llmstxt' },
                  });
                }}
                variant="outline"
                size="default"
                className="min-w-0"
              />
            );
          })()}

          {/* Copy as Markdown button */}
          {(() => {
            const safeCategory = sanitizePathSegment(category);
            const safeSlug = sanitizePathSegment(contentItem.slug);
            if (!(safeCategory && safeSlug)) {
              // Log warning but don't crash - gracefully skip this button
              logger.warn(
                'DetailHeaderActions: Invalid category or slug for Markdown copy button',
                {
                  category,
                  slug: contentItem.slug,
                }
              );
              return null;
            }
            return (
              <ContentActionButton
                url={`/${safeCategory}/${safeSlug}.md?include_metadata=true&include_footer=false`}
                action={async (content) => {
                  await copyToClipboard(content);
                  showModal({
                    copyType: 'markdown',
                    category,
                    slug: contentItem.slug,
                    ...(referrer && { referrer }),
                  });
                }}
                label="Copy Markdown"
                successMessage="Copied markdown to clipboard!"
                icon={FileText}
                trackAnalytics={async () => {
                  await pulse.copy({
                    category,
                    slug: contentItem.slug,
                    metadata: { action_type: 'copy' },
                  });
                }}
                variant="outline"
                size="default"
                className="min-w-0"
              />
            );
          })()}

          {/* Download Markdown button */}
          {(() => {
            const safeCategory = sanitizePathSegment(category);
            const safeSlug = sanitizePathSegment(contentItem.slug);
            if (!(safeCategory && safeSlug)) {
              // Log warning but don't crash - gracefully skip this button
              logger.warn(
                'DetailHeaderActions: Invalid category or slug for Markdown download button',
                {
                  category,
                  slug: contentItem.slug,
                }
              );
              return null;
            }
            return (
              <ContentActionButton
                url={`/${safeCategory}/${safeSlug}.md`}
                action={async (content) => {
                  const blob = new Blob([content], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${contentItem.slug}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                label="Download"
                successMessage="Downloaded markdown file!"
                icon={Download}
                trackAnalytics={async () => {
                  await pulse.download({
                    category,
                    slug: contentItem.slug,
                    action_type: 'download_markdown',
                  });
                }}
                variant="outline"
                size="default"
                className="min-w-0"
              />
            );
          })()}

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
