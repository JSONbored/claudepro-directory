'use client';

/**
 * Production Code Block Component - Sugar High with Viral Features
 *
 * Features:
 * - Sugar High syntax highlighting (1KB, 7x faster than Shiki)
 * - Screenshot generation with watermark branding
 * - Social share buttons (Twitter, LinkedIn) with UTM tracking
 * - Embed code generation for viral backlinks
 * - 1-click copy with Sonner toast
 * - Max-height constraint with smooth expand/collapse
 * - Mobile-optimized (48px touch targets)
 */

import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LinkedinIcon, LinkedinShareButton, TwitterIcon, TwitterShareButton } from 'react-share';
import { trackInteraction } from '@/src/lib/actions/analytics.actions';
import { APP_CONFIG } from '@/src/lib/constants';
import { Camera, Check, ChevronDown, Copy, Share2 } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { copyEmbedCode, trackEmbedGeneration } from '@/src/lib/utils/embed.utils';
import {
  copyScreenshotToClipboard,
  downloadScreenshot,
  generateCodeScreenshot,
  generateScreenshotFilename,
} from '@/src/lib/utils/screenshot.utils';
import {
  copyShareLink,
  generateShareText,
  generateShareUrl,
  type SharePlatform,
  trackShare,
} from '@/src/lib/utils/share.utils';
import { toasts } from '@/src/lib/utils/toast.utils';

export interface ProductionCodeBlockProps {
  /** Pre-rendered HTML from Shiki (server-side) */
  html: string;
  /** Raw code for copy functionality */
  code: string;
  /** Programming language (for display) */
  language?: string | undefined;
  /** Optional filename to display */
  filename?: string | undefined;
  /** Maximum visible lines before collapsing (default: 20) */
  maxLines?: number | undefined;
  /** Show line numbers (default: false) */
  showLineNumbers?: boolean | undefined;
  /** Additional CSS classes */
  className?: string | undefined;
}

export function ProductionCodeBlock({
  html,
  code,
  language = 'text',
  filename,
  maxLines = 20,
  showLineNumbers = false,
  className = '',
}: ProductionCodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const preRef = useRef<HTMLDivElement>(null);
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Extract category and slug from pathname for tracking
  const pathParts = pathname?.split('/').filter(Boolean) || [];
  const category = pathParts[0] || 'unknown';
  const slug = pathParts[1] || 'unknown';

  // Check if content exceeds maxLines (no DOM access needed - calculate from code prop)
  useEffect(() => {
    const lines = code.split('\n').length;
    setNeedsCollapse(lines > maxLines);
  }, [code, maxLines]);

  const handleCopy = async () => {
    setIsCopied(true);

    try {
      await navigator.clipboard.writeText(code);
      toasts.success.codeCopied();

      // Track to user_interactions table (database-first, fire-and-forget)
      trackInteraction({
        interaction_type: 'copy',
        content_type: category,
        content_slug: slug,
      }).catch(() => {});
    } catch (_err) {
      setIsCopied(false);
      toasts.error.copyFailed('code');
      return;
    }

    setTimeout(() => setIsCopied(false), 2000);
  };

  /**
   * Handle screenshot generation
   * Optimized: Lazy-load modern-screenshot only when button clicked (saves ~30KB bundle)
   * Performance: Generate at 2x resolution for Retina displays
   * Viral: Add watermark with category/slug for attribution
   */
  const handleScreenshot = async () => {
    if (!codeBlockRef.current || isScreenshotting) return;

    setIsScreenshotting(true);

    try {
      const watermark = `claudepro.directory/${category}/${slug}`;
      const screenshot = await generateCodeScreenshot({
        element: codeBlockRef.current,
        watermark,
        watermarkPosition: 'bottom-right',
        scale: 2, // Retina quality
        maxWidth: 1200,
        padding: 24,
      });

      // Copy to clipboard (primary action)
      await copyScreenshotToClipboard(screenshot.blob);
      toasts.success.screenshotCopied();

      // Also trigger download for user convenience
      const filename = generateScreenshotFilename(category, slug);
      downloadScreenshot(screenshot.dataUrl, filename);

      // Track screenshot generation (fire-and-forget)
      trackInteraction({
        interaction_type: 'screenshot',
        content_type: category,
        content_slug: slug,
        metadata: {
          width: screenshot.width,
          height: screenshot.height,
        },
      }).catch(() => {});
    } catch (error) {
      toasts.error.screenshotFailed();
      logger.error('Screenshot generation failed', error as Error);
    } finally {
      setIsScreenshotting(false);
    }
  };

  /**
   * Handle share link copy
   * Performance: Reuse pathname parsing, UTM tracking for viral attribution
   */
  const handleShare = async (platform: SharePlatform) => {
    const currentUrl = `${APP_CONFIG.url}${pathname}`;

    try {
      if (platform === 'copy_link') {
        const success = await copyShareLink({
          url: currentUrl,
          title: `${category} - ${slug}`,
          platform,
          category,
          slug,
        });

        if (success) {
          toasts.success.linkCopied();
        } else {
          toasts.error.copyFailed('link');
        }
      }

      // Track share event (fire-and-forget)
      trackShare({ platform, category, slug, url: currentUrl }).catch(() => {});

      setIsShareOpen(false);
    } catch (error) {
      toasts.error.shareFailed();
      logger.error('Share failed', error as Error);
    }
  };

  /**
   * Handle embed code copy
   * Performance: Generate on-demand, track for viral loop analytics
   */
  const handleEmbedCopy = async () => {
    try {
      const success = await copyEmbedCode({
        category,
        slug,
        width: 600,
        height: 400,
        theme: 'auto',
      });

      if (success) {
        toasts.success.embedCopied();

        // Track embed generation (fire-and-forget)
        trackEmbedGeneration({ category, slug, format: 'iframe' }).catch(() => {});
      } else {
        toasts.error.copyFailed('embed code');
      }

      setIsShareOpen(false);
    } catch (error) {
      toasts.error.embedFailed();
      logger.error('Embed copy failed', error as Error);
    }
  };

  const maxHeight = `${maxLines * 1.6}rem`; // 1.6rem per line

  return (
    <div className={`${UI_CLASSES.CODE_BLOCK_GROUP_WRAPPER} ${className}`}>
      {/* Header with filename, language badge, and action buttons */}
      {filename && (
        <div className={UI_CLASSES.CODE_BLOCK_HEADER}>
          <span className={UI_CLASSES.CODE_BLOCK_FILENAME}>{filename}</span>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            {/* Language badge pill */}
            {language && language !== 'text' && (
              <span className="px-2 py-0.5 text-2xs font-medium uppercase tracking-wider rounded-full bg-accent/10 text-accent border border-accent/20">
                {language}
              </span>
            )}

            {/* Screenshot button - camera icon */}
            <motion.button
              type="button"
              onClick={handleScreenshot}
              disabled={isScreenshotting}
              animate={isScreenshotting ? { scale: [1, 1.05, 1] } : {}}
              transition={{
                duration: 0.3,
                repeat: isScreenshotting ? Number.POSITIVE_INFINITY : 0,
              }}
              className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5} px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-code/30 disabled:opacity-50`}
              style={{ minWidth: '48px', minHeight: '48px' }}
              title="Screenshot code"
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {isScreenshotting ? 'Capturing...' : 'Screenshot'}
              </span>
            </motion.button>

            {/* Share dropdown button */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setIsShareOpen(!isShareOpen)}
                className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5} px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-code/30`}
                style={{ minWidth: '48px', minHeight: '48px' }}
                title="Share code"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </motion.button>

              {/* Share dropdown menu */}
              {isShareOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-12 z-50 w-56 p-2 bg-popover border border-border rounded-lg shadow-lg backdrop-blur-sm"
                  onMouseLeave={() => setIsShareOpen(false)}
                >
                  {/* Twitter Share */}
                  <TwitterShareButton
                    url={generateShareUrl({
                      url: `${APP_CONFIG.url}${pathname}`,
                      title: `${category} - ${slug}`,
                      platform: 'twitter',
                      category,
                      slug,
                    })}
                    title={generateShareText({
                      url: pathname,
                      title: `${category} - ${slug}`,
                      platform: 'twitter',
                    })}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-accent/10 rounded-md transition-colors"
                    onClick={() => {
                      handleShare('twitter');
                    }}
                  >
                    <TwitterIcon size={20} round />
                    <span>Share on Twitter</span>
                  </TwitterShareButton>

                  {/* LinkedIn Share */}
                  <LinkedinShareButton
                    url={generateShareUrl({
                      url: `${APP_CONFIG.url}${pathname}`,
                      title: `${category} - ${slug}`,
                      platform: 'linkedin',
                      category,
                      slug,
                    })}
                    title={generateShareText({
                      url: pathname,
                      title: `${category} - ${slug}`,
                      platform: 'linkedin',
                    })}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-accent/10 rounded-md transition-colors"
                    onClick={() => {
                      handleShare('linkedin');
                    }}
                  >
                    <LinkedinIcon size={20} round />
                    <span>Share on LinkedIn</span>
                  </LinkedinShareButton>

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={() => handleShare('copy_link')}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-accent/10 rounded-md transition-colors"
                  >
                    <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <Copy className="h-3 w-3" />
                    </div>
                    <span>Copy Link</span>
                  </button>

                  {/* Embed Code */}
                  <button
                    type="button"
                    onClick={handleEmbedCopy}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-accent/10 rounded-md transition-colors border-t border-border/50 mt-1 pt-2"
                  >
                    <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-xs font-mono">&lt;/&gt;</span>
                    </div>
                    <span>Copy Embed Code</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Copy button with pulse animation */}
            <motion.button
              type="button"
              onClick={handleCopy}
              animate={isCopied ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5} px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-code/30`}
              title="Copy code"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Code block container with CSS transitions (5-10 KB saved from bundle) */}
      <div
        ref={codeBlockRef}
        className="relative overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{
          height: needsCollapse && !isExpanded ? maxHeight : 'auto',
        }}
      >
        {/* Language badge - top right corner */}
        {language && language !== 'text' && !filename && (
          <div className="absolute top-3 right-3 z-20 px-2 py-1 text-2xs font-medium uppercase tracking-wide rounded-md bg-accent/10 text-accent border border-accent/20 backdrop-blur-sm">
            {language}
          </div>
        )}

        {/* Gradient fade when collapsed - with smooth CSS transition */}
        {needsCollapse && !isExpanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10 transition-opacity duration-200"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, var(--color-bg-code) 90%)',
            }}
          />
        )}

        {/* Server-rendered Shiki HTML */}
        <div
          ref={preRef}
          className={showLineNumbers ? 'code-with-line-numbers' : ''}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-side Shiki generates trusted HTML
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* Expand/collapse button - shows on hover when collapsed, always visible when expanded */}
      {needsCollapse && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center justify-center gap-2 w-full py-2 text-sm font-medium transition-all hover:scale-105 bg-code/30 backdrop-blur-sm border-t border-border/50 ${
            isExpanded
              ? 'opacity-100 text-foreground'
              : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'
          }`}
        >
          <div
            className="transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
          <span className="text-xs">
            {isExpanded ? 'Collapse' : `Expand ${code.split('\n').length} lines`}
          </span>
        </button>
      )}

      {/* Copy button (floating, for blocks without filename) */}
      {!(filename || language) && (
        <motion.button
          type="button"
          onClick={handleCopy}
          animate={isCopied ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={UI_CLASSES.CODE_BLOCK_COPY_BUTTON_FLOATING}
          style={{ minWidth: '48px', minHeight: '48px' }}
          title="Copy code"
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className={'h-4 w-4 text-muted-foreground'} />
          )}
        </motion.button>
      )}
    </div>
  );
}
