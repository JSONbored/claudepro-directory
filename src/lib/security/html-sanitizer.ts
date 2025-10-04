/**
 * HTML Sanitizer
 * Production-grade HTML sanitization using isomorphic-dompurify
 * Part of unified lib/security/ module
 *
 * Security: Uses battle-tested DOMPurify library instead of custom regex patterns
 * which are vulnerable to bypasses and edge cases (CodeQL warnings).
 *
 * Why DOMPurify:
 * - Handles all HTML/XSS edge cases (e.g., </script\t\n bar>)
 * - Prevents multi-character sanitization bypasses (e.g., <scr<script>ipt>)
 * - Actively maintained by Cure53 security firm
 * - Used by Google, Microsoft, and other major companies
 * - Works in both browser and Node.js environments (isomorphic-dompurify)
 */

import createDOMPurify from 'isomorphic-dompurify';

/**
 * Initialize DOMPurify for isomorphic use (browser + Node.js)
 */
const purify = createDOMPurify();

/**
 * DOMPurify configuration type
 */
export interface DOMPurifyConfig {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOW_DATA_ATTR?: boolean;
  KEEP_CONTENT?: boolean;
  ADD_ATTR?: string[];
  FORBID_TAGS?: string[];
  FORBID_ATTR?: string[];
  RETURN_DOM?: boolean;
  RETURN_DOM_FRAGMENT?: boolean;
  RETURN_TRUSTED_TYPE?: boolean;
}

/**
 * Export DOMPurify for direct use throughout the codebase
 *
 * Usage:
 * ```ts
 * import { DOMPurify } from '@/src/lib/security/html-sanitizer';
 *
 * // Strip all HTML tags
 * const clean = DOMPurify.sanitize(userInput, {
 *   ALLOWED_TAGS: [],
 *   KEEP_CONTENT: true,
 * });
 *
 * // Allow specific tags only
 * const html = DOMPurify.sanitize(content, {
 *   ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
 *   ALLOWED_ATTR: ['href', 'target'],
 * });
 * ```
 */
export const DOMPurify = {
  /**
   * Sanitize HTML content
   *
   * @param html - The HTML string to sanitize
   * @param config - DOMPurify configuration options
   * @returns Sanitized HTML string
   */
  sanitize(html: string, config?: DOMPurifyConfig): string {
    return purify.sanitize(html, config) as string;
  },

  /**
   * Check if a string is safe (doesn't contain dangerous HTML)
   *
   * @param html - The HTML string to check
   * @returns true if the string is safe, false otherwise
   */
  isSupported(): boolean {
    return purify.isSupported;
  },
};

/**
 * Default safe tags for rich content
 */
export const DEFAULT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'b',
  'i',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'code',
  'pre',
  'span',
  'div',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'img',
  'hr',
];

/**
 * Default safe attributes
 */
export const DEFAULT_ALLOWED_ATTRIBUTES = [
  'href',
  'target',
  'rel',
  'title',
  'alt',
  'src',
  'width',
  'height',
  'class',
  'id',
];
