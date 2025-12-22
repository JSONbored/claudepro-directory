/**
 * Tests for listCategories Tool Handler
 *
 * Tests the tool that lists all content categories with counts and descriptions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @prisma/client to use PrismockerClient from __mocks__/@prisma/client.ts
// This must be called before any imports that use PrismaClient
// Vitest will hoist this call to the top of the file
vi.mock('@prisma/client');

import { handleListCategories } from '../../../../../packages/mcp-server/src/mcp/tools/categories.js';
import { createMockLogger, createMockEnv, createMockUser, createMockToken, createMockKvCache } from '../../fixtures/test-utils.js';
import type { ToolContext } from '../../../../../packages/mcp-server/src/types/runtime.js';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock request cache to completely bypass caching
// Services import using relative paths (../utils/request-cache.ts), so we need to mock the actual file path
// Use vi.hoisted to ensure the mock function is available in the mock factory
const { mockWithSmartCache, mockClearRequestCache } = vi.hoisted(() => {
  const clearFn = vi.fn(() => {
    try {
      const actual = require('../../../../../packages/data-layer/src/utils/request-cache.ts');
      if (actual.clearRequestCache) {
        actual.clearRequestCache();
      }
    } catch {
      // Ignore if module not available
    }
  });
  return {
    mockWithSmartCache: vi.fn((_rpcName: string, _methodName: string, rpcCall: () => Promise<unknown>) => {
      // Always call the RPC directly, never cache
      return rpcCall();
    }),
    mockClearRequestCache: clearFn,
  };
});

// Mock the actual file path that services import from (relative path from service files)
vi.mock('../../../../../packages/data-layer/src/utils/request-cache.ts', () => ({
  withSmartCache: mockWithSmartCache,
  withRequestCache: vi.fn((_rpcName: string, rpcCall: () => Promise<unknown>) => rpcCall()),
  clearRequestCache: mockClearRequestCache,
  getRequestCache: vi.fn(() => ({
    get: vi.fn(() => null),
    set: vi.fn(),
    clear: vi.fn(),
  })),
}));

describe('listCategories Tool Handler', () => {
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;

  /**
   * Helper to safely mock Prismocker model methods
   */
  function mockPrismockerMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismocker model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = vi.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test (must be before clearAllMocks)
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks to ensure clean state
    mockClearRequestCache(); // Clear request cache
    vi.clearAllMocks();
    vi.resetAllMocks();
    mockWithSmartCache.mockClear();

    // Prismocker doesn't support $queryRawUnsafe, so we add it as a mock function
    // Create a fresh spy for each test AFTER clearing mocks to ensure proper isolation
    queryRawUnsafeSpy = vi.fn().mockImplementation(async () => []);
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
    const findManyMock = vi.fn().mockRejectedValue(new Error('Config fetch failed'));
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

