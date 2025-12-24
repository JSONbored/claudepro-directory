/**
 * Tests for listCategories Tool Handler
 *
 * Tests the tool that lists all content categories with counts and descriptions.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient
// No need to explicitly mock @prisma/client - Jest uses __mocks__ automatically

import { handleListCategories } from '@heyclaude/mcp-server/tools/categories';
import { createMockLogger, createMockEnv, createMockUser, createMockToken, createMockKvCache } from '../../fixtures/test-utils.js';
import type { ToolContext } from '@heyclaude/mcp-server/types/runtime';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// DO NOT mock request-cache.ts - use real implementation
// Cache is cleared in beforeEach for test isolation
// This allows us to test business logic with fresh cache (each test starts with empty cache)

describe('listCategories Tool Handler', () => {
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;

  /**
   * Helper to safely mock Prismocker model methods
   * Note: Use Prismocker's Proxy set handler for method overriding
   */
  function mockPrismockerMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof jest.fn> {
    if (!model) {
      throw new Error(`Prismocker model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = jest.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  beforeEach(() => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Prismocker doesn't support $queryRawUnsafe, so we add it as a mock function
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    // Create a fresh spy for each test AFTER clearing mocks to ensure proper isolation
    queryRawUnsafeSpy = jest.fn().mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismocker models are initialized by accessing them
    void prismocker.category_configs;

    mockLogger = createMockLogger();
    mockEnv = createMockEnv();
    context = {
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
    };
  });

  it('should return categories with counts', async () => {
    const mockCategoryConfigsFromDb = [
      {
        category: 'agents' as const,
        title: 'AI Agents',
        description: 'AI agent configurations',
        icon_name: 'robot',
        plural_title: null,
        keywords: null,
        meta_description: null,
        search_placeholder: null,
        empty_state_message: null,
        url_slug: null,
        content_loader: null,
        config_format: null,
        primary_action_type: null,
        primary_action_label: null,
        primary_action_config: null,
        validation_config: null,
        generation_config: null,
        schema_name: null,
        api_schema: null,
        metadata_fields: null,
        badges: null,
        sections: null,
        show_on_homepage: true,
        color_scheme: null,
        display_config: null,
      },
      {
        category: 'rules' as const,
        title: 'Rules',
        description: 'Coding rules',
        icon_name: 'file-code',
        plural_title: null,
        keywords: null,
        meta_description: null,
        search_placeholder: null,
        empty_state_message: null,
        url_slug: null,
        content_loader: null,
        config_format: null,
        primary_action_type: null,
        primary_action_label: null,
        primary_action_config: null,
        validation_config: null,
        generation_config: null,
        schema_name: null,
        api_schema: null,
        metadata_fields: null,
        badges: null,
        sections: null,
        show_on_homepage: true,
        color_scheme: null,
        display_config: null,
      },
    ];

    // get_search_facets returns an array of facet objects
    // callRpc unwraps single-element arrays, so we need to return an array with multiple elements
    // or return an array where the element is itself an array (which won't be unwrapped)
    const mockFacetsArray = [
      { category: 'agents', content_count: 10 },
      { category: 'rules', content_count: 5 },
    ];

    // Mock Prisma methods - getCategoryConfigs uses findMany, getSearchFacets uses $queryRawUnsafe
    mockPrismockerMethod(prismocker.category_configs, 'findMany', mockCategoryConfigsFromDb);
    queryRawUnsafeSpy.mockResolvedValue(mockFacetsArray);

    const result = await handleListCategories({}, context);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('HeyClaude Directory Categories:');
    expect(result.content[0].text).toContain('AI Agents (agents): 10 items');
    expect(result.content[0].text).toContain('Rules (rules): 5 items');
    expect(result._meta.categories).toHaveLength(2);
    expect(result._meta.categories[0]).toEqual({
      name: 'AI Agents',
      slug: 'agents',
      description: 'AI agent configurations',
      count: 10,
      icon: 'robot',
    });
    expect(result._meta.total).toBe(2);
    expect(result._meta.usageHints).toContain('Use searchContent to find items within a category');
    expect(mockLogger.info).toHaveBeenCalledWith(
      'listCategories completed successfully',
      expect.objectContaining({
        tool: 'listCategories',
        categoryCount: 2,
      })
    );
  });

  it('should return categories with zero counts when facets fail', async () => {
    const mockCategoryConfigsFromDb = [
      {
        category: 'agents' as const,
        title: 'AI Agents',
        description: 'AI agent configurations',
        icon_name: 'robot',
        plural_title: null,
        keywords: null,
        meta_description: null,
        search_placeholder: null,
        empty_state_message: null,
        url_slug: null,
        content_loader: null,
        config_format: null,
        primary_action_type: null,
        primary_action_label: null,
        primary_action_config: null,
        validation_config: null,
        generation_config: null,
        schema_name: null,
        api_schema: null,
        metadata_fields: null,
        badges: null,
        sections: null,
        show_on_homepage: true,
        color_scheme: null,
        display_config: null,
      },
    ];

    // Mock Prisma methods - facets will fail
    mockPrismockerMethod(prismocker.category_configs, 'findMany', mockCategoryConfigsFromDb);
    queryRawUnsafeSpy.mockRejectedValue(new Error('Facets failed'));

    const result = await handleListCategories({}, context);

    expect(result._meta.categories[0].count).toBe(0);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'SearchService.getSearchFacets failed in listCategories (non-critical)',
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it('should throw error when category configs fail', async () => {
    // Mock Prisma methods - category configs will fail
    // Use Prismocker's Proxy set handler to override findMany
    const findManyMock = jest.fn().mockRejectedValue(new Error('Config fetch failed'));
    prismocker.category_configs.findMany = findManyMock;
    queryRawUnsafeSpy.mockResolvedValue([]);

    await expect(handleListCategories({}, context)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'ContentService.getCategoryConfigs failed in listCategories',
      expect.any(Error)
    );
  });

  it('should throw error when no category data returned', async () => {
    // Mock Prisma methods - return empty array
    mockPrismockerMethod(prismocker.category_configs, 'findMany', []);
    queryRawUnsafeSpy.mockResolvedValue([]);

    await expect(handleListCategories({}, context)).rejects.toThrow('No category data returned');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'listCategories tool error',
      expect.any(Error),
      expect.objectContaining({ tool: 'listCategories' })
    );
  });

  it('should handle facets with null values', async () => {
    const mockCategoryConfigsFromDb = [
      {
        category: 'agents' as const,
        title: 'AI Agents',
        description: 'AI agent configurations',
        icon_name: 'robot',
        plural_title: null,
        keywords: null,
        meta_description: null,
        search_placeholder: null,
        empty_state_message: null,
        url_slug: null,
        content_loader: null,
        config_format: null,
        primary_action_type: null,
        primary_action_label: null,
        primary_action_config: null,
        validation_config: null,
        generation_config: null,
        schema_name: null,
        api_schema: null,
        metadata_fields: null,
        badges: null,
        sections: null,
        show_on_homepage: true,
        color_scheme: null,
        display_config: null,
      },
    ];

    const mockFacetsArray = [
      { category: null, content_count: null },
      { category: 'agents', content_count: 10 },
    ];

    // Mock Prisma methods
    mockPrismockerMethod(prismocker.category_configs, 'findMany', mockCategoryConfigsFromDb);
    queryRawUnsafeSpy.mockResolvedValue(mockFacetsArray);

    const result = await handleListCategories({}, context);

    expect(result._meta.categories[0].count).toBe(10);
  });
});

