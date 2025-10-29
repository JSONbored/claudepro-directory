'use server';

/**
 * Business Actions - Database-First Architecture
 * All aggregations in PostgreSQL. TypeScript handles GitHub operations + auth validation only.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { commitFile, createBranch, createPullRequest } from '@/src/lib/github/client';
import {
  formatContentFile,
  generateSlug,
  getContentFilePath,
  validateContentFile,
} from '@/src/lib/github/content-manager';
import { checkForDuplicates, validateSubmission } from '@/src/lib/github/duplicate-detection';
import {
  generateCommitMessage,
  generatePRBody,
  generatePRLabels,
  generatePRTitle,
} from '@/src/lib/github/pr-template';
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
import type { Tables } from '@/src/types/database.types';

// Leaderboard types (derived from database tables, not materialized views)
type RecentMerged = {
  id: string;
  content_name: string;
  content_type: 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines' | 'collections';
  merged_at: string;
  user: {
    name: string;
    slug: string;
  } | null;
};

type TopContributor = {
  rank: number;
  name: string;
  slug: string;
  mergedCount: number;
};

// Zod schemas for validation
const submissionStatsSchema = z.object({
  total: z.number(),
  pending: z.number(),
  mergedThisWeek: z.number(),
});

const recentMergedSchema = z.object({
  id: z.string(),
  content_name: z.string(),
  content_type: z.enum([
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'collections',
  ]),
  merged_at: z.string(),
  user: z
    .object({
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
});

const topContributorSchema = z.object({
  rank: z.number(),
  name: z.string(),
  slug: z.string(),
  mergedCount: z.number(),
});

import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

// Database-first types (from generated database schema)
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];
type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];

export const submitConfiguration = rateLimitedAction
  .metadata({
    actionName: 'submitConfiguration',
    category: 'form',
  })
  .schema(configSubmissionSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to submit content');
    }

    // Get user profile for attribution
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();

    // 2. Generate slug from name
    const slug = generateSlug(parsedInput.name);

    // 3. Validate submission
    const validation = await validateSubmission({
      type: parsedInput.type,
      name: parsedInput.name,
      slug,
      description: parsedInput.description,
      tags: parsedInput.tags || [],
    });

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // 4. Check for duplicates
    const duplicateCheck = await checkForDuplicates(parsedInput.type, slug, parsedInput.name);

    if (duplicateCheck.isDuplicate) {
      throw new Error(duplicateCheck.reason || 'This content already exists or is pending review');
    }

    // Warn about similar content (but don't block)
    if (duplicateCheck.suggestions && duplicateCheck.suggestions.length > 0) {
      logger.warn(`Similar content found for ${slug}: ${duplicateCheck.suggestions.join(', ')}`);
    }

    // 5. Format content file (pass full parsed input with slug)
    const contentFile = formatContentFile({
      ...parsedInput,
      slug,
    });

    // 6. Validate formatted content
    if (!validateContentFile(contentFile)) {
      throw new Error('Generated content file failed validation. Please try again.');
    }

    // 7. Create GitHub branch
    const branchName = `submission/${parsedInput.type}/${slug}-${Date.now()}`;
    try {
      await createBranch(branchName);
    } catch (error) {
      logger.error(
        'Failed to create branch',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error(
        `Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // 8. Commit file
    const filePath = getContentFilePath(parsedInput.type, slug);
    const commitMessage = generateCommitMessage(parsedInput.type, parsedInput.name);

    try {
      await commitFile({
        branch: branchName,
        path: filePath,
        content: contentFile,
        message: commitMessage,
      });
    } catch (error) {
      logger.error(
        'Failed to commit file',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error(
        `Failed to commit file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // 9. Create PR
    const prTitle = generatePRTitle(parsedInput.type, parsedInput.name);
    const prBody = generatePRBody({
      type: parsedInput.type,
      name: parsedInput.name,
      slug,
      description: parsedInput.description,
      category: parsedInput.category,
      author: parsedInput.author,
      github: parsedInput.github || undefined,
      tags: parsedInput.tags || [],
      submittedBy: profile
        ? {
            username: profile.slug || profile.name || 'anonymous',
            email: user.email || 'unknown',
          }
        : undefined,
    });
    const prLabels = generatePRLabels(parsedInput.type);

    let prNumber: number;
    let prUrl: string;

    try {
      const pr = await createPullRequest({
        title: prTitle,
        body: prBody,
        head: branchName,
        labels: prLabels,
      });

      prNumber = pr.number;
      prUrl = pr.url;
    } catch (error) {
      logger.error(
        'Failed to create PR',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error(
        `Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // 10. Track submission in database (database defaults handle timestamps)
    const { error: submissionError } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        content_type: parsedInput.type,
        content_slug: slug,
        content_name: parsedInput.name,
        pr_number: prNumber,
        pr_url: prUrl,
        branch_name: branchName,
        status: 'pending',
        merged_at: null,
        rejection_reason: null,
        submission_data: {
          ...parsedInput,
          slug,
          formatted_content: contentFile,
        },
      } as SubmissionInsert)
      .select()
      .single();

    if (submissionError) {
      logger.error('Failed to track submission in database', submissionError);
      // Don't throw - PR was created successfully, just log the error
    }

    // 11. Revalidate pages
    revalidatePath('/submit');
    revalidatePath('/account/submissions');

    // 12. Return success
    return {
      success: true,
      prNumber,
      prUrl,
      slug,
      message: 'Your submission has been created and is pending review!',
    };
  });

export async function getUserSubmissions() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Fetch submissions with automatic sorting
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch user submissions', error);
    return [];
  }

  return submissions || [];
}

export const getSubmissionStats = rateLimitedAction
  .metadata({ actionName: 'getSubmissionStats', category: 'analytics' })
  .schema(z.object({}))
  .outputSchema(submissionStatsSchema)
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
  .outputSchema(z.array(recentMergedSchema))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_recent_merged', { p_limit: parsedInput.limit });
    if (error) throw new Error(`Failed to fetch recent merged: ${error.message}`);
    return (data as RecentMerged[]) ?? [];
  });

export const getTopContributors = rateLimitedAction
  .metadata({ actionName: 'getTopContributors', category: 'analytics' })
  .schema(z.object({ limit: nonNegativeInt.min(1).max(10).default(5) }))
  .outputSchema(z.array(topContributorSchema))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_top_contributors', {
      p_limit: parsedInput.limit,
    });
    if (error) throw new Error(`Failed to fetch contributors: ${error.message}`);
    return (data as TopContributor[]) ?? [];
  });

// Company schemas - Generated base + business rules
const createCompanySchema = publicCompaniesInsertSchema.extend({
  name: z.string().min(2).max(200),
  logo: z.string().url().nullable().optional(),
  website: z.string().url().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  using_cursor_since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

const updateCompanySchema = publicCompaniesUpdateSchema.extend({
  id: z.string().uuid(),
  name: z.string().min(2).max(200).optional(),
  logo: z.string().url().nullable().optional(),
  website: z.string().url().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  using_cursor_since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export const createCompany = rateLimitedAction
  .metadata({
    actionName: 'createCompany',
    category: 'user',
  })
  .schema(createCompanySchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to create a company profile');
    }

    // Generate slug from name if not provided
    const generatedSlug =
      parsedInput.slug ??
      parsedInput.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    // Create company (database defaults handle timestamps)
    const { data: company, error: createError } = await supabase
      .from('companies')
      .insert({
        owner_id: user.id,
        name: parsedInput.name,
        slug: generatedSlug,
        logo: parsedInput.logo ?? null,
        website: parsedInput.website ?? null,
        description: parsedInput.description ?? null,
        size: parsedInput.size ?? null,
        industry: parsedInput.industry ?? null,
        using_cursor_since: parsedInput.using_cursor_since ?? null,
      } as CompanyInsert)
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        throw new Error('A company with this name or slug already exists');
      }
      throw new Error(`Failed to create company: ${createError.message}`);
    }

    revalidatePath('/companies');
    revalidatePath('/account/companies');

    return {
      success: true,
      company,
    };
  });

export const updateCompany = rateLimitedAction
  .metadata({
    actionName: 'updateCompany',
    category: 'user',
  })
  .schema(updateCompanySchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to update companies');
    }

    const { id, ...updates } = parsedInput;

    // Filter out undefined values to avoid exactOptionalPropertyTypes issues
    const updateData = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as CompanyUpdate;

    // Update with atomic ownership verification
    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new Error('Company not found or you do not have permission to update it');
      }
      throw new Error(`Failed to update company: ${updateError.message}`);
    }

    if (!company) {
      throw new Error('Company not found or you do not have permission to update it');
    }

    const data = company;

    revalidatePath('/companies');
    revalidatePath(`/companies/${data.slug}`);
    revalidatePath('/account/companies');

    return {
      success: true,
      company: data,
    };
  });

export async function getUserCompanies() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Fetch companies owned by user
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user companies: ${error.message}`);
  }

  return companies || [];
}

export const createJob = rateLimitedAction
  .metadata({
    actionName: 'createJob',
    category: 'form',
  })
  .schema(publicJobsInsertSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to create a job listing');
    }

    // Generate slug from title
    const generatedSlug = parsedInput.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 100);

    // Create job - all jobs go to pending_review with unpaid status (payment required workflow)
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        title: parsedInput.title,
        slug: generatedSlug,
        company: parsedInput.company,
        location: parsedInput.location ?? null,
        description: parsedInput.description,
        salary: parsedInput.salary ?? null,
        remote: parsedInput.remote,
        type: parsedInput.type,
        workplace: parsedInput.workplace ?? null,
        experience: parsedInput.experience ?? null,
        category: parsedInput.category,
        tags: parsedInput.tags as unknown as Database['public']['Tables']['jobs']['Row']['tags'],
        requirements:
          parsedInput.requirements as unknown as Database['public']['Tables']['jobs']['Row']['requirements'],
        benefits:
          parsedInput.benefits as unknown as Database['public']['Tables']['jobs']['Row']['benefits'],
        link: parsedInput.link,
        contact_email: parsedInput.contact_email ?? null,
        company_logo: parsedInput.company_logo ?? null,
        company_id: parsedInput.company_id ?? null,
        plan: 'standard', // Single pricing tier: $299/30-day
        active: false, // Activated after payment + admin approval
        status: 'pending_review', // All jobs enter review queue
        payment_status: 'unpaid', // Default payment status
        payment_amount: 299.0, // Fixed price: $299/30-day listing
        payment_method: null, // Set when payment received (polar/mercury_invoice/manual)
        payment_date: null, // Set when payment confirmed
        payment_reference: null, // Set to invoice/order ID when paid
        admin_notes: null, // Internal notes for admin review
        posted_at: null, // Set after approval + payment
        expires_at: null, // Set after approval (30 days from posted_at)
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    // Revalidate jobs pages
    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return {
      success: true,
      job: data,
      requiresPayment: true, // All jobs require payment ($299/30-day)
      message:
        'Job submitted for review! You will receive payment instructions via email after admin approval.',
    };
  });

export const updateJob = rateLimitedAction
  .metadata({
    actionName: 'updateJob',
    category: 'form',
  })
  .schema(publicJobsUpdateSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to update jobs');
    }

    const { id, ...updates } = parsedInput;

    // Transform undefined to null for nullable database fields
    // This handles the impedance mismatch between TypeScript optional (undefined)
    // and database nullable (null) with exactOptionalPropertyTypes: true
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        // Nullable fields: convert undefined to null for database
        if (
          [
            'location',
            'salary',
            'workplace',
            'experience',
            'contact_email',
            'company_logo',
          ].includes(key)
        ) {
          updateData[key] = value ?? null;
        } else {
          updateData[key] = value;
        }
      }
    }

    // Update with ownership verification
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }

    if (!data) {
      throw new Error('Job data not returned');
    }

    // Revalidate pages
    revalidatePath('/jobs');
    revalidatePath(`/jobs/${data.slug}`);
    revalidatePath('/account/jobs');

    return {
      success: true,
      job: data,
    };
  });

export const toggleJobStatus = rateLimitedAction
  .metadata({
    actionName: 'toggleJobStatus',
    category: 'form',
  })
  .schema(publicJobsUpdateSchema.pick({ id: true, active: true }))
  .action(async ({ parsedInput: { id, status } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to manage jobs');
    }

    // Update with ownership verification
    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        status,
        // If activating, set posted_at if not already set
        ...(status === 'active' ? { posted_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }

    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return {
      success: true,
      job,
    };
  });

export const deleteJob = rateLimitedAction
  .metadata({
    actionName: 'deleteJob',
    category: 'form',
  })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput: { id } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to delete jobs');
    }

    // Soft delete with ownership verification (set status='deleted')
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'deleted' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }

    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return {
      success: true,
    };
  });

export async function getUserJobs(): Promise<Array<Tables<'jobs'>>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user jobs: ${error.message}`);
  }

  return data || [];
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
  .metadata({
    actionName: 'trackSponsoredImpression',
    category: 'analytics',
  })
  .schema(trackImpressionSchema)
  .action(async ({ parsedInput: { sponsored_id, page_url, position } }) => {
    const supabase = await createClient();

    // Get current user (optional - track anonymous too)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Track impression (fire-and-forget, best-effort)
    const { error: insertError } = await supabase.from('sponsored_impressions').insert({
      sponsored_id,
      user_id: user?.id || null,
      page_url: page_url || null,
      position: position || null,
    });

    if (insertError) {
      // Best-effort tracking - don't throw
      return { success: false };
    }

    // Increment count on sponsored_content (fire-and-forget)
    supabase
      .rpc('increment', {
        table_name: 'sponsored_content',
        row_id: sponsored_id,
        column_name: 'impression_count',
      })
      .then(() => {
        // Silent success
      });

    return { success: true };
  });

export const trackSponsoredClick = rateLimitedAction
  .metadata({
    actionName: 'trackSponsoredClick',
    category: 'analytics',
  })
  .schema(trackClickSchema)
  .action(async ({ parsedInput: { sponsored_id, target_url } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Track click (fire-and-forget, best-effort)
    const { error: insertError } = await supabase.from('sponsored_clicks').insert({
      sponsored_id,
      user_id: user?.id || null,
      target_url,
    });

    if (insertError) {
      // Best-effort tracking - don't throw
      return { success: false };
    }

    // Increment count on sponsored_content (fire-and-forget)
    supabase
      .rpc('increment', {
        table_name: 'sponsored_content',
        row_id: sponsored_id,
        column_name: 'click_count',
      })
      .then(() => {
        // Silent success
      });

    return { success: true };
  });

export async function getActiveSponsoredContent(limit = 5) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Fetch active sponsored content within date range
  const { data, error } = await supabase
    .from('sponsored_content')
    .select('*')
    .eq('active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('tier', { ascending: true }) // Premium first
    .limit(limit);

  if (error) {
    logger.warn('Failed to fetch active sponsored content', undefined, { error: error.message });
    return [];
  }

  // Filter out items that hit impression limit
  const filtered = (data || []).filter((item) => {
    const impressionCount = item.impression_count ?? 0;
    if (item.impression_limit && impressionCount >= item.impression_limit) {
      return false;
    }
    return true;
  });

  return filtered;
}
