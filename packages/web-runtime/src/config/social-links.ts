import { z } from 'zod';

import { GENERATED_CONFIG } from './app-config.ts';

const socialLinksSchema = z.object({
  github: z.string().url(),
  authorProfile: z.string().url(),
  discord: z.string().url().optional(),
  twitter: z.string().url().optional(),
  email: z.string().email(),
  hiEmail: z.string().email(),
  partnerEmail: z.string().email(),
  supportEmail: z.string().email(),
  securityEmail: z.string().email(),
});

// Parse and validate social links from generated config
// GENERATED_CONFIG.social_links is always defined in app-config.ts
export const SOCIAL_LINKS = socialLinksSchema.parse(
  GENERATED_CONFIG.social_links
);

export const SOCIAL_LINK_KEYS = [
  'github',
  'authorProfile',
  'discord',
  'twitter',
  'email',
  'hiEmail',
  'partnerEmail',
  'supportEmail',
  'securityEmail',
] as const;

export type SocialLinkKey = (typeof SOCIAL_LINK_KEYS)[number];
