import 'server-only';

import { PRICING_CONFIG } from '../config/unified-config.ts';

export interface PartnerPricing {
  jobs: {
    discounted: number;
    durationDays: number;
    regular: number;
  };
  launch: {
    discountPercent: number;
    enabled: boolean;
    endDate: string;
  };
  sponsored: {
    discounted: number;
    regular: number;
  };
}

/**
 * Get partner pricing configuration
 * From unified-config.ts (single source of truth)
 */
export function getPartnerPricing(): PartnerPricing {
  return {
    jobs: {
      regular: PRICING_CONFIG['jobs.regular'],
      discounted: PRICING_CONFIG['jobs.discounted'],
      durationDays: PRICING_CONFIG['jobs.duration_days'],
    },
    sponsored: {
      regular: PRICING_CONFIG['sponsored.regular'],
      discounted: PRICING_CONFIG['sponsored.discounted'],
    },
    launch: {
      discountPercent: PRICING_CONFIG.launch_discount_percent,
      enabled: PRICING_CONFIG.launch_discount_enabled,
      endDate: PRICING_CONFIG.launch_discount_end_date,
    },
  };
}
