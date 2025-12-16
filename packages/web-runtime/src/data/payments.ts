'use server';

import { JobsService } from '@heyclaude/data-layer';
import type { payment_plan_catalogModel } from '@heyclaude/data-layer/prisma';
import type { JobBillingSummary } from '@heyclaude/database-types/postgres-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../index.ts';

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
 *
 * Note: Uses anon client instead of server client to avoid cookies() inside cache scope.
 * This is safe because payment plan catalog is public data that doesn't require authentication.
 */
export async function getPaymentPlanCatalog(): Promise<PaymentPlanCatalogEntry[]> {
  'use cache';

  // Configure cache
  cacheLife({ expire: 7200, revalidate: 3600, stale: 300 }); // 5min stale, 1hr revalidate, 2hr expire
  cacheTag('payment-plans');

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'data/payments',
    operation: 'getPaymentPlanCatalog',
  });

  try {
    // Use JobsService for proper data layer architecture
    const jobsService = new JobsService();
    const data = await jobsService.getPaymentPlanCatalog();

    // Type guard: Validate that data is an array and has expected structure
    if (!Array.isArray(data)) {
      reqLogger.warn(
        { dataType: typeof data },
        'getPaymentPlanCatalog: Expected array but got non-array data'
      );
      return [];
    }

    // Type guard: Validate each entry has required fields
    // RPC returns data with string dates, convert to Prisma types (Date objects)
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

    const result: PaymentPlanCatalogEntry[] = rows.map((entry) =>
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

    reqLogger.info({ count: result.length }, 'getPaymentPlanCatalog: fetched successfully');

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : (typeof error === 'string' ? error : String(error));
    reqLogger.error({ err: errorForLogging }, 'getPaymentPlanCatalog failed');
    throw error;
  }
}

/**
 * Get job billing summaries for a list of job IDs
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific billing data.
 * This allows cookies() to be used inside the cache scope (via createSupabaseServerClient)
 * while still providing per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (jobIds in cache tag)
 * - Not prerendered (runs at request time)
 * @param jobIds
 */
export async function getJobBillingSummaries(jobIds: string[]): Promise<JobBillingSummaryEntry[]> {
  'use cache: private';

  if (jobIds.length === 0) {
    return [];
  }

  // Configure cache
  cacheLife({ expire: 1800, revalidate: 300, stale: 60 }); // 1min stale, 5min revalidate, 30min expire
  // Create cache tag from sorted jobIds for stable cache key
  const sortedJobIds = [...jobIds].sort().join('-');
  cacheTag(`job-billing-${sortedJobIds}`);

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'data/payments',
    operation: 'getJobBillingSummaries',
  });

  try {
    // Use JobsService for proper data layer architecture
    const jobsService = new JobsService();
    const data = await jobsService.getJobBillingSummaries({
      p_job_ids: jobIds,
    });

    // Type guard: Validate that data is an array
    if (!Array.isArray(data)) {
      reqLogger.warn(
        { dataType: typeof data, jobCount: jobIds.length },
        'getJobBillingSummaries: Expected array but got non-array data'
      );
      return [];
    }

    // Type guard: Validate each entry has required fields
    const entries: JobBillingSummaryEntry[] = [];
    for (const entry of data) {
      if (typeof entry === 'object' && 'job_id' in entry && 'plan' in entry && 'tier' in entry) {
        entries.push(entry as JobBillingSummaryEntry);
      }
    }

    return entries;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : (typeof error === 'string' ? error : String(error));
    reqLogger.error(
      { err: errorForLogging, jobCount: jobIds.length },
      'getJobBillingSummaries failed'
    );
    throw error;
  }
}
