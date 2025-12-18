import 'server-only';

import { type payment_plan_catalogModel } from '@heyclaude/data-layer/prisma';

import { createDataFunction } from './cached-data-factory.ts';

// Type for job billing summary (matches job_billing_summary view structure)
// This type represents a single row from the view
interface JobBillingSummary {
  billing_cycle_days: null | number;
  is_subscription: boolean | null;
  job_expiry_days: null | number;
  job_id: string;
  last_payment_amount: null | number;
  last_payment_at: null | string;
  last_payment_status: 'completed' | 'failed' | 'pending' | 'refunded' | null;
  plan: 'one-time' | 'subscription' | null;
  price_cents: null | number;
  subscription_renews_at: null | string;
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'paused' | 'revoked' | null;
  tier: 'featured' | 'standard' | null;
}

type PaymentPlanRow = payment_plan_catalogModel;
type JobBillingSummaryRow = JobBillingSummary;

type PaymentPlanCatalogRowSubset = Pick<
  PaymentPlanRow,
  | 'benefits'
  | 'billing_cycle_days'
  | 'description'
  | 'is_subscription'
  | 'job_expiry_days'
  | 'plan'
  | 'price_cents'
  | 'product_type'
  | 'tier'
>;

export type PaymentPlanCatalogEntry = Omit<PaymentPlanCatalogRowSubset, 'benefits'> & {
  benefits: null | string[];
};

export type JobBillingSummaryEntry = Pick<
  JobBillingSummaryRow,
  | 'billing_cycle_days'
  | 'is_subscription'
  | 'job_expiry_days'
  | 'job_id'
  | 'last_payment_amount'
  | 'last_payment_at'
  | 'last_payment_status'
  | 'plan'
  | 'price_cents'
  | 'subscription_renews_at'
  | 'subscription_status'
  | 'tier'
>;

function sanitizeBenefits(benefits: PaymentPlanRow['benefits']): null | string[] {
  if (!Array.isArray(benefits)) {
    return null;
  }
  const filtered = benefits.filter((item): item is string => typeof item === 'string');
  return filtered.length > 0 ? filtered : null;
}

/**
 * Get payment plan catalog
 * Uses 'use cache' to cache payment plan catalog. This data is public and same for all users.
 */
export const getPaymentPlanCatalog = createDataFunction<void, PaymentPlanCatalogEntry[]>({
  serviceKey: 'jobs',
  methodName: 'getPaymentPlanCatalog',
  module: 'data/payments',
  operation: 'getPaymentPlanCatalog',
  transformResult: (result) => {
    const data = result as PaymentPlanRow[];
    // Type guard: Validate each entry has required fields
    const rows: PaymentPlanRow[] = [];
    for (const entry of data) {
      if (
        typeof entry === 'object' &&
        'plan' in entry &&
        'tier' in entry &&
        'price_cents' in entry
      ) {
        rows.push(entry as PaymentPlanRow);
      }
    }

    return rows.map((entry) =>
      // Extract subset fields (PaymentPlanCatalogEntry omits created_at/updated_at)
      ({
        benefits: sanitizeBenefits(entry.benefits),
        billing_cycle_days: entry.billing_cycle_days,
        description: entry.description,
        is_subscription: entry.is_subscription,
        job_expiry_days: entry.job_expiry_days,
        plan: entry.plan,
        price_cents: entry.price_cents,
        product_type: entry.product_type,
        tier: entry.tier,
      })
    );
  },
  throwOnError: true,
  logContext: (_, result) => ({
    count: Array.isArray(result) ? result.length : 0,
  }),
});

/**
 * Get job billing summaries for a list of job IDs
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific billing data.
 */
export async function getJobBillingSummaries(jobIds: string[]): Promise<JobBillingSummaryEntry[]> {
  if (jobIds.length === 0) {
    return [];
  }

  const cachedFn = createDataFunction<string[], JobBillingSummaryEntry[]>({
    serviceKey: 'jobs',
    methodName: 'getJobBillingSummaries',
    module: 'data/payments',
    operation: 'getJobBillingSummaries',
    transformArgs: (jobIds) => ({ p_job_ids: jobIds }),
    transformResult: (result) => {
      // Type guard: RPC returns unknown[], validate structure before using
      // This is safer than a direct cast because we verify the structure matches JobBillingSummaryEntry
      if (!Array.isArray(result)) {
        return [];
      }
      
      const entries: JobBillingSummaryEntry[] = [];
      for (const entry of result) {
        // Validate entry has required fields before casting
        if (
          typeof entry === 'object' &&
          entry !== null &&
          'job_id' in entry &&
          'plan' in entry &&
          'tier' in entry
        ) {
          entries.push(entry as JobBillingSummaryEntry);
        }
      }
      return entries;
    },
    throwOnError: true,
    logContext: (jobIds) => ({ jobCount: jobIds.length }),
  });

  const result = await cachedFn(jobIds);
  return result ?? [];
}
