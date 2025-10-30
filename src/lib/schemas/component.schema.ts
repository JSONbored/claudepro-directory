/**
 * Component Props - React component prop types and UI component schemas
 */

import { z } from 'zod';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import {
  codeString,
  componentDescriptionString,
  componentLabelString,
  componentTimeString,
  componentTitleString,
  componentValueString,
  extraLongString,
  longString,
  mediumString,
  optionalUrlString,
  shortString,
  ultraLongString,
  veryLongCodeString,
} from '@/src/lib/schemas/primitives';
import type { Database } from '@/src/types/database.types';
import type { HomePageClientProps } from './components/page-props.schema';
import type { SortOption } from './content-filter.schema';
import type { CategoryId } from './shared.schema';

export interface ConfigCardProps {
  item: ContentItem;
  variant?: 'default' | 'detailed';
  showCategory?: boolean;
  showActions?: boolean;
  className?: string;
  renderSponsoredWrapper?: (
    children: React.ReactNode,
    sponsoredId: string,
    targetUrl: string,
    position?: number
  ) => React.ReactNode;
  enableSwipeGestures?: boolean;
  useViewTransitions?: boolean;
  showBorderBeam?: boolean;
}

export type { HomePageClientProps, ContentItem };

export interface ContentListWithLoadMoreProps {
  items: ContentItem[];
  initialCount?: number;
  loadMoreCount?: number;
  gridCols?: string;
}

export interface ContentViewerProps {
  content: string;
  language?: string;
  maxHeight?: number;
  className?: string;
}

export interface EnhancedGuidesPageProps {
  guides: Record<string, import('@/src/lib/utils/content.utils').GuideItemWithCategory[]>;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export interface JobCardProps {
  job: Database['public']['Tables']['jobs']['Row'];
}

export interface FilterState {
  sort?: string;
  category?: string;
  author?: string;
  dateRange?: string;
  popularity?: [number, number];
  tags?: string[];
}

export interface UnifiedSearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFiltersChange: (filters: FilterState) => void;
  filters: FilterState;
  availableTags?: string[];
  availableAuthors?: string[];
  availableCategories?: string[];
  resultCount?: number;
  className?: string;
}

export interface TrendingContentProps {
  trending: any[];
  popular: any[];
  recent: any[];
}

export type ContentListServerProps<T extends ContentItem = ContentItem> = {
  title: string;
  description: string;
  icon: string;
  items: readonly T[] | T[];
  type: CategoryId;
  searchPlaceholder?: string;
  badges?: Array<{
    icon?: string | React.ComponentType<{ className?: string }>;
    text: string;
  }>;
};

export type RelatedConfigsProps<T extends ContentItem = ContentItem> = {
  configs: T[];
  title?: string;
  type?: CategoryId;
};

export type FloatingSearchSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  items: ContentItem[];
  onItemSelect: (item: ContentItem) => void;
  placeholder?: string;
};

export type ContentSearchClientProps<T extends ContentItem = ContentItem> = {
  items: readonly T[] | T[];
  type: CategoryId;
  searchPlaceholder: string;
  title: string;
  icon: string;
};

export type ContentSidebarProps<T extends ContentItem = ContentItem> = {
  item: T;
  relatedItems: T[];
  type: CategoryId;
  typeName: string;
};

export type SortDropdownProps = {
  sortBy: SortOption;
  sortDirection: import('./content-filter.schema').SortDirection;
  onSortChange: (
    option: SortOption,
    direction?: import('./content-filter.schema').SortDirection
  ) => void;
};

export interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
}

export interface UseSearchProps {
  data: ContentItem[];
  searchOptions?: SearchOptions;
  initialQuery?: string;
}

/**
 * UI Component Schemas - Zod validation for ai-optimized-components
 */

const featureSchema = z
  .object({
    title: shortString,
    description: mediumString,
    badge: componentValueString.optional(),
  })
  .describe('Feature item');

const accordionItemSchema = z
  .object({
    title: componentTitleString,
    content: z.custom<React.ReactNode>(),
    defaultOpen: z.boolean().default(false),
  })
  .describe('Accordion item');

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

const guideStepSchema = z.object({
  title: shortString,
  description: longString.optional(),
  content: z.any().optional(),
  code: veryLongCodeString.optional(),
  tip: mediumString.optional(),
  time: componentTimeString,
  defaultOpen: z.boolean().optional(),
});

const codeExampleSchema = z.object({
  language: componentLabelString,
  filename: shortString.optional(),
  code: ultraLongString,
});

const comparisonItemSchema = z.object({
  feature: shortString,
  option1: z.union([componentTitleString, z.boolean()]),
  option2: z.union([componentTitleString, z.boolean()]),
  option3: z.union([componentTitleString, z.boolean()]).optional(),
  winner: componentValueString.optional(),
});

const tabItemSchema = z.object({
  label: componentLabelString,
  value: componentLabelString,
  content: z.custom<React.ReactNode>(),
});

const quickReferenceItemSchema = z
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

const codeGroupPropsSchema = z.object({
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

const faqItemSchema = z.object({
  question: mediumString,
  answer: extraLongString,
  category: shortString.optional(),
});

export const faqPropsSchema = z.object({
  questions: z.array(faqItemSchema).max(50).default([]),
  title: shortString.default('Frequently Asked Questions'),
  description: componentDescriptionString,
});

const metricDataSchema = z.object({
  label: shortString.optional(),
  value: componentValueString,
  change: shortString.optional(),
  trend: z.enum(['up', 'down', 'neutral', '+']).optional(),
  description: mediumString.optional(),
});

export const metricsDisplayPropsSchema = z.object({
  title: shortString.optional(),
  metrics: z.array(metricDataSchema).max(20).default([]),
  description: mediumString.optional(),
});

const checklistItemSchema = z.object({
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

const caseStudyMetricSchema = z.object({
  label: shortString,
  value: componentValueString,
  trend: z.enum(['up', 'down', 'neutral', '+']).optional(),
});

const caseStudyTestimonialSchema = z.object({
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

export const infoBoxPropsSchema = z.object({
  title: shortString.optional(),
  children: z.any(),
  variant: z.enum(['default', 'important', 'success', 'warning', 'info']).default('default'),
});

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
export type ErrorItem = z.infer<typeof errorItemSchema>;
export type ErrorTableProps = z.infer<typeof errorTablePropsSchema>;
export type DiagnosticStep = z.infer<typeof diagnosticStepSchema>;
export type DiagnosticFlowProps = z.infer<typeof diagnosticFlowPropsSchema>;
export type InfoBoxProps = z.infer<typeof infoBoxPropsSchema>;
