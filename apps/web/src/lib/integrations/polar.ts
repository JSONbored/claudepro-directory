/**
 * Polar.sh API Integration - Node.js Server Actions Version
 * Checkout session creation with job metadata
 *
 * SETUP REQUIRED: Add these environment variables when Polar account is approved:
 * - POLAR_ACCESS_TOKEN (from Polar dashboard)
 * - POLAR_ENVIRONMENT (production or sandbox)
 * - POLAR_PRODUCT_PRICE_ONETIME_STANDARD
 * - POLAR_PRODUCT_PRICE_ONETIME_FEATURED
 * - POLAR_PRODUCT_PRICE_SUBSCRIPTION_STANDARD
 * - POLAR_PRODUCT_PRICE_SUBSCRIPTION_FEATURED
 */

import type { Database } from '@heyclaude/database-types';
import { logger, normalizeError } from '@heyclaude/web-runtime';

interface CreateCheckoutParams {
  productPriceId: string;
  jobId: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  successUrl: string;
  plan: Database['public']['Enums']['job_plan'];
  tier: Database['public']['Enums']['job_tier'];
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
 *
 * @returns { url, sessionId } on success, { error } on failure
 */
export async function createPolarCheckout(
  params: CreateCheckoutParams
): Promise<{ url: string; sessionId: string } | { error: string }> {
  const polarAccessToken = process.env['POLAR_ACCESS_TOKEN'];
  const polarEnvironment = process.env['POLAR_ENVIRONMENT'] || 'production';

  if (!polarAccessToken) {
    logger.error('Polar: POLAR_ACCESS_TOKEN not configured');
    return { error: 'Payment system not configured. Please contact support.' };
  }

  const apiUrl =
    polarEnvironment === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

  try {
    const response = await fetch(`${apiUrl}/v1/checkouts/custom`, {
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
          plan: params.plan,
          tier: params.tier,
          product_type: 'job_listing',
          source: 'claudepro_directory',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const normalized = normalizeError(response.statusText, 'Polar checkout creation failed');
      logger.error('Polar checkout creation failed', normalized, {
        status: response.status,
        error: errorText,
      });
      return { error: `Payment setup failed: ${response.statusText}` };
    }

    const session = (await response.json()) as PolarCheckoutResponse;

    logger.info('Polar checkout session created', {
      sessionId: session.id,
      jobId: params.jobId,
      userId: params.userId,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'Polar checkout creation error');
    logger.error('Polar checkout creation error', normalized);
    return { error: 'Failed to create checkout session. Please try again.' };
  }
}

/**
 * Get Polar product price ID based on plan and tier
 *
 * SETUP REQUIRED: Configure these in .env.local after Polar account approval:
 * - POLAR_PRODUCT_PRICE_ONETIME_STANDARD
 * - POLAR_PRODUCT_PRICE_ONETIME_FEATURED
 * - POLAR_PRODUCT_PRICE_SUBSCRIPTION_STANDARD
 * - POLAR_PRODUCT_PRICE_SUBSCRIPTION_FEATURED
 *
 * @returns Polar product price ID or null if not configured
 */
export function getPolarProductPriceId(
  plan: Database['public']['Enums']['job_plan'],
  tier: Database['public']['Enums']['job_tier']
): string | null {
  const productPriceIds = {
    // One-time payments
    'one-time_standard': process.env['POLAR_PRODUCT_PRICE_ONETIME_STANDARD'],
    'one-time_featured': process.env['POLAR_PRODUCT_PRICE_ONETIME_FEATURED'],
    // Subscription payments
    subscription_standard: process.env['POLAR_PRODUCT_PRICE_SUBSCRIPTION_STANDARD'],
    subscription_featured: process.env['POLAR_PRODUCT_PRICE_SUBSCRIPTION_FEATURED'],
  };

  const key = `${plan}_${tier}` as keyof typeof productPriceIds;
  const priceId = productPriceIds[key];

  if (!priceId) {
    logger.warn(`Polar product price ID not configured for: ${key}`);
    return null;
  }

  return priceId;
}

/**
 * Validate Polar configuration
 * Call this on startup to ensure all required env vars are set
 *
 * @returns { configured: true } or { configured: false, missing: string[] }
 */
export function validatePolarConfig(): { configured: boolean; missing?: string[] } {
  const requiredVars = [
    'POLAR_ACCESS_TOKEN',
    'POLAR_PRODUCT_PRICE_ONETIME_STANDARD',
    'POLAR_PRODUCT_PRICE_ONETIME_FEATURED',
    'POLAR_PRODUCT_PRICE_SUBSCRIPTION_STANDARD',
    'POLAR_PRODUCT_PRICE_SUBSCRIPTION_FEATURED',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    logger.warn('Polar configuration incomplete', { missing: missing.join(', ') });
    return { configured: false, missing };
  }

  return { configured: true };
}
