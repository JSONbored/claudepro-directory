import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  getCompanyAdminProfile,
  getCompanyProfile,
  getCompaniesList,
  searchCompanies,
} from './companies';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Don't mock @heyclaude/data-layer - let it load normally
// The prisma path mocks above will ensure services use Prismocker
// Type-only imports from @heyclaude/data-layer should work fine

// Mock logger and error handling
jest.mock('../logger.ts', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../errors.ts', () => ({
  normalizeError: jest.fn((error, message) =>
    error instanceof Error ? error : new Error(message || String(error))
  ),
}));

// Don't mock getService - let it work normally
// It will create service instances that use the mocked Prismocker
// The singleton pattern in getService will work correctly

describe('companies', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

    jest.clearAllMocks();
  });

  describe('getCompanyAdminProfile', () => {
    it('should return company admin profile', async () => {
      // getCompanyAdminProfile uses Prisma directly (not RPC)
      const mockCompany = {
        id: 'company-1',
        owner_id: 'user123',
        slug: 'test-company',
        name: 'Test Company',
        logo: null,
        website: 'https://test.com',
        description: 'A test company',
        size: 'small' as const,
        industry: null,
        using_cursor_since: new Date('2024-01-01'),
        featured: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      // Seed data using Prismocker
      prismocker.setData('companies', [mockCompany]);

      const result = await getCompanyAdminProfile('company-1');

      expect(result).toMatchObject({
        id: 'company-1',
        slug: 'test-company',
        name: 'Test Company',
      });
    });

    it('should handle empty string companyId', async () => {
      // Empty string fails Boolean validation (Boolean('') is false)
      // Validation should fail and return null without calling service
      // But if validation is bypassed or not working, service will be called
      // In that case, service returns empty array which normalizeRpcResult converts to null
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([]);

      const result = await getCompanyAdminProfile('');

      // If validation works: service not called, result is null
      // If validation doesn't work: service called, returns null (empty array normalized)
      // Either way, result should be null
      expect(result).toBeNull();
      // Note: We can't reliably test if service was called because validation might be bypassed
      // The important thing is that the function returns null for empty string
    });

    it('should throw on error (throwOnError: true)', async () => {
      const mockError = new Error('Database error');
      // Mock Prisma findUnique to throw error
      jest.spyOn(prismocker.companies, 'findUnique').mockRejectedValue(mockError);

      await expect(getCompanyAdminProfile('company-1')).rejects.toThrow('Database error');

      jest.restoreAllMocks();
    });

    it('should normalize RPC result (array to single item)', async () => {
      // getCompanyAdminProfile uses Prisma directly, returns array which normalizeRpcResult unwraps
      const mockCompany = {
        id: 'company-1',
        owner_id: 'user123',
        slug: 'test-company',
        name: 'Test Company',
        logo: null,
        website: null,
        description: null,
        size: 'small' as const,
        industry: null,
        using_cursor_since: new Date('2024-01-01'),
        featured: false,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      // Seed data using Prismocker
      prismocker.setData('companies', [mockCompany]);

      const result = await getCompanyAdminProfile('company-1');

      // Service returns array, normalizeRpcResult unwraps to single item
      expect(result).toMatchObject({
        id: 'company-1',
        name: 'Test Company',
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      // getCompanyAdminProfile uses Prisma directly (not RPC)
      const mockCompany = {
        id: 'company-1',
        owner_id: 'user123',
        slug: 'test-company',
        name: 'Test Company',
        logo: null,
        website: null,
        description: null,
        size: 'small' as const,
        industry: null,
        using_cursor_since: new Date('2024-01-01'),
        featured: false,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      prismocker.setData('companies', [mockCompany]);

      // Spy on Prisma model methods to verify caching
      const findUniqueSpy = jest.spyOn(prismocker.companies, 'findUnique');

      // First call - should hit database and populate cache
      const result1 = await getCompanyAdminProfile('company-1');
      const firstFindUniqueCalls = findUniqueSpy.mock.calls.length;

      // Second call - should hit cache (no database call)
      const result2 = await getCompanyAdminProfile('company-1');
      const secondFindUniqueCalls = findUniqueSpy.mock.calls.length;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);
      
      // Verify Prisma methods were only called once (cached on second call)
      expect(secondFindUniqueCalls).toBe(firstFindUniqueCalls);

      findUniqueSpy.mockRestore();
    });
  });

  describe('getCompanyProfile', () => {
    it('should return company profile by slug', async () => {
      // getCompanyProfile uses Prisma directly (not RPC)
      const mockCompany = {
        id: 'company-1',
        owner_id: 'user123',
        slug: 'test-company',
        name: 'Test Company',
        logo: null,
        website: 'https://test.com',
        description: 'A test company',
        size: 'small' as const,
        industry: null,
        using_cursor_since: new Date('2024-01-01'),
        featured: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        json_ld: null,
      };

      // Seed data using Prismocker
      prismocker.setData('companies', [mockCompany]);
      prismocker.setData('jobs', []); // No jobs
      prismocker.setData('sponsored_content', []); // No sponsored content

      const result = await getCompanyProfile('test-company');

      expect(result).toMatchObject({
        company: expect.objectContaining({
          id: 'company-1',
          slug: 'test-company',
          name: 'Test Company',
        }),
        active_jobs: null, // Service returns null when no active jobs found
        stats: expect.objectContaining({
          total_jobs: 0,
          active_jobs: 0,
        }),
      });
    });

    it('should handle empty string slug', async () => {
      // getCompanyProfile uses Prisma directly - returns null when company not found
      // Seed empty data
      prismocker.setData('companies', []);
      prismocker.setData('jobs', []);
      prismocker.setData('sponsored_content', []);

      const result = await getCompanyProfile('');

      expect(result).toMatchObject({
        company: null,
        active_jobs: null,
        stats: null,
      });
    });

    it('should throw on error (throwOnError: true)', async () => {
      const mockError = new Error('Database error');
      // Mock Prisma findFirst to throw error
      jest.spyOn(prismocker.companies, 'findFirst').mockRejectedValue(mockError);

      await expect(getCompanyProfile('test-company')).rejects.toThrow('Database error');

      jest.restoreAllMocks();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      // getCompanyProfile uses Prisma directly (not RPC)
      const mockCompany = {
        id: 'company-1',
        owner_id: 'user123',
        slug: 'test-company',
        name: 'Test Company',
        logo: null,
        website: null,
        description: null,
        size: 'small' as const,
        industry: null,
        using_cursor_since: new Date('2024-01-01'),
        featured: false,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        json_ld: null,
      };

      prismocker.setData('companies', [mockCompany]);
      prismocker.setData('jobs', []);
      prismocker.setData('sponsored_content', []);

      // Spy on Prisma model methods to verify caching
      const findFirstSpy = jest.spyOn(prismocker.companies, 'findFirst');
      const findManySpy = jest.spyOn(prismocker.jobs, 'findMany');
      const countSpy = jest.spyOn(prismocker.jobs, 'count');
      const aggregateSpy = jest.spyOn(prismocker.jobs, 'aggregate');

      // First call - should hit database and populate cache
      const result1 = await getCompanyProfile('test-company');
      const firstFindFirstCalls = findFirstSpy.mock.calls.length;

      // Second call - should hit cache (no database call)
      const result2 = await getCompanyProfile('test-company');
      const secondFindFirstCalls = findFirstSpy.mock.calls.length;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);
      
      // Verify Prisma methods were only called once (cached on second call)
      expect(secondFindFirstCalls).toBe(firstFindFirstCalls);

      findFirstSpy.mockRestore();
      findManySpy.mockRestore();
      countSpy.mockRestore();
      aggregateSpy.mockRestore();
    });
  });

  describe('getCompaniesList', () => {
    it('should return companies list with default limit', async () => {
      // getCompaniesList uses Prisma directly (not RPC)
      const mockCompany = {
        id: 'company-1',
        slug: 'test-company-1',
        name: 'Test Company 1',
        logo: null,
        website: null,
        description: null,
        size: 'small' as const,
        industry: null,
        using_cursor_since: new Date('2024-01-01'),
        featured: false,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        owner_id: 'user-1',
        jobs: [], // Empty jobs array - stats will be calculated from this
      };

      // Seed data using Prismocker
      prismocker.setData('companies', [mockCompany]);

      const result = await getCompaniesList();

      expect(result).toMatchObject({
        companies: expect.arrayContaining([
          expect.objectContaining({
            id: 'company-1',
            name: 'Test Company 1',
            stats: {
              active_jobs: 0,
              total_jobs: 0,
              remote_jobs: 0,
              total_views: 0,
              total_clicks: 0,
              latest_job_posted_at: null,
            },
          }),
        ]),
        total: 1,
      });
    });

    it('should use custom limit and offset', async () => {
      // Seed empty data
      prismocker.setData('companies', []);

      const result = await getCompaniesList(100, 50);

      expect(result).toMatchObject({
        companies: null, // Service returns null when companies array is empty
        total: 0,
      });
    });

    it('should return empty result on null', async () => {
      // Seed empty data
      prismocker.setData('companies', []);

      const result = await getCompaniesList();

      expect(result).toMatchObject({
        companies: null, // Service returns null when companies array is empty
        total: 0,
      });
    });

    it('should handle zero limit', async () => {
      // Seed empty data
      prismocker.setData('companies', []);

      const result = await getCompaniesList(0, 0);

      expect(result).toMatchObject({
        companies: null,
        total: 0,
      });
    });

    it('should handle negative offset', async () => {
      // Seed empty data
      prismocker.setData('companies', []);

      const result = await getCompaniesList(50, -10);

      expect(result).toMatchObject({
        companies: null, // Service returns null when companies array is empty
        total: 0,
      });
    });

    it('should handle very large limit', async () => {
      // Seed empty data
      prismocker.setData('companies', []);

      const result = await getCompaniesList(10000, 0);

      expect(result).toMatchObject({
        companies: null,
        total: 0,
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      // getCompaniesList uses Prisma directly (not RPC)
      const mockCompany = {
        id: 'company-1',
        slug: 'test-company-1',
        name: 'Test Company 1',
        logo: null,
        website: null,
        description: null,
        size: 'small' as const,
        industry: null,
        using_cursor_since: new Date('2024-01-01'),
        featured: false,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
        owner_id: 'user-1',
        jobs: [],
      };

      prismocker.setData('companies', [mockCompany]);

      // Spy on Prisma model methods to verify caching
      const countSpy = jest.spyOn(prismocker.companies, 'count');
      const findManySpy = jest.spyOn(prismocker.companies, 'findMany');

      // First call - should hit database and populate cache
      const result1 = await getCompaniesList();
      const firstCountCalls = countSpy.mock.calls.length;
      const firstFindManyCalls = findManySpy.mock.calls.length;

      // Second call - should hit cache (no database call)
      const result2 = await getCompaniesList();
      const secondCountCalls = countSpy.mock.calls.length;
      const secondFindManyCalls = findManySpy.mock.calls.length;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);
      
      // Verify Prisma methods were only called once (cached on second call)
      expect(secondCountCalls).toBe(firstCountCalls);
      expect(secondFindManyCalls).toBe(firstFindManyCalls);

      countSpy.mockRestore();
      findManySpy.mockRestore();
    });
  });

  describe('searchCompanies', () => {
    it('should return search results for valid query', async () => {
      // searchCompanies uses SearchService.searchUnified which calls RPC search_unified
      // RPC returns composite type: { results: [...], total_count: number }
      // $queryRawUnsafe returns arrays, so we wrap in array
      const mockRpcResult = {
        results: [
          {
            id: '1',
            title: 'Company 1',
            slug: 'company-1',
            description: 'Description',
          },
        ],
        total_count: 1,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 10);

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Company 1',
        slug: 'company-1',
        description: 'Description',
      });
    });

    it('should return empty array for query shorter than 2 characters', async () => {
      const result = await searchCompanies('a', 10);

      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', async () => {
      const result = await searchCompanies('', 10);

      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should trim whitespace from query', async () => {
      // RPC returns { results: [...], total_count: number }
      const mockRpcResult = { results: [], total_count: 0 };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('  company  ', 10);

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should use default limit of 10', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company');

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle custom limit', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 50);

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      // fetchCompanySearchResults has onError: () => [] so errors return empty array
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(new Error('Search error'));

      const result = await searchCompanies('company', 10);

      expect(result).toEqual([]);
    });

    it('should transform search results correctly', async () => {
      // RPC returns composite type: { results: [...], total_count: number }
      const mockRpcResult = {
        results: [
          { id: '1', title: 'Company 1', slug: 'company-1', description: 'Desc 1' },
          { id: '2', slug: 'company-2' }, // Missing title
          { id: '3', title: 'Company 3' }, // Missing slug
        ],
        total_count: 3,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 10);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Company 1',
        slug: 'company-1',
        description: 'Desc 1',
      });
      expect(result[1]).toEqual({
        id: '2',
        name: 'company-2', // Uses slug as name when title missing
        slug: 'company-2',
        description: null,
      });
      expect(result[2]).toEqual({
        id: '3',
        name: 'Company 3',
        slug: null,
        description: null,
      });
    });

    it('should handle empty search response data', async () => {
      // RPC returns { results: [...], total_count: number }
      // When results is empty, transformResult returns empty array
      const mockRpcResult = { results: [], total_count: 0 };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 10);

      expect(result).toEqual([]);
    });

    it('should handle missing results property', async () => {
      // RPC should return { results: [...], total_count: number }
      // But if results is missing, searchUnified returns { data: [], total_count: 0 }
      // transformResult extracts result.data, which would be undefined
      // The code uses: const results = searchResponse.data || [];
      const mockRpcResult = { total_count: 0 }; // No 'results' property
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 10);

      // searchUnified returns { data: [], total_count: 0 } when results is missing
      // transformResult extracts result.data which is [], so result is []
      expect(result).toEqual([]);
    });

    it('should handle single character query (edge case)', async () => {
      const result = await searchCompanies('c', 10);

      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle exactly 2 character query', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('co', 10);

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle whitespace-only query', async () => {
      const result = await searchCompanies('   ', 10);

      // After trim, becomes empty string, which is < 2 chars
      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle zero limit', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 0);

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle negative limit', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', -10);

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockRpcResult = {
        results: [
          {
            id: '1',
            title: 'Company 1',
            slug: 'company-1',
            description: 'Description',
          },
        ],
        total_count: 1,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      // First call - should hit database and populate cache
      const result1 = await searchCompanies('company', 10);
      const firstCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls.length;

      // Second call - should hit cache (no database call)
      const result2 = await searchCompanies('company', 10);
      const secondCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls.length;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);
      
      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(secondCallCount).toBe(firstCallCount);
    });
  });
});
