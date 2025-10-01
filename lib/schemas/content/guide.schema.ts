/**
 * Guide Content Schema
 * Based on SEO/tutorial MDX files structure and frontmatter
 *
 * Phase 2: Refactored using base-content.schema.ts with shape destructuring
 */

import { z } from 'zod';
import { baseContentMetadataSchema } from '@/lib/schemas/content/base-content.schema';
import { requiredTagArray } from '@/lib/schemas/primitives/base-arrays';
import {
  isoDateString,
  nonEmptyString,
  optionalUrlString,
} from '@/lib/schemas/primitives/base-strings';

/**
 * Guide Content Schema
 *
 * Matches MDX files with frontmatter in content/guides/ directory.
 * Uses Zod v4 shape destructuring pattern for composition with base content schema.
 *
 * Inherited Fields from baseContentMetadataSchema:
 * - slug: URL-safe identifier (generated from file path)
 * - description: Guide description
 * - author: Content creator
 * - dateAdded: ISO date when guide was added (fallback)
 * - tags: Required array of tags
 * - content: Full MDX content without frontmatter
 * - title: Display title (overridden as required for guides)
 * - source: Content source type (overridden with 'claudepro' default)
 * - documentationUrl: Optional external documentation link
 * - features: Optional list of features
 * - useCases: Optional list of use cases
 *
 * Guide-Specific Required Fields:
 * - category: Guide category (tutorials, comparisons, troubleshooting, etc.)
 * - title: Required title (overrides optional title from base)
 * - keywords: Required SEO keywords array
 *
 * Guide-Specific Date Fields (template variations):
 * - datePublished: tutorial-template
 * - dateModified: tutorial-template
 * - dateUpdated: category, comparison, troubleshooting, workflow, collection templates
 * - dateAdded: Auto-generated fallback (inherited from base)
 *
 * Guide-Specific Optional Metadata:
 * - readingTime: Estimated reading time
 * - difficulty: Skill level (beginner, intermediate, advanced, expert, or dynamic string)
 * - featured: Featured guide flag
 * - lastReviewed: Last review date
 * - aiOptimized: AI optimization flag
 * - citationReady: Citation readiness flag
 *
 * Community Properties (template-specific):
 * - communityEngagement: tutorial-template
 * - communityDriven: comparison, troubleshooting, workflow templates
 *
 * Additional Guide Fields:
 * - source: Defaults to 'claudepro' for guides
 * - githubUrl: Optional GitHub repository URL
 * - relatedGuides: Array of related guide slugs (max 20)
 *
 * Category Types (matching template variations):
 * - tutorials: tutorial-template.mdx
 * - comparisons: comparison-template.mdx
 * - troubleshooting: troubleshooting-template.mdx
 * - use-cases: use-case-template.mdx
 * - workflows: workflow-template.mdx
 * - categories: category-template.mdx
 * - collections: collection-template.mdx
 * - guides: General guide category
 */
export const guideContentSchema = z.object({
  // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
  ...baseContentMetadataSchema.shape,

  // Guide-specific required fields (category discriminator)
  category: z.enum([
    'tutorials', // tutorial-template.mdx
    'comparisons', // comparison-template.mdx
    'troubleshooting', // troubleshooting-template.mdx
    'use-cases', // use-case-template.mdx
    'workflows', // workflow-template.mdx
    'categories', // category-template.mdx
    'collections', // collection-template.mdx
    'guides', // General guide category
  ]),

  // Override: title is required for guides (not optional like in base)
  title: nonEmptyString,

  // Guide-specific date fields (template variations)
  datePublished: isoDateString.optional(), // tutorial-template
  dateModified: isoDateString.optional(), // tutorial-template
  dateUpdated: isoDateString.optional(), // category, comparison, troubleshooting, workflow, collection templates

  // Keywords in addition to tags (required for SEO)
  keywords: requiredTagArray,

  // Optional metadata properties (common across all templates)
  readingTime: z.string().optional(),
  difficulty: z
    .union([
      z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      z.string(), // Some templates use dynamic difficulty strings
    ])
    .optional(),
  featured: z.boolean().optional(),
  lastReviewed: isoDateString.optional(),
  aiOptimized: z.boolean().optional(),
  citationReady: z.boolean().optional(),

  // Community-related properties (template-specific variations)
  communityEngagement: z.boolean().optional(), // tutorial-template
  communityDriven: z.boolean().optional(), // comparison, troubleshooting, workflow templates

  // Override: source defaults to 'claudepro' for guides
  source: z
    .enum(['community', 'official', 'verified', 'claudepro'])
    .optional()
    .default('claudepro'),

  // Additional guide-specific URLs
  githubUrl: optionalUrlString,

  // Related content
  relatedGuides: z.array(z.string()).max(20).optional(),
});

export type GuideContent = z.infer<typeof guideContentSchema>;
