'use client';

/**
 * SanitizedHTML - Client component that sanitizes HTML using DOMPurify
 * Used for rendering changelog content with XSS protection
 */

import DOMPurify from 'dompurify';
import { memo } from 'react';

interface SanitizedHTMLProps {
  /** HTML string to sanitize and render */
  html: string;
  /** Additional CSS classes */
  className?: string;
  /** HTML id attribute */
  id?: string;
}

/**
 * Sanitizes HTML content using DOMPurify before rendering
 * Allows safe HTML tags commonly used in changelog/markdown content
 */
export const SanitizedHTML = memo(({ html, className, id }: SanitizedHTMLProps) => {
  if (!html || typeof html !== 'string') {
    return <div id={id} className={className} />;
  }

  // Sanitize HTML to prevent XSS
  // Allow common markdown-generated HTML tags for changelog content
  const safeHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'code',
      'pre',
      'blockquote',
      'span',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'id'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });

  return (
    <div
      id={id}
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized with DOMPurify with strict allowlist
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
});

SanitizedHTML.displayName = 'SanitizedHTML';
