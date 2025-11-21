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

import { logger } from '@/src/lib/logger';

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

/**
 * Validate and sanitize Supabase storage URL for safe use in window.location.href
 * Only allows HTTPS URLs from Supabase storage domains
 * Returns canonicalized URL or null if invalid
 */
function getSafeStorageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());
    // Only allow HTTPS protocol
    if (parsed.protocol !== 'https:') return null;

    // Validate it's from Supabase storage
    // Supabase storage URLs typically have pattern: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    // Require BOTH valid Supabase hostname AND storage path
    const isSupabaseStorage =
      (parsed.hostname.endsWith('.supabase.co') || parsed.hostname.endsWith('.supabase.in')) &&
      parsed.pathname.startsWith('/storage/v1/object/public/');

    if (!isSupabaseStorage) return null;

    // Reject dangerous components
    if (parsed.username || parsed.password) return null;

    // Sanitize: remove credentials
    parsed.username = '';
    parsed.password = '';
    // Normalize hostname
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
    // Remove default ports
    if (parsed.port === '443') {
      parsed.port = '';
    }

    // Return canonicalized href
    return parsed.href;
  } catch {
    return null;
  }
}

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ContentActionButton } from '@/src/components/core/buttons/shared/content-action-button';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { usePostCopyEmail } from '@/src/components/core/infra/providers/email-capture-modal-provider';
import { Button } from '@/src/components/primitives/ui/button';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { useCopyWithEmailCapture } from '@/src/hooks/use-copy-with-email-capture';
import { usePulse } from '@/src/hooks/use-pulse';
import { ArrowLeft, Check, Copy, Download, FileText, Sparkles } from '@/src/lib/icons';
import type { ContentItem, CopyType } from '@/src/lib/types/component.types';
import { STATE_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';
import { logUnhandledPromise } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { Database } from '@/src/types/database.types';

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
    category === 'mcp' &&
    'mcpb_storage_url' in contentItem &&
    contentItem.mcpb_storage_url &&
    typeof contentItem.mcpb_storage_url === 'string';

  const hasStorageDownload =
    category === 'skills' &&
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
    if (downloadType === 'mcpb') {
      const safeSlug = sanitizePathSegment(contentItem.slug);
      if (!safeSlug) {
        toasts.raw.error('Invalid content slug', {
          description: 'The download link is not available.',
        });
        return;
      }

      const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
      if (!supabaseUrl) {
        toasts.raw.error('Configuration error', {
          description: 'Unable to generate download link.',
        });
        return;
      }

      // Use edge function proxy for cached egress (critical for cost optimization)
      const downloadUrl = `${supabaseUrl}/functions/v1/data-api/content/mcp/${safeSlug}?format=storage`;
      window.location.href = downloadUrl;
      pulse
        .download({ category, slug: contentItem.slug, action_type: 'download_mcpb' })
        .catch((error) => {
          logUnhandledPromise('trackInteraction:download_mcpb', error, {
            slug: contentItem.slug,
            category,
          });
        });
    } else {
      // For Skills content, use direct storage URL
      const safeStorageUrl = getSafeStorageUrl(contentItem.storage_url as string);
      if (!safeStorageUrl) {
        toasts.raw.error('Invalid download URL', {
          description: 'The download link is not available.',
        });
        return;
      }
      window.location.href = safeStorageUrl;
      pulse
        .download({ category, slug: contentItem.slug, action_type: 'download_zip' })
        .catch((error) => {
          logUnhandledPromise('trackInteraction:download', error, {
            slug: contentItem.slug,
            category,
          });
        });
    }

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

          {contentItem.description && (
            <p className={`mb-6 ${UI_CLASSES.TEXT_BODY_LG} text-muted-foreground`}>
              {contentItem.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          {/* Primary action button - only show if not a download action, or if download is available */}
          {(!(primaryAction.type === 'download') || hasDownloadAvailable) && (
            <Button onClick={() => handleActionClick(primaryAction)} className="min-w-0">
              {primaryAction.label}
            </Button>
          )}

          {/* Conditional download button - show when download is available but primaryAction is not download */}
          {hasDownloadAvailable && primaryAction.type !== 'download' && (
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
              {category === 'mcp' ? 'Download .mcpb' : 'Download'}
            </Button>
          )}

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
