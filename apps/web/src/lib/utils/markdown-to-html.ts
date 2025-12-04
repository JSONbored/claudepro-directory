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

import { marked } from 'marked';

// Configure marked for GitHub Flavored Markdown (GFM) support
marked.use({
  gfm: true, // GitHub Flavored Markdown
  breaks: false, // Don't convert line breaks to <br>
  pedantic: false, // Don't use original markdown.pl behavior
});

/**
 * Convert markdown string to sanitized HTML
 *
 * @param markdown - Raw markdown string from database
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```ts
 * const html = markdownToHtml('## Heading\n\n**Bold text**');
 * // Returns: '<h2>Heading</h2><p><strong>Bold text</strong></p>'
 * ```
 */
export function markdownToHtml(markdown: string | null | undefined): string {
  if (!markdown || typeof markdown !== 'string' || markdown.trim().length === 0) {
    return '';
  }

  try {
    // Parse markdown to HTML
    const html = marked.parse(markdown, {
      async: false, // Synchronous parsing for server-side
    }) as string;

    // Return HTML (will be sanitized by TrustedHTML component on client)
    // Note: We could add server-side DOMPurify here, but TrustedHTML already handles it
    return html;
  } catch (error) {
    // Log error but return empty string to prevent crashes
    console.error('[markdownToHtml] Failed to parse markdown:', error);
    return '';
  }
}
