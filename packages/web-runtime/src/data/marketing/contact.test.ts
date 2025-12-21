import { describe, expect, it, vi } from 'vitest';
import {
  getSocialLinks,
  getContactChannels,
  getPartnerContactChannels,
  getPartnerCtas,
  NEWSLETTER_CTA_CONFIG,
} from './contact';
import { getSocialLink } from '../config/constants';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock logger
vi.mock('../../logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

// Mock constants
vi.mock('../config/constants', () => ({
  getSocialLink: vi.fn((key: string) => {
    const links: Record<string, string> = {
      discord: 'https://discord.gg/test',
      email: 'contact@test.com',
      github: 'https://github.com/test',
      twitter: 'https://twitter.com/test',
      hiEmail: 'hi@test.com',
      partnerEmail: 'partner@test.com',
      securityEmail: 'security@test.com',
      supportEmail: 'support@test.com',
      authorProfile: 'https://github.com/author',
    };
    return links[key] || '';
  }),
}));

describe('marketing contact data functions', () => {
  describe('getSocialLinks', () => {
    it('should return all social links', () => {
      const links = getSocialLinks();
      
      expect(links).toHaveProperty('discord');
      expect(links).toHaveProperty('email');
      expect(links).toHaveProperty('github');
      expect(links).toHaveProperty('twitter');
      expect(links).toHaveProperty('hiEmail');
      expect(links).toHaveProperty('partnerEmail');
    });
  });

  describe('getContactChannels', () => {
    it('should return contact channels', () => {
      const channels = getContactChannels();
      
      expect(channels).toHaveProperty('discord');
      expect(channels).toHaveProperty('email');
      expect(channels).toHaveProperty('github');
      expect(channels).toHaveProperty('twitter');
    });
  });

  describe('getPartnerContactChannels', () => {
    it('should return partner contact channels', () => {
      const channels = getPartnerContactChannels();
      
      expect(channels).toHaveProperty('hiEmail');
      expect(channels).toHaveProperty('partnerEmail');
      expect(channels).toHaveProperty('securityEmail');
      expect(channels).toHaveProperty('supportEmail');
    });
  });

  describe('getPartnerCtas', () => {
    it('should return partner CTAs with default recipient', () => {
      const ctas = getPartnerCtas();
      
      expect(ctas).toHaveProperty('jobListing');
      expect(ctas).toHaveProperty('partnershipInquiry');
      expect(ctas).toHaveProperty('sponsoredListing');
      
      expect(ctas.jobListing.href).toContain('mailto:');
      expect(ctas.jobListing.subject).toBe('Job Listing - Get Started');
    });

    it('should use specified recipient email', () => {
      const ctas = getPartnerCtas('hiEmail');
      
      expect(ctas.jobListing.href).toContain('hi@test.com');
    });
  });

  describe('NEWSLETTER_CTA_CONFIG', () => {
    it('should have all required properties', () => {
      expect(NEWSLETTER_CTA_CONFIG).toHaveProperty('buttonText');
      expect(NEWSLETTER_CTA_CONFIG).toHaveProperty('ctaText');
      expect(NEWSLETTER_CTA_CONFIG).toHaveProperty('description');
      expect(NEWSLETTER_CTA_CONFIG).toHaveProperty('footerText');
      expect(NEWSLETTER_CTA_CONFIG).toHaveProperty('headline');
      expect(NEWSLETTER_CTA_CONFIG).toHaveProperty('title');
    });
  });
});

