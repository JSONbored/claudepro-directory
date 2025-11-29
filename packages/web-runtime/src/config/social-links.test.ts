import { describe, expect, it } from 'vitest';
import { SOCIAL_LINKS } from './social-links.ts';

describe('SOCIAL_LINKS', () => {
  it('should have all required social link properties', () => {
    expect(SOCIAL_LINKS.github).toBeDefined();
    expect(SOCIAL_LINKS.twitter).toBeDefined();
    expect(SOCIAL_LINKS.discord).toBeDefined();
    expect(SOCIAL_LINKS.email).toBeDefined();
    expect(SOCIAL_LINKS.hiEmail).toBeDefined();
    expect(SOCIAL_LINKS.supportEmail).toBeDefined();
    expect(SOCIAL_LINKS.securityEmail).toBeDefined();
    expect(SOCIAL_LINKS.partnerEmail).toBeDefined();
    expect(SOCIAL_LINKS.authorProfile).toBeDefined();
  });

  it('should have valid GitHub URL', () => {
    expect(SOCIAL_LINKS.github).toMatch(/^https:\/\/github\.com\//);
  });

  it('should have valid Twitter/X URL', () => {
    expect(SOCIAL_LINKS.twitter).toMatch(/^https:\/\/(twitter\.com|x\.com)\//);
  });

  it('should have valid Discord invite URL', () => {
    expect(SOCIAL_LINKS.discord).toMatch(/^https:\/\/discord\.gg\//);
  });

  it('should have valid email addresses', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(SOCIAL_LINKS.email).toMatch(emailRegex);
    expect(SOCIAL_LINKS.hiEmail).toMatch(emailRegex);
    expect(SOCIAL_LINKS.supportEmail).toMatch(emailRegex);
    expect(SOCIAL_LINKS.securityEmail).toMatch(emailRegex);
    expect(SOCIAL_LINKS.partnerEmail).toMatch(emailRegex);
  });

  it('should have claudepro.directory domain for emails', () => {
    expect(SOCIAL_LINKS.email).toContain('@claudepro.directory');
    expect(SOCIAL_LINKS.hiEmail).toContain('@claudepro.directory');
    expect(SOCIAL_LINKS.supportEmail).toContain('@claudepro.directory');
    expect(SOCIAL_LINKS.securityEmail).toContain('@claudepro.directory');
    expect(SOCIAL_LINKS.partnerEmail).toContain('@claudepro.directory');
  });

  it('should have valid author profile URL', () => {
    expect(SOCIAL_LINKS.authorProfile).toMatch(/^https:\/\//);
  });

  it('should have no trailing slashes in URLs', () => {
    const urlFields = ['github', 'twitter', 'discord', 'authorProfile'];
    
    for (const field of urlFields) {
      const value = SOCIAL_LINKS[field as keyof typeof SOCIAL_LINKS];
      if (typeof value === 'string' && value.startsWith('http')) {
        expect(value).not.toMatch(/\/$/);
      }
    }
  });

  it('should have consistent email format', () => {
    const emails = [
      SOCIAL_LINKS.email,
      SOCIAL_LINKS.hiEmail,
      SOCIAL_LINKS.supportEmail,
      SOCIAL_LINKS.securityEmail,
      SOCIAL_LINKS.partnerEmail,
    ];

    for (const email of emails) {
      expect(email).toMatch(/^[a-z]+@claudepro\.directory$/);
    }
  });
});