import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type SeoMetadataResult = Database['public']['Functions']['generate_metadata_complete']['Returns'];

export class SeoService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Generate complete metadata for a route (title, description, OG tags, schema.org)
   * Maps to `generate_metadata_complete` RPC
   */
  async generateMetadata(route: string, include: string = 'metadata') {
    const rpcArgs = {
      p_route: route,
      p_include: include,
    };
    
    const { data, error } = await this.supabase.rpc('generate_metadata_complete', rpcArgs);
    
    if (error) throw error;
    
    // The RPC returns a composite type which Supabase client automatically parses to an object
    // but we should ensure it's not null
    return data as SeoMetadataResult;
  }
}
