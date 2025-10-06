/**
 * Jobs Data Layer
 * Fetches job listings from Supabase database
 *
 * Migration: Moved from static JSON to database for dynamic content management
 */

import { logger } from '@/src/lib/logger';
import { type JobContent, jobContentSchema } from '@/src/lib/schemas/content/job.schema';
import { createClient } from '@/src/lib/supabase/server';

export type Job = JobContent;

/**
 * Get all active jobs
 */
export async function getJobs(): Promise<Job[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .eq('active', true)
      .order('order', { ascending: false })
      .order('posted_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch jobs', error);
      return [];
    }

    // Transform database records to JobContent type
    return (data || []).map((job) => jobContentSchema.parse(job));
  } catch (error) {
    logger.error('Error in getJobs', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Get a job by slug
 */
export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return undefined;
    }

    return jobContentSchema.parse(data);
  } catch (error) {
    logger.error(
      'Error in getJobBySlug',
      error instanceof Error ? error : new Error(String(error))
    );
    return undefined;
  }
}

/**
 * Get featured jobs (premium/featured plans)
 */
export async function getFeaturedJobs(): Promise<Job[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .eq('active', true)
      .in('plan', ['featured', 'premium'])
      .order('order', { ascending: false })
      .order('posted_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch featured jobs', error);
      return [];
    }

    return (data || []).map((job) => jobContentSchema.parse(job));
  } catch (error) {
    logger.error(
      'Error in getFeaturedJobs',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get jobs by category
 */
export async function getJobsByCategory(category: string): Promise<Job[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .eq('active', true)
      .eq('category', category)
      .order('posted_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch jobs by category', error);
      return [];
    }

    return (data || []).map((job) => jobContentSchema.parse(job));
  } catch (error) {
    logger.error(
      'Error in getJobsByCategory',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get jobs count (for stats)
 */
export async function getJobsCount(): Promise<number> {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('active', true);

    if (error) {
      logger.error('Failed to fetch jobs count', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error(
      'Error in getJobsCount',
      error instanceof Error ? error : new Error(String(error))
    );
    return 0;
  }
}

// Backwards compatibility export
export const jobs: Job[] = [];
// Note: This empty array is for backwards compatibility only
// All code should now use getJobs() instead of importing static jobs array
