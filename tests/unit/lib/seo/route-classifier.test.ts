/**
 * Route Classifier Unit Tests
 *
 * Tests the pattern-based route classification system that powers metadata generation.
 * Validates all 8 route patterns, confidence scoring, and edge case handling.
 *
 * Coverage goals:
 * - All 8 route patterns (HOMEPAGE → AUTH)
 * - Confidence scoring accuracy
 * - Dynamic segment detection
 * - Category validation integration
 * - Edge cases (malformed routes, unknown patterns)
 */

import { describe, expect, it } from 'vitest';
import {
  classifyRoute,
  getPatternDescription,
  isConfidentClassification,
  type RouteClassification,
  type RoutePattern,
} from '@/src/lib/seo/route-classifier';

describe('classifyRoute', () => {
  describe('HOMEPAGE pattern', () => {
    it('classifies root route as HOMEPAGE', () => {
      const result = classifyRoute('/');

      expect(result.pattern).toBe('HOMEPAGE');
      expect(result.confidence).toBe(1.0);
      expect(result.segments).toEqual([]);
      expect(result.isDynamic).toBe(false);
      expect(result.route).toBe('/');
    });

    it('normalizes trailing slashes', () => {
      const result = classifyRoute('//');

      expect(result.pattern).toBe('HOMEPAGE');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('CATEGORY pattern', () => {
    it('classifies valid category routes', () => {
      const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'jobs', 'guides'];

      categories.forEach((category) => {
        const result = classifyRoute(`/${category}`);

        expect(result.pattern).toBe('CATEGORY');
        expect(result.confidence).toBe(1.0);
        expect(result.segments).toEqual([category]);
        expect(result.isDynamic).toBe(false);
        expect(result.route).toBe(`/${category}`);
      });
    });

    it('classifies dynamic [category] route', () => {
      const result = classifyRoute('/[category]');

      expect(result.pattern).toBe('CATEGORY');
      expect(result.confidence).toBe(1.0);
      expect(result.segments).toEqual(['[category]']);
      expect(result.isDynamic).toBe(true);
    });

    it('classifies :category dynamic route', () => {
      const result = classifyRoute('/:category');

      // Should be STATIC (fallback) since :category is not a valid literal category
      // But after stripping :, it validates against category registry
      const validCategories = ['agents', 'mcp', 'rules', 'commands'];
      const testCategory = validCategories[0];

      const dynamicResult = classifyRoute(`/:${testCategory}`);
      expect(dynamicResult.pattern).toBe('CATEGORY');
      expect(dynamicResult.isDynamic).toBe(true);
    });

    it('rejects invalid category names', () => {
      const result = classifyRoute('/invalid-category-xyz');

      expect(result.pattern).toBe('STATIC');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('CONTENT_DETAIL pattern', () => {
    it('classifies valid category detail routes', () => {
      const testCases = [
        { route: '/agents/code-reviewer', category: 'agents' },
        { route: '/mcp/filesystem', category: 'mcp' },
        { route: '/rules/security-first', category: 'rules' },
        { route: '/jobs/senior-engineer', category: 'jobs' },
      ];

      testCases.forEach(({ route, category }) => {
        const result = classifyRoute(route);

        expect(result.pattern).toBe('CONTENT_DETAIL');
        expect(result.confidence).toBe(1.0);
        expect(result.segments).toHaveLength(2);
        expect(result.segments[0]).toBe(category);
        expect(result.isDynamic).toBe(true);
      });
    });

    it('classifies dynamic [category]/[slug] route', () => {
      const result = classifyRoute('/[category]/[slug]');

      expect(result.pattern).toBe('CONTENT_DETAIL');
      expect(result.confidence).toBe(1.0);
      expect(result.segments).toEqual(['[category]', '[slug]']);
      expect(result.isDynamic).toBe(true);
    });

    it('classifies guide subcategory routes', () => {
      const result = classifyRoute('/guides/tutorials/build-mcp-server');

      expect(result.pattern).toBe('CONTENT_DETAIL');
      expect(result.confidence).toBe(1.0);
      expect(result.segments).toEqual(['guides', 'tutorials', 'build-mcp-server']);
      expect(result.isDynamic).toBe(true);
    });

    it('classifies changelog detail routes', () => {
      const result = classifyRoute('/changelog/2025-10-pattern-migration');

      expect(result.pattern).toBe('CONTENT_DETAIL');
      expect(result.confidence).toBe(1.0);
      expect(result.segments).toEqual(['changelog', '2025-10-pattern-migration']);
      expect(result.isDynamic).toBe(true);
    });

    it('classifies compare routes with lower confidence', () => {
      const result = classifyRoute('/compare/mcp-vs-api');

      expect(result.pattern).toBe('CONTENT_DETAIL');
      expect(result.confidence).toBe(0.9);
      expect(result.isDynamic).toBe(true);
    });

    it('classifies SEO grouped compare routes', () => {
      const result = classifyRoute('/(seo)/compare/framework-comparison');

      expect(result.pattern).toBe('CONTENT_DETAIL');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('USER_PROFILE pattern', () => {
    it('classifies user profile routes', () => {
      const result = classifyRoute('/u/john-doe');

      expect(result.pattern).toBe('USER_PROFILE');
      expect(result.confidence).toBe(1.0);
      expect(result.segments).toEqual(['u', 'john-doe']);
      expect(result.isDynamic).toBe(true);
    });

    it('classifies dynamic user profile routes', () => {
      const result = classifyRoute('/u/:slug');

      expect(result.pattern).toBe('USER_PROFILE');
      expect(result.confidence).toBe(1.0);
      expect(result.isDynamic).toBe(true);
    });

    it('does not classify /u without slug', () => {
      const result = classifyRoute('/u');

      expect(result.pattern).not.toBe('USER_PROFILE');
      expect(result.pattern).toBe('STATIC');
    });
  });

  describe('ACCOUNT pattern', () => {
    it('classifies account management routes', () => {
      const accountRoutes = [
        '/account',
        '/account/settings',
        '/account/activity',
        '/account/library',
        '/account/bookmarks',
        '/account/submissions',
      ];

      accountRoutes.forEach((route) => {
        const result = classifyRoute(route);

        expect(result.pattern).toBe('ACCOUNT');
        expect(result.confidence).toBe(1.0);
        expect(result.segments[0]).toBe('account');
      });
    });

    it('classifies nested account routes', () => {
      const result = classifyRoute('/account/library/new');

      expect(result.pattern).toBe('ACCOUNT');
      expect(result.confidence).toBe(1.0);
      expect(result.segments).toEqual(['account', 'library', 'new']);
    });

    it('classifies dynamic account routes', () => {
      const result = classifyRoute('/account/jobs/[id]/edit');

      expect(result.pattern).toBe('ACCOUNT');
      expect(result.confidence).toBe(1.0);
      expect(result.isDynamic).toBe(true);
    });
  });

  describe('TOOL pattern', () => {
    it('classifies tool routes', () => {
      const result = classifyRoute('/tools/config-recommender');

      expect(result.pattern).toBe('TOOL');
      expect(result.confidence).toBe(1.0);
      expect(result.segments).toEqual(['tools', 'config-recommender']);
    });

    it('classifies nested tool routes', () => {
      const result = classifyRoute('/tools/config-recommender/results/[id]');

      expect(result.pattern).toBe('TOOL');
      expect(result.confidence).toBe(1.0);
      expect(result.isDynamic).toBe(true);
    });
  });

  describe('STATIC pattern', () => {
    it('classifies static marketing pages', () => {
      const staticPages = ['/trending', '/search', '/for-you', '/partner', '/community'];

      staticPages.forEach((route) => {
        const result = classifyRoute(route);

        expect(result.pattern).toBe('STATIC');
        expect(result.confidence).toBe(0.5);
        expect(result.segments).toHaveLength(1);
      });
    });

    it('uses STATIC as fallback for unknown routes', () => {
      const result = classifyRoute('/unknown-route-xyz');

      expect(result.pattern).toBe('STATIC');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('AUTH pattern', () => {
    it('classifies authentication routes', () => {
      const authRoutes = ['/auth', '/auth/login', '/auth/register', '/auth/auth-code-error'];

      authRoutes.forEach((route) => {
        const result = classifyRoute(route);

        expect(result.pattern).toBe('AUTH');
        expect(result.confidence).toBe(1.0);
        expect(result.segments[0]).toBe('auth');
      });
    });

    it('classifies dynamic auth routes', () => {
      const result = classifyRoute('/auth/verify/[token]');

      expect(result.pattern).toBe('AUTH');
      expect(result.confidence).toBe(1.0);
      expect(result.isDynamic).toBe(true);
    });
  });

  describe('route normalization', () => {
    it('removes trailing slashes from non-root routes', () => {
      const result = classifyRoute('/agents/');

      expect(result.route).toBe('/agents');
      expect(result.pattern).toBe('CATEGORY');
    });

    it('normalizes multiple leading slashes', () => {
      const result = classifyRoute('//agents/code-reviewer//');

      expect(result.route).toBe('/agents/code-reviewer');
      expect(result.pattern).toBe('CONTENT_DETAIL');
    });

    it('adds leading slash if missing', () => {
      const result = classifyRoute('agents');

      expect(result.route).toBe('/agents');
      expect(result.pattern).toBe('CATEGORY');
    });
  });

  describe('dynamic segment detection', () => {
    it('detects :slug dynamic segments', () => {
      const result = classifyRoute('/agents/:slug');

      expect(result.isDynamic).toBe(true);
    });

    it('detects [slug] bracket dynamic segments', () => {
      const result = classifyRoute('/agents/[slug]');

      expect(result.isDynamic).toBe(true);
    });

    it('detects [id] bracket dynamic segments', () => {
      const result = classifyRoute('/account/jobs/[id]');

      expect(result.isDynamic).toBe(true);
    });

    it('correctly identifies non-dynamic routes', () => {
      const result = classifyRoute('/trending');

      expect(result.isDynamic).toBe(false);
    });
  });
});

describe('getPatternDescription', () => {
  it('returns human-readable pattern descriptions', () => {
    const patterns: RoutePattern[] = [
      'HOMEPAGE',
      'CATEGORY',
      'CONTENT_DETAIL',
      'USER_PROFILE',
      'ACCOUNT',
      'TOOL',
      'STATIC',
      'AUTH',
    ];

    patterns.forEach((pattern) => {
      const description = getPatternDescription(pattern);

      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });

  it('returns correct description for CATEGORY', () => {
    expect(getPatternDescription('CATEGORY')).toBe('Category list page');
  });

  it('returns correct description for CONTENT_DETAIL', () => {
    expect(getPatternDescription('CONTENT_DETAIL')).toBe('Content detail page');
  });
});

describe('isConfidentClassification', () => {
  it('returns true for high confidence classifications', () => {
    const classification: RouteClassification = {
      pattern: 'HOMEPAGE',
      confidence: 1.0,
      segments: [],
      isDynamic: false,
      route: '/',
    };

    expect(isConfidentClassification(classification)).toBe(true);
  });

  it('returns false for low confidence classifications', () => {
    const classification: RouteClassification = {
      pattern: 'STATIC',
      confidence: 0.5,
      segments: ['unknown'],
      isDynamic: false,
      route: '/unknown',
    };

    expect(isConfidentClassification(classification)).toBe(false);
  });

  it('respects custom confidence threshold', () => {
    const classification: RouteClassification = {
      pattern: 'CONTENT_DETAIL',
      confidence: 0.9,
      segments: ['compare', 'test'],
      isDynamic: true,
      route: '/compare/test',
    };

    expect(isConfidentClassification(classification, 0.95)).toBe(false);
    expect(isConfidentClassification(classification, 0.85)).toBe(true);
  });

  it('uses default threshold of 0.8', () => {
    const lowConfidence: RouteClassification = {
      pattern: 'STATIC',
      confidence: 0.7,
      segments: [],
      isDynamic: false,
      route: '/test',
    };

    const highConfidence: RouteClassification = {
      pattern: 'CATEGORY',
      confidence: 1.0,
      segments: ['agents'],
      isDynamic: false,
      route: '/agents',
    };

    expect(isConfidentClassification(lowConfidence)).toBe(false);
    expect(isConfidentClassification(highConfidence)).toBe(true);
  });
});
