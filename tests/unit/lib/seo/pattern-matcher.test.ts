/**
 * Pattern Matcher Unit Tests
 *
 * Tests the context extraction system that provides data to metadata templates.
 * Validates proper context extraction for all 8 route patterns.
 *
 * Coverage goals:
 * - All 8 route patterns (HOMEPAGE → AUTH)
 * - Category config extraction
 * - Param extraction (category, slug)
 * - Item data handling
 * - Edge cases (missing params, invalid categories)
 */

import { describe, expect, it } from 'vitest';
import { extractContext } from '@/src/lib/seo/pattern-matcher';
import { classifyRoute } from '@/src/lib/seo/route-classifier';

describe('extractContext', () => {
  describe('HOMEPAGE pattern', () => {
    it('returns minimal context with route', () => {
      const classification = classifyRoute('/');
      const context = extractContext(classification, {});

      expect(context.route).toBe('/');
      expect(context.params).toEqual({});
      expect(context.categoryConfig).toBeUndefined();
    });
  });

  describe('CATEGORY pattern', () => {
    it('extracts category config from valid category', () => {
      const classification = classifyRoute('/agents');
      const context = extractContext(classification, { category: 'agents' });

      expect(context.route).toBe('/agents');
      expect(context.categoryConfig).toBeDefined();
      expect(context.categoryConfig?.id).toBe('agents');
      expect(context.category).toBe('agents');
    });

    it('extracts category from route when params missing', () => {
      const classification = classifyRoute('/mcp');
      const context = extractContext(classification, {});

      expect(context.categoryConfig).toBeDefined();
      expect(context.categoryConfig?.id).toBe('mcp');
    });

    it('handles invalid category gracefully', () => {
      const classification = classifyRoute('/invalid-category');
      const context = extractContext(classification, { category: 'invalid-category' });

      expect(context.categoryConfig).toBeUndefined();
      expect(context.category).toBeUndefined();
    });

    it('handles array category param', () => {
      const classification = classifyRoute('/rules');
      const context = extractContext(classification, { category: ['rules'] });

      expect(context.categoryConfig).toBeDefined();
      expect(context.categoryConfig?.id).toBe('rules');
    });
  });

  describe('CONTENT_DETAIL pattern', () => {
    it('extracts category config and slug', () => {
      const classification = classifyRoute('/agents/code-reviewer');
      const context = extractContext(classification, {
        category: 'agents',
        slug: 'code-reviewer',
      });

      expect(context.route).toBe('/agents/code-reviewer');
      expect(context.categoryConfig).toBeDefined();
      expect(context.categoryConfig?.id).toBe('agents');
      expect(context.category).toBe('agents');
      expect(context.slug).toBe('code-reviewer');
    });

    it('extracts item data when provided', () => {
      const classification = classifyRoute('/mcp/filesystem');
      const itemData = {
        title: 'FileSystem MCP',
        description: 'File system integration',
      };

      const context = extractContext(
        classification,
        { category: 'mcp', slug: 'filesystem' },
        itemData
      );

      expect(context.item).toEqual(itemData);
      expect(context.categoryConfig?.id).toBe('mcp');
      expect(context.slug).toBe('filesystem');
    });

    it('extracts category and slug from route when params missing', () => {
      const classification = classifyRoute('/jobs/senior-engineer');
      const context = extractContext(classification, {});

      expect(context.categoryConfig).toBeDefined();
      expect(context.categoryConfig?.id).toBe('jobs');
      expect(context.slug).toBe('senior-engineer');
    });

    it('handles array params', () => {
      const classification = classifyRoute('/guides/tutorial-slug');
      const context = extractContext(classification, {
        category: ['guides'],
        slug: ['tutorial-slug'],
      });

      expect(context.categoryConfig?.id).toBe('guides');
      expect(context.slug).toBe('tutorial-slug');
    });
  });

  describe('USER_PROFILE pattern', () => {
    it('extracts user slug from params', () => {
      const classification = classifyRoute('/u/john-doe');
      const context = extractContext(classification, { slug: 'john-doe' });

      expect(context.route).toBe('/u/john-doe');
      expect(context.slug).toBe('john-doe');
    });

    it('extracts user slug from route when params missing', () => {
      const classification = classifyRoute('/u/jane-smith');
      const context = extractContext(classification, {});

      expect(context.slug).toBe('jane-smith');
    });

    it('handles array slug param', () => {
      const classification = classifyRoute('/u/test-user');
      const context = extractContext(classification, { slug: ['test-user'] });

      expect(context.slug).toBe('test-user');
    });
  });

  describe('ACCOUNT pattern', () => {
    it('returns route-only context', () => {
      const classification = classifyRoute('/account/settings');
      const context = extractContext(classification, {});

      expect(context.route).toBe('/account/settings');
      expect(context.categoryConfig).toBeUndefined();
    });

    it('preserves params for dynamic account routes', () => {
      const classification = classifyRoute('/account/jobs/123/edit');
      const context = extractContext(classification, { id: '123' });

      expect(context.params).toEqual({ id: '123' });
    });
  });

  describe('TOOL pattern', () => {
    it('returns route-only context', () => {
      const classification = classifyRoute('/tools/config-recommender');
      const context = extractContext(classification, {});

      expect(context.route).toBe('/tools/config-recommender');
      expect(context.categoryConfig).toBeUndefined();
    });

    it('preserves params for dynamic tool routes', () => {
      const classification = classifyRoute('/tools/config-recommender/results/abc123');
      const context = extractContext(classification, { id: 'abc123' });

      expect(context.params).toEqual({ id: 'abc123' });
    });
  });

  describe('STATIC pattern', () => {
    it('returns route-only context', () => {
      const classification = classifyRoute('/trending');
      const context = extractContext(classification, {});

      expect(context.route).toBe('/trending');
      expect(context.categoryConfig).toBeUndefined();
    });

    it('handles search route', () => {
      const classification = classifyRoute('/search');
      const context = extractContext(classification, {});

      expect(context.route).toBe('/search');
    });

    it('handles community route', () => {
      const classification = classifyRoute('/community');
      const context = extractContext(classification, {});

      expect(context.route).toBe('/community');
    });
  });

  describe('AUTH pattern', () => {
    it('returns route-only context', () => {
      const classification = classifyRoute('/auth/auth-code-error');
      const context = extractContext(classification, {});

      expect(context.route).toBe('/auth/auth-code-error');
      expect(context.categoryConfig).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('handles empty params gracefully', () => {
      const classification = classifyRoute('/agents');
      const context = extractContext(classification);

      expect(context.params).toEqual({});
      expect(context.categoryConfig).toBeDefined();
    });

    it('handles undefined item data', () => {
      const classification = classifyRoute('/agents/test');
      const context = extractContext(classification, { category: 'agents', slug: 'test' });

      expect(context.item).toBeUndefined();
    });

    it('handles non-object item data', () => {
      const classification = classifyRoute('/agents/test');
      const context = extractContext(
        classification,
        { category: 'agents', slug: 'test' },
        'not an object'
      );

      expect(context.item).toBeUndefined();
    });

    it('handles null item data', () => {
      const classification = classifyRoute('/agents/test');
      const context = extractContext(classification, { category: 'agents', slug: 'test' }, null);

      expect(context.item).toBeUndefined();
    });
  });
});
