'use client';

/**
 * Code block with syntax highlighting, screenshot, share, and copy functionality
 */

import { Constants, type Database } from '@heyclaude/database-types';
import {
  isValidCategory,
  logger,
  logUnhandledPromise,
  normalizeError,
  type SharePlatform,
} from '@heyclaude/web-runtime/core';
import { getTimeoutConfig } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import {
  Camera,
  Check,
  ChevronDown,
  Copy,
  Download,
  Linkedin,
  Share2,
  Twitter,
} from '@heyclaude/web-runtime/icons';
import {
  copyScreenshotToClipboard,
  copyShareLink,
  downloadScreenshot,
  generateCodeScreenshot,
  generateScreenshotFilename,
  generateShareText,
  generateShareUrl,
  toasts,
  UI_CLASSES,
} from '@heyclaude/web-runtime/ui';
// DOMPurify will be dynamically imported
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LinkedinShareButton, TwitterShareButton } from 'react-share';

const CLIPBOARD_RESET_DEFAULT_MS = 2000;

/**
 * Sanitize Shiki-generated HTML for safe use in dangerouslySetInnerHTML
 * Only allows tags and attributes that Shiki uses for syntax highlighting
 * Prevents XSS while preserving syntax highlighting
 */
async function sanitizeShikiHtml(html: string): Promise<string> {
  if (!html || typeof html !== 'string') return '';
  // DOMPurify only works in browser - dynamically import
  if (typeof window === 'undefined') {
    return html; // During SSR, return unsanitized (will be sanitized on client)
  }
  try {
    const DOMPurify = await import('dompurify');
    // Sanitize with very restrictive allowlist for Shiki HTML
    // Shiki typically uses: <pre>, <code>, <span> with class and style attributes
    return DOMPurify.default.sanitize(html, {
      ALLOWED_TAGS: ['pre', 'code', 'span', 'div'],
      ALLOWED_ATTR: ['class', 'style'],
      // Allow data-* attributes (Shiki may use data-* for metadata)
      ALLOW_DATA_ATTR: true,
      // Remove any dangerous protocols or scripts
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'href', 'src'],
    });
  } catch (error) {
    logger.error('sanitizeShikiHtml: Failed to load DOMPurify', normalizeError(error));
    return html; // Fallback to original HTML
  }
}

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
  const [clipboardResetDelay, setClipboardResetDelay] = useState(CLIPBOARD_RESET_DEFAULT_MS);
  const [safeHtml, setSafeHtml] = useState<string>(html);
  const preRef = useRef<HTMLDivElement>(null);
  const pulse = usePulse();
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Sanitize HTML on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && html) {
      sanitizeShikiHtml(html)
        .then((sanitized) => {
          setSafeHtml(sanitized);
        })
        .catch((error) => {
          logger.error('ProductionCodeBlock: Failed to sanitize HTML', error);
          setSafeHtml(html); // Fallback to original
        });
    }
  }, [html]);

  // Extract category and slug from pathname for tracking
  // Memoize to avoid repeated validation on every render
  const { category, slug } = useMemo(() => {
    const pathParts = pathname?.split('/').filter(Boolean) || [];
    const rawCategory = pathParts[0] || 'unknown';
    const slug = pathParts[1] || 'unknown';

    // Warn and use explicit sentinel for invalid categories to avoid misleading analytics
    if (!isValidCategory(rawCategory)) {
      logger.warn('Invalid category in pathname, using fallback', {
        rawCategory,
        pathname,
        fallback: Constants.public.Enums.content_category[0], // 'agents'
      });
      return {
        category: Constants.public.Enums.content_category[0] as Database['public']['Enums']['content_category'],
        slug,
      };
    }

    return { category: rawCategory, slug };
  }, [pathname]);

  // Calculate current URL for sharing (needed during render for react-share components)
  const currentUrl = `${APP_CONFIG.url}${pathname || ''}`;

  // Check if content exceeds maxLines (no DOM access needed - calculate from code prop)
  useEffect(() => {
    const lines = code.split('\n').length;
    setNeedsCollapse(lines > maxLines);
  }, [code, maxLines]);

  // Fetch timeout config once on mount
  useEffect(() => {
    getTimeoutConfig()
      .then((result) => {
        const override = result?.['timeout.ui.clipboard_reset_delay_ms'];
        if (typeof override === 'number' && Number.isFinite(override) && override > 0) {
          setClipboardResetDelay(override);
        }
        // Otherwise keep the default value (2000ms)
      })
      .catch((error) => {
        logger.error('ProductionCodeBlock: failed to load timeout config', normalizeError(error));
        // Keep default value (2000ms) on error
      });
  }, []);

  const handleCopy = async () => {
    setIsCopied(true);

    try {
      await navigator.clipboard.writeText(code);
      toasts.success.codeCopied();

      pulse.copy({ category, slug }).catch((error) => {
        logUnhandledPromise('interactive-code-block:copy', error, { category, slug });
      });
    } catch (error) {
      setIsCopied(false);
      logger.error('ProductionCodeBlock: copy failed', normalizeError(error), {
        category,
        slug,
      });
      toasts.error.copyFailed('code');
      return;
    }

    // Use cached clipboard reset delay (fetched on mount)
    // Validate delay is a valid positive number before using
    const delay =
      typeof clipboardResetDelay === 'number' &&
      Number.isFinite(clipboardResetDelay) &&
      clipboardResetDelay > 0
        ? clipboardResetDelay
        : CLIPBOARD_RESET_DEFAULT_MS;
    setTimeout(() => setIsCopied(false), delay);
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

      pulse
        .screenshot({
          category,
          slug,
          metadata: {
            width: screenshot.width,
            height: screenshot.height,
          },
        })
        .catch((error) => {
          logUnhandledPromise('interactive-code-block:screenshot', error, {
            category,
            slug,
          });
        });
    } catch (error) {
      toasts.error.screenshotFailed();
      logger.error('Screenshot generation failed', normalizeError(error), {
        category,
        slug,
      });
    } finally {
      clearTimeout(failsafeTimeout);
      setIsScreenshotting(false);
    }
  };

  /**
   * Handle download code as file
   * Downloads the code block content as a text file
   */
  const handleDownload = () => {
    try {
      // Generate filename from provided filename or use default
      let downloadFilename = filename;
      if (!downloadFilename) {
        // Map language to file extension
        const languageExtensions: Record<string, string> = {
          typescript: 'ts',
          javascript: 'js',
          tsx: 'tsx',
          jsx: 'jsx',
          python: 'py',
          json: 'json',
          yaml: 'yml',
          yml: 'yml',
          bash: 'sh',
          shell: 'sh',
          sh: 'sh',
          markdown: 'md',
          md: 'md',
          html: 'html',
          css: 'css',
          sql: 'sql',
          text: 'txt',
        };
        const normalizedLanguage = language?.toLowerCase() ?? 'text';
        const ext = languageExtensions[normalizedLanguage] || normalizedLanguage || 'txt';
        const baseSlug = slug?.trim() || 'untitled';
        const sanitizedSlug = baseSlug
          .replace(/[/\\:*?"|<>]/g, '-')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 64);
        const safeSlug = sanitizedSlug || 'untitled';
        downloadFilename = `code-${safeSlug}.${ext}`;
      }
      
      // Create blob and download
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = downloadFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toasts.success.codeDownloadStarted();

      // Track download
      pulse
        .download({ category, slug, action_type: 'download_code' })
        .catch((error) => {
          logUnhandledPromise('interactive-code-block:download', error, {
            category,
            slug,
          });
        });
    } catch (error) {
      toasts.error.downloadFailed();
      logger.error('Download failed', normalizeError(error), {
        category,
        slug,
      });
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

      pulse.share({ platform, category, slug, url: currentUrl }).catch((error) => {
        logUnhandledPromise('interactive-code-block:share', error, {
          platform,
          category,
          slug,
        });
      });

      setIsShareOpen(false);
    } catch (error) {
      toasts.error.shareFailed();
      logger.error('Share failed', normalizeError(error), {
        category,
        slug,
        platform,
      });
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

            {/* Download button */}
            <motion.button
              type="button"
              onClick={handleDownload}
              className={UI_CLASSES.CODE_BLOCK_BUTTON_ICON}
              title="Download code"
            >
              <Download className={UI_CLASSES.ICON_XS} />
            </motion.button>

            {/* Language badge */}
            {language && language !== 'text' && (
              <div className="rounded-full border border-accent/30 bg-linear-to-r from-accent/15 to-accent/10 px-2.5 py-1 font-semibold text-2xs text-accent uppercase tracking-wider shadow-md backdrop-blur-md">
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

            {/* Download button */}
            <motion.button
              type="button"
              onClick={handleDownload}
              className={UI_CLASSES.CODE_BLOCK_BUTTON_ICON}
              title="Download code"
            >
              <Download className={UI_CLASSES.ICON_XS} />
            </motion.button>

            {/* Language badge */}
            {language && language !== 'text' && (
              <div className="rounded-full border border-accent/30 bg-linear-to-r from-accent/15 to-accent/10 px-2.5 py-1 font-semibold text-2xs text-accent uppercase tracking-wider shadow-md backdrop-blur-md">
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
          // eslint-disable-next-line jsx-a11y/no-danger -- HTML is sanitized with DOMPurify with strict allowlist for Shiki
          dangerouslySetInnerHTML={{ __html: safeHtml }}
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
