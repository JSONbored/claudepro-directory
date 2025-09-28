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

// Subset schema for core content only (used in various places)
export const coreContentCategorySchema = z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks']);

// Subset schema for SEO content types
export const seoContentCategorySchema = z.enum([
  'guides',
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
  'categories',
  'collections',
]);

// Subset schema for cacheable categories (used by Redis caching)
export const cacheableCategorySchema = z.enum([
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'guides',
  'jobs',
  // Note: SEO content doesn't need Redis caching
]);

export type ContentCategory = z.infer<typeof contentCategorySchema>;

/**
 * Content Types
 * Used across: middleware, static-api
 */
export const appContentTypeSchema = z.enum(['agent', 'mcp', 'hook', 'command', 'rule', 'job']);

export type AppContentType = z.infer<typeof appContentTypeSchema>;

/**
 * Pagination Parameters
 * Used across: api, search schemas
 */
export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).optional(),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

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
 * Popular Item
 * Used across: cache-warmer, related-content
 */
export const popularItemSchema = z.object({
  slug: z.string(),
  score: z.number(),
  category: contentCategorySchema,
  lastUpdated: z.string().datetime(),
});

export type PopularItem = z.infer<typeof popularItemSchema>;

/**
 * Trending Item
 * Used across: cache, related-content
 */
export const trendingItemSchema = z.object({
  slug: z.string(),
  category: contentCategorySchema,
  score: z.number(),
  viewCount: z.number(),
  lastViewed: z.string().datetime(),
  trend: z.enum(['rising', 'stable', 'falling']).optional(),
});

export type TrendingItem = z.infer<typeof trendingItemSchema>;

/**
 * Performance Metrics
 * Used across: analytics, related-content
 */
export const performanceMetricsSchema = z.object({
  loadTime: z.number().min(0),
  renderTime: z.number().min(0),
  interactionTime: z.number().min(0).optional(),
  totalTime: z.number().min(0),
  resourceCount: z.number().int().min(0).optional(),
  errorCount: z.number().int().min(0).default(0),
});

export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>;

/**
 * Base Content Metadata
 * Shared structure for content metadata across the application
 */
export const baseContentMetadataSchema = z.object({
  slug: z.string().min(1),
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  category: contentCategorySchema.optional(),
  author: z.string().optional(),
  popularity: z.number().min(0).max(100).optional(),
  dateAdded: z.string().optional(),
  lastModified: z.string().optional(),
});

export type BaseContentMetadata = z.infer<typeof baseContentMetadataSchema>;

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
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? Number.parseInt(val, 10) : val))
    .default(800),
  height: z
    .union([z.number(), z.string()])
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
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  badge: z.string().max(50).optional(),
});

export const accordionItemSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.custom<React.ReactNode>(),
  defaultOpen: z.boolean().default(false),
});

export const calloutPropsSchema = z.object({
  type: z.enum(['info', 'warning', 'success', 'error', 'tip']).default('info'),
  title: z.string().max(100).optional(),
  children: z.custom<React.ReactNode>(),
});

export const tldrSummaryPropsSchema = z
  .object({
    content: z.string().min(1).max(1000).optional(),
    keyPoints: z.array(z.string().min(1).max(200)).max(10).optional(),
    title: z.string().max(50).default('TL;DR'),
  })
  .transform((data) => ({
    content: data.content || '',
    keyPoints: data.keyPoints,
    title: data.title,
  }));

// Template Components
export const guideStepSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000).optional(),
  content: z.any().optional(), // React.ReactNode for complex content
  code: z.string().max(10000).optional(),
  tip: z.string().max(500).optional(),
  time: z.string().max(20).optional(),
  defaultOpen: z.boolean().optional(),
});

export const codeExampleSchema = z.object({
  language: z.string().min(1).max(50),
  filename: z.string().max(100).optional(),
  code: z.string().min(1).max(50000),
});

export const comparisonItemSchema = z.object({
  feature: z.string().min(1).max(100),
  option1: z.union([z.string().max(200), z.boolean()]),
  option2: z.union([z.string().max(200), z.boolean()]),
  option3: z.union([z.string().max(200), z.boolean()]).optional(),
  winner: z.string().max(50).optional(),
});

// Interactive Components
export const tabItemSchema = z.object({
  label: z.string().min(1).max(50),
  value: z.string().min(1).max(50),
  content: z.custom<React.ReactNode>(),
});

export const quickReferenceItemSchema = z
  .object({
    label: z.string().min(1).max(100).optional(),
    value: z.string().min(1).max(500).optional(),
    description: z.string().max(300).optional(),
  })
  .transform((data) => ({
    label: data.label || '',
    value: data.value || '',
    description: data.description,
  }));

/**
 * Search Document Schema
 * For content transformation and search indexing
 */
export const searchDocumentSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  content: z.string().max(50000),
  category: z.string().max(50),
  tags: z.array(z.string().max(50)),
  type: z.enum(['agent', 'mcp', 'command', 'hook', 'rule']),
  url: z.string().max(500),
  score: z.number().min(0).max(100).optional(),
});

export type SearchDocument = z.infer<typeof searchDocumentSchema>;

/**
 * Social Share Data Schema
 * For social media sharing metadata
 */
export const socialShareDataSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  url: z.string().url().max(500),
  hashtags: z.array(z.string().max(50)),
});

export type SocialShareData = z.infer<typeof socialShareDataSchema>;

export const expertQuotePropsSchema = z.object({
  quote: z.string().min(10).max(1000),
  author: z.string().min(1).max(100),
  role: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  imageUrl: z.string().url().optional(),
});

// Component Props Schemas
export const featureGridPropsSchema = z.object({
  features: z.array(featureSchema).max(20).default([]),
  title: z.string().max(100).default('Key Features'),
  description: z.string().max(300).optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
});

export const accordionPropsSchema = z.object({
  items: z.array(accordionItemSchema).max(20).default([]),
  title: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  allowMultiple: z.boolean().default(false),
});

export const stepGuidePropsSchema = z.object({
  steps: z.array(guideStepSchema).max(20).default([]),
  title: z.string().max(100).default('Step-by-Step Guide'),
  description: z.string().max(300).optional(),
  totalTime: z.string().max(20).optional(),
});

export const codeGroupPropsSchema = z.object({
  examples: z.array(codeExampleSchema).max(10).default([]),
  title: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
});

export const comparisonTablePropsSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  headers: z.array(z.string().max(50)).max(10).default([]),
  items: z.array(comparisonItemSchema).max(50).default([]),
});

export const contentTabsPropsSchema = z.object({
  items: z.array(tabItemSchema).max(10).default([]),
  title: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  defaultValue: z.string().max(50).optional(),
});

export const quickReferencePropsSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  items: z.array(quickReferenceItemSchema).max(50).default([]),
  columns: z.union([z.literal(1), z.literal(2)]).default(1),
});

// FAQ Component Schemas
export const faqItemSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  category: z.string().max(100).optional(),
});

export const faqPropsSchema = z.object({
  questions: z.array(faqItemSchema).max(50).default([]),
  title: z.string().max(100).default('Frequently Asked Questions'),
  description: z.string().max(300).optional(),
});

// Metrics Component Schemas
export const metricDataSchema = z.object({
  label: z.string().max(100).optional(),
  value: z.string().min(1).max(50),
  change: z.string().max(100).optional(),
  trend: z.enum(['up', 'down', 'neutral', '+']).optional(),
  // Support legacy healthcare guide format
  metric: z.string().max(100).optional(),
  before: z.string().max(50).optional(),
  after: z.string().max(50).optional(),
  improvement: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

export const metricsDisplayPropsSchema = z.object({
  title: z.string().max(100).optional(),
  metrics: z.array(metricDataSchema).max(20).default([]),
  description: z.string().max(500).optional(),
});

// Checklist Component Schemas
export const checklistItemSchema = z.object({
  task: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
});

export const checklistPropsSchema = z.object({
  title: z.string().max(100).optional(),
  items: z.array(checklistItemSchema).min(1).max(50),
  description: z.string().max(300).optional(),
  type: z.enum(['prerequisites', 'security', 'testing']).default('prerequisites'),
});

// CaseStudy Component Schemas
export const caseStudyMetricSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(50),
  trend: z.enum(['up', 'down', 'neutral', '+']).optional(),
});

export const caseStudyTestimonialSchema = z.object({
  quote: z.string().min(10).max(1000),
  author: z.string().min(1).max(100),
  role: z.string().max(100).optional(),
});

export const caseStudyPropsSchema = z.object({
  company: z.string().min(1).max(100),
  industry: z.string().max(100).optional(),
  challenge: z.string().min(10).max(2000),
  solution: z.string().min(10).max(2000),
  results: z.string().min(10).max(2000),
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
  code: z.string().min(1).max(50),
  message: z.string().min(1).max(200),
  solution: z.string().min(1).max(500),
  severity: z.enum(['critical', 'warning', 'info']).default('info'),
});

export const errorTablePropsSchema = z.object({
  title: z.string().max(100).default('Common Errors & Solutions'),
  errors: z.array(errorItemSchema).min(1).max(50),
  description: z.string().max(300).optional(),
});

export type ErrorItem = z.infer<typeof errorItemSchema>;
export type ErrorTableProps = z.infer<typeof errorTablePropsSchema>;

// DiagnosticFlow Component Schemas
export const diagnosticStepSchema = z.object({
  question: z.string().min(1).max(200),
  yesPath: z.string().max(200).optional(),
  noPath: z.string().max(200).optional(),
  solution: z.string().max(500).optional(),
});

export const diagnosticFlowPropsSchema = z.object({
  title: z.string().max(100).default('Diagnostic Flow'),
  steps: z.array(diagnosticStepSchema).max(20).default([]),
  description: z.string().max(300).optional(),
});

export type DiagnosticStep = z.infer<typeof diagnosticStepSchema>;
export type DiagnosticFlowProps = z.infer<typeof diagnosticFlowPropsSchema>;

// InfoBox Component Schemas
export const infoBoxPropsSchema = z.object({
  title: z.string().max(100).optional(),
  children: z.any(), // React.ReactNode can't be validated by Zod, so we use any
  variant: z.enum(['default', 'important', 'success', 'warning', 'info']).default('default'),
});

export type InfoBoxProps = z.infer<typeof infoBoxPropsSchema>;
