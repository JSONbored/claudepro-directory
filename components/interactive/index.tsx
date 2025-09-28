/**
 * Interactive Components - Extracted from ai-optimized-components.tsx
 * UI interaction components for content organization and display
 */

// Re-export types from shared schema
export type {
  ChecklistItem,
  ChecklistProps,
  ContentTabsProps,
  ExpertQuoteProps,
  QuickReferenceItem,
  QuickReferenceProps,
  TabItem,
} from '@/lib/schemas/shared.schema';
export { Checklist } from './checklist';
export { ContentTabs } from './content-tabs';
export { ExpertQuote } from './expert-quote';
export { QuickReference } from './quick-reference';
