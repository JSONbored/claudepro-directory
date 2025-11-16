'use client';

/**
 * HighlightedText - Safely renders pre-highlighted HTML from edge functions
 * Used when search results come with pre-highlighted fields from unified-search
 */

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

  // Edge function provides safe HTML (XSS-protected via escapeHtml)
  // We use dangerouslySetInnerHTML because the HTML is trusted (generated server-side)
  // The HTML is pre-sanitized by the edge function, so this is safe
  return (
    <span
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is pre-sanitized by edge function with XSS protection
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning={true}
    />
  );
});

HighlightedText.displayName = 'HighlightedText';
