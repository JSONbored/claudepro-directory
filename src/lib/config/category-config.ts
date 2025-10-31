/**
 * Category Configuration - Database-First Architecture
 * Single source of truth: category_configs table in PostgreSQL
 */

import { unstable_cache } from 'next/cache';
import type { z } from 'zod';
import {
  BookOpen,
  Briefcase,
  Code,
  FileText,
  Layers,
  type LucideIcon,
  Server,
  Sparkles,
  Terminal,
  Webhook,
} from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import {
  publicChangelogRowSchema,
  publicContentRowSchema,
  publicJobsRowSchema,
} from '@/src/lib/schemas/generated/db-schemas';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Tables } from '@/src/types/database.types';

export type ContentType = Tables<'content'> | Tables<'jobs'> | Tables<'changelog_entries'>;

type DatabaseCategoryConfig = Tables<'category_configs'>;

export type CategoryId = DatabaseCategoryConfig['category'];

export interface UnifiedCategoryConfig<
  T extends ContentType = ContentType,
  TId extends string = string,
> {
  readonly id: TId;
  title: string;
  pluralTitle: string;
  description: string;
  icon: LucideIcon;
  colorScheme: string;
  showOnHomepage: boolean;
  keywords: string;
  metaDescription: string;
  readonly schema: z.ZodType<T>;
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

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Terminal,
  Webhook,
  BookOpen,
  Server,
  Layers,
  Briefcase,
  FileText,
  Code,
};

const SCHEMA_MAP: Record<CategoryId, z.ZodType<ContentType>> = {
  agents: publicContentRowSchema as unknown as z.ZodType<ContentType>,
  mcp: publicContentRowSchema as unknown as z.ZodType<ContentType>,
  commands: publicContentRowSchema as unknown as z.ZodType<ContentType>,
  rules: publicContentRowSchema as unknown as z.ZodType<ContentType>,
  hooks: publicContentRowSchema as unknown as z.ZodType<ContentType>,
  statuslines: publicContentRowSchema as unknown as z.ZodType<ContentType>,
  skills: publicContentRowSchema as unknown as z.ZodType<ContentType>,
  collections: publicContentRowSchema as unknown as z.ZodType<ContentType>,
  guides: publicContentRowSchema as unknown as z.ZodType<ContentType>,
  jobs: publicJobsRowSchema as unknown as z.ZodType<ContentType>,
  changelog: publicChangelogRowSchema as unknown as z.ZodType<ContentType>,
};

function transformBadges(
  dbBadges: unknown
): Array<{ icon?: string; text: string | ((count: number) => string) }> {
  if (!(dbBadges && Array.isArray(dbBadges))) return [];
  return dbBadges.map((badge) => {
    if (typeof badge !== 'object' || !badge) return { text: '' };
    const b = badge as { icon?: string; text?: string; hasDynamicCount?: boolean };
    if (b.hasDynamicCount && b.text) {
      const template = b.text;
      return b.icon
        ? { icon: b.icon, text: (count: number) => template.replace('{count}', String(count)) }
        : { text: (count: number) => template.replace('{count}', String(count)) };
    }
    return b.icon ? { icon: b.icon, text: b.text || '' } : { text: b.text || '' };
  });
}

interface DatabaseConfigWithFeatures {
  category: string;
  title: string;
  plural_title: string;
  description: string;
  icon_name: string;
  color_scheme: string;
  keywords: string;
  meta_description: string;
  search_placeholder: string;
  empty_state_message: string | null;
  url_slug: string;
  content_loader: string;
  config_format: string | null;
  primary_action_type: string;
  primary_action_label: string;
  primary_action_config: unknown;
  validation_config: unknown;
  generation_config: unknown;
  schema_name: string | null;
  api_schema: unknown;
  metadata_fields: string[];
  badges: unknown;
  features: Record<string, boolean>;
}

function transformDatabaseConfig(
  dbConfig: DatabaseConfigWithFeatures
): UnifiedCategoryConfig<ContentType, CategoryId> {
  const categoryId = dbConfig.category as CategoryId;
  const features = dbConfig.features || {};
  const generationConfig = (dbConfig.generation_config || {}) as {
    buildConfig?: { batchSize?: number; cacheTTL?: number };
  };
  const apiSchema = (dbConfig.api_schema || {}) as {
    apiConfig?: { maxItemsPerResponse?: number };
  };

  return {
    id: categoryId,
    title: dbConfig.title,
    pluralTitle: dbConfig.plural_title,
    description: dbConfig.description,
    icon: ICON_MAP[dbConfig.icon_name] || FileText,
    colorScheme: dbConfig.color_scheme,
    showOnHomepage: features.show_on_homepage ?? true,
    keywords: dbConfig.keywords,
    metaDescription: dbConfig.meta_description,
    schema: SCHEMA_MAP[categoryId],
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: features.generate_full_content ?? true,
    metadataFields: dbConfig.metadata_fields,
    buildConfig: {
      batchSize: generationConfig.buildConfig?.batchSize || 10,
      enableCache: features.build_enable_cache ?? true,
      cacheTTL: generationConfig.buildConfig?.cacheTTL || 300000,
    },
    apiConfig: {
      generateStaticAPI: features.api_generate_static ?? true,
      includeTrending: features.api_include_trending ?? true,
      maxItemsPerResponse: apiSchema.apiConfig?.maxItemsPerResponse || 1000,
    },
    listPage: (() => {
      const listPage: {
        searchPlaceholder: string;
        badges: Array<{ icon?: string; text: string | ((count: number) => string) }>;
        emptyStateMessage?: string;
      } = {
        searchPlaceholder: dbConfig.search_placeholder,
        badges: transformBadges(dbConfig.badges),
      };
      if (dbConfig.empty_state_message) {
        listPage.emptyStateMessage = dbConfig.empty_state_message;
      }
      return listPage;
    })(),
    detailPage: {
      displayConfig: features.display_config ?? true,
      configFormat: (dbConfig.config_format as 'json' | 'multi' | 'hook') || 'json',
    },
    sections: {
      features: features.section_features ?? false,
      installation: features.section_installation ?? false,
      use_cases: features.section_use_cases ?? false,
      configuration: features.section_configuration ?? false,
      security: features.section_security ?? false,
      troubleshooting: features.section_troubleshooting ?? false,
      examples: features.section_examples ?? false,
    },
    metadata: {
      showGitHubLink: features.metadata_show_github_link ?? true,
    },
    primaryAction: {
      label: dbConfig.primary_action_label,
      type: dbConfig.primary_action_type,
    },
    urlSlug: dbConfig.url_slug,
    contentLoader: dbConfig.content_loader,
  };
}

async function fetchAllCategoryConfigs(): Promise<
  Record<CategoryId, UnifiedCategoryConfig<ContentType, CategoryId>>
> {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc('get_category_configs_with_features');
    if (error) throw error;
    if (!data) throw new Error('No category configs found');

    const rawConfigs = data as unknown as Record<string, DatabaseConfigWithFeatures>;
    const configs: Record<string, UnifiedCategoryConfig<ContentType, CategoryId>> = {};

    for (const [categoryId, dbConfig] of Object.entries(rawConfigs)) {
      configs[categoryId] = transformDatabaseConfig(dbConfig);
    }

    logger.info('Loaded category configs with features from database', {
      count: Object.keys(configs).length,
    });
    return configs as Record<CategoryId, UnifiedCategoryConfig<ContentType, CategoryId>>;
  } catch (error) {
    logger.error('Failed to fetch category configs', error as Error);
    throw error;
  }
}

const getCategoryConfigsFromDB = unstable_cache(fetchAllCategoryConfigs, ['category-configs-v2'], {
  revalidate: 86400,
  tags: ['category-configs'],
});

export async function getCategoryConfigs(): Promise<
  Record<CategoryId, UnifiedCategoryConfig<ContentType, CategoryId>>
> {
  return getCategoryConfigsFromDB();
}

export type UnifiedCategoryConfigValue = UnifiedCategoryConfig;

export const VALID_CATEGORIES: readonly CategoryId[] = [
  'agents',
  'mcp',
  'commands',
  'rules',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const;

export async function getCategoryConfig(
  slug: CategoryId
): Promise<UnifiedCategoryConfigValue | null> {
  const configs = await getCategoryConfigs();
  return configs[slug] || null;
}

export function isValidCategory(category: string): category is CategoryId {
  return VALID_CATEGORIES.includes(category as CategoryId);
}

export async function getAllCategoryIds(): Promise<CategoryId[]> {
  return Object.keys(await getCategoryConfigs()) as CategoryId[];
}

export async function getHomepageCategoryIds(): Promise<CategoryId[]> {
  const configs = await getCategoryConfigs();
  return Object.entries(configs)
    .filter(([_, config]) => config.showOnHomepage)
    .map(([id, _]) => id as CategoryId);
}

export async function getCacheableCategoryIds(): Promise<CategoryId[]> {
  return Object.keys(await getCategoryConfigs()).filter(
    (id) => id !== 'jobs' && id !== 'changelog'
  ) as CategoryId[];
}

export const HOMEPAGE_FEATURED_CATEGORIES = [
  'agents',
  'mcp',
  'commands',
  'rules',
] as const satisfies readonly CategoryId[];
export const HOMEPAGE_TAB_CATEGORIES = [
  'all',
  'agents',
  'mcp',
  'commands',
  'rules',
  'hooks',
  'statuslines',
  'collections',
  'guides',
  'community',
] as const;

export type HomepageFeaturedCategory = (typeof HOMEPAGE_FEATURED_CATEGORIES)[number];
export type HomepageTabCategory = (typeof HOMEPAGE_TAB_CATEGORIES)[number];

export interface CategoryStatsConfig {
  categoryId: CategoryId;
  icon: LucideIcon;
  displayText: string;
  delay: number;
}

export async function getCategoryStatsConfig(): Promise<readonly CategoryStatsConfig[]> {
  const configs = await getCategoryConfigs();
  return Object.keys(configs).map((id, index) => ({
    categoryId: id as CategoryId,
    icon: configs[id as CategoryId].icon,
    displayText: configs[id as CategoryId].pluralTitle,
    delay: index * 100,
  }));
}

export function getTotalResourceCount(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, count) => sum + count, 0);
}

export const NEWSLETTER_CTA_CONFIG = {
  title: 'Get the latest Claude resources',
  headline: 'Get the latest Claude resources',
  description: 'Weekly roundup of the best Claude agents, tools, and guides.',
  ctaText: 'Subscribe',
  buttonText: 'Subscribe',
  footerText: 'No spam. Unsubscribe anytime.',
} as const;
