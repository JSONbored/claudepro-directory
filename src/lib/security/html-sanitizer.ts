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
 * Add security hook to enforce script tag removal
 * This provides defense-in-depth beyond FORBID_TAGS
 */
purify.addHook('uponSanitizeElement', (node, data) => {
  // Forcibly remove script and style tags
  if (data.tagName === 'script' || data.tagName === 'style') {
    // Use parentNode.removeChild for compatibility
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }
});

/**
 * Add security hook to sanitize dangerous URL protocols in attributes
 * Blocks data:, javascript:, vbscript:, and URL-encoded variants
 */
purify.addHook('afterSanitizeAttributes', (node) => {
  // Check all attributes that can contain URLs
  const urlAttributes = ['href', 'src', 'action', 'formaction', 'data', 'poster', 'xlink:href'];

  for (const attr of urlAttributes) {
    if (node.hasAttribute(attr)) {
      const value = node.getAttribute(attr) || '';
      const lowerValue = value.toLowerCase();

      // Block dangerous protocols (including URL-encoded variants)
      const isDangerous =
        lowerValue.includes('javascript:') ||
        lowerValue.includes('data:') ||
        lowerValue.includes('vbscript:') ||
        lowerValue.includes('java%0a') || // URL-encoded newline
        lowerValue.includes('java%0d') || // URL-encoded carriage return
        lowerValue.includes('data%3a') || // URL-encoded colon
        lowerValue.includes('%6a%61%76%61'); // URL-encoded "java"

      if (isDangerous) {
        node.removeAttribute(attr);
      }
    }
  }
});

/**
 * DOMPurify configuration type
 */
export interface DOMPurifyConfig {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOWED_URI_REGEXP?: RegExp;
  ALLOW_DATA_ATTR?: boolean;
  ALLOW_UNKNOWN_PROTOCOLS?: boolean;
  KEEP_CONTENT?: boolean;
  ADD_ATTR?: string[];
  ADD_TAGS?: string[];
  FORBID_TAGS?: string[];
  FORBID_ATTR?: string[];
  RETURN_DOM?: boolean;
  RETURN_DOM_FRAGMENT?: boolean;
  RETURN_TRUSTED_TYPE?: boolean;
  USE_PROFILES?: {
    html?: boolean;
    svg?: boolean;
    svgFilters?: boolean;
    mathMl?: boolean;
  };
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
   * Sanitize HTML content with secure defaults
   *
   * Applies defense-in-depth security measures:
   * - Blocks data: URIs (except safe image formats) to prevent XSS
   * - Explicitly forbids script tags
   * - Prevents URL-encoded protocol bypasses
   *
   * @param html - The HTML string to sanitize
   * @param config - DOMPurify configuration options
   * @returns Sanitized HTML string
   */
  sanitize(html: string, config?: DOMPurifyConfig): string {
    // Apply secure defaults
    const secureDefaults: DOMPurifyConfig = {
      // Block dangerous protocols, allow safe ones
      // This regex blocks data:, javascript:, vbscript:, and other dangerous protocols
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    };

    // Merge user config with secure defaults
    // User config takes precedence, but defaults provide baseline security
    const finalConfig: DOMPurifyConfig = {
      ...secureDefaults,
      ...config,
      // Always forbid these dangerous tags and attributes (cannot be overridden)
      FORBID_TAGS: [...(config?.FORBID_TAGS || []), 'script', 'style'],
      FORBID_ATTR: [...(config?.FORBID_ATTR || [])],
    };

    return purify.sanitize(html, finalConfig) as string;
  },

  /**
   * Sanitize to plain text only (strips all HTML)
   *
   * @param html - The HTML string to sanitize
   * @returns Plain text with all HTML removed
   */
  sanitizeToText(html: string): string {
    // First pass: remove script/style tags and their content
    const withoutScripts = purify.sanitize(html, {
      FORBID_TAGS: ['script', 'style'],
      KEEP_CONTENT: false, // Don't keep script content!
    });

    // Second pass: strip remaining HTML but keep text
    return purify.sanitize(withoutScripts, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
    }) as string;
  },

  /**
   * Check if DOMPurify is supported in this environment
   *
   * @returns true if DOMPurify is supported, false otherwise
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
