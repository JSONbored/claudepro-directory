/**
 * Guide Schema - JSON-Based Configuration-Driven Content
 *
 * Unified schema for JSON guides with section-based architecture.
 * Replaces previous MDX-based guide system with type-safe JSON structure.
 *
 * ARCHITECTURE:
 * - Metadata: Standard guide frontmatter with all required fields
 * - Sections: Array of typed sections (text, code, table, tabs, etc.)
 * - Each section maps to existing React components (zero new component creation)
 *
 * BENEFITS:
 * - 10x faster parsing (JSON.parse vs MDX compilation)
 * - Type-safe with Zod validation
 * - Claude Code can generate guides programmatically
 * - A/B testing sections without code changes
 * - Tree-shakeable (only import used section types)
 */

import { z } from 'zod';
import {
  baseContentMetadataSchema,
  baseUsageExampleSchema,
} from '@/src/lib/schemas/content/base-content.schema';
import { requiredTagArray } from '@/src/lib/schemas/primitives/base-arrays';
import {
  isoDateString,
  mediumString,
  nonEmptyString,
  optionalUrlString,
} from '@/src/lib/schemas/primitives/base-strings';

// ============================================================================
// BASE SECTION SCHEMA
// ============================================================================

/**
 * Base section metadata - shared across all section types
 */
const baseSectionMetadataSchema = z.object({
  id: z
    .string()
    .optional()
    .describe('Optional unique ID for section anchoring (e.g., #prerequisites)'),
  className: z.string().optional().describe('Optional Tailwind CSS classes for custom styling'),
});

// ============================================================================
// TEXT & HEADING SECTIONS
// ============================================================================

/**
 * Markdown text section - Standard prose content
 *
 * Maps to: <div dangerouslySetInnerHTML> or markdown-to-jsx renderer
 */
const textSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('text'),
  content: z
    .string()
    .min(1)
    .describe('Markdown-formatted text content (supports **bold**, _italic_, [links](), etc.)'),
});

/**
 * Heading section - Semantic headings (h2-h6)
 *
 * Maps to: <Heading level={2|3|4|5|6}>
 */
const headingSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('heading'),
  level: z.enum(['2', '3', '4', '5', '6']).describe('Heading level (h2-h6, h1 is page title)'),
  content: nonEmptyString.max(200).describe('Heading text'),
});

// ============================================================================
// CODE SECTIONS
// ============================================================================

/**
 * Single code block section
 *
 * Maps to: <ProductionCodeBlock language={} code={} />
 */
const codeSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('code'),
  language: baseUsageExampleSchema.shape.language.describe(
    'Programming language for syntax highlighting'
  ),
  code: z.string().min(1).max(10000).describe('Code content (max 10K chars)'),
  filename: z.string().optional().describe('Optional filename to display (e.g., "server.ts")'),
  showLineNumbers: z.boolean().optional().default(true).describe('Show line numbers'),
  highlightLines: z
    .array(z.number())
    .optional()
    .describe('Line numbers to highlight (e.g., [5, 12, 18])'),
});

/**
 * Code group with tabs - Multiple related code examples
 *
 * Maps to: <CodeGroup tabs={[...]} />
 */
const codeGroupSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('code_group'),
  title: z.string().optional().describe('Optional title above code group'),
  tabs: z
    .array(
      z.object({
        label: nonEmptyString.max(50).describe('Tab label (e.g., "TypeScript", "Python")'),
        language: z.string().optional().describe('Optional code language'),
        code: z.string().min(1).max(10000).describe('Code content'),
        filename: z.string().optional().describe('Optional filename'),
      })
    )
    .min(1)
    .max(10)
    .describe('Array of code tabs (1-10 tabs)'),
});

// ============================================================================
// CALLOUT SECTIONS
// ============================================================================

/**
 * Callout box - Info, warning, success, error messages
 *
 * Maps to: <UnifiedContentBox contentType="callout" variant={} />
 */
const calloutSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('callout'),
  variant: z
    .enum(['info', 'warning', 'success', 'error', 'tip', 'primary', 'important'])
    .describe('Callout styling variant'),
  title: z.string().optional().describe('Optional callout title'),
  content: z.string().max(2000).describe('Callout content (supports markdown, up to 2000 chars)'),
});

// ============================================================================
// TLDR & FEATURE SECTIONS
// ============================================================================

/**
 * TLDR summary section - Key takeaways at start of guide
 *
 * Maps to: <UnifiedContentBlock variant="tldr" />
 */
const tldrSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('tldr'),
  content: mediumString.describe('TLDR summary text'),
  keyPoints: z
    .array(nonEmptyString.max(200))
    .max(6)
    .optional()
    .describe('Optional bullet points (0-6 items)'),
});

/**
 * Feature grid section - Highlight features/benefits
 *
 * Maps to: <UnifiedContentBlock variant="feature-grid" />
 */
const featureGridSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('feature_grid'),
  title: z.string().optional().describe('Optional section title'),
  description: z.string().optional().describe('Optional section description'),
  columns: z
    .union([z.enum(['2', '3', '4']), z.number().int().min(2).max(4)])
    .optional()
    .default('3')
    .describe('Grid columns (2-4)'),
  features: z
    .array(
      z.object({
        title: nonEmptyString.max(100).describe('Feature title'),
        description: mediumString.describe('Feature description'),
        badge: z.string().optional().describe('Optional badge label'),
        icon: z.string().optional().describe('Optional Lucide icon name'),
      })
    )
    .min(2)
    .max(12)
    .describe('Array of features (2-12 items)'),
});

/**
 * Expert quote section - Testimonial/user feedback
 *
 * Maps to: <UnifiedContentBlock variant="expert-quote" />
 */
const expertQuoteSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('expert_quote'),
  quote: mediumString.describe('Quote content'),
  author: nonEmptyString.max(100).describe('Quote author name'),
  title: z.string().optional().describe('Author title/role'),
  company: z.string().optional().describe('Author company'),
  rating: z.number().min(1).max(5).optional().describe('Optional star rating (1-5)'),
  avatarUrl: optionalUrlString.describe('Optional author avatar image URL'),
});

// ============================================================================
// COMPARISON & TABLE SECTIONS
// ============================================================================

/**
 * Comparison table section - Side-by-side feature comparison
 *
 * Maps to: <ComparisonTable headers={} data={} />
 */
const comparisonTableSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('comparison_table'),
  title: z.string().optional().describe('Optional table title'),
  description: z.string().optional().describe('Optional table description'),
  headers: z
    .array(nonEmptyString.max(100))
    .min(2)
    .max(6)
    .optional()
    .describe('Optional column headers (2-6 columns)'),
  data: z
    .union([
      z.array(z.record(z.string(), z.string())), // Object format: [{col1: "val", col2: "val"}]
      z.array(z.array(z.string())), // Array format: [["val1", "val2"], ["val3", "val4"]]
    ])
    .describe('Table data as array of objects or array of arrays'),
  highlightColumn: z.number().optional().describe('Optional column index to highlight (0-indexed)'),
});

// ============================================================================
// INTERACTIVE SECTIONS (TABS, ACCORDION, FAQ)
// ============================================================================

/**
 * Tabs section - Tabbed content panels
 *
 * Maps to: <Tabs items={[...]} />
 */
const tabsSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('tabs'),
  title: z.string().optional().describe('Optional section title above tabs'),
  description: z.string().optional().describe('Optional description'),
  items: z
    .array(
      z.object({
        label: nonEmptyString.max(50).describe('Tab label'),
        value: z.string().max(50).optional().describe('Optional tab value (unique identifier)'),
        content: z
          .string()
          .max(5000)
          .describe('Tab content (HTML/markdown string, up to 5000 chars)'),
      })
    )
    .min(1)
    .max(10)
    .describe('Tab items (1-10 tabs)'),
});

/**
 * Accordion section - Collapsible content panels
 *
 * Maps to: <UnifiedContentBox contentType="accordion" />
 */
const accordionSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('accordion'),
  title: z.string().optional().describe('Optional section title'),
  description: z.string().optional().describe('Optional description'),
  items: z
    .array(
      z.object({
        title: nonEmptyString.max(200).describe('Accordion item title'),
        content: z
          .string()
          .max(2000)
          .describe('Accordion content (supports markdown, up to 2000 chars)'),
        defaultOpen: z.boolean().optional().default(false).describe('Open by default'),
      })
    )
    .min(0)
    .max(20)
    .describe('Accordion items (0-20 items)'),
});

/**
 * FAQ section - Frequently asked questions
 *
 * Maps to: <UnifiedContentBox contentType="faq" />
 */
const faqSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('faq'),
  title: z.string().optional().describe('Optional FAQ section title'),
  description: z.string().optional().describe('Optional description'),
  questions: z
    .array(
      z.object({
        question: nonEmptyString.max(300).describe('Question text'),
        answer: z.string().max(2000).describe('Answer text (supports markdown, up to 2000 chars)'),
        category: z
          .string()
          .optional()
          .describe('Optional category for filtering (e.g., "pricing", "technical")'),
      })
    )
    .min(0)
    .max(30)
    .describe('FAQ items (0-30 questions)'),
});

// ============================================================================
// STEP-BY-STEP & CHECKLIST SECTIONS
// ============================================================================

/**
 * Step-by-step guide section - Sequential tutorial steps
 *
 * Maps to: <StepByStepGuide steps={[...]} />
 */
const stepsSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('steps'),
  title: z.string().optional().describe('Optional section title'),
  steps: z
    .array(
      z.object({
        number: z.number().min(1).optional().describe('Optional step number'),
        title: nonEmptyString.max(200).describe('Step title'),
        description: z.string().max(2000).describe('Step description (up to 2000 chars)'),
        timeEstimate: z.string().optional().describe('Optional time estimate (e.g., "5 minutes")'),
        code: z.string().optional().describe('Optional code example'),
        language: z.string().optional().describe('Optional code language'),
        notes: z.string().optional().describe('Optional additional notes'),
      })
    )
    .min(1)
    .max(30)
    .describe('Tutorial steps (1-30 steps)'),
});

/**
 * Checklist section - Prerequisites/requirements list
 *
 * Maps to: <Checklist items={[...]} />
 */
const checklistSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('checklist'),
  checklistType: z
    .enum(['prerequisites', 'requirements', 'todo', 'verification', 'implementation', 'testing'])
    .optional()
    .default('prerequisites')
    .describe('Checklist purpose'),
  title: z.string().optional().describe('Optional checklist title'),
  items: z
    .array(
      z.object({
        task: z.string().max(500).describe('Task/requirement description'),
        description: z.string().max(1000).optional().describe('Optional additional context'),
        required: z.boolean().optional().default(true).describe('Is this required?'),
      })
    )
    .min(0)
    .max(20)
    .describe('Checklist items (0-20 items)'),
  estimatedTime: z.string().optional().describe('Optional total time estimate'),
  skillLevel: z
    .enum(['beginner', 'intermediate', 'advanced', 'expert'])
    .optional()
    .describe('Required skill level'),
});

// ============================================================================
// RELATED CONTENT SECTION
// ============================================================================

/**
 * Related content section - Links to other guides/resources
 *
 * Maps to: <SmartRelatedContent resources={[...]} />
 */
const relatedContentSectionSchema = baseSectionMetadataSchema.extend({
  type: z.literal('related_content'),
  title: z.string().optional().describe('Optional section title'),
  description: z.string().optional().describe('Optional description'),
  resources: z
    .array(
      z.object({
        title: nonEmptyString.max(200).describe('Resource title'),
        description: z.string().max(1000).optional().describe('Optional resource description'),
        url: z.string().describe('Resource URL (validated as URL or path)'),
        type: z
          .enum(['tutorial', 'guide', 'documentation', 'video', 'tool', 'article'])
          .optional()
          .describe('Optional resource type'),
        external: z.boolean().optional().default(false).describe('Is external link?'),
      })
    )
    .min(0)
    .max(20)
    .optional()
    .describe('Optional related resources array (0-20 items)'),
});

// ============================================================================
// AGENT-CREATED SECTION TYPES (passthrough schemas)
// ============================================================================

/**
 * Quick reference section - Command/concept reference sheet
 * Created by migration agents - flexible schema with passthrough
 */
const quickReferenceSectionSchema = baseSectionMetadataSchema
  .extend({
    type: z.literal('quick_reference'),
    title: z.string().optional(),
    description: z.string().optional(),
    items: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough();

/**
 * Documentation/Guide/Tutorial sections - Link sections
 * Created by migration agents - flexible schema with passthrough
 */
const documentationSectionSchema = baseSectionMetadataSchema
  .extend({
    type: z.literal('documentation'),
  })
  .passthrough();

const guideSectionTypeSchema = baseSectionMetadataSchema
  .extend({
    type: z.literal('guide'),
  })
  .passthrough();

const tutorialSectionTypeSchema = baseSectionMetadataSchema
  .extend({
    type: z.literal('tutorial'),
  })
  .passthrough();

// ============================================================================
// UNION OF ALL SECTION TYPES
// ============================================================================

/**
 * Guide section union - Discriminated union of all section types
 *
 * TypeScript will narrow type based on `type` field for perfect IntelliSense
 */
export const guideSectionSchema = z.discriminatedUnion('type', [
  textSectionSchema,
  headingSectionSchema,
  codeSectionSchema,
  codeGroupSectionSchema,
  calloutSectionSchema,
  tldrSectionSchema,
  featureGridSectionSchema,
  expertQuoteSectionSchema,
  comparisonTableSectionSchema,
  tabsSectionSchema,
  accordionSectionSchema,
  faqSectionSchema,
  stepsSectionSchema,
  checklistSectionSchema,
  relatedContentSectionSchema,
  quickReferenceSectionSchema,
  documentationSectionSchema,
  guideSectionTypeSchema,
  tutorialSectionTypeSchema,
]);

// ============================================================================
// GUIDE CONTENT SCHEMA (JSON-BASED)
// ============================================================================

/**
 * Guide Content Schema - Complete JSON guide structure
 *
 * Metadata + Sections architecture:
 * - All standard guide metadata fields (title, description, keywords, etc.)
 * - Sections array with typed section objects
 *
 * Structure:
 * {
 *   title: "Guide Title",
 *   description: "Guide description",
 *   keywords: ["keyword1", "keyword2"],
 *   author: "Author Name",
 *   subcategory: "tutorials",
 *   dateUpdated: "2025-10-23",
 *   ...metadata,
 *   sections: [
 *     { type: "tldr", content: "...", keyPoints: [...] },
 *     { type: "text", content: "# Introduction\n\n..." },
 *     { type: "code", language: "typescript", code: "..." },
 *     ...
 *   ]
 * }
 */
export const guideContentSchema = z.object({
  // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
  ...baseContentMetadataSchema.shape,

  // Guide category - MUST be 'guides' (architecture fix: subcategories are NOT categories)
  category: z.literal('guides'),

  // Guide subcategory - required for routing and organization
  subcategory: z.enum([
    'tutorials', // tutorial-template.mdx
    'comparisons', // comparison-template.mdx
    'troubleshooting', // troubleshooting-template.mdx
    'use-cases', // use-case-template.mdx
    'workflows', // workflow-template.mdx
  ]),

  // Override: title is required for guides (not optional like in base)
  title: nonEmptyString,

  // Override: dateAdded is optional for guides (use dateUpdated instead)
  dateAdded: isoDateString.optional(),

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

  // Sections array - core content structure (replaces raw MDX content field)
  sections: z
    .array(guideSectionSchema)
    .min(1)
    .max(200)
    .describe(
      'Array of guide sections (1-200 sections). Each section renders a specific component type.'
    ),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GuideContent = z.infer<typeof guideContentSchema>;
export type GuideSection = z.infer<typeof guideSectionSchema>;

// Individual section types for component props
export type TextSection = z.infer<typeof textSectionSchema>;
export type HeadingSection = z.infer<typeof headingSectionSchema>;
export type CodeSection = z.infer<typeof codeSectionSchema>;
export type CodeGroupSection = z.infer<typeof codeGroupSectionSchema>;
export type CalloutSection = z.infer<typeof calloutSectionSchema>;
export type TldrSection = z.infer<typeof tldrSectionSchema>;
export type FeatureGridSection = z.infer<typeof featureGridSectionSchema>;
export type ExpertQuoteSection = z.infer<typeof expertQuoteSectionSchema>;
export type ComparisonTableSection = z.infer<typeof comparisonTableSectionSchema>;
export type TabsSection = z.infer<typeof tabsSectionSchema>;
export type AccordionSection = z.infer<typeof accordionSectionSchema>;
export type FaqSection = z.infer<typeof faqSectionSchema>;
export type StepsSection = z.infer<typeof stepsSectionSchema>;
export type ChecklistSection = z.infer<typeof checklistSectionSchema>;
export type RelatedContentSection = z.infer<typeof relatedContentSectionSchema>;
