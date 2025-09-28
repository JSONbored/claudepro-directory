/**
 * Guide Content Schema
 * Based on SEO/tutorial MDX files structure and frontmatter
 */

import { z } from 'zod';

/**
 * Guide content schema - matches MDX files with frontmatter in seo/ directory
 */
export const guideContentSchema = z.object({
  // Required base properties from frontmatter (matching actual template structure)
  title: z.string().min(1),
  description: z.string().min(1),
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
  author: z.string().min(1),

  // Date fields matching template structure variations
  datePublished: z.string().optional(), // tutorial-template
  dateModified: z.string().optional(), // tutorial-template
  dateUpdated: z.string().optional(), // category, comparison, troubleshooting, workflow, collection templates
  dateAdded: z.string().optional(), // Auto-generated fallback

  // Required guide-specific properties
  keywords: z.array(z.string()).min(1),
  tags: z.array(z.string()).min(1),

  // Optional metadata properties (common across all templates)
  readingTime: z.string().optional(),
  difficulty: z
    .union([
      z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      z.string(), // Some templates use dynamic difficulty strings
    ])
    .optional(),
  featured: z.boolean().optional(),
  lastReviewed: z.string().optional(), // ISO date string
  aiOptimized: z.boolean().optional(),
  citationReady: z.boolean().optional(),

  // Community-related properties (template-specific variations)
  communityEngagement: z.boolean().optional(), // tutorial-template
  communityDriven: z.boolean().optional(), // comparison, troubleshooting, workflow templates

  // Content (extracted from MDX body)
  content: z.string().min(1), // Full MDX content without frontmatter

  // Auto-generated properties
  slug: z.string().min(1), // Generated from file path

  // Additional optional properties
  source: z
    .enum(['community', 'official', 'verified', 'claudepro'])
    .optional()
    .default('claudepro'),
  githubUrl: z.string().url().optional(),
  documentationUrl: z.string().url().optional(),

  // Guide features and use cases
  features: z.array(z.string().max(500)).max(50).optional(),
  useCases: z.array(z.string().max(500)).max(50).optional(),
  requirements: z.array(z.string().max(500)).max(20).optional(),

  // Related content
  relatedGuides: z.array(z.string()).max(20).optional(),
});

export type GuideContent = z.infer<typeof guideContentSchema>;
