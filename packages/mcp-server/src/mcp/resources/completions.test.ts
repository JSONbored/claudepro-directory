/**
 * Tests for Resource Completion Handlers
 *
 * Tests completion suggestions for resource template parameters (category, slug, format).
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getCategoryCompletions, getSlugCompletions, getFormatCompletions } from './completions.js';
import { createMockLogger } from '../../__tests__/test-utils.ts';
import type { RuntimeLogger } from '../../types/runtime.js';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

describe('Resource Completion Handlers', () => {
  let prismocker: PrismaClient;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    clearRequestCache();

    prismocker = prisma;
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('getCategoryCompletions', () => {
    it('should return categories matching prefix', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', [
          { category: 'agents' },
          { category: 'mcp' },
          { category: 'rules' },
        ]);
      }

      const result = await getCategoryCompletions('a', prismocker, mockLogger as RuntimeLogger);

      expect(result).toContain('agents');
      expect(result).not.toContain('mcp');
      expect(result).not.toContain('rules');
    });

    it('should be case-insensitive', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', [
          { category: 'agents' },
          { category: 'MCP' },
        ]);
      }

      const result = await getCategoryCompletions('m', prismocker, mockLogger as RuntimeLogger);

      expect(result).toContain('MCP');
    });

    it('should return empty array if no matches', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', [{ category: 'agents' }]);
      }

      const result = await getCategoryCompletions('xyz', prismocker, mockLogger as RuntimeLogger);

      expect(result).toEqual([]);
    });

    it('should fallback to static list on database error', async () => {
      // Mock database error
      jest
        .spyOn(prismocker.category_configs, 'findMany')
        .mockRejectedValueOnce(new Error('DB error'));

      const result = await getCategoryCompletions('a', prismocker, mockLogger as RuntimeLogger);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((cat) => cat.toLowerCase().startsWith('a'))).toBe(true);
    });

    it('should return all categories for empty prefix', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', [
          { category: 'agents' },
          { category: 'mcp' },
          { category: 'rules' },
        ]);
      }

      const result = await getCategoryCompletions('', prismocker, mockLogger as RuntimeLogger);

      expect(result.length).toBe(3);
      expect(result).toContain('agents');
      expect(result).toContain('mcp');
      expect(result).toContain('rules');
    });
  });

  describe('getSlugCompletions', () => {
    it('should return slugs matching prefix', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          { slug: 'test-agent', category: 'agents' },
          { slug: 'test-mcp', category: 'mcp' },
          { slug: 'other-agent', category: 'agents' },
        ]);
      }

      const result = await getSlugCompletions(
        'test',
        undefined,
        prismocker,
        mockLogger as RuntimeLogger
      );

      expect(result.length).toBe(2);
      expect(result).toContain('test-agent');
      expect(result).toContain('test-mcp');
    });

    it('should filter by category when provided', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          { slug: 'test-agent', category: 'agents' },
          { slug: 'test-mcp', category: 'mcp' },
          { slug: 'other-agent', category: 'agents' },
        ]);
      }

      const result = await getSlugCompletions(
        'test',
        'agents',
        prismocker,
        mockLogger as RuntimeLogger
      );

      expect(result.length).toBe(1);
      expect(result).toContain('test-agent');
      expect(result).not.toContain('test-mcp');
    });

    it('should be case-insensitive', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [{ slug: 'Test-Agent', category: 'agents' }]);
      }

      const result = await getSlugCompletions(
        'test',
        undefined,
        prismocker,
        mockLogger as RuntimeLogger
      );

      expect(result).toContain('Test-Agent');
    });

    it('should limit to 50 suggestions', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        const manySlugs = Array.from({ length: 60 }, (_, i) => ({
          slug: `test-${i}`,
          category: 'agents',
        }));
        (prismocker as any).setData('content', manySlugs);
      }

      const result = await getSlugCompletions(
        'test',
        undefined,
        prismocker,
        mockLogger as RuntimeLogger
      );

      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should return empty array on database error', async () => {
      jest.spyOn(prismocker.content, 'findMany').mockRejectedValueOnce(new Error('DB error'));

      const result = await getSlugCompletions(
        'test',
        undefined,
        prismocker,
        mockLogger as RuntimeLogger
      );

      expect(mockLogger.error).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should ignore invalid category', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [{ slug: 'test-agent', category: 'agents' }]);
      }

      const result = await getSlugCompletions(
        'test',
        'invalid-category',
        prismocker,
        mockLogger as RuntimeLogger
      );

      // Should still return results (category filter ignored)
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getFormatCompletions', () => {
    it('should return formats matching prefix', () => {
      const result = getFormatCompletions('ll');

      expect(result).toContain('llms.txt');
      expect(result).not.toContain('markdown');
    });

    it('should be case-insensitive', () => {
      const result = getFormatCompletions('LL');

      expect(result).toContain('llms.txt');
    });

    it('should return all formats for empty prefix', () => {
      const result = getFormatCompletions('');

      expect(result.length).toBe(5);
      expect(result).toContain('llms.txt');
      expect(result).toContain('markdown');
      expect(result).toContain('json');
      expect(result).toContain('rss');
      expect(result).toContain('atom');
    });

    it('should return empty array if no matches', () => {
      const result = getFormatCompletions('xyz');

      expect(result).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should complete category parameter in resource template', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', [
          { category: 'agents' },
          { category: 'mcp' },
        ]);
      }

      const completions = await getCategoryCompletions(
        'a',
        prismocker,
        mockLogger as RuntimeLogger
      );

      expect(completions).toContain('agents');
      expect(completions).not.toContain('mcp');
    });

    it('should complete slug parameter with category context', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          { slug: 'agent-1', category: 'agents' },
          { slug: 'mcp-1', category: 'mcp' },
        ]);
      }

      const completions = await getSlugCompletions(
        '',
        'agents',
        prismocker,
        mockLogger as RuntimeLogger
      );

      expect(completions).toContain('agent-1');
      expect(completions).not.toContain('mcp-1');
    });

    it('should complete format parameter', () => {
      const completions = getFormatCompletions('j');

      expect(completions).toContain('json');
      expect(completions).not.toContain('llms.txt');
    });
  });
});
