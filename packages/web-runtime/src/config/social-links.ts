import { z } from 'zod';
import { GENERATED_CONFIG } from './generated-config.ts';

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

// Fallback for build time if generation hasn't run or failed silently
const FALLBACK_SOCIAL_LINKS = {
  github: 'https://github.com/JSONbored/claudepro-directory',
  authorProfile: 'https://github.com/JSONbored',
  discord: 'https://discord.gg/Ax3Py4YDrq',
  twitter: 'https://x.com/JSONbored',
  email: 'contact@claudepro.directory',
  hiEmail: 'hi@claudepro.directory',
  partnerEmail: 'partner@claudepro.directory',
  supportEmail: 'support@claudepro.directory',
  securityEmail: 'security@claudepro.directory',
};

export const SOCIAL_LINKS = socialLinksSchema.parse(
  GENERATED_CONFIG.social_links || FALLBACK_SOCIAL_LINKS
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
