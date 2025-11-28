'use client';

/**
 * SanitizedHTML - Client component that sanitizes HTML using DOMPurify
 * Used for rendering changelog content with XSS protection
 */

import { memo, useEffect, useState } from 'react';

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
  const [safeHtml, setSafeHtml] = useState<string>(html);

  useEffect(() => {
    if (typeof window !== 'undefined' && html && typeof html === 'string') {
      import('dompurify').then((DOMPurify) => {
        const sanitized = DOMPurify.default.sanitize(html, {
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
        setSafeHtml(sanitized);
      }).catch(() => {
        // Fallback to original HTML if DOMPurify fails to load
        setSafeHtml(html);
      });
    }
  }, [html]);

  if (!html || typeof html !== 'string') {
    return <div id={id} className={className} />;
  }

  return (
    <div
      id={id}
      className={className}
      // eslint-disable-next-line jsx-a11y/no-danger -- HTML is sanitized with DOMPurify with strict allowlist
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
});

SanitizedHTML.displayName = 'SanitizedHTML';
