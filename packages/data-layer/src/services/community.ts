import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CommunityDirectoryResult = Database['public']['Functions']['get_community_directory']['Returns'];
export type UserProfileResult = Database['public']['Functions']['get_user_profile']['Returns'];
export type UserCollectionDetailResult = Database['public']['Functions']['get_user_collection_detail']['Returns'];

export class CommunityService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getCommunityDirectory(limit: number) {
    const { data, error } = await this.supabase.rpc('get_community_directory', { p_limit: limit });
    if (error) throw error;
    return data as CommunityDirectoryResult;
  }

  async getUserProfile(slug: string, viewerId?: string) {
    const { data, error } = await this.supabase.rpc('get_user_profile', {
        p_user_slug: slug,
        ...(viewerId ? { p_viewer_id: viewerId } : {})
    });
    if (error) throw error;
    return data as UserProfileResult;
  }

  async getUserCollectionDetail(userSlug: string, collectionSlug: string, viewerId?: string) {
    const { data, error } = await this.supabase.rpc('get_user_collection_detail', {
        p_user_slug: userSlug,
        p_collection_slug: collectionSlug,
        ...(viewerId ? { p_viewer_id: viewerId } : {})
    });
    if (error) throw error;
    return data as UserCollectionDetailResult;
  }
}
