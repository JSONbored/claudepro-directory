/**
 * Component Props - TypeScript types only (database validates data)
 * Database function validate_content_metadata() enforces all validation rules
 */

import type { CategoryId } from '@/src/lib/data/config/category';
import type { ContentItem } from '@/src/lib/data/content';
import type { SearchResult } from '@/src/lib/edge/search-client';
import type {
  ContentCategory,
  GetEnrichedContentListReturn,
  HomepageContentItem,
  SortOption,
  Tables,
} from '@/src/types/database-overrides';
import type { HomePageClientProps } from './page-props.types';

export type EnrichedContentItem = GetEnrichedContentListReturn[number];
export type DisplayableContent =
  | ContentItem
  | SearchResult
  | EnrichedContentItem
  | HomepageContentItem;

export interface ConfigCardProps {
  item: DisplayableContent;
  variant?: 'default' | 'detailed';
  showCategory?: boolean;
  showActions?: boolean;
  className?: string;
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

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export interface JobCardProps {
  job: Tables<'jobs'>;
}

export interface FilterState {
  sort?: SortOption;
  category?: ContentCategory;
  author?: string;
  dateRange?: string;
  popularity?: [number, number];
  tags?: string[];
}

export interface UnifiedSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFiltersChange?: (filters: FilterState) => void;
  filters?: FilterState;
  availableTags?: string[];
  availableAuthors?: string[];
  availableCategories?: string[];
  resultCount?: number;
  className?: string;
}

export interface TrendingContentProps {
  trending?: DisplayableContent[];
  popular?: DisplayableContent[];
  recent?: DisplayableContent[];
  category?: CategoryId;
  limit?: number;
  period?: 'day' | 'week' | 'month' | 'all';
}

export type ContentListServerProps<T extends DisplayableContent = EnrichedContentItem> = {
  title: string;
  description: string;
  icon: string;
  items: T[];
  type: string;
  searchPlaceholder?: string;
  badges?: Array<{ icon?: string; text: string }>;
  category?: CategoryId;
  featured?: boolean;
  gridCols?: string;
};

export type RelatedConfigsProps<T extends ContentItem = ContentItem> = {
  items: T[];
  category?: CategoryId;
};

export type FloatingSearchSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
};

export type ContentSearchClientProps<T extends DisplayableContent = DisplayableContent> = {
  items: T[];
  searchPlaceholder?: string;
  title: string;
  icon: string;
  type?: string;
  category?: string;
};

export type ContentSidebarProps<T extends ContentItem = ContentItem> = {
  content: T[];
  category?: CategoryId;
};

export type SortDropdownProps = {
  value?: SortOption;
  onChange?: (value: SortOption) => void;
};

export interface SearchOptions {
  query?: string;
  category?: CategoryId;
  sort?: SortOption;
  limit?: number;
  offset?: number;
}

export interface UseSearchProps {
  initialQuery?: string;
  initialCategory?: CategoryId;
  debounceMs?: number;
}

// Component metadata types (database validates structure via validate_content_metadata())
export type Feature = {
  icon?: string | undefined;
  badge?: string | undefined;
  title: string;
  description: string;
};
export type AccordionItem = { title: string; content: React.ReactNode; defaultOpen?: boolean };
export type CalloutProps = {
  type: 'info' | 'warning' | 'success' | 'error' | 'tip';
  title?: string | undefined;
  children: React.ReactNode;
};
export type TLDRSummaryProps = {
  content?: string | undefined;
  keyPoints?: string[] | undefined;
  title?: string | undefined;
};
export type GuideStep = {
  title: string;
  description?: string;
  content?: unknown;
  code?: string;
  tip?: string;
  time: string;
  defaultOpen?: boolean;
};
export type CodeExample = { language: string; filename?: string; code: string };
export type ComparisonItem = {
  feature: string;
  option1: string | boolean;
  option2: string | boolean;
  option3?: string | boolean | undefined;
  winner?: string | undefined;
};
export type TabItem = { label: string; value: string; content: React.ReactNode };
export type QuickReferenceItem = { label?: string; value?: string; description: string };
export type ExpertQuoteProps = {
  quote: string;
  author: string;
  role?: string | null | undefined;
  company?: string | null | undefined;
  imageUrl?: string | null | undefined;
};
export type FeatureGridProps = {
  features: Feature[];
  title?: string;
  description?: string;
  columns?: 2 | 3 | 4;
};
export type AccordionProps = {
  items: AccordionItem[];
  title?: string;
  description?: string;
  allowMultiple?: boolean;
};
export type StepByStepGuideProps = {
  steps: GuideStep[];
  title?: string;
  description?: string;
  totalTime?: string;
};
export type ComparisonTableProps = {
  headers: string[];
  rows?: ComparisonItem[] | undefined;
  items?:
    | Array<{ feature: string; option1: string; option2: string; option3?: string | undefined }>
    | undefined;
  title?: string | undefined;
  description?: string | undefined;
};
export type ContentTabsProps = {
  tabs?: TabItem[];
  items?: Array<{ label: string; value: string; content: React.ReactNode }>;
  title?: string;
  description?: string;
  defaultValue?: string;
};
export type QuickReferenceProps = {
  items?: QuickReferenceItem[] | undefined;
  title?: string;
  description?: string;
  columns?: 2 | 3 | 4;
};
export type FAQProps = {
  items?: { question: string; answer: string }[];
  questions?: { question: string; answer: string; category?: string }[];
  title?: string;
  description?: string;
};
export type MetricsDisplayProps = {
  metrics: Array<{ label: string; value: string; change?: string; trend?: string }>;
  title?: string;
  description?: string;
};
export type ChecklistProps = {
  items: Array<{
    task: string;
    description?: string | undefined;
    priority?: 'critical' | 'high' | 'medium' | 'low' | undefined;
    completed?: boolean | undefined;
  }>;
  title?: string | undefined;
  description?: string | undefined;
  type: 'prerequisites' | 'security' | 'testing';
};
export type CaseStudyProps = {
  title?: string;
  description?: string;
  challenge: string;
  solution: string;
  results: string[];
  company?: string;
  industry?: string;
  metrics?: Array<{ label: string; value: string; change?: string; trend?: string }>;
  testimonial?: { quote: string; author: string; role?: string };
  logo?: string;
};
export type ErrorItem = {
  code: string;
  message: string;
  cause: string;
  solution: string;
  severity?: 'critical' | 'warning' | 'info';
};
export type ErrorTableProps = { errors: ErrorItem[]; title?: string; description?: string };
export type DiagnosticStep = {
  step?: string;
  check?: string;
  action?: string;
  success?: boolean;
  question?: string;
  solution?: string;
  yesPath?: string;
  noPath?: string;
};
export type DiagnosticFlowProps = { steps: DiagnosticStep[]; title?: string; description?: string };
export type InfoBoxProps = {
  type?: 'info' | 'warning' | 'success' | 'error';
  variant?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  content?: string;
  children?: React.ReactNode;
};
