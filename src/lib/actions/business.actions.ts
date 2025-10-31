'use server';

/**
 * Business Actions - Database-First Architecture
 * All business logic in PostgreSQL via RPC functions.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { configSubmissionSchema } from '@/src/lib/schemas/form.schema';
import {
  publicCompaniesInsertSchema,
  publicCompaniesUpdateSchema,
  publicJobsInsertSchema,
  publicJobsUpdateSchema,
  publicSponsoredClicksInsertSchema,
  publicSponsoredImpressionsInsertSchema,
} from '@/src/lib/schemas/generated/db-schemas';
import { nonNegativeInt } from '@/src/lib/schemas/primitives';
import { createClient } from '@/src/lib/supabase/server';
import type { Json, Tables } from '@/src/types/database.types';

export const submitConfiguration = rateLimitedAction
  .metadata({
    actionName: 'submitConfiguration',
    category: 'form',
  })
  .schema(configSubmissionSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to submit content');
    }

    // Submit to database via RPC (all validation in PostgreSQL)
    const { data, error } = await supabase.rpc('submit_content_for_review', {
      p_submission_type: parsedInput.submission_type,
      p_name: parsedInput.name,
      p_description: parsedInput.description,
      p_category: parsedInput.category,
      p_author: parsedInput.author,
      ...(parsedInput.author_profile_url && {
        p_author_profile_url: parsedInput.author_profile_url,
      }),
      ...(parsedInput.github_url && { p_github_url: parsedInput.github_url }),
      ...(parsedInput.tags && { p_tags: parsedInput.tags }),
      p_content_data: {} as Json,
    });

    if (error) {
      logger.error('Submission RPC failed', new Error(error.message));
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('No data returned from submission RPC');
    }

    const result = data as unknown as {
      success: boolean;
      submission_id: string;
      status: string;
      message: string;
    };

    // Revalidate pages
    revalidatePath('/submit');

    // Return success
    return {
      success: true,
      submission_id: result.submission_id,
      status: result.status,
      message: result.message || 'Your submission has been received and is pending review!',
    };
  });

export async function getUserSubmissions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_user_dashboard', { p_user_id: user.id });
  if (error) {
    logger.error('Failed to fetch user dashboard', error);
    return [];
  }

  const result = data as { submissions: any[]; companies: any[]; jobs: any[] };
  return result.submissions || [];
}

export const getSubmissionStats = rateLimitedAction
  .metadata({ actionName: 'getSubmissionStats', category: 'analytics' })
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('submission_stats_summary')
      .select('total, pending, merged_this_week')
      .single();

    if (error) throw new Error(`Failed to fetch submission stats: ${error.message}`);

    return {
      total: data?.total ?? 0,
      pending: data?.pending ?? 0,
      mergedThisWeek: data?.merged_this_week ?? 0,
    };
  });

export const getRecentMerged = rateLimitedAction
  .metadata({ actionName: 'getRecentMerged', category: 'analytics' })
  .schema(z.object({ limit: nonNegativeInt.min(1).max(10).default(5) }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_recent_merged', { p_limit: parsedInput.limit });
    if (error) throw new Error(`Failed to fetch recent merged: ${error.message}`);
    return data ?? [];
  });

export const getTopContributors = rateLimitedAction
  .metadata({ actionName: 'getTopContributors', category: 'analytics' })
  .schema(z.object({ limit: nonNegativeInt.min(1).max(10).default(5) }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_top_contributors', {
      p_limit: parsedInput.limit,
    });
    if (error) throw new Error(`Failed to fetch contributors: ${error.message}`);
    return data ?? [];
  });

export const createCompany = rateLimitedAction
  .metadata({ actionName: 'createCompany', category: 'user' })
  .schema(publicCompaniesInsertSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('You must be signed in to create a company profile');

    const { data, error } = await supabase.rpc('manage_company', {
      p_action: 'create',
      p_user_id: user.id,
      p_data: parsedInput as Json,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/companies');
    revalidatePath('/account/companies');

    return data as { success: boolean; company: any };
  });

export const updateCompany = rateLimitedAction
  .metadata({ actionName: 'updateCompany', category: 'user' })
  .schema(publicCompaniesUpdateSchema.required({ id: true }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('You must be signed in to update companies');

    const { data, error } = await supabase.rpc('manage_company', {
      p_action: 'update',
      p_user_id: user.id,
      p_data: parsedInput as Json,
    });

    if (error) throw new Error(error.message);
    const result = data as { success: boolean; company: any };

    revalidatePath('/companies');
    revalidatePath(`/companies/${result.company.slug}`);
    revalidatePath('/account/companies');

    return result;
  });

export async function getUserCompanies() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_user_dashboard', { p_user_id: user.id });
  if (error) throw new Error(`Failed to fetch user dashboard: ${error.message}`);

  const result = data as { submissions: any[]; companies: any[]; jobs: any[] };
  return result.companies || [];
}

const createJobInputSchema = publicJobsInsertSchema.pick({
  title: true,
  company: true,
  description: true,
  category: true,
  type: true,
  link: true,
  location: true,
  salary: true,
  remote: true,
  workplace: true,
  tags: true,
  requirements: true,
  benefits: true,
  experience: true,
  contact_email: true,
}) as z.ZodType<any>;

export const createJob = rateLimitedAction
  .metadata({ actionName: 'createJob', category: 'form' })
  .schema(createJobInputSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('You must be signed in to create a job listing');

    const { data, error } = await supabase.rpc('manage_job', {
      p_action: 'create',
      p_user_id: user.id,
      p_data: parsedInput as Json,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return data as { success: boolean; job: any; requiresPayment: boolean; message: string };
  });

const updateJobInputSchema = publicJobsUpdateSchema
  .omit({ tags: true, requirements: true, benefits: true })
  .extend({
    tags: z.any().optional(),
    requirements: z.any().optional(),
    benefits: z.any().optional(),
  })
  .required({ id: true }) as z.ZodType<any>;

export const updateJob = rateLimitedAction
  .metadata({ actionName: 'updateJob', category: 'form' })
  .schema(updateJobInputSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('You must be signed in to update jobs');

    const { data, error } = await supabase.rpc('manage_job', {
      p_action: 'update',
      p_user_id: user.id,
      p_data: parsedInput as Json,
    });

    if (error) throw new Error(error.message);
    const result = data as { success: boolean; job: any };

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${result.job.slug}`);
    revalidatePath('/account/jobs');

    return result;
  });

export const toggleJobStatus = rateLimitedAction
  .metadata({ actionName: 'toggleJobStatus', category: 'form' })
  .schema(
    z.object({
      id: z.string().uuid(),
      status: z.enum(['draft', 'pending_review', 'active', 'expired', 'rejected']),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('You must be signed in to manage jobs');

    const { data, error } = await supabase.rpc('manage_job', {
      p_action: 'toggle_status',
      p_user_id: user.id,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return data as { success: boolean; job: any };
  });

export const deleteJob = rateLimitedAction
  .metadata({ actionName: 'deleteJob', category: 'form' })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('You must be signed in to delete jobs');

    const { data, error } = await supabase.rpc('manage_job', {
      p_action: 'delete',
      p_user_id: user.id,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return data as { success: boolean };
  });

export async function getUserJobs(): Promise<Array<Tables<'jobs'>>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_user_dashboard', { p_user_id: user.id });
  if (error) throw new Error(`Failed to fetch user dashboard: ${error.message}`);

  const result = data as { submissions: any[]; companies: any[]; jobs: any[] };
  return (result.jobs || []) as Array<Tables<'jobs'>>;
}

// Sponsored content tracking schemas - Generated base + validation
const trackImpressionSchema = publicSponsoredImpressionsInsertSchema.extend({
  position: z.number().int().min(0).max(100).optional(),
  page_url: z.string().max(500).optional(),
});

const trackClickSchema = publicSponsoredClicksInsertSchema.extend({
  target_url: z.string().max(500),
});

export const trackSponsoredImpression = rateLimitedAction
  .metadata({ actionName: 'trackSponsoredImpression', category: 'analytics' })
  .schema(trackImpressionSchema)
  .action(async ({ parsedInput: { sponsored_id, page_url, position } }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc('track_sponsored_event', {
      p_event_type: 'impression',
      p_user_id: user?.id || '',
      p_data: { sponsored_id, page_url, position } as Json,
    });

    if (error) return { success: false };
    return data as { success: boolean };
  });

export const trackSponsoredClick = rateLimitedAction
  .metadata({ actionName: 'trackSponsoredClick', category: 'analytics' })
  .schema(trackClickSchema)
  .action(async ({ parsedInput: { sponsored_id, target_url } }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc('track_sponsored_event', {
      p_event_type: 'click',
      p_user_id: user?.id || '',
      p_data: { sponsored_id, target_url } as Json,
    });

    if (error) return { success: false };
    return data as { success: boolean };
  });

export async function getActiveSponsoredContent(limit = 5) {
  const supabase = await createClient();

  // RPC handles all filtering (active, date range, impression limits)
  const { data, error } = await supabase.rpc('get_active_sponsored_content', {
    p_limit: limit,
  });

  if (error) {
    logger.warn('Failed to fetch active sponsored content', undefined, { error: error.message });
    return [];
  }

  return data || [];
}
