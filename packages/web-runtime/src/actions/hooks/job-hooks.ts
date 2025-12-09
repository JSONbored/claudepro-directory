import type { Database } from '@heyclaude/database-types';
import { env } from '@heyclaude/shared-runtime/schemas/env';
import { normalizeError } from '../../errors';
import { logger } from '../../logging/server.ts';
import { getEnvVar } from '@heyclaude/shared-runtime';

type JobPlan = Database['public']['Enums']['job_plan'];
type JobTier = Database['public']['Enums']['job_tier'];

/**
 * Post-creation hook for job listings
 * Handles Polar checkout creation and emits job lifecycle events to Inngest
 */
export async function onJobCreated(
  result: { job_id: string | null; requires_payment: boolean | null; slug?: string | null | undefined },
  ctx: { userId: string; userEmail?: string | undefined },
  input: { plan?: string | null | undefined; tier?: string | null | undefined; title?: string | null | undefined; company?: string | null | undefined }
) {
  const jobId = result.job_id;
  const requiresPayment = result.requires_payment;
  const plan = (input.plan || 'one-time') as JobPlan;
  const tier = (input.tier || 'standard') as JobTier;
  const title = input.title || 'Job Listing';
  const company = input.company || undefined;

  // Polar.sh checkout integration
  let checkoutUrl: string | null = null;

  if (requiresPayment && jobId) {
    try {
      // Dynamic import to avoid circular deps or load issues
      const { createPolarCheckout, getPolarProductPriceId } = await import(
        '../../integrations/polar.ts'
      );

      const productPriceId = getPolarProductPriceId(plan, tier);

      if (productPriceId) {
        const baseUrl = getEnvVar('NEXT_PUBLIC_BASE_URL') || (env as Record<string, unknown>)['NEXT_PUBLIC_BASE_URL'] as string | undefined;
        
        if (!baseUrl) {
          const configError = new Error('NEXT_PUBLIC_BASE_URL environment variable is required for payment checkout');
          logger.error({ err: configError, jobId,
            userId: ctx.userId, }, 'NEXT_PUBLIC_BASE_URL is not configured');
          throw configError;
        }
        
        const checkoutResult = await createPolarCheckout({
          productPriceId,
          jobId,
          userId: ctx.userId,
          customerEmail: ctx.userEmail || '',
          successUrl: `${baseUrl}/account/jobs?payment=success&job_id=${jobId}`,
          plan,
          tier,
        });

        if ('error' in checkoutResult) {
          const normalized = normalizeError(
            checkoutResult.error,
            'Failed to create Polar checkout'
          );
          logger.error({ err: normalized, jobId,
            userId: ctx.userId, }, 'Failed to create Polar checkout');
        } else {
          checkoutUrl = checkoutResult.url;
          logger.info({ jobId,
            sessionId: checkoutResult.sessionId,
            checkoutUrl: checkoutResult.url, }, 'Polar checkout session created');
        }
      } else {
        logger.warn({ plan,
          tier, }, 'Polar product price ID not configured');
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Polar integration error');
      logger.error({ err: normalized, jobId,
        userId: ctx.userId, }, 'Polar integration error');
    }
  }

  // Emit job created event to Inngest for async processing
  // This triggers Discord notification and other workflows
  if (jobId) {
    try {
      const { inngest } = await import('../../inngest/client.ts');
      
      await inngest.send({
        name: 'email/job-lifecycle',
        data: {
          action: 'submitted',
          jobId,
          jobTitle: title,
          company,
          employerEmail: ctx.userEmail,
          requiresPayment: requiresPayment ?? undefined,
        },
      });

      logger.info({ jobId,
        requiresPayment, }, 'Job created event sent to Inngest');
    } catch (eventError) {
      // Log but don't throw - job was created successfully
      const normalized = normalizeError(eventError, 'Job created event failed');
      logger.warn({ err: normalized,
        jobId, }, 'Failed to send job created event to Inngest');
    }
  }

  // Return enriched result
  return {
    ...result,
    checkoutUrl,
  };
}

/**
 * Post-update hook for job listings
 * Emits update events for tracking and notifications
 */
export async function onJobUpdated(
  result: { job_id: string; slug?: string; title?: string },
  ctx: { userId: string; userEmail?: string },
  input: { job_id: string; updates: Record<string, unknown> }
) {
  try {
    const { inngest } = await import('../../inngest/client.ts');
    
    // Check if this is a status change to 'active' (job published after payment)
    if (input.updates['status'] === 'active') {
      // Get job title: prefer result.title, then updates.title, then fetch from DB
      let jobTitle = result.title || String(input.updates['title'] || '');
      
      if (!jobTitle) {
        // Fetch the actual title from the database
        try {
          const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
          const supabase = createSupabaseAdminClient();
          const { data: job } = await supabase
            .from('jobs')
            .select('title')
            .eq('id', result.job_id)
            .single();
          jobTitle = job?.title || 'Job Listing';
        } catch {
          jobTitle = 'Job Listing';
        }
      }
      
      // Emit job published event - triggers drip campaign
      await inngest.send({
        name: 'job/published',
        data: {
          jobId: result.job_id,
          employerEmail: ctx.userEmail || '',
          employerName: '', // Could be enriched from user profile
          jobTitle,
          jobSlug: result.slug || result.job_id,
        },
      });

      logger.info({ jobId: result.job_id, }, 'Job published event sent to Inngest');
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Job update event failed');
    logger.warn({ err: normalized,
      jobId: result.job_id, }, 'Failed to send job update event');
  }

  return result;
}

/**
 * Post-deletion hook for job listings
 */
export async function onJobDeleted(
  result: { success: boolean },
  ctx: { userId: string },
  input: { job_id: string }
) {
  if (result.success) {
    logger.info({ jobId: input.job_id,
      userId: ctx.userId, }, 'Job deleted');
  }

  return result;
}

/**
 * Post-status-toggle hook for job listings
 */
export async function onJobStatusToggled(
  result: { job_id: string; new_status: string },
  ctx: { userId: string; userEmail?: string },
  input: { job_id: string; new_status: string }
) {
  try {
    const { inngest } = await import('../../inngest/client.ts');
    
    // Map status to lifecycle action
    const actionMap: Record<string, string> = {
      'active': 'activated',
      'paused': 'paused',
      'expired': 'expired',
      'draft': 'draft',
    };

    const action = actionMap[input.new_status];
    
    if (action) {
      await inngest.send({
        name: 'email/job-lifecycle',
        data: {
          action,
          jobId: result.job_id,
          employerEmail: ctx.userEmail,
        },
      });

      logger.info({ jobId: result.job_id,
        newStatus: input.new_status,
        action, }, 'Job status change event sent to Inngest');
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Job status event failed');
    logger.warn({ err: normalized,
      jobId: result.job_id, }, 'Failed to send job status event');
  }

  return result;
}
