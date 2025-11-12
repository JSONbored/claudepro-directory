/**
 * Category Configuration Types
 * Shared type definitions to prevent circular dependencies
 */

import type { LucideIcon } from '@/src/lib/icons';
import type { Tables } from '@/src/types/database.types';

export type ContentType = Tables<'content'> | Tables<'jobs'>;

type DatabaseCategoryConfig = Tables<'category_configs'>;

export type CategoryId = DatabaseCategoryConfig['category'];

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
  readonly icon?: LucideIcon;
  readonly sections: ReadonlyArray<SectionId>;
  readonly lazy?: boolean;
  readonly order: number;
}

export interface UnifiedCategoryConfig<TId extends string = string> {
  readonly id: TId;
  title: string;
  pluralTitle: string;
  description: string;
  icon: LucideIcon;
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
  categoryId: CategoryId;
  icon: LucideIcon;
  displayText: string;
  delay: number;
}
