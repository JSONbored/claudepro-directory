/**
 * Shiki Singleton Tests
 *
 * Tests the shared Shiki highlighter singleton that prevents multiple instance creation.
 *
 * **Why Test This:**
 * - Critical performance optimization (prevents 500MB+ memory waste)
 * - Must ensure singleton pattern works correctly
 * - Validates instance reuse across multiple calls
 * - Ensures proper cleanup/disposal
 *
 * **Test Coverage:**
 * - Singleton instance creation
 * - Instance reuse across multiple calls
 * - Disposal and cleanup
 * - Language and theme loading
 * - Error handling
 *
 * @see src/lib/content/shiki-singleton.ts
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { disposeHighlighter, getSharedHighlighter } from '../shiki-singleton';

describe('Shiki Singleton', () => {
  beforeEach(() => {
    // Clean up before each test
    disposeHighlighter();
  });

  afterEach(() => {
    // Clean up after each test
    disposeHighlighter();
  });

  describe('Singleton Pattern', () => {
    it('creates highlighter instance on first call', async () => {
      const highlighter = await getSharedHighlighter();
      expect(highlighter).toBeDefined();
      expect(highlighter).not.toBeNull();
    });

    it('returns same instance on subsequent calls', async () => {
      const highlighter1 = await getSharedHighlighter();
      const highlighter2 = await getSharedHighlighter();
      const highlighter3 = await getSharedHighlighter();

      // All should be the exact same instance
      expect(highlighter1).toBe(highlighter2);
      expect(highlighter2).toBe(highlighter3);
    });

    it('creates new instance after disposal', async () => {
      const highlighter1 = await getSharedHighlighter();

      disposeHighlighter();

      const highlighter2 = await getSharedHighlighter();

      // Should be different instances
      expect(highlighter1).not.toBe(highlighter2);
    });
  });

  describe('Highlighter Functionality', () => {
    it('has codeToHtml method', async () => {
      const highlighter = await getSharedHighlighter();
      expect(typeof highlighter.codeToHtml).toBe('function');
    });

    it('highlights TypeScript code', async () => {
      const highlighter = await getSharedHighlighter();
      const code = 'const foo: string = "bar";';

      const html = highlighter.codeToHtml(code, {
        lang: 'typescript',
        theme: 'github-dark-dimmed',
      });

      expect(html).toContain('<pre');
      expect(html).toContain('</pre>');
      expect(html).toContain('const');
    });

    it('highlights JavaScript code', async () => {
      const highlighter = await getSharedHighlighter();
      const code = 'function hello() { return "world"; }';

      const html = highlighter.codeToHtml(code, {
        lang: 'javascript',
        theme: 'github-dark-dimmed',
      });

      expect(html).toContain('function');
      expect(html).toContain('hello');
    });

    it('supports dual themes (light and dark)', async () => {
      const highlighter = await getSharedHighlighter();
      const code = 'console.log("test");';

      const htmlDark = highlighter.codeToHtml(code, {
        lang: 'javascript',
        theme: 'github-dark-dimmed',
      });

      const htmlLight = highlighter.codeToHtml(code, {
        lang: 'javascript',
        theme: 'github-light',
      });

      expect(htmlDark).toBeDefined();
      expect(htmlLight).toBeDefined();
      // Both should work without errors
    });

    it('handles multiple language types', async () => {
      const highlighter = await getSharedHighlighter();

      const languages = [
        { code: 'const x = 1;', lang: 'typescript', keyword: 'const' },
        { code: 'import json', lang: 'python', keyword: 'import' },
        { code: '{"key": "value"}', lang: 'json', keyword: 'key' },
        { code: 'echo "hello"', lang: 'bash', keyword: 'echo' },
      ];

      for (const { code, lang, keyword } of languages) {
        const html = highlighter.codeToHtml(code, {
          lang,
          theme: 'github-dark-dimmed',
        });

        expect(html).toContain('<pre');
        // Check for keyword instead of raw code (Shiki transforms HTML entities)
        expect(html).toContain(keyword);
      }
    });
  });

  describe('Performance', () => {
    it('reuses instance for multiple highlighting operations', async () => {
      const start = Date.now();

      // First call creates instance
      const highlighter1 = await getSharedHighlighter();
      const firstCallTime = Date.now() - start;

      const start2 = Date.now();

      // Subsequent calls should be instant (no instance creation)
      const highlighter2 = await getSharedHighlighter();
      const secondCallTime = Date.now() - start2;

      expect(highlighter1).toBe(highlighter2);
      // Second call should be significantly faster (< 1ms vs 100ms+)
      expect(secondCallTime).toBeLessThan(firstCallTime / 10);
    });
  });

  describe('Disposal', () => {
    it('disposes highlighter instance', async () => {
      await getSharedHighlighter();

      // Should not throw
      expect(() => disposeHighlighter()).not.toThrow();
    });

    it('handles disposal when no instance exists', () => {
      // Should not throw even if no instance exists
      expect(() => disposeHighlighter()).not.toThrow();
    });

    it('allows creating new instance after disposal', async () => {
      const highlighter1 = await getSharedHighlighter();

      disposeHighlighter();

      // Should be able to create new instance
      const highlighter2 = await getSharedHighlighter();

      expect(highlighter2).toBeDefined();
      expect(highlighter2).not.toBe(highlighter1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty code string', async () => {
      const highlighter = await getSharedHighlighter();
      const html = highlighter.codeToHtml('', {
        lang: 'typescript',
        theme: 'github-dark-dimmed',
      });

      expect(html).toContain('<pre');
    });

    it('handles concurrent calls after initialization', async () => {
      // Initialize singleton first
      await getSharedHighlighter();

      // Now concurrent calls should all get same instance
      const promises = Array.from({ length: 10 }, () => getSharedHighlighter());

      const highlighters = await Promise.all(promises);

      // All should be the same instance
      const firstInstance = highlighters[0];
      for (const highlighter of highlighters) {
        expect(highlighter).toBe(firstInstance);
      }
    });
  });
});
