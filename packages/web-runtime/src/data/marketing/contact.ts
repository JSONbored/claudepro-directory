import { SOCIAL_LINK_KEYS, type SocialLinkKey } from '../../config/social-links.ts';
import { logger } from '../../logger.ts';
import { getSocialLink } from '../config/constants.ts';

type SocialLinkSnapshot = Record<SocialLinkKey, string>;

const SOCIAL_LINK_FALLBACKS: SocialLinkSnapshot = {
  authorProfile: 'https://github.com/JSONbored',
  discord: '#',
  email: 'contact@claudepro.directory',
  github: 'https://github.com/JSONbored/claudepro-directory',
  hiEmail: 'hi@claudepro.directory',
  partnerEmail: 'partner@claudepro.directory',
  securityEmail: 'security@claudepro.directory',
  supportEmail: 'support@claudepro.directory',
  twitter: '#',
};

function resolveSocialLink(key: SocialLinkKey): string {
  const link = getSocialLink(key);
  if (typeof link === 'string' && link.length > 0) {
    return link;
  }

  logger.warn(
    { key, module: 'data/marketing/contact', operation: 'resolveSocialLink' },
    'marketing.contact.missing_social_link'
  );
  return SOCIAL_LINK_FALLBACKS[key];
}

const SOCIAL_LINK_SNAPSHOT: SocialLinkSnapshot = {} as SocialLinkSnapshot;
for (const key of SOCIAL_LINK_KEYS) {
  SOCIAL_LINK_SNAPSHOT[key] = resolveSocialLink(key);
}

export function getSocialLinks(): SocialLinkSnapshot {
  return { ...SOCIAL_LINK_SNAPSHOT };
}

export const NEWSLETTER_CTA_CONFIG = {
  buttonText: 'Subscribe',
  ctaText: 'Subscribe',
  description: 'Weekly roundup of the best Claude agents, tools, and guides.',
  footerText: 'No spam. Unsubscribe anytime.',
  headline: 'Get the latest Claude resources',
  title: 'Get the latest Claude resources',
} as const;

export interface ContactChannels {
  discord: string;
  email: string;
  github: string;
  twitter: string;
}

export function getContactChannels(): ContactChannels {
  const links = getSocialLinks();
  return {
    discord: links.discord,
    email: links.email,
    github: links.github,
    twitter: links.twitter,
  };
}

export interface PartnerContactChannels {
  hiEmail: string;
  partnerEmail: string;
  securityEmail: string;
  supportEmail: string;
}

export function getPartnerContactChannels(): PartnerContactChannels {
  const links = getSocialLinks();
  return {
    hiEmail: links.hiEmail,
    partnerEmail: links.partnerEmail,
    securityEmail: links.securityEmail,
    supportEmail: links.supportEmail,
  };
}

const PARTNER_CTA_SUBJECTS = {
  jobListing: 'Job Listing - Get Started',
  partnershipInquiry: 'Partnership Inquiry',
  sponsoredListing: 'Sponsored Listing - Get Started',
} as const;

export type PartnerCtaKey = keyof typeof PARTNER_CTA_SUBJECTS;

export interface PartnerCtaLink {
  href: string;
  subject: string;
}

export type PartnerCtas = Record<PartnerCtaKey, PartnerCtaLink>;

export function getPartnerCtas(
  recipient: keyof PartnerContactChannels = 'partnerEmail'
): PartnerCtas {
  const contacts = getPartnerContactChannels();
  const email = contacts[recipient];

  const result: PartnerCtas = {} as PartnerCtas;
  for (const [key, subject] of Object.entries(PARTNER_CTA_SUBJECTS)) {
    result[key as PartnerCtaKey] = {
      href: `mailto:${email}?subject=${encodeURIComponent(subject)}`,
      subject,
    };
  }
  return result;
}
