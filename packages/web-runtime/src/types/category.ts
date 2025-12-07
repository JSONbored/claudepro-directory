import type { Database } from '@heyclaude/database-types';
import type { LucideIcon } from 'lucide-react';

export type SectionId =
  | 'description'
  | 'content'
  | 'code'
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
    configFormat: Database['public']['Enums']['config_format'];
    tabs?: ReadonlyArray<TabConfig>;
  };
  sections: {
    description: boolean;
    features: boolean;
    installation: boolean;
    use_cases: boolean;
    configuration: boolean;
    security: boolean;
    troubleshooting: boolean;
    examples: boolean;
    requirements: boolean;
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
  categoryId: Database['public']['Enums']['content_category'];
  icon: LucideIcon;
  displayText: string;
  delay: number;
}
