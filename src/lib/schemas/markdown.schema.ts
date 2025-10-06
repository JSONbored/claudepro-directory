/**
 * Markdown Schema
 * Public schema exports for MDX frontmatter validation
 *
 * Internal markdown-to-HTML conversion schemas moved to lib/markdown-utils.ts
 * for better encapsulation (they were only used in that one file)
 */

import { z } from 'zod';
import { nonEmptyStringArray } from './primitives/base-arrays';
import { nonEmptyString, shortString } from './primitives/base-strings';

/**
 * MDX frontmatter schema
 */
const mdxFrontmatterSchema = z
  .object({
    title: nonEmptyString.max(200).describe('Content title (max 200 characters)'),
    seoTitle: z
      .string()
      .max(60)
      .optional()
      .describe(
        'Short SEO-optimized title for <title> tag (max 60 characters), falls back to full title'
      ),
    description: nonEmptyString.max(500).describe('Content description (max 500 characters)'),
    keywords: z
      .array(z.string().max(50).describe('SEO keyword (max 50 characters)'))
      .optional()
      .describe('Array of SEO keywords for search optimization'),
    dateUpdated: z.string().optional().describe('ISO date string of last update'),
    author: shortString.optional().describe('Content author name'),
    category: z.string().max(50).optional().describe('Content category (max 50 characters)'),
    tags: z
      .array(z.string().max(50).describe('Tag name (max 50 characters)'))
      .optional()
      .describe('Array of content tags for categorization'),
    readingTime: z
      .string()
      .max(20)
      .optional()
      .describe('Estimated reading time (e.g., "5 min read")'),
    difficulty: z
      .string()
      .max(20)
      .optional()
      .describe('Content difficulty level (e.g., "beginner")'),
    aiOptimized: z.boolean().optional().describe('Whether content is optimized for AI consumption'),
    citationReady: z
      .boolean()
      .optional()
      .describe('Whether content is ready for citation/reference'),
    schemas: z
      .object({
        article: z
          .record(
            z.string().describe('Schema field key'),
            z
              .union([
                z.string().describe('String value'),
                z.number().describe('Numeric value'),
                z.boolean().describe('Boolean value'),
                nonEmptyStringArray.describe('Array of strings'),
              ])
              .describe('Schema field value')
          )
          .optional()
          .describe('Article schema.org structured data'),
        faq: z
          .record(
            z.string().describe('Schema field key'),
            z
              .union([
                z.string().describe('String value'),
                z.number().describe('Numeric value'),
                z.boolean().describe('Boolean value'),
                nonEmptyStringArray.describe('Array of strings'),
              ])
              .describe('Schema field value')
          )
          .optional()
          .describe('FAQ schema.org structured data'),
        breadcrumb: z
          .record(
            z.string().describe('Schema field key'),
            z
              .union([
                z.string().describe('String value'),
                z.number().describe('Numeric value'),
                z.boolean().describe('Boolean value'),
                nonEmptyStringArray.describe('Array of strings'),
              ])
              .describe('Schema field value')
          )
          .optional()
          .describe('Breadcrumb schema.org structured data'),
        howto: z
          .record(
            z.string().describe('Schema field key'),
            z
              .union([
                z.string().describe('String value'),
                z.number().describe('Numeric value'),
                z.boolean().describe('Boolean value'),
                nonEmptyStringArray.describe('Array of strings'),
              ])
              .describe('Schema field value')
          )
          .optional()
          .describe('HowTo schema.org structured data'),
      })
      .optional()
      .describe('Schema.org structured data for SEO enhancement'),
  })
  .describe('MDX file frontmatter metadata with SEO and schema.org support');

export type MDXFrontmatter = z.infer<typeof mdxFrontmatterSchema>;
