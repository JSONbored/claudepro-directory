'use client';

/**
 * Code block with syntax highlighting, screenshot, share, and copy functionality
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { isValidCategory, logUnhandledPromise, type SharePlatform } from '@heyclaude/web-runtime/core';
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
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
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
  if (globalThis.window === undefined) {
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
    const normalized = normalizeError(error, 'Failed to load DOMPurify');
    logClientWarn(
      '[Sanitize] Failed to load DOMPurify',
      normalized,
      'sanitizeShikiHtml.load',
      {
        component: 'sanitizeShikiHtml',
        action: 'load-dompurify',
        category: 'sanitize',
        recoverable: true,
      }
    );
    return html; // Fallback to original HTML
  }
}

export interface ProductionCodeBlockProps {
  /** Additional CSS classes */
  className?: string | undefined;
  /** Raw code for copy functionality */
  code: string;
  /** Optional filename to display */
  filename?: string | undefined;
  /** Pre-rendered HTML from Sugar High (server-side) */
  html: string;
  /** Programming language (for display) */
  language?: string | undefined;
  /** Maximum visible lines before collapsing (default: 20) */
  maxLines?: number | undefined;
  /** Show line numbers (default: true) */
  showLineNumbers?: boolean | undefined;
}

/**
 * Share Dropdown Component (Internal)
 * Reusable dropdown for Twitter/LinkedIn/Copy actions
 */
interface ShareDropdownProps {
  category: string;
  currentUrl: string;
  onMouseLeave: () => void;
  onShare: (platform: SharePlatform) => void;
  slug: string;
}

function ShareDropdown({ currentUrl, category, slug, onShare, onMouseLeave }: ShareDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="${POSITION_PATTERNS.ABSOLUTE_TOP_RIGHT} border-border bg-card/95 top-full z-50 mt-2 w-56 rounded-lg border p-2 shadow-xl backdrop-blur-md"
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
          <div className="hover:bg-accent/15 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all">
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
          <div className="hover:bg-accent/15 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all">
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
        className="text-foreground hover:bg-accent/15 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
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
    if (globalThis.window !== undefined && html) {
      sanitizeShikiHtml(html)
        .then((sanitized) => {
          setSafeHtml(sanitized);
        })
        .catch((error) => {
          const normalized = normalizeError(error, 'Failed to sanitize HTML');
          logClientWarn(
            '[Sanitize] Failed to sanitize HTML',
            normalized,
            'ProductionCodeBlock.sanitize',
            {
              component: 'ProductionCodeBlock',
              action: 'sanitize-html',
              category: 'sanitize',
              recoverable: true,
            }
          );
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
      logClientWarn(
        'Invalid category in pathname, using fallback',
        undefined,
        'ProductionCodeBlock.parsePathname',
        {
          component: 'ProductionCodeBlock',
          action: 'parse-pathname',
          rawCategory,
          pathname,
          fallback: Constants.public.Enums.content_category[0], // 'agents'
        }
      );
      return {
        category: Constants.public.Enums
          .content_category[0] as Database['public']['Enums']['content_category'],
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

  // Load timeout config on mount
  useEffect(() => {
    const config = getTimeoutConfig();
    const override = config['timeout.ui.clipboard_reset_delay_ms'];
    if (typeof override === 'number' && Number.isFinite(override) && override > 0) {
      setClipboardResetDelay(override);
    }
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
      const normalized = normalizeError(error, 'Copy failed');
      logClientWarn(
        '[Clipboard] Copy failed',
        normalized,
        'ProductionCodeBlock.handleCopy',
        {
          component: 'ProductionCodeBlock',
          action: 'copy',
          category: 'clipboard',
          recoverable: true,
          userRetryable: true,
          itemCategory: category,
          itemSlug: slug,
        }
      );
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
      const normalized = normalizeError(error, 'Screenshot generation failed');
      logClientWarn(
        '[Share] Screenshot generation failed',
        normalized,
        'ProductionCodeBlock.handleScreenshot',
        {
          component: 'ProductionCodeBlock',
          action: 'screenshot',
          category: 'share',
          recoverable: true,
          userRetryable: true,
          itemCategory: category,
          itemSlug: slug,
        }
      );
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
          .replaceAll(/[/\\:*?"|<>]/g, '-')
          .replaceAll(/\s+/g, '-')
          .replaceAll(/-+/g, '-')
          .replaceAll(/^-+|-+$/g, '')
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
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toasts.success.codeDownloadStarted();

      // Track download
      pulse.download({ category, slug, action_type: 'download_code' }).catch((error) => {
        logUnhandledPromise('interactive-code-block:download', error, {
          category,
          slug,
        });
      });
    } catch (error) {
      toasts.error.downloadFailed();
      const normalized = normalizeError(error, 'Download failed');
      logClientWarn(
        '[Share] Download failed',
        normalized,
        'ProductionCodeBlock.handleDownload',
        {
          component: 'ProductionCodeBlock',
          action: 'download',
          category: 'share',
          recoverable: true,
          userRetryable: true,
          itemCategory: category,
          itemSlug: slug,
        }
      );
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
      const normalized = normalizeError(error, 'Share failed');
      logClientWarn(
        '[Share] Share failed',
        normalized,
        'ProductionCodeBlock.handleShare',
        {
          component: 'ProductionCodeBlock',
          action: 'share',
          category: 'share',
          recoverable: true,
          userRetryable: true,
          itemCategory: category,
          itemSlug: slug,
          platform,
        }
      );
    }
  };

  const maxHeight = `${maxLines * 1.6}rem`; // 1.6rem per line

  return (
    <div className={`${UI_CLASSES.CODE_BLOCK_GROUP_WRAPPER} ${className}`}>
      {/* Header with filename, language badge, and action buttons */}
      {filename ? (
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
              {isShareOpen ? (
                <ShareDropdown
                  currentUrl={currentUrl}
                  category={category}
                  slug={slug}
                  onShare={handleShare}
                  onMouseLeave={() => setIsShareOpen(false)}
                />
              ) : null}
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

            {/* Language badge - Polar-style minimal */}
            {language && language !== 'text' ? (
              <div className="text-muted-foreground px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                {language}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Code block container - Polar-style clean design */}
      <div
        ref={codeBlockRef}
        className="border-border relative overflow-hidden rounded-lg border transition-[height] duration-300 ease-in-out"
        style={{
          height: needsCollapse && !isExpanded ? maxHeight : 'auto',
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
              {isShareOpen ? (
                <ShareDropdown
                  currentUrl={currentUrl}
                  category={category}
                  slug={slug}
                  onShare={handleShare}
                  onMouseLeave={() => setIsShareOpen(false)}
                />
              ) : null}
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

            {/* Language badge - Polar-style minimal */}
            {language && language !== 'text' ? (
              <div className="text-muted-foreground px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                {language}
              </div>
            ) : null}
          </div>
        )}

        {/* Gradient fade when collapsed */}
        {needsCollapse && !isExpanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-b from-transparent to-[#1e1e1e] dark:to-[#1e1e1e] [html[data-theme='light']_&]:to-[#fafafa]" />
        ) : null}

        {/* Server-rendered Shiki HTML */}
        <div
          ref={preRef}
          className={showLineNumbers ? 'code-with-line-numbers' : ''}
          // eslint-disable-next-line jsx-a11y/no-danger -- HTML is sanitized with DOMPurify with strict allowlist for Shiki
          // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized with DOMPurify using strict allowlist for Shiki syntax highlighting
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </div>

      {/* Expand/collapse button - Polar-style minimal */}
      {needsCollapse ? (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="border-border/40 text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 border-t py-2 text-xs transition-colors"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
          <span>{isExpanded ? 'Collapse' : `Show ${code.split('\n').length} lines`}</span>
        </button>
      ) : null}
    </div>
  );
}
