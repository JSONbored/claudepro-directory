'use server';

import type { Database } from '@heyclaude/database-types';
import { cache } from 'react';

import { logger, normalizeError } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';
import { generateRequestId } from '../utils/request-context.ts';

type PaymentPlanRow = Database['public']['Tables']['payment_plan_catalog']['Row'];
type JobBillingSummaryRow = Database['public']['Views']['job_billing_summary']['Row'];

type PaymentPlanCatalogRowSubset = Pick<
  PaymentPlanRow,
  'plan' | 'tier' | 'price_cents' | 'is_subscription' | 'billing_cycle_days' | 'job_expiry_days' | 'description' | 'benefits' | 'product_type'
>;

export type PaymentPlanCatalogEntry = Omit<PaymentPlanCatalogRowSubset, 'benefits'> & {
  benefits: string[] | null;
};

export type JobBillingSummaryEntry = Pick<
  JobBillingSummaryRow,
  | 'job_id'
  | 'plan'
  | 'tier'
  | 'price_cents'
  | 'is_subscription'
  | 'billing_cycle_days'
  | 'job_expiry_days'
  | 'last_payment_amount'
  | 'last_payment_at'
  | 'last_payment_status'
  | 'subscription_status'
  | 'subscription_renews_at'
>;

function sanitizeBenefits(benefits: PaymentPlanRow['benefits']): string[] | null {
  if (!Array.isArray(benefits)) {
    return null;
  }
  const filtered = benefits.filter((item): item is string => typeof item === 'string');
  return filtered.length > 0 ? filtered : null;
}

export const getPaymentPlanCatalog = cache(async (): Promise<PaymentPlanCatalogEntry[]> => {
  const { trackPerformance } = await import('../utils/performance-metrics');
  const supabase = await createSupabaseServerClient();

  try {
    const { result: data } = await trackPerformance(
      async () => {
        const { data, error } = await supabase
          .from('payment_plan_catalog')
          .select(
            [
              'plan',
              'tier',
              'price_cents',
              'is_subscription',
              'billing_cycle_days',
              'job_expiry_days',
              'description',
              'benefits',
              'product_type',
            ].join(',')
          )
          .order('plan')
          .order('tier');

        if (error) {
          throw error;
        }

        return data;
      },
      {
        operation: 'getPaymentPlanCatalog',
        logLevel: 'info',
      }
    );

    // Type guard: Validate that data is an array and has expected structure
    if (!Array.isArray(data)) {
      logger.warn('getPaymentPlanCatalog: Expected array but got non-array data', {
        requestId: generateRequestId(),
        operation: 'getPaymentPlanCatalog',
        dataType: typeof data,
      });
      return [];
    }

    // Type guard: Validate each entry has required fields
    const rows: PaymentPlanCatalogRowSubset[] = [];
    for (const entry of data) {
      if (
        typeof entry === 'object' &&
        'plan' in entry &&
        'tier' in entry &&
        'price_cents' in entry
      ) {
        rows.push(entry as PaymentPlanCatalogRowSubset);
      }
    }

    return rows.map((entry) => ({
      plan: entry.plan,
      tier: entry.tier,
      price_cents: entry.price_cents,
      is_subscription: entry.is_subscription,
      billing_cycle_days: entry.billing_cycle_days,
      job_expiry_days: entry.job_expiry_days,
      description: entry.description,
      benefits: sanitizeBenefits(entry.benefits),
      product_type: entry.product_type,
    }));
  } catch (error) {
    // trackPerformance already logs the error with performance metrics
    const normalized = normalizeError(error, 'Failed to load payment_plan_catalog');
    throw normalized;
  }
});

export async function getJobBillingSummaries(
  jobIds: string[]
): Promise<JobBillingSummaryEntry[]> {
  if (jobIds.length === 0) {
    return [];
  }

  const { trackPerformance } = await import('../utils/performance-metrics');
  const { createSupabaseServerClient } = await import('../supabase/server.ts');
  const supabase = await createSupabaseServerClient();

  try {
    const { result: data } = await trackPerformance(
      async () => {
        const { data, error } = await supabase
          .from('job_billing_summary')
          .select(
            [
              'job_id',
              'plan',
              'tier',
              'price_cents',
              'is_subscription',
              'billing_cycle_days',
              'job_expiry_days',
              'last_payment_amount',
              'last_payment_at',
              'last_payment_status',
              'subscription_status',
              'subscription_renews_at',
            ].join(',')
          )
          .in('job_id', jobIds);

        if (error) {
          throw error;
        }

        return data;
      },
      {
        operation: 'getJobBillingSummaries',
        logMeta: { jobCount: jobIds.length },
        logLevel: 'info',
      }
    );

    // Type guard: Validate that data is an array
    if (!Array.isArray(data)) {
      logger.warn('getJobBillingSummaries: Expected array but got non-array data', {
        requestId: generateRequestId(),
        operation: 'getJobBillingSummaries',
        dataType: typeof data,
        jobCount: jobIds.length,
      });
      return [];
    }

    // Type guard: Validate each entry has required fields
    const entries: JobBillingSummaryEntry[] = [];
    for (const entry of data) {
      if (
        typeof entry === 'object' &&
        'job_id' in entry &&
        'plan' in entry &&
        'tier' in entry
      ) {
        entries.push(entry as JobBillingSummaryEntry);
      }
    }

    return entries;
  } catch (error) {
    // trackPerformance already logs the error with performance metrics
    const normalized = normalizeError(error, 'Failed to fetch job billing summaries');
    throw normalized;
  }
}
