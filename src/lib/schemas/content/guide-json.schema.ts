/**
 * Guide JSON Schema - Configuration-Driven Content
 *
 * Replaces MDX guides with JSON-based, section-driven architecture.
 * Enables programmatic guide generation, A/B testing, and CMS integration.
 *
 * ARCHITECTURE:
 * - Metadata: Standard guide frontmatter (extends guideContentSchema)
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
import { baseUsageExampleSchema } from '@/src/lib/schemas/content/base-content.schema';
import { guideContentSchema } from '@/src/lib/schemas/content/guide.schema';
import {
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
        language: baseUsageExampleSchema.shape.language,
        code: z.string().min(1).max(10000).describe('Code content'),
        filename: z.string().optional().describe('Optional filename'),
      })
    )
    .min(2)
    .max(10)
    .describe('Array of code tabs (2-10 tabs)'),
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
    .enum(['info', 'warning', 'success', 'error', 'tip'])
    .describe('Callout styling variant'),
  title: z.string().optional().describe('Optional callout title'),
  content: mediumString.describe('Callout content (supports markdown)'),
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
    .min(2)
    .max(6)
    .optional()
    .describe('Optional bullet points (2-6 items)'),
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
  columns: z.enum(['2', '3', '4']).optional().default('3').describe('Grid columns (2-4)'),
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
  headers: z.array(nonEmptyString.max(100)).min(2).max(6).describe('Column headers (2-6 columns)'),
  data: z
    .array(z.record(z.string(), z.string()))
    .min(1)
    .max(50)
    .describe('Array of row objects (key = header, value = cell content)'),
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
        value: nonEmptyString.max(50).describe('Tab value (unique identifier)'),
        content: z.string().min(1).describe('Tab content (HTML/markdown string or serialized JSX)'),
      })
    )
    .min(2)
    .max(10)
    .describe('Tab items (2-10 tabs)'),
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
        content: mediumString.describe('Accordion content (supports markdown)'),
        defaultOpen: z.boolean().optional().default(false).describe('Open by default'),
      })
    )
    .min(1)
    .max(20)
    .describe('Accordion items (1-20 items)'),
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
        answer: mediumString.describe('Answer text (supports markdown)'),
        category: z
          .string()
          .optional()
          .describe('Optional category for filtering (e.g., "pricing", "technical")'),
      })
    )
    .min(1)
    .max(30)
    .describe('FAQ items (1-30 questions)'),
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
        number: z.number().min(1).describe('Step number'),
        title: nonEmptyString.max(200).describe('Step title'),
        description: mediumString.describe('Step description'),
        timeEstimate: z.string().optional().describe('Optional time estimate (e.g., "5 minutes")'),
        code: z.string().optional().describe('Optional code example'),
        language: baseUsageExampleSchema.shape.language.optional(),
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
    .enum(['prerequisites', 'requirements', 'todo', 'verification'])
    .optional()
    .default('prerequisites')
    .describe('Checklist purpose'),
  title: z.string().optional().describe('Optional checklist title'),
  items: z
    .array(
      z.object({
        task: nonEmptyString.max(200).describe('Task/requirement description'),
        description: z.string().optional().describe('Optional additional context'),
        required: z.boolean().optional().default(true).describe('Is this required?'),
      })
    )
    .min(1)
    .max(20)
    .describe('Checklist items (1-20 items)'),
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
        description: mediumString.describe('Resource description'),
        url: z.string().url().describe('Resource URL'),
        type: z
          .enum(['tutorial', 'guide', 'documentation', 'video', 'tool', 'article'])
          .describe('Resource type'),
        external: z.boolean().optional().default(false).describe('Is external link?'),
      })
    )
    .min(1)
    .max(20)
    .describe('Related resources (1-20 items)'),
});

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
]);

// ============================================================================
// GUIDE JSON SCHEMA
// ============================================================================

/**
 * Guide JSON Schema - Complete guide structure
 *
 * Structure:
 * {
 *   ...metadata (title, description, tags, etc.),
 *   sections: [
 *     { type: "tldr", content: "...", keyPoints: [...] },
 *     { type: "text", content: "# Introduction\n\n..." },
 *     { type: "code", language: "typescript", code: "..." },
 *     ...
 *   ]
 * }
 *
 * Usage:
 * ```typescript
 * import { guideJsonSchema } from '@/src/lib/schemas/content/guide-json.schema';
 *
 * const guide = guideJsonSchema.parse(jsonContent);
 * // guide.sections[0].type === "tldr" → TypeScript narrows to tldrSectionSchema
 * ```
 */
export const guideJsonSchema = guideContentSchema.extend({
  // Override content field - guides use sections array instead of raw MDX
  content: z.undefined().optional().describe('Not used in JSON guides - use sections array'),

  // Sections array - core content structure
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

export type GuideJson = z.infer<typeof guideJsonSchema>;
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
