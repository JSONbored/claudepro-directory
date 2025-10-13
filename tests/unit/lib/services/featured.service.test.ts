/**
 * Featured Service Tests
 * SHA-3152: Tests for unified featured content service
 *
 * Tests for the featured content service which handles:
 * - Loading current week's featured configs from database
 * - Fallback logic when no featured configs exist
 * - Ensuring all 7 categories are represented
 * - Mixing trending and alphabetical content
 *
 * Coverage:
 * - Featured content loading with database records
 * - Fallback logic (trending + alphabetical)
 * - Category grouping and limiting
 * - Error handling
 *
 * @see src/lib/services/featured.service.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { featuredService } from '@/src/lib/services/featured.service';

// Mock dependencies
vi.mock('@/src/lib/content/content-loaders', () => ({
  getContentByCategory: vi.fn(),
}));

vi.mock('@/src/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/src/lib/trending/calculator', () => ({
  getBatchTrendingData: vi.fn(),
}));

vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getContentByCategory } from '@/src/lib/content/content-loaders';
import { createClient } from '@/src/lib/supabase/server';
import { getBatchTrendingData } from '@/src/lib/trending/calculator';

// Helper to create mock content items
function createMockItem(category: string, slug: string, title: string): UnifiedContentItem {
  return {
    id: slug,
    slug,
    title,
    name: title,
    category,
    excerpt: `${title} description`,
    author: 'Test Author',
    tags: [],
    dateCreated: '2025-01-01',
    dateModified: '2025-01-01',
  } as UnifiedContentItem;
}

describe('featuredService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // getCurrentWeekStart is now an internal utility function, not exposed on the service
  // Tests removed as function is no longer part of the public API

  describe('loadCurrentFeaturedContentByCategory', () => {
    it('loads featured content from database when available', async () => {
      // Mock database response
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    content_type: 'rules',
                    content_slug: 'rule-1',
                    rank: 1,
                    final_score: 95.5,
                  },
                  {
                    content_type: 'agents',
                    content_slug: 'agent-1',
                    rank: 1,
                    final_score: 92.3,
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock content loaders
      vi.mocked(getContentByCategory).mockImplementation(async (category) => {
        if (category === 'rules') {
          return [createMockItem('rules', 'rule-1', 'Test Rule')];
        }
        if (category === 'agents') {
          return [createMockItem('agents', 'agent-1', 'Test Agent')];
        }
        return [];
      });

      const result = await featuredService.loadCurrentFeaturedContentByCategory();

      expect(result).toHaveProperty('rules');
      expect(result).toHaveProperty('agents');
      expect(result.rules).toHaveLength(1);
      expect(result.agents).toHaveLength(1);
      expect(result.rules?.[0]).toHaveProperty('_featured');
      expect(result.rules?.[0]?._featured).toEqual({ rank: 1, score: 95.5 });
    });

    it('uses fallback when no featured configs exist', async () => {
      // Mock empty database response
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock content loaders
      vi.mocked(getContentByCategory).mockImplementation(async (category) => {
        if (category === 'rules') {
          return [
            createMockItem('rules', 'rule-1', 'Alpha Rule'),
            createMockItem('rules', 'rule-2', 'Beta Rule'),
          ];
        }
        return [];
      });

      // Mock trending data
      vi.mocked(getBatchTrendingData).mockResolvedValue({
        popular: [createMockItem('rules', 'rule-1', 'Alpha Rule')],
        totalViews: 100,
        totalUniqueVisitors: 50,
      } as never);

      const result = await featuredService.loadCurrentFeaturedContentByCategory();

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('ensures all 7 categories are represented in fallback', async () => {
      // Mock empty database response
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock content loaders - provide 3 items per category
      vi.mocked(getContentByCategory).mockImplementation(async (category) => {
        return [
          createMockItem(category as string, `${category}-1`, `${category} Item 1`),
          createMockItem(category as string, `${category}-2`, `${category} Item 2`),
          createMockItem(category as string, `${category}-3`, `${category} Item 3`),
        ];
      });

      // Mock trending data - only 2 trending items per category
      vi.mocked(getBatchTrendingData).mockResolvedValue({
        popular: [
          createMockItem('rules', 'rules-1', 'rules Item 1'),
          createMockItem('rules', 'rules-2', 'rules Item 2'),
          createMockItem('mcp', 'mcp-1', 'mcp Item 1'),
          createMockItem('mcp', 'mcp-2', 'mcp Item 2'),
          createMockItem('agents', 'agents-1', 'agents Item 1'),
          createMockItem('agents', 'agents-2', 'agents Item 2'),
          createMockItem('commands', 'commands-1', 'commands Item 1'),
          createMockItem('commands', 'commands-2', 'commands Item 2'),
          createMockItem('hooks', 'hooks-1', 'hooks Item 1'),
          createMockItem('hooks', 'hooks-2', 'hooks Item 2'),
          createMockItem('statuslines', 'statuslines-1', 'statuslines Item 1'),
          createMockItem('statuslines', 'statuslines-2', 'statuslines Item 2'),
          createMockItem('collections', 'collections-1', 'collections Item 1'),
          createMockItem('collections', 'collections-2', 'collections Item 2'),
        ],
        totalViews: 1000,
        totalUniqueVisitors: 500,
      } as never);

      const result = await featuredService.loadCurrentFeaturedContentByCategory();

      // All 7 categories should be present
      expect(result).toHaveProperty('rules');
      expect(result).toHaveProperty('mcp');
      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('commands');
      expect(result).toHaveProperty('hooks');
      expect(result).toHaveProperty('statuslines');
      expect(result).toHaveProperty('collections');

      // Each should have at least 2 items (from trending)
      expect(result.rules?.length).toBeGreaterThanOrEqual(2);
      expect(result.mcp?.length).toBeGreaterThanOrEqual(2);
      expect(result.agents?.length).toBeGreaterThanOrEqual(2);
      expect(result.commands?.length).toBeGreaterThanOrEqual(2);
      expect(result.hooks?.length).toBeGreaterThanOrEqual(2);
      expect(result.statuslines?.length).toBeGreaterThanOrEqual(2);
      expect(result.collections?.length).toBeGreaterThanOrEqual(2);
    });

    it('supplements trending items with alphabetical when < 6 available', async () => {
      // Mock empty database response
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock content loaders - provide 10 items per category
      vi.mocked(getContentByCategory).mockImplementation(async (category) => {
        return Array.from({ length: 10 }, (_, i) =>
          createMockItem(
            category as string,
            `${category}-${i + 1}`,
            `${String.fromCharCode(65 + i)} ${category}` // A-J alphabetically
          )
        );
      });

      // Mock trending data - only 2 trending items for rules
      vi.mocked(getBatchTrendingData).mockResolvedValue({
        popular: [
          createMockItem('rules', 'rules-5', 'E rules'), // Not alphabetically first
          createMockItem('rules', 'rules-7', 'G rules'),
          // Other categories get 6+ items
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('mcp', `mcp-${i + 1}`, `mcp ${i + 1}`)
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('agents', `agents-${i + 1}`, `agents ${i + 1}`)
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('commands', `commands-${i + 1}`, `commands ${i + 1}`)
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('hooks', `hooks-${i + 1}`, `hooks ${i + 1}`)
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('statuslines', `statuslines-${i + 1}`, `statuslines ${i + 1}`)
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('collections', `collections-${i + 1}`, `collections ${i + 1}`)
          ),
        ],
        totalViews: 1000,
        totalUniqueVisitors: 500,
      } as never);

      const result = await featuredService.loadCurrentFeaturedContentByCategory();

      // Rules should have 6 items: 2 trending + 4 alphabetical
      expect(result.rules).toHaveLength(6);

      // First 2 should be trending items (E and G)
      expect(result.rules?.[0]?.slug).toBe('rules-5');
      expect(result.rules?.[1]?.slug).toBe('rules-7');

      // Next 4 should be alphabetical (A, B, C, D - skipping E and G)
      expect(result.rules?.[2]?.title).toContain('A rules');
      expect(result.rules?.[3]?.title).toContain('B rules');
      expect(result.rules?.[4]?.title).toContain('C rules');
      expect(result.rules?.[5]?.title).toContain('D rules');
    });

    it('limits each category to 6 items max', async () => {
      // Mock empty database response for fallback
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock content loaders with 20 items
      vi.mocked(getContentByCategory).mockImplementation(async (category) => {
        return Array.from({ length: 20 }, (_, i) =>
          createMockItem(category as string, `${category}-${i}`, `Item ${i}`)
        );
      });

      // Mock trending with 15 items for rules
      vi.mocked(getBatchTrendingData).mockResolvedValue({
        popular: [
          ...Array.from({ length: 15 }, (_, i) =>
            createMockItem('rules', `rules-${i}`, `Item ${i}`)
          ),
          ...Array.from({ length: 6 }, (_, i) => createMockItem('mcp', `mcp-${i}`, `Item ${i}`)),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('agents', `agents-${i}`, `Item ${i}`)
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('commands', `commands-${i}`, `Item ${i}`)
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('hooks', `hooks-${i}`, `Item ${i}`)
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('statuslines', `statuslines-${i}`, `Item ${i}`)
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockItem('collections', `collections-${i}`, `Item ${i}`)
          ),
        ],
        totalViews: 2000,
        totalUniqueVisitors: 1000,
      } as never);

      const result = await featuredService.loadCurrentFeaturedContentByCategory();

      // Each category should have exactly 6 items max
      expect(result.rules?.length).toBeLessThanOrEqual(6);
      expect(result.mcp?.length).toBeLessThanOrEqual(6);
      expect(result.agents?.length).toBeLessThanOrEqual(6);
      expect(result.commands?.length).toBeLessThanOrEqual(6);
      expect(result.hooks?.length).toBeLessThanOrEqual(6);
      expect(result.statuslines?.length).toBeLessThanOrEqual(6);
      expect(result.collections?.length).toBeLessThanOrEqual(6);
    });

    it('handles database errors gracefully', async () => {
      // Mock database error
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database connection failed'),
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock content loaders
      vi.mocked(getContentByCategory).mockResolvedValue([
        createMockItem('rules', 'rule-1', 'Test Rule'),
      ]);

      // Mock trending data
      vi.mocked(getBatchTrendingData).mockResolvedValue({
        popular: [createMockItem('rules', 'rule-1', 'Test Rule')],
        totalViews: 100,
        totalUniqueVisitors: 50,
      } as never);

      // Should not throw, should use fallback
      const result = await featuredService.loadCurrentFeaturedContentByCategory();

      expect(result).toBeDefined();
    });

    it('handles missing content items in database records', async () => {
      // Mock database response with non-existent item
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    content_type: 'rules',
                    content_slug: 'non-existent',
                    rank: 1,
                    final_score: 95.5,
                  },
                  {
                    content_type: 'rules',
                    content_slug: 'rule-1',
                    rank: 2,
                    final_score: 90.0,
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock content loaders - only rule-1 exists
      vi.mocked(getContentByCategory).mockImplementation(async (category) => {
        if (category === 'rules') {
          return [createMockItem('rules', 'rule-1', 'Test Rule')];
        }
        return [];
      });

      const result = await featuredService.loadCurrentFeaturedContentByCategory();

      // Should only include rule-1, skip non-existent
      expect(result.rules).toHaveLength(1);
      expect(result.rules?.[0]?.slug).toBe('rule-1');
    });
  });

  describe('loadCurrentFeaturedContent', () => {
    it('returns empty array when no featured configs exist', async () => {
      // Mock empty database response
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const result = await featuredService.loadCurrentFeaturedContent();

      expect(result).toEqual([]);
    });

    it('loads and enriches featured items', async () => {
      // Mock database response
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    content_type: 'rules',
                    content_slug: 'rule-1',
                    rank: 1,
                    final_score: 95.5,
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      // Mock content loaders
      vi.mocked(getContentByCategory).mockImplementation(async (category) => {
        if (category === 'rules') {
          return [createMockItem('rules', 'rule-1', 'Test Rule')];
        }
        return [];
      });

      const result = await featuredService.loadCurrentFeaturedContent();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('_featured');
      expect(result[0]._featured).toEqual({ rank: 1, score: 95.5 });
    });

    it('handles errors gracefully', async () => {
      // Mock createClient to throw error
      vi.mocked(createClient).mockRejectedValue(new Error('Connection failed'));

      const result = await featuredService.loadCurrentFeaturedContent();

      expect(result).toEqual([]);
    });
  });
});
