import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ContentService } from './content.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockClient
// Following the official Prismock README approach exactly

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
  let prismock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;

  /**
   * Helper to safely mock Prismock model methods
   * Prismock creates models automatically from schema.prisma
   * However, methods may not be initialized until first access
   * This helper ensures methods exist and are mockable
   */
  function mockPrismockMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismock model does not exist - check if model name matches schema.prisma`);
    }
    // Always create/assign the mock function directly
    // This ensures the method exists and is mockable, regardless of Prismock's initialization state
    const mockFn = vi.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    prismock = prisma;

    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }

    // Prismock doesn't support $queryRawUnsafe, so we add it as a mock function
    // This is the proper way to handle unsupported methods per Vitest best practices
    // We assign vi.fn() directly to the property and use it as the mock
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismock models are initialized by accessing them
    // Prismock creates models lazily, so we need to trigger initialization
    // Accessing the model property triggers Prismock to create it with methods
    void prismock.category_configs;
    void prismock.content;
    void prismock.sponsored_content;
    void prismock.content_templates;
    void prismock.v_content_list_slim;

    contentService = new ContentService();
  });

  describe('getSitewideReadme', () => {
    it('should return README data on success', async () => {
      const mockData = {
        readme_content: '# Test README',
        last_updated: '2024-01-01',
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getSitewideReadme();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_readme_data')
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error when RPC fails', async () => {
      const mockError = new Error('Database error');

      queryRawUnsafeSpy.mockRejectedValue(mockError);

      await expect(contentService.getSitewideReadme()).rejects.toThrow('Database error');
    });

    it('should handle null data gracefully', async () => {
      queryRawUnsafeSpy.mockResolvedValue([] as any);

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

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getSitewideLlmsTxt();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_sitewide_llms_txt')
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error on RPC failure', async () => {
      const mockError = new Error('RPC timeout');

      queryRawUnsafeSpy.mockRejectedValue(mockError);

      await expect(contentService.getSitewideLlmsTxt()).rejects.toThrow('RPC timeout');
    });
  });

  describe('getChangelogLlmsTxt', () => {
    it('should return changelog llms.txt data', async () => {
      const mockData = {
        content: '# Changelog',
        entries: [],
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getChangelogLlmsTxt();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_changelog_llms_txt')
      );
      expect(result).toEqual(mockData);
    });

    it('should handle empty changelog data', async () => {
      queryRawUnsafeSpy.mockResolvedValue([{ content: '', entries: [] }] as any);

      const result = await contentService.getChangelogLlmsTxt();
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('entries');
    });
  });

  describe('getSitewideContentList', () => {
    it('should return sitewide content list', async () => {
      const mockData = { items: [], total: 0 };
      // List functions return arrays, so mock returns array of results
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getSitewideContentList();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_sitewide_content_list')
      );
      // List functions return arrays (GetSitewideContentListReturns is an array type)
      expect(result).toEqual([mockData]);
    });

    it('should accept optional args', async () => {
      const mockData = { items: [], total: 0 };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      await contentService.getSitewideContentList({ limit: 10 });
      expect(queryRawUnsafeSpy).toHaveBeenCalled();
    });
  });

  describe('getCategoryContentList', () => {
    it('should return category content list', async () => {
      const mockData = { items: [], total: 0 };
      // List functions return arrays, so mock returns array of results
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getCategoryContentList({
        p_category: 'agents',
      });

      // SQL contains the function name (even with SELECT * FROM prefix)
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_category_content_list'),
        'agents'
      );
      // List functions return arrays (GetCategoryContentListReturns is an array type)
      expect(result).toEqual([mockData]);
    });
  });

  describe('getCategoryLlmsTxt', () => {
    it('should return category llms.txt data', async () => {
      const mockData = { content: '# Category LLMs.txt' };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getCategoryLlmsTxt({
        p_category: 'agents',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_category_llms_txt'),
        'agents'
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getChangelogEntryLlmsTxt', () => {
    it('should return changelog entry llms.txt data', async () => {
      const mockData = { content: '# Changelog Entry' };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getChangelogEntryLlmsTxt({
        p_slug: 'test-entry',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_changelog_entry_llms_txt'),
        'test-entry'
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getToolLlmsTxt', () => {
    it('should return tool llms.txt data', async () => {
      const mockData = { content: '# Tool LLMs.txt' };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getToolLlmsTxt({
        p_category: 'agents',
        p_slug: 'test-tool',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category, p_slug
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_tool_llms_txt'),
        'agents', // p_category
        'test-tool' // p_slug
      );
      // Single-return function unwraps array
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

      const findManyMock = mockPrismockMethod(prismock.category_configs, 'findMany', mockConfigs);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getCategoryConfigs();

      // The service calls findMany with a select object and orderBy
      // We check that it was called with the correct structure
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { category: 'asc' },
          select: expect.objectContaining({
            category: true,
            title: true,
            sections: true,
          }),
        })
      );
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

      mockPrismockMethod(prismock.category_configs, 'findMany', mockConfigs);

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
      // get_api_content_full returns a string (JSON stringified content)
      const mockData = '{"content":[]}';
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getApiContentFull({
        p_category: 'agents',
        p_slug: 'test',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category, p_slug
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_api_content_full'),
        'agents', // p_category
        'test' // p_slug
      );
      // Single-return function unwraps array (function name doesn't include '_content')
      expect(result).toEqual(mockData);
    });
  });

  describe('generateMarkdownExport', () => {
    it('should return markdown export data', async () => {
      const mockData = { markdown: '# Export' };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.generateMarkdownExport({
        p_category: 'agents',
        p_slug: 'test',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category, p_slug
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_markdown_export'),
        'agents', // p_category
        'test' // p_slug
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getItemLlmsTxt', () => {
    it('should return item llms.txt data', async () => {
      const mockData = { content: '# Item LLMs.txt' };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getItemLlmsTxt({
        p_category: 'agents',
        p_slug: 'test-item',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category, p_slug
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_item_llms_txt'),
        'agents', // p_category
        'test-item' // p_slug
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getSkillStoragePath', () => {
    it('should return skill storage path', async () => {
      const mockData = { storage_path: 'skills/test.json' };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getSkillStoragePath({
        p_slug: 'test-skill',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_skill_storage_path'),
        'test-skill'
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getMcpbStoragePath', () => {
    it('should return mcpb storage path', async () => {
      const mockData = { storage_path: 'mcpb/test.json' };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getMcpbStoragePath({
        p_slug: 'test-mcpb',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_mcpb_storage_path'),
        'test-mcpb'
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getContentDetailComplete', () => {
    it('should return complete content detail', async () => {
      const mockData = {
        content: { id: '1', slug: 'test', title: 'Test' },
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getContentDetailComplete({
        p_category: 'agents',
        p_slug: 'test',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category, p_slug
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_content_detail_complete'),
        'agents', // p_category
        'test' // p_slug
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getEnrichedContentList', () => {
    it('should return enriched content list with category filter', async () => {
      // After migration: Uses Prisma findMany + JavaScript join instead of raw SQL LEFT JOIN
      const mockContent = [
        {
          id: '1',
          slug: 'test',
          title: 'Test',
          display_title: null,
          seo_title: null,
          description: 'Test description',
          author: 'test-author',
          author_profile_url: null,
          category: 'agents' as const,
          tags: ['tag1'],
          source_table: 'agents',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          date_added: new Date('2024-01-01'),
          features: [],
          use_cases: [],
          source: null,
          documentation_url: null,
          metadata: {},
          view_count: 0,
          copy_count: 0,
          bookmark_count: 0,
          popularity_score: 0,
        },
      ];

      const mockSponsored: Array<{
        id: string;
        content_id: string;
        content_type: string;
        tier: string;
        active: boolean | null;
      }> = []; // No sponsored content for this test

      mockPrismockMethod(prismock.content, 'findMany', mockContent);
      mockPrismockMethod(prismock.sponsored_content, 'findMany', mockSponsored);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getEnrichedContentList({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
      });

      // After migration: Uses Prisma findMany instead of $queryRawUnsafe
      // Note: Implementation doesn't use select because it needs all fields for contentModel type
      expect(prismock.content.findMany).toHaveBeenCalledWith({
        where: { category: 'agents' },
        orderBy: { slug: 'asc' },
        take: 10,
        skip: 0,
        // No select clause - fetches all fields to match contentModel type
      });

      // Expected result structure (enriched with sponsorship fields)
      expect(result).toEqual([
        {
          id: '1',
          slug: 'test',
          title: 'Test',
          display_title: null,
          seo_title: null,
          description: 'Test description',
          author: 'test-author',
          author_profile_url: null,
          category: 'agents',
          tags: ['tag1'],
          source_table: 'agents',
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
          date_added: expect.any(Date),
          features: [],
          use_cases: [],
          source: null,
          documentation_url: null,
          metadata: {},
          view_count: 0,
          copy_count: 0,
          bookmark_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ]);
    });

    it('should return enriched content list with slugs filter', async () => {
      // After migration: Uses Prisma findMany + JavaScript join
      const mockContent = [
        {
          id: '1',
          slug: 'test-1',
          title: 'Test 1',
          display_title: null,
          seo_title: null,
          description: 'Test 1 description',
          author: 'test-author',
          author_profile_url: null,
          category: 'agents' as const,
          tags: [],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          date_added: new Date('2024-01-01'),
          features: [],
          use_cases: [],
          source: null,
          documentation_url: null,
          metadata: {},
          view_count: 0,
          copy_count: 0,
          bookmark_count: 0,
          popularity_score: 0,
        },
      ];

      const mockSponsored: Array<{
        id: string;
        content_id: string;
        content_type: string;
        tier: string;
        active: boolean | null;
      }> = [];

      mockPrismockMethod(prismock.content, 'findMany', mockContent);
      mockPrismockMethod(prismock.sponsored_content, 'findMany', mockSponsored);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getEnrichedContentList({
        p_slugs: ['test-1', 'test-2'],
        p_limit: 10,
        p_offset: 0,
      });

      // After migration: Uses Prisma findMany with slug filter
      // Note: Implementation doesn't use select because it needs all fields for contentModel type
      expect(prismock.content.findMany).toHaveBeenCalledWith({
        where: { slug: { in: ['test-1', 'test-2'] } },
        orderBy: { slug: 'asc' },
        take: 10,
        skip: 0,
        // No select clause - fetches all fields to match contentModel type
      });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('test-1');
      expect(result[0].is_sponsored).toBe(false);
    });

    it('should handle empty results', async () => {
      // After migration: Uses Prisma findMany
      vi.mocked(prismock.content.findMany).mockResolvedValue([]);
      vi.mocked(prismock.sponsored_content.findMany).mockResolvedValue([]);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getEnrichedContentList({
        p_category: 'agents',
      });

      expect(result).toEqual([]);
      expect(prismock.content.findMany).toHaveBeenCalled();
    });
  });

  describe('getContentPaginated', () => {
    it('should return paginated content', async () => {
      const mockData = {
        items: [],
        pagination: { total_count: 0, limit: 10, offset: 0 },
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getContentPaginated({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category, p_limit, p_offset
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_content_paginated'),
        'agents', // p_category
        10, // p_limit
        0 // p_offset
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getHomepageComplete', () => {
    it('should return homepage complete data', async () => {
      const mockData = {
        featured: [],
        categories: [],
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getHomepageComplete({
        p_category_ids: ['agents', 'mcp'],
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category_ids
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_homepage_complete'),
        ['agents', 'mcp'] // p_category_ids (array)
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getReviewsWithStats', () => {
    it('should return reviews with stats', async () => {
      const mockData = {
        reviews: [],
        stats: { total: 0, average_rating: 0 },
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getReviewsWithStats({
        p_content_type: 'agents',
        p_content_slug: 'test',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_content_slug, p_content_type
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_reviews_with_stats'),
        'agents', // p_content_type (alphabetically first)
        'test' // p_content_slug
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getRelatedContent', () => {
    it('should return related content', async () => {
      const mockData = {
        items: [{ id: '1', slug: 'related-1', title: 'Related' }],
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getRelatedContent({
        p_category: 'agents',
        p_slug: 'test',
        p_limit: 5,
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category, p_limit, p_slug
      // The SQL contains the function name, so stringContaining works
      // Use expect.anything() for remaining arguments to be more flexible
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_related_content'),
        expect.anything(), // p_category
        expect.anything(), // p_limit  
        expect.anything() // p_slug
      );
      // Single-return function unwraps array
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

      mockPrismockMethod(prismock.content_templates, 'findMany', mockTemplates as any);

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
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      });
      expect(result).toHaveProperty('templates');
      expect(result.templates?.[0]).toHaveProperty('type', 'agents');
      expect(result.templates?.[0]).toHaveProperty('category', 'agents');
    });

    it('should return null templates when none found', async () => {
      mockPrismockMethod(prismock.content_templates, 'findMany', []);

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
      const mockItems = [
        {
          id: '1',
          slug: 'test',
          title: 'Test',
          display_title: null,
          description: null,
          author: null,
          author_profile_url: null,
          category: 'agents',
          tags: [],
          source: null,
          source_table: 'agents',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          date_added: new Date('2024-01-01'),
          view_count: 0,
          copy_count: 0,
          bookmark_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      mockPrismockMethod(prismock.v_content_list_slim, 'findMany', mockItems as any);
      mockPrismockMethod(prismock.v_content_list_slim, 'count', 100);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getContentPaginatedSlim({});

      expect(prismock.v_content_list_slim.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ created_at: 'desc' }],
        take: 30,
        skip: 0,
      });
      expect(prismock.v_content_list_slim.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.total_count).toBe(100);
    });

    it('should validate limit range', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await expect(contentService.getContentPaginatedSlim({ p_limit: 0 })).rejects.toThrow(
        'Invalid limit'
      );

      await expect(contentService.getContentPaginatedSlim({ p_limit: 101 })).rejects.toThrow(
        'Invalid limit'
      );
    });

    it('should validate offset', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await expect(contentService.getContentPaginatedSlim({ p_offset: -1 })).rejects.toThrow(
        'Invalid offset'
      );
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
      const mockItems = [
        {
          id: '1',
          slug: 'test',
          title: 'Test',
          display_title: null,
          description: null,
          author: null,
          author_profile_url: null,
          category: 'agents',
          tags: [],
          source: null,
          source_table: 'agents',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          date_added: new Date('2024-01-01'),
          view_count: 0,
          copy_count: 0,
          bookmark_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      mockPrismockMethod(prismock.v_content_list_slim, 'findMany', mockItems as any);
      mockPrismockMethod(prismock.v_content_list_slim, 'count', 50);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await contentService.getContentPaginatedSlim({
        p_category: 'agents',
        p_limit: 20,
        p_offset: 0,
      });

      expect(prismock.v_content_list_slim.findMany).toHaveBeenCalledWith({
        where: { category: 'agents' },
        orderBy: [{ created_at: 'desc' }],
        take: 20,
        skip: 0,
      });
      expect(prismock.v_content_list_slim.count).toHaveBeenCalledWith({
        where: { category: 'agents' },
      });
      expect(result.pagination.total_count).toBe(50);
    });

    it('should handle empty results', async () => {
      mockPrismockMethod(prismock.v_content_list_slim, 'findMany', []);
      mockPrismockMethod(prismock.v_content_list_slim, 'count', 0);

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
      const mockItems = [
        {
          id: '1',
          slug: 'test',
          title: 'Test',
          display_title: null,
          description: null,
          author: null,
          author_profile_url: null,
          category: 'agents',
          tags: [],
          source: null,
          source_table: 'agents',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          date_added: new Date('2024-01-01'),
          view_count: 0,
          copy_count: 0,
          bookmark_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
        {
          id: '2',
          slug: 'test-2',
          title: 'Test 2',
          display_title: null,
          description: null,
          author: null,
          author_profile_url: null,
          category: 'agents',
          tags: [],
          source: null,
          source_table: 'agents',
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
          date_added: new Date('2024-01-02'),
          view_count: 0,
          copy_count: 0,
          bookmark_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      mockPrismockMethod(prismock.v_content_list_slim, 'findMany', mockItems as any);
      mockPrismockMethod(prismock.v_content_list_slim, 'count', 100);

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
      // getContentDetailCore accesses many fields including date_added.toISOString()
      // So the mock needs to include all accessed fields with proper types
      const mockContent = {
        id: '1',
        slug: 'test',
        title: 'Test',
        display_title: 'Test Display',
        seo_title: 'Test SEO',
        description: 'Test description',
        author: 'Test Author',
        author_profile_url: 'https://example.com/author',
        date_added: new Date('2024-01-01'), // Must be a Date object for .toISOString()
        tags: ['tag1', 'tag2'],
        content: 'Test content',
        source: 'test-source',
        documentation_url: 'https://example.com/docs',
        category: 'agents' as const,
        features: null,
        use_cases: null,
        examples: null,
        metadata: null,
        popularity_score: 0,
        created_at: new Date('2024-01-01'), // Must be a Date object for .toISOString()
        updated_at: new Date('2024-01-01'), // Must be a Date object for .toISOString()
      };
      
      // getContentDetailCore uses withSmartCache and prisma.content.findUnique (not RPC)
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());
      
      mockPrismockMethod(prismock.content, 'findUnique', mockContent);

      const result = await contentService.getContentDetailCore({
        p_category: 'agents',
        p_slug: 'test',
      });

      // getContentDetailCore uses prisma.content.findUnique, not $queryRawUnsafe
      // The where clause uses slug_category (not category_slug)
      expect(prismock.content.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            slug_category: {
              slug: 'test',
              category: 'agents',
            },
          },
        })
      );
      // The service returns an object with a 'content' property containing the transformed content
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveProperty('id', '1');
      expect(result.content).toHaveProperty('slug', 'test');
      expect(result.content).toHaveProperty('title', 'Test');
      expect(result.content).toHaveProperty('date_added'); // Transformed to date string (YYYY-MM-DD format)
    });
  });

  describe('getContentAnalytics', () => {
    it('should return content analytics', async () => {
      const mockData = {
        views: 100,
        copies: 50,
        bookmarks: 25,
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getContentAnalytics({
        p_category: 'agents',
        p_slug: 'test',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category, p_slug
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_content_analytics'),
        'agents', // p_category
        'test' // p_slug
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('getHomepageOptimized', () => {
    it('should return homepage optimized data', async () => {
      const mockData = {
        featured: [],
        categories: [],
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getHomepageOptimized({
        p_category_ids: ['agents'],
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category_ids
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_homepage_optimized'),
        ['agents'] // p_category_ids (array) - matches the actual call
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });
  });

  describe('generateChangelogRssFeed', () => {
    it('should return changelog RSS feed', async () => {
      const mockData = {
        feed: '<?xml version="1.0"?><rss>...</rss>',
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.generateChangelogRssFeed();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_changelog_rss_feed')
      );
      expect(result).toEqual(mockData);
    });

    it('should accept optional args', async () => {
      const mockData = { feed: '<?xml>...</xml>' };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      await contentService.generateChangelogRssFeed({ p_limit: 20 });
      expect(queryRawUnsafeSpy).toHaveBeenCalled();
    });
  });

  describe('generateChangelogAtomFeed', () => {
    it('should return changelog Atom feed', async () => {
      const mockData = {
        feed: '<?xml version="1.0"?><feed>...</feed>',
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.generateChangelogAtomFeed();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
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
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.generateContentRssFeed();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
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
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.generateContentAtomFeed();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
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
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await contentService.getWeeklyDigest();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_weekly_digest')
      );
      expect(result).toEqual(mockData);
    });

    it('should accept optional args', async () => {
      const mockData = { new_content: [], trending_content: [] };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      await contentService.getWeeklyDigest({ p_limit: 10 });
      expect(queryRawUnsafeSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should log errors with proper context', async () => {
      const { logRpcError } = await import('../utils/rpc-error-logging.ts');
      const mockError = new Error('Test error');

      queryRawUnsafeSpy.mockRejectedValue(mockError);

      await expect(contentService.getSitewideReadme()).rejects.toThrow();
      expect(logRpcError).toHaveBeenCalledWith(mockError, {
        rpcName: 'generate_readme_data',
        operation: 'getSitewideReadme', // Actual operation name passed from methodName option
        args: {},
      });
    });

    it('should propagate database connection errors', async () => {
      queryRawUnsafeSpy.mockRejectedValue(new Error('Connection refused'));

      await expect(contentService.getSitewideReadme()).rejects.toThrow('Connection refused');
    });

    it('should handle Prisma query errors for direct queries', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const mockError = new Error('Prisma query failed');
      mockPrismockMethod(prismock.category_configs, 'findMany', Promise.reject(mockError));

      await expect(contentService.getCategoryConfigs()).rejects.toThrow('Prisma query failed');
    });
  });
});
