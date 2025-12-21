import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getPaymentPlanCatalog, getJobBillingSummaries, type PaymentPlanCatalogEntry, type JobBillingSummaryEntry } from './payments';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock cached-data-factory - use globalThis to avoid hoisting issues
vi.mock('./cached-data-factory', () => {
  if (!(globalThis as any).__paymentsMocks) {
    (globalThis as any).__paymentsMocks = {
      getPaymentPlanCatalog: vi.fn(),
      getJobBillingSummaries: vi.fn(),
    };
  }
  
  return {
    createDataFunction: vi.fn((config: any) => {
      if (!(globalThis as any).__dataFunctionConfigs) {
        (globalThis as any).__dataFunctionConfigs = new Map();
      }
      (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
      
      if (config.operation === 'getPaymentPlanCatalog') {
        return (globalThis as any).__paymentsMocks.getPaymentPlanCatalog;
      }
      if (config.operation === 'getJobBillingSummaries') {
        return (globalThis as any).__paymentsMocks.getJobBillingSummaries;
      }
      return vi.fn().mockResolvedValue(null);
    }),
  };
});

describe('payments data functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if ((globalThis as any).__paymentsMocks) {
      (globalThis as any).__paymentsMocks.getPaymentPlanCatalog.mockClear();
      (globalThis as any).__paymentsMocks.getJobBillingSummaries.mockClear();
    }
  });

  describe('getPaymentPlanCatalog', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getPaymentPlanCatalog');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('jobs');
      expect(config?.methodName).toBe('getPaymentPlanCatalog');
      expect(config?.operation).toBe('getPaymentPlanCatalog');
      expect(config?.transformResult).toBeDefined();
    });

    it('should transform result correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getPaymentPlanCatalog');
      const transformResult = config?.transformResult;
      
      const mockData = [
        {
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
          benefits: ['benefit1', 'benefit2'],
          billing_cycle_days: null,
          description: 'Test plan',
          is_subscription: false,
          job_expiry_days: 30,
          product_type: 'job',
        },
      ];
      
      const result = transformResult(mockData);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('benefits', ['benefit1', 'benefit2']);
      expect(result[0]).toHaveProperty('plan', 'one-time');
    });

    it('should sanitize benefits array', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getPaymentPlanCatalog');
      const transformResult = config?.transformResult;
      
      const mockData = [
        {
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
          benefits: ['valid', null, 123, 'also-valid'],
          billing_cycle_days: null,
          description: 'Test',
          is_subscription: false,
          job_expiry_days: 30,
          product_type: 'job',
        },
      ];
      
      const result = transformResult(mockData);
      expect(result[0].benefits).toEqual(['valid', 'also-valid']);
    });
  });

  describe('getJobBillingSummaries', () => {
    it('should return empty array for empty jobIds', async () => {
      const result = await getJobBillingSummaries([]);
      expect(result).toEqual([]);
      expect((globalThis as any).__paymentsMocks.getJobBillingSummaries).not.toHaveBeenCalled();
    });

    it('should call cached function with jobIds', async () => {
      const mockResult: JobBillingSummaryEntry[] = [
        {
          job_id: 'job-1',
          plan: 'one-time',
          tier: 'standard',
          price_cents: 1000,
          billing_cycle_days: null,
          is_subscription: false,
          job_expiry_days: 30,
          last_payment_amount: null,
          last_payment_at: null,
          last_payment_status: null,
          subscription_renews_at: null,
          subscription_status: null,
        },
      ];
      (globalThis as any).__paymentsMocks.getJobBillingSummaries.mockResolvedValue(mockResult);

      const result = await getJobBillingSummaries(['job-1', 'job-2']);

      expect(result).toEqual(mockResult);
      expect((globalThis as any).__paymentsMocks.getJobBillingSummaries).toHaveBeenCalledWith(['job-1', 'job-2']);
    });

    it('should return empty array on null result', async () => {
      (globalThis as any).__paymentsMocks.getJobBillingSummaries.mockResolvedValue(null);

      const result = await getJobBillingSummaries(['job-1']);

      expect(result).toEqual([]);
    });
  });
});

