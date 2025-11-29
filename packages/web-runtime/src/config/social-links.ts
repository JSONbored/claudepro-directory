/**
 * Social Links Configuration
 *
 * Re-exports social links from unified config with Zod validation.
 *
 * @module web-runtime/config/social-links
 */

import { z } from 'zod';
import { SOCIAL_LINKS as SOCIAL_LINKS_RAW } from './unified-config.ts';

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

/** Validated social links */
export const SOCIAL_LINKS = socialLinksSchema.parse(SOCIAL_LINKS_RAW);

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
