import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ChangelogOverviewResult = Database['public']['Functions']['get_changelog_overview']['Returns'];
export type ChangelogDetailResult = Database['public']['Functions']['get_changelog_detail']['Returns'];

export interface ChangelogOverviewOptions {
  category?: Database['public']['Enums']['changelog_category'];
  publishedOnly?: boolean;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}

export class ChangelogService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getChangelogOverview(options: ChangelogOverviewOptions = {}) {
    const { category, publishedOnly = true, featuredOnly = false, limit = 50, offset = 0 } = options;
    
    const rpcArgs: Database['public']['Functions']['get_changelog_overview']['Args'] = {
      ...(category ? { p_category: category } : {}),
      p_published_only: publishedOnly,
      p_featured_only: featuredOnly,
      p_limit: limit,
      p_offset: offset,
    };
    
    const { data, error } = await this.supabase.rpc('get_changelog_overview', rpcArgs);
    if (error) throw error;
    
    return data as ChangelogOverviewResult;
  }

  async getChangelogDetail(slug: string) {
    const { data, error } = await this.supabase.rpc('get_changelog_detail', { p_slug: slug });
    if (error) throw error;
    
    return data as ChangelogDetailResult;
  }
}
