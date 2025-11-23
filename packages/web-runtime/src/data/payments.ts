'use server';

import type { Database } from '@heyclaude/database-types';
import { cache } from 'react';
import { logger, normalizeError } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';

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
  const supabase = await createSupabaseServerClient();

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
    const normalized = normalizeError(error, 'Failed to load payment_plan_catalog');
    logger.error('payments:getPaymentPlanCatalog failed', normalized);
    throw normalized;
  }

  if (!data) {
    return [];
  }

  // Cast data to known Row type to help inference if select string is ambiguous
  const rows = data as unknown as PaymentPlanCatalogRowSubset[];

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
});

export async function getJobBillingSummaries(
  jobIds: string[]
): Promise<JobBillingSummaryEntry[]> {
  if (jobIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

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
    const normalized = normalizeError(error, 'Failed to fetch job billing summaries');
    logger.error('payments:getJobBillingSummaries failed', normalized, {
      jobCount: jobIds.length,
    });
    throw normalized;
  }

  // Cast to ensure type safety without using 'any'
  return (data as unknown as JobBillingSummaryEntry[]) ?? [];
}
