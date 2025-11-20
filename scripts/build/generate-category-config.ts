#!/usr/bin/env tsx

/**
 * Category Config Generator - Edge Function Build Script
 * Queries data-api edge function at build time and generates static TypeScript config.
 *
 * CRITICAL: This generates static configs at build time (no runtime database queries)
 * Performance: 100% faster (0ms vs unstable_cache overhead)
 *
 * Usage:
 *   pnpm generate:categories  # Generate static config from edge function
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';
import { computeHash, hasHashChanged, setHash } from '../utils/build-cache.js';
import { ensureEnvVars } from '../utils/env.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_FILE = join(ROOT, 'src/lib/config/category-config.generated.ts');

interface BadgeConfig {
  text?: string;
  icon?: string;
  hasDynamicCount?: boolean;
}

// Use generated types directly from database.types.ts
type ConfigFormatEnum = Database['public']['Enums']['config_format'];
type PrimaryActionTypeEnum = Database['public']['Enums']['primary_action_type'];

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
  // Use generated ENUM types directly (values come as strings from JSON but are typed as ENUM)
  config_format: ConfigFormatEnum | null;
  primary_action_type: PrimaryActionTypeEnum;
  primary_action_label: string;
  primary_action_config: unknown;
  validation_config: unknown;
  generation_config: unknown;
  schema_name: string | null;
  api_schema: unknown;
  metadata_fields: string[];
  badges: BadgeConfig[] | null;
  features: Record<string, boolean>;
}

async function generateCategoryConfig() {
  const startTime = Date.now();
  logger.info('🔧 Generating static category config from PostgreSQL...\n', {
    script: 'generate-category-config',
  });

  try {
    // Load environment - only require SUPABASE_SERVICE_ROLE_KEY
    // NEXT_PUBLIC_SUPABASE_URL has a fallback, so we don't require it
    await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

    // Use fallback Supabase URL if not set (matches next.config.mjs pattern)
    // This allows builds to work even if NEXT_PUBLIC_SUPABASE_URL isn't set in Vercel
    // but we still prefer the environment variable for flexibility
    const SUPABASE_URL =
      process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://hgtjdifxfapoltfflowc.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
    }

    if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
      logger.warn(
        'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
        {
          script: 'generate-category-config',
          fallbackUrl: SUPABASE_URL,
        }
      );
    }

    // Fetch category configs from data-api edge function
    logger.info('📥 Fetching category configs from data-api edge function...');
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/data-api/content/category-configs`;

    const response = await fetch(edgeFunctionUrl, {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Edge function request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('No category configs found in response');
    }

    const rawConfigs = data as unknown as Record<string, DatabaseConfigWithFeatures>;
    const categoryIds = Object.keys(rawConfigs);

    logger.info(`✅ Found ${categoryIds.length} categories: ${categoryIds.join(', ')}\n`, {
      categoryCount: categoryIds.length,
    });

    // Generate content hash for change detection
    const contentHash = computeHash(data);

    if (!hasHashChanged('category-config', contentHash)) {
      logger.info('✓ Category config unchanged (database data identical), skipping generation');
      logger.info(`✅ Category config up-to-date (${Date.now() - startTime}ms)\n`, {
        duration: `${Date.now() - startTime}ms`,
      });
      return true;
    }

    // Generate TypeScript file
    logger.info('📝 Generating TypeScript config file...');

    // All strings now use JSON.stringify directly (no escapeString needed)
    // JSON.stringify properly escapes all special characters including apostrophes

    const configEntries = Object.entries(rawConfigs)
      .map(([, dbConfig]) => {
        // Use the category ENUM value as the key, not the numeric ID
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

        // Transform badges
        const badges = Array.isArray(dbConfig.badges)
          ? dbConfig.badges.map((badge: BadgeConfig) => {
              if (typeof badge !== 'object' || !badge) return '{ text: "" }';
              const hasDynamic = badge.hasDynamicCount && badge.text;
              if (hasDynamic && badge.text) {
                const template = badge.text.replace(/`/g, '\\`').replace(/\$/g, '\\$');
                return badge.icon
                  ? `{ icon: ${JSON.stringify(badge.icon)}, text: (count: number) => \`${template}\`.replace('{count}', String(count)) }`
                  : `{ text: (count: number) => \`${template}\`.replace('{count}', String(count)) }`;
              }
              return badge.icon
                ? `{ icon: ${JSON.stringify(badge.icon)}, text: ${JSON.stringify(badge.text || '')} }`
                : `{ text: ${JSON.stringify(badge.text || '')} }`;
            })
          : [];

        return `  ${JSON.stringify(categoryKey)}: {
    id: ${JSON.stringify(categoryKey)} as const,
    title: ${JSON.stringify(dbConfig.title)},
    pluralTitle: ${JSON.stringify(dbConfig.plural_title)},
    description: ${JSON.stringify(dbConfig.description)},
    icon: ICON_MAP['${dbConfig.icon_name}'] || FileText,
    colorScheme: ${JSON.stringify(dbConfig.color_scheme)},
    showOnHomepage: ${features['show_on_homepage'] ?? true},
    keywords: ${JSON.stringify(dbConfig.keywords)},
    metaDescription: ${JSON.stringify(dbConfig.meta_description)},
    typeName: ${JSON.stringify(dbConfig.title)},
    generateFullContent: ${features['generate_full_content'] ?? true},
    metadataFields: ${JSON.stringify(dbConfig.metadata_fields)},
    buildConfig: {
      batchSize: ${generationConfig.buildConfig?.batchSize || 10},
      enableCache: ${features['build_enable_cache'] ?? true},
      cacheTTL: ${generationConfig.buildConfig?.cacheTTL || 300000},
    },
    apiConfig: {
      generateStaticAPI: ${features['api_generate_static'] ?? true},
      includeTrending: ${features['api_include_trending'] ?? true},
      maxItemsPerResponse: ${apiSchema.apiConfig?.maxItemsPerResponse || 1000},
    },
    listPage: {
      searchPlaceholder: ${JSON.stringify(dbConfig.search_placeholder)},
      badges: [${badges.join(', ')}],
      ${dbConfig.empty_state_message ? `emptyStateMessage: ${JSON.stringify(dbConfig.empty_state_message)},` : ''}
    },
    detailPage: {
      displayConfig: ${features['display_config'] ?? true},
      configFormat: ${JSON.stringify(dbConfig.config_format || 'json')},
    },
    sections: {
      features: ${features['section_features'] ?? false},
      installation: ${features['section_installation'] ?? false},
      use_cases: ${features['section_use_cases'] ?? false},
      configuration: ${features['section_configuration'] ?? false},
      security: ${features['section_security'] ?? false},
      troubleshooting: ${features['section_troubleshooting'] ?? false},
      examples: ${features['section_examples'] ?? false},
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
 * Generated by scripts/build/generate-category-config.ts
 * Source: data-api edge function (/content/category-configs) via get_category_configs_with_features RPC
 *
 * This file is generated at build time to eliminate runtime database queries.
 * To update: pnpm generate:categories
 */

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
import type { Database } from '@/src/types/database.types';
import type { UnifiedCategoryConfig } from '@/src/lib/types/component.types';

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

/**
 * Static category configurations (generated at build time)
 * ZERO runtime database queries - 100% faster than unstable_cache
 */
export const CATEGORY_CONFIGS: Record<ContentCategory, UnifiedCategoryConfig<ContentCategory>> = {
${configEntries}
};

/**
 * All category IDs (static array)
 */
export const ALL_CATEGORY_IDS = ${JSON.stringify(categoryIds)} as const;

/**
 * Homepage category IDs (filtered at build time)
 */
export const HOMEPAGE_CATEGORY_IDS = ${JSON.stringify(
      categoryIds.filter((id) => {
        const config = rawConfigs[id];
        return config && (config.features?.['show_on_homepage'] ?? true);
      })
    )} as const;

/**
 * Cacheable category IDs (excludes jobs and changelog)
 */
export const CACHEABLE_CATEGORY_IDS = ${JSON.stringify(
      categoryIds.filter((id) => id !== 'jobs' && id !== 'changelog')
    )} as const;
`;

    // Write output file
    const outputDir = join(OUTPUT_FILE, '..');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(OUTPUT_FILE, output, 'utf-8');

    const duration = Date.now() - startTime;

    // Save hash for next build with metadata
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
  } catch (err) {
    logger.error(
      '❌ Category config generation failed',
      err instanceof Error ? err : new Error(String(err)),
      {
        script: 'generate-category-config',
      }
    );
    throw err;
  }
}

// Auto-run when executed directly
generateCategoryConfig()
  .then(() => {
    logger.info('🎉 Category config generation complete!', { script: 'generate-category-config' });
    process.exit(0);
  })
  .catch((err) => {
    logger.error(
      '💥 Category config generation failed',
      err instanceof Error ? err : new Error(String(err)),
      {
        script: 'generate-category-config',
      }
    );
    process.exit(1);
  });
