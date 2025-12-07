/**
 * Category Config Generator - Edge Function Build Script
 * Queries data-api edge function at build time and generates static TypeScript config.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Database } from '@heyclaude/database-types';

import { computeHash, hasHashChanged, setHash } from '../toolkit/cache.js';
import { callEdgeFunction } from '../toolkit/edge.js';
import { ensureEnvVars } from '../toolkit/env.js';
import { logger } from '../toolkit/logger.js';
import { DEFAULT_SUPABASE_URL } from '../toolkit/supabase.js';
import { resolveRepoPath } from '../utils/paths.js';

const OUTPUT_FILE = resolveRepoPath(
  'packages',
  'web-runtime',
  'src',
  'data',
  'config',
  'category',
  'category-config.generated.ts'
);

interface BadgeConfig {
  hasDynamicCount?: boolean;
  icon?: string;
  text?: string;
}

type ConfigFormatEnum = Database['public']['Enums']['config_format'];
type PrimaryActionTypeEnum = Database['public']['Enums']['primary_action_type'];

interface DatabaseConfigWithFeatures {
  api_schema: unknown;
  badges: BadgeConfig[] | null;
  category: string;
  color_scheme: string;
  config_format: ConfigFormatEnum | null;
  content_loader: string;
  description: string;
  empty_state_message: null | string;
  features: Record<string, boolean>;
  generation_config: unknown;
  icon_name: string;
  keywords: string;
  meta_description: string;
  metadata_fields: string[];
  plural_title: string;
  primary_action_config: unknown;
  primary_action_label: string;
  primary_action_type: PrimaryActionTypeEnum;
  schema_name: null | string;
  search_placeholder: string;
  title: string;
  url_slug: string;
  validation_config: unknown;
}

export async function runGenerateCategoryConfig(): Promise<boolean> {
  const startTime = Date.now();
  logger.info('🔧 Generating static category config from PostgreSQL...\n', {
    script: 'generate-category-config',
  });

  await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

  if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    logger.warn(
      'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
      {
        script: 'generate-category-config',
        fallbackUrl: DEFAULT_SUPABASE_URL,
      }
    );
  }

  logger.info('📥 Fetching category configs from data-api edge function...');
  const rawConfigs = await callEdgeFunction<Record<string, DatabaseConfigWithFeatures>>(
    '/data-api/content/category-configs',
    {},
    { timeoutMs: 10_000 }
  );

  const categoryIds = Object.values(rawConfigs)
    .map((dbConfig) => {
      if (!dbConfig.category) {
        throw new Error('Category config missing category ENUM value');
      }
      return dbConfig.category;
    })
    .sort();

  logger.info(`✅ Found ${categoryIds.length} categories: ${categoryIds.join(', ')}\n`, {
    categoryCount: categoryIds.length,
  });

  const contentHash = computeHash(rawConfigs);

  if (!hasHashChanged('category-config', contentHash)) {
    logger.info('✓ Category config unchanged (database data identical), skipping generation');
    logger.info(`✅ Category config up-to-date (${Date.now() - startTime}ms)\n`, {
      duration: `${Date.now() - startTime}ms`,
    });
    return true;
  }

  logger.info('📝 Generating TypeScript config file...');

  const configEntries = Object.entries(rawConfigs)
    .map(([, dbConfig]) => {
      const categoryKey = dbConfig.category;
      if (!categoryKey) {
        throw new Error('Category config missing category ENUM value');
      }

      const features = dbConfig.features || {};
      const generationConfig = (dbConfig.generation_config || {}) as {
        buildConfig?: { batchSize?: number; cacheTTL?: number };
      };
      const apiSchema = (dbConfig.api_schema || {}) as {
        apiConfig?: { maxItemsPerResponse?: number };
      };

      // Format numbers with proper separators for linting (groups of 3 digits)
      const formatNumber = (num: number | undefined, fallback: number): string => {
        const value = num ?? fallback;
        if (value >= 1000) {
          // Format with underscores every 3 digits from right
          const str = String(value);
          const parts = [];
          for (let i = str.length; i > 0; i -= 3) {
            parts.unshift(str.slice(Math.max(0, i - 3), i));
          }
          return parts.join('_');
        }
        return String(value);
      };

      const cacheTTL = formatNumber(generationConfig.buildConfig?.cacheTTL, 300_000);
      const maxItemsPerResponse = formatNumber(apiSchema.apiConfig?.maxItemsPerResponse, 1000);

      const badges = Array.isArray(dbConfig.badges)
        ? dbConfig.badges.map((badge: BadgeConfig) => {
            if (typeof badge !== 'object' || !badge) return '{ text: "" }';
            const hasDynamic = badge.hasDynamicCount && badge.text;
            if (hasDynamic && badge.text) {
              // Escape backslashes first, then backticks and dollar signs for template literal safety
              // Order matters: backslashes must be escaped first to prevent double-escaping
              const template = badge.text
                .replaceAll('\\', '\\\\')
                .replaceAll('`', '\\`')
                .replaceAll('$', String.raw`\$`);
              return badge.icon
                ? `{ icon: ${JSON.stringify(badge.icon)}, text: (count: number) => \`${template}\`.replace('{count}', String(count)) }`
                : `{ text: (count: number) => \`${template}\`.replace('{count}', String(count)) }`;
            }
            return badge.icon
              ? `{ icon: ${JSON.stringify(badge.icon)}, text: ${JSON.stringify(badge.text ?? '')} }`
              : `{ text: ${JSON.stringify(badge.text ?? '')} }`;
          })
        : [];

      return `  ${JSON.stringify(categoryKey)}: {
    id: ${JSON.stringify(categoryKey)} as const,
    title: ${JSON.stringify(dbConfig.title)},
    pluralTitle: ${JSON.stringify(dbConfig.plural_title)},
    description: ${JSON.stringify(dbConfig.description)},
    icon: ICON_MAP['${dbConfig.icon_name}'] ?? FileText,
    colorScheme: ${JSON.stringify(dbConfig.color_scheme)},
    showOnHomepage: ${features['show_on_homepage'] ?? true},
    keywords: ${JSON.stringify(dbConfig.keywords)},
    metaDescription: ${JSON.stringify(dbConfig.meta_description)},
    typeName: ${JSON.stringify(dbConfig.title)},
    generateFullContent: ${features['generate_full_content'] ?? true},
    metadataFields: ${JSON.stringify(dbConfig.metadata_fields)},
    buildConfig: {
      batchSize: ${generationConfig.buildConfig?.batchSize ?? 10},
      enableCache: ${features['build_enable_cache'] ?? true},
      cacheTTL: ${cacheTTL},
    },
    apiConfig: {
      generateStaticAPI: ${features['api_generate_static'] ?? true},
      includeTrending: ${features['api_include_trending'] ?? true},
      maxItemsPerResponse: ${maxItemsPerResponse},
    },
    listPage: {
      searchPlaceholder: ${JSON.stringify(dbConfig.search_placeholder)},
      badges: [${badges.join(', ')}],
      ${dbConfig.empty_state_message ? `emptyStateMessage: ${JSON.stringify(dbConfig.empty_state_message)},` : ''}
    },
    detailPage: {
      displayConfig: ${features['display_config'] ?? true},
      configFormat: ${JSON.stringify(dbConfig.config_format ?? 'json')},
    },
    sections: {
      description: ${features['section_description'] ?? true},
      features: ${features['section_features'] ?? false},
      installation: ${features['section_installation'] ?? false},
      use_cases: ${features['section_use_cases'] ?? false},
      configuration: ${features['section_configuration'] ?? false},
      security: ${features['section_security'] ?? false},
      troubleshooting: ${features['section_troubleshooting'] ?? false},
      examples: ${features['section_examples'] ?? false},
      requirements: ${features['section_requirements'] ?? false},
    },
    metadata: {
      showGitHubLink: ${features['metadata_show_github_link'] ?? true},
    },
    primaryAction: {
      label: ${JSON.stringify(dbConfig.primary_action_label)},
      type: ${JSON.stringify(dbConfig.primary_action_type)},
    },
    urlSlug: ${JSON.stringify(dbConfig.url_slug)},
    contentLoader: ${JSON.stringify(dbConfig.content_loader)},
  }`;
    })
    .join(',\n');

  const output = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 * Generated by packages/generators/src/commands/generate-category-config.ts
 * Source: data-api edge function (/content/category-configs) via get_category_configs_with_features RPC
 *
 * This file is generated at build time to eliminate runtime database queries.
 * To update: pnpm generate:categories
 */

import type { Database } from '@heyclaude/database-types';
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
} from '../../../icons.tsx';
import type { UnifiedCategoryConfig } from '../../../types/category.ts';

type ContentCategory = Database['public']['Enums']['content_category'];

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

export const CATEGORY_CONFIGS: Record<ContentCategory, UnifiedCategoryConfig<ContentCategory>> = {
${configEntries}
};

export const ALL_CATEGORY_IDS = ${JSON.stringify(categoryIds)} as const;

export const HOMEPAGE_CATEGORY_IDS = ${JSON.stringify(
    Object.values(rawConfigs)
      .filter((dbConfig) => dbConfig.features?.['show_on_homepage'] ?? true)
      .map((dbConfig) => dbConfig.category)
      .sort()
  )} as const;

export const CACHEABLE_CATEGORY_IDS = ${JSON.stringify(
    Object.values(rawConfigs)
      .filter((dbConfig) => {
        const category = dbConfig.category;
        return category && category !== 'jobs' && category !== 'changelog';
      })
      .map((dbConfig) => dbConfig.category)
      .sort()
  )} as const;
`;

  const outputDir = join(OUTPUT_FILE, '..');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  writeFileSync(OUTPUT_FILE, output, 'utf8');

  const duration = Date.now() - startTime;

  setHash('category-config', contentHash, {
    reason: 'Category config regenerated from database',
    duration,
    files: [OUTPUT_FILE],
  });
  logger.info(`✅ Category config generated in ${duration}ms`, { duration: `${duration}ms` });
  logger.info(`📝 Output: ${OUTPUT_FILE}`, { outputFile: OUTPUT_FILE });
  logger.info(`🎯 Categories: ${categoryIds.length} configs cached\n`, {
    categoryCount: categoryIds.length,
  });

  return true;
}
