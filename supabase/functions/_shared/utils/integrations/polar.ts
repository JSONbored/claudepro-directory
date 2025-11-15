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
  const polarAccessToken = Deno.env.get('POLAR_ACCESS_TOKEN');
  const polarEnvironment = Deno.env.get('POLAR_ENVIRONMENT') || 'production';

  if (!polarAccessToken) {
    console.error('POLAR_ACCESS_TOKEN not configured');
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Polar checkout creation failed:', {
        status: response.status,
        error: errorText,
      });
      return { error: `Payment setup failed: ${response.statusText}` };
    }

    const session = (await response.json()) as PolarCheckoutResponse;

    console.log('Polar checkout session created:', {
      sessionId: session.id,
      jobId: params.jobId,
      userId: params.userId,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Polar checkout creation error:', error);
    return { error: 'Failed to create checkout session' };
  }
}

/**
 * Get Polar product price ID based on plan and tier
 */
export function getPolarProductPriceId(plan: string, tier: string): string | null {
  const productPriceIds = {
    // One-time payments
    'one-time_standard': Deno.env.get('POLAR_PRODUCT_PRICE_ONETIME_STANDARD'),
    'one-time_featured': Deno.env.get('POLAR_PRODUCT_PRICE_ONETIME_FEATURED'),
    // Subscription payments
    subscription_standard: Deno.env.get('POLAR_PRODUCT_PRICE_SUBSCRIPTION_STANDARD'),
    subscription_featured: Deno.env.get('POLAR_PRODUCT_PRICE_SUBSCRIPTION_FEATURED'),
  };

  const key = `${plan}_${tier}` as keyof typeof productPriceIds;
  return productPriceIds[key] || null;
}
