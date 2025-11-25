import 'server-only';

// Lazy import feature flags to avoid module-level server-only code execution
import { getPricingConfig } from '../feature-flags/access.ts';

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

export async function getPartnerPricing(): Promise<PartnerPricing> {
  const result = await getPricingConfig();
  const config = result;

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
