'use server';

/**
 * Job Actions
 * Server actions for job listing CRUD operations
 *
 * Security: Rate limited, auth required, RLS enforced
 * Follows patterns from bookmark-actions.ts
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import {
  createJobSchema,
  toggleJobStatusSchema,
  updateJobSchema,
} from '@/src/lib/schemas/content/job.schema';
import { createClient } from '@/src/lib/supabase/server';

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

    // Insert job - build object conditionally to handle exactOptionalPropertyTypes
    // Generate slug from title (database requires slug)
    const generatedSlug = parsedInput.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 100);

    const insertData: {
      user_id: string;
      title: string;
      slug: string;
      company: string;
      location?: string | null;
      description: string;
      salary?: string | null;
      remote: boolean;
      type: string;
      workplace?: string | null;
      experience?: string | null;
      category: string;
      tags: string[];
      requirements: string[];
      benefits: string[];
      link: string;
      contact_email?: string | null;
      company_logo?: string | null;
      company_id?: string | null;
      plan: string;
      active: boolean;
      status: string;
      posted_at: string | null;
      expires_at: string | null;
    } = {
      user_id: user.id,
      title: parsedInput.title,
      slug: generatedSlug,
      company: parsedInput.company,
      description: parsedInput.description,
      remote: parsedInput.remote,
      type: parsedInput.type,
      category: parsedInput.category,
      tags: parsedInput.tags,
      requirements: parsedInput.requirements,
      benefits: parsedInput.benefits,
      link: parsedInput.link,
      plan: parsedInput.plan,
      // For free tier, activate immediately if standard plan
      active: parsedInput.plan === 'standard',
      status: parsedInput.plan === 'standard' ? 'active' : 'draft',
      posted_at: parsedInput.plan === 'standard' ? new Date().toISOString() : null,
      // Set expiry to 30 days for standard, null for paid (manual activation)
      expires_at:
        parsedInput.plan === 'standard'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
    };

    if (parsedInput.location !== undefined) insertData.location = parsedInput.location;
    if (parsedInput.salary !== undefined) insertData.salary = parsedInput.salary;
    if (parsedInput.workplace !== undefined) insertData.workplace = parsedInput.workplace;
    if (parsedInput.experience !== undefined) insertData.experience = parsedInput.experience;
    if (parsedInput.contact_email !== undefined)
      insertData.contact_email = parsedInput.contact_email;
    if (parsedInput.company_logo !== undefined) insertData.company_logo = parsedInput.company_logo;
    if (parsedInput.company_id !== undefined) insertData.company_id = parsedInput.company_id;

    const { data, error } = await supabase.from('jobs').insert(insertData).select().single();

    if (error) {
      throw new Error(error.message);
    }

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

    // Update job (RLS ensures user owns this job)
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Double-check ownership
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
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

    // Update status
    const { data, error } = await supabase
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
      throw new Error(error.message);
    }

    revalidatePath('/jobs');
    revalidatePath('/account/jobs');

    return {
      success: true,
      job: data,
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

    // Soft delete
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'deleted' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
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

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
