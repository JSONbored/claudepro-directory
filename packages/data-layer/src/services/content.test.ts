import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { MockPrismaClient } from '../test-utils/prisma-mock.ts';
import { ContentService } from './content.ts';

// Mock the prisma singleton with Prismock (async to avoid Node.js TS processing issue)
vi.mock('../prisma/client.ts', async () => {
  const { setupPrismockMockAsync } = await import('../test-utils/prisma-mock.ts');
  return {
    prisma: await setupPrismockMockAsync(),
  };
});

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Mock request cache
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

describe('ContentService', () => {
  let contentService: ContentService;
  let prismock: MockPrismaClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as MockPrismaClient;
    
    // Reset Prismock data before each test
    prismock.reset();
    
    contentService = new ContentService();
  });

  describe('getSitewideReadme', () => {
    it('should return README data on success', async () => {
      const mockData = {
        readme_content: '# Test README',
        last_updated: '2024-01-01',
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getSitewideReadme();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_readme_data')
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error when RPC fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(contentService.getSitewideReadme()).rejects.toThrow('Database error');
    });

    it('should handle null data gracefully', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

      const result = await contentService.getSitewideReadme();
      expect(result).toBeUndefined();
    });
  });

  describe('getSitewideLlmsTxt', () => {
    it('should return llms.txt data on success', async () => {
      const mockData = {
        content: '# LLMs.txt content',
        categories: ['agents', 'skills'],
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getSitewideLlmsTxt();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_sitewide_llms_txt')
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error on RPC failure', async () => {
      const mockError = new Error('RPC timeout');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(contentService.getSitewideLlmsTxt()).rejects.toThrow('RPC timeout');
    });
  });

  describe('getChangelogLlmsTxt', () => {
    it('should return changelog llms.txt data', async () => {
      const mockData = {
        content: '# Changelog',
        entries: [],
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getChangelogLlmsTxt();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_changelog_llms_txt')
      );
      expect(result).toEqual(mockData);
    });

    it('should handle empty changelog data', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(
        [{ content: '', entries: [] }] as any
      );

      const result = await contentService.getChangelogLlmsTxt();
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('entries');
    });
  });

  describe('getSitewideContentList', () => {
    it('should return sitewide content list', async () => {
      const mockData = { items: [], total: 0 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getSitewideContentList();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_sitewide_content_list')
      );
      expect(result).toEqual(mockData);
    });

    it('should accept optional args', async () => {
      const mockData = { items: [], total: 0 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      await contentService.getSitewideContentList({ limit: 10 });
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('getCategoryContentList', () => {
    it('should return category content list', async () => {
      const mockData = { items: [], total: 0 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getCategoryContentList({
        p_category: 'agents',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_category_content_list')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getCategoryLlmsTxt', () => {
    it('should return category llms.txt data', async () => {
      const mockData = { content: '# Category LLMs.txt' };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getCategoryLlmsTxt({
        p_category: 'agents',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_category_llms_txt')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getChangelogEntryLlmsTxt', () => {
    it('should return changelog entry llms.txt data', async () => {
      const mockData = { content: '# Changelog Entry' };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getChangelogEntryLlmsTxt({
        p_slug: 'test-entry',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_changelog_entry_llms_txt')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getToolLlmsTxt', () => {
    it('should return tool llms.txt data', async () => {
      const mockData = { content: '# Tool LLMs.txt' };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getToolLlmsTxt({
        p_category: 'agents',
        p_slug: 'test-tool',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_tool_llms_txt')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getCategoryConfigs', () => {
    it('should return category configs with features', async () => {
      const mockConfigs = [
        {
          category: 'agents',
          title: 'Agents',
          sections: { features: true, installation: true },
          show_on_homepage: true,
        },
      ];

      vi.mocked(prismock.category_configs.findMany).mockResolvedValue(
        mockConfigs as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getCategoryConfigs();

      expect(prismock.category_configs.findMany).toHaveBeenCalledWith({
        orderBy: { category: 'asc' },
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should transform sections JSON to features', async () => {
      const mockConfigs = [
        {
          category: 'agents',
          title: 'Agents',
          sections: {
            features: true,
            installation: false,
            use_cases: true,
          },
          show_on_homepage: true,
          display_config: null,
        },
      ];

      vi.mocked(prismock.category_configs.findMany).mockResolvedValue(
        mockConfigs as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getCategoryConfigs();

      expect(result[0]).toHaveProperty('features');
      expect(result[0].features).toHaveProperty('section_features', true);
      expect(result[0].features).toHaveProperty('section_installation', false);
    });
  });

  describe('getApiContentFull', () => {
    it('should return API content full data', async () => {
      const mockData = { content: [] };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getApiContentFull({
        p_category: 'agents',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_api_content_full')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('generateMarkdownExport', () => {
    it('should return markdown export data', async () => {
      const mockData = { markdown: '# Export' };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.generateMarkdownExport({
        p_category: 'agents',
        p_slug: 'test',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_markdown_export')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getItemLlmsTxt', () => {
    it('should return item llms.txt data', async () => {
      const mockData = { content: '# Item LLMs.txt' };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getItemLlmsTxt({
        p_category: 'agents',
        p_slug: 'test-item',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_item_llms_txt')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSkillStoragePath', () => {
    it('should return skill storage path', async () => {
      const mockData = { storage_path: 'skills/test.json' };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getSkillStoragePath({
        p_slug: 'test-skill',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_skill_storage_path')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getMcpbStoragePath', () => {
    it('should return mcpb storage path', async () => {
      const mockData = { storage_path: 'mcpb/test.json' };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getMcpbStoragePath({
        p_slug: 'test-mcpb',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_mcpb_storage_path')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getContentDetailComplete', () => {
    it('should return complete content detail', async () => {
      const mockData = {
        content: { id: '1', slug: 'test', title: 'Test' },
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getContentDetailComplete({
        p_category: 'agents',
        p_slug: 'test',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_content_detail_complete')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getEnrichedContentList', () => {
    it('should return enriched content list with category filter', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'test',
          title: 'Test',
          category: 'agents',
          is_sponsored: false,
        },
      ];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getEnrichedContentList({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('FROM content c'),
        'agents',
        10,
        0
      );
      expect(result).toEqual(mockData);
    });

    it('should return enriched content list with slugs filter', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'test-1',
          title: 'Test 1',
          category: 'agents',
        },
      ];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getEnrichedContentList({
        p_slugs: ['test-1', 'test-2'],
        p_limit: 10,
        p_offset: 0,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('c.slug = ANY'),
        ['test-1', 'test-2'],
        10,
        0
      );
      expect(result).toEqual(mockData);
    });

    it('should handle empty results', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([]);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getEnrichedContentList({
        p_category: 'agents',
      });

      expect(result).toEqual([]);
    });
  });

  describe('getContentPaginated', () => {
    it('should return paginated content', async () => {
      const mockData = {
        items: [],
        pagination: { total_count: 0, limit: 10, offset: 0 },
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getContentPaginated({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_content_paginated')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getHomepageComplete', () => {
    it('should return homepage complete data', async () => {
      const mockData = {
        featured: [],
        categories: [],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getHomepageComplete({
        p_category_ids: ['agents', 'mcp'],
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_homepage_complete')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getReviewsWithStats', () => {
    it('should return reviews with stats', async () => {
      const mockData = {
        reviews: [],
        stats: { total: 0, average_rating: 0 },
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getReviewsWithStats({
        p_content_type: 'agents',
        p_content_slug: 'test',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_reviews_with_stats')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getRelatedContent', () => {
    it('should return related content', async () => {
      const mockData = {
        items: [{ id: '1', slug: 'related-1', title: 'Related' }],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getRelatedContent({
        p_category: 'agents',
        p_slug: 'test',
        p_limit: 5,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_related_content')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getContentTemplates', () => {
    it('should return content templates for category', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          category: 'agents',
          name: 'Test Template',
          description: 'Test',
          template_data: { category: 'agents', tags: 'test' },
          active: true,
          display_order: 1,
        },
      ];

      vi.mocked(prismock.content_templates.findMany).mockResolvedValue(
        mockTemplates as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getContentTemplates({
        p_category: 'agents',
      });

      expect(prismock.content_templates.findMany).toHaveBeenCalledWith({
        where: {
          category: 'agents',
          active: true,
        },
        select: expect.objectContaining({
          id: true,
          category: true,
          name: true,
        }),
        orderBy: [
          { display_order: 'asc' },
          { name: 'asc' },
        ],
      });
      expect(result).toHaveProperty('templates');
      expect(result.templates?.[0]).toHaveProperty('type', 'agents');
      expect(result.templates?.[0]).toHaveProperty('category', 'agents');
    });

    it('should return null templates when none found', async () => {
      vi.mocked(prismock.content_templates.findMany).mockResolvedValue([]);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getContentTemplates({
        p_category: 'nonexistent',
      });

      expect(result.templates).toBeNull();
    });
  });

  describe('getContentPaginatedSlim', () => {
    it('should return paginated slim content with default params', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'test',
          title: 'Test',
          total_count: 100n,
        },
      ];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getContentPaginatedSlim({});

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('FROM mv_content_list_slim'),
        30, // default limit
        0 // default offset
      );
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.total_count).toBe(100);
    });

    it('should validate limit range', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await expect(
        contentService.getContentPaginatedSlim({ p_limit: 0 })
      ).rejects.toThrow('Invalid limit');

      await expect(
        contentService.getContentPaginatedSlim({ p_limit: 101 })
      ).rejects.toThrow('Invalid limit');
    });

    it('should validate offset', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await expect(
        contentService.getContentPaginatedSlim({ p_offset: -1 })
      ).rejects.toThrow('Invalid offset');
    });

    it('should validate order_by', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await expect(
        contentService.getContentPaginatedSlim({
          p_order_by: 'invalid',
        })
      ).rejects.toThrow('Invalid order_by');
    });

    it('should validate order_direction', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await expect(
        contentService.getContentPaginatedSlim({
          p_order_direction: 'invalid',
        })
      ).rejects.toThrow('Invalid order_direction');
    });

    it('should filter by category', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'test',
          category: 'agents',
          total_count: 50n,
        },
      ];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getContentPaginatedSlim({
        p_category: 'agents',
        p_limit: 20,
        p_offset: 0,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.category'),
        'agents',
        20,
        0
      );
      expect(result.pagination.total_count).toBe(50);
    });

    it('should handle empty results', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([]);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getContentPaginatedSlim({
        p_category: 'nonexistent',
      });

      expect(result.items).toEqual([]);
      expect(result.pagination.total_count).toBe(0);
      expect(result.pagination.has_more).toBe(false);
    });

    it('should calculate pagination correctly', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'test',
          total_count: 100n,
        },
        {
          id: '2',
          slug: 'test-2',
          total_count: 100n,
        },
      ];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getContentPaginatedSlim({
        p_limit: 10,
        p_offset: 0,
      });

      expect(result.pagination.total_count).toBe(100);
      expect(result.pagination.current_page).toBe(1);
      expect(result.pagination.total_pages).toBe(10);
      expect(result.pagination.has_more).toBe(true);
    });
  });

  describe('getContentDetailCore', () => {
    it('should return content detail core', async () => {
      const mockData = {
        content: { id: '1', slug: 'test', title: 'Test' },
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getContentDetailCore({
        p_category: 'agents',
        p_slug: 'test',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_content_detail_core')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getContentAnalytics', () => {
    it('should return content analytics', async () => {
      const mockData = {
        views: 100,
        copies: 50,
        bookmarks: 25,
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getContentAnalytics({
        p_category: 'agents',
        p_slug: 'test',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_content_analytics')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getHomepageOptimized', () => {
    it('should return homepage optimized data', async () => {
      const mockData = {
        featured: [],
        categories: [],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getHomepageOptimized({
        p_category_ids: ['agents'],
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_homepage_optimized')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('generateChangelogRssFeed', () => {
    it('should return changelog RSS feed', async () => {
      const mockData = {
        feed: '<?xml version="1.0"?><rss>...</rss>',
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.generateChangelogRssFeed();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_changelog_rss_feed')
      );
      expect(result).toEqual(mockData);
    });

    it('should accept optional args', async () => {
      const mockData = { feed: '<?xml>...</xml>' };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      await contentService.generateChangelogRssFeed({ p_limit: 20 });
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('generateChangelogAtomFeed', () => {
    it('should return changelog Atom feed', async () => {
      const mockData = {
        feed: '<?xml version="1.0"?><feed>...</feed>',
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.generateChangelogAtomFeed();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_changelog_atom_feed')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('generateContentRssFeed', () => {
    it('should return content RSS feed', async () => {
      const mockData = {
        feed: '<?xml version="1.0"?><rss>...</rss>',
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.generateContentRssFeed();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_content_rss_feed')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('generateContentAtomFeed', () => {
    it('should return content Atom feed', async () => {
      const mockData = {
        feed: '<?xml version="1.0"?><feed>...</feed>',
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.generateContentAtomFeed();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_content_atom_feed')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getWeeklyDigest', () => {
    it('should return weekly digest data', async () => {
      const mockData = {
        new_content: [],
        trending_content: [],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await contentService.getWeeklyDigest();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_weekly_digest')
      );
      expect(result).toEqual(mockData);
    });

    it('should accept optional args', async () => {
      const mockData = { new_content: [], trending_content: [] };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      await contentService.getWeeklyDigest({ p_limit: 10 });
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should log errors with proper context', async () => {
      const { logRpcError } = await import('../utils/rpc-error-logging.ts');
      const mockError = new Error('Test error');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(contentService.getSitewideReadme()).rejects.toThrow();
      expect(logRpcError).toHaveBeenCalledWith(mockError, {
        rpcName: 'generate_readme_data',
        operation: 'ContentService.getSitewideReadme',
        args: {},
      });
    });

    it('should propagate database connection errors', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(new Error('Connection refused'));

      await expect(contentService.getSitewideReadme()).rejects.toThrow('Connection refused');
    });

    it('should handle Prisma query errors for direct queries', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const mockError = new Error('Prisma query failed');
      vi.mocked(prismock.category_configs.findMany).mockRejectedValue(mockError);

      await expect(contentService.getCategoryConfigs()).rejects.toThrow('Prisma query failed');
    });
  });
});