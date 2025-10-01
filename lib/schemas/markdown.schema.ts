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
