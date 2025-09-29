/**
 * Secure markdown parsing and sanitization utilities
 * Used for converting markdown to safe HTML in production
 */

import { marked } from 'marked';
import { logger } from './logger';
import { DOMPurify } from './sanitizer';
import {
  type MarkdownContent,
  type MarkdownParseOptions,
  type MarkdownToHtmlResponse,
  markdownContentSchema,
  markdownParseOptionsSchema,
  markdownSanitizedHtmlSchema,
  type SanitizationOptions,
  type SanitizedHtml,
  sanitizationOptionsSchema,
} from './schemas/markdown.schema';

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
    let sanitizedHtml = DOMPurify.sanitize(rawHtml, purifyConfig) as string;

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

/**
 * Simple markdown to HTML conversion for trusted content only
 * WARNING: Only use for content you control, not user input
 */
export async function trustedMarkdownToHtml(markdown: string): Promise<string> {
  try {
    const validatedMarkdown = markdownContentSchema.parse(markdown);
    return await marked.parse(validatedMarkdown);
  } catch (error) {
    logger.error(
      'Failed to parse trusted markdown',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error('Failed to parse markdown');
  }
}

/**
 * Extract plain text from markdown
 */
export function markdownToPlainText(markdown: string): string {
  try {
    const validatedMarkdown = markdownContentSchema.parse(markdown);
    // Remove markdown syntax
    return validatedMarkdown
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/```[^`]*```/g, '') // Code blocks
      .replace(/^[-*+]\s+/gm, '') // List items
      .replace(/^\d+\.\s+/gm, '') // Numbered lists
      .replace(/^>\s+/gm, '') // Blockquotes
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines
      .trim();
  } catch (error) {
    logger.error(
      'Failed to extract plain text from markdown',
      error instanceof Error ? error : new Error(String(error))
    );
    return '';
  }
}
