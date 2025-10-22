/**
 * Guide Content Schema
 * Based on JSON guide files with structured content sections
 *
 * Phase 2: Refactored using base-content.schema.ts with shape destructuring
 */

import { z } from 'zod';
import { baseContentMetadataSchema } from '@/src/lib/schemas/content/base-content.schema';
import { requiredTagArray } from '@/src/lib/schemas/primitives/base-arrays';
import {
  isoDateString,
  nonEmptyString,
  optionalUrlString,
} from '@/src/lib/schemas/primitives/base-strings';

/**
 * Guide Content Schema
 *
 * Matches JSON files in content/guides/ directory.
 * Uses Zod v4 shape destructuring pattern for composition with base content schema.
 *
 * Inherited Fields from baseContentMetadataSchema:
 * - slug: URL-safe identifier (generated from file path)
 * - description: Guide description
 * - author: Content creator
 * - dateAdded: ISO date when guide was added (fallback)
 * - tags: Required array of tags
 * - content: Full JSON content as stringified structure
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
 * Category Types (guide subcategories):
 * - tutorials: Step-by-step guides
 * - comparisons: Feature and tool comparisons
 * - troubleshooting: Problem-solving guides
 * - use-cases: Industry and scenario guides
 * - workflows: Process and migration guides
 */
export const guideContentSchema = z.object({
  // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
  ...baseContentMetadataSchema.shape,

  // Guide category - MUST be 'guides' (architecture fix: subcategories are NOT categories)
  category: z.literal('guides'),

  // Guide subcategory - required for routing and organization
  subcategory: z.enum([
    'tutorials', // Step-by-step guides
    'comparisons', // Feature and tool comparisons
    'troubleshooting', // Problem-solving guides
    'use-cases', // Industry and scenario guides
    'workflows', // Process and migration guides
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

// ==============================================================================
// CONTENT SECTION SCHEMAS (For JSON Content Renderer)
// ==============================================================================

import { nonNegativeInt } from '@/src/lib/schemas/primitives/base-numbers';
import {
  codeString,
  longString,
  mediumString,
  shortString,
} from '@/src/lib/schemas/primitives/base-strings';

/**
 * Paragraph - Plain text with inline markdown formatting
 * Supports: **bold**, _italic_, [links](url)
 */
const paragraphSectionSchema = z
  .object({
    type: z.literal('paragraph'),
    content: longString.describe('Paragraph text with inline markdown (bold, italic, links)'),
  })
  .describe('Text paragraph with inline formatting');

/**
 * Heading - Section headings (h1-h6) with auto-generated anchor IDs
 */
const headingSectionSchema = z
  .object({
    type: z.literal('heading'),
    level: z.number().int().min(1).max(6).describe('Heading level (1-6)'),
    text: mediumString.describe('Heading text content'),
    id: shortString.optional().describe('Anchor ID (auto-generated from text if not provided)'),
  })
  .describe('Section heading with anchor link support');

/**
 * Code Block - Syntax-highlighted code with language and optional metadata
 */
const codeSectionSchema = z
  .object({
    type: z.literal('code'),
    language: shortString.describe('Programming language for syntax highlighting'),
    code: codeString.describe('Code content'),
    filename: shortString.optional().describe('Optional filename to display'),
    highlight: z.array(nonNegativeInt).optional().describe('Line numbers to highlight'),
  })
  .describe('Code block with syntax highlighting');

/**
 * List - Ordered or unordered list with inline markdown in items
 */
const listSectionSchema = z
  .object({
    type: z.literal('list'),
    ordered: z.boolean().default(false).describe('true for numbered lists, false for bullets'),
    items: z
      .array(mediumString.describe('List item with inline markdown'))
      .min(1)
      .describe('List items'),
  })
  .describe('Ordered or unordered list');

/**
 * Blockquote - Quoted text
 */
const blockquoteSectionSchema = z
  .object({
    type: z.literal('blockquote'),
    content: longString.describe('Quoted text with inline markdown'),
  })
  .describe('Blockquote/quoted text');

/**
 * Image - Image with alt text, dimensions, and optional caption
 */
const imageSectionSchema = z
  .object({
    type: z.literal('image'),
    src: shortString.describe('Image source URL or path'),
    alt: mediumString.describe('Alt text for accessibility and SEO'),
    width: nonNegativeInt.default(800).describe('Image width in pixels'),
    height: nonNegativeInt.default(600).describe('Image height in pixels'),
    caption: mediumString.optional().describe('Optional image caption'),
  })
  .describe('Image with metadata');

/**
 * Table - Tabular data with headers and rows
 */
const tableSectionSchema = z
  .object({
    type: z.literal('table'),
    headers: z.array(shortString.describe('Column header')).describe('Table column headers'),
    rows: z
      .array(
        z
          .array(mediumString.describe('Cell content with inline markdown'))
          .describe('Table row cells')
      )
      .describe('Table data rows'),
  })
  .describe('Table with headers and rows');

/**
 * Component - React component with validated props
 */
const componentSectionSchema = z
  .object({
    type: z.literal('component'),
    component: z
      .enum([
        'UnifiedContentBox',
        'UnifiedContentBlock',
        'StepByStepGuide',
        'Checklist',
        'CodeGroup',
        'ComparisonTable',
        'DiagnosticFlow',
        'ErrorTable',
        'MetricsDisplay',
        'SmartRelatedContent',
      ])
      .describe('React component name'),
    props: z
      .record(z.string(), z.any())
      .describe('Component props (validated at render time against component schemas)'),
  })
  .describe('React component with props');

/**
 * Horizontal Rule - Section divider
 */
const horizontalRuleSectionSchema = z.object({
  type: z.literal('hr'),
});

/**
 * Content section - union of all section types
 * The 'type' field is the discriminator.
 */
export const contentSectionSchema = z.union([
  paragraphSectionSchema,
  headingSectionSchema,
  codeSectionSchema,
  listSectionSchema,
  blockquoteSectionSchema,
  imageSectionSchema,
  tableSectionSchema,
  componentSectionSchema,
  horizontalRuleSectionSchema,
]);

export type ContentSection = z.infer<typeof contentSectionSchema>;

// Helper types for specific sections
export type ParagraphSection = z.infer<typeof paragraphSectionSchema>;
export type HeadingSection = z.infer<typeof headingSectionSchema>;
export type CodeSection = z.infer<typeof codeSectionSchema>;
export type ListSection = z.infer<typeof listSectionSchema>;
export type BlockquoteSection = z.infer<typeof blockquoteSectionSchema>;
export type ImageSection = z.infer<typeof imageSectionSchema>;
export type TableSection = z.infer<typeof tableSectionSchema>;
export type ComponentSection = z.infer<typeof componentSectionSchema>;
