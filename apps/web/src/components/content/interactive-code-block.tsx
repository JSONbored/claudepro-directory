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
  animateDuration,
  backdrop,
  bgColor,
  border,
  borderTop,
  cluster,
  codeBlock,
  gap,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  muted,
  overflow,
  padding,
  radius,
  shadow,
  size,
  textColor,
  tracking,
  transition,
  weight,
  zLayer,
} from '@heyclaude/web-runtime/design-system';
import {
  copyScreenshotToClipboard,
  copyShareLink,
  downloadScreenshot,
  generateCodeScreenshot,
  generateScreenshotFilename,
  generateShareText,
  generateShareUrl,
  toasts,
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
    const normalized = normalizeError(error, 'Failed to load DOMPurify');
    logger.warn('[Sanitize] Failed to load DOMPurify', {
      err: normalized,
      category: 'sanitize',
      component: 'sanitizeShikiHtml',
      recoverable: true,
    });
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

/**
 * Floating share dropdown offering Twitter, LinkedIn, and copy-link actions.
 *
 * @param currentUrl - Full URL to include in generated share links and texts.
 * @param category - Content category used in generated share metadata and share text.
 * @param slug - Content slug used in generated share metadata and share text.
 * @param onShare - Callback invoked with the selected platform identifier: `'twitter'`, `'linkedin'`, or `'copy_link'`.
 * @param onMouseLeave - Callback invoked when the pointer leaves the dropdown (used to close the dropdown).
 * @returns A React element rendering the share dropdown UI.
 *
 * @see generateShareUrl
 * @see generateShareText
 * @see TwitterShareButton
 * @see LinkedinShareButton
 */
function ShareDropdown({ currentUrl, category, slug, onShare, onMouseLeave }: ShareDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute right-0 top-full ${zLayer.modal} ${marginTop.compact} w-56 ${radius.lg} ${border.default} bg-card/95 ${padding.tight} ${shadow.xl} ${backdrop.md}`}
      onMouseLeave={onMouseLeave}
    >
      {/* Twitter Share */}
      <div className={`share-button-wrapper ${marginBottom.micro}`}>
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
          <div className={`flex w-full ${alignItems.center} ${gap.default} ${radius.lg} ${padding.xCompact} py-2.5 ${weight.medium} ${size.sm} ${transition.all} hover:bg-accent/15`}>
            <div className={`${codeBlock.socialIconWrapper} bg-[#1DA1F2]/20`}>
              <Twitter className={`${iconSize.xs} text-[#1DA1F2]`} />
            </div>
            <span className="text-foreground">Share on Twitter</span>
          </div>
        </TwitterShareButton>
      </div>

      {/* LinkedIn Share */}
      <div className={`share-button-wrapper ${marginBottom.micro}`}>
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
          <div className={`flex w-full ${alignItems.center} ${gap.default} ${radius.lg} ${padding.xCompact} py-2.5 ${weight.medium} ${size.sm} ${transition.all} hover:bg-accent/15`}>
            <div className={`${codeBlock.socialIconWrapper} bg-[#0A66C2]/20`}>
              <Linkedin className={`${iconSize.xs} text-[#0A66C2]`} />
            </div>
            <span className="text-foreground">Share on LinkedIn</span>
          </div>
        </LinkedinShareButton>
      </div>

      {/* Copy Link */}
      <button
        type="button"
        onClick={() => onShare('copy_link')}
        className={`flex w-full ${alignItems.center} ${gap.default} ${radius.lg} ${padding.xCompact} py-2.5 ${weight.medium} ${textColor.foreground} ${size.sm} ${transition.all} hover:scale-[1.02] hover:bg-accent/15 active:scale-[0.98]`}
      >
        <div className={`${codeBlock.socialIconWrapper} ${bgColor['accent/20']}`}>
          <Copy className={iconSize.xs} />
        </div>
        <span>Copy Link</span>
      </button>
    </motion.div>
  );
}

/**
 * Render an interactive, syntax-highlighted code block with actions for copy, screenshot, share, and download.
 *
 * Sanitizes server-rendered Shiki HTML on the client, optionally shows a filename and language badge,
 * collapses long blocks based on `maxLines`, and wires UI controls to client-side handlers and telemetry.
 *
 * @param html - Server-rendered Shiki HTML; sanitized on the client before insertion into the DOM.
 * @param code - Raw source code used for copy, download, and screenshot generation.
 * @param language - Language label shown in the badge and used to infer a default download extension; defaults to `'text'`.
 * @param filename - Optional filename displayed in the header and used as the screenshot title when provided.
 * @param maxLines - Number of lines before the block collapses; defaults to `20`.
 * @param showLineNumbers - Whether to apply line-number styling to the rendered HTML; defaults to `true`.
 * @param className - Additional CSS classes applied to the outer container.
 * @returns The JSX element for the interactive code block.
 *
 * @see sanitizeShikiHtml
 * @see ShareDropdown
 * @see generateCodeScreenshot
 */
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
          logger.warn('[Sanitize] Failed to sanitize HTML', {
            err: error,
            category: 'sanitize',
            component: 'ProductionCodeBlock',
            recoverable: true,
          });
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
      logger.warn('[Clipboard] Copy failed', {
        err: normalized,
        category: 'clipboard',
        component: 'ProductionCodeBlock',
        recoverable: true,
        userRetryable: true,
        itemCategory: category,
        itemSlug: slug,
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
      const normalized = normalizeError(error, 'Screenshot generation failed');
      logger.warn('[Share] Screenshot generation failed', {
        err: normalized,
        category: 'share',
        component: 'ProductionCodeBlock',
        recoverable: true,
        userRetryable: true,
        itemCategory: category,
        itemSlug: slug,
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
      const normalized = normalizeError(error, 'Download failed');
      logger.warn('[Share] Download failed', {
        err: normalized,
        category: 'share',
        component: 'ProductionCodeBlock',
        recoverable: true,
        userRetryable: true,
        itemCategory: category,
        itemSlug: slug,
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
      const normalized = normalizeError(error, 'Share failed');
      logger.warn('[Share] Share failed', {
        err: normalized,
        category: 'share',
        component: 'ProductionCodeBlock',
        recoverable: true,
        userRetryable: true,
        itemCategory: category,
        itemSlug: slug,
        platform,
      });
    }
  };

  const maxHeight = `${maxLines * 1.6}rem`; // 1.6rem per line

  return (
    <div className={`${codeBlock.groupWrapper} ${className}`}>
      {/* Header with filename, language badge, and action buttons */}
      {filename && (
        <div className={codeBlock.header}>
          <span className={codeBlock.filename}>{filename}</span>
          <div className={cluster.tight}>
            {/* Screenshot button */}
            <motion.button
              type="button"
              onClick={handleScreenshot}
              disabled={isScreenshotting}
              className={`${codeBlock.buttonIcon} disabled:opacity-50`}
              title={isScreenshotting ? 'Capturing screenshot...' : 'Screenshot code'}
            >
              <Camera className={iconSize.xs} />
            </motion.button>

            {/* Share button with dropdown */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setIsShareOpen(!isShareOpen)}
                className={codeBlock.buttonIcon}
                title="Share code"
              >
                <Share2 className={iconSize.xs} />
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
              className={codeBlock.buttonBase}
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? (
                <Check className={`${iconSize.xs} ${textColor.green}`} />
              ) : (
                <Copy className={`${iconSize.xs} ${muted.default}`} />
              )}
            </motion.button>

            {/* Download button */}
            <motion.button
              type="button"
              onClick={handleDownload}
              className={codeBlock.buttonIcon}
              title="Download code"
            >
              <Download className={iconSize.xs} />
            </motion.button>

            {/* Language badge - Polar-style minimal */}
            {language && language !== 'text' && (
              <div className={`px-2 ${padding.yHair} ${weight.semibold} ${size['2xs']} ${muted.default} uppercase ${tracking.wider}`}>
                {language}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code block container - Polar-style clean design */}
      <div
        ref={codeBlockRef}
        className={`relative ${overflow.hidden} ${radius.lg} ${border.default} transition-[height] ${animateDuration.slow} ease-in-out`}
        style={{
          height: needsCollapse && !isExpanded ? maxHeight : 'auto',
        }}
      >
        {/* Top-right action buttons + badge (when no filename header) */}
        {!filename && (
          <div className={`absolute right-4 top-4 ${zLayer.sticky} ${cluster.tight}`}>
            {/* Screenshot button */}
            <motion.button
              type="button"
              onClick={handleScreenshot}
              disabled={isScreenshotting}
              className={`${codeBlock.buttonIcon} disabled:opacity-50`}
              title={isScreenshotting ? 'Capturing screenshot...' : 'Screenshot code'}
            >
              <Camera className={iconSize.xs} />
            </motion.button>

            {/* Share button with dropdown */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setIsShareOpen(!isShareOpen)}
                className={codeBlock.buttonIcon}
                title="Share code"
              >
                <Share2 className={iconSize.xs} />
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
              className={codeBlock.buttonBase}
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? (
                <Check className={`${iconSize.xs} ${textColor.green}`} />
              ) : (
                <Copy className={`${iconSize.xs} ${muted.default}`} />
              )}
            </motion.button>

            {/* Download button */}
            <motion.button
              type="button"
              onClick={handleDownload}
              className={codeBlock.buttonIcon}
              title="Download code"
            >
              <Download className={iconSize.xs} />
            </motion.button>

            {/* Language badge - Polar-style minimal */}
            {language && language !== 'text' && (
              <div className={`px-2 ${padding.yHair} ${weight.semibold} ${size['2xs']} ${muted.default} uppercase ${tracking.wider}`}>
                {language}
              </div>
            )}
          </div>
        )}

        {/* Gradient fade when collapsed */}
        {needsCollapse && !isExpanded && (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 ${zLayer.raised} h-20 bg-gradient-to-b from-transparent to-[#1e1e1e] dark:to-[#1e1e1e] [html[data-theme='light']_&]:to-[#fafafa]`}
          />
        )}

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
      {needsCollapse && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex w-full ${alignItems.center} ${justify.center} ${gap.snug} ${borderTop.subtle} ${padding.yCompact} ${muted.default} ${size.xs} ${transition.colors} hover:text-foreground`}
        >
          <ChevronDown 
            className={`${iconSize.xsPlus} ${transition.transform} ${animateDuration.default} ${isExpanded ? 'rotate-180' : ''}`}
          />
          <span>
            {isExpanded ? 'Collapse' : `Show ${code.split('\n').length} lines`}
          </span>
        </button>
      )}
    </div>
  );
}