/**
 * Secure markdown parsing and sanitization utilities
 * Used for converting markdown to safe HTML in production
 */

import { marked } from 'marked';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { nonNegativeInt } from '@/src/lib/schemas/primitives/base-numbers';
import { DOMPurify } from '@/src/lib/security/html-sanitizer';

/**
 * Internal Markdown Schemas
 * These are only used within this file for markdown-to-HTML conversion
 * Moved from lib/schemas/markdown.schema.ts for better encapsulation
 */

/**
 * Allowed HTML tags for sanitized content
 * Based on security requirements for public-facing content
 */
const ALLOWED_HTML_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'hr',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'i',
  'code',
  'pre',
  'blockquote',
  'a',
  'span',
  'div',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
] as const;

/**
 * Allowed HTML attributes for sanitized content
 */
const ALLOWED_HTML_ATTRS = [
  'class',
  'id',
  'href', // for links
  'target', // for links
  'rel', // for links
  'title',
  'alt',
] as const;

/**
 * Schema for raw markdown content
 */
const markdownContentSchema = z.string().min(1).max(500000); // Max 500KB

/**
 * Schema for sanitization options
 */
const sanitizationOptionsSchema = z.object({
  allowedTags: z.array(z.enum(ALLOWED_HTML_TAGS)).default([...ALLOWED_HTML_TAGS]),
  allowedAttributes: z.array(z.enum(ALLOWED_HTML_ATTRS)).default([...ALLOWED_HTML_ATTRS]),
  allowDataAttributes: z.boolean().default(false),
  enforceNoFollow: z.boolean().default(true), // Add rel="nofollow" to external links
  enforceNoOpener: z.boolean().default(true), // Add rel="noopener" to external links
  stripDangerous: z.boolean().default(true), // Remove dangerous elements like scripts
});

/**
 * Schema for markdown parsing options
 */
const markdownParseOptionsSchema = z.object({
  gfm: z.boolean().default(true), // GitHub Flavored Markdown
  breaks: z.boolean().default(false), // Convert \n to <br>
  pedantic: z.boolean().default(false),
  silent: z.boolean().default(false),
});

/**
 * Schema for sanitized HTML output
 */
const markdownSanitizedHtmlSchema = z.string().refine(
  (html) => {
    // Ensure no script tags or event handlers
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // onclick, onload, etc.
      /data:text\/html/i,
      /vbscript:/i,
    ];
    return !dangerousPatterns.some((pattern) => pattern.test(html));
  },
  {
    message: 'HTML contains potentially dangerous content',
  }
);

/**
 * Schema for markdown to HTML conversion response
 */
const markdownToHtmlResponseSchema = z.object({
  html: markdownSanitizedHtmlSchema,
  wordCount: nonNegativeInt,
  readingTime: nonNegativeInt, // in minutes
  hasCodeBlocks: z.boolean(),
  hasLinks: z.boolean(),
  hasImages: z.boolean(),
});

/**
 * Type exports for internal use
 */
type MarkdownContent = z.infer<typeof markdownContentSchema>;
type SanitizationOptions = z.infer<typeof sanitizationOptionsSchema>;
type MarkdownParseOptions = z.infer<typeof markdownParseOptionsSchema>;
type SanitizedHtml = z.infer<typeof markdownSanitizedHtmlSchema>;
type MarkdownToHtmlResponse = z.infer<typeof markdownToHtmlResponseSchema>;

// isomorphic-dompurify handles server/client compatibility automatically

/**
 * Configure marked options for secure parsing
 */
marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
  silent: false,
});

/**
 * Calculate reading time based on word count
 * Average reading speed: 200-250 words per minute
 */
function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 225;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Count words in text content
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Check if HTML contains specific elements
 */
function analyzeHtmlContent(html: string): {
  hasCodeBlocks: boolean;
  hasLinks: boolean;
  hasImages: boolean;
} {
  return {
    hasCodeBlocks: /<pre>|<code>/i.test(html),
    hasLinks: /<a\s/i.test(html),
    hasImages: /<img\s/i.test(html),
  };
}

/**
 * Convert markdown to sanitized HTML with comprehensive validation
 * @param markdown - Raw markdown content
 * @param options - Parsing and sanitization options
 * @returns Sanitized HTML and metadata
 */
export async function markdownToSafeHtml(
  markdown: string,
  options?: {
    parseOptions?: Partial<MarkdownParseOptions>;
    sanitizeOptions?: Partial<SanitizationOptions>;
  }
): Promise<MarkdownToHtmlResponse> {
  try {
    // Validate input
    const validatedMarkdown: MarkdownContent = markdownContentSchema.parse(markdown);
    const parseOptions = markdownParseOptionsSchema.parse(options?.parseOptions || {});
    const sanitizeOptions = sanitizationOptionsSchema.parse(options?.sanitizeOptions || {});

    // Configure marked with validated options
    marked.setOptions({
      gfm: parseOptions.gfm,
      breaks: parseOptions.breaks,
      pedantic: parseOptions.pedantic,
      silent: parseOptions.silent,
    });

    // Parse markdown to HTML
    const rawHtml = await marked.parse(validatedMarkdown);

    // Configure DOMPurify with proper types
    const purifyConfig = {
      ALLOWED_TAGS: sanitizeOptions.allowedTags as string[],
      ALLOWED_ATTR: sanitizeOptions.allowedAttributes as string[],
      ALLOW_DATA_ATTR: sanitizeOptions.allowDataAttributes,
      ADD_ATTR: ['target'], // Allow target for links
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
    };

    // Sanitize HTML - the result is a string when not using RETURN_DOM
    let sanitizedHtml = (await DOMPurify.sanitize(rawHtml, purifyConfig)) as string;

    // Post-process for additional security
    if (sanitizeOptions.enforceNoFollow || sanitizeOptions.enforceNoOpener) {
      sanitizedHtml = sanitizedHtml.replace(
        /<a\s+([^>]*href=["'](?:https?:)?\/\/[^"']+["'][^>]*)>/gi,
        (_match: string, attrs: string) => {
          let newAttrs = attrs;
          if (sanitizeOptions.enforceNoFollow && !attrs.includes('rel=')) {
            newAttrs += ' rel="nofollow"';
          } else if (sanitizeOptions.enforceNoFollow) {
            newAttrs = newAttrs.replace(/rel=["'][^"']*["']/i, 'rel="nofollow"');
          }
          if (sanitizeOptions.enforceNoOpener) {
            if (newAttrs.includes('rel=')) {
              newAttrs = newAttrs.replace(/rel=["']([^"']*)["']/i, 'rel="$1 noopener"');
            } else {
              newAttrs += ' rel="noopener"';
            }
          }
          return `<a ${newAttrs}>`;
        }
      );
    }

    // Validate final output
    const validatedHtml: SanitizedHtml = markdownSanitizedHtmlSchema.parse(sanitizedHtml);

    // Calculate metadata
    const plainText = validatedHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const wordCount = countWords(plainText);
    const readingTime = calculateReadingTime(wordCount);
    const contentAnalysis = analyzeHtmlContent(validatedHtml);

    return {
      html: validatedHtml,
      wordCount,
      readingTime,
      ...contentAnalysis,
    };
  } catch (error) {
    logger.error(
      'Failed to convert markdown to safe HTML',
      error instanceof Error ? error : new Error(String(error)),
      {
        markdownLength: markdown.length,
        hasParseOptions: !!options?.parseOptions,
        hasSanitizeOptions: !!options?.sanitizeOptions,
      }
    );
    throw new Error('Failed to process markdown content safely');
  }
}
