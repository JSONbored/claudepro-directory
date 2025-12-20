'use client';

/**
 * Code block with syntax highlighting, screenshot, share, and copy functionality
 */

import type { content_category } from '@prisma/client';
import {
  isValidCategory,
  VALID_CATEGORIES,
} from '@heyclaude/web-runtime/utils/category-validation';
import { DURATION } from '@heyclaude/web-runtime/design-system';
import { logUnhandledPromise } from '@heyclaude/web-runtime/errors';
import { type SharePlatform } from '@heyclaude/web-runtime/client/share';
import { getTimeoutConfig } from '@heyclaude/web-runtime/config/static-configs';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { usePulse } from '@heyclaude/web-runtime/hooks/use-pulse';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
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
  cn,
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
// Removed react-share - using native Web Share API and custom share buttons instead
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { useIsClient } from '@heyclaude/web-runtime/hooks/use-is-client';
import { useTimeout } from '@heyclaude/web-runtime/hooks/use-timeout';

const CLIPBOARD_RESET_DEFAULT_MS = 2000;

/**
 * Escapes HTML to plain text for safe rendering.
 *
 * @param html - HTML string to escape
 * @returns Escaped plain text string
 */
function escapeHtml(html: string): string {
  if (typeof html !== 'string') return '';

  // Guard for SSR: document is not available during server-side rendering
  if (typeof document === 'undefined') {
    // Safe string fallback for SSR: manually escape HTML entities
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sanitizes Shiki-generated HTML for safe insertion via dangerouslySetInnerHTML.
 *
 * Only a minimal set of tags and attributes used by Shiki are preserved:
 * allowed tags: `pre`, `code`, `span`, `div`; allowed attributes: `class`, `style`; `data-*` attributes are allowed.
 *
 * @param html - HTML string produced by Shiki highlighting
 * @returns The sanitized HTML string. If `html` is falsy or not a string, returns an empty string. If running outside a browser (server-side) or if sanitization fails, returns escaped plain text representation.
 */
async function sanitizeShikiHtml(html: string): Promise<string> {
  if (!html || typeof html !== 'string') return '';
  // DOMPurify only works in browser - use shared utility
  if (typeof window === 'undefined') {
    // During SSR, return empty string (will be sanitized on client)
    return '';
  }
  try {
    const { sanitizeHtml } = await import('@heyclaude/web-runtime/utils/dompurify');
    // Sanitize with very restrictive allowlist for Shiki HTML
    // Shiki typically uses: <pre>, <code>, <span> with class and style attributes
    return await sanitizeHtml(html, {
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
    logClientWarn('[Sanitize] Failed to load DOMPurify', normalized, 'sanitizeShikiHtml.load', {
      component: 'sanitizeShikiHtml',
      action: 'load-dompurify',
      category: 'sanitize',
      recoverable: true,
    });
    // Fallback to escaped plain text instead of raw HTML
    return escapeHtml(html);
  }
}

export interface ProductionCodeBlockProps {
  /** Additional CSS classes */
  className?: string | undefined;
  /** Raw code for copy functionality */
  code: string;
  /** Optional filename to display */
  filename?: string | undefined;
  /** Pre-rendered HTML from Shiki (server-side) */
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

/**
 * Renders an animated share dropdown with Twitter, LinkedIn, and copy-link actions.
 *
 * @param currentUrl - The full URL to share.
 * @param category - The content category used to build share metadata.
 * @param slug - The content slug used to build share metadata and URLs.
 * @param onShare - Callback invoked with the chosen share platform: `'twitter' | 'linkedin' | 'copy_link'`.
 * @param onMouseLeave - Optional mouse leave handler for closing the dropdown.
 * @returns The share dropdown React element.
 *
 * @see generateShareUrl
 * @see generateShareText
 */
function ShareDropdown({ currentUrl, category, slug, onShare, onMouseLeave }: ShareDropdownProps) {
  const shouldReduceMotion = useReducedMotion();
  const isClient = useIsClient();
  const supportsWebShare = isClient && typeof navigator !== 'undefined' && 'share' in navigator;

  // Handle native Web Share API (mobile/desktop with support)
  const handleNativeShare = async () => {
    if (!supportsWebShare) return false;

    try {
      const shareText = generateShareText({
        url: currentUrl,
        category,
        slug,
        platform: 'native',
        title: `${category} - ${slug}`,
      });

      await navigator.share({
        title: `${category} - ${slug}`,
        text: shareText,
        url: currentUrl,
      });

      onShare('native');
      return true;
    } catch (error) {
      // User cancelled or error occurred - fall through to platform-specific buttons
      if (error instanceof Error && error.name !== 'AbortError') {
        const normalized = normalizeError(error, 'Native share failed');
        logClientWarn(
          '[Share] Native share failed',
          normalized,
          'ShareDropdown.handleNativeShare',
          {
            component: 'ShareDropdown',
            action: 'native-share',
            category: 'share',
          }
        );
      }
      return false;
    }
  };

  // Handle platform-specific share (opens in new window)
  const handlePlatformShare = (platform: 'twitter' | 'linkedin') => {
    const shareUrl = generateShareUrl({
      url: currentUrl,
      category,
      slug,
      platform,
      title: `${category} - ${slug}`,
    });

    // Open share URL in new window
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    onShare(platform);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      className="border-border bg-card/95 card-base absolute top-0 top-full right-0 z-50 mt-2 w-56 p-3 shadow-xl backdrop-blur-md"
      onMouseLeave={onMouseLeave}
    >
      {/* Native Web Share (if supported) */}
      {supportsWebShare ? (
        <button
          type="button"
          onClick={handleNativeShare}
          className={cn(
            'hover:bg-accent/15 flex w-full items-center',
            'gap-3',
            'rounded-lg',
            'px-4',
            'py-2.5',
            'text-sm',
            'font-medium',
            'transition-all duration-200 ease-out',
            'hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          <div className="flex-center bg-accent/20 h-5 w-5 rounded-full">
            <Share2 className="h-3 w-3" />
          </div>
          <span className="text-foreground">Share</span>
        </button>
      ) : null}

      {/* Twitter Share (fallback if no native share) */}
      {!supportsWebShare ? (
        <button
          type="button"
          onClick={() => handlePlatformShare('twitter')}
          className={cn(
            'hover:bg-accent/15 flex w-full items-center',
            'gap-3',
            'rounded-lg',
            'px-4',
            'py-2.5',
            'text-sm',
            'font-medium',
            'transition-all duration-200 ease-out',
            'hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          <div className="flex-center bg-color-twitter-bg h-5 w-5 rounded-full">
            <Twitter className="text-color-twitter h-3 w-3" />
          </div>
          <span className="text-foreground">Share on Twitter</span>
        </button>
      ) : null}

      {/* LinkedIn Share (fallback if no native share) */}
      {!supportsWebShare ? (
        <button
          type="button"
          onClick={() => handlePlatformShare('linkedin')}
          className={cn(
            'hover:bg-accent/15 flex w-full items-center',
            'gap-3',
            'rounded-lg',
            'px-4',
            'py-2.5',
            'text-sm',
            'font-medium',
            'transition-all duration-200 ease-out',
            'hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          <div className="flex-center bg-color-linkedin-bg h-5 w-5 rounded-full">
            <Linkedin className="text-color-linkedin h-3 w-3" />
          </div>
          <span className="text-foreground">Share on LinkedIn</span>
        </button>
      ) : null}

      {/* Copy Link */}
      <button
        type="button"
        onClick={() => onShare('copy_link')}
        className={cn(
          'text-foreground hover:bg-accent/15 flex w-full items-center',
          'gap-3',
          'rounded-lg',
          'px-4',
          'py-2.5',
          'text-sm',
          'font-medium',
          'transition-all duration-200 ease-out',
          'hover:scale-[1.02] active:scale-[0.98]'
        )}
      >
        <div className="flex-center bg-accent/20 h-5 w-5 rounded-full">
          <Copy className="h-3 w-3" />
        </div>
        <span>Copy Link</span>
      </button>
    </motion.div>
  );
}

/**
 * Renders a sanitized, interactive code block with copy, download, screenshot and share controls.
 *
 * Displays optional filename and language badge, automatically collapses long blocks to `maxLines`
 * with an expand/collapse control, and uses sanitized server-rendered Shiki HTML when available.
 *
 * Uses Shiki for VS Code-quality syntax highlighting with:
 * - Dual theme support (light/dark via CSS variables)
 * - Proper line spacing (fixed terrible line spacing issue)
 * - Line numbers with proper alignment
 * - 100+ language support
 * - Design system integration (typography, colors, spacing)
 *
 * @param html - Pre-rendered HTML produced by Shiki (will be sanitized on the client before insertion)
 * @param code - Raw source text shown/copyable/downloadable
 * @param language - Programming language label used for the language badge and filename extension inference
 * @param filename - Optional display filename; when absent a filename is generated for downloads
 * @param maxLines - Maximum visible lines before the block collapses (default: 20)
 * @param showLineNumbers - Whether to render line numbers styling when using server HTML (default: true)
 * @param className - Optional additional CSS classes applied to the top-level wrapper
 * @returns The rendered code block element with interactive controls and sanitized content
 *
 * @see sanitizeShikiHtml
 * @see ShareDropdown
 * @see highlightCode - Server-side Shiki highlighting utility
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
  const { value: isExpanded, toggle: toggleIsExpanded } = useBoolean();
  const { value: isCopied, setTrue: setIsCopiedTrue, setFalse: setIsCopiedFalse } = useBoolean();
  const {
    value: isScreenshotting,
    setTrue: setIsScreenshottingTrue,
    setFalse: setIsScreenshottingFalse,
  } = useBoolean();
  const {
    value: isShareOpen,
    toggle: toggleIsShareOpen,
    setFalse: setIsShareOpenFalse,
  } = useBoolean();
  const { value: needsCollapse, setValue: setNeedsCollapse } = useBoolean();
  const [clipboardResetDelay, setClipboardResetDelay] = useState(CLIPBOARD_RESET_DEFAULT_MS);
  const [safeHtml, setSafeHtml] = useState<string>(html);
  const preRef = useRef<HTMLPreElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const pulse = usePulse();
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const isClient = useIsClient();

  // Sanitize HTML on client side
  useEffect(() => {
    if (isClient && html) {
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
          // Fallback to escaped plain text instead of raw HTML
          if (isClient) {
            const div = document.createElement('div');
            div.textContent = html;
            setSafeHtml(div.innerHTML);
          } else {
            setSafeHtml('');
          }
        });
    }
  }, [html, isClient]);

  // Extract category and slug from pathname for tracking
  // Memoize to avoid repeated validation on every render
  const { category, slug } = useMemo(() => {
    const pathParts = pathname?.split('/').filter(Boolean) || [];
    const rawCategory = pathParts[0] || 'unknown';
    const slug = pathParts[1] || 'unknown';

    // Warn and use explicit sentinel for invalid categories to avoid misleading analytics
    if (!isValidCategory(rawCategory)) {
      // Defensive fallback: use first valid category from VALID_CATEGORIES
      const fallbackCategory = VALID_CATEGORIES[0] as content_category;
      logClientWarn(
        'Invalid category in pathname, using fallback',
        undefined,
        'ProductionCodeBlock.parsePathname',
        {
          component: 'ProductionCodeBlock',
          action: 'parse-pathname',
          rawCategory,
          pathname,
          fallback: fallbackCategory,
        }
      );
      return {
        category: fallbackCategory,
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
  }, [code, maxLines, setNeedsCollapse]);

  // Load timeout config on mount
  useEffect(() => {
    try {
      const config = getTimeoutConfig();
      const override = config['timeout.ui.clipboard_reset_delay_ms'];
      if (typeof override === 'number' && Number.isFinite(override) && override > 0) {
        setClipboardResetDelay(override);
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to load timeout config');
      logClientWarn(
        '[Config] Failed to load timeout config',
        normalized,
        'ProductionCodeBlock.loadConfig',
        {
          component: 'ProductionCodeBlock',
          action: 'load-timeout-config',
          category: 'config',
          recoverable: true,
        }
      );
    }
  }, []);

  // Use useTimeout for automatic reset after copy
  const delay =
    typeof clipboardResetDelay === 'number' &&
    Number.isFinite(clipboardResetDelay) &&
    clipboardResetDelay > 0
      ? clipboardResetDelay
      : CLIPBOARD_RESET_DEFAULT_MS;

  useTimeout(
    () => {
      if (isCopied) {
        setIsCopiedFalse();
      }
    },
    isCopied ? delay : null
  );

  // Failsafe timeout for screenshot: Reset state after 5 seconds regardless of outcome
  useTimeout(
    () => {
      if (isScreenshotting) {
        setIsScreenshottingFalse();
      }
    },
    isScreenshotting ? 5000 : null
  );

  const handleCopy = async () => {
    setIsCopiedTrue();

    try {
      await navigator.clipboard.writeText(code);
      toasts.success.codeCopied();

      pulse.copy({ category, slug }).catch((error) => {
        logUnhandledPromise('interactive-code-block:copy', error, { category, slug });
      });
    } catch (error) {
      setIsCopiedFalse();
      const normalized = normalizeError(error, 'Copy failed');
      logClientWarn('[Clipboard] Copy failed', normalized, 'ProductionCodeBlock.handleCopy', {
        component: 'ProductionCodeBlock',
        action: 'copy',
        category: 'clipboard',
        recoverable: true,
        userRetryable: true,
        itemCategory: category,
        itemSlug: slug,
      });
      // Show error toast with "Retry" button
      toasts.raw.error('Failed to copy code', {
        action: {
          label: 'Retry',
          onClick: () => {
            handleCopy();
          },
        },
      });
      return;
    }
  };

  /**
   * Handle screenshot generation
   * Optimized: Lazy-load modern-screenshot only when button clicked (saves ~30KB bundle)
   * Performance: Generate at 2x resolution for Retina displays
   * Viral: Add watermark with category/slug for attribution
   */
  const handleScreenshot = async () => {
    if (!codeBlockRef.current || isScreenshotting) return;

    setIsScreenshottingTrue();

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
      const normalized = normalizeError(error, 'Screenshot generation failed');
      // Show error toast with "Retry" button
      toasts.raw.error('Failed to generate screenshot', {
        action: {
          label: 'Retry',
          onClick: () => {
            handleScreenshot();
          },
        },
      });
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
      setIsScreenshottingFalse();
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
      const normalized = normalizeError(error, 'Download failed');
      // Show error toast with "Retry" button
      toasts.raw.error('Failed to download code', {
        action: {
          label: 'Retry',
          onClick: () => {
            handleDownload();
          },
        },
      });
      logClientWarn('[Share] Download failed', normalized, 'ProductionCodeBlock.handleDownload', {
        component: 'ProductionCodeBlock',
        action: 'download',
        category: 'share',
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
          // Show error toast with "Retry" button
          toasts.raw.error('Failed to copy link', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleShare(platform);
              },
            },
          });
        }
      } else if (platform === 'native') {
        // Native share already handled in ShareDropdown component
        // Just track the analytics here
      }

      pulse.share({ platform, category, slug, url: currentUrl }).catch((error) => {
        logUnhandledPromise('interactive-code-block:share', error, {
          platform,
          category,
          slug,
        });
      });

      setIsShareOpenFalse();
    } catch (error) {
      const normalized = normalizeError(error, 'Share failed');
      // Show error toast with "Retry" button
      toasts.raw.error('Failed to share', {
        action: {
          label: 'Retry',
          onClick: () => {
            handleShare(platform);
          },
        },
      });
      logClientWarn('[Share] Share failed', normalized, 'ProductionCodeBlock.handleShare', {
        component: 'ProductionCodeBlock',
        action: 'share',
        category: 'share',
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
    <div className={`card-base bg-code/50 relative ${className}`}>
      {/* Header with filename, language badge, and action buttons */}
      {filename ? (
        <div className="border-border/50 flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm-medium font-mono">{filename}</span>
          <div className="flex items-center gap-1">
            {/* Screenshot button */}
            <motion.button
              type="button"
              onClick={handleScreenshot}
              disabled={isScreenshotting}
              className="flex-center bg-code/95 text-muted-foreground hover:bg-code hover:text-foreground rounded-md p-1.5 shadow-md backdrop-blur-md transition-colors disabled:opacity-50"
              title={isScreenshotting ? 'Capturing screenshot...' : 'Screenshot code'}
            >
              <Camera className="h-3 w-3" />
            </motion.button>

            {/* Share button with dropdown */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={toggleIsShareOpen}
                className="flex-center bg-code/95 text-muted-foreground hover:bg-code hover:text-foreground rounded-md p-1.5 shadow-md backdrop-blur-md transition-colors"
                title="Share code"
              >
                <Share2 className="h-3 w-3" />
              </motion.button>

              {/* Share dropdown - positioned below button */}
              {isShareOpen ? (
                <ShareDropdown
                  currentUrl={currentUrl}
                  category={category}
                  slug={slug}
                  onShare={handleShare}
                  onMouseLeave={() => setIsShareOpenFalse()}
                />
              ) : null}
            </div>

            {/* Copy button */}
            <motion.button
              type="button"
              onClick={handleCopy}
              animate={isCopied && !shouldReduceMotion ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: DURATION.default }}
              className="flex-center bg-code/95 hover:bg-code rounded-md p-1.5 shadow-md backdrop-blur-md transition-colors"
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="text-muted-foreground h-3 w-3" />
              )}
            </motion.button>

            {/* Download button */}
            <motion.button
              type="button"
              onClick={handleDownload}
              className="flex-center bg-code/95 text-muted-foreground hover:bg-code hover:text-foreground rounded-md p-1.5 shadow-md backdrop-blur-md transition-colors"
              title="Download code"
            >
              <Download className="h-3 w-3" />
            </motion.button>

            {/* Language badge - Polar-style minimal */}
            {language && language !== 'text' ? (
              <div
                className={cn(
                  'text-muted-foreground',
                  'px-3',
                  'py-1',
                  'text-[10px]',
                  'font-semibold',
                  'tracking-wide',
                  'uppercase'
                )}
              >
                {language}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Code block container - Polar-style clean design */}
      <div
        ref={codeBlockRef}
        className="border-border card-base relative overflow-hidden transition-[height] duration-[0.2s] ease-in-out"
        style={{
          height: needsCollapse && !isExpanded ? maxHeight : 'auto',
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
              className="flex-center bg-code/95 text-muted-foreground hover:bg-code hover:text-foreground rounded-md p-1.5 shadow-md backdrop-blur-md transition-colors disabled:opacity-50"
              title={isScreenshotting ? 'Capturing screenshot...' : 'Screenshot code'}
            >
              <Camera className="h-3 w-3" />
            </motion.button>

            {/* Share button with dropdown */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={toggleIsShareOpen}
                className="flex-center bg-code/95 text-muted-foreground hover:bg-code hover:text-foreground rounded-md p-1.5 shadow-md backdrop-blur-md transition-colors"
                title="Share code"
              >
                <Share2 className="h-3 w-3" />
              </motion.button>

              {/* Share dropdown - positioned below button */}
              {isShareOpen ? (
                <ShareDropdown
                  currentUrl={currentUrl}
                  category={category}
                  slug={slug}
                  onShare={handleShare}
                  onMouseLeave={() => setIsShareOpenFalse()}
                />
              ) : null}
            </div>

            {/* Copy button */}
            <motion.button
              type="button"
              onClick={handleCopy}
              animate={isCopied && !shouldReduceMotion ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: DURATION.default }}
              className="flex-center bg-code/95 hover:bg-code rounded-md p-1.5 shadow-md backdrop-blur-md transition-colors"
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="text-muted-foreground h-3 w-3" />
              )}
            </motion.button>

            {/* Download button */}
            <motion.button
              type="button"
              onClick={handleDownload}
              className="flex-center bg-code/95 text-muted-foreground hover:bg-code hover:text-foreground rounded-md p-1.5 shadow-md backdrop-blur-md transition-colors"
              title="Download code"
            >
              <Download className="h-3 w-3" />
            </motion.button>

            {/* Language badge - Polar-style minimal */}
            {language && language !== 'text' ? (
              <div
                className={cn(
                  'text-muted-foreground',
                  'px-3',
                  'py-1',
                  'text-[10px]',
                  'font-semibold',
                  'tracking-wide',
                  'uppercase'
                )}
              >
                {language}
              </div>
            ) : null}
          </div>
        )}

        {/* Gradient fade when collapsed */}
        {needsCollapse && !isExpanded ? (
          <div className="to-background pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-b from-transparent" />
        ) : null}

        {/* Server-rendered Shiki HTML */}
        {safeHtml ? (
          <div
            ref={divRef}
            className={cn(
              showLineNumbers && 'code-with-line-numbers',
              // Shiki outputs <pre class="shiki"><code>...</code></pre>
              // We need to ensure proper styling
              '[&_.shiki]:!bg-transparent',
              '[&_.shiki]:!p-0',
              '[&_.shiki_code]:!bg-transparent',
              '[&_.shiki_code]:!p-0'
            )}
            // eslint-disable-next-line jsx-a11y/no-danger -- HTML is sanitized with DOMPurify with strict allowlist for Shiki
            // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized with DOMPurify using strict allowlist for Shiki syntax highlighting
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <pre ref={preRef} className={showLineNumbers ? 'code-with-line-numbers' : ''}>
            <code>{code}</code>
          </pre>
        )}
      </div>

      {/* Expand/collapse button - Polar-style minimal */}
      {needsCollapse ? (
        <button
          type="button"
          onClick={toggleIsExpanded}
          className={cn(
            'border',
            'border-t',
            'text-muted-foreground',
            'hover:text-foreground',
            'flex items-center gap-2',
            'w-full',
            'gap-1.5',
            'py-3',
            'text-xs',
            'transition-colors'
          )}
        >
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              isExpanded ? 'rotate-180' : ''
            )}
          />
          <span>{isExpanded ? 'Collapse' : `Show ${code.split('\n').length} lines`}</span>
        </button>
      ) : null}
    </div>
  );
}
