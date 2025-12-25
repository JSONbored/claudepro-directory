import { describe, expect, it, jest } from '@jest/globals';
import { getPartnerPricing } from './marketing';
import { PRICING_CONFIG } from '../config/unified-config';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock unified-config
jest.mock('../config/unified-config', () => ({
  PRICING_CONFIG: {
    'jobs.discounted': 50,
    'jobs.duration_days': 30,
    'jobs.regular': 100,
    launch_discount_percent: 20,
    launch_discount_enabled: true,
    launch_discount_end_date: '2024-12-31',
    'sponsored.discounted': 75,
    'sponsored.regular': 150,
  },
}));

describe('marketing data functions', () => {
  describe('getPartnerPricing', () => {
    it('should return partner pricing configuration', () => {
      const result = getPartnerPricing();

      expect(result).toEqual({
        jobs: {
          discounted: 50,
          durationDays: 30,
          regular: 100,
        },
        launch: {
          discountPercent: 20,
          enabled: true,
          endDate: '2024-12-31',
        },
        sponsored: {
          discounted: 75,
          regular: 150,
        },
      });
    });

    it('should use values from PRICING_CONFIG', () => {
      const result = getPartnerPricing();

      expect(result.jobs.discounted).toBe(PRICING_CONFIG['jobs.discounted']);
      expect(result.jobs.regular).toBe(PRICING_CONFIG['jobs.regular']);
      expect(result.launch.discountPercent).toBe(PRICING_CONFIG.launch_discount_percent);
    });
  });
});
