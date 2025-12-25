/**
 * Tests for getContentByTag Tool Handler
 *
 * Tests the tool that gets content filtered by specific tags with AND/OR logic support.
 * Includes tag retrieval, tag-based filtering, AND/OR logic, and cache testing.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetContentByTag } from './tags.js';
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

describe('getContentByTag Tool Handler', () => {
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
      user: createMockUser() as any,
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
    };
  });

  describe('Unit Tests', () => {
    it('should return content matching tags with OR logic', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'content-1',
          title: 'Content 1',
          display_title: null,
          category: 'agents',
          description: 'Description 1',
          tags: ['ai', 'automation'],
          author: 'Author 1',
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
        {
          id: '2',
          slug: 'content-2',
          title: 'Content 2',
          display_title: null,
          category: 'mcp',
          description: 'Description 2',
          tags: ['ai', 'tools'],
          author: 'Author 2',
          date_added: '2024-01-02',
          created_at: new Date('2024-01-02T00:00:00Z'),
          updated_at: new Date('2024-01-02T00:00:00Z'),
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

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 2,
      });

      const result = await handleGetContentByTag(
        {
          tags: ['ai'],
          logic: 'OR',
          limit: 10,
        },
        context
      );

      expect(result._meta.count).toBe(2);
      expect(result._meta.items).toHaveLength(2);
      expect(result._meta.tags).toEqual(['ai']);
      expect(result._meta.logic).toBe('OR');
      expect(result.content[0]?.text).toContain('Content with ANY of tags');
      expect(result.content[0]?.text).toContain('Content 1');
      expect(result.content[0]?.text).toContain('Content 2');
    });

    it('should filter by AND logic (require all tags)', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'content-1',
          title: 'Content 1',
          display_title: null,
          category: 'agents',
          description: 'Description 1',
          tags: ['ai', 'automation', 'tools'],
          author: 'Author 1',
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
        {
          id: '2',
          slug: 'content-2',
          title: 'Content 2',
          display_title: null,
          category: 'mcp',
          description: 'Description 2',
          tags: ['ai', 'tools'], // Missing 'automation'
          author: 'Author 2',
          date_added: '2024-01-02',
          created_at: new Date('2024-01-02T00:00:00Z'),
          updated_at: new Date('2024-01-02T00:00:00Z'),
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

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 2,
      });

      const result = await handleGetContentByTag(
        {
          tags: ['ai', 'automation', 'tools'],
          logic: 'AND',
          limit: 10,
        },
        context
      );

      // Only content-1 has all three tags
      expect(result._meta.count).toBe(1);
      expect(result._meta.items[0]?.slug).toBe('content-1');
      expect(result._meta.items[0]?.matchingTags).toEqual(['ai', 'automation', 'tools']);
      expect(result.content[0]?.text).toContain('Content with ALL of tags');
    });

    it('should return empty result when AND logic finds no matches', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'content-1',
          title: 'Content 1',
          display_title: null,
          category: 'agents',
          description: 'Description 1',
          tags: ['ai'], // Only has one tag
          author: 'Author 1',
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 1,
      });

      const result = await handleGetContentByTag(
        {
          tags: ['ai', 'automation', 'tools'],
          logic: 'AND',
          limit: 10,
        },
        context
      );

      expect(result._meta.count).toBe(0);
      expect(result._meta.items).toHaveLength(0);
      expect(result.content[0]?.text).toContain('No content found with ALL tags');
    });

    it('should filter by category when provided', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'content-1',
          title: 'Content 1',
          display_title: null,
          category: 'agents',
          description: 'Description 1',
          tags: ['ai'],
          author: 'Author 1',
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 1,
      });

      const result = await handleGetContentByTag(
        {
          tags: ['ai'],
          logic: 'OR',
          category: 'agents',
          limit: 10,
        },
        context
      );

      expect(result._meta.category).toBe('agents');
      expect(result.content[0]?.text).toContain('in agents');
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_content_paginated'),
        expect.objectContaining({
          p_category: 'agents',
          p_tags: ['ai'],
        })
      );
    });

    it('should respect limit parameter', async () => {
      const mockItems = Array.from({ length: 5 }, (_, i) => ({
        id: String(i + 1),
        slug: `content-${i + 1}`,
        title: `Content ${i + 1}`,
        display_title: null,
        category: 'agents',
        description: `Description ${i + 1}`,
        tags: ['ai'],
        author: `Author ${i + 1}`,
        date_added: '2024-01-01',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        source: null,
        source_table: 'agents',
        author_profile_url: null,
        copy_count: 0,
        popularity_score: 0,
        trending_score: 0,
        sponsored_content_id: null,
        sponsorship_tier: null,
        is_sponsored: false,
      }));

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 5,
      });

      const result = await handleGetContentByTag(
        {
          tags: ['ai'],
          logic: 'OR',
          limit: 3,
        },
        context
      );

      expect(result._meta.limit).toBe(3);
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          p_limit: 3,
        })
      );
    });

    it('should return empty result when no content found', async () => {
      queryRawUnsafeSpy.mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await handleGetContentByTag(
        {
          tags: ['nonexistent'],
          logic: 'OR',
          limit: 10,
        },
        context
      );

      expect(result._meta.count).toBe(0);
      expect(result._meta.items).toHaveLength(0);
      expect(result.content[0]?.text).toContain('No content found with tags');
    });

    it('should include matching tags in metadata', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'content-1',
          title: 'Content 1',
          display_title: null,
          category: 'agents',
          description: 'Description 1',
          tags: ['ai', 'automation', 'tools'],
          author: 'Author 1',
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 1,
      });

      const result = await handleGetContentByTag(
        {
          tags: ['ai', 'automation'],
          logic: 'OR',
          limit: 10,
        },
        context
      );

      expect(result._meta.items[0]?.matchingTags).toEqual(['ai', 'automation']);
      expect(result._meta.items[0]?.tags).toEqual(['ai', 'automation', 'tools']);
    });

    it('should truncate description to 150 characters', async () => {
      const longDescription = 'A'.repeat(200);
      const mockItems = [
        {
          id: '1',
          slug: 'content-1',
          title: 'Content 1',
          display_title: null,
          category: 'agents',
          description: longDescription,
          tags: ['ai'],
          author: 'Author 1',
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 1,
      });

      const result = await handleGetContentByTag(
        {
          tags: ['ai'],
          logic: 'OR',
          limit: 10,
        },
        context
      );

      expect(result._meta.items[0]?.description.length).toBe(150);
      expect(result.content[0]?.text).toContain('...');
    });

    it('should log successful completion', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'content-1',
          title: 'Content 1',
          display_title: null,
          category: 'agents',
          description: 'Description 1',
          tags: ['ai'],
          author: 'Author 1',
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 1,
      });

      await handleGetContentByTag(
        {
          tags: ['ai'],
          logic: 'OR',
          limit: 10,
        },
        context
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'getContentByTag completed successfully',
        expect.objectContaining({
          tool: 'getContentByTag',
          tags: ['ai'],
          logic: 'OR',
          resultCount: 1,
          duration_ms: expect.any(Number),
        })
      );
    });

    it('should log error on failure', async () => {
      queryRawUnsafeSpy.mockRejectedValue(new Error('Database error'));

      await expect(
        handleGetContentByTag(
          {
            tags: ['ai'],
            logic: 'OR',
            limit: 10,
          },
          context
        )
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'getContentByTag tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'getContentByTag',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should work with real ContentService', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'content-1',
          title: 'Content 1',
          display_title: null,
          category: 'agents',
          description: 'Description 1',
          tags: ['ai', 'automation'],
          author: 'Author 1',
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 1,
      });

      const result = await handleGetContentByTag(
        {
          tags: ['ai'],
          logic: 'OR',
          category: 'agents',
          limit: 10,
        },
        context
      );

      expect(result._meta.items).toHaveLength(1);
      expect(result._meta.items[0]?.slug).toBe('content-1');
      expect(result._meta.items[0]?.category).toBe('agents');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockItems = [
        {
          id: '1',
          slug: 'content-1',
          title: 'Content 1',
          display_title: null,
          category: 'agents',
          description: 'Description 1',
          tags: ['ai'],
          author: 'Author 1',
          date_added: '2024-01-01',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue({
        items: mockItems,
        total: 1,
      });

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetContentByTag(
        {
          tags: ['ai'],
          logic: 'OR',
          limit: 10,
        },
        context
      );
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call
      const result2 = await handleGetContentByTag(
        {
          tags: ['ai'],
          logic: 'OR',
          limit: 10,
        },
        context
      );
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
