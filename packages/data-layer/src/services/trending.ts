import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type TrendingMetricsRow = Database['public']['Functions']['get_trending_metrics_with_content']['Returns'][number];
export type PopularContentRow = Database['public']['Functions']['get_popular_content']['Returns'][number];
export type RecentContentRow = Database['public']['Functions']['get_recent_content']['Returns'][number];
export type TrendingContentRow = Database['public']['Functions']['get_trending_content']['Returns'][number];

export class TrendingService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getTrendingMetrics(category: Database['public']['Enums']['content_category'] | null, limit: number) {
    const rpcArgs = {
      ...(category !== null && category !== undefined ? { p_category: category } : {}),
      p_limit: limit,
    };
    const { data, error } = await this.supabase.rpc('get_trending_metrics_with_content', rpcArgs);
    if (error) throw error;
    return (data as TrendingMetricsRow[]) ?? [];
  }

  async getPopularContent(category: Database['public']['Enums']['content_category'] | null, limit: number) {
    const rpcArgs = {
      ...(category !== null && category !== undefined ? { p_category: category } : {}),
      p_limit: limit,
    };
    const { data, error } = await this.supabase.rpc('get_popular_content', rpcArgs);
    if (error) throw error;
    return (data as PopularContentRow[]) ?? [];
  }

  async getRecentContent(category: Database['public']['Enums']['content_category'] | null, limit: number) {
    const rpcArgs = {
      ...(category !== null && category !== undefined ? { p_category: category } : {}),
      p_limit: limit,
      p_days: 30,
    };
    const { data, error } = await this.supabase.rpc('get_recent_content', rpcArgs);
    if (error) throw error;
    return (data as RecentContentRow[]) ?? [];
  }

  async getTrendingContent(category: Database['public']['Enums']['content_category'] | null, limit: number) {
    const rpcArgs = {
      ...(category !== null && category !== undefined ? { p_category: category } : {}),
      p_limit: limit,
    };
    const { data, error } = await this.supabase.rpc('get_trending_content', rpcArgs);
    if (error) throw error;
    return (data as TrendingContentRow[]) ?? [];
  }
}
