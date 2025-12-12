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
      discounted: PRICING_CONFIG['jobs.discounted'],
      durationDays: PRICING_CONFIG['jobs.duration_days'],
      regular: PRICING_CONFIG['jobs.regular'],
    },
    launch: {
      discountPercent: PRICING_CONFIG.launch_discount_percent,
      enabled: PRICING_CONFIG.launch_discount_enabled,
      endDate: PRICING_CONFIG.launch_discount_end_date,
    },
    sponsored: {
      discounted: PRICING_CONFIG['sponsored.discounted'],
      regular: PRICING_CONFIG['sponsored.regular'],
    },
  };
}
