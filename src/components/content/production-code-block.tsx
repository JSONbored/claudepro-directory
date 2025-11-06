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
import { LinkedinShareButton, TwitterShareButton } from 'react-share';
import { APP_CONFIG } from '@/src/lib/constants';
import { trackInteraction } from '@/src/lib/edge/client';
import { Camera, Check, ChevronDown, Code, Copy, Linkedin, Share2, Twitter } from '@/src/lib/icons';
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
  /** Pre-rendered HTML from Sugar High (server-side) */
  html: string;
  /** Raw code for copy functionality */
  code: string;
  /** Programming language (for display) */
  language?: string | undefined;
  /** Optional filename to display */
  filename?: string | undefined;
  /** Maximum visible lines before collapsing (default: 20) */
  maxLines?: number | undefined;
  /** Show line numbers (default: true) */
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
  showLineNumbers = true,
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

  // Calculate current URL for sharing (needed during render for react-share components)
  const currentUrl = `${APP_CONFIG.url}${pathname || ''}`;

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

      trackInteraction({
        interaction_type: 'copy',
        content_type: category,
        content_slug: slug,
      }).catch(() => {
        // Intentional
      });
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

    // Failsafe timeout: Reset state after 5 seconds regardless of outcome
    const failsafeTimeout = setTimeout(() => {
      setIsScreenshotting(false);
    }, 5000);

    try {
      const screenshot = await generateCodeScreenshot({
        element: codeBlockRef.current,
        watermark: `claudepro.directory/${category}/${slug}`,
        watermarkPosition: 'bottom-right',
        scale: 2, // Retina quality
        maxWidth: 1200,
        padding: 24,
        title: filename,
        category: category,
      });

      // Detect format from dataUrl
      const format = screenshot.dataUrl.startsWith('data:image/webp') ? 'webp' : 'png';
      const screenshotFilename = generateScreenshotFilename(category, slug, format);

      // Copy to clipboard (primary action)
      await copyScreenshotToClipboard(screenshot.blob);
      toasts.success.screenshotCopied();

      // Also trigger download for user convenience
      downloadScreenshot(screenshot.dataUrl, screenshotFilename);

      trackInteraction({
        interaction_type: 'screenshot',
        content_type: category,
        content_slug: slug,
        metadata: {
          width: screenshot.width,
          height: screenshot.height,
        },
      }).catch(() => {
        // Intentional
      });
    } catch (error) {
      toasts.error.screenshotFailed();
      logger.error('Screenshot generation failed', error as Error);
    } finally {
      clearTimeout(failsafeTimeout);
      setIsScreenshotting(false);
    }
  };

  /**
   * Handle share link copy
   * Performance: Reuse pathname parsing, UTM tracking for viral attribution
   */
  const handleShare = async (platform: SharePlatform) => {
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

      trackShare({ platform, category, slug, url: currentUrl }).catch(() => {
        // Intentional
      });

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

        trackEmbedGeneration({ category, slug, format: 'iframe' }).catch(() => {
          // Intentional
        });
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
          <div className="flex items-center gap-1">
            {/* Screenshot button */}
            <motion.button
              type="button"
              onClick={handleScreenshot}
              disabled={isScreenshotting}
              className="flex items-center justify-center rounded-md bg-code/95 p-1.5 text-muted-foreground shadow-md backdrop-blur-md transition-colors hover:bg-code hover:text-foreground disabled:opacity-50"
              title={isScreenshotting ? 'Capturing screenshot...' : 'Screenshot code'}
            >
              <Camera className="h-3.5 w-3.5" />
            </motion.button>

            {/* Share button with dropdown */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setIsShareOpen(!isShareOpen)}
                className="flex items-center justify-center rounded-md bg-code/95 p-1.5 text-muted-foreground shadow-md backdrop-blur-md transition-colors hover:bg-code hover:text-foreground"
                title="Share code"
              >
                <Share2 className="h-3.5 w-3.5" />
              </motion.button>

              {/* Share dropdown - positioned below button */}
              {isShareOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md"
                  onMouseLeave={() => setIsShareOpen(false)}
                >
                  {/* Twitter Share */}
                  <div className="share-button-wrapper mb-1">
                    <TwitterShareButton
                      url={generateShareUrl({
                        url: currentUrl,
                        category,
                        slug,
                        platform: 'twitter',
                        title: `${category} - ${slug}`,
                      })}
                      title={generateShareText({
                        url: currentUrl,
                        category,
                        slug,
                        platform: 'twitter',
                        title: `${category} - ${slug}`,
                      })}
                      onClick={() => handleShare('twitter')}
                    >
                      <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all hover:bg-accent/15">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1DA1F2]/20">
                          <Twitter className="h-3 w-3 text-[#1DA1F2]" />
                        </div>
                        <span className="text-foreground">Share on Twitter</span>
                      </div>
                    </TwitterShareButton>
                  </div>

                  {/* LinkedIn Share */}
                  <div className="share-button-wrapper mb-1">
                    <LinkedinShareButton
                      url={generateShareUrl({
                        url: currentUrl,
                        category,
                        slug,
                        platform: 'linkedin',
                        title: `${category} - ${slug}`,
                      })}
                      title={generateShareText({
                        url: currentUrl,
                        category,
                        slug,
                        platform: 'linkedin',
                        title: `${category} - ${slug}`,
                      })}
                      summary={`Check out this ${category} resource on claudepro.directory`}
                      onClick={() => handleShare('linkedin')}
                    >
                      <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all hover:bg-accent/15">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0A66C2]/20">
                          <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                        </div>
                        <span className="text-foreground">Share on LinkedIn</span>
                      </div>
                    </LinkedinShareButton>
                  </div>

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={() => handleShare('copy_link')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-foreground text-sm transition-all hover:scale-[1.02] hover:bg-accent/15 active:scale-[0.98]"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                      <Copy className="h-3 w-3" />
                    </div>
                    <span>Copy Link</span>
                  </button>

                  {/* Embed Code */}
                  <button
                    type="button"
                    onClick={handleEmbedCopy}
                    className="mt-1 flex w-full items-center gap-3 rounded-md border-border/50 border-t px-3 py-2 pt-3 text-foreground text-sm transition-colors hover:bg-accent/10"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                      <Code className="h-3 w-3" />
                    </div>
                    <span>Copy Embed Code</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Copy button */}
            <motion.button
              type="button"
              onClick={handleCopy}
              animate={isCopied ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center rounded-md bg-code/95 p-1.5 shadow-md backdrop-blur-md transition-colors hover:bg-code"
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </motion.button>

            {/* Language badge */}
            {language && language !== 'text' && (
              <div className="rounded-full border border-accent/30 bg-gradient-to-r from-accent/15 to-accent/10 px-2.5 py-1 font-semibold text-2xs text-accent uppercase tracking-wider shadow-md backdrop-blur-md">
                {language}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code block container with enhanced 4-layer shadow system */}
      <div
        ref={codeBlockRef}
        className="relative overflow-hidden rounded-lg border border-border transition-[height] duration-300 ease-in-out"
        style={{
          height: needsCollapse && !isExpanded ? maxHeight : 'auto',
          boxShadow:
            '0 0 0 1px rgba(255, 255, 255, 0.03), 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Top-right action buttons + badge (when no filename header) */}
        {!filename && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
            {/* Screenshot button */}
            <motion.button
              type="button"
              onClick={handleScreenshot}
              disabled={isScreenshotting}
              className="flex items-center justify-center rounded-md bg-code/95 p-1.5 text-muted-foreground shadow-md backdrop-blur-md transition-colors hover:bg-code hover:text-foreground disabled:opacity-50"
              title={isScreenshotting ? 'Capturing screenshot...' : 'Screenshot code'}
            >
              <Camera className="h-3.5 w-3.5" />
            </motion.button>

            {/* Share button with dropdown */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setIsShareOpen(!isShareOpen)}
                className="flex items-center justify-center rounded-md bg-code/95 p-1.5 text-muted-foreground shadow-md backdrop-blur-md transition-colors hover:bg-code hover:text-foreground"
                title="Share code"
              >
                <Share2 className="h-3.5 w-3.5" />
              </motion.button>

              {/* Share dropdown - positioned below button */}
              {isShareOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md"
                  onMouseLeave={() => setIsShareOpen(false)}
                >
                  {/* Twitter Share */}
                  <div className="share-button-wrapper mb-1">
                    <TwitterShareButton
                      url={generateShareUrl({
                        url: currentUrl,
                        category,
                        slug,
                        platform: 'twitter',
                        title: `${category} - ${slug}`,
                      })}
                      title={generateShareText({
                        url: currentUrl,
                        category,
                        slug,
                        platform: 'twitter',
                        title: `${category} - ${slug}`,
                      })}
                      onClick={() => handleShare('twitter')}
                    >
                      <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all hover:bg-accent/15">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1DA1F2]/20">
                          <Twitter className="h-3 w-3 text-[#1DA1F2]" />
                        </div>
                        <span className="text-foreground">Share on Twitter</span>
                      </div>
                    </TwitterShareButton>
                  </div>

                  {/* LinkedIn Share */}
                  <div className="share-button-wrapper mb-1">
                    <LinkedinShareButton
                      url={generateShareUrl({
                        url: currentUrl,
                        category,
                        slug,
                        platform: 'linkedin',
                        title: `${category} - ${slug}`,
                      })}
                      title={generateShareText({
                        url: currentUrl,
                        category,
                        slug,
                        platform: 'linkedin',
                        title: `${category} - ${slug}`,
                      })}
                      summary={`Check out this ${category} resource on claudepro.directory`}
                      onClick={() => handleShare('linkedin')}
                    >
                      <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all hover:bg-accent/15">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0A66C2]/20">
                          <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                        </div>
                        <span className="text-foreground">Share on LinkedIn</span>
                      </div>
                    </LinkedinShareButton>
                  </div>

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={() => handleShare('copy_link')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-foreground text-sm transition-all hover:scale-[1.02] hover:bg-accent/15 active:scale-[0.98]"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                      <Copy className="h-3 w-3" />
                    </div>
                    <span>Copy Link</span>
                  </button>

                  {/* Embed Code */}
                  <button
                    type="button"
                    onClick={handleEmbedCopy}
                    className="mt-1 flex w-full items-center gap-3 rounded-md border-border/50 border-t px-3 py-2 pt-3 text-foreground text-sm transition-colors hover:bg-accent/10"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                      <Code className="h-3 w-3" />
                    </div>
                    <span>Copy Embed Code</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Copy button */}
            <motion.button
              type="button"
              onClick={handleCopy}
              animate={isCopied ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center rounded-md bg-code/95 p-1.5 shadow-md backdrop-blur-md transition-colors hover:bg-code"
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </motion.button>

            {/* Language badge */}
            {language && language !== 'text' && (
              <div className="rounded-full border border-accent/30 bg-gradient-to-r from-accent/15 to-accent/10 px-2.5 py-1 font-semibold text-2xs text-accent uppercase tracking-wider shadow-md backdrop-blur-md">
                {language}
              </div>
            )}
          </div>
        )}

        {/* Gradient fade when collapsed - with smooth CSS transition */}
        {needsCollapse && !isExpanded && (
          <div
            className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-24 transition-opacity duration-200"
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

      {/* Expand/collapse button - always visible for better UX */}
      {needsCollapse && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex w-full items-center justify-center gap-2 border-border/50 border-t bg-code/30 py-2 font-medium text-sm backdrop-blur-sm transition-all hover:scale-105 ${
            isExpanded
              ? 'text-foreground opacity-100'
              : 'text-muted-foreground opacity-100 hover:text-foreground'
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
    </div>
  );
}
