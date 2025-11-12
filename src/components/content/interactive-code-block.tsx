'use client';

/**
 * Code block with syntax highlighting, screenshot, share, and copy functionality
 */

import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LinkedinShareButton, TwitterShareButton } from 'react-share';
import { APP_CONFIG } from '@/src/lib/constants';
import { trackInteraction } from '@/src/lib/edge/client';
import { Camera, Check, ChevronDown, Copy, Linkedin, Share2, Twitter } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';
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

/**
 * Share Dropdown Component (Internal)
 * Reusable dropdown for Twitter/LinkedIn/Copy actions
 */
interface ShareDropdownProps {
  currentUrl: string;
  category: string;
  slug: string;
  onShare: (platform: SharePlatform) => void;
  onMouseLeave: () => void;
}

function ShareDropdown({ currentUrl, category, slug, onShare, onMouseLeave }: ShareDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="${POSITION_PATTERNS.ABSOLUTE_TOP_RIGHT} top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md"
      onMouseLeave={onMouseLeave}
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
          onClick={() => onShare('twitter')}
        >
          <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all hover:bg-accent/15">
            <div className={`${UI_CLASSES.CODE_BLOCK_SOCIAL_ICON_WRAPPER} bg-[#1DA1F2]/20`}>
              <Twitter className={`${UI_CLASSES.ICON_XS} text-[#1DA1F2]`} />
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
          onClick={() => onShare('linkedin')}
        >
          <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all hover:bg-accent/15">
            <div className={`${UI_CLASSES.CODE_BLOCK_SOCIAL_ICON_WRAPPER} bg-[#0A66C2]/20`}>
              <Linkedin className={`${UI_CLASSES.ICON_XS} text-[#0A66C2]`} />
            </div>
            <span className="text-foreground">Share on LinkedIn</span>
          </div>
        </LinkedinShareButton>
      </div>

      {/* Copy Link */}
      <button
        type="button"
        onClick={() => onShare('copy_link')}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-foreground text-sm transition-all hover:scale-[1.02] hover:bg-accent/15 active:scale-[0.98]"
      >
        <div className={`${UI_CLASSES.CODE_BLOCK_SOCIAL_ICON_WRAPPER} bg-accent/20`}>
          <Copy className={UI_CLASSES.ICON_XS} />
        </div>
        <span>Copy Link</span>
      </button>
    </motion.div>
  );
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

  const maxHeight = `${maxLines * 1.6}rem`; // 1.6rem per line

  return (
    <div className={`${UI_CLASSES.CODE_BLOCK_GROUP_WRAPPER} ${className}`}>
      {/* Header with filename, language badge, and action buttons */}
      {filename && (
        <div className={UI_CLASSES.CODE_BLOCK_HEADER}>
          <span className={UI_CLASSES.CODE_BLOCK_FILENAME}>{filename}</span>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
            {/* Screenshot button */}
            <motion.button
              type="button"
              onClick={handleScreenshot}
              disabled={isScreenshotting}
              className={`${UI_CLASSES.CODE_BLOCK_BUTTON_ICON} disabled:opacity-50`}
              title={isScreenshotting ? 'Capturing screenshot...' : 'Screenshot code'}
            >
              <Camera className={UI_CLASSES.ICON_XS} />
            </motion.button>

            {/* Share button with dropdown */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setIsShareOpen(!isShareOpen)}
                className={UI_CLASSES.CODE_BLOCK_BUTTON_ICON}
                title="Share code"
              >
                <Share2 className={UI_CLASSES.ICON_XS} />
              </motion.button>

              {/* Share dropdown - positioned below button */}
              {isShareOpen && (
                <ShareDropdown
                  currentUrl={currentUrl}
                  category={category}
                  slug={slug}
                  onShare={handleShare}
                  onMouseLeave={() => setIsShareOpen(false)}
                />
              )}
            </div>

            {/* Copy button */}
            <motion.button
              type="button"
              onClick={handleCopy}
              animate={isCopied ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={UI_CLASSES.CODE_BLOCK_BUTTON_BASE}
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? (
                <Check className={`${UI_CLASSES.ICON_XS} text-green-500`} />
              ) : (
                <Copy className={`${UI_CLASSES.ICON_XS} text-muted-foreground`} />
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
          <div className="${POSITION_PATTERNS.ABSOLUTE_TOP_RIGHT_OFFSET_LG} z-20 flex items-center gap-1">
            {/* Screenshot button */}
            <motion.button
              type="button"
              onClick={handleScreenshot}
              disabled={isScreenshotting}
              className={`${UI_CLASSES.CODE_BLOCK_BUTTON_ICON} disabled:opacity-50`}
              title={isScreenshotting ? 'Capturing screenshot...' : 'Screenshot code'}
            >
              <Camera className={UI_CLASSES.ICON_XS} />
            </motion.button>

            {/* Share button with dropdown */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setIsShareOpen(!isShareOpen)}
                className={UI_CLASSES.CODE_BLOCK_BUTTON_ICON}
                title="Share code"
              >
                <Share2 className={UI_CLASSES.ICON_XS} />
              </motion.button>

              {/* Share dropdown - positioned below button */}
              {isShareOpen && (
                <ShareDropdown
                  currentUrl={currentUrl}
                  category={category}
                  slug={slug}
                  onShare={handleShare}
                  onMouseLeave={() => setIsShareOpen(false)}
                />
              )}
            </div>

            {/* Copy button */}
            <motion.button
              type="button"
              onClick={handleCopy}
              animate={isCopied ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={UI_CLASSES.CODE_BLOCK_BUTTON_BASE}
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? (
                <Check className={`${UI_CLASSES.ICON_XS} text-green-500`} />
              ) : (
                <Copy className={`${UI_CLASSES.ICON_XS} text-muted-foreground`} />
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
            className="${POSITION_PATTERNS.ABSOLUTE_BOTTOM_FULL} pointer-events-none z-10 h-24 transition-opacity duration-200"
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
            <ChevronDown className={UI_CLASSES.ICON_SM} />
          </div>
          <span className="text-xs">
            {isExpanded ? 'Collapse' : `Expand ${code.split('\n').length} lines`}
          </span>
        </button>
      )}
    </div>
  );
}
