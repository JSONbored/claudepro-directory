/**
 * Component prop schemas for React components
 * Provides type-safe validation for component props
 *
 * SHA-2100: Removed ui-props.schema.ts (177 lines of unused runtime validation)
 * Extracted only the ConfigCardProps type that's actually used
 *
 * MODERNIZATION: All category types now derived from CategoryId (registry-driven)
 */

import { z } from 'zod';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import type { TrendingContentItem } from '@/src/lib/trending/calculator.server';
import type { UnifiedContentItem } from './components/content-item.schema';
import type { HomePageClientProps } from './components/page-props.schema';
import type { SortOption } from './content-filter.schema';
import { type CategoryId, categoryIdSchema } from './shared.schema';

/**
 * Config card component props (extracted from deleted ui-props.schema.ts)
 * Used for displaying configuration cards in lists
 */
export interface ConfigCardProps {
  item: UnifiedContentItem;
  variant?: 'default' | 'detailed';
  showCategory?: boolean;
  showActions?: boolean;
  className?: string;
  /**
   * Optional render function for sponsored wrapper
   * Only kept for backwards compatibility with BaseCard
   * (Will be removed once all consumers are migrated to direct SponsoredTracker usage)
   */
  renderSponsoredWrapper?: (
    children: React.ReactNode,
    sponsoredId: string,
    targetUrl: string,
    position?: number
  ) => React.ReactNode;
  /**
   * Enable mobile swipe gestures
   * Swipe right → Copy, Swipe left → Bookmark
   * @default false
   */
  enableSwipeGestures?: boolean;
  /**
   * Enable View Transitions API for smooth page morphing
   * Progressive enhancement - works where supported, instant elsewhere
   * @default false
   */
  useViewTransitions?: boolean;
  /**
   * Show BorderBeam animation (reserved for top 3 featured items)
   * @default false
   */
  showBorderBeam?: boolean;
}

// Re-export commonly used types from ./components
export type { HomePageClientProps, UnifiedContentItem };

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
  guides: Record<string, import('@/src/lib/utils/content.utils').GuideItemWithCategory[]>;
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
  job: import('@/src/lib/schemas/content/job.schema').JobContent;
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
  trending: TrendingContentItem[];
  popular: TrendingContentItem[];
  recent: TrendingContentItem[];
}

/**
 * View tracker props
 * DEPRECATED: Use UnifiedTrackerProps from unified-tracker.tsx instead
 * Kept for backwards compatibility during migration
 */
const viewTrackerPropsSchema = z.object({
  category: categoryIdSchema.describe(
    'Content category for view tracking (derived from UNIFIED_CATEGORY_REGISTRY)'
  ),
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
  type: CategoryId;
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
  type?: CategoryId;
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
  type: CategoryId;
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
  type: import('./shared.schema').CategoryId;
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
const codeHighlightPropsSchema = z.object({
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
  initialQuery?: string; // Initial search query from URL (for SearchAction schema integration)
}
