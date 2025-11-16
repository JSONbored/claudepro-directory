'use server';

/**
 * Jobs Actions - Database-First Architecture
 * Thin orchestration layer calling PostgreSQL RPC functions + Polar.sh API
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { invalidateByKeys, runRpc } from '@/src/lib/actions/action-helpers';
import { authedAction } from '@/src/lib/actions/safe-action';
import type { CacheInvalidateKey } from '@/src/lib/data/config/cache-config';
import { logger } from '@/src/lib/logger';
import { logActionFailure } from '@/src/lib/utils/error.utils';
import {
  JOBCATEGORY_VALUES as JOB_CATEGORY_VALUES,
  JOB_STATUS_VALUES,
  type JobCategory,
  type JobStatus,
  WORKPLACE_TYPE_VALUES,
  type WorkplaceType,
} from '@/src/types/database-overrides';

// Minimal Zod schemas (database CHECK constraints do real validation)
const createJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  company_id: z.string().uuid().optional().nullable(),
  description: z.string(),
  location: z.string().optional().nullable(),
  salary: z.string().optional().nullable(),
  remote: z.boolean().optional(),
  type: z.string(),
  workplace: z
    .enum([...WORKPLACE_TYPE_VALUES] as [WorkplaceType, ...WorkplaceType[]])
    .optional()
    .nullable(),
  experience: z.string().optional().nullable(),
  category: z.enum([...JOB_CATEGORY_VALUES] as [JobCategory, ...JobCategory[]]),
  tags: z.array(z.string()),
  requirements: z.array(z.string()),
  benefits: z.array(z.string()),
  link: z.string(),
  contact_email: z.string().email().optional().nullable(),
  company_logo: z.string().url().optional().nullable(),
  plan: z.enum(['one-time', 'subscription']),
  tier: z.enum(['standard', 'featured']),
});

const updateJobSchema = z.object({
  job_id: z.string().uuid(),
  title: z.string().optional(),
  company: z.string().optional(),
  company_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  location: z.string().optional().nullable(),
  salary: z.string().optional().nullable(),
  remote: z.boolean().optional(),
  type: z.string().optional(),
  workplace: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  category: z.enum([...JOB_CATEGORY_VALUES] as [JobCategory, ...JobCategory[]]).optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  link: z.string().optional(),
  contact_email: z.string().email().optional().nullable(),
  company_logo: z.string().url().optional().nullable(),
});

// Export inferred types for use in components and pages
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

const deleteJobSchema = z.object({
  job_id: z.string().uuid(),
});

const toggleJobStatusSchema = z.object({
  job_id: z.string().uuid(),
  new_status: z.enum([...JOB_STATUS_VALUES] as [JobStatus, ...JobStatus[]]),
});

async function invalidateJobCaches(options: {
  keys?: CacheInvalidateKey[];
  extraTags?: string[];
}): Promise<void> {
  await invalidateByKeys({
    ...(options.keys ? { invalidateKeys: options.keys } : {}),
    ...(options.extraTags ? { extraTags: options.extraTags } : {}),
  });
}

// =====================================================
// JOB CRUD ACTIONS
// =====================================================

/**
 * Create new job with payment flow
 * Calls create_job_with_payment RPC + Polar.sh checkout
 *
 * NOTE: Polar.sh integration pending account approval
 * Currently creates job in pending_payment status
 */
export const createJob = authedAction
  .metadata({ actionName: 'createJob', category: 'content' })
  .schema(createJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      type CreateJobRpcResult = {
        success: boolean;
        job_id: string;
        company_id: string;
        payment_amount: number;
        requires_payment: boolean;
      };

      const result = await runRpc<CreateJobRpcResult>(
        'create_job_with_payment',
        {
          p_user_id: ctx.userId,
          p_job_data: parsedInput,
          p_tier: parsedInput.tier,
          p_plan: parsedInput.plan,
        },
        {
          action: 'jobs.createJob.rpc',
          userId: ctx.userId,
          meta: { title: parsedInput.title },
        }
      );

      if (!result.success) {
        throw new Error('Job creation failed');
      }

      logger.info('Job created successfully', {
        userId: ctx.userId,
        jobId: result.job_id,
        companyId: result.company_id,
        paymentAmount: result.payment_amount,
      });

      // Polar.sh checkout integration (READY - pending account approval)
      let checkoutUrl: string | null = null;

      if (result.requires_payment) {
        // Dynamic import to avoid issues if Polar utils aren't configured yet
        try {
          const { createPolarCheckout, getPolarProductPriceId } = await import(
            '@/src/lib/integrations/polar'
          );

          // Get Polar product price ID for this plan/tier combo
          const productPriceId = getPolarProductPriceId(parsedInput.plan, parsedInput.tier);

          if (productPriceId) {
            // Create Polar checkout session (redirects to Polar-hosted page)
            const checkoutResult = await createPolarCheckout({
              productPriceId,
              jobId: result.job_id,
              userId: ctx.userId,
              customerEmail: ctx.userEmail || '',
              successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/account/jobs?payment=success&job_id=${result.job_id}`,
            });

            if ('error' in checkoutResult) {
              logger.error('Failed to create Polar checkout', new Error(checkoutResult.error), {
                jobId: result.job_id,
                userId: ctx.userId,
              });
              // Job created but checkout failed
              // User will see message to contact support for payment
            } else {
              checkoutUrl = checkoutResult.url;
              logger.info('Polar checkout session created', {
                jobId: result.job_id,
                sessionId: checkoutResult.sessionId,
                checkoutUrl: checkoutResult.url,
              });
            }
          } else {
            logger.warn('Polar product price ID not configured', {
              plan: parsedInput.plan,
              tier: parsedInput.tier,
            });
            // Job created but payment cannot be processed yet
            // Return without checkout URL - user will need to contact support
          }
        } catch (error) {
          logger.error(
            'Polar integration error',
            error instanceof Error ? error : new Error(String(error)),
            {
              jobId: result.job_id,
              userId: ctx.userId,
            }
          );
          // Graceful degradation - job created but payment cannot be processed
        }
      }

      revalidatePath('/account/jobs');
      revalidatePath('/jobs');

      // Statsig-powered cache invalidation
      await invalidateJobCaches({
        keys: ['cache.invalidate.job_create'],
      });
      if (result.company_id) {
        revalidateTag(`company-${result.company_id}`, 'default');
        revalidateTag(`company-id-${result.company_id}`, 'default');
      }
      revalidateTag(`job-${result.job_id}`, 'default');

      return {
        success: true,
        jobId: result.job_id,
        companyId: result.company_id,
        paymentAmount: result.payment_amount,
        requiresPayment: result.requires_payment,
        checkoutUrl, // Polar-hosted checkout page URL (or null if not configured yet)
      };
    } catch (error) {
      throw logActionFailure('jobs.createJob', error, {
        userId: ctx.userId,
        title: parsedInput.title,
      });
    }
  });

/**
 * Update existing job
 * Calls update_job RPC with ownership verification
 */
export const updateJob = authedAction
  .metadata({ actionName: 'updateJob', category: 'content' })
  .schema(updateJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { job_id, ...updates } = parsedInput;

      type UpdateJobRpcResult = {
        success: boolean;
        job_id: string;
      };

      const result = await runRpc<UpdateJobRpcResult>(
        'update_job',
        {
          p_job_id: job_id,
          p_user_id: ctx.userId,
          p_updates: updates,
        },
        {
          action: 'jobs.updateJob.rpc',
          userId: ctx.userId,
          meta: { jobId: job_id },
        }
      );

      if (!result.success) {
        throw new Error('Job update failed');
      }

      logger.info('Job updated successfully', {
        userId: ctx.userId,
        jobId: result.job_id,
      });

      revalidatePath('/account/jobs');
      revalidatePath(`/account/jobs/${job_id}/edit`);
      revalidatePath('/jobs');

      // Statsig-powered cache invalidation
      await invalidateJobCaches({
        keys: ['cache.invalidate.job_update'],
      });
      const companyId = updates.company_id ?? parsedInput.company_id ?? null;
      if (companyId) {
        revalidateTag(`company-${companyId}`, 'default');
        revalidateTag(`company-id-${companyId}`, 'default');
      }
      revalidateTag(`job-${job_id}`, 'default');

      return {
        success: true,
        jobId: result.job_id,
      };
    } catch (error) {
      throw logActionFailure('jobs.updateJob', error, {
        userId: ctx.userId,
        jobId: parsedInput.job_id,
      });
    }
  });

/**
 * Delete job (soft delete)
 * Calls delete_job RPC with ownership verification
 */
export const deleteJob = authedAction
  .metadata({ actionName: 'deleteJob', category: 'content' })
  .schema(deleteJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      type DeleteJobRpcResult = {
        success: boolean;
        job_id: string;
      };

      const result = await runRpc<DeleteJobRpcResult>(
        'delete_job',
        {
          p_job_id: parsedInput.job_id,
          p_user_id: ctx.userId,
        },
        {
          action: 'jobs.deleteJob.rpc',
          userId: ctx.userId,
          meta: { jobId: parsedInput.job_id },
        }
      );

      if (!result.success) {
        throw new Error('Job deletion failed');
      }

      logger.info('Job deleted successfully', {
        userId: ctx.userId,
        jobId: result.job_id,
      });

      revalidatePath('/account/jobs');
      revalidatePath('/jobs');

      // Statsig-powered cache invalidation
      await invalidateJobCaches({
        keys: ['cache.invalidate.job_delete'],
      });
      revalidateTag(`job-${result.job_id}`, 'default');

      return {
        success: true,
        jobId: result.job_id,
      };
    } catch (error) {
      throw logActionFailure('jobs.deleteJob', error, {
        userId: ctx.userId,
        jobId: parsedInput.job_id,
      });
    }
  });

/**
 * Toggle job status
 * Calls toggle_job_status RPC with ownership verification
 */
export const toggleJobStatus = authedAction
  .metadata({ actionName: 'toggleJobStatus', category: 'content' })
  .schema(toggleJobStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      type ToggleJobStatusRpcResult = {
        success: boolean;
        old_status: JobStatus;
        new_status: JobStatus;
      };

      const result = await runRpc<ToggleJobStatusRpcResult>(
        'toggle_job_status',
        {
          p_job_id: parsedInput.job_id,
          p_user_id: ctx.userId,
          p_new_status: parsedInput.new_status,
        },
        {
          action: 'jobs.toggleJobStatus.rpc',
          userId: ctx.userId,
          meta: {
            jobId: parsedInput.job_id,
            newStatus: parsedInput.new_status,
          },
        }
      );

      if (!result.success) {
        throw new Error('Job status toggle failed');
      }

      logger.info('Job status toggled successfully', {
        userId: ctx.userId,
        jobId: parsedInput.job_id,
        oldStatus: result.old_status,
        newStatus: result.new_status,
      });

      revalidatePath('/account/jobs');
      revalidatePath('/jobs');

      // Statsig-powered cache invalidation
      await invalidateJobCaches({
        keys: ['cache.invalidate.job_status'],
      });
      revalidateTag(`job-${parsedInput.job_id}`, 'default');

      return {
        success: true,
        oldStatus: result.old_status,
        newStatus: result.new_status,
      };
    } catch (error) {
      throw logActionFailure('jobs.toggleJobStatus', error, {
        userId: ctx.userId,
        jobId: parsedInput.job_id,
        newStatus: parsedInput.new_status,
      });
    }
  });
