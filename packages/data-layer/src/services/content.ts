import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

// ... existing types ...
export type SitewideReadmeResult = Database['public']['Functions']['generate_readme_data']['Returns'];
export type CategoryConfigsResult =
  Database['public']['Functions']['get_category_configs_with_features']['Returns'];
export type ApiContentFullResult = Database['public']['Functions']['get_api_content_full']['Returns'];
export type ContentDetailResult = Database['public']['Functions']['get_content_detail_complete']['Returns'];
export type EnrichedContentListResult = Database['public']['Functions']['get_enriched_content_list']['Returns'];
export type ContentPaginatedResult = Database['public']['Functions']['get_content_paginated']['Returns'];
export type HomepageCompleteResult = Database['public']['Functions']['get_homepage_complete']['Returns'];
export type ReviewsWithStatsResult = Database['public']['Functions']['get_reviews_with_stats']['Returns'];
export type RelatedContentResult = Database['public']['Functions']['get_related_content']['Returns'];
export type SimilarContentResult = Database['public']['Functions']['get_similar_content']['Returns'];
export type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
export type ContentPaginatedSlimResult = Database['public']['Functions']['get_content_paginated_slim']['Returns'];
export type SitewideLlmsResult = Database['public']['Functions']['generate_sitewide_llms_txt']['Returns'];
export type ChangelogLlmsResult = Database['public']['Functions']['generate_changelog_llms_txt']['Returns'];
export type CategoryLlmsResult = Database['public']['Functions']['generate_category_llms_txt']['Returns'];
export type ChangelogEntryLlmsResult = Database['public']['Functions']['generate_changelog_entry_llms_txt']['Returns'];
export type ToolLlmsResult = Database['public']['Functions']['generate_tool_llms_txt']['Returns'];

export interface ContentFilterOptions {
  categories?: Database['public']['Enums']['content_category'][] | undefined;
  tags?: string[] | undefined;
  search?: string;
  author?: string;
  orderBy?: 'slug' | 'created_at' | 'updated_at' | 'title';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ReviewsFilterOptions {
  contentType: Database['public']['Enums']['content_category'];
  contentSlug: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
  userId?: string;
}

export interface RelatedContentOptions {
  category: Database['public']['Enums']['content_category'];
  slug: string;
  tags?: string[] | undefined;
  limit?: number;
  excludeSlugs?: string[];
}

export interface SimilarContentOptions {
  contentType: Database['public']['Enums']['content_category'];
  contentSlug: string;
  limit?: number;
}

export class ContentService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getSitewideReadme() {
    const { data, error } = await this.supabase.rpc('generate_readme_data');
    if (error) throw error;
    return data as SitewideReadmeResult;
  }

  async getSitewideLlmsTxt() {
    const { data, error } = await this.supabase.rpc('generate_sitewide_llms_txt');
    if (error) throw error;
    return data as SitewideLlmsResult;
  }

  async getChangelogLlmsTxt() {
    const { data, error } = await this.supabase.rpc('generate_changelog_llms_txt');
    if (error) throw error;
    return data as ChangelogLlmsResult;
  }

  async getCategoryLlmsTxt(category: Database['public']['Enums']['content_category']) {
    const { data, error } = await this.supabase.rpc('generate_category_llms_txt', {
      p_category: category,
    });
    if (error) throw error;
    return data as CategoryLlmsResult;
  }

  async getChangelogEntryLlmsTxt(slug: string) {
    const { data, error } = await this.supabase.rpc('generate_changelog_entry_llms_txt', {
      p_slug: slug,
    });
    if (error) throw error;
    return data as ChangelogEntryLlmsResult;
  }

  async getToolLlmsTxt(toolName: string) {
    const { data, error } = await this.supabase.rpc('generate_tool_llms_txt', {
      p_tool_name: toolName,
    });
    if (error) throw error;
    return data as ToolLlmsResult;
  }

  async getCategoryConfigs() {
    const { data, error } = await this.supabase.rpc('get_category_configs_with_features');
    if (error) throw error;
    return data as CategoryConfigsResult;
  }

  async getApiContentFull(
    category: Database['public']['Enums']['content_category'] | 'mcp',
    slug: string,
    baseUrl = ''
  ) {
    const { data, error } = await this.supabase.rpc('get_api_content_full', {
      p_category: category,
      p_slug: slug,
      p_base_url: baseUrl,
    });
    if (error) throw error;
    return data as ApiContentFullResult;
  }

  async getContentDetailComplete(
    category: Database['public']['Enums']['content_category'],
    slug: string
  ) {
    const { data, error } = await this.supabase.rpc('get_content_detail_complete', {
      p_category: category,
      p_slug: slug
    });
    if (error) throw error;
    return data as ContentDetailResult;
  }

  async getEnrichedContentList(category: Database['public']['Enums']['content_category'], limit = 1000, offset = 0) {
    const { data, error } = await this.supabase.rpc('get_enriched_content_list', {
      p_category: category,
      p_limit: limit,
      p_offset: offset
    });
    if (error) throw error;
    return data as EnrichedContentListResult;
  }
  
  async getEnrichedContentBySlug(
    category: Database['public']['Enums']['content_category'],
    slug: string
  ) {
    const { data, error } = await this.supabase.rpc('get_enriched_content_list', {
      p_category: category,
      p_slugs: [slug],
      p_limit: 1,
      p_offset: 0
    });
    if (error) throw error;
    return data?.[0] ?? null;
  }

  async getContentPaginated(filters: ContentFilterOptions = {}) {
    const categoryArg = filters.categories?.[0];
    const tagsArg = filters.tags && filters.tags.length > 0 ? filters.tags : undefined;
    const rpcArgs: Database['public']['Functions']['get_content_paginated']['Args'] = {
      ...(categoryArg ? { p_category: categoryArg } : {}),
      ...(tagsArg ? { p_tags: tagsArg } : {}),
      ...(filters.search ? { p_search: filters.search } : {}),
      ...(filters.author ? { p_author: filters.author } : {}),
      p_order_by: filters.orderBy ?? 'created_at',
      p_order_direction: filters.orderDirection ?? 'desc',
      p_limit: filters.limit ?? 1000,
      p_offset: filters.offset ?? 0,
    };

    const { data, error } = await this.supabase.rpc('get_content_paginated', rpcArgs);
    if (error) throw error;
    return data as ContentPaginatedResult;
  }

  async getHomepageComplete(categoryIds: string[]) {
    const { data, error } = await this.supabase.rpc('get_homepage_complete', {
      p_category_ids: categoryIds
    });
    if (error) throw error;
    return data as HomepageCompleteResult;
  }

  async getReviewsWithStats(filters: ReviewsFilterOptions) {
    const { data, error } = await this.supabase.rpc('get_reviews_with_stats', {
      p_content_type: filters.contentType,
      p_content_slug: filters.contentSlug,
      ...(filters.sortBy ? { p_sort_by: filters.sortBy } : {}),
      ...(filters.limit ? { p_limit: filters.limit } : {}),
      ...(filters.offset ? { p_offset: filters.offset } : {}),
      ...(filters.userId ? { p_user_id: filters.userId } : {})
    });
    if (error) throw error;
    return data as ReviewsWithStatsResult;
  }

  async getRelatedContent(options: RelatedContentOptions) {
    const { data, error } = await this.supabase.rpc('get_related_content', {
      p_category: options.category,
      p_slug: options.slug,
      p_tags: options.tags ?? [],
      p_limit: options.limit ?? 3,
      p_exclude_slugs: options.excludeSlugs ?? []
    });
    if (error) throw error;
    return data as RelatedContentResult;
  }

  async getSimilarContent(options: SimilarContentOptions) {
    const { data, error } = await this.supabase.rpc('get_similar_content', {
      p_content_type: options.contentType,
      p_content_slug: options.contentSlug,
      p_limit: options.limit ?? 6
    });
    if (error) throw error;
    return data as SimilarContentResult;
  }

  async getContentTemplates(category: Database['public']['Enums']['content_category']) {
    const { data, error } = await this.supabase.rpc('get_content_templates', {
      p_category: category
    });
    if (error) throw error;
    return data as ContentTemplatesResult;
  }

  async getContentPaginatedSlim(category: string | null, limit: number, offset: number) {
    const categoryArg = category as Database['public']['Enums']['content_category'] | null;
    
    const { data, error } = await this.supabase.rpc('get_content_paginated_slim', {
      ...(categoryArg ? { p_category: categoryArg } : {}),
      p_limit: limit,
      p_offset: offset
    });
    if (error) throw error;
    return data as ContentPaginatedSlimResult;
  }
}
