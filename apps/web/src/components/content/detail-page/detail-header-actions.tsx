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

import { ContentCategory } from '@heyclaude/data-layer/prisma';
import type { content_category } from '@heyclaude/data-layer/prisma';
import type { GetContentDetailCompleteReturns } from '@heyclaude/database-types/postgres-types';
import { logUnhandledPromise, isValidCategory } from '@heyclaude/web-runtime/core';
import { getCategoryConfig } from '@heyclaude/web-runtime/data';
import { useCopyToClipboard, usePulse, usePinboard, useIsClient } from '@heyclaude/web-runtime/hooks';
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
  toasts,
  UnifiedBadge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useRef, useCallback, memo } from 'react';

import { usePinboardDrawer } from '@/src/components/features/navigation/pinboard-drawer-provider';
import { ExploreDropdown } from '@/src/components/content/explore-dropdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';

/**
 * Validate and return a safe path segment for use in URLs.
 */
function sanitizePathSegment(segment: string): null | string {
  const SAFE_SEGMENT_REGEX = /^[a-zA-Z0-9._-]{1,64}$/;
  if (!SAFE_SEGMENT_REGEX.test(segment)) {
    return null;
  }
  return segment;
}

/**
 * Infer whether an item's copyable content should be treated as `code` or `link`.
 */
function determineCopyType(
  item:
    | ContentItem
    | (ContentItem & GetContentDetailCompleteReturns['content'])
): CopyType {
  if ('content' in item && item.content) return 'code';
  if ('configuration' in item && item['configuration']) return 'code';
  return 'link';
}

/**
 * Extracts a non-empty string suitable for copying from a content item or its configuration.
 */
function getContentForCopy(
  item:
    | ContentItem
    | (ContentItem & GetContentDetailCompleteReturns['content'])
): null | string {
  if (
    'content' in item &&
    typeof item.content === 'string' &&
    item.content.trim().length > 0
  ) {
    return item.content;
  }

  if ('configuration' in item) {
    const cfg = item['configuration'];
    if (typeof cfg === 'string' && cfg.trim().length > 0) return cfg;
    if (cfg != null) {
      const jsonStr = JSON.stringify(cfg, null, 2);
      if (jsonStr.trim().length > 0) return jsonStr;
    }
  }

  return null;
}

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
  category: content_category;
  displayTitle: string;
  hasContent: boolean;
  item:
    | ContentItem
    | NonNullable<GetContentDetailCompleteReturns['content']>;
  onCopyContent?: (() => Promise<void>) | undefined;
  primaryAction: SerializableAction;
  secondaryActions?: SerializableAction[];
  typeName: string;
}

/**
 * Render the interactive header and sticky actions sidebar for a content detail view.
 * 
 * PERFORMANCE: Memoized to prevent unnecessary re-renders when parent components update.
 * This component receives many props and renders a complex UI, so memoization prevents
 * expensive re-renders when parent state changes (e.g., search, filters, etc.).
 */
const DetailHeaderActionsComponent = function DetailHeaderActions({
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
  const isClient = useIsClient();
  const referrer = isClient ? window.location.pathname : undefined;
  const { copy: copyToClipboard } = useCopyToClipboard();
  const pulse = usePulse();
  const shouldReduceMotion = useReducedMotion();
  const handleCopyContentRef = useRef<(() => Promise<void>) | null>(null);

  const itemSlug = typeof item['slug'] === 'string' ? item['slug'] : '';
  const itemDescription = typeof item['description'] === 'string' ? item['description'] : '';

  const itemForCopy = ('id' in item && typeof item['id'] === 'string') ? (item as ContentItem) : null;

  const { copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: itemForCopy ? determineCopyType(itemForCopy) : 'link',
      category,
      slug: itemSlug,
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
        action: {
          label: 'Retry',
          onClick: () => {
            if (handleCopyContentRef.current) {
              handleCopyContentRef.current().catch(() => {});
            }
          },
        },
      });
    },
    context: {
      component: 'detail-header-actions',
      action: 'copy-content',
    },
  });

  const { pinnedItems, togglePin, isPinned } = usePinboard();
  const { openDrawer: openPinboardDrawer } = usePinboardDrawer();
  const pinned = isPinned(category, itemSlug);

  const shareUrl = isClient
    ? `${window.location.origin}/${category}/${itemSlug}`
    : '';

  const handleTogglePin = useCallback(() => {
    const wasPinned = pinned;
    const tags = ('tags' in item && Array.isArray(item.tags))
      ? item.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
      : undefined;
    const itemTitle = typeof item['title'] === 'string' ? item['title'] : null;
    const itemThumbnailUrl = 'thumbnail_url' in item && typeof item['thumbnail_url'] === 'string'
      ? item['thumbnail_url']
      : null;

    togglePin({
      category,
      slug: itemSlug,
      title: displayTitle || itemTitle || itemSlug,
      typeName,
      description: itemDescription,
      ...(tags ? { tags } : {}),
      thumbnailUrl: itemThumbnailUrl,
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
  }, [pinned, item, category, itemSlug, displayTitle, typeName, itemDescription, togglePin, openPinboardDrawer]);

  const handleCopyContent = useCallback(async () => {
    if (onCopyContent) {
      await onCopyContent();
      return;
    }

    const itemForCopy = ('id' in item && typeof item['id'] === 'string') ? (item as ContentItem) : null;
    const contentToCopy = itemForCopy ? getContentForCopy(itemForCopy) : null;

    if (!contentToCopy) {
      toasts.raw.error('Nothing to copy', {
        description: 'No content is available to copy.',
      });
      return;
    }

    await copy(contentToCopy);

    pulse.copy({ category, slug: itemSlug }).catch((error) => {
      logUnhandledPromise('trackInteraction:copy-content', error, {
        slug: itemSlug,
        category,
      });
    });
  }, [onCopyContent, item, copy, pulse, category, itemSlug]);

  handleCopyContentRef.current = handleCopyContent;

  const hasMcpbDownload =
    category === ContentCategory.mcp &&
    'mcpb_storage_url' in item &&
    item.mcpb_storage_url &&
    typeof item.mcpb_storage_url === 'string';

  const hasStorageDownload =
    category === ContentCategory.skills &&
    'storage_url' in item &&
    item.storage_url &&
    typeof item.storage_url === 'string';

  const hasDownloadAvailable = hasMcpbDownload || hasStorageDownload;

  const handleDownload = useCallback((
    downloadType: 'mcpb' | 'zip',
    contentItem: ContentItem,
    category: content_category,
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

    const contentItemTitle = typeof contentItem['title'] === 'string' ? contentItem['title'] : null;
    const contentItemSlug = typeof contentItem['slug'] === 'string' ? contentItem['slug'] : '';
    toasts.raw.success('Download started!', {
      description: `Downloading ${contentItemTitle || contentItemSlug} package...`,
    });
  }, []);

  const handleActionClick = useCallback((action: SerializableAction) => {
    if (action.type === 'download') {
      if (hasMcpbDownload) {
        const itemForDownload = ('id' in item && typeof item['id'] === 'string') ? (item as ContentItem) : null;
        if (itemForDownload) {
          handleDownload('mcpb', itemForDownload, category, pulse);
        }
        return;
      }

      if (hasStorageDownload) {
        const itemForDownload = ('id' in item && typeof item['id'] === 'string') ? (item as ContentItem) : null;
        if (itemForDownload) {
          handleDownload('zip', itemForDownload, category, pulse);
        }
        return;
      }

      toasts.raw.error('Download unavailable', {
        description: 'This package is not yet available for download.',
      });
      return;
    }

    toasts.raw.success(`${action.label}`, {
      description: `Copy the ${typeName.toLowerCase()} content and follow the installation instructions.`,
    });
  }, [hasMcpbDownload, hasStorageDownload, item, category, pulse, handleDownload, typeName]);

  // Share handlers
  const handleShareTwitter = useCallback(() => {
    void (async () => {
      const shareUrlWithUtm = `${shareUrl}?utm_source=share&utm_medium=share&utm_campaign=${category}`;
      const tweetText = encodeURIComponent(
        `Check out ${displayTitle} on ClaudePro Directory!`
      );
      const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrlWithUtm)}`;
      if (isClient) {
        window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
      }
      await pulse
        .share({ platform: 'twitter', category, slug: itemSlug, url: shareUrl })
        .catch((): void => {});
    })();
  }, [shareUrl, category, displayTitle, isClient, pulse, itemSlug]);

  const handleShareLinkedIn = useCallback(() => {
    void (async () => {
      const shareUrlWithUtm = `${shareUrl}?utm_source=share&utm_medium=share&utm_campaign=${category}`;
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrlWithUtm)}`;
      if (isClient) {
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
      }
      await pulse
        .share({ platform: 'linkedin', category, slug: itemSlug, url: shareUrl })
        .catch((): void => {});
    })();
  }, [shareUrl, category, isClient, pulse, itemSlug]);

  const handleCopyLink = useCallback(() => {
    void (async () => {
      const shareUrlWithUtm = `${shareUrl}?utm_source=share&utm_medium=share&utm_campaign=${category}`;
      try {
        await copyToClipboard(shareUrlWithUtm);
        toasts.raw.success('Link copied!', {
          description: 'Paste anywhere to share.',
        });
      } catch {
        // Ignore copy errors
      }
      try {
        await pulse.share({ platform: 'copy_link', category, slug: itemSlug, url: shareUrl });
      } catch {
        // Ignore tracking errors
      }
    })();
  }, [shareUrl, category, copyToClipboard, pulse, itemSlug]);

  // Copy handlers
  const handleCopyForAI = useCallback(async () => {
    const safeCategory = sanitizePathSegment(category);
    const safeSlug = sanitizePathSegment(itemSlug);
    if (!(safeCategory && safeSlug)) return;

    try {
      const response = await fetch(`/${safeCategory}/${safeSlug}/llms.txt`);
      if (!response.ok) {
        toasts.raw.error('Unable to copy for AI', {
          description: 'The AI-optimized content could not be loaded.',
          action: {
            label: 'Retry',
            onClick: handleCopyForAI,
          },
        });
        logUnhandledPromise('Failed to copy for AI', new Error(`HTTP ${response.status}: ${response.statusText}`), {
          category,
          slug: itemSlug,
        });
        return;
      }
      const content = await response.text();
      await copyToClipboard(content);
      toasts.raw.success('Copied llms.txt to clipboard!');
      await pulse.copy({
        category,
        slug: itemSlug,
        metadata: { action_type: 'llmstxt' },
      });
    } catch (error) {
      toasts.raw.error('Unable to copy for AI', {
        description: 'An unexpected error occurred while copying.',
        action: {
          label: 'Retry',
          onClick: handleCopyForAI,
        },
      });
      logUnhandledPromise('Failed to copy for AI', error, {
        category,
        slug: itemSlug,
      });
    }
  }, [category, itemSlug, copyToClipboard, pulse]);

  const handleCopyMarkdown = useCallback(async () => {
    const safeCategory = sanitizePathSegment(category);
    const safeSlug = sanitizePathSegment(itemSlug);
    if (!(safeCategory && safeSlug)) return;

    try {
      const response = await fetch(
        `/${safeCategory}/${safeSlug}.md?include_metadata=true&include_footer=false`
      );
      if (!response.ok) {
        toasts.raw.error('Unable to copy markdown', {
          description: 'The markdown content could not be loaded.',
          action: {
            label: 'Retry',
            onClick: handleCopyMarkdown,
          },
        });
        logUnhandledPromise('Failed to copy markdown', new Error(`HTTP ${response.status}: ${response.statusText}`), {
          category,
          slug: itemSlug,
        });
        return;
      }
      const content = await response.text();
      await copyToClipboard(content);
      toasts.raw.success('Copied markdown to clipboard!');
      await pulse.copy({
        category,
        slug: itemSlug,
        metadata: { action_type: 'copy' },
      });
    } catch (error) {
      toasts.raw.error('Unable to copy markdown', {
        description: 'An unexpected error occurred while copying.',
        action: {
          label: 'Retry',
          onClick: handleCopyMarkdown,
        },
      });
      logUnhandledPromise('Failed to copy markdown', error, {
        category,
        slug: itemSlug,
      });
    }
  }, [category, itemSlug, copyToClipboard, pulse]);

  const handleDownloadMarkdown = useCallback(async () => {
    const safeCategory = sanitizePathSegment(category);
    const safeSlug = sanitizePathSegment(itemSlug);
    if (!(safeCategory && safeSlug)) return;

    try {
      const response = await fetch(`/${safeCategory}/${safeSlug}.md`);
      if (!response.ok) {
        toasts.raw.error('Unable to download markdown', {
          description: 'The markdown file could not be loaded.',
          action: {
            label: 'Retry',
            onClick: handleDownloadMarkdown,
          },
        });
        logUnhandledPromise('Failed to download markdown', new Error(`HTTP ${response.status}: ${response.statusText}`), {
          category,
          slug: itemSlug,
        });
        return;
      }
      const content = await response.text();
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      if (typeof document !== 'undefined') {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${itemSlug}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toasts.raw.success('Downloaded markdown file!');
      await pulse.download({
        category,
        slug: itemSlug,
        action_type: 'download_markdown',
      });
    } catch (error) {
      toasts.raw.error('Unable to download markdown', {
        description: 'An unexpected error occurred while downloading.',
        action: {
          label: 'Retry',
          onClick: handleDownloadMarkdown,
        },
      });
      logUnhandledPromise('Failed to download markdown', error, {
        category,
        slug: itemSlug,
      });
    }
  }, [category, itemSlug, pulse]);

  const handleDownloadClick = useCallback(() => {
    const itemForDownload = ('id' in item && typeof item['id'] === 'string') ? (item as ContentItem) : null;
    if (!itemForDownload) return;

    if (hasMcpbDownload) {
      handleDownload('mcpb', itemForDownload, category, pulse);
    } else if (hasStorageDownload) {
      handleDownload('zip', itemForDownload, category, pulse);
    }
  }, [item, hasMcpbDownload, hasStorageDownload, category, pulse, handleDownload]);

  return (
    <div className="flex flex-col gap-4">
      {/* Back Navigation */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
              whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
              transition={MICROINTERACTIONS.button.transition}
              className="mb-4"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className={cn('text-muted-foreground', 'hover:text-foreground', '-ml-2')}
              >
                <ArrowLeft className={cn('h-4 w-4', 'mr-2')} />
                Back
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Go back to previous page</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Main Content Grid */}
      <div className={cn('grid-cols-1', 'lg:grid-cols-[1fr_320px] lg:gap-12')}>
        {/* Left Column - Content Info */}
        <div className="flex flex-col gap-4">
          {/* Badges */}
          <div className="flex items-center gap-2">
            <UnifiedBadge
              variant="base"
              style="secondary"
              className={cn('text-sm', 'font-medium', 'text-foreground font-medium')}
            >
              {typeName}
            </UnifiedBadge>
            <UnifiedBadge
              variant="base"
              style="outline"
              className={cn('text-sm', 'font-medium', 'text-foreground')}
            >
              {isValidCategory(category) ? getCategoryConfig(category)?.typeName ?? category : category}
            </UnifiedBadge>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl xl:text-5xl">
            {displayTitle}
          </h1>

          {/* Description */}
          {itemDescription ? (
            <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed lg:text-xl">
              {itemDescription.length > 200
                ? `${itemDescription.slice(0, 200).trim()}...`
                : itemDescription}
            </p>
          ) : null}
        </div>

        {/* Right Column - Actions Sidebar */}
        <aside
          className={cn(
            'flex flex-col gap-3',
            'border',
            'rounded-lg',
            'p-4',
            'bg-card/50 backdrop-blur-sm',
            'lg:sticky lg:top-24 lg:self-start'
          )}
        >
          {/* Primary Action */}
          {!(primaryAction.type === 'download') || hasDownloadAvailable ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                    whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
                    transition={MICROINTERACTIONS.button.transition}
                  >
                    <Button
                      onClick={() => handleActionClick(primaryAction)}
                      className="w-full"
                      size="lg"
                    >
                      {primaryAction.label}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{primaryAction.label}</p>
                  <p className="text-muted-foreground text-xs">
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

          {/* Download Button */}
          {hasDownloadAvailable && primaryAction.type !== 'download' ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                    whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
                    transition={MICROINTERACTIONS.button.transition}
                  >
                    <Button
                      onClick={handleDownloadClick}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className={cn('h-4 w-4', 'mr-2')} />
                      {category === ContentCategory.mcp ? 'Download .mcpb' : 'Download'}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download configuration</p>
                  <p className="text-muted-foreground text-xs">
                    {category === ContentCategory.mcp
                      ? 'Download as .mcpb file for Claude Desktop'
                      : 'Download as ZIP archive'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          {/* Quick Actions Row */}
          <div className="flex items-center gap-2">
            {/* Pin Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                    whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
                    transition={MICROINTERACTIONS.button.transition}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTogglePin}
                      className="flex-1"
                    >
                      {pinned ? (
                        <>
                          <Bookmark className={cn('h-4 w-4', 'mr-2')} />
                          Unpin
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className={cn('h-4 w-4', 'mr-2')} />
                          Pin
                        </>
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{pinned ? 'Remove from pinboard' : 'Save to pinboard'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Share Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                    whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
                    transition={MICROINTERACTIONS.button.transition}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex-1"
                    >
                      <Copy className={cn('h-4 w-4', 'mr-2')} />
                      Share
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy link to share</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* More Actions Menu */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <motion.div
                        whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                        transition={MICROINTERACTIONS.button.transition}
                      >
                        <Button variant="outline" size="sm">
                          <Menu className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More actions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="w-56">
                {/* Share Options */}
                <DropdownMenuItem onClick={handleShareTwitter}>
                  <Twitter className={cn('h-4 w-4', 'mr-2')} />
                  Share on X
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareLinkedIn}>
                  <Linkedin className={cn('h-4 w-4', 'mr-2')} />
                  Share on LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className={cn('h-4 w-4', 'mr-2')} />
                  Copy Link
                </DropdownMenuItem>

                {/* Copy Options */}
                {hasContent ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCopyContent}>
                      <Copy className={cn('h-4 w-4', 'mr-2')} />
                      Copy Content
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyForAI}>
                      <Sparkles className={cn('h-4 w-4', 'mr-2')} />
                      Copy for AI
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyMarkdown}>
                      <FileText className={cn('h-4 w-4', 'mr-2')} />
                      Copy Markdown
                    </DropdownMenuItem>
                  </>
                ) : null}

                {/* Download Options */}
                {hasDownloadAvailable ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDownloadClick}>
                      <Download className={cn('h-4 w-4', 'mr-2')} />
                      {category === ContentCategory.mcp ? 'Download .mcpb' : 'Download'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadMarkdown}>
                      <Download className={cn('h-4 w-4', 'mr-2')} />
                      Download Markdown
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Explore Dropdown */}
          <ExploreDropdown
            category={category}
            slug={itemSlug}
            pageType="detail"
          />

          {/* View Pinboard Link */}
          <Button
            variant="ghost"
            size="sm"
            className={cn('text-muted-foreground w-full justify-start')}
            onClick={openPinboardDrawer}
          >
            <Bookmark className={cn('h-4 w-4', 'mr-2')} />
            View pinboard ({Array.isArray(pinnedItems) ? pinnedItems.length : 0})
          </Button>

          {/* Secondary Actions */}
          {secondaryActions && secondaryActions.length > 0 && (
            <>
              <div className={cn('border', 'border-t')} />
              <div className="flex items-center gap-2">
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
          )}
        </aside>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-renders when props actually change (deep comparison for objects)
export const DetailHeaderActions = memo(DetailHeaderActionsComponent, (prevProps, nextProps) => {
  // Custom comparison function for optimal memoization
  // Compare primitive props directly
  if (
    prevProps.category !== nextProps.category ||
    prevProps.displayTitle !== nextProps.displayTitle ||
    prevProps.hasContent !== nextProps.hasContent ||
    prevProps.typeName !== nextProps.typeName ||
    prevProps.primaryAction.label !== nextProps.primaryAction.label ||
    prevProps.primaryAction.type !== nextProps.primaryAction.type
  ) {
    return false; // Props changed, re-render
  }

  // Compare secondaryActions array length and content
  if (
    (prevProps.secondaryActions?.length ?? 0) !== (nextProps.secondaryActions?.length ?? 0)
  ) {
    return false;
  }

  // Compare item slug (most likely to change)
  const prevSlug = typeof prevProps.item['slug'] === 'string' ? prevProps.item['slug'] : '';
  const nextSlug = typeof nextProps.item['slug'] === 'string' ? nextProps.item['slug'] : '';
  if (prevSlug !== nextSlug) {
    return false;
  }

  // Compare onCopyContent function reference (if provided)
  if (prevProps.onCopyContent !== nextProps.onCopyContent) {
    return false;
  }

  // Props are equal, skip re-render
  return true;
});
