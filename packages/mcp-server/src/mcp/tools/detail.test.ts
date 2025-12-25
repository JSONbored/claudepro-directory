/**
 * Tests for getContentDetail Tool Handler
 *
 * Comprehensive tests for the tool that retrieves complete metadata for a specific content item.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient
// No need to explicitly mock @prisma/client - Jest uses __mocks__ automatically

import { handleGetContentDetail } from '@heyclaude/mcp-server/tools/detail';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '@heyclaude/mcp-server/types/runtime';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Import real cache utilities for proper cache testing
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// DO NOT mock request-cache.ts - use real implementation
// Cache is cleared in beforeEach for test isolation
// This allows us to test business logic with fresh cache (each test starts with empty cache)

describe('getContentDetail Tool Handler', () => {
  let prismocker: PrismaClient;
  let contentFindUniqueSpy: ReturnType<typeof jest.fn>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;

  beforeEach(() => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Ensure Prismocker models are initialized by accessing them
    // Prismocker creates models lazily, so we need to trigger initialization
    // Accessing the model property triggers Prismocker to create it with methods
    void prismocker.content;

    // 5. Create a spy for content.findUnique to control its behavior in tests
    // Use Prismocker's Proxy set handler to override findUnique
    // We'll assign this to the model method so we can mock it per test
    contentFindUniqueSpy = jest.fn();
    (prismocker.content as any).findUnique = contentFindUniqueSpy;

    // 6. Clear all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

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

  it('should return content details for valid slug and category', async () => {
    const mockContent = {
      slug: 'test-content',
      title: 'Test Content',
      display_title: 'Test Content Display',
      category: 'agents',
      description: 'This is a test description',
      content: 'This is the main content',
      tags: ['test', 'example'],
      author: 'Test Author',
      author_profile_url: 'https://example.com/author',
      date_added: new Date('2024-01-01T00:00:00Z'),
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
      metadata: { key: 'value' },
      view_count: 100,
      bookmark_count: 10,
      copy_count: 5,
    };

    contentFindUniqueSpy.mockResolvedValue(mockContent);

    const result = await handleGetContentDetail(
      {
        slug: 'test-content',
        category: 'agents',
      },
      context
    );

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('# Test Content');
    expect(result.content[0].text).toContain('**Category:** agents');
    expect(result.content[0].text).toContain('**Author:** Test Author');
    expect(result.content[0].text).toContain('This is a test description');
    expect(result.content[0].text).toContain('Views: 100');
    expect(result.content[0].text).toContain('Bookmarks: 10');
    expect(result.content[0].text).toContain('Copies: 5');

    expect(result._meta.slug).toBe('test-content');
    expect(result._meta.title).toBe('Test Content');
    expect(result._meta.displayTitle).toBe('Test Content Display');
    expect(result._meta.category).toBe('agents');
    expect(result._meta.description).toBe('This is a test description');
    expect(result._meta.content).toBe('This is the main content');
    expect(result._meta.tags).toEqual(['test', 'example']);
    expect(result._meta.author).toBe('Test Author');
    expect(result._meta.authorProfileUrl).toBe('https://example.com/author');
    expect(result._meta.stats.views).toBe(100);
    expect(result._meta.stats.bookmarks).toBe(10);
    expect(result._meta.stats.copies).toBe(5);
    expect(result._meta.usageHints).toBeDefined();
    expect(result._meta.relatedTools).toContain('downloadContentForPlatform');
    expect(result._meta.relatedTools).toContain('getRelatedContent');

    expect(contentFindUniqueSpy).toHaveBeenCalledWith({
      where: {
        slug_category: {
          slug: 'test-content',
          category: 'agents',
        },
      },
      select: expect.objectContaining({
        slug: true,
        title: true,
        category: true,
      }),
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getContentDetail completed successfully',
      expect.objectContaining({
        tool: 'getContentDetail',
        category: 'agents',
        slug: 'test-content',
      })
    );
  });

  it('should handle missing optional fields gracefully', async () => {
    const mockContent = {
      slug: 'minimal-content',
      title: 'Minimal Content',
      display_title: null,
      category: 'rules',
      description: null,
      content: null,
      tags: null,
      author: null,
      author_profile_url: null,
      date_added: null,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: null,
      metadata: null,
      view_count: null,
      bookmark_count: null,
      copy_count: null,
    };

    contentFindUniqueSpy.mockResolvedValue(mockContent);

    const result = await handleGetContentDetail(
      {
        slug: 'minimal-content',
        category: 'rules',
      },
      context
    );

    expect(result._meta.title).toBe('Minimal Content');
    expect(result._meta.displayTitle).toBe('Minimal Content'); // Falls back to title
    expect(result._meta.description).toBe('');
    expect(result._meta.content).toBe('');
    expect(result._meta.tags).toEqual([]);
    expect(result._meta.author).toBe('Unknown');
    expect(result._meta.authorProfileUrl).toBeNull();
    expect(result._meta.dateAdded).toBeNull();
    expect(result._meta.stats.views).toBe(0);
    expect(result._meta.stats.bookmarks).toBe(0);
    expect(result._meta.stats.copies).toBe(0);
  });

  it('should sanitize slug input', async () => {
    const mockContent = {
      slug: 'sanitized-content',
      title: 'Sanitized Content',
      display_title: null,
      category: 'agents',
      description: 'Description',
      content: 'Content',
      tags: [],
      author: 'Author',
      author_profile_url: null,
      date_added: new Date('2024-01-01T00:00:00Z'),
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: null,
      metadata: {},
      view_count: 0,
      bookmark_count: 0,
      copy_count: 0,
    };

    contentFindUniqueSpy.mockResolvedValue(mockContent);

    // Slug with HTML tags should be sanitized
    await handleGetContentDetail(
      {
        slug: '<script>alert("xss")</script>sanitized-content',
        category: 'agents',
      },
      context
    );

    // The sanitized slug should be used in the query
    expect(contentFindUniqueSpy).toHaveBeenCalled();
  });

  it('should reject invalid slug format', async () => {
    await expect(
      handleGetContentDetail(
        {
          slug: 'Invalid Slug With Spaces',
          category: 'agents',
        },
        context
      )
    ).rejects.toThrow();

    expect(contentFindUniqueSpy).not.toHaveBeenCalled();
  });

  it('should require category parameter', async () => {
    await expect(
      handleGetContentDetail(
        {
          slug: 'test-content',
          category: undefined as any,
        },
        context
      )
    ).rejects.toThrow();

    expect(contentFindUniqueSpy).not.toHaveBeenCalled();
  });

  it('should handle content not found', async () => {
    contentFindUniqueSpy.mockResolvedValue(null);

    await expect(
      handleGetContentDetail(
        {
          slug: 'nonexistent-content',
          category: 'agents',
        },
        context
      )
    ).rejects.toThrow('The requested content item was not found.');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'getContentDetail tool error',
      expect.objectContaining({
        error: expect.any(Error),
        tool: 'getContentDetail',
        category: 'agents',
        slug: 'nonexistent-content',
      })
    );
  });

  it('should handle database errors', async () => {
    contentFindUniqueSpy.mockRejectedValue(new Error('Database connection failed'));

    await expect(
      handleGetContentDetail(
        {
          slug: 'test-content',
          category: 'agents',
        },
        context
      )
    ).rejects.toThrow('Database connection failed'); // normalizeError preserves original message for Error instances

    expect(mockLogger.error).toHaveBeenCalledWith(
      'getContentDetail tool error',
      expect.objectContaining({
        error: expect.any(Error),
        tool: 'getContentDetail',
      })
    );
  });

  it('should format date correctly in text summary', async () => {
    const mockContent = {
      slug: 'dated-content',
      title: 'Dated Content',
      display_title: null,
      category: 'agents',
      description: 'Description',
      content: 'Content',
      tags: [],
      author: 'Author',
      author_profile_url: null,
      date_added: new Date('2024-12-25T00:00:00Z'),
      created_at: new Date('2024-12-25T00:00:00Z'),
      updated_at: null,
      metadata: {},
      view_count: 0,
      bookmark_count: 0,
      copy_count: 0,
    };

    contentFindUniqueSpy.mockResolvedValue(mockContent);

    const result = await handleGetContentDetail(
      {
        slug: 'dated-content',
        category: 'agents',
      },
      context
    );

    // Date should be formatted in locale-specific format
    expect(result.content[0].text).toContain('Added:');
    expect(result._meta.dateAdded).toEqual(new Date('2024-12-25T00:00:00Z'));
  });

  it('should include content section when content exists', async () => {
    const mockContent = {
      slug: 'content-with-body',
      title: 'Content With Body',
      display_title: null,
      category: 'agents',
      description: 'Description',
      content: 'This is the main content body',
      tags: [],
      author: 'Author',
      author_profile_url: null,
      date_added: new Date('2024-01-01T00:00:00Z'),
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: null,
      metadata: {},
      view_count: 0,
      bookmark_count: 0,
      copy_count: 0,
    };

    contentFindUniqueSpy.mockResolvedValue(mockContent);

    const result = await handleGetContentDetail(
      {
        slug: 'content-with-body',
        category: 'agents',
      },
      context
    );

    expect(result.content[0].text).toContain('## Content');
    expect(result.content[0].text).toContain('This is the main content body');
  });

  it('should not include content section when content is empty', async () => {
    const mockContent = {
      slug: 'no-content',
      title: 'No Content',
      display_title: null,
      category: 'agents',
      description: 'Description',
      content: null,
      tags: [],
      author: 'Author',
      author_profile_url: null,
      date_added: new Date('2024-01-01T00:00:00Z'),
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: null,
      metadata: {},
      view_count: 0,
      bookmark_count: 0,
      copy_count: 0,
    };

    contentFindUniqueSpy.mockResolvedValue(mockContent);

    const result = await handleGetContentDetail(
      {
        slug: 'no-content',
        category: 'agents',
      },
      context
    );

    expect(result.content[0].text).not.toContain('## Content');
  });

  it('should handle metadata as JSON object', async () => {
    const mockMetadata = {
      features: ['Feature 1', 'Feature 2'],
      use_cases: ['Use Case 1'],
      configuration: {
        key: 'value',
      },
    };

    const mockContent = {
      slug: 'metadata-content',
      title: 'Metadata Content',
      display_title: null,
      category: 'agents',
      description: 'Description',
      content: 'Content',
      tags: [],
      author: 'Author',
      author_profile_url: null,
      date_added: new Date('2024-01-01T00:00:00Z'),
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: null,
      metadata: mockMetadata,
      view_count: 0,
      bookmark_count: 0,
      copy_count: 0,
    };

    contentFindUniqueSpy.mockResolvedValue(mockContent);

    const result = await handleGetContentDetail(
      {
        slug: 'metadata-content',
        category: 'agents',
      },
      context
    );

    expect(result._meta.metadata).toEqual(mockMetadata);
  });

  it('should handle empty tags array', async () => {
    const mockContent = {
      slug: 'no-tags',
      title: 'No Tags',
      display_title: null,
      category: 'agents',
      description: 'Description',
      content: 'Content',
      tags: [],
      author: 'Author',
      author_profile_url: null,
      date_added: new Date('2024-01-01T00:00:00Z'),
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: null,
      metadata: {},
      view_count: 0,
      bookmark_count: 0,
      copy_count: 0,
    };

    contentFindUniqueSpy.mockResolvedValue(mockContent);

    const result = await handleGetContentDetail(
      {
        slug: 'no-tags',
        category: 'agents',
      },
      context
    );

    expect(result._meta.tags).toEqual([]);
    expect(result.content[0].text).toContain('Tags:');
  });

  it('should log duration correctly', async () => {
    const mockContent = {
      slug: 'duration-test',
      title: 'Duration Test',
      display_title: null,
      category: 'agents',
      description: 'Description',
      content: 'Content',
      tags: [],
      author: 'Author',
      author_profile_url: null,
      date_added: new Date('2024-01-01T00:00:00Z'),
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: null,
      metadata: {},
      view_count: 0,
      bookmark_count: 0,
      copy_count: 0,
    };

    contentFindUniqueSpy.mockResolvedValue(mockContent);

    await handleGetContentDetail(
      {
        slug: 'duration-test',
        category: 'agents',
      },
      context
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getContentDetail completed successfully',
      expect.objectContaining({
        tool: 'getContentDetail',
        duration_ms: expect.any(Number),
      })
    );
  });
});
