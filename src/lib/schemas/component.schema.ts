/**
 * Component Props - React component prop types derived from database schemas
 */

import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
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
