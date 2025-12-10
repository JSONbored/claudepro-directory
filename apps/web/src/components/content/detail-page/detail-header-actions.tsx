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
import { type Database } from '@heyclaude/database-types';
import { logUnhandledPromise, isValidCategory } from '@heyclaude/web-runtime/core';
import { getCategoryConfig } from '@heyclaude/web-runtime/data';
import { useCopyToClipboard, usePulse, usePinboard } from '@heyclaude/web-runtime/hooks';
import { useCopyWithEmailCapture } from '@/src/hooks/use-copy-with-email-capture';
import {
  ArrowLeft,
  Bookmark,
  BookmarkPlus,
  Copy,
  Download,
  FileText,
  Linkedin,
  Menu,
  Sparkles,
  Twitter,
} from '@heyclaude/web-runtime/icons';
import { type ContentItem, type CopyType } from '@heyclaude/web-runtime/types/component.types';
import {
  STATE_PATTERNS,
  toasts,
  UI_CLASSES,
  UnifiedBadge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

import { usePostCopyEmail } from '@/src/components/core/infra/providers/email-capture-modal-provider';
import { usePinboardDrawer } from '@/src/components/features/navigation/pinboard-drawer-provider';
import { ExploreDropdown } from '@/src/components/content/explore-dropdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';

/**
 * Validate and return a safe path segment for use in URLs.
 *
 * Allows only ASCII letters, digits, dot (.), underscore (_), and hyphen (-) and enforces a length between 1 and 64 characters.
 *
 * @param segment - The raw path segment to validate
 * @returns The original `segment` if it meets the safety rules, `null` otherwise
 */
function sanitizePathSegment(segment: string): null | string {
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
 * Infer whether an item's copyable content should be treated as `code` or `link`.
 *
 * @param item - A content item which may include `content` or `configuration` fields.
 * @returns `'code'` if the item contains `content` or `configuration`, `'link'` otherwise.
 */
function determineCopyType(
  item:
    | ContentItem
    | (ContentItem &
        Database['public']['Functions']['get_content_detail_complete']['Returns']['content'])
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
 * Extracts a non-empty string suitable for copying from a content item or its configuration.
 *
 * @param item - The content item or the detailed content payload returned by `get_content_detail_complete`
 * @returns A non-empty string from `item.content` or `item.configuration`, or `null` if no usable content exists.
 *
 * @see determineCopyType
 */
function getContentForCopy(
  item:
    | ContentItem
    | (ContentItem &
        Database['public']['Functions']['get_content_detail_complete']['Returns']['content'])
): null | string {
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
  | 'copy_command'
  | 'copy_script'
  | 'custom'
  | 'deploy'
  | 'download'
  | 'github_link'
  | 'info'
  | 'notification'
  | 'scroll';

export interface SerializableAction {
  label: string;
  type: SerializableActionType;
}

export interface DetailHeaderActionsProps {
  category: Database['public']['Enums']['content_category'];
  displayTitle: string;
  hasContent: boolean;
  item:
    | ContentItem
    | Database['public']['Functions']['get_content_detail_complete']['Returns']['content'];
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
  primaryAction: SerializableAction;
  secondaryActions?: SerializableAction[];
  typeName: string;
}

/**
 * Render the interactive header and sticky actions sidebar for a content detail view.
 *
 * @param item - Content detail object (typically a ContentItem) used to derive title, slug, description, content, and download URLs
 * @param typeName - Human-readable content type label displayed as a badge
 * @param category - Content category used for routing, download selection, and analytics
 * @param hasContent - Whether the item exposes copyable content; toggles content-specific action UI
 * @param displayTitle - Title shown in the header. Callers should provide a pre-fallback title (e.g., `item.title ?? item.slug`) as this component renders `displayTitle` directly without fallback logic.
 * @param primaryAction - Primary CTA shown in the actions sidebar; its `type` triggers special handling (e.g., `download`)
 * @param secondaryActions - Optional array of additional serializable actions rendered as secondary buttons
 * @param onCopyContent - Optional override invoked when the Copy Content button is pressed; when provided, the component delegates copy handling to this callback
 * @returns The React element composing the detail header and actions UI
 *
 * @see sanitizePathSegment
 * @see getContentForCopy
 * @see useCopyWithEmailCapture
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
  const referrer = globalThis.window === undefined ? undefined : globalThis.location.pathname;
  const { copy: copyToClipboard } = useCopyToClipboard();
  const { showModal } = usePostCopyEmail();
  // Cast item to ContentItem for property access (content is Json type)
  const contentItem = item as ContentItem;

  const pulse = usePulse();
  const { copy } = useCopyWithEmailCapture({
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
    globalThis.window === undefined
      ? ''
      : `${globalThis.location.origin}/${category}/${contentItem.slug}`;

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

    globalThis.location.href = downloadUrl;
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
      {/* Back navigation - minimal */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              whileHover={MICROINTERACTIONS.button.hover} 
              whileTap={MICROINTERACTIONS.button.tap}
              transition={MICROINTERACTIONS.button.transition}
              className="mb-4 inline-block"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className={`text-muted-foreground ${STATE_PATTERNS.HOVER_TEXT_FOREGROUND} -ml-2`}
              >
                <ArrowLeft className={UI_CLASSES.ICON_SM_LEADING} />
                Back
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Go back to previous page</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Two-column hero layout for desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] lg:gap-10">
        {/* Left column - Content info */}
        <div className="space-y-4">
          {/* Badges - inline */}
          <div className="flex items-center gap-2">
            <UnifiedBadge
              variant="base"
              style="secondary"
              className={`${UI_CLASSES.TEXT_BADGE} font-medium`}
            >
              {typeName}
            </UnifiedBadge>
            <UnifiedBadge variant="base" style="outline" className={UI_CLASSES.TEXT_BADGE}>
              {isValidCategory(category) ? getCategoryConfig(category)?.typeName ?? category : category}
            </UnifiedBadge>
          </div>

          {/* Title - larger and more prominent */}
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{displayTitle}</h1>

          {/* Description - shortened preview (full description in content section) */}
          {contentItem.description ? (
            <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed lg:text-xl">
              {contentItem.description.length > 150
                ? `${contentItem.description.slice(0, 150).trim()}...`
                : contentItem.description}
            </p>
          ) : null}
        </div>

        {/* Right column - Actions sidebar (sticky on desktop) */}
        <aside className="border-border/50 bg-card/50 space-y-3 rounded-lg border p-4 lg:sticky lg:top-24 lg:self-start">
          {/* Primary CTA - Full width */}
          {!(primaryAction.type === 'download') || hasDownloadAvailable ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    whileTap={MICROINTERACTIONS.button.tap} 
                    whileHover={MICROINTERACTIONS.button.hover}
                    transition={MICROINTERACTIONS.button.transition}
                  >
                    <Button onClick={() => handleActionClick(primaryAction)} className="w-full">
                      {primaryAction.label}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{primaryAction.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {primaryAction.type === 'copy_command' || primaryAction.type === 'copy_script'
                      ? 'Copy content to clipboard'
                      : primaryAction.type === 'download'
                      ? 'Download configuration file'
                      : 'Primary action for this item'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          {/* Conditional download button */}
          {hasDownloadAvailable && primaryAction.type !== 'download' ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    whileTap={MICROINTERACTIONS.button.tap} 
                    whileHover={MICROINTERACTIONS.button.hover}
                    transition={MICROINTERACTIONS.button.transition}
                  >
                    <Button
                      onClick={() => {
                        if (hasMcpbDownload) {
                          handleDownload('mcpb', contentItem, category, pulse);
                        } else if (hasStorageDownload) {
                          handleDownload('zip', contentItem, category, pulse);
                        }
                      }}
                      className="w-full"
                    >
                      <Download className={UI_CLASSES.ICON_SM_LEADING} />
                      {category === Constants.public.Enums.content_category[1]
                        ? 'Download .mcpb'
                        : 'Download'}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download configuration</p>
                  <p className="text-xs text-muted-foreground">
                    {category === Constants.public.Enums.content_category[1]
                      ? 'Download as .mcpb file for Claude Desktop'
                      : 'Download as ZIP archive'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          {/* Actions Dropdown - Consolidated all actions */}
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <motion.div 
                      whileTap={MICROINTERACTIONS.button.tap}
                      transition={MICROINTERACTIONS.button.transition}
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Menu className={UI_CLASSES.ICON_SM_LEADING} />
                        Actions
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More actions</p>
                  <p className="text-xs text-muted-foreground">Pin, share, and copy options</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-56">
                    {/* Pin */}
                    <DropdownMenuItem onClick={handleTogglePin}>
                      {pinned ? (
                        <>
                          <Bookmark className={UI_CLASSES.ICON_SM_LEADING} />
                          Unpin
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className={UI_CLASSES.ICON_SM_LEADING} />
                          Pin
                        </>
                      )}
                    </DropdownMenuItem>

              {/* Share - inline menu items */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  const shareUrlWithUtm = `${shareUrl}?utm_source=share&utm_medium=share&utm_campaign=${category}`;
                  const tweetText = encodeURIComponent(
                    `Check out ${displayTitle} on ClaudePro Directory!`
                  );
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrlWithUtm)}`;
                  if (typeof window !== 'undefined') {
                    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
                  }
                  await pulse
                    .share({ platform: 'twitter', category, slug: contentItem.slug, url: shareUrl })
                    .catch(() => {});
                }}
              >
                <Twitter className={UI_CLASSES.ICON_SM_LEADING} />
                Share on X
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  const shareUrlWithUtm = `${shareUrl}?utm_source=share&utm_medium=share&utm_campaign=${category}`;
                  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrlWithUtm)}`;
                  if (typeof window !== 'undefined') {
                    window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
                  }
                  await pulse
                    .share({ platform: 'linkedin', category, slug: contentItem.slug, url: shareUrl })
                    .catch(() => {});
                }}
              >
                <Linkedin className={UI_CLASSES.ICON_SM_LEADING} />
                Share on LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  const shareUrlWithUtm = `${shareUrl}?utm_source=share&utm_medium=share&utm_campaign=${category}`;
                  await copyToClipboard(shareUrlWithUtm);
                  toasts.raw.success('Link copied!', {
                    description: 'Paste anywhere to share.',
                  });
                  await pulse
                    .share({ platform: 'copy_link', category, slug: contentItem.slug, url: shareUrl })
                    .catch(() => {});
                }}
              >
                <Copy className={UI_CLASSES.ICON_SM_LEADING} />
                Copy Link
              </DropdownMenuItem>

              {/* Copy Actions */}
              {hasContent && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyContent}>
                    <Copy className={UI_CLASSES.ICON_SM_LEADING} />
                    Copy Content
                  </DropdownMenuItem>

                  {(() => {
                    const safeCategory = sanitizePathSegment(category);
                    const safeSlug = sanitizePathSegment(contentItem.slug);
                    if (!(safeCategory && safeSlug)) return null;

                    const handleCopyForAI = async () => {
                      try {
                        const response = await fetch(`/${safeCategory}/${safeSlug}/llms.txt`);
                        if (!response.ok) {
                          toasts.raw.error('Unable to copy for AI', {
                            description: 'The AI-optimized content could not be loaded.',
                          });
                          logUnhandledPromise('Failed to copy for AI', new Error(`HTTP ${response.status}: ${response.statusText}`), {
                            category,
                            slug: contentItem.slug,
                          });
                          return;
                        }
                        const content = await response.text();
                        await copyToClipboard(content);
                        toasts.raw.success('Copied llms.txt to clipboard!');
                        await pulse.copy({
                          category,
                          slug: contentItem.slug,
                          metadata: { action_type: 'llmstxt' },
                        });
                      } catch (error) {
                        toasts.raw.error('Unable to copy for AI', {
                          description: 'An unexpected error occurred while copying.',
                        });
                        logUnhandledPromise('Failed to copy for AI', error, {
                          category,
                          slug: contentItem.slug,
                        });
                      }
                    };

                    const handleCopyMarkdown = async () => {
                      try {
                        const response = await fetch(
                          `/${safeCategory}/${safeSlug}.md?include_metadata=true&include_footer=false`
                        );
                        if (!response.ok) {
                          toasts.raw.error('Unable to copy markdown', {
                            description: 'The markdown content could not be loaded.',
                          });
                          logUnhandledPromise('Failed to copy markdown', new Error(`HTTP ${response.status}: ${response.statusText}`), {
                            category,
                            slug: contentItem.slug,
                          });
                          return;
                        }
                        const content = await response.text();
                        await copyToClipboard(content);
                        showModal({
                          copyType: 'markdown',
                          category,
                          slug: contentItem.slug,
                          ...(referrer && { referrer }),
                        });
                        toasts.raw.success('Copied markdown to clipboard!');
                        await pulse.copy({
                          category,
                          slug: contentItem.slug,
                          metadata: { action_type: 'copy' },
                        });
                      } catch (error) {
                        toasts.raw.error('Unable to copy markdown', {
                          description: 'An unexpected error occurred while copying.',
                        });
                        logUnhandledPromise('Failed to copy markdown', error, {
                          category,
                          slug: contentItem.slug,
                        });
                      }
                    };

                    return (
                      <>
                        <DropdownMenuItem onClick={handleCopyForAI}>
                          <Sparkles className={UI_CLASSES.ICON_SM_LEADING} />
                          Copy for AI
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopyMarkdown}>
                          <FileText className={UI_CLASSES.ICON_SM_LEADING} />
                          Copy Markdown
                        </DropdownMenuItem>
                      </>
                    );
                  })()}
                </>
              )}

              {/* Download/Export */}
              {hasDownloadAvailable && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (hasMcpbDownload) {
                        handleDownload('mcpb', contentItem, category, pulse);
                      } else if (hasStorageDownload) {
                        handleDownload('zip', contentItem, category, pulse);
                      }
                    }}
                  >
                    <Download className={UI_CLASSES.ICON_SM_LEADING} />
                    {category === Constants.public.Enums.content_category[1]
                      ? 'Download .mcpb'
                      : 'Download'}
                  </DropdownMenuItem>

                  {(() => {
                    const safeCategory = sanitizePathSegment(category);
                    const safeSlug = sanitizePathSegment(contentItem.slug);
                    if (!(safeCategory && safeSlug)) return null;

                    const handleDownloadMarkdown = async () => {
                      try {
                        const response = await fetch(`/${safeCategory}/${safeSlug}.md`);
                        if (!response.ok) {
                          toasts.raw.error('Unable to download markdown', {
                            description: 'The markdown file could not be loaded.',
                          });
                          logUnhandledPromise('Failed to download markdown', new Error(`HTTP ${response.status}: ${response.statusText}`), {
                            category,
                            slug: contentItem.slug,
                          });
                          return;
                        }
                        const content = await response.text();
                        const blob = new Blob([content], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        if (typeof document !== 'undefined') {
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${contentItem.slug}.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                        toasts.raw.success('Downloaded markdown file!');
                        await pulse.download({
                          category,
                          slug: contentItem.slug,
                          action_type: 'download_markdown',
                        });
                      } catch (error) {
                        toasts.raw.error('Unable to download markdown', {
                          description: 'An unexpected error occurred while downloading.',
                        });
                        logUnhandledPromise('Failed to download markdown', error, {
                          category,
                          slug: contentItem.slug,
                        });
                      }
                    };

                    return (
                      <DropdownMenuItem onClick={handleDownloadMarkdown}>
                        <Download className={UI_CLASSES.ICON_SM_LEADING} />
                        Download Markdown
                      </DropdownMenuItem>
                    );
                  })()}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Explore Dropdown - Separate hover dropdown */}
          <ExploreDropdown
            category={category}
            slug={contentItem.slug}
            pageType="detail"
          />

          {/* View Pinboard link */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full justify-start"
            onClick={openPinboardDrawer}
          >
            <Bookmark className={UI_CLASSES.ICON_SM_LEADING} />
            View pinboard ({pinnedItems.length})
          </Button>


          {/* Secondary actions */}
          {secondaryActions && secondaryActions.length > 0 ? (
            <>
              <div className="border-border/50 border-t" />
              <div className="flex flex-wrap gap-2">
                {secondaryActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionClick(action)}
                    className="flex-1"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </>
  );
}