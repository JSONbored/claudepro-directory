/**
 * Markdown parsing and sanitization schema
 * Ensures safe HTML output from markdown content
 */

import { z } from 'zod';
import { nonEmptyStringArray } from './primitives/base-arrays';
import { nonNegativeInt } from './primitives/base-numbers';
import { nonEmptyString, shortString } from './primitives/base-strings';

/**
 * Allowed HTML tags for sanitized content
 * Based on security requirements for public-facing content
 */
export const ALLOWED_HTML_TAGS = [
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
export const ALLOWED_HTML_ATTRS = [
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
export const markdownContentSchema = z.string().min(1).max(500000); // Max 500KB

/**
 * Schema for sanitization options
 */
export const sanitizationOptionsSchema = z.object({
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
export const markdownParseOptionsSchema = z.object({
  gfm: z.boolean().default(true), // GitHub Flavored Markdown
  breaks: z.boolean().default(false), // Convert \n to <br>
  pedantic: z.boolean().default(false),
  silent: z.boolean().default(false),
});

/**
 * Schema for sanitized HTML output
 */
export const markdownSanitizedHtmlSchema = z.string().refine(
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
 * Schema for markdown to HTML conversion request
 */
export const markdownToHtmlRequestSchema = z.object({
  markdown: markdownContentSchema,
  parseOptions: markdownParseOptionsSchema.optional(),
  sanitizeOptions: sanitizationOptionsSchema.optional(),
});

/**
 * Schema for markdown to HTML conversion response
 */
export const markdownToHtmlResponseSchema = z.object({
  html: markdownSanitizedHtmlSchema,
  wordCount: nonNegativeInt,
  readingTime: nonNegativeInt, // in minutes
  hasCodeBlocks: z.boolean(),
  hasLinks: z.boolean(),
  hasImages: z.boolean(),
});

/**
 * Type exports
 */
export type MarkdownContent = z.infer<typeof markdownContentSchema>;
export type SanitizationOptions = z.infer<typeof sanitizationOptionsSchema>;
export type MarkdownParseOptions = z.infer<typeof markdownParseOptionsSchema>;
export type SanitizedHtml = z.infer<typeof markdownSanitizedHtmlSchema>;
export type MarkdownToHtmlRequest = z.infer<typeof markdownToHtmlRequestSchema>;
export type MarkdownToHtmlResponse = z.infer<typeof markdownToHtmlResponseSchema>;

/**
 * Helper to validate markdown content
 */
export function validateMarkdownContent(content: string): MarkdownContent {
  return markdownContentSchema.parse(content);
}

/**
 * Helper to validate sanitized HTML
 */
export function validateSanitizedHtml(html: string): SanitizedHtml {
  return markdownSanitizedHtmlSchema.parse(html);
}

/**
 * MDX frontmatter schema
 */
export const mdxFrontmatterSchema = z.object({
  title: nonEmptyString.max(200),
  description: nonEmptyString.max(500),
  keywords: z.array(z.string().max(50)).optional(),
  dateUpdated: z.string().optional(),
  author: shortString.optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).optional(),
  readingTime: z.string().max(20).optional(),
  difficulty: z.string().max(20).optional(),
  aiOptimized: z.boolean().optional(),
  citationReady: z.boolean().optional(),
  schemas: z
    .object({
      article: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean(), nonEmptyStringArray]))
        .optional(),
      faq: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean(), nonEmptyStringArray]))
        .optional(),
      breadcrumb: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean(), nonEmptyStringArray]))
        .optional(),
      howto: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean(), nonEmptyStringArray]))
        .optional(),
    })
    .optional(),
});

export type MDXFrontmatter = z.infer<typeof mdxFrontmatterSchema>;
