import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type JobRow = Database['public']['Tables']['jobs']['Row'];
export type JobDetailResult = Database['public']['Functions']['get_job_detail']['Returns'];

export class JobsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getJobs() {
    // Note: web-runtime maps this to JobRow manually adding fields.
    // We will return the raw RPC result, and let the consumer or a transformer handle the mapping if strictly needed,
    // but ideally we return typed data.
    const { data, error } = await this.supabase.rpc('get_jobs_list');
    if (error) throw error;
    return data ?? [];
  }

  async getJobBySlug(slug: string) {
    const { data, error } = await this.supabase.rpc('get_job_detail', { p_slug: slug });
    if (error) throw error;
    return data;
  }

  async getFeaturedJobs() {
    const { data, error } = await this.supabase.rpc('get_featured_jobs');
    if (error) throw error;
    return data ?? [];
  }

  async getJobsByCategory(category: string) {
    const { data, error } = await this.supabase.rpc('get_jobs_by_category', { p_category: category });
    if (error) throw error;
    return data ?? [];
  }

  async getJobsCount() {
    const { data, error } = await this.supabase.rpc('get_jobs_count');
    if (error) throw error;
    return data ?? 0;
  }
}
