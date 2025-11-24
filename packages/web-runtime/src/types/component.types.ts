/**
 * Component Types - Consolidated Component Props and Types
 *
 * This file contains ALL component types, props, and related TypeScript definitions.
 * Database types are in @heyclaude/database-types (generated).
 */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import type { SearchResult } from '../edge/search-client.ts';
import type { LucideIcon } from '../icons.tsx';
import type { ReactNode } from 'react';
import type {
  TabConfig,
  UnifiedCategoryConfig,
} from '../types/category.ts';

// Re-export category types
export type {
  TabConfig,
  UnifiedCategoryConfig,
  SectionId,
  CategoryStatsConfig
} from '../types/category.ts';

/**
 * ContentItem - Base content item type derived from content table
 * Uses generated types directly from @heyclaude/database-types
 */
export type ContentItem = Database['public']['Tables']['content']['Row'];

// ============================================================================
// Core Content Types
// ============================================================================

/**
 * Copy Type - type of content being copied
 * Uses generated enum directly from @heyclaude/database-types
 */
export type CopyType = Database['public']['Enums']['copy_type'];

/**
 * HomepageContentItem - Simplified content item for homepage display
 * Component/application type used for UI rendering (not a database type)
 */
export type HomepageContentItem = {
  slug: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  source: string;
  created_at: string;
  date_added: string;
  category: Database['public']['Enums']['content_category'];
  view_count: number;
  copy_count: number;
  featured: boolean;
};

export type DisplayableContent =
  | ContentItem
  | SearchResult
  | Database['public']['CompositeTypes']['enriched_content_item']
  | Database['public']['CompositeTypes']['related_content_item']
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
export interface SearchFilterOptions {
  tags: string[];
  authors: string[];
  categories: Database['public']['Enums']['content_category'][];
}

export interface HomePageClientProps {
  /** Initial server-side data for client hydration (from get_homepage_complete RPC) */
  initialData: Record<string, unknown[]>;
  /** Weekly featured content grouped by category */
  featuredByCategory?: Record<string, unknown[]>;
  /** Content category statistics */
  stats?: Record<string, { total: number; featured: number }>;
  /** Featured jobs from database (includes placeholders if no real jobs) */
  featuredJobs?: Array<unknown>;
  /** Precomputed search filter options (tags/authors/categories) */
  searchFilters?: SearchFilterOptions;
  /** Start of the current content week (ISO string) */
  weekStart?: string;
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
/**
 * JobCardJobType - Job type for job cards (subset of full job table)
 * Used when displaying jobs from RPC returns that don't include all fields
 */
export type JobCardJobType = {
  id: string;
  slug: string;
  title: string;
  company: string;
  company_logo: string | null;
  location: string | null;
  description: string | null;
  salary: string | null;
  remote: boolean;
  type: Database['public']['Enums']['job_type'] | null;
  workplace: Database['public']['Enums']['workplace_type'];
  experience: Database['public']['Enums']['experience_level'];
  category: Database['public']['Enums']['job_category'] | null;
  tags: string[];
  plan: Database['public']['Enums']['job_plan'];
  tier: Database['public']['Enums']['job_tier'] | null;
  posted_at: string;
  expires_at: string;
  view_count: number;
  click_count: number;
  link: string | null;
};

export interface JobCardProps {
  job: Database['public']['Tables']['jobs']['Row'] | JobCardJobType;
}

export interface FilterState {
  sort?: Database['public']['Enums']['sort_option'];
  category?: Database['public']['Enums']['content_category'];
  author?: string;
  dateRange?: string;
  popularity?: [number, number];
  tags?: string[];
}

export interface SavedSearchPreset {
  id: string;
  label: string;
  query: string;
  filters: FilterState;
  createdAt: number;
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
  /**
   * Optional saved search presets rendered next to the search controls.
   */
  savedSearches?: SavedSearchPreset[];
  /**
   * Triggered when a preset is selected.
   */
  onSelectSavedSearch?: (presetId: string) => void;
  /**
   * Triggered when a preset removal action is requested.
   */
  onRemoveSavedSearch?: (presetId: string) => void;
  /**
   * Handler invoked when the user clicks "Save current filters".
   */
  onSavePresetRequest?: () => void;
  /**
   * When true, disables the save action (e.g., when limit reached).
   */
  isPresetSaveDisabled?: boolean;
}

export interface TrendingContentProps {
  trending?: DisplayableContent[];
  popular?: DisplayableContent[];
  recent?: DisplayableContent[];
  category?: Database['public']['Enums']['content_category'];
  limit?: number;
  period?: Database['public']['Enums']['trending_period'];
}

export type ContentListServerProps<
  T extends DisplayableContent = Database['public']['CompositeTypes']['enriched_content_item'],
> = {
  title: string;
  description: string;
  icon: string;
  items: T[];
  type: string;
  searchPlaceholder?: string;
  badges?: Array<{ icon?: string; text: string }>;
  category?: Database['public']['Enums']['content_category'];
  featured?: boolean;
  gridCols?: string;
};

export type RelatedConfigsProps<T extends ContentItem = ContentItem> = {
  items: T[];
  category?: Database['public']['Enums']['content_category'];
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
  category?: Database['public']['Enums']['content_category'];
  availableTags?: string[];
  availableAuthors?: string[];
  availableCategories?: string[];
  zeroStateSuggestions?: T[];
  /**
   * Optional quick filter data derived server-side for zero-state UI.
   * Falls back to facet-derived values when omitted.
   */
  quickTags?: string[];
  quickAuthors?: string[];
  quickCategories?: Database['public']['Enums']['content_category'][];
  /**
   * Suggested fallback content for empty states, typically from homepage data.
   * Defaults to zeroStateSuggestions/items when not provided.
   */
  fallbackSuggestions?: T[];
};

export type ContentSidebarProps<T extends ContentItem = ContentItem> = {
  content: T[];
  category?: Database['public']['Enums']['content_category'];
};

export type SortDropdownProps = {
  value?: Database['public']['Enums']['sort_option'];
  onChange?: (value: Database['public']['Enums']['sort_option']) => void;
};

export interface SearchOptions {
  query?: string;
  category?: Database['public']['Enums']['content_category'];
  sort?: Database['public']['Enums']['sort_option'];
  limit?: number;
  offset?: number;
}

export interface UseSearchProps {
  initialQuery?: string;
  initialCategory?: Database['public']['Enums']['content_category'];
  debounceMs?: number;
}

// ============================================================================
// Review Component Types
// ============================================================================

/**
 * Props for review form variant
 */
export interface ReviewFormProps {
  variant: 'form';
  contentType: Database['public']['Enums']['content_category'];
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
  contentType: Database['public']['Enums']['content_category'];
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

// ============================================================================
// Button Component Types
// ============================================================================

export interface ButtonStyleProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  disabled?: boolean;
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
  mcpb?: {
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

// Local type definitions for form field types

export type FieldType = Database['public']['Enums']['form_field_type'];
export type GridColumn = Database['public']['Enums']['form_grid_column'];
export type IconPosition = Database['public']['Enums']['form_icon_position'];

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
export type SubmissionContentType = Database['public']['Enums']['submission_type'];

/**
 * Submission content types array (for runtime use, e.g., form dropdowns)
 * Uses enum values directly from @heyclaude/database-types Constants
 */
export const SUBMISSION_CONTENT_TYPES = Constants.public.Enums.submission_type;

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

// Re-exported from ../types/category.ts at the top

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
        mcpb?: {
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
 * So we narrow the type to exclude jobs to ensure proper type safety.
 */
export interface TabbedDetailLayoutProps {
  item:
    | Database['public']['Tables']['content']['Row']
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        Database['public']['Tables']['content']['Row']);
  config: UnifiedCategoryConfig<Database['public']['Enums']['content_category']>;
  tabs: ReadonlyArray<TabConfig>;
  sectionData: ProcessedSectionData;
  relatedItems?:
    | ContentItem[]
    | Database['public']['Functions']['get_content_detail_complete']['Returns']['related'];
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
  category?: Database['public']['Enums']['content_category'];
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
    mcpb?: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
    } | null;
    requirements?: string[];
  };
  item:
    | ContentItem
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        ContentItem);
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
