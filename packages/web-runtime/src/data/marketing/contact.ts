import { SOCIAL_LINK_KEYS, type SocialLinkKey } from '../../config/social-links.ts';
import { logger } from '../../logger.ts';
import { getSocialLink } from '../config/constants.ts';

type SocialLinkSnapshot = Record<SocialLinkKey, string>;

const SOCIAL_LINK_FALLBACKS: SocialLinkSnapshot = {
  github: 'https://github.com/JSONbored/claudepro-directory',
  authorProfile: 'https://github.com/JSONbored',
  discord: '#',
  twitter: '#',
  email: 'contact@claudepro.directory',
  hiEmail: 'hi@claudepro.directory',
  partnerEmail: 'partner@claudepro.directory',
  supportEmail: 'support@claudepro.directory',
  securityEmail: 'security@claudepro.directory',
};

function resolveSocialLink(key: SocialLinkKey): string {
  const link = getSocialLink(key);
  if (typeof link === 'string' && link.length > 0) {
    return link;
  }

  logger.warn(
    { operation: 'resolveSocialLink', module: 'data/marketing/contact', key },
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
  title: 'Get the latest Claude resources',
  headline: 'Get the latest Claude resources',
  description: 'Weekly roundup of the best Claude agents, tools, and guides.',
  ctaText: 'Subscribe',
  buttonText: 'Subscribe',
  footerText: 'No spam. Unsubscribe anytime.',
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
    email: links.email,
    discord: links.discord,
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
    partnerEmail: links.partnerEmail,
    hiEmail: links.hiEmail,
    supportEmail: links.supportEmail,
    securityEmail: links.securityEmail,
  };
}

const PARTNER_CTA_SUBJECTS = {
  jobListing: 'Job Listing - Get Started',
  sponsoredListing: 'Sponsored Listing - Get Started',
  partnershipInquiry: 'Partnership Inquiry',
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
      subject,
      href: `mailto:${email}?subject=${encodeURIComponent(subject)}`,
    };
  }
  return result;
}
