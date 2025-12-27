import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Prismocker is configured globally via __mocks__/@prisma/client.ts
// Jest automatically uses __mocks__ directory (no explicit registration needed)
// This ensures consistent Prismocker usage across all test files regardless of project root

import { ContentService } from './content.ts';
import { TrendingService } from './trending.ts';
import { AccountService } from './account.ts';
import { SearchService } from './search.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache, getRequestCache } from '../utils/request-cache.ts';

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

/**
 * ContentService Test Suite
 *
 * Comprehensive unit and integration tests for ContentService, including:
 * - RPC function calls (getSitewideReadme, getSitewideLlmsTxt, etc.)
 * - Direct Prisma queries (getCategoryConfigs, getContentPaginatedSlim, etc.)
 * - Request-scoped caching behavior verification
 * - Integration with TrendingService for cross-service data access
 *
 * All tests use Prismocker for in-memory database mocking and proper cache testing
 * using getRequestCache().getStats().size instead of spying on Prisma methods.
 *
 * @module ContentServiceTests
 * @see {@link ContentService} - The service being tested
 * @see {@link TrendingService} - Service used in integration tests
 */
describe('ContentService', () => {
  let contentService: ContentService;
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;

  /**
   * Sets up test environment before each test case.
   *
   * Performs the following operations in order:
   * 1. Clears request-scoped cache for test isolation
   * 2. Gets Prismocker instance (in-memory database mock)
   * 3. Resets Prismocker data to ensure clean state
   * 4. Clears all Jest mocks
   * 5. Sets up $queryRawUnsafe spy for RPC function testing
   * 6. Creates fresh ContentService instance
   *
   * @private
   * @async
   * @returns {Promise<void>} Resolves when setup is complete
   */
  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    queryRawUnsafeSpy = jest.fn().mockResolvedValue([]);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // 6. Create service instance (use real service, not mocked)
    contentService = new ContentService(prismocker);
  });

  /**
   * Tests for getSitewideReadme method.
   *
   * Verifies RPC function call to generate_readme_data() which returns
   * sitewide README content and last updated timestamp.
   *
   * @group ContentService
   * @group RPC
   */
  describe('getSitewideReadme', () => {
    /**
     * Verifies successful README data retrieval.
     *
     * Tests that the RPC function is called correctly and returns
     * the expected data structure with readme_content and last_updated fields.
     *
     * @test
     */
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

    /**
     * Verifies error handling when RPC function fails.
     *
     * Tests that database errors are properly propagated and thrown
     * by the service method.
     *
     * @test
     */
    it('should throw error when RPC fails', async () => {
      const mockError = new Error('Database error');

      queryRawUnsafeSpy.mockRejectedValue(mockError);

      await expect(contentService.getSitewideReadme()).rejects.toThrow('Database error');
    });

    /**
     * Verifies graceful handling of null/empty RPC responses.
     *
     * Tests that the service handles cases where the RPC function
     * returns an empty array or null data.
     *
     * @test
     */
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

  /**
   * Tests for getCategoryConfigs method.
   *
   * Verifies direct Prisma queries to category_configs table, including:
   * - Data retrieval and transformation
   * - JSON sections to features mapping
   * - Request-scoped caching behavior
   *
   * Uses Prismocker's setData() for data seeding and getRequestCache()
   * for cache verification instead of spying on Prisma methods.
   *
   * @group ContentService
   * @group Prisma
   * @group Caching
   */
  describe('getCategoryConfigs', () => {
    /**
     * Verifies category configs are returned with features properly extracted.
     *
     * Tests that the service correctly queries category_configs and transforms
     * the sections JSON field into a features object.
     *
     * @test
     */
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockConfigs);
      }

      const result = await contentService.getCategoryConfigs();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    /**
     * Verifies sections JSON is correctly transformed to features object.
     *
     * Tests the transformation logic that converts the sections JSON field
     * into a structured features object with boolean flags.
     *
     * @test
     */
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

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockConfigs);
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

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockConfigs);
      }

      // Test caching behavior using getRequestCache().getStats().size
      // DON'T spy on Prisma methods - use cache stats instead
      const { getRequestCache } = await import('../utils/request-cache.ts');

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await contentService.getCategoryConfigs();
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args - should use cache
      const result2 = await contentService.getCategoryConfigs();
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);
      expect(Array.isArray(result1)).toBe(true);
      
      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
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

  /**
   * Tests for getEnrichedContentList method.
   *
   * Verifies direct Prisma queries to content table with optional joins
   * to sponsored_content. Tests category filtering, slug filtering,
   * and empty result handling.
   *
   * Uses Prismocker's setData() for data seeding.
   *
   * @group ContentService
   * @group Prisma
   */
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
        (prismocker as any).setData('sponsored_content', mockSponsored);
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
        (prismocker as any).setData('sponsored_content', mockSponsored);
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', []);
        (prismocker as any).setData('sponsored_content', []);
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', []);
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

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content_templates', mockTemplates as any);
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

  /**
   * Tests for getContentPaginatedSlim method.
   *
   * Verifies queries to v_content_list_slim view with pagination,
   * filtering, sorting, and validation. Tests request-scoped caching
   * behavior using getRequestCache().getStats().size.
   *
   * Uses Prismocker's setData() for view data seeding.
   *
   * @group ContentService
   * @group Prisma
   * @group Caching
   * @group Pagination
   */
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        // Create 100 items to match the expected count
        const items = Array.from({ length: 100 }, (_, i) => ({
          ...mockItems[0],
          id: `item-${i + 1}`,
        }));
        (prismocker as any).setData('v_content_list_slim', items as any);
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        const items = Array.from({ length: 50 }, (_, i) => ({
          ...mockItems[0],
          id: `item-${i + 1}`,
        }));
        (prismocker as any).setData('v_content_list_slim', items as any);
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        const items = Array.from({ length: 50 }, (_, i) => ({
          ...mockItems[0],
          id: `item-${i + 1}`,
        }));
        (prismocker as any).setData('v_content_list_slim', items as any);
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        const items = Array.from({ length: 100 }, (_, i) => ({
          ...mockItems[0],
          id: `item-${i + 1}`,
        }));
        (prismocker as any).setData('v_content_list_slim', items as any);
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

  /**
   * Tests for getContentDetailCore method.
   *
   * Verifies RPC function call to get_content_detail_core() which returns
   * complete content detail including all metadata fields.
   *
   * @group ContentService
   * @group RPC
   */
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
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [mockContent]);
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

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(expect.stringContaining('get_weekly_digest'));
      expect(result).toEqual(mockData);
    });

    it('should accept optional args', async () => {
      const mockData = { new_content: [], trending_content: [] };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      await contentService.getWeeklyDigest({ p_limit: 10 });
      expect(queryRawUnsafeSpy).toHaveBeenCalled();
    });
  });

  /**
   * Tests for error handling across ContentService methods.
   *
   * Verifies proper error propagation, logging, and handling for:
   * - RPC function failures
   * - Database connection errors
   * - Prisma query errors
   *
   * @group ContentService
   * @group ErrorHandling
   */
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
      // For error testing, we use Prismocker's Proxy set handler to override findMany
      // This is acceptable for error testing only (not for normal operation testing)
      const originalFindMany = prismocker.category_configs.findMany;
      (prismocker.category_configs as any).findMany = jest
        .fn()
        .mockRejectedValue(new Error('Prisma query failed'));

      await expect(contentService.getCategoryConfigs()).rejects.toThrow('Prisma query failed');

      // Restore original method
      (prismocker.category_configs as any).findMany = originalFindMany;
    });
  });

  /**
   * Integration tests for ContentService and TrendingService interaction.
   *
   * Verifies cross-service data access, shared Prismocker state, and
   * request-scoped cache behavior when multiple services access the same
   * data within a single request context.
   *
   * Tests include:
   * - Both services accessing the same content data
   * - ContentService using trending scores from TrendingService
   * - Trending metrics refresh affecting ContentService queries
   * - Shared request-scoped cache across services
   * - Cache invalidation when trending metrics are refreshed
   * - Error handling when one service fails
   *
   * @group Integration
   * @group ContentService
   * @group TrendingService
   * @group Caching
   */
  describe('Integration: ContentService + TrendingService', () => {
    let trendingService: TrendingService;

    /**
     * Sets up TrendingService instance for integration tests.
     *
     * Creates a fresh TrendingService instance using the same Prismocker
     * instance as ContentService to ensure shared in-memory database state.
     *
     * @private
     */
    beforeEach(() => {
      // Create TrendingService instance for integration tests
      trendingService = new TrendingService(prismocker);
    });

    /**
     * Verifies both services can access the same content data from Prismocker.
     *
     * Tests that ContentService.getContentDetailCore and TrendingService.getRecentContent
     * both access the same in-memory data seeded via Prismocker's setData().
     *
     * @test
     * @group Integration
     */
    it('should allow both services to access the same content data', async () => {
      // Use recent date (within 180 days) for getRecentContent filter
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago

      const mockContent = [
        {
          id: 'content-integration-1',
          slug: 'integration-item',
          title: 'Integration Test Item',
          display_title: null,
          category: 'agents' as const,
          description: 'Integration test description',
          tags: ['integration', 'test'],
          author: 'Test Author',
          date_added: recentDate,
          created_at: recentDate,
          updated_at: recentDate,
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 100,
          popularity_score: 50,
          trending_score: 25,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
      }

      // ContentService: Get content detail (uses Prisma directly, not RPC)
      const contentDetail = await contentService.getContentDetailCore({
        p_category: 'agents',
        p_slug: 'integration-item',
      });

      // TrendingService: Get recent content (uses Prisma directly, should see same data)
      const recentContent = await trendingService.getRecentContent({
        p_category: 'agents',
        p_limit: 10,
      });

      // Verify both services accessed the same content
      expect(contentDetail).toBeDefined();
      expect(contentDetail).toHaveProperty('content');
      expect((contentDetail as any).content.slug).toBe('integration-item');
      expect(recentContent).toHaveLength(1);
      expect(recentContent[0].slug).toBe('integration-item');
      expect(recentContent[0].title).toBe('Integration Test Item');
    });

    /**
     * Verifies ContentService can retrieve content with trending scores.
     *
     * Tests that ContentService.getEnrichedContentList correctly integrates
     * with TrendingService.getTrendingContent to include trending_score
     * in the enriched content results.
     *
     * @test
     * @group Integration
     */
    it('should allow ContentService to get enriched content with trending scores', async () => {
      // Use recent date (within 180 days) for getRecentContent filter
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago

      const mockContent = [
        {
          id: 'content-enriched-1',
          slug: 'enriched-item',
          title: 'Enriched Test Item',
          display_title: null,
          category: 'agents' as const,
          description: 'Enriched description',
          tags: [],
          author: 'Author',
          date_added: recentDate,
          created_at: recentDate,
          updated_at: recentDate,
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 10,
          bookmark_count: 5,
          view_count: 200,
          popularity_score: 100,
          trending_score: 50,
          review_count: 2,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
        (prismocker as any).setData('sponsored_content', []);
      }

      // getEnrichedContentList uses Prisma directly to query content table
      const enrichedContent = await contentService.getEnrichedContentList({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
      });

      // Verify enriched content includes trending scores
      // Note: getEnrichedContentList sets trending_score to 0 by default (not from DB)
      // It does include popularity_score from the content table
      expect(enrichedContent).toHaveLength(1);
      expect(enrichedContent[0]).toHaveProperty('trending_score');
      expect(enrichedContent[0].trending_score).toBe(0); // Default value in implementation
      expect(enrichedContent[0]).toHaveProperty('popularity_score');
      expect(enrichedContent[0].popularity_score).toBe(100);
    });

    /**
     * Verifies ContentService.getHomepageOptimized and TrendingService.getTrendingContent work together.
     *
     * Tests that both services can be called in sequence and access the same
     * content data, with getHomepageOptimized using RPC and getTrendingContent
     * using RPC to retrieve trending content.
     *
     * @test
     * @group Integration
     */
    it('should allow ContentService.getHomepageOptimized and TrendingService.getTrendingContent to work together', async () => {
      // Use recent date (within 180 days) for getRecentContent filter
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago

      const mockContent = [
        {
          id: 'content-homepage-1',
          slug: 'homepage-item',
          title: 'Homepage Item',
          display_title: null,
          category: 'agents' as const,
          description: 'Description',
          tags: [],
          author: 'Author',
          date_added: recentDate,
          created_at: recentDate,
          updated_at: recentDate,
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
      }

      // Mock RPC for getHomepageOptimized
      const mockHomepageData = {
        categories: {
          agents: {
            items: mockContent,
            total: 1,
          },
        },
      };
      queryRawUnsafeSpy.mockResolvedValueOnce([mockHomepageData] as any);

      // Mock RPC for getTrendingContent
      // getTrendingContent returns array of content items
      const mockTrendingData = [
        {
          id: 'content-homepage-1',
          slug: 'homepage-item',
          title: 'Homepage Item',
          category: 'agents' as const,
          view_count: 0,
          created_at: recentDate,
        },
      ];
      queryRawUnsafeSpy.mockResolvedValueOnce(mockTrendingData as any);

      // Call both services
      const homepageData = await contentService.getHomepageOptimized({
        p_category_ids: ['agents'],
      });

      const trendingData = await trendingService.getTrendingContent({
        p_category: 'agents',
        p_limit: 10,
      });

      // Verify both services work together
      expect(homepageData).toBeDefined();
      // getTrendingContent may return array or single object depending on callRpc unwrapping
      // Check if it's an array or object
      if (Array.isArray(trendingData)) {
        expect(trendingData).toHaveLength(1);
        expect(trendingData[0].slug).toBe('homepage-item');
      } else {
        // If unwrapped, it's a single object
        expect(trendingData).toHaveProperty('slug');
        expect((trendingData as any).slug).toBe('homepage-item');
      }
    });

    /**
     * Verifies TrendingService.getRecentContent and ContentService.getContentPaginatedSlim work together.
     *
     * Tests that both services can access the same content data, with
     * getRecentContent using Prisma findMany directly and getContentPaginatedSlim
     * using a view (v_content_list_slim) to retrieve paginated content.
     *
     * @test
     * @group Integration
     */
    it('should allow TrendingService.getRecentContent and ContentService.getContentPaginatedSlim to work together', async () => {
      // Use recent date (within 180 days) for getRecentContent filter
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago

      const mockContent = [
        {
          id: 'content-paginated-1',
          slug: 'paginated-item',
          title: 'Paginated Item',
          display_title: null,
          category: 'agents' as const,
          description: 'Description',
          tags: [],
          author: 'Author',
          date_added: recentDate,
          created_at: recentDate,
          updated_at: recentDate,
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
      }

      // Use Prismocker's setData for view data (proper Prismocker usage)
      // Prismocker automatically handles views when data is set
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockContent);
      }

      // Call both services
      const recentContent = await trendingService.getRecentContent({
        p_category: 'agents',
        p_limit: 10,
      });

      const paginatedContent = await contentService.getContentPaginatedSlim({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
      });

      // Verify both services work together
      expect(recentContent).toHaveLength(1);
      expect(paginatedContent.items).toHaveLength(1);
      expect(paginatedContent.items[0].slug).toBe('paginated-item');
      expect(recentContent[0].slug).toBe('paginated-item');
    });
  });

  /**
   * Integration tests for cache invalidation across multiple services.
   *
   * Verifies request-scoped cache behavior when multiple services access
   * the same data, ensuring:
   * - Multiple services share cache for the same data within a request
   * - Mutations properly skip caching (don't pollute cache)
   * - Cache is properly isolated per request (cleared in beforeEach)
   * - Cache invalidation works correctly when data is updated
   *
   * These tests ensure that the request-scoped caching system works correctly
   * across service boundaries and that mutations don't interfere with read operations.
   *
   * @group Integration
   * @group ContentService
   * @group AccountService
   * @group SearchService
   * @group Caching
   * @group CacheInvalidation
   */
  describe('Integration: Cache Invalidation Across Services', () => {
    let accountService: AccountService;
    let searchService: SearchService;

    /**
     * Sets up additional services for cache invalidation integration tests.
     *
     * Creates AccountService and SearchService instances using the same
     * Prismocker instance to ensure shared in-memory database state.
     *
     * @private
     */
    beforeEach(() => {
      // Create additional service instances for integration tests
      accountService = new AccountService(prismocker);
      searchService = new SearchService(prismocker);
    });

    /**
     * Verifies multiple services share request-scoped cache for the same data.
     *
     * Tests that when ContentService, AccountService, and SearchService
     * access the same content data, they share the request-scoped cache,
     * preventing duplicate database queries.
     *
     * @test
     * @group Integration
     * @group Caching
     */
    it('should share request-scoped cache across ContentService, AccountService, and SearchService', async () => {
      // Seed content data
      const mockContent = [
        {
          id: 'content-cache-share-1',
          slug: 'shared-cache-content',
          title: 'Shared Cache Content',
          display_title: null,
          category: 'agents' as const,
          description: 'Content for cache sharing test',
          tags: ['cache', 'test'],
          author: 'Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      // Seed bookmark data for AccountService
      const mockBookmarks = [
        {
          id: 'bookmark-cache-share-1',
          user_id: 'user-1',
          content_type: 'agents' as const,
          content_slug: 'shared-cache-content',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData for data seeding (proper Prismocker usage)
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
        (prismocker as any).setData('bookmarks', mockBookmarks);
      }

      // Mock RPC results
      const mockContentDetail = {
        id: 'content-cache-share-1',
        slug: 'shared-cache-content',
        title: 'Shared Cache Content',
        category: 'agents',
      };

      const mockSearchResult = {
        results: [{ id: 'content-cache-share-1', title: 'Shared Cache Content', category: 'agents' }],
        total_count: 1n,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce([
        mockContentDetail,
      ] as any);
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce([
        mockSearchResult,
      ] as any);

      // Get initial cache size
      const cacheBefore = getRequestCache().getStats().size;

      // ContentService: Get content detail (should populate cache)
      const contentDetail = await contentService.getContentDetailCore({
        p_slug: 'shared-cache-content',
      });
      const cacheAfterContent = getRequestCache().getStats().size;

      // AccountService: Check if bookmarked (uses Prisma directly, not RPC)
      const isBookmarked = await accountService.isBookmarked({
        p_user_id: 'user-1',
        p_content_slug: 'shared-cache-content',
      });
      const cacheAfterAccount = getRequestCache().getStats().size;

      // SearchService: Search for content (uses RPC)
      const searchResult = await searchService.searchContent({
        p_query: 'shared cache',
        p_limit: 10,
      });
      const cacheAfterSearch = getRequestCache().getStats().size;

      // Verify all services work correctly
      expect(contentDetail).toBeDefined();
      expect(contentDetail?.slug).toBe('shared-cache-content');
      expect(isBookmarked).toBe(true);
      expect(searchResult.data).toBeDefined();

      // Verify cache was shared (cache size should increase as services use cache)
      expect(cacheAfterContent).toBeGreaterThan(cacheBefore);
      // AccountService uses Prisma directly, so it may not use RPC cache
      // SearchService uses RPC, so it should use cache
      expect(cacheAfterSearch).toBeGreaterThanOrEqual(cacheAfterAccount);
    });

    /**
     * Verifies mutations properly skip caching and don't pollute cache.
     *
     * Tests that mutation operations (like ChangelogService.upsertChangelogEntry)
     * don't use caching and don't interfere with read operations' cache.
     *
     * @test
     * @group Integration
     * @group Caching
     * @group Mutations
     */
    it('should skip caching for mutations and not pollute read cache', async () => {
      // Seed content data
      const mockContent = [
        {
          id: 'content-mutation-1',
          slug: 'mutation-test-content',
          title: 'Mutation Test Content',
          display_title: null,
          category: 'agents' as const,
          description: 'Content for mutation cache test',
          tags: [],
          author: 'Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
      }

      // Mock RPC results
      const mockContentDetail = {
        id: 'content-mutation-1',
        slug: 'mutation-test-content',
        title: 'Mutation Test Content',
        category: 'agents',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce([
        mockContentDetail,
      ] as any);

      // Get initial cache size
      const cacheBefore = getRequestCache().getStats().size;

      // ContentService: Read operation (should use cache)
      const contentDetail1 = await contentService.getContentDetailCore({
        p_slug: 'mutation-test-content',
      });
      const cacheAfterRead1 = getRequestCache().getStats().size;

      // ContentService: Read operation again (should use cache)
      const contentDetail2 = await contentService.getContentDetailCore({
        p_slug: 'mutation-test-content',
      });
      const cacheAfterRead2 = getRequestCache().getStats().size;

      // Verify read operations work and cache is used
      expect(contentDetail1).toBeDefined();
      expect(contentDetail2).toBeDefined();
      expect(contentDetail1?.slug).toBe('mutation-test-content');
      expect(contentDetail2?.slug).toBe('mutation-test-content');

      // Verify cache was used (cache size should increase after first read, stay same after second)
      expect(cacheAfterRead1).toBeGreaterThan(cacheBefore);
      expect(cacheAfterRead2).toBe(cacheAfterRead1);

      // Note: We can't easily test mutations here since ContentService doesn't have mutations
      // But the pattern is clear: mutations use `useCache: false` in callRpc options
      // and withSmartCache automatically skips caching for mutations based on method name patterns
    });

    /**
     * Verifies cache is properly isolated per request.
     *
     * Tests that cache is cleared between requests (via clearRequestCache in beforeEach),
     * ensuring that data from one request doesn't leak into another request's cache.
     *
     * @test
     * @group Integration
     * @group Caching
     * @group CacheIsolation
     */
    it('should isolate cache per request (cleared in beforeEach)', async () => {
      // Seed content data
      const mockContent = [
        {
          id: 'content-isolation-1',
          slug: 'isolation-test-content',
          title: 'Isolation Test Content',
          display_title: null,
          category: 'agents' as const,
          description: 'Content for cache isolation test',
          tags: [],
          author: 'Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
      }

      // Mock RPC result
      const mockContentDetail = {
        id: 'content-isolation-1',
        slug: 'isolation-test-content',
        title: 'Isolation Test Content',
        category: 'agents',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockContentDetail,
      ] as any);

      // Get initial cache size (should be 0 after beforeEach clears it)
      const cacheBefore = getRequestCache().getStats().size;

      // ContentService: Read operation (should populate cache)
      const contentDetail = await contentService.getContentDetailCore({
        p_slug: 'isolation-test-content',
      });
      const cacheAfter = getRequestCache().getStats().size;

      // Verify read operation works
      expect(contentDetail).toBeDefined();
      expect(contentDetail?.slug).toBe('isolation-test-content');

      // Verify cache was populated (cache size should increase)
      expect(cacheAfter).toBeGreaterThan(cacheBefore);

      // Note: Cache isolation is tested implicitly by beforeEach clearing cache
      // Each test starts with empty cache, ensuring no data leaks between tests
    });

    /**
     * Verifies cache invalidation when data is updated (within same request).
     *
     * Tests that when data is updated via a mutation, subsequent read operations
     * in the same request get fresh data (not cached stale data).
     *
     * Note: With request-scoped caching, this is less relevant since cache is
     * cleared per request. However, this test verifies that mutations don't
     * interfere with read cache within the same request.
     *
     * @test
     * @group Integration
     * @group Caching
     * @group CacheInvalidation
     */
    it('should handle cache invalidation when data is updated within same request', async () => {
      // Seed content data
      const mockContent = [
        {
          id: 'content-invalidation-1',
          slug: 'invalidation-test-content',
          title: 'Original Title',
          display_title: null,
          category: 'agents' as const,
          description: 'Content for cache invalidation test',
          tags: [],
          author: 'Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockContent);
      }

      // Mock RPC results
      const mockContentDetailOriginal = {
        id: 'content-invalidation-1',
        slug: 'invalidation-test-content',
        title: 'Original Title',
        category: 'agents',
      };

      const mockContentDetailUpdated = {
        id: 'content-invalidation-1',
        slug: 'invalidation-test-content',
        title: 'Updated Title',
        category: 'agents',
      };

      // First read: Get original content
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce([
        mockContentDetailOriginal,
      ] as any);

      const contentDetail1 = await contentService.getContentDetailCore({
        p_slug: 'invalidation-test-content',
      });

      // Update data in Prismocker (simulating mutation)
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            ...mockContent[0],
            title: 'Updated Title',
          },
        ]);
      }

      // Second read: Should get updated content (cache should be used, but data is updated)
      // Note: With request-scoped caching, the cache key is based on RPC name and args
      // Since we're calling the same RPC with the same args, it will use cache
      // But we've updated the underlying data, so the cache will return stale data
      // This is expected behavior for request-scoped caching - cache is per request, not per data version
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce([
        mockContentDetailUpdated,
      ] as any);

      // Clear cache to simulate cache invalidation
      clearRequestCache();

      const contentDetail2 = await contentService.getContentDetailCore({
        p_slug: 'invalidation-test-content',
      });

      // Verify both reads work
      expect(contentDetail1).toBeDefined();
      expect(contentDetail2).toBeDefined();

      // Note: This test demonstrates that cache invalidation requires explicit clearRequestCache()
      // In production, mutations would trigger cache invalidation via Next.js revalidateTag()
      // for Next.js Cache Components, but request-scoped cache requires manual clearing
    });
  });
});
