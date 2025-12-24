import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Prismocker is configured globally via __mocks__/@prisma/client.ts
// Jest automatically uses __mocks__ directory (no explicit registration needed)
// This ensures consistent Prismocker usage across all test files regardless of project root

import { ContentService } from './content.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '../utils/request-cache.ts';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockerClient

// DON'T mock request cache - use real implementation
// Cache is cleared in beforeEach for test isolation
// This allows us to:
// 1. Test business logic with fresh cache (each test starts with empty cache)
// 2. Test caching behavior by verifying cache stats and duplicate calls

// Mock the RPC error logging utility
jest.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

describe('ContentService', () => {
  let contentService: ContentService;
  let prismaMock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismaMock = prisma;

    // Reset Prismocker data before each test (must be before clearAllMocks)
    if ('reset' in prismaMock && typeof prismaMock.reset === 'function') {
      prismaMock.reset();
    }

    // Clear all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Clear request cache for test isolation (each test starts with empty cache)
    clearRequestCache();

    // Prismocker supports $queryRawUnsafe as a stub (returns empty array by default)
    // Create a fresh spy for each test AFTER clearing mocks to ensure proper isolation
    // Use mockImplementation instead of mockResolvedValue for explicit control
    // Each test will override this with mockImplementation for its specific data
    queryRawUnsafeSpy = jest.fn().mockImplementation(async () => []);
    (prismaMock as any).$queryRawUnsafe = queryRawUnsafeSpy;

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
          plural_title: null,
          description: null,
          icon_name: null,
          color_scheme: null,
          keywords: null,
          meta_description: null,
          primary_action_type: null,
          primary_action_label: null,
          primary_action_config: null,
          search_placeholder: null,
          empty_state_message: null,
          url_slug: null,
          content_loader: null,
          display_config: null,
          config_format: null,
          validation_config: null,
          generation_config: null,
          schema_name: null,
          api_schema: null,
          metadata_fields: null,
          badges: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data (proper Prismocker usage)
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('category_configs', mockConfigs);
      }

      const result = await contentService.getCategoryConfigs();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
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
          plural_title: null,
          description: null,
          icon_name: null,
          color_scheme: null,
          keywords: null,
          meta_description: null,
          primary_action_type: null,
          primary_action_label: null,
          primary_action_config: null,
          search_placeholder: null,
          empty_state_message: null,
          url_slug: null,
          content_loader: null,
          config_format: null,
          validation_config: null,
          generation_config: null,
          schema_name: null,
          api_schema: null,
          metadata_fields: null,
          badges: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('category_configs', mockConfigs);
      }

      const result = await contentService.getCategoryConfigs();

      expect(result[0]).toHaveProperty('features');
      expect(result[0].features).toHaveProperty('section_features', true);
      expect(result[0].features).toHaveProperty('section_installation', false);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockConfigs = [
        {
          category: 'agents',
          title: 'Agents',
          sections: { features: true },
          show_on_homepage: true,
          plural_title: null,
          description: null,
          icon_name: null,
          color_scheme: null,
          keywords: null,
          meta_description: null,
          primary_action_type: null,
          primary_action_label: null,
          primary_action_config: null,
          search_placeholder: null,
          empty_state_message: null,
          url_slug: null,
          content_loader: null,
          display_config: null,
          config_format: null,
          validation_config: null,
          generation_config: null,
          schema_name: null,
          api_schema: null,
          metadata_fields: null,
          badges: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('category_configs', mockConfigs);
      }

      // DON'T mock withSmartCache - use real implementation to test caching
      // Clear cache before test
      const { clearRequestCache } = await import('../utils/request-cache.ts');
      clearRequestCache();

      // Spy on findMany to verify it's only called once (second call should hit cache)
      const findManySpy = jest.spyOn(prismaMock.category_configs, 'findMany');

      // First call - should hit database
      const result1 = await contentService.getCategoryConfigs();
      expect(findManySpy).toHaveBeenCalledTimes(1);

      // Second call with same args - should hit cache (no database call)
      const result2 = await contentService.getCategoryConfigs();
      expect(findManySpy).toHaveBeenCalledTimes(1); // Still only called once (cached)

      expect(result1).toEqual(result2);
      expect(Array.isArray(result1)).toBe(true);

      findManySpy.mockRestore();
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
        created_at: Date;
        updated_at: Date;
      }> = []; // No sponsored content for this test

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('content', mockContent);
        (prismaMock as any).setData('sponsored_content', mockSponsored);
      }


      const result = await contentService.getEnrichedContentList({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
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
        created_at: Date;
        updated_at: Date;
      }> = [];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('content', mockContent);
        (prismaMock as any).setData('sponsored_content', mockSponsored);
      }



      const result = await contentService.getEnrichedContentList({
        p_slugs: ['test-1', 'test-2'],
        p_limit: 10,
        p_offset: 0,
      });

      // Verify result structure (Prismocker handles the query internally)
      expect(Array.isArray(result)).toBe(true);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('test-1');
      expect(result[0].is_sponsored).toBe(false);
    });

    it('should handle empty results', async () => {
      // Use Prismocker's setData to seed empty test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('content', []);
        (prismaMock as any).setData('sponsored_content', []);
      }



      const result = await contentService.getEnrichedContentList({
        p_category: 'agents',
      });

      expect(result).toEqual([]);
      // Prismocker methods can't be spied on directly, so we just verify the result
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

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('content_templates', mockTemplates as any);
      }


      const result = await contentService.getContentTemplates({
        p_category: 'agents',
      });

      expect(result).toHaveProperty('templates');
      expect(result.templates?.[0]).toHaveProperty('type', 'agents');
      expect(result.templates?.[0]).toHaveProperty('category', 'agents');
    });

    it('should return null templates when none found', async () => {
      // Use Prismocker's setData to seed empty test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('content_templates', []);
      }



      const result = await contentService.getContentTemplates({
        p_category: 'nonexistent',
      });

      expect(result.templates).toBeNull();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          category: 'agents',
          name: 'Test Template',
          description: 'Test',
          template_data: { category: 'agents', tags: 'test' },
          active: true,
          display_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('content_templates', mockTemplates as any);
      }

      // Test caching behavior with real implementation
      // Cache is already cleared in beforeEach, so we start fresh
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await contentService.getContentTemplates({
        p_category: 'agents',
      });
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await contentService.getContentTemplates({
        p_category: 'agents',
      });
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1.templates?.[0]).toHaveProperty('type', 'agents');
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

      // Use Prismocker's setData to seed test data
      // Prismocker's count() automatically works based on data length
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        // Create 100 items to match the expected count
        const items = Array.from({ length: 100 }, (_, i) => ({
          ...mockItems[0],
          id: `item-${i + 1}`,
        }));
        (prismaMock as any).setData('v_content_list_slim', items as any);
      }


      const result = await contentService.getContentPaginatedSlim({});

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.total_count).toBe(100);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
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

      // Create 50 items to match the expected count
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        const items = Array.from({ length: 50 }, (_, i) => ({
          ...mockItems[0],
          id: `item-${i + 1}`,
        }));
        (prismaMock as any).setData('v_content_list_slim', items as any);
      }

      // Test caching behavior with real implementation
      // Cache is already cleared in beforeEach, so we start fresh
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await contentService.getContentPaginatedSlim({
        p_category: 'agents',
        p_limit: 20,
        p_offset: 0,
      });
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database calls)
      const result2 = await contentService.getContentPaginatedSlim({
        p_category: 'agents',
        p_limit: 20,
        p_offset: 0,
      });
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1.pagination.total_count).toBe(50);
    });

    it('should validate limit range', async () => {

      await expect(contentService.getContentPaginatedSlim({ p_limit: 0 })).rejects.toThrow(
        'Invalid limit'
      );

      await expect(contentService.getContentPaginatedSlim({ p_limit: 101 })).rejects.toThrow(
        'Invalid limit'
      );
    });

    it('should validate offset', async () => {

      await expect(contentService.getContentPaginatedSlim({ p_offset: -1 })).rejects.toThrow(
        'Invalid offset'
      );
    });

    it('should validate order_by', async () => {

      await expect(
        contentService.getContentPaginatedSlim({
          p_order_by: 'invalid',
        })
      ).rejects.toThrow('Invalid order_by');
    });

    it('should validate order_direction', async () => {

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

      // Use Prismocker's setData to seed test data
      // Create 50 items to match the expected count
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        const items = Array.from({ length: 50 }, (_, i) => ({
          ...mockItems[0],
          id: `item-${i + 1}`,
        }));
        (prismaMock as any).setData('v_content_list_slim', items as any);
      }


      const result = await contentService.getContentPaginatedSlim({
        p_category: 'agents',
        p_limit: 20,
        p_offset: 0,
      });

      expect(result.pagination.total_count).toBe(50);
    });

    it('should handle empty results', async () => {
      // Use Prismocker's setData to seed empty test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('v_content_list_slim', []);
      }



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

      // Use Prismocker's setData to seed test data
      // Create 100 items to match the expected count
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        const items = Array.from({ length: 100 }, (_, i) => ({
          ...mockItems[0],
          id: `item-${i + 1}`,
        }));
        (prismaMock as any).setData('v_content_list_slim', items as any);
      }



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
      // Use Prismocker's setData to seed test data
      // findUnique requires the record to exist in the store
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('content', [mockContent]);
      }


      const result = await contentService.getContentDetailCore({
        p_category: 'agents',
        p_slug: 'test',
      });

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
      // For error testing, we need to mock the method to throw
      // Prismocker doesn't support throwing errors from setData, so we spy and mock
      const findManySpy = jest.spyOn(prismaMock.category_configs, 'findMany');
      findManySpy.mockRejectedValue(new Error('Prisma query failed'));

      await expect(contentService.getCategoryConfigs()).rejects.toThrow('Prisma query failed');

      findManySpy.mockRestore();
    });
  });
});
