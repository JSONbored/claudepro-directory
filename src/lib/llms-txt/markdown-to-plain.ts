/**
 * Markdown to Plain Text Converter
 * Converts markdown content to AI-friendly plain text format for llms.txt files
 *
 * @module llms-txt/markdown-to-plain
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 *
 * @security Uses DOMPurify for HTML sanitization (prevents XSS, script injection)
 * @security Uses 'he' library for proper HTML entity decoding (prevents double-unescaping)
 */

import { decode } from 'he';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';

// Lazy import DOMPurify to avoid build-time issues with Next.js Turbopack
// DOMPurify uses browser APIs that cannot be statically analyzed during build
let _DOMPurify: typeof import('isomorphic-dompurify').default | null = null;
async function getDOMPurify() {
  if (!_DOMPurify) {
    const module = await import('isomorphic-dompurify');
    _DOMPurify = module.default;
  }
  return _DOMPurify;
}

/**
 * Schema for markdown content input
 * @description Validates raw markdown string with reasonable length limits
 */
const markdownInputSchema = z
  .string()
  .min(1, 'Markdown content cannot be empty')
  .max(1000000, 'Markdown content exceeds 1MB limit')
  .describe('Raw markdown content to convert to plain text');

/**
 * Schema for conversion options
 * @description Configuration for markdown to plain text conversion behavior
 */
const conversionOptionsSchema = z
  .object({
    preserveHeadings: z
      .boolean()
      .default(true)
      .describe('Convert heading syntax to plain text with proper hierarchy'),
    preserveLists: z
      .boolean()
      .default(true)
      .describe('Convert list items to plain text with bullets/numbers'),
    preserveCodeBlocks: z
      .boolean()
      .default(true)
      .describe('Keep code blocks with indentation for readability'),
    preserveLinks: z
      .boolean()
      .default(true)
      .describe('Convert markdown links to "text (url)" format'),
    maxLineLength: z
      .number()
      .int()
      .min(60)
      .max(200)
      .default(100)
      .describe('Maximum characters per line before wrapping'),
    removeHtml: z.boolean().default(true).describe('Strip HTML tags from markdown'),
    normalizeWhitespace: z.boolean().default(true).describe('Normalize multiple spaces/newlines'),
  })
  .describe('Configuration options for markdown conversion');

/**
 * Schema for converted plain text output
 * @description Validates the final plain text output
 */
const plainTextOutputSchema = z
  .string()
  .min(1)
  .refine((text) => !text.includes('<script'), {
    message: 'Output contains potentially dangerous content',
  })
  .describe('AI-optimized plain text output for llms.txt');

/**
 * Type exports for external use
 */
export type MarkdownInput = z.infer<typeof markdownInputSchema>;
export type ConversionOptions = z.infer<typeof conversionOptionsSchema>;
export type PlainTextOutput = z.infer<typeof plainTextOutputSchema>;

/**
 * Convert markdown headings to plain text with hierarchy
 * @param line - Markdown line to process
 * @returns Plain text heading with proper formatting
 *
 * @example
 * ```ts
 * convertHeading("## My Heading") // "MY HEADING"
 * convertHeading("### Subsection") // "Subsection"
 * ```
 */
/**
 * Convert markdown heading to plain text
 * @param line - Markdown heading line
 * @returns Converted heading text
 */
function convertHeading(line: string): string {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return line;

  const level = match[1]?.length ?? 1;
  const text = match[2]?.trim() ?? '';

  // H1/H2 -> UPPERCASE for emphasis
  if (level <= 2) {
    return text.toUpperCase();
  }

  // H3+ -> Title Case
  return text;
}

/**
 * Convert markdown links to plain text format
 * @param text - Text containing markdown links
 * @returns Text with links converted to "text (url)" format
 *
 * @example
 * ```ts
 * convertLinks("[Example](https://example.com)") // "Example (https://example.com)"
 * ```
 */
function convertLinks(text: string): string {
  // [text](url) -> text (url)
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
}

/**
 * Convert markdown list items to plain text
 * @param line - Markdown line to process
 * @returns Plain text list item with proper indentation
 *
 * @example
 * ```ts
 * convertListItem("- Item 1") // "• Item 1"
 * convertListItem("  - Nested") // "  • Nested"
 * ```
 */
function convertListItem(line: string): string {
  // Unordered lists: - or * -> •
  const unordered = line.match(/^(\s*)[*-]\s+(.+)$/);
  if (unordered) {
    return `${unordered[1]}• ${unordered[2]}`;
  }

  // Ordered lists: 1. -> 1)
  const ordered = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
  if (ordered) {
    return `${ordered[1]}${ordered[2]}) ${ordered[3]}`;
  }

  return line;
}

/**
 * Remove HTML tags from text with secure sanitization
 * @param text - Text potentially containing HTML
 * @returns Text with all HTML tags removed and entities properly decoded
 *
 * @security Uses DOMPurify to safely sanitize HTML (removes scripts, events, dangerous attrs)
 * @security Uses 'he' library for one-pass HTML entity decoding (prevents double-unescaping vulnerabilities)
 *
 * @example
 * ```ts
 * stripHtmlTags('<script>alert(1)</script >Hello') // "Hello" (script removed)
 * stripHtmlTags('&amp;lt;script&amp;gt;') // "&lt;script&gt;" (safely decoded once)
 * stripHtmlTags('<p>Text</p>') // "Text" (tags stripped)
 * ```
 */
async function stripHtmlTags(text: string): Promise<string> {
  // Step 1: Lazy load DOMPurify to avoid build-time issues
  const DOMPurify = await getDOMPurify();

  // Step 2: Sanitize HTML with DOMPurify (removes ALL scripts, events, dangerous attributes)
  // ALLOWED_TAGS: [] strips ALL tags while KEEP_CONTENT: true preserves text content
  const sanitized = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // Strip ALL HTML tags (including <script>, <img>, <iframe>, etc.)
    KEEP_CONTENT: true, // Keep text content only
  });

  // Step 3: Decode HTML entities properly (one-pass decode prevents double-unescaping)
  // decode() safely handles: &nbsp; &amp; &lt; &gt; &quot; &#39; and all other entities
  return decode(sanitized);
}

/**
 * Normalize whitespace in text
 * @param text - Text to normalize
 * @returns Text with normalized spacing
 */
function normalizeWhitespace(text: string): string {
  return (
    text
      // Remove multiple spaces
      .replace(/ {2,}/g, ' ')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Remove trailing whitespace
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      // Max 2 consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim final output
      .trim()
  );
}

/**
 * Convert markdown to AI-friendly plain text
 *
 * @param markdown - Raw markdown content
 * @param options - Conversion options (optional)
 * @returns Plain text optimized for LLM consumption
 *
 * @throws {Error} If markdown validation fails or conversion encounters errors
 *
 * @example
 * ```ts
 * const plainText = await markdownToPlainText(`
 * # My Document
 *
 * This is a [link](https://example.com).
 *
 * - Item 1
 * - Item 2
 * `);
 * // Returns:
 * // MY DOCUMENT
 * //
 * // This is a link (https://example.com).
 * //
 * // • Item 1
 * // • Item 2
 * ```
 */
export async function markdownToPlainText(
  markdown: string,
  options?: Partial<ConversionOptions>
): Promise<PlainTextOutput> {
  try {
    // Validate input
    const validatedMarkdown = markdownInputSchema.parse(markdown);
    const opts = conversionOptionsSchema.parse(options || {});

    let text = validatedMarkdown;

    // Strip HTML if requested
    if (opts.removeHtml) {
      text = await stripHtmlTags(text);
    }

    // Process line by line
    const lines = text.split('\n');
    const processed: string[] = [];

    let inCodeBlock = false;
    let codeBlockLines: string[] = [];

    for (const currentLine of lines) {
      // Guard against undefined lines
      if (!currentLine) continue;

      let line = currentLine;

      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // Starting code block
          inCodeBlock = true;
          codeBlockLines = [];
          continue; // Skip the ``` line
        }
        // Ending code block
        inCodeBlock = false;
        if (opts.preserveCodeBlocks && codeBlockLines.length > 0) {
          // Add indented code block
          processed.push('');
          processed.push(...codeBlockLines.map((l) => `    ${l}`));
          processed.push('');
        }
        codeBlockLines = [];
        continue; // Skip the ``` line
      }

      // If in code block, collect lines
      if (inCodeBlock) {
        codeBlockLines.push(line);
        continue;
      }

      // Convert headings
      if (opts.preserveHeadings && line.match(/^#{1,6}\s+/)) {
        line = convertHeading(line);
      } else {
        // Remove heading markers if not preserving
        line = line.replace(/^#{1,6}\s+/, '');
      }

      // Convert list items
      if (opts.preserveLists && line.match(/^\s*[*-]\s+|^\s*\d+\.\s+/)) {
        line = convertListItem(line);
      }

      // Convert links
      if (opts.preserveLinks) {
        line = convertLinks(line);
      } else {
        // Remove link markdown, keep text only
        line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      }

      // Remove emphasis markers (bold/italic)
      line = line
        .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // bold+italic
        .replace(/\*\*(.+?)\*\*/g, '$1') // bold
        .replace(/\*(.+?)\*/g, '$1') // italic
        .replace(/___(.+?)___/g, '$1') // alt bold+italic
        .replace(/__(.+?)__/g, '$1') // alt bold
        .replace(/_(.+?)_/g, '$1'); // alt italic

      // Remove inline code markers
      line = line.replace(/`([^`]+)`/g, '$1');

      // Remove blockquote markers
      line = line.replace(/^>\s+/, '');

      // Remove horizontal rules
      if (line.match(/^[-*_]{3,}$/)) {
        continue;
      }

      processed.push(line);
    }

    // Join lines
    let result = processed.join('\n');

    // Normalize whitespace if requested
    if (opts.normalizeWhitespace) {
      result = normalizeWhitespace(result);
    }

    // Validate output
    const validatedOutput = plainTextOutputSchema.parse(result);

    return validatedOutput;
  } catch (error) {
    logger.error(
      'Failed to convert markdown to plain text',
      error instanceof Error ? error : new Error(String(error)),
      {
        markdownLength: markdown?.length || 0,
        hasOptions: !!options,
      }
    );
    throw new Error('Failed to convert markdown content to plain text');
  }
}

/**
 * Quick conversion with default options
 * @param markdown - Raw markdown content
 * @returns Plain text with default conversion settings
 */
export async function quickConvert(markdown: string): Promise<string> {
  return markdownToPlainText(markdown);
}
