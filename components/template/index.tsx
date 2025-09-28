/**
 * Template Components - Extracted from ai-optimized-components.tsx
 * Specialized components for tutorials, comparisons, and workflows
 */

// Re-export types from shared schema
export type {
  CodeExample,
  CodeGroupProps,
  ComparisonItem,
  ComparisonTableProps,
  GuideStep,
  StepByStepGuideProps,
} from '@/lib/schemas/shared.schema';
export { CodeGroup } from './code-group';
export { ComparisonTable } from './comparison-table';
export { StepByStepGuide } from './step-guide';
