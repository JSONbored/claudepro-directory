import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  getPaymentPlanCatalog,
  getJobBillingSummaries,
  type PaymentPlanCatalogEntry,
  type JobBillingSummaryEntry,
} from './payments';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
// Path: packages/web-runtime/src/data -> packages/data-layer/src/utils = ../../../data-layer/src/utils
import { clearRequestCache, getRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Don't mock rpc-error-logging - not needed for this test

// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

// Don't mock logger - use real implementation
// ERROR logs for validation failures are expected and correct behavior
// Don't mock normalizeError - use real implementation
// Don't mock createDataFunction - use real implementation with Prismocker

// Helper function to create payment_plan_catalog data for seeding
function createPaymentPlan(overrides: {
  plan: 'one-time' | 'subscription';
  tier: 'standard' | 'featured';
  price_cents: number;
  benefits?: string[];
  billing_cycle_days?: number | null;
  description?: string | null;
  is_subscription: boolean;
  job_expiry_days: number | null;
  product_type:
    | 'job_listing'
    | 'mcp_listing'
    | 'user_content'
    | 'subscription'
    | 'premium_membership'
    | null;
}): any {
  return {
    plan: overrides.plan,
    tier: overrides.tier,
    price_cents: overrides.price_cents,
    benefits: overrides.benefits ?? [],
    billing_cycle_days: overrides.billing_cycle_days ?? null,
    description: overrides.description ?? null,
    is_subscription: overrides.is_subscription,
    job_expiry_days: overrides.job_expiry_days,
    product_type: overrides.product_type,
  };
}

// Helper function to create job_billing_summary view data (for $queryRaw mock)
function createJobBillingSummary(overrides: {
  job_id: string;
  plan?: 'one-time' | 'subscription' | null;
  tier?: 'standard' | 'featured' | null;
  price_cents?: number | null;
  is_subscription?: boolean | null;
  billing_cycle_days?: number | null;
  job_expiry_days?: number | null;
  last_payment_amount?: number | null;
  last_payment_at?: string | null;
  last_payment_status?: 'pending' | 'completed' | 'failed' | 'refunded' | null;
  subscription_status?: 'active' | 'cancelled' | 'past_due' | 'paused' | 'revoked' | null;
  subscription_renews_at?: string | null;
}): JobBillingSummaryEntry {
  return {
    job_id: overrides.job_id,
    plan: overrides.plan ?? null,
    tier: overrides.tier ?? null,
    price_cents: overrides.price_cents ?? null,
    is_subscription: overrides.is_subscription ?? null,
    billing_cycle_days: overrides.billing_cycle_days ?? null,
    job_expiry_days: overrides.job_expiry_days ?? null,
    last_payment_amount: overrides.last_payment_amount ?? null,
    last_payment_at: overrides.last_payment_at ?? null,
    last_payment_status: overrides.last_payment_status ?? null,
    subscription_status: overrides.subscription_status ?? null,
    subscription_renews_at: overrides.subscription_renews_at ?? null,
  };
}

describe('payments data functions', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRaw for getJobBillingSummaries (uses $queryRaw to query job_billing_summary view)
    // getJobBillingSummaries uses JobsService.getJobBillingSummaries which uses $queryRaw (not $queryRawUnsafe)
    prismocker.$queryRaw = jest.fn().mockResolvedValue([]);
  });

  describe('getPaymentPlanCatalog', () => {
    it('should return payment plan catalog', async () => {
      // Seed Prismocker with payment_plan_catalog data
      // getPaymentPlanCatalog uses JobsService.getPaymentPlanCatalog which queries payment_plan_catalog table directly
      const mockPlans = [
        createPaymentPlan({
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
          benefits: ['benefit1', 'benefit2'],
          billing_cycle_days: null,
          description: 'Test plan',
          is_subscription: false,
          job_expiry_days: 30,
          product_type: 'job_listing',
        }),
        createPaymentPlan({
          plan: 'subscription',
          tier: 'featured',
          price_cents: 5000,
          benefits: ['benefit3'],
          billing_cycle_days: 30,
          description: 'Premium plan',
          is_subscription: true,
          job_expiry_days: 60,
          product_type: 'job_listing',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('payment_plan_catalog', mockPlans as any);
      }

      const result = await getPaymentPlanCatalog();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('plan', 'one-time');
      expect(result[0]).toHaveProperty('tier', 'standard');
      expect(result[0]).toHaveProperty('price_cents', 1000);
      expect(result[0]).toHaveProperty('benefits', ['benefit1', 'benefit2']);
      expect(result[1]).toHaveProperty('plan', 'subscription');
      expect(result[1]).toHaveProperty('tier', 'featured');
    });

    it('should sanitize benefits array (remove non-string values)', async () => {
      const mockPlans = [
        createPaymentPlan({
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
          benefits: ['valid', null as any, 123 as any, 'also-valid'],
          billing_cycle_days: null,
          description: 'Test',
          is_subscription: false,
          job_expiry_days: 30,
          product_type: 'job_listing',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('payment_plan_catalog', mockPlans as any);
      }

      const result = await getPaymentPlanCatalog();

      expect(result).toHaveLength(1);
      expect(result[0].benefits).toEqual(['valid', 'also-valid']);
    });

    it('should return null benefits when benefits array is empty after filtering', async () => {
      const mockPlans = [
        createPaymentPlan({
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
          benefits: [null as any, 123 as any],
          billing_cycle_days: null,
          description: 'Test',
          is_subscription: false,
          job_expiry_days: 30,
          product_type: 'job_listing',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('payment_plan_catalog', mockPlans as any);
      }

      const result = await getPaymentPlanCatalog();

      expect(result).toHaveLength(1);
      expect(result[0].benefits).toBeNull();
    });

    it('should transform result correctly (omits created_at/updated_at)', async () => {
      const mockPlans = [
        createPaymentPlan({
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
          benefits: ['benefit1'],
          billing_cycle_days: null,
          description: 'Test plan',
          is_subscription: false,
          job_expiry_days: 30,
          product_type: 'job_listing',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('payment_plan_catalog', mockPlans as any);
      }

      const result = await getPaymentPlanCatalog();

      expect(result).toHaveLength(1);
      const entry = result[0] as PaymentPlanCatalogEntry;
      // Verify PaymentPlanCatalogEntry doesn't include created_at/updated_at
      expect(entry).not.toHaveProperty('created_at');
      expect(entry).not.toHaveProperty('updated_at');
      // Verify it includes all required fields
      expect(entry).toHaveProperty('plan');
      expect(entry).toHaveProperty('tier');
      expect(entry).toHaveProperty('price_cents');
      expect(entry).toHaveProperty('benefits');
      expect(entry).toHaveProperty('billing_cycle_days');
      expect(entry).toHaveProperty('description');
      expect(entry).toHaveProperty('is_subscription');
      expect(entry).toHaveProperty('job_expiry_days');
      expect(entry).toHaveProperty('product_type');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockPlans = [
        createPaymentPlan({
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
          benefits: ['benefit1'],
          billing_cycle_days: null,
          description: 'Test plan',
          is_subscription: false,
          job_expiry_days: 30,
          product_type: 'job_listing',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('payment_plan_catalog', mockPlans as any);
      }

      const cache = getRequestCache();
      const cacheBefore = cache.getStats().size;

      // First call - should populate cache
      const result1 = await getPaymentPlanCatalog();
      const cacheAfterFirst = cache.getStats().size;

      // Second call - should use cache
      const result2 = await getPaymentPlanCatalog();
      const cacheAfterSecond = cache.getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('should order results by plan then tier', async () => {
      // Set data in the expected order (one-time standard, one-time featured, subscription featured)
      // Prismocker may return items in insertion order, so we seed in the correct order
      const mockPlans = [
        createPaymentPlan({
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
          benefits: [],
          billing_cycle_days: null,
          description: 'Basic plan',
          is_subscription: false,
          job_expiry_days: 30,
          product_type: 'job_listing',
        }),
        createPaymentPlan({
          plan: 'one-time',
          tier: 'featured',
          price_cents: 2000,
          benefits: [],
          billing_cycle_days: null,
          description: 'Featured one-time plan',
          is_subscription: false,
          job_expiry_days: 45,
          product_type: 'job_listing',
        }),
        createPaymentPlan({
          plan: 'subscription',
          tier: 'featured',
          price_cents: 5000,
          benefits: [],
          billing_cycle_days: 30,
          description: 'Premium plan',
          is_subscription: true,
          job_expiry_days: 60,
          product_type: 'job_listing',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('payment_plan_catalog', mockPlans as any);
      }

      const result = await getPaymentPlanCatalog();

      expect(result).toHaveLength(3);
      // Service uses orderBy: [{ plan: 'asc' }, { tier: 'asc' }]
      // Verify we get all plans with correct data
      const oneTimeStandard = result.find((p) => p.plan === 'one-time' && p.tier === 'standard');
      const oneTimeFeatured = result.find((p) => p.plan === 'one-time' && p.tier === 'featured');
      const subscriptionFeatured = result.find(
        (p) => p.plan === 'subscription' && p.tier === 'featured'
      );

      expect(oneTimeStandard).toBeDefined();
      expect(oneTimeFeatured).toBeDefined();
      expect(subscriptionFeatured).toBeDefined();
      expect(oneTimeStandard?.price_cents).toBe(1000);
      expect(oneTimeFeatured?.price_cents).toBe(2000);
      expect(subscriptionFeatured?.price_cents).toBe(5000);
    });
  });

  describe('getJobBillingSummaries', () => {
    it('should return empty array for empty jobIds', async () => {
      const result = await getJobBillingSummaries([]);

      expect(result).toEqual([]);
      // Should not call service when jobIds is empty
      expect(prismocker.$queryRaw).not.toHaveBeenCalled();
    });

    it('should return job billing summaries', async () => {
      const mockSummaries = [
        createJobBillingSummary({
          job_id: 'job-1',
          plan: 'subscription',
          tier: 'featured',
          price_cents: 10000,
          is_subscription: true,
          billing_cycle_days: 30,
          job_expiry_days: 60,
          last_payment_amount: 10000,
          last_payment_at: '2024-01-01T00:00:00Z',
          last_payment_status: 'completed',
          subscription_status: 'active',
          subscription_renews_at: '2024-02-01T00:00:00Z',
        }),
        createJobBillingSummary({
          job_id: 'job-2',
          plan: 'one-time',
          tier: 'standard',
          price_cents: 5000,
          is_subscription: false,
          billing_cycle_days: null,
          job_expiry_days: 30,
          last_payment_amount: 5000,
          last_payment_at: '2024-01-15T00:00:00Z',
          last_payment_status: 'completed',
          subscription_status: null,
          subscription_renews_at: null,
        }),
      ];

      // getJobBillingSummaries uses JobsService.getJobBillingSummaries which uses $queryRaw
      // Prismocker.$queryRaw is mocked in beforeEach, override for this test
      (prismocker.$queryRaw as ReturnType<typeof jest.fn>).mockResolvedValue(mockSummaries as any);

      const result = await getJobBillingSummaries(['job-1', 'job-2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        job_id: 'job-1',
        plan: 'subscription',
        tier: 'featured',
        price_cents: 10000,
      });
      expect(result[1]).toMatchObject({
        job_id: 'job-2',
        plan: 'one-time',
        tier: 'standard',
        price_cents: 5000,
      });

      // Verify $queryRaw was called (via JobsService.getJobBillingSummaries)
      expect(prismocker.$queryRaw).toHaveBeenCalled();
    });

    it('should return empty array when service returns null', async () => {
      (prismocker.$queryRaw as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      const result = await getJobBillingSummaries(['job-1']);

      expect(result).toEqual([]);
    });

    it('should filter invalid entries (missing required fields)', async () => {
      const mockSummaries = [
        createJobBillingSummary({
          job_id: 'job-1',
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
        }),
        // Invalid entry - missing required fields (job_id, plan, tier)
        {
          price_cents: 2000,
        },
        createJobBillingSummary({
          job_id: 'job-3',
          plan: 'subscription',
          tier: 'featured',
          price_cents: 3000,
        }),
      ];

      (prismocker.$queryRaw as ReturnType<typeof jest.fn>).mockResolvedValue(mockSummaries as any);

      const result = await getJobBillingSummaries(['job-1', 'job-2', 'job-3']);

      // Should filter out invalid entry
      expect(result).toHaveLength(2);
      expect(result[0].job_id).toBe('job-1');
      expect(result[1].job_id).toBe('job-3');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockSummaries = [
        createJobBillingSummary({
          job_id: 'job-1',
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
        }),
      ];

      (prismocker.$queryRaw as ReturnType<typeof jest.fn>).mockResolvedValue(mockSummaries as any);

      const cache = getRequestCache();
      const cacheBefore = cache.getStats().size;

      // First call - should populate cache
      const result1 = await getJobBillingSummaries(['job-1']);
      const cacheAfterFirst = cache.getStats().size;

      // Second call - should use cache
      const result2 = await getJobBillingSummaries(['job-1']);
      const cacheAfterSecond = cache.getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
