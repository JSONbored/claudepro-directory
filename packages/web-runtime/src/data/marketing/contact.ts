
import { logger } from '../../logger.ts';
import { SOCIAL_LINKS, SOCIAL_LINK_KEYS, type SocialLinkKey } from '../../config/social-links.ts';

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
  const link = SOCIAL_LINKS[key];
  if (typeof link === 'string' && link.length > 0) {
    return link;
  }

  logger.warn('marketing.contact.missing_social_link', { key });
  return SOCIAL_LINK_FALLBACKS[key];
}

const SOCIAL_LINK_SNAPSHOT: SocialLinkSnapshot = SOCIAL_LINK_KEYS.reduce<SocialLinkSnapshot>(
  (acc, key) => {
    acc[key] = resolveSocialLink(key);
    return acc;
  },
  {} as SocialLinkSnapshot
);

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
  email: string;
  discord: string;
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
  partnerEmail: string;
  hiEmail: string;
  supportEmail: string;
  securityEmail: string;
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
  subject: string;
  href: string;
}

export type PartnerCtas = Record<PartnerCtaKey, PartnerCtaLink>;

export function getPartnerCtas(
  recipient: keyof PartnerContactChannels = 'partnerEmail'
): PartnerCtas {
  const contacts = getPartnerContactChannels();
  const email = contacts[recipient];

  return Object.entries(PARTNER_CTA_SUBJECTS).reduce<PartnerCtas>((acc, [key, subject]) => {
    acc[key as PartnerCtaKey] = {
      subject,
      href: `mailto:${email}?subject=${encodeURIComponent(subject)}`,
    };
    return acc;
  }, {} as PartnerCtas);
}
