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
import type { Database } from '@/src/types/database.types';

// Create const arrays for Zod enum validation
const JOB_STATUS_VALUES = [
  'draft',
  'pending_payment',
  'pending_review',
  'active',
  'expired',
  'rejected',
  'deleted',
] as const satisfies readonly Database['public']['Enums']['job_status'][];

const WORKPLACE_TYPE_VALUES = [
  'Remote',
  'On site',
  'Hybrid',
] as const satisfies readonly Database['public']['Enums']['workplace_type'][];

const EXPERIENCE_LEVEL_VALUES = [
  'beginner',
  'intermediate',
  'advanced',
] as const satisfies readonly Database['public']['Enums']['experience_level'][];

const JOB_CATEGORY_VALUES = [
  'engineering',
  'design',
  'product',
  'marketing',
  'sales',
  'support',
  'research',
  'data',
  'operations',
  'leadership',
  'consulting',
  'education',
  'other',
] as const satisfies readonly Database['public']['Enums']['job_category'][];

const JOB_TYPE_VALUES = [
  'full-time',
  'part-time',
  'contract',
  'freelance',
  'internship',
] as const satisfies readonly Database['public']['Enums']['job_type'][];

const JOB_PLAN_VALUES = [
  'one-time',
  'subscription',
] as const satisfies readonly Database['public']['Enums']['job_plan'][];

const JOB_TIER_VALUES = [
  'standard',
  'featured',
] as const satisfies readonly Database['public']['Enums']['job_tier'][];

// UUID validation helper
const uuidRefine = (val: string | null | undefined) => {
  if (val === null || val === undefined || val === '') return true; // Allow null/empty for optional
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
};

// Email validation helper
const emailRefine = (val: string | null | undefined) => {
  if (val === null || val === undefined || val === '') return true; // Allow null/empty for optional
  try {
    const parts = val.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local) return false;
    if (!domain) return false;
    if (!domain.includes('.')) return false;
    if (val.includes(' ')) return false;
    return true;
  } catch {
    return false;
  }
};

// URL validation helper
const urlRefine = (val: string | null | undefined) => {
  if (val === null || val === undefined || val === '') return true; // Allow null/empty for optional
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
};

// Minimal Zod schemas (database CHECK constraints do real validation)
const createJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  company_id: z
    .string()
    .refine(uuidRefine, { message: 'Invalid UUID format' })
    .optional()
    .nullable(),
  description: z.string(),
  location: z.string().optional().nullable(),
  salary: z.string().optional().nullable(),
  remote: z.boolean().optional(),
  type: z.enum([...JOB_TYPE_VALUES] as [
    Database['public']['Enums']['job_type'],
    ...Database['public']['Enums']['job_type'][],
  ]),
  workplace: z
    .enum([...WORKPLACE_TYPE_VALUES] as [
      Database['public']['Enums']['workplace_type'],
      ...Database['public']['Enums']['workplace_type'][],
    ])
    .optional()
    .nullable(),
  experience: z
    .enum([...EXPERIENCE_LEVEL_VALUES] as [
      Database['public']['Enums']['experience_level'],
      ...Database['public']['Enums']['experience_level'][],
    ])
    .optional()
    .nullable(),
  category: z.enum([...JOB_CATEGORY_VALUES] as [
    Database['public']['Enums']['job_category'],
    ...Database['public']['Enums']['job_category'][],
  ]),
  tags: z.array(z.string()),
  requirements: z.array(z.string()),
  benefits: z.array(z.string()),
  link: z.string(),
  contact_email: z
    .string()
    .refine(emailRefine, { message: 'Invalid email address' })
    .optional()
    .nullable(),
  company_logo: z
    .string()
    .refine(urlRefine, { message: 'Invalid URL format' })
    .optional()
    .nullable(),
  plan: z.enum([...JOB_PLAN_VALUES] as [
    Database['public']['Enums']['job_plan'],
    ...Database['public']['Enums']['job_plan'][],
  ]),
  tier: z.enum([...JOB_TIER_VALUES] as [
    Database['public']['Enums']['job_tier'],
    ...Database['public']['Enums']['job_tier'][],
  ]),
});

const updateJobSchema = z.object({
  job_id: z.string().refine(uuidRefine, { message: 'Invalid UUID format' }),
  title: z.string().optional(),
  company: z.string().optional(),
  company_id: z
    .string()
    .refine(uuidRefine, { message: 'Invalid UUID format' })
    .optional()
    .nullable(),
  description: z.string().optional(),
  location: z.string().optional().nullable(),
  salary: z.string().optional().nullable(),
  remote: z.boolean().optional(),
  type: z
    .enum([...JOB_TYPE_VALUES] as [
      Database['public']['Enums']['job_type'],
      ...Database['public']['Enums']['job_type'][],
    ])
    .optional(),
  workplace: z.string().optional().nullable(),
  experience: z
    .enum([...EXPERIENCE_LEVEL_VALUES] as [
      Database['public']['Enums']['experience_level'],
      ...Database['public']['Enums']['experience_level'][],
    ])
    .optional()
    .nullable(),
  category: z
    .enum([...JOB_CATEGORY_VALUES] as [
      Database['public']['Enums']['job_category'],
      ...Database['public']['Enums']['job_category'][],
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  link: z.string().optional(),
  contact_email: z
    .string()
    .refine(emailRefine, { message: 'Invalid email address' })
    .optional()
    .nullable(),
  company_logo: z
    .string()
    .refine(urlRefine, { message: 'Invalid URL format' })
    .optional()
    .nullable(),
});

// Export inferred types for use in components and pages
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

const deleteJobSchema = z.object({
  job_id: z.string().refine(uuidRefine, { message: 'Invalid UUID format' }),
});

const toggleJobStatusSchema = z.object({
  job_id: z.string().refine(uuidRefine, { message: 'Invalid UUID format' }),
  new_status: z.enum([...JOB_STATUS_VALUES] as [
    Database['public']['Enums']['job_status'],
    ...Database['public']['Enums']['job_status'][],
  ]),
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
  .inputSchema(createJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      // Construct composite type from parsed input
      const jobData: Database['public']['CompositeTypes']['job_create_input'] = {
        company: parsedInput.company,
        company_id: parsedInput.company_id ?? null,
        title: parsedInput.title,
        description: parsedInput.description,
        type: parsedInput.type,
        category: parsedInput.category,
        link: parsedInput.link,
        location: parsedInput.location ?? null,
        salary: parsedInput.salary ?? null,
        remote: parsedInput.remote ?? null,
        workplace: parsedInput.workplace ?? null,
        experience: parsedInput.experience ?? null,
        tags: parsedInput.tags,
        requirements: parsedInput.requirements,
        benefits: parsedInput.benefits,
        contact_email: parsedInput.contact_email ?? null,
        company_logo: parsedInput.company_logo ?? null,
      };

      const result = await runRpc<
        Database['public']['Functions']['create_job_with_payment']['Returns']
      >(
        'create_job_with_payment',
        {
          p_user_id: ctx.userId,
          p_job_data: jobData,
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

      // Use generated types directly - handle nullability
      const jobId = result.job_id ?? '';
      const companyId = result.company_id ?? '';
      const paymentAmount = result.payment_amount ?? 0;
      const requiresPayment = result.requires_payment ?? false;

      if (!jobId) {
        throw new Error('Job creation failed: missing job_id');
      }

      logger.info('Job created successfully', {
        userId: ctx.userId,
        jobId,
        companyId,
        paymentAmount,
      });

      // Polar.sh checkout integration (READY - pending account approval)
      let checkoutUrl: string | null = null;

      if (requiresPayment) {
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
              jobId,
              userId: ctx.userId,
              customerEmail: ctx.userEmail || '',
              successUrl: `${process.env['NEXT_PUBLIC_BASE_URL']}/account/jobs?payment=success&job_id=${jobId}`,
            });

            if ('error' in checkoutResult) {
              logger.error('Failed to create Polar checkout', new Error(checkoutResult.error), {
                jobId,
                userId: ctx.userId,
              });
              // Job created but checkout failed
              // User will see message to contact support for payment
            } else {
              checkoutUrl = checkoutResult.url;
              logger.info('Polar checkout session created', {
                jobId,
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
              jobId,
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
      if (companyId) {
        revalidateTag(`company-${companyId}`, 'default');
        revalidateTag(`company-id-${companyId}`, 'default');
      }
      revalidateTag(`job-${jobId}`, 'default');

      return {
        success: true,
        jobId,
        companyId,
        paymentAmount,
        requiresPayment,
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
  .inputSchema(updateJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { job_id, ...updates } = parsedInput;

      const result = await runRpc<Database['public']['Functions']['update_job']['Returns']>(
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

      // Extract job_id with null check
      const updatedJobId = result.job_id;
      if (updatedJobId == null) {
        throw new Error('Job update returned null job_id');
      }

      logger.info('Job updated successfully', {
        userId: ctx.userId,
        jobId: updatedJobId,
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
        jobId: updatedJobId,
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
  .inputSchema(deleteJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await runRpc<Database['public']['Functions']['delete_job']['Returns']>(
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

      // Use generated types directly - handle nullability
      const jobId = result.job_id ?? '';

      if (!jobId) {
        throw new Error('Job deletion failed: missing job_id');
      }

      logger.info('Job deleted successfully', {
        userId: ctx.userId,
        jobId,
      });

      revalidatePath('/account/jobs');
      revalidatePath('/jobs');

      // Statsig-powered cache invalidation
      await invalidateJobCaches({
        keys: ['cache.invalidate.job_delete'],
      });
      revalidateTag(`job-${jobId}`, 'default');

      return {
        success: true,
        jobId,
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
  .inputSchema(toggleJobStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await runRpc<Database['public']['Functions']['toggle_job_status']['Returns']>(
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

      const oldStatus = result.old_status;
      const newStatus = result.new_status;

      if (oldStatus == null || newStatus == null) {
        throw new Error('Job status toggle returned null status values');
      }

      logger.info('Job status toggled successfully', {
        userId: ctx.userId,
        jobId: parsedInput.job_id,
        oldStatus,
        newStatus,
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
        oldStatus,
        newStatus,
      };
    } catch (error) {
      throw logActionFailure('jobs.toggleJobStatus', error, {
        userId: ctx.userId,
        jobId: parsedInput.job_id,
        newStatus: parsedInput.new_status,
      });
    }
  });
