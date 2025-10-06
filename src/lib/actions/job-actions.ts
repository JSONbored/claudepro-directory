'use server';

/**
 * Job Actions
 * Server actions for job listing CRUD operations
 * 
 * Security: Rate limited, auth required, RLS enforced
 * Follows patterns from bookmark-actions.ts
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { createClient } from '@/src/lib/supabase/server';
import { 
  createJobSchema, 
  updateJobSchema, 
  toggleJobStatusSchema,
} from '@/src/lib/schemas/content/job.schema';
import { revalidatePath } from 'next/cache';

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
    category: 'jobs',
  })
  .schema(createJobSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be signed in to create a job listing');
    }

    // Insert job
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        ...parsedInput,
        // For free tier, activate immediately if standard plan
        active: parsedInput.plan === 'standard',
        status: parsedInput.plan === 'standard' ? 'active' : 'draft',
        posted_at: parsedInput.plan === 'standard' ? new Date().toISOString() : null,
        // Set expiry to 30 days for standard, null for paid (manual activation)
        expires_at: parsedInput.plan === 'standard' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .select()
      .single();

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
    category: 'jobs',
  })
  .schema(updateJobSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be signed in to update jobs');
    }

    const { id, ...updates } = parsedInput;

    // Update job (RLS ensures user owns this job)
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
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
    category: 'jobs',
  })
  .schema(toggleJobStatusSchema)
  .action(async ({ parsedInput: { id, status } }) => {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
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
    category: 'jobs',
  })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput: { id } }) => {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
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
  
  const { data: { user } } = await supabase.auth.getUser();
  
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
