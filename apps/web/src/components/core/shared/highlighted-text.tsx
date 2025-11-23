'use client';

/**
 * HighlightedText - Safely renders pre-highlighted HTML from edge functions
 * Used when search results come with pre-highlighted fields from unified-search
 */

import DOMPurify from 'dompurify';
import { memo } from 'react';

interface HighlightedTextProps {
  /** Pre-highlighted HTML string from edge function */
  html: string;
  /** Fallback text if HTML is empty */
  fallback?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Safely renders pre-highlighted HTML from edge functions
 * Edge function provides XSS-protected HTML with <mark> tags
 */
export const HighlightedText = memo(({ html, fallback, className = '' }: HighlightedTextProps) => {
  if (!html && fallback) {
    return <span className={className}>{fallback}</span>;
  }

  if (!html) {
    return null;
  }

  // Sanitize HTML to prevent XSS. Only allow <mark> tags for highlighting.
  // This provides defense-in-depth even though edge function pre-sanitizes.
  const safeHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: [],
  });

  return (
    <span
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized with DOMPurify, only <mark> tags allowed
      dangerouslySetInnerHTML={{ __html: safeHtml }}
      suppressHydrationWarning={true}
    />
  );
});

HighlightedText.displayName = 'HighlightedText';
