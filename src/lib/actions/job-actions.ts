'use server';

/**
 * Job Actions
 * Server actions for job listing CRUD operations
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to JobRepository.
 *
 * Security: Rate limited, auth required, RLS enforced
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { jobRepository } from '@/src/lib/repositories/job.repository';
import {
  createJobSchema,
  toggleJobStatusSchema,
  updateJobSchema,
} from '@/src/lib/schemas/content/job.schema';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

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
