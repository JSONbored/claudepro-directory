import 'server-only';

// Use static pricing config
import { PRICING_CONFIG_DEFAULTS } from '../feature-flags/defaults.ts';

export interface PartnerPricing {
  jobs: {
    regular: number;
    discounted: number;
    durationDays: number;
  };
  sponsored: {
    regular: number;
    discounted: number;
  };
  launch: {
    discountPercent: number;
    enabled: boolean;
    endDate: string;
  };
}

export function getPartnerPricing(): PartnerPricing {
  // Get pricing config from static defaults
  const config = PRICING_CONFIG_DEFAULTS;

  return {
    jobs: {
      regular: config['pricing.jobs.regular'],
      discounted: config['pricing.jobs.discounted'],
      durationDays: config['pricing.jobs.duration_days'],
    },
    sponsored: {
      regular: config['pricing.sponsored.regular'],
      discounted: config['pricing.sponsored.discounted'],
    },
    launch: {
      discountPercent: config['pricing.launch_discount_percent'],
      enabled: config['pricing.launch_discount_enabled'],
      endDate: config['pricing.launch_discount_end_date'],
    },
  };
}
