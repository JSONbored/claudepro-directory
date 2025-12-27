/**
 * Full-Stack Integration Tests
 *
 * Tests complete end-to-end flows: data function → service → database.
 * Demonstrates the full stack working together across multiple data functions.
 *
 * @group Integration
 * @group FullStack
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';
import { getHomepageData } from './content/homepage';
import { getContentDetailComplete } from './content/detail';
import { getPaginatedContent } from './content/paginated';
import { getCompaniesList } from './companies';
import { getFilteredJobs } from './jobs';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock RPC error logging utility
jest.mock('@heyclaude/data-layer/utils/rpc-error-logging', () => ({
  logRpcError: jest.fn(),
}));

describe('Full-Stack Integration: Data Function → Service → Database', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Set up $queryRawUnsafe for RPC testing
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);
  });

  it('should fetch homepage data end-to-end', async () => {
    const categoryIds = ['agents', 'mcp', 'rules'] as const;

    // Mock RPC response for get_homepage_optimized
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        category: 'agents',
        items: [
          {
            id: 'content-1',
            slug: 'test-agent',
            title: 'Test Agent',
            category: 'agents',
            popularity_score: 100,
          },
        ],
      },
    ]);

    // Test full stack: getHomepageData → ContentService → RPC → database
    const result = await getHomepageData(categoryIds);

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_homepage_optimized'),
      expect.anything()
    );

    // Verify result structure
    expect(result).toHaveProperty('agents');
    expect(result.agents).toBeDefined();
  });

  it('should fetch content detail end-to-end', async () => {
    // Mock RPC response for get_content_detail_complete
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        id: 'content-1',
        slug: 'test-content',
        title: 'Test Content',
        category: 'agents',
      },
    ]);

    // Test full stack: getContentDetailComplete → ContentService → RPC → database
    const result = await getContentDetailComplete('agents', 'test-content');

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_content_detail_complete'),
      expect.anything()
    );

    // Verify result
    expect(result).toBeDefined();
    expect(result?.slug).toBe('test-content');
  });

  it('should fetch paginated content end-to-end', async () => {
    // Mock RPC response for get_content_paginated_slim
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        id: 'content-1',
        slug: 'test-content',
        title: 'Test Content',
        category: 'agents',
      },
    ]);

    // Test full stack: getPaginatedContent → ContentService → RPC → database
    const result = await getPaginatedContent({
      category: 'agents',
      limit: 10,
      offset: 0,
    });

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_content_paginated_slim'),
      expect.anything()
    );

    // Verify result
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('should fetch companies list end-to-end', async () => {
    // Seed Prismocker with company data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('companies', [
        {
          id: 'company-1',
          name: 'Test Company',
          slug: 'test-company',
          owner_id: 'user-1',
          featured: true,
        },
      ]);
    }

    // Test full stack: getCompaniesList → CompaniesService → Prisma → database
    const result = await getCompaniesList({ limit: 10, offset: 0 });

    // Verify result
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('should fetch filtered jobs end-to-end', async () => {
    // Mock RPC response for get_jobs_list_cached
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        id: 'job-1',
        title: 'Test Job',
        company: 'Test Company',
        slug: 'test-job',
      },
    ]);

    // Test full stack: getFilteredJobs → JobsService → RPC → database
    const result = await getFilteredJobs({
      limit: 10,
      offset: 0,
    });

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_jobs_list_cached'),
      expect.anything()
    );

    // Verify result
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('should handle errors across the stack', async () => {
    // Simulate database error
    (prismocker as any).$queryRawUnsafe = jest
      .fn<() => Promise<any[]>>()
      .mockRejectedValue(new Error('Database connection failed'));

    // Test error handling: getHomepageData → ContentService → RPC → error
    await expect(getHomepageData(['agents'])).rejects.toThrow();

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
  });

  it('should use request-scoped caching across multiple data functions', async () => {
    // Mock RPC response
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        id: 'content-1',
        slug: 'test-content',
        title: 'Test Content',
        category: 'agents',
      },
    ]);

    // First call - should populate cache
    const cacheBefore = getRequestCache().getStats().size;
    await getContentDetailComplete('agents', 'test-content');
    const cacheAfterFirst = getRequestCache().getStats().size;

    // Second call - should use cache
    await getContentDetailComplete('agents', 'test-content');
    const cacheAfterSecond = getRequestCache().getStats().size;

    // Verify cache worked
    expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
    expect(cacheAfterSecond).toBe(cacheAfterFirst);
  });
});

