/**
 * Component prop schemas for React components
 * Provides type-safe validation for component props
 *
 * CLEANED UP VERSION - most schemas moved to /components/ module
 */

import { z } from 'zod';

// Import new component schemas
import {
  type AgentDetailPageProps,
  agentDetailPagePropsSchema,
  type CommandDetailPageProps,
  type ConfigCardProps,
  type ContentCategory,
  commandDetailPagePropsSchema,
  configCardPropsSchema,
  contentCategorySchema,
  type HomePageClientProps,
  type HookDetailPageProps,
  homePageClientPropsSchema,
  hookDetailPagePropsSchema,
  type McpDetailPageProps,
  mcpDetailPagePropsSchema,
  type RuleDetailPageProps,
  reactNodeSchema,
  ruleDetailPagePropsSchema,
  type UnifiedContentItem,
  unifiedContentItemSchema,
} from './components';

// ContentListWithLoadMore component props
export interface ContentListWithLoadMoreProps {
  items: UnifiedContentItem[];
  initialCount?: number;
  loadMoreCount?: number;
  gridCols?: string;
}

// ContentViewer component props
export interface ContentViewerProps {
  content: string;
  language?: string;
  maxHeight?: number;
  className?: string;
}

// EnhancedGuidesPage component props
export interface EnhancedGuidesPageProps {
  guides: Record<string, import('@/lib/components/guide-page-factory').GuideItemWithCategory[]>;
}

// ErrorBoundary component props
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// GuidesSidebar component props
export interface GuidesSidebarProps {
  currentCategory?: string;
  guideCounts?: Record<string, number>;
  showSearch?: boolean;
}

// JobCard component props
export interface JobCardProps {
  job: import('@/lib/schemas/content.schema').JobContent;
}

// UnifiedSearch component props
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

// TrendingContent component props
export interface TrendingContentProps {
  trending: UnifiedContentItem[];
  popular: UnifiedContentItem[];
  recent: UnifiedContentItem[];
}

// Import filter and search schemas
import type { FilterOptions, SortDirection, SortOption } from './content-filter.schema';
import type { FuseSearchableItem } from './search.schema';

// Import shared schemas for backward compatibility
import type { FAQItem } from './shared.schema';

// Define ContentMetadata type for backward compatibility
export type ContentMetadata = UnifiedContentItem;

// Re-export for backward compatibility
export type SearchableItem = FuseSearchableItem;
export type { FilterOptions, SortDirection, SortOption };
export type { FAQItem };

// Re-export ContentCategory from components
export { contentCategorySchema };
export type { ContentCategory };

// Re-export the unified schemas
export { unifiedContentItemSchema, type UnifiedContentItem };

// Re-export detail page schemas
export {
  agentDetailPagePropsSchema,
  mcpDetailPagePropsSchema as MCPDetailPagePropsSchema,
  mcpDetailPagePropsSchema,
  ruleDetailPagePropsSchema,
  commandDetailPagePropsSchema,
  hookDetailPagePropsSchema,
  type AgentDetailPageProps,
  type McpDetailPageProps,
  type McpDetailPageProps as MCPDetailPageProps,
  type RuleDetailPageProps,
  type CommandDetailPageProps,
  type HookDetailPageProps,
};

// Re-export UI component schemas
export {
  configCardPropsSchema,
  type ConfigCardProps,
  homePageClientPropsSchema,
  type HomePageClientProps,
};

/**
 * Production-grade React type schemas
 */
// Re-export ReactNode schema from components
export { reactNodeSchema };

// Function schema for React event handlers
export const reactEventHandlerSchema = z.function();

// React Component Schema (for components that need to be instantiated, not ReactNode)
export const reactComponentSchema = z.custom<React.ComponentType>(
  (val) => {
    return typeof val === 'function';
  },
  {
    message: 'Expected a React component',
  }
);

/**
 * View tracker props (kept here as it's specific to tracking functionality)
 */
export const viewTrackerPropsSchema = z.object({
  category: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides']),
  slug: z.string().min(1).max(200),
});

export type ViewTrackerProps = z.infer<typeof viewTrackerPropsSchema>;

/**
 * Content list server props (legacy compatibility)
 */
export type ContentListServerProps<T extends ContentMetadata = ContentMetadata> = {
  title: string;
  description: string;
  icon: string;
  items: readonly T[] | T[];
  type: 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'guides';
  searchPlaceholder?: string;
  badges?: Array<{
    icon?: string | React.ComponentType<{ className?: string }>;
    text: string;
  }>;
};

/**
 * Search bar props (legacy compatibility)
 */
export type SearchBarProps<T extends ContentMetadata = ContentMetadata> = {
  items: T[];
  placeholder?: string;
  onSearch?: (query: string, results: T[]) => void;
  className?: string;
};

/**
 * Related configs props (legacy compatibility)
 */
export type RelatedConfigsProps<T extends ContentMetadata = ContentMetadata> = {
  configs: T[];
  title?: string;
  type?: 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks' | 'guides';
};

/**
 * Floating search sidebar props (legacy compatibility)
 */
export type FloatingSearchSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  items: ContentMetadata[];
  onItemSelect: (item: ContentMetadata) => void;
  placeholder?: string;
};

/**
 * Content search client props (legacy compatibility)
 */
export type ContentSearchClientProps<T extends ContentMetadata = ContentMetadata> = {
  items: readonly T[] | T[];
  type: 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'guides';
  searchPlaceholder: string;
  title: string;
  icon: string;
};

/**
 * Content detail page props (legacy compatibility)
 */
export type ContentDetailPageProps<T extends ContentMetadata = ContentMetadata> = {
  item: T | null;
  type: ContentCategory;
  typeName: string;
  relatedItems?: T[];
  customSections?: React.ReactNode;
};

/**
 * Content sidebar props (legacy compatibility)
 */
export type ContentSidebarProps<T extends ContentMetadata = ContentMetadata> = {
  item: T;
  relatedItems: T[];
  type: ContentCategory;
  typeName: string;
};

/**
 * Sort dropdown props (legacy compatibility)
 */
export type SortDropdownProps = {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (option: SortOption, direction?: SortDirection) => void;
};

/**
 * Content loader state (legacy compatibility)
 */
export type ContentLoaderState<T extends ContentMetadata = ContentMetadata> = {
  data: T | null;
  relatedItems: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Paginated content loader state (legacy compatibility)
 */
export type PaginatedContentLoaderState<T extends ContentMetadata = ContentMetadata> = {
  items: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  page: number;
};

/**
 * Search bar generic props (legacy compatibility)
 */
export type SearchBarGenericProps<T extends FuseSearchableItem = FuseSearchableItem> = {
  data: T[];
  onFilteredResults: (results: T[]) => void;
  onSearchQueryChange?: (query: string) => void;
  placeholder?: string;
};

/**
 * Missing schema exports for backward compatibility
 */

// Action button schema for detail pages
export const actionButtonSchema = z.object({
  label: z.string().min(1).max(50),
  icon: reactNodeSchema.optional(),
  onClick: reactEventHandlerSchema,
  variant: z.enum(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']).optional(),
  disabled: z.boolean().optional(),
});

export type ActionButton = z.infer<typeof actionButtonSchema>;

// Custom section schema for detail pages
export const customSectionSchema = z.object({
  title: z.string().min(1).max(100),
  icon: reactNodeSchema.optional(),
  content: reactNodeSchema,
  collapsible: z.boolean().default(false),
  defaultCollapsed: z.boolean().default(false),
});

export type CustomSection = z.infer<typeof customSectionSchema>;

// Base detail page props schema
export const baseDetailPagePropsSchema = z.object({
  item: unifiedContentItemSchema,
  relatedItems: z.array(unifiedContentItemSchema).optional(),
  typeName: z.string().min(1).max(50),
  primaryAction: actionButtonSchema.optional(),
  secondaryActions: z.array(actionButtonSchema).default([]),
  customSections: z.array(customSectionSchema).default([]),
  showMetadata: z.boolean().default(true),
  showRelated: z.boolean().default(true),
  showActions: z.boolean().default(true),
  showConfiguration: z.boolean().default(false),
  showInstallation: z.boolean().default(false),
  showUseCases: z.boolean().default(false),
  showRequirements: z.boolean().default(false),
  showTags: z.boolean().default(true),
  showRelatedItems: z.boolean().default(true),
  enableCopyContent: z.boolean().default(true),
  enableShareButton: z.boolean().default(true),
  installationContent: reactNodeSchema.optional(),
  useCasesContent: reactNodeSchema.optional(),
  configurationContent: reactNodeSchema.optional(),
  customSidebar: reactNodeSchema.optional(),
});

export type BaseDetailPageProps = z.infer<typeof baseDetailPagePropsSchema>;

// Breadcrumb item schema
export const breadcrumbItemSchema = z.object({
  label: z.string().min(1).max(100),
  href: z.string().max(500).optional(),
});

export type BreadcrumbItem = z.infer<typeof breadcrumbItemSchema>;

// Code highlight props schema
export const codeHighlightPropsSchema = z.object({
  code: z.string(),
  language: z.string().default('typescript'),
  title: z.string().optional(),
  showCopy: z.boolean().default(true),
});

export type CodeHighlightProps = z.infer<typeof codeHighlightPropsSchema>;

// Toast component schemas
export const toasterToastSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  action: reactNodeSchema.optional(),
  open: z.boolean().default(true).optional(),
  onOpenChange: z.function().optional(),
});

export type ToasterToast = z.infer<typeof toasterToastSchema>;

export const toastStateSchema = z.object({
  toasts: z.array(toasterToastSchema),
});

export type ToastState = z.infer<typeof toastStateSchema>;

export const toastActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ADD_TOAST'),
    toast: toasterToastSchema,
  }),
  z.object({
    type: z.literal('UPDATE_TOAST'),
    toast: toasterToastSchema,
  }),
  z.object({
    type: z.literal('DISMISS_TOAST'),
    toastId: z.string().optional(),
  }),
  z.object({
    type: z.literal('REMOVE_TOAST'),
    toastId: z.string().optional(),
  }),
]);

export type ToastAction = z.infer<typeof toastActionSchema>;

// Search hook types
export interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
}

export interface UseSearchProps {
  data: ContentMetadata[];
  searchOptions?: SearchOptions;
}

// Virtual grid types
export interface GridCellProps {
  items: ContentMetadata[];
  itemsPerRow: number;
  type?: string;
}

export interface VirtualGridProps {
  items: ContentMetadata[];
  width: number;
  height: number;
  itemsPerRow: number;
  itemHeight: number;
  type?: string;
}

// Dataset structured data props
export interface DatasetStructuredDataProps {
  items: UnifiedContentItem[];
  type: string;
  title: string;
  description: string;
}

// FAQ structured data props
export interface FAQStructuredDataProps {
  title: string;
  description: string;
  faqs: FAQItem[];
  pageUrl: string;
}

// Content loader options
export interface UseContentLoaderOptions {
  type: ContentCategory;
  slug: string;
  includeRelated?: boolean;
  preloadRelated?: boolean;
  cacheTime?: number;
}

// Infinite scroll options
export interface UseInfiniteScrollOptions {
  items: ContentMetadata[];
  initialCount?: number;
  loadMoreCount?: number;
  threshold?: number;
  rootMargin?: string;
  hasMore?: boolean;
  loading?: boolean;
}
