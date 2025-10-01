/**
 * Component prop schemas for React components
 * Provides type-safe validation for component props
 *
 * CLEANED - Removed 28 unused exports (60% waste eliminated)
 */

import { z } from 'zod';
import { nonEmptyString } from '@/lib/schemas/primitives/base-strings';
import {
  type UnifiedContentItem,
  unifiedContentItemSchema,
} from './components/content-item.schema';
import type { HomePageClientProps } from './components/page-props.schema';
// Import schemas from specialized modules
import type { ConfigCardProps } from './components/ui-props.schema';
import type { SortOption } from './content-filter.schema';

// Re-export commonly used types from ./components
export {
  type ConfigCardProps,
  type HomePageClientProps,
  type UnifiedContentItem,
  unifiedContentItemSchema,
};

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

// JobCard component props
export interface JobCardProps {
  job: import('@/lib/schemas/content').JobContent;
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

/**
 * View tracker props
 */
export const viewTrackerPropsSchema = z.object({
  category: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides']),
  slug: nonEmptyString.max(200),
});

export type ViewTrackerProps = z.infer<typeof viewTrackerPropsSchema>;

/**
 * Content list server props
 */
export type ContentListServerProps<T extends UnifiedContentItem = UnifiedContentItem> = {
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
 * Related configs props
 */
export type RelatedConfigsProps<T extends UnifiedContentItem = UnifiedContentItem> = {
  configs: T[];
  title?: string;
  type?: 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks' | 'guides';
};

/**
 * Floating search sidebar props
 */
export type FloatingSearchSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  items: UnifiedContentItem[];
  onItemSelect: (item: UnifiedContentItem) => void;
  placeholder?: string;
};

/**
 * Content search client props
 */
export type ContentSearchClientProps<T extends UnifiedContentItem = UnifiedContentItem> = {
  items: readonly T[] | T[];
  type: 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'guides';
  searchPlaceholder: string;
  title: string;
  icon: string;
};

/**
 * Content sidebar props
 */
export type ContentSidebarProps<T extends UnifiedContentItem = UnifiedContentItem> = {
  item: T;
  relatedItems: T[];
  type: import('./shared.schema').ContentCategory;
  typeName: string;
};

/**
 * Sort dropdown props
 */
export type SortDropdownProps = {
  sortBy: SortOption;
  sortDirection: import('./content-filter.schema').SortDirection;
  onSortChange: (
    option: SortOption,
    direction?: import('./content-filter.schema').SortDirection
  ) => void;
};

/**
 * Code highlight props schema
 */
export const codeHighlightPropsSchema = z.object({
  code: nonEmptyString,
  language: nonEmptyString.default('typescript'),
  title: nonEmptyString.optional(),
  showCopy: z.boolean().default(true),
});

export type CodeHighlightProps = z.infer<typeof codeHighlightPropsSchema>;

/**
 * Search hook types
 */
export interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
}

export interface UseSearchProps {
  data: UnifiedContentItem[];
  searchOptions?: SearchOptions;
}
