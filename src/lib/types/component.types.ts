/**
 * Component Types - Consolidated Component Props and Types
 *
 * This file contains ALL component types, props, and related TypeScript definitions.
 * Database types are in database.types.ts (generated) and database-overrides.ts (manual).
 *
 * Structure:
 * - Core Content Types
 * - Page/Component Props
 * - Detail/Content Display Types
 * - Unified Section Types
 * - FAB (Floating Action Bar) Types
 * - Search & Filter Types
 * - Content Metadata Types
 */

import type { ReactNode } from 'react';
import type { SearchResult } from '@/src/lib/edge/search-client';
import type { LucideIcon, LucideIcon as LucideIconType } from '@/src/lib/icons';
import type {
  ContentCategory,
  ContentItem,
  EnrichedContentItem,
  FormFieldType,
  FormGridColumn,
  FormIconPosition,
  GetGetContentDetailCompleteReturn,
  GetGetHomepageCompleteReturn,
  HomepageContentItem,
  JobCardJobType,
  SortOption,
  SubmissionType,
  Tables,
  TrendingPeriod,
} from '@/src/types/database-overrides';

// ============================================================================
// Core Content Types
// ============================================================================

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
  /** Optional search query for highlighting search terms in title/description */
  searchQuery?: string;
}

// ============================================================================
// Page/Component Props
// ============================================================================

/**
 * Client component props for home page - Database-First
 * Uses proper RPC return types from get_homepage_complete()
 */
export interface HomePageClientProps {
  /** Initial server-side data for client hydration (from get_homepage_complete RPC) */
  initialData: GetGetHomepageCompleteReturn['content']['categoryData'];
  /** Weekly featured content grouped by category */
  featuredByCategory?: GetGetHomepageCompleteReturn['content']['categoryData'];
  /** Content category statistics */
  stats?: GetGetHomepageCompleteReturn['content']['stats'];
  /** Featured jobs from database (includes placeholders if no real jobs) */
  featuredJobs?: GetGetHomepageCompleteReturn['featured_jobs'];
}

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

/**
 * Job card props - accepts either full job row or subset from RPC returns
 * The RPC get_company_profile returns a subset of job fields, so we need
 * to support both the full type and the subset type.
 */
export interface JobCardProps {
  job: Tables<'jobs'> | JobCardJobType;
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
  category?: ContentCategory;
  limit?: number;
  period?: TrendingPeriod;
}

export type ContentListServerProps<T extends DisplayableContent = EnrichedContentItem> = {
  title: string;
  description: string;
  icon: string;
  items: T[];
  type: string;
  searchPlaceholder?: string;
  badges?: Array<{ icon?: string; text: string }>;
  category?: ContentCategory;
  featured?: boolean;
  gridCols?: string;
};

export type RelatedConfigsProps<T extends ContentItem = ContentItem> = {
  items: T[];
  category?: ContentCategory;
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
  category?: ContentCategory;
};

export type SortDropdownProps = {
  value?: SortOption;
  onChange?: (value: SortOption) => void;
};

export interface SearchOptions {
  query?: string;
  category?: ContentCategory;
  sort?: SortOption;
  limit?: number;
  offset?: number;
}

export interface UseSearchProps {
  initialQuery?: string;
  initialCategory?: ContentCategory;
  debounceMs?: number;
}

// ============================================================================
// Review Component Types
// ============================================================================

export type { ReviewItem } from '@/src/types/database-overrides';

/**
 * Props for review form variant
 */
export interface ReviewFormProps {
  variant: 'form';
  contentType: ContentCategory;
  contentSlug: string;
  existingReview?: {
    id: string;
    rating: number;
    review_text: string | null;
  };
  onSuccess?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
}

/**
 * Props for review section variant
 */
export interface ReviewSectionProps {
  variant: 'section';
  contentType: ContentCategory;
  contentSlug: string;
  currentUserId?: string | undefined;
}

/**
 * Props for review histogram variant
 */
export interface ReviewHistogramProps {
  variant: 'histogram';
  distribution: Record<string, number>;
  totalReviews: number;
  averageRating: number;
}

/**
 * Props for interactive rating variant
 */
export interface ReviewRatingInteractiveProps {
  variant: 'rating-interactive';
  value: number;
  max?: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
}

/**
 * Props for compact rating display variant
 */
export interface ReviewRatingCompactProps {
  variant: 'rating-compact';
  average: number;
  count: number;
  size?: 'sm' | 'md';
}

/**
 * Discriminated Union for Review Components
 */
export type ReviewProps =
  | ReviewFormProps
  | ReviewSectionProps
  | ReviewHistogramProps
  | ReviewRatingInteractiveProps
  | ReviewRatingCompactProps;

/**
 * Maximum review text length (loaded from Dynamic Config)
 * This is a runtime value that gets initialized from Statsig on module load.
 */
export let MAX_REVIEW_LENGTH = 2000;

// Initialize from Statsig (async, but we have a default value)
// Note: This runs on module load, so the value may be 2000 initially
// and update once Statsig config is loaded
if (typeof window !== 'undefined') {
  // Client-side only - avoid importing server-side code
  import('@/src/lib/actions/feature-flags.actions')
    .then(({ getFormConfig }) => getFormConfig({}))
    .then((result) => {
      if (result?.data) {
        MAX_REVIEW_LENGTH = result.data['form.max_review_length'];
      }
    })
    .catch(() => {
      // Silently fail - use default value
    });
}

// ============================================================================
// Button Component Types
// ============================================================================

export interface ButtonStyleProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  disabled?: boolean;
}

export interface AsyncActionHelpers {
  setLoading: (loading: boolean) => void;
  setSuccess: (success: boolean) => void;
  showError: (message: string, description?: string) => void;
  showSuccess: (message: string, description?: string) => void;
  logError: (message: string, error: Error, context?: Record<string, unknown>) => void;
}

// ============================================================================
// Form Component Types
// ============================================================================

/**
 * Installation steps structure for content detail pages
 */
export interface InstallationSteps {
  claudeCode?: {
    steps?: string[];
    configPath?: Record<string, string>;
    configFormat?: string;
  };
  claudeDesktop?: {
    steps?: string[];
    configPath?: Record<string, string>;
  };
  sdk?: {
    steps?: string[];
  };
  requirements?: string[];
}

/**
 * Action button configuration for content detail pages
 */
export interface ActionButtonConfig {
  label: string;
  icon: React.ReactNode;
  handler: (item: ContentItem) => void | Promise<void>;
}

export type FieldType = FormFieldType;
export type GridColumn = FormGridColumn;
export type IconPosition = FormIconPosition;

export interface SelectOption {
  value: string;
  label: string;
}

interface BaseFieldDefinition {
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  gridColumn?: GridColumn;
  iconName?: string;
  iconPosition?: IconPosition;
}

export interface TextFieldDefinition extends BaseFieldDefinition {
  type: 'text';
  defaultValue?: string;
}

export interface TextareaFieldDefinition extends BaseFieldDefinition {
  type: 'textarea';
  rows?: number;
  monospace?: boolean;
  defaultValue?: string;
}

export interface NumberFieldDefinition extends BaseFieldDefinition {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number | string;
}

export interface SelectFieldDefinition extends BaseFieldDefinition {
  type: 'select';
  options: SelectOption[];
  defaultValue?: string;
}

export type FieldDefinition =
  | TextFieldDefinition
  | TextareaFieldDefinition
  | NumberFieldDefinition
  | SelectFieldDefinition;

/**
 * Form field renderer configuration
 * Used by ContentTypeFieldRenderer to render form fields
 */
export interface FormFieldConfig {
  fields: FieldDefinition[];
}

/**
 * Submission content type - extracted from database enum
 * Use this type for type-safe submission content categories
 */
export type SubmissionContentType = SubmissionType;

/**
 * Submission content types array (for runtime use, e.g., form dropdowns)
 * TypeScript will validate that all values match the database enum
 */
export const SUBMISSION_CONTENT_TYPES: readonly SubmissionType[] = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
] as const;

export interface SubmissionFormSection {
  nameField: TextFieldDefinition | null;
  common: FieldDefinition[];
  typeSpecific: FieldDefinition[];
  tags: FieldDefinition[];
}

export type SubmissionFormConfig = Record<SubmissionContentType, SubmissionFormSection>;

// ============================================================================
// Category Configuration Types
// ============================================================================

/**
 * Section identifier for content detail pages
 */
export type SectionId =
  | 'description'
  | 'features'
  | 'requirements'
  | 'use_cases'
  | 'installation'
  | 'configuration'
  | 'examples'
  | 'troubleshooting'
  | 'security'
  | 'reviews'
  | 'related'
  | 'collection_items'
  | 'guide_sections';

/**
 * Tab configuration for detail pages
 */
export interface TabConfig {
  readonly id: string;
  readonly label: string;
  readonly mobileLabel?: string;
  readonly icon?: LucideIconType;
  readonly sections: ReadonlyArray<SectionId>;
  readonly lazy?: boolean;
  readonly order: number;
}

export interface UnifiedCategoryConfig<TId extends string = string> {
  readonly id: TId;
  title: string;
  pluralTitle: string;
  description: string;
  icon: LucideIconType;
  colorScheme: string;
  showOnHomepage: boolean;
  keywords: string;
  metaDescription: string;
  readonly typeName: string;
  readonly generateFullContent: boolean;
  readonly metadataFields: ReadonlyArray<string>;
  readonly buildConfig: {
    readonly batchSize: number;
    readonly enableCache: boolean;
    readonly cacheTTL: number;
  };
  readonly apiConfig: {
    readonly generateStaticAPI: boolean;
    readonly includeTrending: boolean;
    readonly maxItemsPerResponse: number;
  };
  listPage: {
    searchPlaceholder: string;
    badges: Array<{ icon?: string; text: string | ((count: number) => string) }>;
    emptyStateMessage?: string;
  };
  detailPage: {
    displayConfig: boolean;
    configFormat: 'json' | 'multi' | 'hook';
    tabs?: ReadonlyArray<TabConfig>;
  };
  sections: {
    features: boolean;
    installation: boolean;
    use_cases: boolean;
    configuration: boolean;
    security: boolean;
    troubleshooting: boolean;
    examples: boolean;
  };
  metadata?: {
    categoryLabel?: string;
    showGitHubLink?: boolean;
    githubPathPrefix?: string;
  };
  primaryAction: {
    label: string;
    type: string;
  };
  secondaryActions?: Array<{
    label: string;
    type: string;
  }>;
  urlSlug: string;
  contentLoader: string;
  [key: string]: unknown;
}

export interface CategoryStatsConfig {
  categoryId: ContentCategory;
  icon: LucideIconType;
  displayText: string;
  delay: number;
}

// ============================================================================
// Content Metadata Types
// ============================================================================
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

// ============================================================================
// Detail/Content Display Types
// ============================================================================

/**
 * Pre-processed section data passed from server component
 */
export interface ProcessedSectionData {
  // Content/Code section data
  contentData?: {
    html: string;
    code: string;
    language: string;
    filename: string;
  } | null;

  // Configuration section data
  configData?:
    | {
        format: 'json';
        html: string;
        code: string;
        filename: string;
      }
    | {
        format: 'multi';
        configs: Array<{ key: string; html: string; code: string; filename: string }>;
      }
    | {
        format: 'hook';
        hookConfig: { html: string; code: string; filename: string } | null;
        scriptContent: { html: string; code: string; filename: string } | null;
      }
    | null;

  // Installation section data
  installationData?:
    | {
        claudeCode: {
          steps: Array<
            { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
          >;
          configPath?: Record<string, string>;
          configFormat?: string;
        } | null;
        claudeDesktop: {
          steps: Array<
            { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
          >;
          configPath?: Record<string, string>;
        } | null;
        sdk: {
          steps: Array<
            { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
          >;
        } | null;
        requirements?: string[];
      }
    | null
    | undefined;

  // Examples section data
  examplesData?: Array<{
    title: string;
    description?: string;
    html: string;
    code: string;
    language: string;
    filename: string;
  }> | null;

  // Simple array data
  features?: string[];
  useCases?: string[];
  requirements?: string[];
  troubleshooting?: Array<string | { issue: string; solution: string }>;

  // Special content types
  guideSections?: Array<Record<string, unknown> & { html?: string }> | null;
  collectionSections?: ReactNode;
}

/**
 * Props for TabbedDetailLayout component
 *
 * Note: TabbedDetailLayout is only used for content detail pages, never for jobs.
 * So we narrow the type to exclude Tables<'jobs'> to ensure proper type safety.
 */
export interface TabbedDetailLayoutProps {
  item: Tables<'content'> | GetGetContentDetailCompleteReturn['content'];
  config: UnifiedCategoryConfig<ContentCategory>;
  tabs: ReadonlyArray<TabConfig>;
  sectionData: ProcessedSectionData;
  relatedItems?: ContentItem[] | GetGetContentDetailCompleteReturn['related'];
}

// ============================================================================
// Unified Section Types
// ============================================================================

type BaseProps = { className?: string };

export type ListProps = BaseProps & {
  variant: 'list';
  title: string;
  description: string;
  items: string[];
  category?: ContentCategory;
  icon?: LucideIcon;
  dotColor?: string;
};

export type EnhancedListProps = BaseProps & {
  variant: 'enhanced-list';
  title: string;
  description?: string;
  items: Array<string | { issue: string; solution: string }>;
  icon?: LucideIcon;
  dotColor?: string;
};

export type CodeProps = BaseProps & {
  variant: 'code';
  title: string;
  description?: string;
  html: string;
  code: string;
  language: string;
  filename: string;
  icon?: LucideIcon;
};

export type ExamplesProps = BaseProps & {
  variant: 'examples';
  examples: Array<{
    title: string;
    description?: string;
    html: string;
    code: string;
    language: string;
    filename: string;
  }>;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  maxLines?: number;
  showLineNumbers?: boolean;
};

export type ConfigProps = BaseProps &
  (
    | {
        variant: 'configuration';
        format: 'json';
        html: string;
        code: string;
        filename: string;
      }
    | {
        variant: 'configuration';
        format: 'multi';
        configs: Array<{ key: string; html: string; code: string; filename: string }>;
      }
    | {
        variant: 'configuration';
        format: 'hook';
        hookConfig: { html: string; code: string; filename: string } | null;
        scriptContent: { html: string; code: string; filename: string } | null;
      }
  );

export type InstallProps = BaseProps & {
  variant: 'installation';
  installationData: {
    claudeCode?: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
      configPath?: Record<string, string>;
    } | null;
    claudeDesktop?: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
      configPath?: Record<string, string>;
    } | null;
    sdk?: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
    } | null;
    requirements?: string[];
  };
  item: ContentItem | GetGetContentDetailCompleteReturn['content'];
};

export type UnifiedSectionProps =
  | ListProps
  | EnhancedListProps
  | CodeProps
  | ExamplesProps
  | ConfigProps
  | InstallProps;

// ============================================================================
// FAB (Floating Action Bar) Types
// ============================================================================

/**
 * Individual speed dial action
 */
export interface SpeedDialAction {
  /** Unique identifier */
  id: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Accessible label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional badge count (e.g., notifications) */
  badge?: number;
  /** Show on mobile only */
  mobileOnly?: boolean;
  /** Show on desktop only */
  desktopOnly?: boolean;
  /** Conditional visibility */
  show?: boolean;
}

/**
 * Main FAB configuration
 */
export interface MainFABConfig {
  /** Icon for main FAB */
  icon: LucideIcon;
  /** Accessible label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Badge count (optional) */
  badge?: number;
}

/**
 * Scroll behavior state
 */
export interface ScrollState {
  /** Current scroll position */
  scrollY: number;
  /** Is scrolling down */
  isScrollingDown: boolean;
  /** Is past visibility threshold */
  isPastThreshold: boolean;
  /** Should FAB be visible */
  isVisible: boolean;
}
