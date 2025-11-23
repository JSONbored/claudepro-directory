'use server';

import { getPricingConfig } from '../actions/feature-flags.ts';

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
  const result = await getPricingConfig({});
  if (!result?.data) {
    throw new Error('Failed to load pricing config');
  }
  const config = result.data;

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
