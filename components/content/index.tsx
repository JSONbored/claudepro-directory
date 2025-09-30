/**
 * Content Components - Extracted from ai-optimized-components.tsx
 * Core reusable components for MDX content rendering
 */

// Re-export types from shared schema
export type {
  AccordionItem,
  AccordionProps,
  CalloutProps,
  CaseStudyMetric,
  CaseStudyProps,
  CaseStudyTestimonial,
  FAQItem,
  FAQProps,
  Feature,
  FeatureGridProps,
  InfoBoxProps,
  TLDRSummaryProps,
} from '@/lib/schemas';
export { Accordion } from './accordion';
export { Callout } from './callout';
export { CaseStudy } from './case-study';
export { AIOptimizedFAQ } from './faq';
export { FeatureGrid } from './feature-grid';
export { InfoBox } from './info-box';
export { TLDRSummary } from './tldr-summary';
