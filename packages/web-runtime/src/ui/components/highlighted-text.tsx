'use client';

/**
 * HighlightedText Component
 *
 * Safely renders pre-highlighted HTML from edge functions.
 * Used when search results come with pre-highlighted fields from unified-search.
 *
 * Architecture:
 * - Client component (uses DOMPurify which requires browser environment)
 * - XSS protection via DOMPurify sanitization
 * - Error handling with structured logging
 * - Graceful fallback to plain text on errors
 *
 * Security:
 * - Edge function provides XSS-protected HTML with <mark> tags
 * - Client-side DOMPurify provides defense-in-depth
 * - Only allows <mark> tags (no attributes, no other HTML)
 *
 * Usage:
 * ```tsx
 * import { HighlightedText } from '@heyclaude/web-runtime/ui/components/highlighted-text';
 *
 * <HighlightedText
 *   html={searchResult.highlightedTitle}
 *   fallback={searchResult.title}
 *   className="text-lg"
 * />
 * ```
 */

import { logger } from '../../logger.ts';
import { normalizeError } from '../../errors.ts';
import { memo, useEffect, useState } from 'react';

export interface HighlightedTextProps {
  /** Pre-highlighted HTML string from edge function */
  html: string;
  /** Fallback text if HTML is empty or sanitization fails */
  fallback?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Safely renders pre-highlighted HTML from edge functions
 *
 * Edge function provides XSS-protected HTML with <mark> tags.
 * This component adds client-side sanitization as defense-in-depth.
 */
export const HighlightedText = memo(({ html, fallback, className = '' }: HighlightedTextProps) => {
  const [safeHtml, setSafeHtml] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Sanitize HTML on client side using dynamic import
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && html) {
      import('dompurify')
        .then((DOMPurify) => {
          try {
            // Sanitize HTML to prevent XSS. Only allow <mark> tags for highlighting.
            // This provides defense-in-depth even though edge function pre-sanitizes.
            const sanitized = DOMPurify.default.sanitize(html, {
              ALLOWED_TAGS: ['mark'],
              ALLOWED_ATTR: [],
            });
            setSafeHtml(sanitized);
          } catch (error) {
            // Log sanitization errors but don't crash the component
            const normalized = normalizeError(error, 'HighlightedText: DOMPurify sanitization failed');
            logger.warn({ err: normalized,
              category: 'sanitize',
              component: 'HighlightedText',
              recoverable: true,
              htmlLength: html.length,
              hasFallback: Boolean(fallback), }, '[Sanitize] Failed to sanitize HTML');
            setSafeHtml(null); // Trigger fallback rendering
          }
        })
        .catch((error) => {
          const normalized = normalizeError(error, 'Failed to load DOMPurify');
          logger.warn({ err: normalized,
            category: 'sanitize',
            component: 'HighlightedText',
            recoverable: true, }, '[Sanitize] Failed to load DOMPurify');
          setSafeHtml(null); // Trigger fallback rendering
        });
    }
  }, [html, fallback]);

  // During SSR, render fallback or unsanitized HTML (will be sanitized on client)
  if (!isClient) {
    if (fallback) {
      return <span className={className}>{fallback}</span>;
    }
    return <span className={className} dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning={true} />;
  }

  // Render fallback if no HTML or sanitization failed
  if (!safeHtml) {
    if (fallback) {
      return <span className={className}>{fallback}</span>;
    }
    return null;
  }

  return (
    <span
      className={className}
      // eslint-disable-next-line jsx-a11y/no-danger -- HTML is sanitized with DOMPurify, only <mark> tags allowed
      dangerouslySetInnerHTML={{ __html: safeHtml }}
      suppressHydrationWarning={true}
    />
  );
});

HighlightedText.displayName = 'HighlightedText';
