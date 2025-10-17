/**
 * Shared Schema Definitions
 *
 * Centralized location for schemas used across multiple domain schemas.
 * This eliminates duplication and ensures consistency across the codebase.
 *
 * Production Standards:
 * - All shared schemas must be properly typed with z.infer
 * - No circular dependencies allowed
 * - Maintain backwards compatibility when modifying
 */

import { z } from 'zod';
import { imageDimension } from '@/src/lib/schemas/primitives/base-numbers';
import {
  codeString,
  extraLongString,
  longString,
  mediumString,
  optionalUrlString,
  shortString,
  ultraLongString,
  veryLongCodeString,
} from '@/src/lib/schemas/primitives/base-strings';
import {
  componentDescriptionString,
  componentLabelString,
  componentTimeString,
  componentTitleString,
  componentValueString,
} from '@/src/lib/schemas/primitives/ui-component-primitives';

/**
 * Content Categories
 * Used across: analytics, content, content-generation, related-content, static-api
 *
 * IMPORTANT: ContentCategory type is imported from category-config.ts (single source of truth).
 * Do NOT manually add categories here - add them to UNIFIED_CATEGORY_REGISTRY instead.
 *
 * Subcategories (like guide types: tutorials, comparisons, etc.) are NOT
 * top-level categories and should NOT be listed here.
 */

/**
 * ContentCategory - Single source of truth for all content categories
 *
 * ARCHITECTURE: Defined in shared.schema.ts (schema layer) to avoid circular dependencies.
 * category-config.ts imports this type, not the other way around.
 */
export const CONTENT_CATEGORIES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const;

export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

/**
 * Zod schema for content categories
 */
export const contentCategorySchema = z
  .enum(CONTENT_CATEGORIES)
  .describe('All valid content categories - single source of truth');

/**
 * Cacheable categories - subset that supports Redis caching (generateFullContent=true)
 * These categories have full content generated at build time
 */
export const CACHEABLE_CATEGORIES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
] as const;

export const cacheableCategorySchema = z
  .enum(CACHEABLE_CATEGORIES)
  .describe('Content categories that support Redis caching (where generateFullContent=true)');

/**
 * Guide Subcategories - Used ONLY for organizing guides under /guides route
 *
 * ARCHITECTURE: These are NOT categories. They are subcategories under 'guides'.
 * - Route: /guides/tutorials/... NOT /tutorials/...
 * - When storing/tracking: Use category='guides', NOT category='tutorials'
 * - Analytics: Track as guides, with optional subcategory metadata
 * - Bookmarks: Use category='guides', with optional subcategory in slug
 */
export const GUIDE_SUBCATEGORIES = [
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
] as const;

export type GuideSubcategory = (typeof GUIDE_SUBCATEGORIES)[number];

export const guideSubcategorySchema = z.enum(GUIDE_SUBCATEGORIES);

/**
 * Content Types
 * Used across: middleware, static-api
 */
export const appContentTypeSchema = z
  .enum(['agent', 'mcp', 'hook', 'command', 'rule', 'statusline', 'collection', 'job', 'skill'])
  .describe('Application content types for routing and middleware processing');

export type AppContentType = z.infer<typeof appContentTypeSchema>;

/**
 * Rate Limit Configuration
 * Used across: api, middleware
 */
const rateLimitConfigSchema = z
  .object({
    maxRequests: z
      .number()
      .int()
      .positive()
      .describe('Maximum number of requests allowed within the time window'),
    windowMs: z.number().int().positive().describe('Time window in milliseconds for rate limiting'),
    message: z
      .string()
      .optional()
      .describe('Custom error message shown when rate limit is exceeded'),
  })
  .describe('Configuration for API rate limiting including request limits and time windows');

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

/**
 * MDX Component Props
 * Used for type-safe MDX component props
 */
const mdxBasePropsSchema = z
  .object({
    className: z.string().default('').describe('CSS class names for styling'),
    style: z
      .record(
        z.string().describe('CSS property name'),
        z.union([z.string(), z.number()]).describe('CSS property value')
      )
      .default({})
      .describe('Inline CSS styles object'),
    'data-testid': z.string().optional().describe('Test identifier for testing frameworks'),
    'aria-label': z.string().optional().describe('Accessible label for screen readers'),
    'aria-labelledby': z.string().optional().describe('ID of element that labels this component'),
    'aria-describedby': z
      .string()
      .optional()
      .describe('ID of element that describes this component'),
    role: z.string().optional().describe('ARIA role attribute for accessibility'),
    tabIndex: z.number().optional().describe('Tab order index for keyboard navigation'),
  })
  .describe('Base props for MDX components including styling and accessibility attributes');

export const mdxHeadingPropsSchema = mdxBasePropsSchema
  .extend({
    id: z.string().optional().describe('Unique identifier for heading anchor links'),
    children: z.custom<React.ReactNode>().describe('Heading content'),
  })
  .describe('Props for MDX heading elements with anchor link support');

export const mdxElementPropsSchema = mdxBasePropsSchema
  .extend({
    children: z.custom<React.ReactNode>().describe('Element content'),
  })
  .describe('Props for generic MDX elements');

export const mdxLinkPropsSchema = mdxBasePropsSchema
  .extend({
    href: z.string().describe('Link destination URL'),
    children: z.custom<React.ReactNode>().describe('Link text or content'),
    target: z.string().optional().describe('Link target attribute (e.g., _blank for new tab)'),
    rel: z.string().optional().describe('Link relationship attribute for security and SEO'),
  })
  .describe('Props for MDX link elements with URL and target attributes');

export const mdxImagePropsSchema = mdxBasePropsSchema
  .extend({
    src: z.string().describe('Image source URL or path'),
    alt: z.string().describe('Alternative text for accessibility and SEO'),
    width: z
      .union([imageDimension, z.string()])
      .transform((val) => (typeof val === 'string' ? Number.parseInt(val, 10) : val))
      .default(800)
      .describe('Image width in pixels'),
    height: z
      .union([imageDimension, z.string()])
      .transform((val) => (typeof val === 'string' ? Number.parseInt(val, 10) : val))
      .default(600)
      .describe('Image height in pixels'),
  })
  .describe('Props for MDX image elements with responsive dimensions');

export type MdxBaseProps = z.infer<typeof mdxBasePropsSchema>;
export type MdxHeadingProps = z.infer<typeof mdxHeadingPropsSchema>;
export type MdxElementProps = z.infer<typeof mdxElementPropsSchema>;
export type MdxLinkProps = z.infer<typeof mdxLinkPropsSchema>;
export type MdxImageProps = z.infer<typeof mdxImagePropsSchema>;

/**
 * UI Component Schemas
 * Zod validation schemas for extracted components from ai-optimized-components.tsx
 */

// Core Components
const featureSchema = z
  .object({
    title: shortString.describe('Feature title or name'),
    description: mediumString.describe('Feature description explaining its purpose'),
    badge: componentValueString.optional().describe('Optional badge text for highlighting'),
  })
  .describe('Individual feature item with title, description, and optional badge');

const accordionItemSchema = z
  .object({
    title: componentTitleString.describe('Accordion item title shown in header'),
    content: z.custom<React.ReactNode>().describe('Accordion item content shown when expanded'),
    defaultOpen: z.boolean().default(false).describe('Whether accordion item is open by default'),
  })
  .describe('Single accordion item with collapsible content');

export const calloutPropsSchema = z
  .object({
    type: z
      .enum(['info', 'warning', 'success', 'error', 'tip'])
      .default('info')
      .describe('Callout visual style and semantic meaning'),
    title: shortString.optional().describe('Optional callout title'),
    children: z.custom<React.ReactNode>().describe('Callout content'),
  })
  .describe('Callout component props for highlighted information blocks');

export const tldrSummaryPropsSchema = z
  .object({
    content: codeString.optional().describe('Main summary content text'),
    keyPoints: z
      .array(componentTitleString.describe('Key point text'))
      .max(10)
      .optional()
      .describe('List of key takeaway points'),
    title: componentValueString.default('TL;DR').describe('Summary section title'),
  })
  .transform((data) => ({
    content: data.content || '',
    keyPoints: data.keyPoints,
    title: data.title,
  }))
  .describe('TL;DR summary component with content and key points');

// Template Components
const guideStepSchema = z
  .object({
    title: shortString.describe('Step title or heading'),
    description: longString.optional().describe('Detailed step description'),
    content: z.any().optional().describe('Additional React content for complex steps'),
    code: veryLongCodeString.optional().describe('Code snippet for this step'),
    tip: mediumString.optional().describe('Helpful tip or best practice for this step'),
    time: componentTimeString.describe('Estimated time to complete this step'),
    defaultOpen: z.boolean().optional().describe('Whether step is expanded by default'),
  })
  .describe('Individual step in a step-by-step guide with code and timing');

const codeExampleSchema = z
  .object({
    language: componentLabelString.describe('Programming language for syntax highlighting'),
    filename: shortString.optional().describe('Optional filename to display'),
    code: ultraLongString.describe('Code content to display'),
  })
  .describe('Code example with language and optional filename');

const comparisonItemSchema = z
  .object({
    feature: shortString.describe('Feature name being compared'),
    option1: z
      .union([componentTitleString, z.boolean()])
      .describe('First option value or boolean support indicator'),
    option2: z
      .union([componentTitleString, z.boolean()])
      .describe('Second option value or boolean support indicator'),
    option3: z
      .union([componentTitleString, z.boolean()])
      .optional()
      .describe('Optional third option value or boolean support indicator'),
    winner: componentValueString
      .optional()
      .describe('Identifier of the winning option for this feature'),
  })
  .describe('Single row in a comparison table showing feature support across options');

// Interactive Components
const tabItemSchema = z
  .object({
    label: componentLabelString.describe('Tab label displayed in tab button'),
    value: componentLabelString.describe('Unique identifier value for the tab'),
    content: z.custom<React.ReactNode>().describe('Tab content shown when selected'),
  })
  .describe('Individual tab item with label and content');

const quickReferenceItemSchema = z
  .object({
    label: shortString.optional().describe('Reference item label or key'),
    value: mediumString.optional().describe('Reference item value or content'),
    description: componentDescriptionString.describe('Detailed description of the reference item'),
  })
  .transform((data) => ({
    label: data.label || '',
    value: data.value || '',
    description: data.description,
  }))
  .describe('Quick reference entry with label, value, and description');

export const expertQuotePropsSchema = z
  .object({
    quote: codeString.describe('Quote text content'),
    author: shortString.describe('Quote author name'),
    role: shortString.optional().describe('Author job title or role'),
    company: shortString.optional().describe('Author company or organization'),
    imageUrl: optionalUrlString.describe('Optional author profile image URL'),
  })
  .describe('Expert quote with author attribution and optional image');

// Component Props Schemas
export const featureGridPropsSchema = z
  .object({
    features: z
      .array(featureSchema.describe('Individual feature in grid'))
      .max(20)
      .default([])
      .describe('List of features to display'),
    title: shortString.default('Key Features').describe('Grid section title'),
    description: componentDescriptionString.describe('Grid section description'),
    columns: z
      .union([z.literal(2), z.literal(3), z.literal(4)])
      .default(2)
      .describe('Number of columns in feature grid layout'),
  })
  .describe('Feature grid component displaying features in responsive columns');

export const accordionPropsSchema = z
  .object({
    items: z
      .array(accordionItemSchema.describe('Individual accordion item'))
      .max(20)
      .default([])
      .describe('List of accordion items'),
    title: shortString.optional().describe('Optional accordion section title'),
    description: componentDescriptionString.describe('Accordion section description'),
    allowMultiple: z
      .boolean()
      .default(false)
      .describe('Allow multiple accordion items open simultaneously'),
  })
  .describe('Accordion component with collapsible items');

export const stepGuidePropsSchema = z
  .object({
    steps: z
      .array(guideStepSchema.describe('Individual guide step'))
      .max(20)
      .default([])
      .describe('List of guide steps'),
    title: shortString.default('Step-by-Step Guide').describe('Guide section title'),
    description: componentDescriptionString.describe('Guide section description'),
    totalTime: componentTimeString.describe('Total estimated time for all steps'),
  })
  .describe('Step-by-step guide component with timing information');

const codeGroupPropsSchema = z
  .object({
    examples: z
      .array(codeExampleSchema.describe('Individual code example'))
      .max(10)
      .default([])
      .describe('List of code examples in different languages'),
    title: shortString.optional().describe('Optional code group title'),
    description: componentDescriptionString.describe('Code group description'),
  })
  .describe('Code group component showing multiple language examples');

export const comparisonTablePropsSchema = z
  .object({
    title: shortString.optional().describe('Optional comparison table title'),
    description: componentDescriptionString.describe('Table description explaining comparison'),
    headers: z
      .array(componentValueString.describe('Column header text'))
      .max(10)
      .default([])
      .describe('Column headers for comparison options'),
    items: z
      .array(comparisonItemSchema.describe('Individual comparison row'))
      .max(50)
      .default([])
      .describe('Comparison table rows'),
  })
  .describe('Comparison table showing features across multiple options');

export const contentTabsPropsSchema = z
  .object({
    items: z
      .array(tabItemSchema.describe('Individual tab'))
      .max(10)
      .default([])
      .describe('List of tab items'),
    title: shortString.optional().describe('Optional tabs section title'),
    description: componentDescriptionString.describe('Tabs section description'),
    defaultValue: componentValueString.optional().describe('Default active tab value'),
  })
  .describe('Tabbed content component for organizing information');

export const quickReferencePropsSchema = z
  .object({
    title: shortString.describe('Quick reference section title'),
    description: componentDescriptionString.describe('Quick reference section description'),
    items: z
      .array(quickReferenceItemSchema.describe('Individual reference entry'))
      .max(50)
      .default([])
      .describe('List of quick reference items'),
    columns: z
      .union([z.literal(1), z.literal(2)])
      .default(1)
      .describe('Number of columns in reference layout'),
  })
  .describe('Quick reference component for displaying key-value pairs');

// FAQ Component Schemas
const faqItemSchema = z
  .object({
    question: mediumString.describe('FAQ question text'),
    answer: extraLongString.describe('Detailed answer to the question'),
    category: shortString.optional().describe('Optional category for grouping FAQs'),
  })
  .describe('Individual FAQ item with question and answer');

export const faqPropsSchema = z
  .object({
    questions: z
      .array(faqItemSchema.describe('Individual FAQ entry'))
      .max(50)
      .default([])
      .describe('List of FAQ items'),
    title: shortString.default('Frequently Asked Questions').describe('FAQ section title'),
    description: componentDescriptionString.describe('FAQ section description'),
  })
  .describe('FAQ component displaying questions and answers');

// Metrics Component Schemas
const metricDataSchema = z
  .object({
    label: shortString.optional().describe('Metric label or name'),
    value: componentValueString.describe('Current metric value'),
    change: shortString.optional().describe('Change amount or percentage'),
    trend: z.enum(['up', 'down', 'neutral', '+']).optional().describe('Trend direction indicator'),
    // Support legacy healthcare guide format
    metric: shortString.optional().describe('Legacy: alternative metric name field'),
    before: componentValueString.optional().describe('Legacy: metric value before improvement'),
    after: componentValueString.optional().describe('Legacy: metric value after improvement'),
    improvement: componentValueString
      .optional()
      .describe('Legacy: improvement percentage or amount'),
    description: mediumString.optional().describe('Optional metric description'),
  })
  .describe('Individual metric data with value, trend, and legacy format support');

export const metricsDisplayPropsSchema = z
  .object({
    title: shortString.optional().describe('Optional metrics section title'),
    metrics: z
      .array(metricDataSchema.describe('Individual metric'))
      .max(20)
      .default([])
      .describe('List of metrics to display'),
    description: mediumString.optional().describe('Optional metrics section description'),
  })
  .describe('Metrics display component showing performance or business metrics');

// Checklist Component Schemas
const checklistItemSchema = z
  .object({
    task: componentTitleString.describe('Task title or description'),
    description: mediumString.optional().describe('Optional detailed task description'),
    completed: z.boolean().default(false).describe('Whether task is completed'),
    priority: z
      .enum(['critical', 'high', 'medium', 'low'])
      .optional()
      .describe('Task priority level for sorting or highlighting'),
  })
  .describe('Individual checklist item with task, status, and priority');

export const checklistPropsSchema = z
  .object({
    title: shortString.optional().describe('Optional checklist section title'),
    items: z
      .array(checklistItemSchema.describe('Individual checklist task'))
      .min(1)
      .max(50)
      .describe('List of checklist items'),
    description: componentDescriptionString.describe('Checklist section description'),
    type: z
      .enum(['prerequisites', 'security', 'testing'])
      .default('prerequisites')
      .describe('Checklist type for styling and semantic meaning'),
  })
  .describe('Checklist component for task tracking and prerequisites');

// CaseStudy Component Schemas
const caseStudyMetricSchema = z
  .object({
    label: shortString.describe('Metric label or name'),
    value: componentValueString.describe('Metric value or result'),
    trend: z
      .enum(['up', 'down', 'neutral', '+'])
      .optional()
      .describe('Trend direction for the metric'),
  })
  .describe('Case study metric showing business impact or results');

const caseStudyTestimonialSchema = z
  .object({
    quote: codeString.describe('Testimonial quote text'),
    author: shortString.describe('Testimonial author name'),
    role: shortString.optional().describe('Author job title or role'),
  })
  .describe('Customer testimonial for case study');

export const caseStudyPropsSchema = z
  .object({
    company: shortString.describe('Company or client name'),
    industry: shortString.optional().describe('Industry or business sector'),
    challenge: longString.describe('Business challenge or problem faced'),
    solution: longString.describe('Solution implemented to address challenge'),
    results: longString.describe('Results and outcomes achieved'),
    metrics: z
      .array(caseStudyMetricSchema.describe('Individual result metric'))
      .max(10)
      .optional()
      .describe('Optional quantitative metrics showing impact'),
    testimonial: caseStudyTestimonialSchema.optional().describe('Optional customer testimonial'),
    logo: z.string().max(200).optional().describe('Optional company logo URL'),
  })
  .describe('Case study component showcasing customer success story');

// Type exports for all UI components
export type Feature = z.infer<typeof featureSchema>;
export type AccordionItem = z.infer<typeof accordionItemSchema>;
export type CalloutProps = z.infer<typeof calloutPropsSchema>;
export type TLDRSummaryProps = z.infer<typeof tldrSummaryPropsSchema>;
export type GuideStep = z.infer<typeof guideStepSchema>;
export type CodeExample = z.infer<typeof codeExampleSchema>;
export type ComparisonItem = z.infer<typeof comparisonItemSchema>;
export type TabItem = z.infer<typeof tabItemSchema>;
export type QuickReferenceItem = z.infer<typeof quickReferenceItemSchema>;
export type ExpertQuoteProps = z.infer<typeof expertQuotePropsSchema>;
export type FeatureGridProps = z.infer<typeof featureGridPropsSchema>;
export type AccordionProps = z.infer<typeof accordionPropsSchema>;
export type StepByStepGuideProps = z.infer<typeof stepGuidePropsSchema>;
export type CodeGroupProps = z.infer<typeof codeGroupPropsSchema>;
export type ComparisonTableProps = z.infer<typeof comparisonTablePropsSchema>;
export type ContentTabsProps = z.infer<typeof contentTabsPropsSchema>;
export type QuickReferenceProps = z.infer<typeof quickReferencePropsSchema>;
export type FAQItem = z.infer<typeof faqItemSchema>;
export type FAQProps = z.infer<typeof faqPropsSchema>;
export type MetricData = z.infer<typeof metricDataSchema>;
export type MetricsDisplayProps = z.infer<typeof metricsDisplayPropsSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type ChecklistProps = z.infer<typeof checklistPropsSchema>;
export type CaseStudyMetric = z.infer<typeof caseStudyMetricSchema>;
export type CaseStudyTestimonial = z.infer<typeof caseStudyTestimonialSchema>;
export type CaseStudyProps = z.infer<typeof caseStudyPropsSchema>;

// ErrorTable Component Schemas
export const errorItemSchema = z
  .object({
    code: componentValueString.describe('Error code or identifier'),
    message: componentTitleString.describe('Error message description'),
    solution: mediumString.describe('Solution or fix for the error'),
    severity: z
      .enum(['critical', 'warning', 'info'])
      .default('info')
      .describe('Error severity level for visual styling'),
  })
  .describe('Individual error entry with code, message, and solution');

export const errorTablePropsSchema = z
  .object({
    title: shortString.default('Common Errors & Solutions').describe('Error table section title'),
    errors: z
      .array(errorItemSchema.describe('Individual error entry'))
      .min(1)
      .max(50)
      .describe('List of errors and solutions'),
    description: componentDescriptionString.describe('Error table section description'),
  })
  .describe('Error table component displaying common errors and their solutions');

export type ErrorItem = z.infer<typeof errorItemSchema>;
export type ErrorTableProps = z.infer<typeof errorTablePropsSchema>;

// DiagnosticFlow Component Schemas
export const diagnosticStepSchema = z
  .object({
    question: componentTitleString.describe('Diagnostic question to ask user'),
    yesPath: componentTitleString.optional().describe('Next step or instruction if answer is yes'),
    noPath: componentTitleString.optional().describe('Next step or instruction if answer is no'),
    solution: mediumString.optional().describe('Final solution if this is a terminal step'),
  })
  .describe('Individual diagnostic step in troubleshooting flowchart');

export const diagnosticFlowPropsSchema = z
  .object({
    title: shortString.default('Diagnostic Flow').describe('Diagnostic flow section title'),
    steps: z
      .array(diagnosticStepSchema.describe('Individual diagnostic step'))
      .max(20)
      .default([])
      .describe('List of diagnostic steps in flowchart'),
    description: componentDescriptionString.describe('Diagnostic flow section description'),
  })
  .describe('Diagnostic flowchart component for troubleshooting guidance');

export type DiagnosticStep = z.infer<typeof diagnosticStepSchema>;
export type DiagnosticFlowProps = z.infer<typeof diagnosticFlowPropsSchema>;

// InfoBox Component Schemas
export const infoBoxPropsSchema = z
  .object({
    title: shortString.optional().describe('Optional info box title'),
    children: z.any().describe('Info box content (React.ReactNode)'),
    variant: z
      .enum(['default', 'important', 'success', 'warning', 'info'])
      .default('default')
      .describe('Visual variant for styling and semantic meaning'),
  })
  .describe('Info box component for displaying highlighted information');

export type InfoBoxProps = z.infer<typeof infoBoxPropsSchema>;
