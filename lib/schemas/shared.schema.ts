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
import { imageDimension } from '@/lib/schemas/primitives/base-numbers';
import {
  codeString,
  extraLongString,
  longString,
  mediumString,
  optionalUrlString,
  shortString,
  ultraLongString,
  veryLongCodeString,
} from '@/lib/schemas/primitives/base-strings';
import {
  componentDescriptionString,
  componentLabelString,
  componentTimeString,
  componentTitleString,
  componentValueString,
} from '@/lib/schemas/primitives/ui-component-primitives';

/**
 * Content Categories
 * Used across: analytics, content, content-generation, related-content, static-api
 */
// Main comprehensive schema - single source of truth for ALL content categories
export const contentCategorySchema = z.enum([
  // Core content types (have dedicated directories in /content)
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',

  // SEO content types (in /seo directory)
  'guides',
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
  'categories',
  'collections',

  // Special types
  'jobs', // Has route but no content directory
]);

// Subset schema for cacheable categories (used by Redis caching)
export const cacheableCategorySchema = z.enum([
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'guides',
  'jobs',
  // Note: SEO content doesn't need Redis caching
]);

export type ContentCategory = z.infer<typeof contentCategorySchema>;

/**
 * Content Types
 * Used across: middleware, static-api
 */
export const appContentTypeSchema = z.enum([
  'agent',
  'mcp',
  'hook',
  'command',
  'rule',
  'statusline',
  'job',
]);

export type AppContentType = z.infer<typeof appContentTypeSchema>;

/**
 * Rate Limit Configuration
 * Used across: api, middleware
 */
export const rateLimitConfigSchema = z.object({
  maxRequests: z.number().int().positive(),
  windowMs: z.number().int().positive(),
  message: z.string().optional(),
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

/**
 * MDX Component Props
 * Used for type-safe MDX component props
 */
export const mdxBasePropsSchema = z.object({
  className: z.string().default(''),
  style: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  'data-testid': z.string().optional(),
  'aria-label': z.string().optional(),
  'aria-labelledby': z.string().optional(),
  'aria-describedby': z.string().optional(),
  role: z.string().optional(),
  tabIndex: z.number().optional(),
});

export const mdxHeadingPropsSchema = mdxBasePropsSchema.extend({
  id: z.string().optional(),
  children: z.custom<React.ReactNode>(),
});

export const mdxElementPropsSchema = mdxBasePropsSchema.extend({
  children: z.custom<React.ReactNode>(),
});

export const mdxLinkPropsSchema = mdxBasePropsSchema.extend({
  href: z.string(),
  children: z.custom<React.ReactNode>(),
  target: z.string().optional(),
  rel: z.string().optional(),
});

export const mdxImagePropsSchema = mdxBasePropsSchema.extend({
  src: z.string(),
  alt: z.string(),
  width: z
    .union([imageDimension, z.string()])
    .transform((val) => (typeof val === 'string' ? Number.parseInt(val, 10) : val))
    .default(800),
  height: z
    .union([imageDimension, z.string()])
    .transform((val) => (typeof val === 'string' ? Number.parseInt(val, 10) : val))
    .default(600),
});

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
export const featureSchema = z.object({
  title: shortString,
  description: mediumString,
  badge: componentValueString.optional(),
});

export const accordionItemSchema = z.object({
  title: componentTitleString,
  content: z.custom<React.ReactNode>(),
  defaultOpen: z.boolean().default(false),
});

export const calloutPropsSchema = z.object({
  type: z.enum(['info', 'warning', 'success', 'error', 'tip']).default('info'),
  title: shortString.optional(),
  children: z.custom<React.ReactNode>(),
});

export const tldrSummaryPropsSchema = z
  .object({
    content: codeString.optional(),
    keyPoints: z.array(componentTitleString).max(10).optional(),
    title: componentValueString.default('TL;DR'),
  })
  .transform((data) => ({
    content: data.content || '',
    keyPoints: data.keyPoints,
    title: data.title,
  }));

// Template Components
export const guideStepSchema = z.object({
  title: shortString,
  description: longString.optional(),
  content: z.any().optional(), // React.ReactNode for complex content
  code: veryLongCodeString.optional(),
  tip: mediumString.optional(),
  time: componentTimeString,
  defaultOpen: z.boolean().optional(),
});

export const codeExampleSchema = z.object({
  language: componentLabelString,
  filename: shortString.optional(),
  code: ultraLongString,
});

export const comparisonItemSchema = z.object({
  feature: shortString,
  option1: z.union([componentTitleString, z.boolean()]),
  option2: z.union([componentTitleString, z.boolean()]),
  option3: z.union([componentTitleString, z.boolean()]).optional(),
  winner: componentValueString.optional(),
});

// Interactive Components
export const tabItemSchema = z.object({
  label: componentLabelString,
  value: componentLabelString,
  content: z.custom<React.ReactNode>(),
});

export const quickReferenceItemSchema = z
  .object({
    label: shortString.optional(),
    value: mediumString.optional(),
    description: componentDescriptionString,
  })
  .transform((data) => ({
    label: data.label || '',
    value: data.value || '',
    description: data.description,
  }));

export const expertQuotePropsSchema = z.object({
  quote: codeString,
  author: shortString,
  role: shortString.optional(),
  company: shortString.optional(),
  imageUrl: optionalUrlString,
});

// Component Props Schemas
export const featureGridPropsSchema = z.object({
  features: z.array(featureSchema).max(20).default([]),
  title: shortString.default('Key Features'),
  description: componentDescriptionString,
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
});

export const accordionPropsSchema = z.object({
  items: z.array(accordionItemSchema).max(20).default([]),
  title: shortString.optional(),
  description: componentDescriptionString,
  allowMultiple: z.boolean().default(false),
});

export const stepGuidePropsSchema = z.object({
  steps: z.array(guideStepSchema).max(20).default([]),
  title: shortString.default('Step-by-Step Guide'),
  description: componentDescriptionString,
  totalTime: componentTimeString,
});

export const codeGroupPropsSchema = z.object({
  examples: z.array(codeExampleSchema).max(10).default([]),
  title: shortString.optional(),
  description: componentDescriptionString,
});

export const comparisonTablePropsSchema = z.object({
  title: shortString.optional(),
  description: componentDescriptionString,
  headers: z.array(componentValueString).max(10).default([]),
  items: z.array(comparisonItemSchema).max(50).default([]),
});

export const contentTabsPropsSchema = z.object({
  items: z.array(tabItemSchema).max(10).default([]),
  title: shortString.optional(),
  description: componentDescriptionString,
  defaultValue: componentValueString.optional(),
});

export const quickReferencePropsSchema = z.object({
  title: shortString,
  description: componentDescriptionString,
  items: z.array(quickReferenceItemSchema).max(50).default([]),
  columns: z.union([z.literal(1), z.literal(2)]).default(1),
});

// FAQ Component Schemas
export const faqItemSchema = z.object({
  question: mediumString,
  answer: extraLongString,
  category: shortString.optional(),
});

export const faqPropsSchema = z.object({
  questions: z.array(faqItemSchema).max(50).default([]),
  title: shortString.default('Frequently Asked Questions'),
  description: componentDescriptionString,
});

// Metrics Component Schemas
export const metricDataSchema = z.object({
  label: shortString.optional(),
  value: componentValueString,
  change: shortString.optional(),
  trend: z.enum(['up', 'down', 'neutral', '+']).optional(),
  // Support legacy healthcare guide format
  metric: shortString.optional(),
  before: componentValueString.optional(),
  after: componentValueString.optional(),
  improvement: componentValueString.optional(),
  description: mediumString.optional(),
});

export const metricsDisplayPropsSchema = z.object({
  title: shortString.optional(),
  metrics: z.array(metricDataSchema).max(20).default([]),
  description: mediumString.optional(),
});

// Checklist Component Schemas
export const checklistItemSchema = z.object({
  task: componentTitleString,
  description: mediumString.optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
});

export const checklistPropsSchema = z.object({
  title: shortString.optional(),
  items: z.array(checklistItemSchema).min(1).max(50),
  description: componentDescriptionString,
  type: z.enum(['prerequisites', 'security', 'testing']).default('prerequisites'),
});

// CaseStudy Component Schemas
export const caseStudyMetricSchema = z.object({
  label: shortString,
  value: componentValueString,
  trend: z.enum(['up', 'down', 'neutral', '+']).optional(),
});

export const caseStudyTestimonialSchema = z.object({
  quote: codeString,
  author: shortString,
  role: shortString.optional(),
});

export const caseStudyPropsSchema = z.object({
  company: shortString,
  industry: shortString.optional(),
  challenge: longString,
  solution: longString,
  results: longString,
  metrics: z.array(caseStudyMetricSchema).max(10).optional(),
  testimonial: caseStudyTestimonialSchema.optional(),
  logo: z.string().max(200).optional(),
});

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
export const errorItemSchema = z.object({
  code: componentValueString,
  message: componentTitleString,
  solution: mediumString,
  severity: z.enum(['critical', 'warning', 'info']).default('info'),
});

export const errorTablePropsSchema = z.object({
  title: shortString.default('Common Errors & Solutions'),
  errors: z.array(errorItemSchema).min(1).max(50),
  description: componentDescriptionString,
});

export type ErrorItem = z.infer<typeof errorItemSchema>;
export type ErrorTableProps = z.infer<typeof errorTablePropsSchema>;

// DiagnosticFlow Component Schemas
export const diagnosticStepSchema = z.object({
  question: componentTitleString,
  yesPath: componentTitleString.optional(),
  noPath: componentTitleString.optional(),
  solution: mediumString.optional(),
});

export const diagnosticFlowPropsSchema = z.object({
  title: shortString.default('Diagnostic Flow'),
  steps: z.array(diagnosticStepSchema).max(20).default([]),
  description: componentDescriptionString,
});

export type DiagnosticStep = z.infer<typeof diagnosticStepSchema>;
export type DiagnosticFlowProps = z.infer<typeof diagnosticFlowPropsSchema>;

// InfoBox Component Schemas
export const infoBoxPropsSchema = z.object({
  title: shortString.optional(),
  children: z.any(), // React.ReactNode can't be validated by Zod, so we use any
  variant: z.enum(['default', 'important', 'success', 'warning', 'info']).default('default'),
});

export type InfoBoxProps = z.infer<typeof infoBoxPropsSchema>;
