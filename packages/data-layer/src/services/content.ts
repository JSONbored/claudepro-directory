/**
 * Content Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table/enum types use Prisma types.
 * RPC functions converted to Prisma queries or custom SQL.
 *
 * This service handles all content-related database operations.
 * Uses Prisma queries directly where possible, custom SQL for complex operations.
 */

import type { content_category, Json } from '@heyclaude/data-layer/prisma';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
import { withSmartCache } from '../utils/request-cache.ts';
import type { contentModel } from '@heyclaude/database-types/prisma/models';
import type {
  EnrichedContentItem,
} from '@heyclaude/database-types/postgres-types';

// Local types for migrated RPCs (RPCs removed, using Prisma directly)
// These types match the transformed Prisma query results

/**
 * ContentTemplatesItem - Transformed template structure
 * Based on Prisma content_templates query with transformation applied
 */
type ContentTemplatesItem = {
  id: string;
  type: string; // category from template (renamed from category)
  name: string;
  description: string | null;
  category: string | null; // extracted from template_data JSON
  tags: string | null; // extracted from template_data JSON
  template_data: Record<string, unknown> | null;
};

/**
 * ContentTemplatesResult - Return type for getContentTemplates
 */
type ContentTemplatesResult = {
  templates: ContentTemplatesItem[] | null;
};

/**
 * ContentPaginatedSlimItem - Item from materialized view mv_content_list_slim
 * Matches contentModel structure (same columns as content table)
 */
type ContentPaginatedSlimItem = contentModel;

/**
 * ContentPaginatedSlimResult - Paginated result with items and pagination metadata
 */
type ContentPaginatedSlimResult = {
  items: ContentPaginatedSlimItem[];
  pagination: {
    total_count: number;
    limit: number;
    offset: number;
    has_more: boolean;
    current_page: number;
    total_pages: number;
  };
};
import type {
  CategoryConfigFeatures,
  CategoryConfigWithFeatures,
  GenerateReadmeDataArgs,
  GenerateReadmeDataReturns,
  GetSitewideContentListArgs,
  GetSitewideContentListReturns,
  GetCategoryContentListArgs,
  GetCategoryContentListReturns,
  GenerateSitewideLlmsTxtArgs,
  GenerateSitewideLlmsTxtReturns,
  GenerateChangelogLlmsTxtArgs,
  GenerateChangelogLlmsTxtReturns,
  GenerateCategoryLlmsTxtArgs,
  GenerateCategoryLlmsTxtReturns,
  GenerateChangelogEntryLlmsTxtArgs,
  GenerateChangelogEntryLlmsTxtReturns,
  GenerateToolLlmsTxtArgs,
  GenerateToolLlmsTxtReturns,
  GetCategoryConfigsWithFeaturesReturns,
  GetApiContentFullArgs,
  GetApiContentFullReturns,
  GenerateMarkdownExportArgs,
  GenerateMarkdownExportReturns,
  GenerateItemLlmsTxtArgs,
  GenerateItemLlmsTxtReturns,
  GetSkillStoragePathArgs,
  GetSkillStoragePathReturns,
  GetMcpbStoragePathArgs,
  GetMcpbStoragePathReturns,
  GetContentDetailCompleteArgs,
  GetContentDetailCompleteReturns,
  GetContentPaginatedArgs,
  GetContentPaginatedReturns,
  GetHomepageCompleteArgs,
  GetHomepageCompleteReturns,
  GetReviewsWithStatsArgs,
  GetReviewsWithStatsReturns,
  GetRelatedContentArgs,
  GetRelatedContentReturns,
  GetContentTemplatesArgs,
  GetContentDetailCoreArgs,
  GetContentDetailCoreReturns,
  GetContentAnalyticsArgs,
  GetContentAnalyticsReturns,
  GetHomepageOptimizedArgs,
  GetHomepageOptimizedReturns,
  GenerateChangelogRssFeedArgs,
  GenerateChangelogRssFeedReturns,
  GenerateChangelogAtomFeedArgs,
  GenerateChangelogAtomFeedReturns,
  GenerateContentRssFeedArgs,
  GenerateContentRssFeedReturns,
  GenerateContentAtomFeedArgs,
  GenerateContentAtomFeedReturns,
  GetWeeklyDigestArgs,
  GetWeeklyDigestReturns,
} from '@heyclaude/database-types/postgres-types';

export interface ContentFilterOptions {
  author?: string;
  categories?: content_category[] | undefined;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'slug' | 'title' | 'updated_at';
  orderDirection?: 'asc' | 'desc';
  search?: string;
  tags?: string[] | undefined;
}

export interface ReviewsFilterOptions {
  contentSlug: string;
  contentType: content_category;
  limit?: number;
  offset?: number;
  sortBy?: string;
  userId?: string;
}

export interface RelatedContentOptions {
  category: content_category;
  excludeSlugs?: string[];
  limit?: number;
  slug: string;
  tags?: string[] | undefined;
}

export interface SimilarContentOptions {
  contentSlug: string;
  contentType: content_category;
  limit?: number;
}

/**
 * Content Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions (all methods use RPCs)
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class ContentService extends BasePrismaService {
  async getSitewideReadme(): Promise<GenerateReadmeDataReturns> {
    // Type narrowing: GenerateReadmeDataArgs is empty object (no args required)
    return this.callRpc<GenerateReadmeDataReturns>(
      'generate_readme_data',
      {} satisfies GenerateReadmeDataArgs,
      { methodName: 'getSitewideReadme' }
    );
  }

  async getSitewideContentList(
    args?: GetSitewideContentListArgs
  ): Promise<GetSitewideContentListReturns> {
    // Type narrowing: GetSitewideContentListArgs is optional, use empty object as fallback
    return this.callRpc<GetSitewideContentListReturns>(
      'get_sitewide_content_list',
      args ?? ({} satisfies GetSitewideContentListArgs),
      { methodName: 'getSitewideContentList' }
    );
  }

  async getCategoryContentList(
    args: GetCategoryContentListArgs
  ): Promise<GetCategoryContentListReturns> {
    return this.callRpc<GetCategoryContentListReturns>(
      'get_category_content_list',
      args,
      { methodName: 'getCategoryContentList' }
    );
  }

  async getSitewideLlmsTxt(): Promise<GenerateSitewideLlmsTxtReturns> {
    // Type narrowing: GenerateSitewideLlmsTxtArgs is empty object (no args required)
    return this.callRpc<GenerateSitewideLlmsTxtReturns>(
      'generate_sitewide_llms_txt',
      {} satisfies GenerateSitewideLlmsTxtArgs,
      { methodName: 'getSitewideLlmsTxt' }
    );
  }

  async getChangelogLlmsTxt(): Promise<GenerateChangelogLlmsTxtReturns> {
    // Type narrowing: GenerateChangelogLlmsTxtArgs is empty object (no args required)
    return this.callRpc<GenerateChangelogLlmsTxtReturns>(
      'generate_changelog_llms_txt',
      {} satisfies GenerateChangelogLlmsTxtArgs,
      { methodName: 'getChangelogLlmsTxt' }
    );
  }

  async getCategoryLlmsTxt(
    args: GenerateCategoryLlmsTxtArgs
  ): Promise<GenerateCategoryLlmsTxtReturns> {
    return this.callRpc<GenerateCategoryLlmsTxtReturns>(
      'generate_category_llms_txt',
      args,
      { methodName: 'getCategoryLlmsTxt' }
    );
  }

  async getChangelogEntryLlmsTxt(
    args: GenerateChangelogEntryLlmsTxtArgs
  ): Promise<GenerateChangelogEntryLlmsTxtReturns> {
    return this.callRpc<GenerateChangelogEntryLlmsTxtReturns>(
      'generate_changelog_entry_llms_txt',
      args,
      { methodName: 'getChangelogEntryLlmsTxt' }
    );
  }

  async getToolLlmsTxt(
    args: GenerateToolLlmsTxtArgs
  ): Promise<GenerateToolLlmsTxtReturns> {
    return this.callRpc<GenerateToolLlmsTxtReturns>(
      'generate_tool_llms_txt',
      args,
      { methodName: 'getToolLlmsTxt' }
    );
  }

  /**
   * Get category configs with features
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT with JSON transformations, which we can do in TypeScript.
   *
   * @returns Category configs with features matching the RPC return type for backward compatibility
   */
  async getCategoryConfigs(): Promise<GetCategoryConfigsWithFeaturesReturns> {
    // OPTIMIZATION: Use Prisma directly with request-scoped caching
    return withSmartCache<GetCategoryConfigsWithFeaturesReturns>(
      'getCategoryConfigs',
      'getCategoryConfigs',
      async (): Promise<GetCategoryConfigsWithFeaturesReturns> => {
        // OPTIMIZATION: Use select to fetch only needed fields, excluding timestamps
        // We use almost all fields, but exclude created_at/updated_at which aren't used
        const configs = await prisma.category_configs.findMany({
          select: {
            category: true,
            title: true,
            plural_title: true,
            description: true,
            icon_name: true,
            color_scheme: true,
            show_on_homepage: true,
            keywords: true,
            meta_description: true,
            sections: true,
            primary_action_type: true,
            primary_action_label: true,
            primary_action_config: true,
            search_placeholder: true,
            empty_state_message: true,
            url_slug: true,
            content_loader: true,
            display_config: true,
            config_format: true,
            validation_config: true,
            generation_config: true,
            schema_name: true,
            api_schema: true,
            metadata_fields: true,
            badges: true,
            // Exclude created_at and updated_at - not used in transformation
          },
          orderBy: { category: 'asc' },
        });

        // Transform to match RPC return type structure (CategoryConfigWithFeatures[])
        // The RPC extracts features from sections JSON and builds a composite type
        const transformed = configs.map((config: (typeof configs)[number]) => {
          // Extract sections JSON (default structure if missing)
          const sections =
            typeof config.sections === 'object' && config.sections !== null && !Array.isArray(config.sections)
              ? (config.sections as Record<string, unknown>)
              : {
                  examples: false,
                  features: true,
                  security: false,
                  use_cases: true,
                  installation: true,
                  configuration: true,
                  troubleshooting: true,
                };

          // Build features composite type (matching RPC logic)
          const features: CategoryConfigFeatures = {
            show_on_homepage: config.show_on_homepage,
            display_config: config.display_config,
            generate_full_content: true, // RPC hardcodes this
            build_enable_cache: true, // RPC hardcodes this
            api_generate_static: true, // RPC hardcodes this
            api_include_trending: true, // RPC hardcodes this
            section_features: typeof sections['features'] === 'boolean' ? sections['features'] : null,
            section_installation: typeof sections['installation'] === 'boolean' ? sections['installation'] : null,
            section_use_cases: typeof sections['use_cases'] === 'boolean' ? sections['use_cases'] : null,
            section_configuration: typeof sections['configuration'] === 'boolean' ? sections['configuration'] : null,
            section_security: typeof sections['security'] === 'boolean' ? sections['security'] : null,
            section_troubleshooting: typeof sections['troubleshooting'] === 'boolean' ? sections['troubleshooting'] : null,
            section_examples: typeof sections['examples'] === 'boolean' ? sections['examples'] : null,
            section_requirements: typeof sections['requirements'] === 'boolean' ? sections['requirements'] : null,
            section_description: typeof sections['description'] === 'boolean' ? sections['description'] : null,
            metadata_show_github_link: true, // RPC hardcodes this
          };

          // Build result matching CategoryConfigWithFeatures composite type
          const result: CategoryConfigWithFeatures = {
            category: config.category,
            title: config.title,
            plural_title: config.plural_title,
            description: config.description,
            icon_name: config.icon_name,
            color_scheme: config.color_scheme,
            keywords: config.keywords,
            meta_description: config.meta_description,
            search_placeholder: config.search_placeholder,
            empty_state_message: config.empty_state_message,
            url_slug: config.url_slug,
            content_loader: config.content_loader,
            config_format: config.config_format,
            primary_action_type: config.primary_action_type,
            primary_action_label: config.primary_action_label,
            primary_action_config: config.primary_action_config,
            validation_config: config.validation_config,
            generation_config: config.generation_config,
            schema_name: config.schema_name,
            api_schema: config.api_schema,
            metadata_fields: config.metadata_fields ?? null,
            badges: config.badges ?? null,
            features: features as CategoryConfigFeatures | null,
          };
          return result;
        });

        return transformed as unknown as GetCategoryConfigsWithFeaturesReturns;
      },
      {} // No args, so empty cache key
    );
  }

  async getApiContentFull(
    args: GetApiContentFullArgs
  ): Promise<GetApiContentFullReturns> {
    return this.callRpc<GetApiContentFullReturns>(
      'get_api_content_full',
      args,
      { methodName: 'getApiContentFull' }
    );
  }

  async generateMarkdownExport(
    args: GenerateMarkdownExportArgs
  ): Promise<GenerateMarkdownExportReturns> {
    return this.callRpc<GenerateMarkdownExportReturns>(
      'generate_markdown_export',
      args,
      { methodName: 'generateMarkdownExport' }
    );
  }

  async getItemLlmsTxt(
    args: GenerateItemLlmsTxtArgs
  ): Promise<GenerateItemLlmsTxtReturns> {
    return this.callRpc<GenerateItemLlmsTxtReturns>(
      'generate_item_llms_txt',
      args,
      { methodName: 'getItemLlmsTxt' }
    );
  }

  async getSkillStoragePath(
    args: GetSkillStoragePathArgs
  ): Promise<GetSkillStoragePathReturns> {
    return this.callRpc<GetSkillStoragePathReturns>(
      'get_skill_storage_path',
      args,
      { methodName: 'getSkillStoragePath' }
    );
  }

  async getMcpbStoragePath(
    args: GetMcpbStoragePathArgs
  ): Promise<GetMcpbStoragePathReturns> {
    return this.callRpc<GetMcpbStoragePathReturns>(
      'get_mcpb_storage_path',
      args,
      { methodName: 'getMcpbStoragePath' }
    );
  }

  async getContentDetailComplete(
    args: GetContentDetailCompleteArgs
  ): Promise<GetContentDetailCompleteReturns> {
    return this.callRpc<GetContentDetailCompleteReturns>(
      'get_content_detail_complete',
      args,
      { methodName: 'getContentDetailComplete' }
    );
  }

  /**
   * Get enriched content list
   * 
   * Converts RPC to Prisma query with LEFT JOIN for sponsored content.
   * Returns enriched content items with sponsorship information.
   * 
   * Uses Prisma $queryRawUnsafe for complex queries with dynamic WHERE clauses.
   * This is safe because we're using parameterized queries.
   */
  async getEnrichedContentList(args: {
    p_category?: content_category | null;
    p_slugs?: string[] | null;
    p_limit?: number;
    p_offset?: number;
  }): Promise<EnrichedContentItem[]> {
    const { p_category, p_slugs, p_limit = 100, p_offset = 0 } = args;

    // Build WHERE conditions dynamically
    const whereParts: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (p_category !== null && p_category !== undefined) {
      whereParts.push(`c.category = $${paramIndex}::content_category`);
      queryParams.push(p_category);
      paramIndex++;
    }

    if (p_slugs && p_slugs.length > 0) {
      whereParts.push(`c.slug = ANY($${paramIndex}::text[])`);
      queryParams.push(p_slugs);
      paramIndex++;
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    // Add limit and offset parameters
    queryParams.push(p_limit, p_offset);
    const limitParam = `$${paramIndex}::integer`;
    const offsetParam = `$${paramIndex + 1}::integer`;

    // OPTIMIZATION: Use withSmartCache for request-scoped caching
    return withSmartCache(
      'get_enriched_content_list',
      'getEnrichedContentList',
      async () => {
        // Execute query with LEFT JOIN to sponsored_content
        const query = `
          SELECT
            c.id,
            c.slug,
            c.title,
            c.display_title,
            c.seo_title,
            c.description,
            c.author,
            c.author_profile_url,
            c.category,
            c.tags,
            c.category::text as source_table,
            c.created_at,
            c.updated_at,
            c.date_added,
            c.features,
            c.use_cases,
            c.source,
            c.documentation_url,
            c.metadata,
            COALESCE(c.view_count, 0)::integer as view_count,
            COALESCE(c.copy_count, 0)::integer as copy_count,
            COALESCE(c.bookmark_count, 0)::integer as bookmark_count,
            COALESCE(c.popularity_score, 0)::numeric as popularity_score,
            0::integer as trending_score,
            sc.id as sponsored_content_id,
            sc.tier::text as sponsorship_tier,
            COALESCE(sc.active, false)::boolean as is_sponsored
          FROM content c
          LEFT JOIN sponsored_content sc 
            ON sc.content_id = c.id 
            AND sc.content_type = c.category
            AND sc.active = true 
            AND CURRENT_TIMESTAMP BETWEEN sc.start_date AND sc.end_date
          ${whereClause}
          ORDER BY c.slug
          LIMIT ${limitParam}
          OFFSET ${offsetParam}
        `;

        // Type narrowing: $queryRawUnsafe returns unknown[], validate structure
        const rawResult = await prisma.$queryRawUnsafe(query, ...queryParams);
        const result = Array.isArray(rawResult) 
          ? (rawResult satisfies EnrichedContentItem[])
          : [];
        return result;
      },
      args
    );
  }

  async getContentPaginated(
    args: GetContentPaginatedArgs
  ): Promise<GetContentPaginatedReturns> {
    return this.callRpc<GetContentPaginatedReturns>(
      'get_content_paginated',
      args,
      { methodName: 'getContentPaginated' }
    );
  }

  async getHomepageComplete(
    args: GetHomepageCompleteArgs
  ): Promise<GetHomepageCompleteReturns> {
    return this.callRpc<GetHomepageCompleteReturns>(
      'get_homepage_complete',
      args,
      { methodName: 'getHomepageComplete' }
    );
  }

  async getReviewsWithStats(
    args: GetReviewsWithStatsArgs
  ): Promise<GetReviewsWithStatsReturns> {
    return this.callRpc<GetReviewsWithStatsReturns>(
      'get_reviews_with_stats',
      args,
      { methodName: 'getReviewsWithStats' }
    );
  }

  async getRelatedContent(
    args: GetRelatedContentArgs
  ): Promise<GetRelatedContentReturns> {
    return this.callRpc<GetRelatedContentReturns>(
      'get_related_content',
      args,
      { methodName: 'getRelatedContent' }
    );
  }

  // getSimilarContent removed - embedding generation system has been deleted
  // Similar content feature used content_similarities table, not embeddings
  // If needed in future, implement using content_similarities table directly

  /**
   * Get content templates by category
   * 
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing simple transformations that we can do in TypeScript with better type safety.
   * 
   * @param args - Arguments with category filter
   * @returns Content templates result matching the RPC return type for backward compatibility
   */
  async getContentTemplates(
    args: GetContentTemplatesArgs
  ): Promise<ContentTemplatesResult> {
    // OPTIMIZATION: Use Prisma directly with request-scoped caching
    return withSmartCache(
      'getContentTemplates',
      'getContentTemplates',
      async () => {
        const { p_category } = args;
        
        // Use Prisma to fetch templates directly
        // OPTIMIZATION: Select only needed fields to reduce data transfer
        const templates = await prisma.content_templates.findMany({
          where: {
            category: p_category,
            active: true,
          },
          select: {
            id: true,
            category: true,
            name: true,
            description: true,
            template_data: true,
            // Note: display_order not needed in result, but used for ordering
          },
          orderBy: [
            { display_order: 'asc' },
            { name: 'asc' },
          ],
        });

        // Transform to match RPC return type structure (ContentTemplatesResult)
        // The RPC extracts some fields from template_data JSON, we do the same here
        const transformedTemplates: ContentTemplatesItem[] = templates.map((template: (typeof templates)[number]) => {
          const templateData = template.template_data;
          const templateDataObj = 
            typeof templateData === 'object' && templateData !== null && !Array.isArray(templateData)
              ? (templateData as Record<string, unknown>)
              : {};

          return {
            id: template.id,
            type: template.category, // RPC returns category as "type"
            name: template.name,
            description: template.description,
            category: typeof templateDataObj['category'] === 'string' 
              ? templateDataObj['category'] 
              : null,
            tags: typeof templateDataObj['tags'] === 'string'
              ? templateDataObj['tags']
              : null,
            template_data: templateData as Record<string, unknown> | null,
          };
        });

        // Return in RPC format for backward compatibility
        return {
          templates: transformedTemplates.length > 0 ? transformedTemplates : null,
        };
      },
      args // Cache key includes category
    );
  }

  /**
   * Get content paginated slim
   * 
   * Converts RPC to Prisma query using materialized view mv_content_list_slim.
   * Returns paginated content with pagination metadata.
   * 
   * Note: This uses a materialized view, so we use $queryRawUnsafe for the complex query.
   */
  async getContentPaginatedSlim(args: {
    p_category?: content_category | null;
    p_limit?: number;
    p_offset?: number;
    p_order_by?: string;
    p_order_direction?: string;
  }): Promise<ContentPaginatedSlimResult> {
    // OPTIMIZATION: Use withSmartCache for request-scoped caching
    return withSmartCache(
      'get_content_paginated_slim',
      'getContentPaginatedSlim',
      async () => {
        const {
          p_category,
          p_limit = 30,
          p_offset = 0,
          p_order_by = 'created_at',
          p_order_direction = 'desc',
        } = args;

        // Validate inputs
        if (p_limit < 1 || p_limit > 100) {
          throw new Error('Invalid limit: must be between 1 and 100');
        }
        if (p_offset < 0) {
          throw new Error('Invalid offset: must be >= 0');
        }
        if (!['created_at', 'popularity_score', 'view_count'].includes(p_order_by)) {
          throw new Error('Invalid order_by: must be created_at, popularity_score, or view_count');
        }
        if (!['asc', 'desc'].includes(p_order_direction)) {
          throw new Error('Invalid order_direction: must be asc or desc');
        }

        // Build ORDER BY clause
        const orderClause =
          p_order_by === 'created_at'
            ? `c.created_at ${p_order_direction.toUpperCase()}`
            : p_order_by === 'popularity_score'
              ? `COALESCE(c.popularity_score, 0) ${p_order_direction.toUpperCase()}, c.created_at DESC`
              : `COALESCE(c.view_count, 0) ${p_order_direction.toUpperCase()}, c.created_at DESC`;

        // OPTIMIZATION: Use window function COUNT(*) OVER() to get total count in same query
        // This eliminates a separate database round trip, improving performance
        const whereClause = p_category ? `WHERE c.category = $1::text` : '';
        const queryParams: unknown[] = [];
        let paramIndex = 1;

        if (p_category) {
          queryParams.push(p_category);
          paramIndex++;
        }

        queryParams.push(p_limit, p_offset);
        const limitParam = `$${paramIndex}::integer`;
        const offsetParam = `$${paramIndex + 1}::integer`;

        // Combined query with window function for count - eliminates separate count query
        const itemsQuery = `
          SELECT
            c.id,
            c.slug,
            c.title,
            c.display_title,
            c.description,
            c.author,
            c.author_profile_url,
            c.category,
            c.tags,
            c.source,
            c.source_table,
            c.created_at,
            c.updated_at,
            c.date_added,
            c.view_count,
            c.copy_count,
            c.bookmark_count,
            c.popularity_score,
            c.trending_score,
            c.sponsored_content_id,
            c.sponsorship_tier,
            c.is_sponsored,
            COUNT(*) OVER()::bigint as total_count
          FROM mv_content_list_slim c
          ${whereClause}
          ORDER BY ${orderClause}
          LIMIT ${limitParam}
          OFFSET ${offsetParam}
        `;

        const itemsRaw = await prisma.$queryRawUnsafe(
          itemsQuery,
          ...queryParams
        );

        // Type narrowing: Extract items and total count from query result
        if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
          return {
            items: [],
            pagination: {
              total_count: 0,
              limit: p_limit,
              offset: p_offset,
              has_more: false,
              current_page: 1,
              total_pages: 0,
            },
          };
        }

        // Extract total_count from first row (window function returns same value for all rows)
        const firstRow = itemsRaw[0];
        let totalCount = 0;
        if (
          typeof firstRow === 'object' &&
          firstRow !== null &&
          'total_count' in firstRow &&
          typeof (firstRow as { total_count: unknown }).total_count === 'bigint'
        ) {
          totalCount = Number((firstRow as { total_count: bigint }).total_count);
        }

        // Remove total_count from items (it's not part of ContentPaginatedSlimItem)
        const items = itemsRaw.map((row) => {
          if (typeof row === 'object' && row !== null && 'total_count' in row) {
            const { total_count, ...item } = row as { total_count: bigint } & ContentPaginatedSlimItem;
            return item;
          }
          return row;
        }) as ContentPaginatedSlimItem[];

        // Calculate pagination
        const currentPage = Math.floor(p_offset / p_limit) + 1;
        const totalPages = Math.ceil(totalCount / p_limit);
        const hasMore = p_offset + p_limit < totalCount;

        return {
          items,
          pagination: {
            total_count: totalCount,
            limit: p_limit,
            offset: p_offset,
            has_more: hasMore,
            current_page: currentPage,
            total_pages: totalPages,
          },
        };
      },
      args
    );
  }

  /**
   * Get content detail core
   * 
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a SELECT with conditional LEFT JOIN for collection items.
   * Since collection_items doesn't have a direct relation to content (polymorphic via content_type+slug),
   * we fetch collection items separately and then fetch related content.
   * 
   * @param args - Arguments with p_category and p_slug
   * @returns Content detail with collection items (if category is 'collections') matching RPC return structure
   */
  async getContentDetailCore(
    args: GetContentDetailCoreArgs
  ): Promise<GetContentDetailCoreReturns> {
    return withSmartCache(
      'getContentDetailCore',
      'getContentDetailCore',
      async () => {
        // Fetch content
        // OPTIMIZATION: Use select to fetch only needed fields, reducing data transfer
        // This query uses most fields, but excludes large JSONB fields that aren't used
        const content = await prisma.content.findUnique({
          where: {
            slug_category: {
              slug: args.p_slug,
              category: args.p_category,
            },
          },
          select: {
            id: true,
            category: true,
            slug: true,
            title: true,
            display_title: true,
            seo_title: true,
            description: true,
            author: true,
            author_profile_url: true,
            date_added: true,
            tags: true,
            content: true,
            source: true,
            documentation_url: true,
            features: true,
            use_cases: true,
            examples: true,
            metadata: true,
            popularity_score: true,
            created_at: true,
            updated_at: true,
            // Exclude large/unused fields: internal_notes, seo_description, etc.
          },
        });

        if (!content) {
          // RPC returns NULL when content not found, cast through unknown to match GetContentDetailCoreReturns
          return null as unknown as GetContentDetailCoreReturns;
        }

        // Build content JSONB object matching RPC structure
        const contentJson = {
          id: content.id,
          category: content.category,
          slug: content.slug,
          title: content.title,
          display_title: content.display_title,
          seo_title: content.seo_title,
          description: content.description,
          author: content.author,
          author_profile_url: content.author_profile_url,
          date_added: content.date_added.toISOString().split('T')[0], // Date only
          tags: content.tags,
          content: content.content,
          source: content.source,
          documentation_url: content.documentation_url,
          features: content.features,
          use_cases: content.use_cases,
          examples: content.examples,
          metadata: content.metadata,
          popularity_score: content.popularity_score,
          created_at: content.created_at.toISOString(),
          updated_at: content.updated_at.toISOString(),
        };

        // Build collection items array (only if category is 'collections')
        let collectionItems: Array<{
          id: string;
          collection_id: string;
          content_type: string;
          content_slug: string;
          order: number;
          added_at: string;
          title: string | null;
          description: string | null;
          author: string | null;
        }> = [];

        // OPTIMIZATION: Fetch collection items and content in parallel when category is 'collections'
        // This reduces sequential queries from 2+ to 1 parallel batch
        if (args.p_category === 'collections') {
          // Fetch collection items for this collection (content.id is the collection_id)
          const items = await prisma.collection_items.findMany({
            where: { collection_id: content.id },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              collection_id: true,
              content_type: true,
              content_slug: true,
              order: true,
              added_at: true,
            },
          });

          // Fetch related content for each item (polymorphic relationship via content_type + content_slug)
          if (items.length > 0) {
            // Build array of unique content lookups
            const contentLookups = items.map((item: (typeof items)[number]) => ({
              slug: item.content_slug,
              category: item.content_type,
            }));

            // OPTIMIZATION: Fetch all related content in parallel (already optimized)
            const relatedContentPromises = contentLookups.map((lookup: (typeof contentLookups)[number]) =>
              prisma.content.findUnique({
                where: {
                  slug_category: {
                    slug: lookup.slug,
                    category: lookup.category,
                  },
                },
                select: {
                  title: true,
                  description: true,
                  author: true,
                },
              })
            );

            const relatedContent = await Promise.all(relatedContentPromises);

            // Map items to collection_items with related content
            collectionItems = items.map((item: (typeof items)[number], index: number) => ({
              id: item.id,
              collection_id: item.collection_id,
              content_type: item.content_type,
              content_slug: item.content_slug,
              order: item.order,
              added_at: item.added_at.toISOString(),
              title: relatedContent[index]?.title ?? null,
              description: relatedContent[index]?.description ?? null,
              author: relatedContent[index]?.author ?? null,
            }));
          }
        }

        // Return structure matching RPC (content_detail_core_result)
        // Note: GetContentDetailCoreReturns is unknown, so we cast to match the structure
        return {
          content: contentJson as unknown as Json,
          collection_items: collectionItems,
        } as GetContentDetailCoreReturns;
      },
      args
    );
  }

  async getContentAnalytics(
    args: GetContentAnalyticsArgs
  ): Promise<GetContentAnalyticsReturns> {
    return this.callRpc<GetContentAnalyticsReturns>(
      'get_content_analytics',
      args,
      { methodName: 'getContentAnalytics' }
    );
  }

  async getHomepageOptimized(
    args: GetHomepageOptimizedArgs
  ): Promise<GetHomepageOptimizedReturns> {
    return this.callRpc<GetHomepageOptimizedReturns>(
      'get_homepage_optimized',
      args,
      { methodName: 'getHomepageOptimized' }
    );
  }

  async generateChangelogRssFeed(
    args?: GenerateChangelogRssFeedArgs
  ): Promise<GenerateChangelogRssFeedReturns> {
    return this.callRpc<GenerateChangelogRssFeedReturns>(
      'generate_changelog_rss_feed',
      args ?? ({} satisfies GenerateChangelogRssFeedArgs),
      { methodName: 'generateChangelogRssFeed' }
    );
  }

  async generateChangelogAtomFeed(
    args?: GenerateChangelogAtomFeedArgs
  ): Promise<GenerateChangelogAtomFeedReturns> {
    return this.callRpc<GenerateChangelogAtomFeedReturns>(
      'generate_changelog_atom_feed',
      args ?? ({} satisfies GenerateChangelogAtomFeedArgs),
      { methodName: 'generateChangelogAtomFeed' }
    );
  }

  async generateContentRssFeed(
    args?: GenerateContentRssFeedArgs
  ): Promise<GenerateContentRssFeedReturns> {
    return this.callRpc<GenerateContentRssFeedReturns>(
      'generate_content_rss_feed',
      args ?? ({} satisfies GenerateContentRssFeedArgs),
      { methodName: 'generateContentRssFeed' }
    );
  }

  async generateContentAtomFeed(
    args?: GenerateContentAtomFeedArgs
  ): Promise<GenerateContentAtomFeedReturns> {
    return this.callRpc<GenerateContentAtomFeedReturns>(
      'generate_content_atom_feed',
      args ?? ({} satisfies GenerateContentAtomFeedArgs),
      { methodName: 'generateContentAtomFeed' }
    );
  }

  async getWeeklyDigest(
    args?: GetWeeklyDigestArgs
  ): Promise<GetWeeklyDigestReturns> {
    return this.callRpc<GetWeeklyDigestReturns>(
      'get_weekly_digest',
      args ?? ({} satisfies GetWeeklyDigestArgs),
      { methodName: 'getWeeklyDigest' }
    );
  }
}
