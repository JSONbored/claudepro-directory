/**
 * Markdown to HTML Converter
 *
 * Server-side utility to convert markdown content to sanitized HTML.
 * Used for rendering changelog content and other markdown-based content.
 *
 * Security:
 * - Uses marked to parse markdown to HTML
 * - Sanitizes output with DOMPurify (server-side compatible)
 * - Prevents XSS attacks
 *
 * Performance:
 * - Synchronous parsing (server-side only)
 * - Cached DOMPurify instance
 */

import { normalizeError, logger } from '@heyclaude/web-runtime';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

// Configure marked for GitHub Flavored Markdown (GFM) support
marked.use({
  gfm: true, // GitHub Flavored Markdown
  breaks: false, // Don't convert line breaks to <br>
  pedantic: false, // Don't use original markdown.pl behavior
});

/**
 * Convert a Markdown string to sanitized HTML suitable for server-side rendering.
 *
 * @param {string | null | undefined} markdown - Raw Markdown string (may be null/undefined).
 * @returns {string} Sanitized HTML string; returns an empty string for invalid, empty input or on error.
 *
 * @example
 * ```ts
 * const html = markdownToHtml('## Heading\n\n**Bold text**');
 * // Returns: '<h2>Heading</h2><p><strong>Bold text</strong></p>'
 * ```
 *
 * @see {@link https://github.com/markedjs/marked|marked} for Markdown parsing
 * @see {@link https://github.com/cure53/DOMPurify|DOMPurify} for HTML sanitization
 */
export function markdownToHtml(markdown: null | string | undefined): string {
  if (!markdown || typeof markdown !== 'string' || markdown.trim().length === 0) {
    return '';
  }

  try {
    // Parse markdown to HTML
    const html = marked.parse(markdown, {
      async: false, // Synchronous parsing for server-side
    });

    // Sanitize HTML server-side for defense-in-depth
    return DOMPurify.sanitize(html);
  } catch (error) {
    // Log error but return empty string to prevent crashes
    // Use universal logger (works in both server and client contexts)
    const normalized = normalizeError(error, 'Failed to parse markdown');
    logger.error('[markdownToHtml] Failed to parse markdown', normalized, {
      operation: 'markdownToHtml',
      module: 'lib/utils/markdown-to-html',
      markdownLength: markdown.length,
    });
    return '';
  }
}
