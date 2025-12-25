/**
 * Tests for Tool Registration
 *
 * Tests that all tools are properly registered with correct schemas and handlers.
 * This is a registration verification test.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { registerAllTools } from './index.js';
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
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('Tool Registration', () => {
  let prismocker: PrismaClient;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;
  let mcpServer: McpServer;
  let registerToolSpy: jest.SpiedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    prismocker = prisma;
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    mockLogger = createMockLogger();
    mockEnv = createMockEnv();
    context = {
      prisma: prismocker,
      user: createMockUser() as any,
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
    };

    // Create a mock MCP server
    mcpServer = {
      registerTool: jest.fn(),
    } as any;
    registerToolSpy = jest.spyOn(mcpServer, 'registerTool');
  });

  describe('Tool Registration Verification', () => {
    it('should register all 20 tools', () => {
      registerAllTools(mcpServer, context);

      // Verify registerTool was called 20 times (one for each tool)
      expect(registerToolSpy).toHaveBeenCalledTimes(20);
    });

    it('should register listCategories tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const listCategoriesCall = calls.find((call) => call[0]?.name === 'listCategories');

      expect(listCategoriesCall).toBeDefined();
      expect(listCategoriesCall?.[0]?.name).toBe('listCategories');
      expect(listCategoriesCall?.[0]?.description).toBeDefined();
      expect(typeof listCategoriesCall?.[0]?.inputSchema).toBe('object');
      expect(typeof listCategoriesCall?.[0]?.handler).toBe('function');
    });

    it('should register searchContent tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const searchContentCall = calls.find((call) => call[0]?.name === 'searchContent');

      expect(searchContentCall).toBeDefined();
      expect(searchContentCall?.[0]?.name).toBe('searchContent');
      expect(typeof searchContentCall?.[0]?.handler).toBe('function');
    });

    it('should register getContentDetail tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getContentDetailCall = calls.find((call) => call[0]?.name === 'getContentDetail');

      expect(getContentDetailCall).toBeDefined();
      expect(getContentDetailCall?.[0]?.name).toBe('getContentDetail');
      expect(typeof getContentDetailCall?.[0]?.handler).toBe('function');
    });

    it('should register getTrending tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getTrendingCall = calls.find((call) => call[0]?.name === 'getTrending');

      expect(getTrendingCall).toBeDefined();
      expect(getTrendingCall?.[0]?.name).toBe('getTrending');
      expect(typeof getTrendingCall?.[0]?.handler).toBe('function');
    });

    it('should register getFeatured tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getFeaturedCall = calls.find((call) => call[0]?.name === 'getFeatured');

      expect(getFeaturedCall).toBeDefined();
      expect(getFeaturedCall?.[0]?.name).toBe('getFeatured');
      expect(typeof getFeaturedCall?.[0]?.handler).toBe('function');
    });

    it('should register getPopular tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getPopularCall = calls.find((call) => call[0]?.name === 'getPopular');

      expect(getPopularCall).toBeDefined();
      expect(getPopularCall?.[0]?.name).toBe('getPopular');
      expect(typeof getPopularCall?.[0]?.handler).toBe('function');
    });

    it('should register getRecent tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getRecentCall = calls.find((call) => call[0]?.name === 'getRecent');

      expect(getRecentCall).toBeDefined();
      expect(getRecentCall?.[0]?.name).toBe('getRecent');
      expect(typeof getRecentCall?.[0]?.handler).toBe('function');
    });

    it('should register getTemplates tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getTemplatesCall = calls.find((call) => call[0]?.name === 'getTemplates');

      expect(getTemplatesCall).toBeDefined();
      expect(getTemplatesCall?.[0]?.name).toBe('getTemplates');
      expect(typeof getTemplatesCall?.[0]?.handler).toBe('function');
    });

    it('should register getCategoryConfigs tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getCategoryConfigsCall = calls.find((call) => call[0]?.name === 'getCategoryConfigs');

      expect(getCategoryConfigsCall).toBeDefined();
      expect(getCategoryConfigsCall?.[0]?.name).toBe('getCategoryConfigs');
      expect(typeof getCategoryConfigsCall?.[0]?.handler).toBe('function');
    });

    it('should register getChangelog tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getChangelogCall = calls.find((call) => call[0]?.name === 'getChangelog');

      expect(getChangelogCall).toBeDefined();
      expect(getChangelogCall?.[0]?.name).toBe('getChangelog');
      expect(typeof getChangelogCall?.[0]?.handler).toBe('function');
    });

    it('should register getSearchFacets tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getSearchFacetsCall = calls.find((call) => call[0]?.name === 'getSearchFacets');

      expect(getSearchFacetsCall).toBeDefined();
      expect(getSearchFacetsCall?.[0]?.name).toBe('getSearchFacets');
      expect(typeof getSearchFacetsCall?.[0]?.handler).toBe('function');
    });

    it('should register getSearchSuggestions tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getSearchSuggestionsCall = calls.find(
        (call) => call[0]?.name === 'getSearchSuggestions'
      );

      expect(getSearchSuggestionsCall).toBeDefined();
      expect(getSearchSuggestionsCall?.[0]?.name).toBe('getSearchSuggestions');
      expect(typeof getSearchSuggestionsCall?.[0]?.handler).toBe('function');
    });

    it('should register getMcpServers tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getMcpServersCall = calls.find((call) => call[0]?.name === 'getMcpServers');

      expect(getMcpServersCall).toBeDefined();
      expect(getMcpServersCall?.[0]?.name).toBe('getMcpServers');
      expect(typeof getMcpServersCall?.[0]?.handler).toBe('function');
    });

    it('should register getRelatedContent tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getRelatedContentCall = calls.find((call) => call[0]?.name === 'getRelatedContent');

      expect(getRelatedContentCall).toBeDefined();
      expect(getRelatedContentCall?.[0]?.name).toBe('getRelatedContent');
      expect(typeof getRelatedContentCall?.[0]?.handler).toBe('function');
    });

    it('should register getContentByTag tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getContentByTagCall = calls.find((call) => call[0]?.name === 'getContentByTag');

      expect(getContentByTagCall).toBeDefined();
      expect(getContentByTagCall?.[0]?.name).toBe('getContentByTag');
      expect(typeof getContentByTagCall?.[0]?.handler).toBe('function');
    });

    it('should register downloadContentForPlatform tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const downloadContentForPlatformCall = calls.find(
        (call) => call[0]?.name === 'downloadContentForPlatform'
      );

      expect(downloadContentForPlatformCall).toBeDefined();
      expect(downloadContentForPlatformCall?.[0]?.name).toBe('downloadContentForPlatform');
      expect(typeof downloadContentForPlatformCall?.[0]?.handler).toBe('function');
    });

    it('should register getSocialProofStats tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const getSocialProofStatsCall = calls.find((call) => call[0]?.name === 'getSocialProofStats');

      expect(getSocialProofStatsCall).toBeDefined();
      expect(getSocialProofStatsCall?.[0]?.name).toBe('getSocialProofStats');
      expect(typeof getSocialProofStatsCall?.[0]?.handler).toBe('function');
    });

    it('should register submitContent tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const submitContentCall = calls.find((call) => call[0]?.name === 'submitContent');

      expect(submitContentCall).toBeDefined();
      expect(submitContentCall?.[0]?.name).toBe('submitContent');
      expect(typeof submitContentCall?.[0]?.handler).toBe('function');
    });

    it('should register createAccount tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const createAccountCall = calls.find((call) => call[0]?.name === 'createAccount');

      expect(createAccountCall).toBeDefined();
      expect(createAccountCall?.[0]?.name).toBe('createAccount');
      expect(typeof createAccountCall?.[0]?.handler).toBe('function');
    });

    it('should register subscribeNewsletter tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const subscribeNewsletterCall = calls.find((call) => call[0]?.name === 'subscribeNewsletter');

      expect(subscribeNewsletterCall).toBeDefined();
      expect(subscribeNewsletterCall?.[0]?.name).toBe('subscribeNewsletter');
      expect(typeof subscribeNewsletterCall?.[0]?.handler).toBe('function');
    });

    it('should register downloadSkillPackage tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const downloadSkillPackageCall = calls.find(
        (call) => call[0]?.name === 'downloadSkillPackage'
      );

      expect(downloadSkillPackageCall).toBeDefined();
      expect(downloadSkillPackageCall?.[0]?.name).toBe('downloadSkillPackage');
      expect(typeof downloadSkillPackageCall?.[0]?.handler).toBe('function');
    });

    it('should register downloadMcpServerPackage tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const downloadMcpServerPackageCall = calls.find(
        (call) => call[0]?.name === 'downloadMcpServerPackage'
      );

      expect(downloadMcpServerPackageCall).toBeDefined();
      expect(downloadMcpServerPackageCall?.[0]?.name).toBe('downloadMcpServerPackage');
      expect(typeof downloadMcpServerPackageCall?.[0]?.handler).toBe('function');
    });

    it('should register downloadStorageFile tool', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;
      const downloadStorageFileCall = calls.find((call) => call[0]?.name === 'downloadStorageFile');

      expect(downloadStorageFileCall).toBeDefined();
      expect(downloadStorageFileCall?.[0]?.name).toBe('downloadStorageFile');
      expect(typeof downloadStorageFileCall?.[0]?.handler).toBe('function');
    });

    it('should register tools with correct schemas', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;

      // Verify all tools have inputSchema
      for (const call of calls) {
        expect(call[0]?.inputSchema).toBeDefined();
        expect(typeof call[0]?.inputSchema).toBe('object');
      }
    });

    it('should register tools with callable handlers', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;

      // Verify all tools have callable handlers
      for (const call of calls) {
        expect(call[0]?.handler).toBeDefined();
        expect(typeof call[0]?.handler).toBe('function');
      }
    });
  });
});
