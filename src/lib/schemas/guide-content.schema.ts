/**
 * Guide JSON Content Schema
 *
 * Complete JSON structure for guide content, replacing MDX format.
 * Enables type-safe validation, AI generation, and structured content storage.
 *
 * Architecture:
 * - Discriminated union for section types (paragraph, heading, code, component, etc)
 * - Reuses existing component prop schemas from shared.schema.ts
 * - Supports inline markdown in text (bold, italic, links)
 * - Auto-generates heading IDs for anchor links
 * - Fully validatable at build time
 *
 * @see src/lib/schemas/shared.schema.ts - Component prop schemas
 * @see src/lib/schemas/markdown.schema.ts - Metadata schema (reused)
 */

import { z } from 'zod';
import { nonNegativeInt } from '@/src/lib/schemas/primitives/base-numbers';
import {
  codeString,
  longString,
  mediumString,
  nonEmptyString,
  shortString,
} from '@/src/lib/schemas/primitives/base-strings';

// ==============================================================================
// METADATA SCHEMA (Reuse existing MDX frontmatter structure)
// ==============================================================================

/**
 * Guide metadata schema - compatible with existing MDX frontmatter
 * Maintains backward compatibility while enabling JSON format
 */
export const guideMetadataSchema = z
  .object({
    title: nonEmptyString.max(200).describe('Guide title (max 200 characters)'),
    seoTitle: shortString
      .max(60)
      .optional()
      .describe('SEO-optimized title for <title> tag (max 60 chars)'),
    description: nonEmptyString.max(500).describe('Guide description for SEO (max 500 characters)'),
    keywords: z
      .array(shortString.max(50).describe('SEO keyword'))
      .optional()
      .describe('Array of SEO keywords'),
    dateUpdated: z.string().describe('ISO date string (YYYY-MM-DD)'),
    author: shortString.describe('Content author name'),
    category: z.literal('guides').describe('Always "guides" for guide content'),
    subcategory: z
      .enum(['tutorials', 'comparisons', 'workflows', 'use-cases', 'troubleshooting'])
      .describe('Guide subcategory'),
    tags: z.array(shortString.max(50)).optional().describe('Content tags for categorization'),
    readingTime: shortString.describe('Estimated reading time (e.g., "12 min")'),
    difficulty: z
      .enum(['beginner', 'intermediate', 'advanced'])
      .describe('Content difficulty level'),
    featured: z.boolean().default(false).describe('Whether guide is featured'),
    lastReviewed: z.string().describe('Last review date (YYYY-MM-DD)'),
    aiOptimized: z.boolean().default(true).describe('Optimized for AI consumption'),
    citationReady: z.boolean().default(true).describe('Ready for citation/reference'),
  })
  .describe('Guide metadata - SEO, categorization, and timing information');

export type GuideMetadata = z.infer<typeof guideMetadataSchema>;

// ==============================================================================
// CONTENT SECTION SCHEMAS (Discriminated Union)
// ==============================================================================

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
 *
 * Props are stored as JSON but validated at render time against
 * existing Zod schemas from shared.schema.ts
 *
 * Supported components:
 * - UnifiedContentBox (accordion, faq, infobox, callout)
 * - UnifiedContentBlock (tldr, feature-grid, content-tabs, etc)
 * - StepByStepGuide, Checklist, CodeGroup, etc
 * - SmartRelatedContent
 */
const componentSectionSchema = z
  .object({
    type: z.literal('component'),
    component: z
      .enum([
        // UnifiedContentBox variants
        'UnifiedContentBox',
        // UnifiedContentBlock variants
        'UnifiedContentBlock',
        // Other MDX components
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

// ==============================================================================
// DISCRIMINATED UNION - All Section Types
// ==============================================================================

/**
 * Content section - union of all section types
 *
 * TypeScript will ensure only valid combinations are allowed.
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

// ==============================================================================
// COMPLETE GUIDE JSON SCHEMA
// ==============================================================================

/**
 * Complete guide JSON structure
 *
 * Top-level structure:
 * - metadata: SEO, categorization, timing
 * - content: Array of section objects
 */
export const guideJsonSchema = z
  .object({
    metadata: guideMetadataSchema.describe('Guide metadata (SEO, categorization, timing)'),
    content: z
      .object({
        sections: z
          .array(contentSectionSchema.describe('Individual content section'))
          .min(1)
          .describe('Array of content sections (paragraphs, headings, code, components, etc)'),
      })
      .describe('Guide content structure'),
  })
  .describe('Complete guide JSON structure');

export type GuideJson = z.infer<typeof guideJsonSchema>;

// ==============================================================================
// HELPER TYPES FOR SPECIFIC SECTIONS
// ==============================================================================

export type ParagraphSection = z.infer<typeof paragraphSectionSchema>;
export type HeadingSection = z.infer<typeof headingSectionSchema>;
export type CodeSection = z.infer<typeof codeSectionSchema>;
export type ListSection = z.infer<typeof listSectionSchema>;
export type BlockquoteSection = z.infer<typeof blockquoteSectionSchema>;
export type ImageSection = z.infer<typeof imageSectionSchema>;
export type TableSection = z.infer<typeof tableSectionSchema>;
export type ComponentSection = z.infer<typeof componentSectionSchema>;

// ==============================================================================
// VALIDATION HELPERS
// ==============================================================================

/**
 * Validate guide JSON and return typed result
 */
export function validateGuideJson(json: unknown): GuideJson {
  return guideJsonSchema.parse(json);
}

/**
 * Validate guide JSON and return result with detailed errors
 */
export function validateGuideJsonSafe(
  json: unknown
): { success: true; data: GuideJson } | { success: false; error: z.ZodError } {
  const result = guideJsonSchema.safeParse(json);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
