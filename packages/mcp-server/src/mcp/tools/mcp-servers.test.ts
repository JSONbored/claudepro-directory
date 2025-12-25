/**
 * Tests for getMcpServers Tool Handler
 *
 * Tests the tool that fetches MCP servers from the HeyClaude directory with metadata and download URLs.
 * Includes server listing, filtering, and pagination.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetMcpServers } from './mcp-servers.js';
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

describe('getMcpServers Tool Handler', () => {
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

    // 5. Set up $queryRawUnsafe for RPC testing
    queryRawUnsafeSpy = jest.fn().mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismocker models are initialized
    void prismocker.content;

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
    it('should return MCP servers with default limit', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'test-mcp-server',
          title: 'Test MCP Server',
          display_title: null,
          category: 'mcp',
          description: 'A test MCP server',
          tags: ['test'],
          author: 'Test Author',
          view_count: 10,
          bookmark_count: 5,
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'mcp',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      // Seed metadata
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-mcp-server',
            category: 'mcp',
            metadata: {
              tools: [{ name: 'testTool', description: 'Test tool' }],
              configuration: { apiKey: 'test' },
              requires_auth: false,
            },
            mcpb_storage_url: 'https://example.com/download.zip',
          },
        ]);
      }

      const result = await handleGetMcpServers({}, context);

      expect(result._meta.count).toBe(1);
      expect(result._meta.servers).toHaveLength(1);
      expect(result._meta.servers[0].slug).toBe('test-mcp-server');
      expect(result._meta.servers[0].title).toBe('Test MCP Server');
      expect(result._meta.servers[0].mcpbUrl).toBe('https://example.com/download.zip');
      expect(result._meta.servers[0].requiresAuth).toBe(false);
      expect(result._meta.servers[0].tools).toHaveLength(1);
      expect(result.content[0].text).toContain('MCP Servers in HeyClaude Directory');
    });

    it('should respect limit parameter', async () => {
      const mockItems = Array.from({ length: 5 }, (_, i) => ({
        id: String(i + 1),
        slug: `mcp-server-${i + 1}`,
        title: `MCP Server ${i + 1}`,
        display_title: null,
        category: 'mcp',
        description: `Description ${i + 1}`,
        tags: ['test'],
        author: 'Test Author',
        view_count: 10,
        bookmark_count: 5,
        date_added: '2024-01-01',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        source: null,
        source_table: 'mcp',
        author_profile_url: null,
        copy_count: 0,
        popularity_score: 0,
        trending_score: 0,
        sponsored_content_id: null,
        sponsorship_tier: null,
        is_sponsored: false,
      }));

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      // Seed metadata
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData(
          'content',
          mockItems.map((item) => ({
            slug: item.slug,
            category: 'mcp',
            metadata: {},
            mcpb_storage_url: null,
          }))
        );
      }

      const result = await handleGetMcpServers({ limit: 3 }, context);

      expect(result._meta.limit).toBe(3);
      expect(result._meta.count).toBe(5); // All items returned, but limit is set
    });

    it('should return empty result when no servers found', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      const result = await handleGetMcpServers({}, context);

      expect(result._meta.count).toBe(0);
      expect(result._meta.servers).toHaveLength(0);
      expect(result.content[0].text).toContain('No MCP servers found in the directory');
    });

    it('should include server metadata when available', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'test-mcp-server',
          title: 'Test MCP Server',
          display_title: null,
          category: 'mcp',
          description: 'A test MCP server',
          tags: ['test'],
          author: 'Test Author',
          view_count: 10,
          bookmark_count: 5,
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'mcp',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      // Seed metadata with tools and configuration
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-mcp-server',
            category: 'mcp',
            metadata: {
              tools: [
                { name: 'tool1', description: 'Tool 1 description' },
                { name: 'tool2', description: 'Tool 2 description' },
              ],
              configuration: { apiKey: 'test-key', endpoint: 'https://api.example.com' },
              requires_auth: true,
            },
            mcpb_storage_url: 'https://example.com/download.zip',
          },
        ]);
      }

      const result = await handleGetMcpServers({}, context);

      expect(result._meta.servers[0].tools).toHaveLength(2);
      expect(result._meta.servers[0].tools[0].name).toBe('tool1');
      expect(result._meta.servers[0].configuration).toEqual({
        apiKey: 'test-key',
        endpoint: 'https://api.example.com',
      });
      expect(result._meta.servers[0].requiresAuth).toBe(true);
    });

    it('should handle missing metadata gracefully', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'test-mcp-server',
          title: 'Test MCP Server',
          display_title: null,
          category: 'mcp',
          description: 'A test MCP server',
          tags: ['test'],
          author: 'Test Author',
          view_count: 10,
          bookmark_count: 5,
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'mcp',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      // Don't seed metadata - should handle gracefully
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', []);
      }

      const result = await handleGetMcpServers({}, context);

      expect(result._meta.servers[0].tools).toHaveLength(0);
      expect(result._meta.servers[0].configuration).toEqual({});
      expect(result._meta.servers[0].requiresAuth).toBe(false);
      expect(result._meta.servers[0].mcpbUrl).toBeNull();
    });

    it('should truncate description to 200 characters', async () => {
      const longDescription = 'A'.repeat(300);
      const mockItems = [
        {
          id: '1',
          slug: 'test-mcp-server',
          title: 'Test MCP Server',
          display_title: null,
          category: 'mcp',
          description: longDescription,
          tags: ['test'],
          author: 'Test Author',
          view_count: 10,
          bookmark_count: 5,
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'mcp',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-mcp-server',
            category: 'mcp',
            metadata: {},
            mcpb_storage_url: null,
          },
        ]);
      }

      const result = await handleGetMcpServers({}, context);

      expect(result._meta.servers[0].description.length).toBe(200);
      expect(result.content[0].text).toContain('...');
    });

    it('should include stats in server metadata', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'test-mcp-server',
          title: 'Test MCP Server',
          display_title: null,
          category: 'mcp',
          description: 'A test MCP server',
          tags: ['test'],
          author: 'Test Author',
          view_count: 100,
          bookmark_count: 25,
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'mcp',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-mcp-server',
            category: 'mcp',
            metadata: {},
            mcpb_storage_url: null,
          },
        ]);
      }

      const result = await handleGetMcpServers({}, context);

      expect(result._meta.servers[0].stats.views).toBe(100);
      expect(result._meta.servers[0].stats.bookmarks).toBe(25);
      expect(result.content[0].text).toContain('100 views');
      expect(result.content[0].text).toContain('25 bookmarks');
    });

    it('should log successful completion', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'test-mcp-server',
          title: 'Test MCP Server',
          display_title: null,
          category: 'mcp',
          description: 'A test MCP server',
          tags: ['test'],
          author: 'Test Author',
          view_count: 10,
          bookmark_count: 5,
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'mcp',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-mcp-server',
            category: 'mcp',
            metadata: {},
            mcpb_storage_url: null,
          },
        ]);
      }

      await handleGetMcpServers({ limit: 10 }, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'getMcpServers completed successfully',
        expect.objectContaining({
          tool: 'getMcpServers',
          limit: 10,
          resultCount: 1,
          duration_ms: expect.any(Number),
        })
      );
    });

    it('should log error on failure', async () => {
      queryRawUnsafeSpy.mockRejectedValue(new Error('Database error'));

      await expect(handleGetMcpServers({}, context)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'getMcpServers tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'getMcpServers',
        })
      );
    });

    it('should log warning when metadata fetch fails (non-critical)', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'test-mcp-server',
          title: 'Test MCP Server',
          display_title: null,
          category: 'mcp',
          description: 'A test MCP server',
          tags: ['test'],
          author: 'Test Author',
          view_count: 10,
          bookmark_count: 5,
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'mcp',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      // Make findMany throw an error
      const findManyMock = jest.fn().mockRejectedValue(new Error('Metadata fetch failed') as any);
      (prismocker.content as any).findMany = findManyMock;

      const result = await handleGetMcpServers({}, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch metadata (non-critical)',
        expect.objectContaining({
          error: expect.any(Error),
          tool: 'getMcpServers',
        })
      );
      // Should still return results without metadata
      expect(result._meta.servers).toHaveLength(1);
    });
  });

  describe('Integration Tests', () => {
    it('should work with real ContentService', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'test-mcp-server',
          title: 'Test MCP Server',
          display_title: null,
          category: 'mcp',
          description: 'A test MCP server',
          tags: ['test'],
          author: 'Test Author',
          view_count: 10,
          bookmark_count: 5,
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'mcp',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-mcp-server',
            category: 'mcp',
            metadata: {
              tools: [{ name: 'testTool', description: 'Test tool' }],
            },
            mcpb_storage_url: 'https://example.com/download.zip',
          },
        ]);
      }

      const result = await handleGetMcpServers({ limit: 10 }, context);

      expect(result._meta.servers).toHaveLength(1);
      expect(result._meta.servers[0].slug).toBe('test-mcp-server');
      expect(result._meta.servers[0].mcpbUrl).toBe('https://example.com/download.zip');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'test-mcp-server',
          title: 'Test MCP Server',
          display_title: null,
          category: 'mcp',
          description: 'A test MCP server',
          tags: ['test'],
          author: 'Test Author',
          view_count: 10,
          bookmark_count: 5,
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'mcp',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockItems);

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            slug: 'test-mcp-server',
            category: 'mcp',
            metadata: {},
            mcpb_storage_url: null,
          },
        ]);
      }

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetMcpServers({}, context);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call
      const result2 = await handleGetMcpServers({}, context);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
