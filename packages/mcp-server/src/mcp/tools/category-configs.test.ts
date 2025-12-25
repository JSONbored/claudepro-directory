/**
 * Tests for getCategoryConfigs Tool Handler
 *
 * Tests the tool that gets category-specific configurations and features.
 * Includes category config retrieval and config validation.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetCategoryConfigs } from './category-configs.js';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

describe('getCategoryConfigs Tool Handler', () => {
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;

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

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    queryRawUnsafeSpy = jest.fn().mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismocker models are initialized
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

  describe('Unit Tests', () => {
    it('should return all category configs when no category specified', async () => {
      const mockCategoryConfigs = [
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

      // Seed data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockCategoryConfigs);
      }

      const result = await handleGetCategoryConfigs({}, context);

      expect(result._meta.count).toBe(2);
      expect(result._meta.configs).toHaveLength(2);
      expect(result._meta.category).toBeNull();
      expect(result.content[0].text).toContain('Available Category Configurations');
      expect(result.content[0].text).toContain('2 categories configured');
    });

    it('should filter by category when category specified', async () => {
      const mockCategoryConfigs = [
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

      // Seed data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockCategoryConfigs);
      }

      const result = await handleGetCategoryConfigs({ category: 'agents' }, context);

      expect(result._meta.count).toBe(1);
      expect(result._meta.configs).toHaveLength(1);
      expect(result._meta.category).toBe('agents');
      expect(result.content[0].text).toContain('Category Configuration: agents');
      expect(result.content[0].text).toContain('AI Agents');
    });

    it('should return empty result when category not found', async () => {
      const mockCategoryConfigs = [
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

      // Seed data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockCategoryConfigs);
      }

      const result = await handleGetCategoryConfigs({ category: 'nonexistent' }, context);

      expect(result._meta.count).toBe(0);
      expect(result._meta.configs).toHaveLength(0);
      expect(result._meta.category).toBe('nonexistent');
      expect(result.content[0].text).toContain('No configuration found for this category');
    });

    it('should return empty result when no configs exist', async () => {
      // Seed empty data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', []);
      }

      const result = await handleGetCategoryConfigs({}, context);

      expect(result._meta.count).toBe(0);
      expect(result._meta.configs).toHaveLength(0);
      expect(result.content[0].text).toContain('No category configurations found');
    });

    it('should sanitize category input', async () => {
      const mockCategoryConfigs = [
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

      // Seed data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockCategoryConfigs);
      }

      // Test with potentially unsafe input
      const result = await handleGetCategoryConfigs({ category: '  agents  ' }, context);

      expect(result._meta.category).toBe('agents'); // Should be sanitized
    });

    it('should log successful completion', async () => {
      const mockCategoryConfigs = [
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

      // Seed data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockCategoryConfigs);
      }

      await handleGetCategoryConfigs({}, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'getCategoryConfigs completed successfully',
        expect.objectContaining({
          tool: 'getCategoryConfigs',
          resultCount: 1,
          duration_ms: expect.any(Number),
        })
      );
    });

    it('should log error on failure', async () => {
      // Override findMany to throw an error
      const findManyMock = jest.fn().mockRejectedValue(new Error('Database error') as any);
      (prismocker.category_configs as any).findMany = findManyMock;

      await expect(handleGetCategoryConfigs({}, context)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'getCategoryConfigs tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'getCategoryConfigs',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should work with real ContentService', async () => {
      const mockCategoryConfigs = [
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

      // Seed data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockCategoryConfigs);
      }

      const result = await handleGetCategoryConfigs({}, context);

      expect(result._meta.configs).toHaveLength(1);
      expect(result._meta.configs[0]).toMatchObject({
        category: 'agents',
        title: 'AI Agents',
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockCategoryConfigs = [
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

      // Seed data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockCategoryConfigs);
      }

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetCategoryConfigs({}, context);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call
      const result2 = await handleGetCategoryConfigs({}, context);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
