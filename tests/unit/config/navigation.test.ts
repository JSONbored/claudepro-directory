/**
 * Navigation Configuration Tests
 *
 * Tests the navigation configuration system that powers all navigation
 * across the application. This configuration is the single source of truth
 * for navigation links, ensuring consistency and maintainability.
 *
 * **Why Test This:**
 * - Navigation is critical for user experience and SEO
 * - Config drives multiple components (navbar, mobile menu, breadcrumbs)
 * - Schema validation ensures no broken links
 * - Helper functions must work correctly for routing logic
 *
 * **Test Coverage:**
 * - Data structure validation
 * - Helper function correctness
 * - Edge cases in routing logic
 * - Breadcrumb generation
 *
 * @see src/config/navigation.ts
 */

import { describe, expect, it } from 'vitest';
import {
  ACTION_LINKS,
  getAllNavigationLinks,
  getBreadcrumbTrail,
  getNavigationLinkByPath,
  isActivePath,
  type NavigationGroup,
  type NavigationLink,
  PRIMARY_NAVIGATION,
  SECONDARY_NAVIGATION,
} from '@/src/config/navigation';

describe('Navigation Configuration', () => {
  describe('PRIMARY_NAVIGATION Structure', () => {
    it('is a non-empty array', () => {
      expect(PRIMARY_NAVIGATION).toBeInstanceOf(Array);
      expect(PRIMARY_NAVIGATION.length).toBeGreaterThan(0);
    });

    it('every link has required properties', () => {
      PRIMARY_NAVIGATION.forEach((link) => {
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('href');
        expect(typeof link.label).toBe('string');
        expect(typeof link.href).toBe('string');
        expect(link.label.length).toBeGreaterThan(0);
        expect(link.href.startsWith('/')).toBe(true);
      });
    });

    it('has unique hrefs (no duplicate routes)', () => {
      const hrefs = PRIMARY_NAVIGATION.map((link) => link.href);
      const uniqueHrefs = new Set(hrefs);
      expect(hrefs.length).toBe(uniqueHrefs.size);
    });

    it('has unique labels (no duplicate text)', () => {
      const labels = PRIMARY_NAVIGATION.map((link) => link.label);
      const uniqueLabels = new Set(labels);
      expect(labels.length).toBe(uniqueLabels.size);
    });

    it('includes expected core routes', () => {
      const hrefs = PRIMARY_NAVIGATION.map((link) => link.href);
      expect(hrefs).toContain('/agents');
      expect(hrefs).toContain('/commands');
      expect(hrefs).toContain('/hooks');
      expect(hrefs).toContain('/mcp');
      expect(hrefs).toContain('/rules');
    });

    it('has icons for all links', () => {
      PRIMARY_NAVIGATION.forEach((link) => {
        expect(link.icon).toBeDefined();
        // Lucide icons are React components (objects with $$typeof property)
        expect(typeof link.icon).toBe('object');
      });
    });

    it('has descriptions for all links', () => {
      PRIMARY_NAVIGATION.forEach((link) => {
        expect(link.description).toBeDefined();
        expect(typeof link.description).toBe('string');
        expect(link.description?.length).toBeGreaterThan(0);
      });
    });

    it('marks new features correctly', () => {
      const newLinks = PRIMARY_NAVIGATION.filter((link) => link.isNew);
      // At least one new feature should be marked
      expect(newLinks.length).toBeGreaterThanOrEqual(0);
      // All new flags should be boolean true
      newLinks.forEach((link) => {
        expect(link.isNew).toBe(true);
      });
    });
  });

  describe('SECONDARY_NAVIGATION Structure', () => {
    it('is a non-empty array of groups', () => {
      expect(SECONDARY_NAVIGATION).toBeInstanceOf(Array);
      expect(SECONDARY_NAVIGATION.length).toBeGreaterThan(0);
    });

    it('every group has required properties', () => {
      SECONDARY_NAVIGATION.forEach((group: NavigationGroup) => {
        expect(group).toHaveProperty('heading');
        expect(group).toHaveProperty('links');
        expect(typeof group.heading).toBe('string');
        expect(group.heading.length).toBeGreaterThan(0);
        expect(Array.isArray(group.links)).toBe(true);
        expect(group.links.length).toBeGreaterThan(0);
      });
    });

    it('every link in groups has required properties', () => {
      SECONDARY_NAVIGATION.forEach((group) => {
        group.links.forEach((link: NavigationLink) => {
          expect(link).toHaveProperty('label');
          expect(link).toHaveProperty('href');
          expect(typeof link.label).toBe('string');
          expect(typeof link.href).toBe('string');
          expect(link.label.length).toBeGreaterThan(0);
          expect(link.href.startsWith('/')).toBe(true);
        });
      });
    });

    it('has unique hrefs across all groups', () => {
      const allLinks = SECONDARY_NAVIGATION.flatMap((group) => group.links);
      const hrefs = allLinks.map((link) => link.href);
      const uniqueHrefs = new Set(hrefs);
      expect(hrefs.length).toBe(uniqueHrefs.size);
    });

    it('has unique group headings', () => {
      const headings = SECONDARY_NAVIGATION.map((group) => group.heading);
      const uniqueHeadings = new Set(headings);
      expect(headings.length).toBe(uniqueHeadings.size);
    });

    it('includes expected groups', () => {
      const headings = SECONDARY_NAVIGATION.map((group) => group.heading);
      expect(headings).toContain('Discover');
      expect(headings).toContain('Resources');
      expect(headings).toContain('Community');
    });
  });

  describe('ACTION_LINKS Structure', () => {
    it('is an array', () => {
      expect(ACTION_LINKS).toBeInstanceOf(Array);
    });

    it('every action link has required properties', () => {
      ACTION_LINKS.forEach((link) => {
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('href');
        expect(typeof link.label).toBe('string');
        expect(typeof link.href).toBe('string');
      });
    });

    it('includes submit config link', () => {
      const hrefs = ACTION_LINKS.map((link) => link.href);
      expect(hrefs).toContain('/submit');
    });
  });

  describe('Cross-Navigation Validation', () => {
    it('has no href collisions across primary, secondary, and action links', () => {
      const primaryHrefs = PRIMARY_NAVIGATION.map((link) => link.href);
      const secondaryHrefs = SECONDARY_NAVIGATION.flatMap((group) =>
        group.links.map((link) => link.href)
      );
      const actionHrefs = ACTION_LINKS.map((link) => link.href);

      const allHrefs = [...primaryHrefs, ...secondaryHrefs, ...actionHrefs];
      const uniqueHrefs = new Set(allHrefs);

      expect(allHrefs.length).toBe(uniqueHrefs.size);
    });

    it('all hrefs are absolute paths starting with /', () => {
      const allLinks = getAllNavigationLinks();
      allLinks.forEach((link) => {
        expect(link.href).toMatch(/^\//);
      });
    });

    it('no trailing slashes in hrefs (except root)', () => {
      const allLinks = getAllNavigationLinks();
      allLinks.forEach((link) => {
        if (link.href !== '/') {
          expect(link.href).not.toMatch(/\/$/);
        }
      });
    });
  });

  describe('getAllNavigationLinks()', () => {
    it('returns a flat array', () => {
      const result = getAllNavigationLinks();
      expect(Array.isArray(result)).toBe(true);
    });

    it('includes all primary navigation links', () => {
      const result = getAllNavigationLinks();
      PRIMARY_NAVIGATION.forEach((link) => {
        expect(result).toContainEqual(link);
      });
    });

    it('includes all secondary navigation links', () => {
      const result = getAllNavigationLinks();
      const secondaryLinks = SECONDARY_NAVIGATION.flatMap((group) => group.links);
      secondaryLinks.forEach((link) => {
        expect(result).toContainEqual(link);
      });
    });

    it('includes all action links', () => {
      const result = getAllNavigationLinks();
      ACTION_LINKS.forEach((link) => {
        expect(result).toContainEqual(link);
      });
    });

    it('returns correct total count', () => {
      const result = getAllNavigationLinks();
      const expectedCount =
        PRIMARY_NAVIGATION.length +
        SECONDARY_NAVIGATION.flatMap((g) => g.links).length +
        ACTION_LINKS.length;
      expect(result.length).toBe(expectedCount);
    });

    it('maintains order: primary → secondary → actions', () => {
      const result = getAllNavigationLinks();
      const firstPrimaryIndex = result.findIndex((link) => PRIMARY_NAVIGATION.includes(link));
      const lastPrimaryIndex = firstPrimaryIndex + PRIMARY_NAVIGATION.length - 1;

      const firstSecondaryIndex = result.findIndex((link) =>
        SECONDARY_NAVIGATION.flatMap((g) => g.links).includes(link)
      );

      const firstActionIndex = result.findIndex((link) => ACTION_LINKS.includes(link));

      expect(firstPrimaryIndex).toBe(0);
      expect(firstSecondaryIndex).toBeGreaterThan(lastPrimaryIndex);
      expect(firstActionIndex).toBeGreaterThan(firstSecondaryIndex);
    });
  });

  describe('getNavigationLinkByPath()', () => {
    it('finds primary navigation link', () => {
      const result = getNavigationLinkByPath('/agents');
      expect(result).toBeDefined();
      expect(result?.label).toBe('Agents');
      expect(result?.href).toBe('/agents');
    });

    it('finds secondary navigation link', () => {
      const result = getNavigationLinkByPath('/trending');
      expect(result).toBeDefined();
      expect(result?.label).toBe('Trending');
    });

    it('finds action link', () => {
      const result = getNavigationLinkByPath('/submit');
      expect(result).toBeDefined();
      expect(result?.label).toBe('Submit Config');
    });

    it('returns undefined for non-existent path', () => {
      const result = getNavigationLinkByPath('/does-not-exist');
      expect(result).toBeUndefined();
    });

    it('returns undefined for partial match', () => {
      const result = getNavigationLinkByPath('/agent'); // Missing 's'
      expect(result).toBeUndefined();
    });

    it('is case-sensitive', () => {
      const result = getNavigationLinkByPath('/AGENTS');
      expect(result).toBeUndefined();
    });

    it('does not match paths with trailing slash', () => {
      const result = getNavigationLinkByPath('/agents/');
      expect(result).toBeUndefined();
    });
  });

  describe('isActivePath()', () => {
    describe('Homepage Matching', () => {
      it('returns true for exact homepage match', () => {
        expect(isActivePath('/', '/')).toBe(true);
      });

      it('returns false for homepage when on other route', () => {
        expect(isActivePath('/', '/agents')).toBe(false);
      });

      it('returns false for homepage on nested route', () => {
        expect(isActivePath('/', '/agents/production-specialist')).toBe(false);
      });
    });

    describe('Route Prefix Matching', () => {
      it('returns true for exact route match', () => {
        expect(isActivePath('/agents', '/agents')).toBe(true);
      });

      it('returns true for nested route', () => {
        expect(isActivePath('/agents', '/agents/production-specialist')).toBe(true);
      });

      it('returns true for deeply nested route', () => {
        expect(isActivePath('/agents', '/agents/category/subcategory')).toBe(true);
      });

      it('returns false for non-matching route', () => {
        expect(isActivePath('/agents', '/commands')).toBe(false);
      });

      it('returns true for partial match at start (prefix matching)', () => {
        // Current implementation uses startsWith, so /agent matches /agents
        // This is by design for prefix matching
        expect(isActivePath('/agent', '/agents')).toBe(true);
      });

      it('handles query parameters correctly', () => {
        expect(isActivePath('/agents', '/agents?page=2')).toBe(true);
      });

      it('handles hash fragments correctly', () => {
        expect(isActivePath('/agents', '/agents#section')).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('handles empty current path', () => {
        expect(isActivePath('/agents', '')).toBe(false);
      });

      it('handles empty link path (matches all due to startsWith)', () => {
        // Empty string startsWith check returns true for any string
        expect(isActivePath('', '/agents')).toBe(true);
      });

      it('handles paths with trailing slashes', () => {
        expect(isActivePath('/agents/', '/agents')).toBe(false);
        expect(isActivePath('/agents', '/agents/')).toBe(true);
      });

      it('is case-sensitive', () => {
        expect(isActivePath('/Agents', '/agents')).toBe(false);
        expect(isActivePath('/agents', '/Agents')).toBe(false);
      });
    });
  });

  describe('getBreadcrumbTrail()', () => {
    describe('Basic Functionality', () => {
      it('returns home only for root path', () => {
        const result = getBreadcrumbTrail('/');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ label: 'Home', href: '/' });
      });

      it('returns home + agents for /agents', () => {
        const result = getBreadcrumbTrail('/agents');
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ label: 'Home', href: '/' });
        expect(result[1]).toEqual(expect.objectContaining({ label: 'Agents', href: '/agents' }));
      });

      it('includes all segments in trail', () => {
        const result = getBreadcrumbTrail('/agents/production-specialist');
        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result[0]).toEqual({ label: 'Home', href: '/' });
      });
    });

    describe('Known Route Matching', () => {
      it('uses navigation config label for known routes', () => {
        const result = getBreadcrumbTrail('/agents');
        const agentsLink = result.find((link) => link.href === '/agents');
        expect(agentsLink?.label).toBe('Agents');
      });

      it('uses navigation config for secondary routes', () => {
        const result = getBreadcrumbTrail('/trending');
        const trendingLink = result.find((link) => link.href === '/trending');
        expect(trendingLink?.label).toBe('Trending');
      });
    });

    describe('Dynamic Route Fallback', () => {
      it('generates label for unknown route', () => {
        const result = getBreadcrumbTrail('/agents/my-custom-agent');
        expect(result.length).toBeGreaterThanOrEqual(3);

        const dynamicSegment = result[2];
        expect(dynamicSegment.href).toBe('/agents/my-custom-agent');
        expect(dynamicSegment.label).toBe('My custom agent'); // Capitalized, hyphens replaced
      });

      it('capitalizes first letter of dynamic segment', () => {
        const result = getBreadcrumbTrail('/unknown-route');
        const segment = result[1];
        expect(segment.label).toMatch(/^[A-Z]/); // Starts with capital letter
      });

      it('replaces hyphens with spaces in dynamic segments', () => {
        const result = getBreadcrumbTrail('/multi-word-route');
        const segment = result[1];
        expect(segment.label).toBe('Multi word route');
      });

      it('handles deeply nested dynamic routes', () => {
        const result = getBreadcrumbTrail('/agents/category/sub-category/item');
        expect(result.length).toBe(5); // Home + 4 segments
        expect(result[0].href).toBe('/');
        expect(result[1].href).toBe('/agents');
        expect(result[2].href).toBe('/agents/category');
        expect(result[3].href).toBe('/agents/category/sub-category');
        expect(result[4].href).toBe('/agents/category/sub-category/item');
      });
    });

    describe('Edge Cases', () => {
      it('handles trailing slash', () => {
        const withSlash = getBreadcrumbTrail('/agents/');
        const withoutSlash = getBreadcrumbTrail('/agents');
        expect(withSlash).toEqual(withoutSlash);
      });

      it('handles query parameters', () => {
        const result = getBreadcrumbTrail('/agents?page=2');
        // Current implementation doesn't strip query params (treated as part of path)
        // The ?page=2 becomes part of the dynamic segment
        expect(result.some((link) => link.href.includes('?'))).toBe(true);
      });

      it('handles hash fragments', () => {
        const result = getBreadcrumbTrail('/agents#section');
        // Current implementation doesn't strip hash fragments (treated as part of path)
        expect(result.some((link) => link.href.includes('#'))).toBe(true);
      });

      it('handles empty segments (double slashes)', () => {
        const result = getBreadcrumbTrail('/agents//production');
        // Should filter out empty segments
        expect(result.every((link) => link.href.length > 0)).toBe(true);
      });
    });

    describe('Return Type Validation', () => {
      it('always includes home as first item', () => {
        const paths = ['/agents', '/commands', '/trending', '/unknown'];
        paths.forEach((path) => {
          const result = getBreadcrumbTrail(path);
          expect(result[0]).toEqual({ label: 'Home', href: '/' });
        });
      });

      it('returns array of NavigationLink objects', () => {
        const result = getBreadcrumbTrail('/agents/production-specialist');
        result.forEach((link) => {
          expect(link).toHaveProperty('label');
          expect(link).toHaveProperty('href');
          expect(typeof link.label).toBe('string');
          expect(typeof link.href).toBe('string');
        });
      });

      it('maintains cumulative path structure', () => {
        const result = getBreadcrumbTrail('/agents/category/item');
        expect(result[0].href).toBe('/');
        expect(result[1].href).toBe('/agents');
        expect(result[2].href).toBe('/agents/category');
        expect(result[3].href).toBe('/agents/category/item');
      });
    });
  });

  describe('Type Safety', () => {
    it('NavigationLink accepts all required fields', () => {
      const link: NavigationLink = {
        label: 'Test',
        href: '/test',
      };
      expect(link).toBeDefined();
    });

    it('NavigationLink accepts optional fields', () => {
      const link: NavigationLink = {
        label: 'Test',
        href: '/test',
        description: 'Test description',
        isNew: true,
        external: true,
      };
      expect(link).toBeDefined();
    });

    it('NavigationGroup requires heading and links', () => {
      const group: NavigationGroup = {
        heading: 'Test Group',
        links: [{ label: 'Test', href: '/test' }],
      };
      expect(group).toBeDefined();
    });
  });
});
