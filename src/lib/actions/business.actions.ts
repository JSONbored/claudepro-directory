'use server';

/**
 * Business Actions
 * Consolidated server actions for all business-related functionality
 *
 * Consolidates: Submissions (2 actions), Submission Stats (3 actions), Companies (3 actions), Jobs (5 actions), Sponsored (3 actions)
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
import { type Company, companyRepository } from '@/src/lib/repositories/company.repository';
import { jobRepository } from '@/src/lib/repositories/job.repository';
import { sponsoredContentRepository } from '@/src/lib/repositories/sponsored-content.repository';
import { submissionRepository } from '@/src/lib/repositories/submission.repository';
import { userRepository } from '@/src/lib/repositories/user.repository';
import {
  createJobSchema,
  toggleJobStatusSchema,
  updateJobSchema,
} from '@/src/lib/schemas/content/job.schema';
import { configSubmissionSchema } from '@/src/lib/schemas/form.schema';
import { nonNegativeInt } from '@/src/lib/schemas/primitives/base-numbers';
import { nonEmptyString, slugString, urlString } from '@/src/lib/schemas/primitives/base-strings';
import {
  type RecentMerged,
  recentMergedSchema,
  submissionStatsSchema,
  type TopContributor,
  topContributorSchema,
} from '@/src/lib/schemas/submission-stats.schema';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

// ============================================
// SUBMISSION ACTIONS
// ============================================

/**
 * Submit new content configuration
 * Creates GitHub PR automatically
 *
 * Flow:
 * 1. Validate user is authenticated
 * 2. Check for duplicates
 * 3. Generate slug
 * 4. Format content file
 * 5. Create GitHub branch
 * 6. Commit file
 * 7. Create PR
 * 8. Track in database
 * 9. Return PR URL
 */
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

    // Get user profile for attribution via repository (includes caching)
    const profileResult = await userRepository.findById(user.id);
    const profile = profileResult.success ? profileResult.data : null;

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

    // 10. Track submission in database via repository (includes caching)
    const submissionResult = await submissionRepository.create({
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
    });

    if (!submissionResult.success) {
      logger.error('Failed to track submission in database', new Error(submissionResult.error));
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

/**
 * Get user's submissions
 * Helper function for submissions page
 */
export async function getUserSubmissions() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Fetch via repository (includes caching and automatic sorting)
  const result = await submissionRepository.findByUser(user.id);

  if (!result.success) {
    logger.error('Failed to fetch user submissions', new Error(result.error));
    return [];
  }

  return result.data || [];
}

// ============================================
// SUBMISSION STATS ACTIONS
// ============================================

/**
 * Get submission statistics
 * Cached via repository (5-minute TTL)
 */
export const getSubmissionStats = rateLimitedAction
  .metadata({
    actionName: 'getSubmissionStats',
    category: 'analytics',
  })
  .schema(z.object({})) // No input needed
  .outputSchema(submissionStatsSchema)
  .action(async () => {
    try {
      // Fetch via repository (includes caching and parallel queries)
      const result = await submissionRepository.getStats();

      if (!(result.success && result.data)) {
        throw new Error(result.error || 'Failed to fetch submission stats');
      }

      return result.data;
    } catch (error) {
      logger.error(
        'Failed to fetch submission stats',
        error instanceof Error ? error : new Error(String(error))
      );
      return { total: 0, pending: 0, mergedThisWeek: 0 };
    }
  });

/**
 * Get recently merged submissions
 * Shows social proof
 */
export const getRecentMerged = rateLimitedAction
  .metadata({
    actionName: 'getRecentMerged',
    category: 'analytics',
  })
  .schema(
    z.object({
      limit: nonNegativeInt.min(1).max(10).default(5),
    })
  )
  .outputSchema(z.array(recentMergedSchema))
  .action(async ({ parsedInput }: { parsedInput: { limit: number } }) => {
    try {
      // Fetch via repository (includes caching and user joins)
      const result = await submissionRepository.getRecentMerged(parsedInput.limit);

      if (!(result.success && result.data)) {
        throw new Error(result.error || 'Failed to fetch recent merged');
      }

      // Transform to match schema with content type validation
      const transformed: RecentMerged[] = result.data.map((item) => {
        const validContentType = [
          'agents',
          'mcp',
          'rules',
          'commands',
          'hooks',
          'statuslines',
          'collections',
        ].includes(item.content_type)
          ? (item.content_type as
              | 'agents'
              | 'mcp'
              | 'rules'
              | 'commands'
              | 'hooks'
              | 'statuslines'
              | 'collections')
          : 'agents';

        return {
          id: item.id,
          content_name: item.content_name,
          content_type: validContentType,
          merged_at: item.merged_at,
          user: item.user,
        };
      });

      return transformed;
    } catch (error) {
      logger.error(
        'Failed to fetch recent merged',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  });

/**
 * Get top contributors
 * Gamification element
 */
export const getTopContributors = rateLimitedAction
  .metadata({
    actionName: 'getTopContributors',
    category: 'analytics',
  })
  .schema(
    z.object({
      limit: nonNegativeInt.min(1).max(10).default(5),
    })
  )
  .outputSchema(z.array(topContributorSchema))
  .action(async ({ parsedInput }: { parsedInput: { limit: number } }) => {
    try {
      // Fetch via repository (includes caching, grouping, and sorting)
      const result = await submissionRepository.getTopContributors(parsedInput.limit);

      if (!(result.success && result.data)) {
        throw new Error(result.error || 'Failed to fetch top contributors');
      }

      // Transform to match schema format
      const contributors: TopContributor[] = result.data.map((item) => ({
        rank: item.rank,
        name: item.name,
        slug: item.slug,
        mergedCount: item.mergedCount,
      }));

      return contributors;
    } catch (error) {
      logger.error(
        'Failed to fetch top contributors',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  });

// ============================================
// COMPANY ACTIONS
// ============================================

// Company schemas
const createCompanySchema = z.object({
  name: nonEmptyString.min(2).max(200),
  slug: slugString.optional(),
  logo: urlString.nullable().optional(),
  website: urlString.nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).nullable().optional(),
  industry: nonEmptyString.max(100).nullable().optional(),
  using_cursor_since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

const updateCompanySchema = z.object({
  id: z.string().uuid(),
  name: nonEmptyString.min(2).max(200).optional(),
  logo: urlString.nullable().optional(),
  website: urlString.nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).nullable().optional(),
  industry: nonEmptyString.max(100).nullable().optional(),
  using_cursor_since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

/**
 * Create a new company profile
 */
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

    // Create via repository (includes caching and automatic error handling)
    const result = await companyRepository.create({
      owner_id: user.id,
      name: parsedInput.name,
      slug: generatedSlug,
      logo: parsedInput.logo ?? null,
      website: parsedInput.website ?? null,
      description: parsedInput.description ?? null,
      size: parsedInput.size ?? null,
      industry: parsedInput.industry ?? null,
      using_cursor_since: parsedInput.using_cursor_since ?? null,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create company');
    }

    revalidatePath('/companies');
    revalidatePath('/account/companies');

    return {
      success: true,
      company: result.data,
    };
  });

/**
 * Update a company profile (owner only)
 */
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
    ) as Partial<Company>;

    // Update via repository with ownership verification (includes caching)
    const result = await companyRepository.updateByOwner(id, user.id, updateData);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update company');
    }

    if (!result.data) {
      throw new Error('Company data not returned');
    }

    const data = result.data;

    revalidatePath('/companies');
    revalidatePath(`/companies/${data.slug}`);
    revalidatePath('/account/companies');

    return {
      success: true,
      company: data,
    };
  });

/**
 * Get user's companies
 */
export async function getUserCompanies() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Fetch via repository (includes caching)
  const result = await companyRepository.findByOwner(user.id, {
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch user companies');
  }

  return result.data || [];
}

// ============================================
// JOB ACTIONS
// ============================================

/**
 * Create a new job listing
 *
 * Flow:
 * 1. Validate input
 * 2. Check user auth
 * 3. Create job in database (status: draft, active: false initially)
 * 4. Redirect to job management page
 */
export const createJob = rateLimitedAction
  .metadata({
    actionName: 'createJob',
    category: 'form',
  })
  .schema(createJobSchema)
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

    // Create via repository (includes caching and automatic error handling)
    const result = await jobRepository.create({
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
      plan: parsedInput.plan,
      active: parsedInput.plan === 'standard',
      status: parsedInput.plan === 'standard' ? 'active' : 'draft',
      posted_at: parsedInput.plan === 'standard' ? new Date().toISOString() : null,
      expires_at:
        parsedInput.plan === 'standard'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create job');
    }

    const data = result.data;

    // Revalidate jobs pages
    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return {
      success: true,
      job: data,
      // For paid tiers, would redirect to checkout (skipped for now)
      requiresPayment: parsedInput.plan !== 'standard',
    };
  });

/**
 * Update an existing job listing
 * Only owner can update
 */
export const updateJob = rateLimitedAction
  .metadata({
    actionName: 'updateJob',
    category: 'form',
  })
  .schema(updateJobSchema)
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

    // Filter out undefined values to avoid exactOptionalPropertyTypes issues
    const updateData = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // Update via repository with ownership verification (includes caching)
    const result = await jobRepository.updateByOwner(id, user.id, updateData);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update job');
    }

    if (!result.data) {
      throw new Error('Job data not returned');
    }

    const data = result.data;

    // Revalidate pages
    revalidatePath('/jobs');
    revalidatePath(`/jobs/${data.slug}`);
    revalidatePath('/account/jobs');

    return {
      success: true,
      job: data,
    };
  });

/**
 * Toggle job status (activate, pause, etc.)
 */
export const toggleJobStatus = rateLimitedAction
  .metadata({
    actionName: 'toggleJobStatus',
    category: 'form',
  })
  .schema(toggleJobStatusSchema)
  .action(async ({ parsedInput: { id, status } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to manage jobs');
    }

    // Update via repository with ownership verification (includes caching)
    const result = await jobRepository.updateByOwner(id, user.id, {
      status,
      // If activating, set posted_at if not already set
      ...(status === 'active' ? { posted_at: new Date().toISOString() } : {}),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to update job status');
    }

    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return {
      success: true,
      job: result.data,
    };
  });

/**
 * Delete a job (soft delete by setting status)
 */
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

    // First verify ownership
    const jobResult = await jobRepository.findById(id);
    if (!(jobResult.success && jobResult.data)) {
      throw new Error('Job not found');
    }

    if (jobResult.data.user_id !== user.id) {
      throw new Error('You do not have permission to delete this job');
    }

    // Soft delete via repository (includes cache invalidation)
    const result = await jobRepository.delete(id, true);

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete job');
    }

    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return {
      success: true,
    };
  });

/**
 * Get user's jobs (for account management)
 * Not a server action - just a helper function
 */
export async function getUserJobs() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Fetch via repository (includes caching and automatic filtering)
  const result = await jobRepository.findActiveByUser(user.id, {
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch user jobs');
  }

  return result.data || [];
}

// ============================================
// SPONSORED CONTENT ACTIONS
// ============================================

const trackImpressionSchema = z.object({
  sponsored_id: z.string().uuid(),
  page_url: z.string().max(500).optional(),
  position: z.number().int().min(0).max(100).optional(),
});

const trackClickSchema = z.object({
  sponsored_id: z.string().uuid(),
  target_url: z.string().max(500),
});

/**
 * Track a sponsored impression
 * Called when sponsored content becomes visible (Intersection Observer)
 */
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

    // Track impression via repository (fire-and-forget)
    const result = await sponsoredContentRepository.trackImpression({
      sponsored_id,
      user_id: user?.id || null,
      page_url: page_url || null,
      position: position || null,
    });

    return { success: result.success ? result.data : false };
  });

/**
 * Track a sponsored click
 * Called when user clicks on sponsored content
 */
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

    // Track click via repository (fire-and-forget)
    const result = await sponsoredContentRepository.trackClick({
      sponsored_id,
      user_id: user?.id || null,
      target_url,
    });

    return { success: result.success ? result.data : false };
  });

/**
 * Get active sponsored content for injection
 */
export async function getActiveSponsoredContent(limit = 5) {
  // Fetch via repository (includes caching, date filtering, and impression limit filtering)
  const result = await sponsoredContentRepository.findActive(limit);

  if (!result.success) {
    return [];
  }

  return result.data || [];
}
