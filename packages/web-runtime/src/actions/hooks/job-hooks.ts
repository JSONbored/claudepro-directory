import { env } from '@heyclaude/shared-runtime/schemas/env';
import { normalizeError } from '../../errors';
import { logger } from '../../logger';
import { getEnvVar } from '@heyclaude/shared-runtime';

export async function onJobCreated(
  result: any,
  ctx: { userId: string; userEmail?: string },
  input: any
) {
  const jobId = result.job_id;
  const requiresPayment = result.requires_payment;
  const plan = input.plan;
  const tier = input.tier;

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
          logger.error('NEXT_PUBLIC_BASE_URL is not configured', configError, {
            jobId,
            userId: ctx.userId,
          });
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
          logger.error('Failed to create Polar checkout', normalized, {
            jobId,
            userId: ctx.userId,
          });
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
          plan,
          tier,
        });
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Polar integration error');
      logger.error('Polar integration error', normalized, {
        jobId,
        userId: ctx.userId,
      });
    }
  }

  // Return enriched result
  return {
    ...result,
    checkoutUrl,
  };
}
