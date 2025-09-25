/**
 * Types for the smart related content system
 */

// Content types that can be related
export type ContentCategory =
  | 'agents'
  | 'mcp'
  | 'rules'
  | 'commands'
  | 'hooks'
  | 'tutorials'
  | 'comparisons'
  | 'workflows'
  | 'use-cases'
  | 'troubleshooting';

// Unified content item interface
export interface ContentItem {
  slug: string;
  title: string;
  description: string;
  category: ContentCategory;
  tags?: string[];
  keywords?: string[];
  url: string;
  dateUpdated?: string;
  views?: number;
  trending?: boolean;
  featured?: boolean;
}

// Related content with scoring
export interface RelatedContentItem extends ContentItem {
  score: number;
  matchType:
    | 'same_category'
    | 'tag_match'
    | 'keyword_match'
    | 'trending'
    | 'popular'
    | 'cross_category';
  matchDetails?: {
    matchedTags?: string[];
    matchedKeywords?: string[];
    trendingRank?: number;
    viewCount?: number;
  };
}

// Algorithm configuration
export interface AlgorithmConfig {
  weights: {
    sameCategory: number;
    tagMatch: number;
    keywordMatch: number;
    trending: number;
    popular: number;
    recency: number;
  };
  boosts: {
    featured: number;
    recentlyUpdated: number; // Days threshold
  };
  limits: {
    maxResults: number;
    minScore: number;
  };
}

// Service configuration
export interface RelatedContentConfig {
  currentPath: string;
  currentTags?: string[];
  currentKeywords?: string[];
  currentCategory?: ContentCategory;
  algorithm?: Partial<AlgorithmConfig>;
  featured?: string[]; // Manually specified items to include
  exclude?: string[]; // Items to exclude
  limit?: number;
}

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  refreshThreshold?: number; // Percentage of TTL before refresh (0.8 = 80%)
}

// Umami event tracking types
export interface UmamiEventData {
  [key: string]: string | number | boolean;
}

export interface RelatedContentViewEvent extends UmamiEventData {
  source_page: string;
  source_category: string;
  items_shown: number;
  algorithm_version: string;
  cache_hit: boolean;
  render_time?: number;
}

export interface RelatedContentClickEvent extends UmamiEventData {
  source_page: string;
  target_page: string;
  source_category: string;
  target_category: string;
  position: number;
  match_score: number;
  match_type: string;
  time_to_click?: number; // Milliseconds from view to click
}

export interface CarouselNavigationEvent extends UmamiEventData {
  action: 'next' | 'previous';
  current_slide: number;
  total_slides: number;
  source_page: string;
}

export interface RelatedContentImpressionEvent extends UmamiEventData {
  source_page: string;
  algorithm_version: string;
  content_ids: string;
  user_segment?: 'new' | 'returning';
}

// Performance metrics
export interface PerformanceMetrics {
  fetchTime: number;
  cacheHit: boolean;
  itemCount: number;
  algorithmVersion: string;
  renderTime?: number;
}

// Content index for build-time generation
export interface ContentIndex {
  items: ContentItem[];
  categories: Record<ContentCategory, ContentItem[]>;
  tags: Record<string, ContentItem[]>;
  keywords: Record<string, ContentItem[]>;
  metadata: {
    totalItems: number;
    lastUpdated: string;
    version: string;
  };
}

// Algorithm scoring result
export interface ScoringResult {
  item: ContentItem;
  scores: {
    category: number;
    tags: number;
    keywords: number;
    trending: number;
    popularity: number;
    recency: number;
    featured: number;
    total: number;
  };
  debug?: {
    matchedTags: string[];
    matchedKeywords: string[];
    daysSinceUpdate: number;
    viewCount: number;
  };
}

// Service response
export interface RelatedContentResponse {
  items: RelatedContentItem[];
  performance: PerformanceMetrics;
  fromCache: boolean;
  algorithm: string;
}

// Component props
export interface SmartRelatedContentProps {
  featured?: string[];
  exclude?: string[];
  limit?: number;
  showTitle?: boolean;
  title?: string;
  className?: string;
  trackingEnabled?: boolean;
  algorithmVersion?: string;
}

export interface RelatedCarouselClientProps {
  items: RelatedContentItem[];
  performance: PerformanceMetrics;
  trackingEnabled?: boolean;
  className?: string;
  showTitle?: boolean;
  title?: string;
}
