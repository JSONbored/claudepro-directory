/**
 * Guide Content Schema
 * Based on SEO/tutorial MDX files structure and frontmatter
 */

import { z } from 'zod';
import {
  largeContentArray,
  limitedMediumStringArray,
  requiredTagArray,
} from '@/lib/schemas/primitives/base-arrays';
import {
  isoDateString,
  nonEmptyString,
  optionalUrlString,
} from '@/lib/schemas/primitives/base-strings';

/**
 * Guide content schema - matches MDX files with frontmatter in seo/ directory
 */
export const guideContentSchema = z.object({
  // Required base properties from frontmatter (matching actual template structure)
  title: nonEmptyString,
  description: nonEmptyString,
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
  author: nonEmptyString,

  // Date fields matching template structure variations
  datePublished: isoDateString.optional(), // tutorial-template
  dateModified: isoDateString.optional(), // tutorial-template
  dateUpdated: isoDateString.optional(), // category, comparison, troubleshooting, workflow, collection templates
  dateAdded: isoDateString.optional(), // Auto-generated fallback

  // Required guide-specific properties
  keywords: requiredTagArray,
  tags: requiredTagArray,

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

  // Content (extracted from MDX body)
  content: nonEmptyString, // Full MDX content without frontmatter

  // Auto-generated properties
  slug: nonEmptyString, // Generated from file path

  // Additional optional properties
  source: z
    .enum(['community', 'official', 'verified', 'claudepro'])
    .optional()
    .default('claudepro'),
  githubUrl: optionalUrlString,
  documentationUrl: optionalUrlString,

  // Guide features and use cases
  features: largeContentArray.optional(),
  useCases: largeContentArray.optional(),
  requirements: limitedMediumStringArray.optional(),

  // Related content
  relatedGuides: z.array(z.string()).max(20).optional(),
});

export type GuideContent = z.infer<typeof guideContentSchema>;
