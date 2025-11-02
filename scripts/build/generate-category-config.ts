#!/usr/bin/env tsx

/**
 * Category Config Generator - Database-First Build Script
 * Queries PostgreSQL at build time and generates static TypeScript config.
 *
 * CRITICAL: This eliminates runtime database queries from category-config.ts
 * Performance: 100% faster (0ms vs unstable_cache overhead)
 *
 * Usage:
 *   pnpm generate:categories  # Generate static config from database
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { ensureEnvVars } from '../utils/env.js';
import { hasHashChanged, setHash } from '../utils/hash-cache.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_FILE = join(ROOT, 'src/lib/config/category-config.generated.ts');

interface BadgeConfig {
  text?: string;
  icon?: string;
  hasDynamicCount?: boolean;
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
  badges: BadgeConfig[] | null;
  features: Record<string, boolean>;
}

async function generateCategoryConfig() {
  const startTime = Date.now();
  console.log('🔧 Generating static category config from PostgreSQL...\n');

  try {
    // Load environment
    await ensureEnvVars(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch category configs from database
    console.log('📥 Fetching category configs from database...');
    const { data, error } = await supabase.rpc('get_category_configs_with_features');

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No category configs found in database');
    }

    const rawConfigs = data as unknown as Record<string, DatabaseConfigWithFeatures>;
    const categoryIds = Object.keys(rawConfigs);

    console.log(`✅ Found ${categoryIds.length} categories: ${categoryIds.join(', ')}\n`);

    // Generate content hash for change detection
    const contentHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');

    if (!hasHashChanged('category-config', contentHash)) {
      console.log('✓ Category config unchanged (database data identical), skipping generation');
      console.log(`✅ Category config up-to-date (${Date.now() - startTime}ms)\n`);
      return true;
    }

    // Generate TypeScript file
    console.log('📝 Generating TypeScript config file...');

    const configEntries = Object.entries(rawConfigs)
      .map(([categoryId, dbConfig]) => {
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
              if (hasDynamic) {
                const template = badge.text.replace(/`/g, '\\`').replace(/\$/g, '\\$');
                return badge.icon
                  ? `{ icon: '${badge.icon}', text: (count: number) => \`${template}\`.replace('{count}', String(count)) }`
                  : `{ text: (count: number) => \`${template}\`.replace('{count}', String(count)) }`;
              }
              return badge.icon
                ? `{ icon: '${badge.icon}', text: '${badge.text || ''}' }`
                : `{ text: '${badge.text || ''}' }`;
            })
          : [];

        return `  '${categoryId}': {
    id: '${categoryId}' as const,
    title: '${dbConfig.title.replace(/'/g, "\\'")}',
    pluralTitle: '${dbConfig.plural_title.replace(/'/g, "\\'")}',
    description: '${dbConfig.description.replace(/'/g, "\\'")}',
    icon: ICON_MAP['${dbConfig.icon_name}'] || FileText,
    colorScheme: '${dbConfig.color_scheme}',
    showOnHomepage: ${features.show_on_homepage ?? true},
    keywords: '${dbConfig.keywords.replace(/'/g, "\\'")}',
    metaDescription: '${dbConfig.meta_description.replace(/'/g, "\\'")}',
    schema: SCHEMA_MAP['${categoryId}'] ?? (publicContentRowSchema as unknown as z.ZodType<ContentType>),
    typeName: '${dbConfig.title.replace(/'/g, "\\'")}',
    generateFullContent: ${features.generate_full_content ?? true},
    metadataFields: ${JSON.stringify(dbConfig.metadata_fields)},
    buildConfig: {
      batchSize: ${generationConfig.buildConfig?.batchSize || 10},
      enableCache: ${features.build_enable_cache ?? true},
      cacheTTL: ${generationConfig.buildConfig?.cacheTTL || 300000},
    },
    apiConfig: {
      generateStaticAPI: ${features.api_generate_static ?? true},
      includeTrending: ${features.api_include_trending ?? true},
      maxItemsPerResponse: ${apiSchema.apiConfig?.maxItemsPerResponse || 1000},
    },
    listPage: {
      searchPlaceholder: '${dbConfig.search_placeholder.replace(/'/g, "\\'")}',
      badges: [${badges.join(', ')}],
      ${dbConfig.empty_state_message ? `emptyStateMessage: '${dbConfig.empty_state_message.replace(/'/g, "\\'")}',` : ''}
    },
    detailPage: {
      displayConfig: ${features.display_config ?? true},
      configFormat: '${dbConfig.config_format || 'json'}' as 'json' | 'multi' | 'hook',
    },
    sections: {
      features: ${features.section_features ?? false},
      installation: ${features.section_installation ?? false},
      use_cases: ${features.section_use_cases ?? false},
      configuration: ${features.section_configuration ?? false},
      security: ${features.section_security ?? false},
      troubleshooting: ${features.section_troubleshooting ?? false},
      examples: ${features.section_examples ?? false},
    },
    metadata: {
      showGitHubLink: ${features.metadata_show_github_link ?? true},
    },
    primaryAction: {
      label: '${dbConfig.primary_action_label}',
      type: '${dbConfig.primary_action_type}',
    },
    urlSlug: '${dbConfig.url_slug}',
    contentLoader: '${dbConfig.content_loader}',
  }`;
      })
      .join(',\n');

    const output = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 * Generated by scripts/build/generate-category-config.ts
 * Source: PostgreSQL category_configs table via get_category_configs_with_features RPC
 *
 * This file is generated at build time to eliminate runtime database queries.
 * To update: pnpm generate:categories
 */

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
import {
  publicContentRowSchema,
  publicJobsRowSchema,
} from '@/src/lib/schemas/generated/db-schemas';
import type { UnifiedCategoryConfig, ContentType, CategoryId } from './category-config';

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

const SCHEMA_MAP: Partial<Record<CategoryId, z.ZodType<ContentType>>> = {
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
};

/**
 * Static category configurations (generated at build time)
 * ZERO runtime database queries - 100% faster than unstable_cache
 */
export const CATEGORY_CONFIGS: Record<CategoryId, UnifiedCategoryConfig<ContentType, CategoryId>> = {
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
      categoryIds.filter((id) => rawConfigs[id].features?.show_on_homepage ?? true)
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

    // Save hash for next build
    setHash('category-config', contentHash);

    const duration = Date.now() - startTime;
    console.log(`✅ Category config generated in ${duration}ms`);
    console.log(`📝 Output: ${OUTPUT_FILE}`);
    console.log(`🎯 Categories: ${categoryIds.length} configs cached\n`);

    return true;
  } catch (err) {
    console.error('❌ Category config generation failed:', err);
    throw err;
  }
}

// Auto-run when executed directly
generateCategoryConfig()
  .then(() => {
    console.log('🎉 Category config generation complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Category config generation failed:', err);
    process.exit(1);
  });
