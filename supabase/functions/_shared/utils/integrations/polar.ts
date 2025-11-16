import { edgeEnv } from '../../config/env.ts';
import { createUtilityContext } from '../logging.ts';
import { fetchWithRetry } from './http-client.ts';

/**
 * Polar.sh API utilities - checkout session creation with metadata
 */
interface CreateCheckoutParams {
  productPriceId: string;
  jobId: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  successUrl: string;
}

interface PolarCheckoutResponse {
  id: string;
  url: string;
  client_secret: string;
  payment_processor: string;
}

/**
 * Create Polar checkout session with job_id metadata
 * Metadata is passed to webhook for job activation
 */
export async function createPolarCheckout(
  params: CreateCheckoutParams
): Promise<{ url: string; sessionId: string } | { error: string }> {
  const logContext = createUtilityContext('polar', 'create-checkout', {
    jobId: params.jobId,
    userId: params.userId,
  });

  const polarAccessToken = edgeEnv.polar.accessToken;
  const polarEnvironment = edgeEnv.polar.environment;

  if (!polarAccessToken) {
    console.error('POLAR_ACCESS_TOKEN not configured', logContext);
    return { error: 'Payment system not configured' };
  }

  const apiUrl =
    polarEnvironment === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

  try {
    const { response } = await fetchWithRetry({
      url: `${apiUrl}/v1/checkouts/custom`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${polarAccessToken}`,
      },
      body: JSON.stringify({
        product_price_id: params.productPriceId,
        success_url: params.successUrl,
        customer_email: params.customerEmail,
        customer_name: params.customerName || undefined,
        metadata: {
          job_id: params.jobId,
          user_id: params.userId,
          source: 'claudepro_directory',
        },
      }),
      logContext,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Polar checkout creation failed', {
        ...logContext,
        status: response.status,
        error: errorText,
      });
      return { error: `Payment setup failed: ${response.statusText}` };
    }

    const session = (await response.json()) as PolarCheckoutResponse;

    console.log('Polar checkout session created', {
      ...logContext,
      sessionId: session.id,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Polar checkout creation error', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: 'Failed to create checkout session' };
  }
}

/**
 * Get Polar product price ID based on plan and tier
 */
export function getPolarProductPriceId(plan: string, tier: string): string | null {
  const productPriceIds = {
    // One-time payments
    'one-time_standard': edgeEnv.polar.productPrices.oneTimeStandard,
    'one-time_featured': edgeEnv.polar.productPrices.oneTimeFeatured,
    // Subscription payments
    subscription_standard: edgeEnv.polar.productPrices.subscriptionStandard,
    subscription_featured: edgeEnv.polar.productPrices.subscriptionFeatured,
  };

  const key = `${plan}_${tier}` as keyof typeof productPriceIds;
  return productPriceIds[key] || null;
}
