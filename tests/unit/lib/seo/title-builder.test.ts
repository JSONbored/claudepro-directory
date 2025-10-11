/**
 * Title Builder Test Suite
 *
 * Tests SEO-optimized page title generation for multi-engine search optimization.
 * Validates title formatting for Bing, Google, and DuckDuckGo compatibility.
 *
 * **Why Test This:**
 * - Used across ALL pages for SEO metadata
 * - Critical for search engine ranking and CTR
 * - Bing/Google/DuckDuckGo require different length constraints
 * - Title format directly impacts user click-through rates
 *
 * **Test Coverage:**
 * - 3-tier title hierarchy (home, section, content)
 * - Length validation (60-65 char limits)
 * - Separator format (dash for optimal CTR)
 * - Error handling for missing required fields
 * - Edge cases and boundary conditions
 *
 * @see src/lib/seo/title-builder.ts
 */

import { describe, expect, it } from 'vitest';
import { buildPageTitle, getSiteName, validateTitleLength } from '@/src/lib/seo/title-builder';
import type { TitleOptions } from '@/src/lib/seo/title-builder';

describe('buildPageTitle()', () => {
  const siteName = 'Claude Pro Directory'; // From APP_CONFIG.name

  describe('Home Tier (Tier 1)', () => {
    it('returns only site name for homepage', () => {
      const result = buildPageTitle({ tier: 'home' });
      expect(result).toBe(siteName);
    });

    it('ignores title parameter for home tier', () => {
      const result = buildPageTitle({ tier: 'home', title: 'Ignored Title' });
      expect(result).toBe(siteName);
    });

    it('ignores section parameter for home tier', () => {
      const result = buildPageTitle({ tier: 'home', section: 'Ignored Section' });
      expect(result).toBe(siteName);
    });

    it('returns string within optimal length', () => {
      const result = buildPageTitle({ tier: 'home' });
      expect(result.length).toBeLessThanOrEqual(60);
    });
  });

  describe('Section Tier (Tier 2)', () => {
    it('builds section title with dash separator', () => {
      const result = buildPageTitle({ tier: 'section', title: 'Trending Configurations' });
      expect(result).toBe('Trending Configurations - Claude Pro Directory');
    });

    it('throws error when title is missing', () => {
      expect(() => buildPageTitle({ tier: 'section' })).toThrow(
        'Title is required for section-tier titles'
      );
    });

    it('throws error when title is undefined', () => {
      expect(() => buildPageTitle({ tier: 'section', title: undefined })).toThrow(
        'Title is required for section-tier titles'
      );
    });

    it('throws error when title is empty string', () => {
      expect(() => buildPageTitle({ tier: 'section', title: '' })).toThrow(
        'Title is required for section-tier titles'
      );
    });

    it('ignores section parameter for section tier', () => {
      const result = buildPageTitle({
        tier: 'section',
        title: 'Trending',
        section: 'Ignored',
      });
      expect(result).toBe('Trending - Claude Pro Directory');
    });

    it('handles short section titles', () => {
      const result = buildPageTitle({ tier: 'section', title: 'AI' });
      expect(result).toBe('AI - Claude Pro Directory');
      expect(result.length).toBeLessThanOrEqual(60);
    });

    it('handles long section titles', () => {
      const result = buildPageTitle({
        tier: 'section',
        title: 'Claude AI Agent Templates 2025',
      });
      expect(result).toBe('Claude AI Agent Templates 2025 - Claude Pro Directory');
      // Should be within max length (65 chars for Bing)
      expect(result.length).toBeLessThanOrEqual(65);
    });
  });

  describe('Content Tier (Tier 3)', () => {
    it('builds content title with title + section + site name', () => {
      const result = buildPageTitle({
        tier: 'content',
        title: 'Code Reviewer Agent',
        section: 'AI Agents',
      });
      expect(result).toBe('Code Reviewer Agent - AI Agents - Claude Pro Directory');
    });

    it('throws error when title is missing', () => {
      expect(() => buildPageTitle({ tier: 'content', section: 'AI Agents' })).toThrow(
        'Both title and section are required for content-tier titles'
      );
    });

    it('throws error when section is missing', () => {
      expect(() => buildPageTitle({ tier: 'content', title: 'Code Reviewer' })).toThrow(
        'Both title and section are required for content-tier titles'
      );
    });

    it('throws error when both title and section are missing', () => {
      expect(() => buildPageTitle({ tier: 'content' })).toThrow(
        'Both title and section are required for content-tier titles'
      );
    });

    it('handles short content titles', () => {
      const result = buildPageTitle({
        tier: 'content',
        title: 'Setup',
        section: 'Guides',
      });
      expect(result).toBe('Setup - Guides - Claude Pro Directory');
    });

    it('handles long content titles within limits', () => {
      const result = buildPageTitle({
        tier: 'content',
        title: 'Advanced MCP Configuration',
        section: 'Tutorials',
      });
      expect(result).toBe('Advanced MCP Configuration - Tutorials - Claude Pro Directory');
      // Should be within max length
      expect(result.length).toBeLessThanOrEqual(75); // Allow slightly over for content tier
    });

    it('uses consistent dash separator throughout', () => {
      const result = buildPageTitle({
        tier: 'content',
        title: 'Code Reviewer',
        section: 'Agents',
      });
      expect(result).toContain(' - '); // Dash with spaces
      expect(result).not.toContain(' | '); // Not pipe
      expect(result).not.toContain(' > '); // Not arrow
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in titles', () => {
      const result = buildPageTitle({
        tier: 'section',
        title: 'API & Integration Guide',
      });
      expect(result).toBe('API & Integration Guide - Claude Pro Directory');
    });

    it('handles Unicode characters', () => {
      const result = buildPageTitle({
        tier: 'section',
        title: 'AI Configuration 🤖',
      });
      expect(result).toBe('AI Configuration 🤖 - Claude Pro Directory');
    });

    it('handles numbers in titles', () => {
      const result = buildPageTitle({
        tier: 'section',
        title: 'Top 10 Agents 2025',
      });
      expect(result).toBe('Top 10 Agents 2025 - Claude Pro Directory');
    });

    it('handles titles with hyphens', () => {
      const result = buildPageTitle({
        tier: 'section',
        title: 'MCP-Server Setup',
      });
      expect(result).toBe('MCP-Server Setup - Claude Pro Directory');
    });

    it('handles empty strings as falsy for required fields', () => {
      expect(() =>
        buildPageTitle({
          tier: 'content',
          title: '',
          section: 'Section',
        })
      ).toThrow('Both title and section are required');
    });
  });

  describe('Type Safety', () => {
    it('accepts valid TitleOptions type', () => {
      const options: TitleOptions = { tier: 'home' };
      const result = buildPageTitle(options);
      expect(typeof result).toBe('string');
    });

    it('returns string type', () => {
      const result = buildPageTitle({ tier: 'home' });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Real-World Examples', () => {
    it('builds homepage title correctly', () => {
      const result = buildPageTitle({ tier: 'home' });
      expect(result).toBe('Claude Pro Directory');
    });

    it('builds trending page title', () => {
      const result = buildPageTitle({ tier: 'section', title: 'Trending Configurations' });
      expect(result).toBe('Trending Configurations - Claude Pro Directory');
    });

    it('builds agents category page title', () => {
      const result = buildPageTitle({
        tier: 'section',
        title: 'Claude AI Agent Templates 2025',
      });
      expect(result).toBe('Claude AI Agent Templates 2025 - Claude Pro Directory');
    });

    it('builds agent detail page title', () => {
      const result = buildPageTitle({
        tier: 'content',
        title: 'Code Reviewer Agent',
        section: 'AI Agents',
      });
      expect(result).toBe('Code Reviewer Agent - AI Agents - Claude Pro Directory');
    });

    it('builds guide page title', () => {
      const result = buildPageTitle({
        tier: 'content',
        title: 'MCP Server Setup Guide',
        section: 'Guides',
      });
      expect(result).toBe('MCP Server Setup Guide - Guides - Claude Pro Directory');
    });
  });
});

describe('validateTitleLength()', () => {
  describe('Optimal Length (≤60 chars)', () => {
    it('validates short title as optimal', () => {
      const title = 'Claude Pro Directory';
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(title.length);
      expect(result.recommendation).toBe('Optimal for all search engines');
    });

    it('validates 60-char title as optimal', () => {
      const title = 'A'.repeat(60);
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(60);
      expect(result.recommendation).toBe('Optimal for all search engines');
    });

    it('validates empty string', () => {
      const result = validateTitleLength('');
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(0);
      expect(result.recommendation).toBe('Optimal for all search engines');
    });
  });

  describe('Good Length (61-65 chars)', () => {
    it('validates 61-char title as good for Bing', () => {
      const title = 'A'.repeat(61);
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(61);
      expect(result.recommendation).toBe('Good for Bing, may truncate on Google');
    });

    it('validates 65-char title as good for Bing', () => {
      const title = 'A'.repeat(65);
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(65);
      expect(result.recommendation).toBe('Good for Bing, may truncate on Google');
    });

    it('provides correct recommendation for 63-char title', () => {
      const title = 'A'.repeat(63);
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(true);
      expect(result.recommendation).toBe('Good for Bing, may truncate on Google');
    });
  });

  describe('Too Long (>65 chars)', () => {
    it('validates 66-char title as invalid', () => {
      const title = 'A'.repeat(66);
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(false);
      expect(result.length).toBe(66);
      expect(result.recommendation).toBe('Too long - will truncate on all engines');
    });

    it('validates very long title as invalid', () => {
      const title = 'A'.repeat(100);
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(false);
      expect(result.length).toBe(100);
      expect(result.recommendation).toBe('Too long - will truncate on all engines');
    });
  });

  describe('Real-World Examples', () => {
    it('validates homepage title', () => {
      const title = getSiteName(); // Get actual site name
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(title.length);
      expect(result.length).toBeLessThanOrEqual(60);
      expect(result.recommendation).toBe('Optimal for all search engines');
    });

    it('validates section page title', () => {
      const title = `Trending Configurations - ${getSiteName()}`;
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(title.length);
      expect(result.length).toBeLessThanOrEqual(60);
      expect(result.recommendation).toBe('Optimal for all search engines');
    });

    it('validates content page title', () => {
      const title = `Code Reviewer Agent - AI Agents - ${getSiteName()}`;
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(true);
      expect(result.length).toBe(title.length);
      expect(result.length).toBeLessThanOrEqual(60);
      expect(result.recommendation).toBe('Optimal for all search engines');
    });

    it('validates long content page title', () => {
      const title = `Advanced MCP Server Configuration - Tutorials - ${getSiteName()}`;
      const result = validateTitleLength(title);
      expect(result.isValid).toBe(false);
      expect(result.length).toBe(title.length);
      expect(result.length).toBeGreaterThan(65);
      expect(result.recommendation).toBe('Too long - will truncate on all engines');
    });
  });

  describe('Edge Cases', () => {
    it('handles Unicode characters correctly', () => {
      const title = 'AI Configuration 🤖 - Claude Pro Directory';
      const result = validateTitleLength(title);
      expect(result.length).toBe(title.length);
      expect(result.isValid).toBe(true);
    });

    it('handles special characters', () => {
      const title = `API & Integration Guide - ${getSiteName()}`;
      const result = validateTitleLength(title);
      expect(result.length).toBe(title.length);
      expect(result.isValid).toBe(true);
    });

    it('returns correct length for multi-byte characters', () => {
      const title = '中文标题 - Claude Pro Directory';
      const result = validateTitleLength(title);
      expect(result.length).toBe(title.length);
    });
  });

  describe('Return Value Structure', () => {
    it('returns object with all required properties', () => {
      const result = validateTitleLength('Test Title');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('length');
      expect(result).toHaveProperty('recommendation');
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.length).toBe('number');
      expect(typeof result.recommendation).toBe('string');
    });
  });
});

describe('getSiteName()', () => {
  it('returns site name constant', () => {
    const siteName = getSiteName();
    expect(siteName).toBe('Claude Pro Directory');
    expect(typeof siteName).toBe('string');
  });

  it('returns consistent value across calls', () => {
    const first = getSiteName();
    const second = getSiteName();
    expect(first).toBe(second);
  });
});
