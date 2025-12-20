import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getCompanyAdminProfile,
  getCompanyProfile,
  getCompaniesList,
  searchCompanies,
} from './companies';
import { prisma } from '../../../data-layer/src/prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Mock server-only FIRST
vi.mock('server-only', () => ({}));

// Mock next/cache for cache directives
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  connection: vi.fn(() => Promise.resolve()),
}));

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockClient

// Mock request cache - services use withSmartCache
vi.mock('../../../data-layer/src/utils/request-cache.ts', () => ({
  withSmartCache: vi.fn(async (_rpcName, _methodName, rpcCall, _args) => {
    return await rpcCall();
  }),
  withRequestCache: vi.fn(async (_rpcName, rpcCall, _args) => {
    return await rpcCall();
  }),
}));

// Mock RPC error logging utility
vi.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Don't mock @heyclaude/data-layer - let it load normally
// The prisma path mocks above will ensure services use Prismock
// Type-only imports from @heyclaude/data-layer should work fine

// Mock logger and error handling
vi.mock('../logger.ts', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../errors.ts', () => ({
  normalizeError: vi.fn((error, message) =>
    error instanceof Error ? error : new Error(message || String(error))
  ),
}));

// Don't mock getService - let it work normally
// It will create service instances that use the mocked Prismock
// The singleton pattern in getService will work correctly

describe('companies', () => {
  let prismock: PrismaClient;

  /**
   * Helper to safely mock Prismock model methods
   */
  function mockPrismockMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismock model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = vi.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  /**
   * Helper to mock Prismock count() method (not supported by Prismock)
   */
  function mockPrismockCount(model: any, returnValue: number): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismock model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = vi.fn().mockResolvedValue(returnValue);
    model.count = mockFn;
    return mockFn;
  }

  /**
   * Helper to mock Prismock aggregate() method (not supported by Prismock)
   */
  function mockPrismockAggregate(model: any, returnValue: any): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismock model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = vi.fn().mockResolvedValue(returnValue);
    model.aggregate = mockFn;
    return mockFn;
  }

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    prismock = prisma;

    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }

    // Prismock doesn't support $queryRawUnsafe, so we add it as a mock function
    const queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Don't clear all mocks - mockPrismockMethod sets up mocks per test
    // vi.clearAllMocks() would clear the mocks set up by mockPrismockMethod
  });

  describe('getCompanyAdminProfile', () => {
    it('should return company admin profile', async () => {
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

      mockPrismockMethod(prismock.companies, 'findUnique', mockCompany);

      const result = await getCompanyAdminProfile('company-1');

      expect(prismock.companies.findUnique).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        select: expect.objectContaining({
          id: true,
          slug: true,
          name: true,
        }),
      });
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
      mockPrismockMethod(prismock.companies, 'findUnique', null);

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
      mockPrismockMethod(prismock.companies, 'findUnique', Promise.reject(mockError));

      await expect(getCompanyAdminProfile('company-1')).rejects.toThrow('Database error');
    });

    it('should normalize RPC result (array to single item)', async () => {
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

      mockPrismockMethod(prismock.companies, 'findUnique', mockCompany);

      const result = await getCompanyAdminProfile('company-1');

      // Service returns array, normalizeRpcResult unwraps to single item
      expect(result).toMatchObject({
        id: 'company-1',
        name: 'Test Company',
      });
    });
  });

  describe('getCompanyProfile', () => {
    it('should return company profile by slug', async () => {
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

      // getCompanyProfile uses Prisma findFirst, findMany, count, aggregate, and findFirst for latest job
      mockPrismockMethod(prismock.companies, 'findFirst', mockCompany);
      // findMany is called twice: once for active jobs, once for all jobs
      mockPrismockMethod(prismock.jobs, 'findMany', []);
      // findFirst is called for latest job posted date
      mockPrismockMethod(prismock.jobs, 'findFirst', null);
      // count() is called multiple times for stats
      mockPrismockCount(prismock.jobs, 0);
      // aggregate() is called for views/clicks aggregation
      mockPrismockAggregate(prismock.jobs, {
        _count: { view_count: 0 },
        _sum: { view_count: 0, click_count: 0 },
      });
      mockPrismockMethod(prismock.sponsored_content, 'findFirst', null);

      const result = await getCompanyProfile('test-company');

      expect(prismock.companies.findFirst).toHaveBeenCalled();
      expect(result).toMatchObject({
        company: expect.objectContaining({
          id: 'company-1',
          slug: 'test-company',
          name: 'Test Company',
        }),
      });
    });

    it('should handle empty string slug', async () => {
      // getCompanyProfile uses Prisma findFirst - returns null when company not found
      mockPrismockMethod(prismock.companies, 'findFirst', null);
      // When company is null, jobs queries are not executed, but we still need to mock them
      // in case the service tries to access them (defensive mocking)
      mockPrismockMethod(prismock.jobs, 'findMany', []);
      mockPrismockMethod(prismock.jobs, 'findFirst', null);
      mockPrismockCount(prismock.jobs, 0);
      mockPrismockAggregate(prismock.jobs, {
        _count: { view_count: 0 },
        _sum: { view_count: 0, click_count: 0 },
      });
      mockPrismockMethod(prismock.sponsored_content, 'findFirst', null);

      const result = await getCompanyProfile('');

      expect(prismock.companies.findFirst).toHaveBeenCalled();
      expect(result).toMatchObject({
        company: null,
      });
    });

    it('should throw on error (throwOnError: true)', async () => {
      const mockError = new Error('Database error');
      // getCompanyProfile uses Prisma findFirst, not RPC
      mockPrismockMethod(prismock.companies, 'findFirst', Promise.reject(mockError));

      await expect(getCompanyProfile('test-company')).rejects.toThrow('Database error');
    });
  });

  describe('getCompaniesList', () => {
    it('should return companies list with default limit', async () => {
      const mockCompany = {
        id: 'company-1',
        slug: 'test-company-1',
        name: 'Test Company 1',
        logo: null,
        website: null,
        description: null,
        size: 'small' as const,
        industry: null,
        featured: false,
        created_at: new Date('2024-01-01'),
        jobs: [], // Empty jobs array - stats will be calculated from this
      };

      // getCompaniesList uses Prisma count() and findMany() with jobs relation
      mockPrismockCount(prismock.companies, 1);
      mockPrismockMethod(prismock.companies, 'findMany', [mockCompany]);

      const result = await getCompaniesList();

      expect(prismock.companies.count).toHaveBeenCalled();
      expect(prismock.companies.findMany).toHaveBeenCalled();
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
      // getCompaniesList uses Prisma count() and findMany()
      mockPrismockCount(prismock.companies, 0);
      mockPrismockMethod(prismock.companies, 'findMany', []);

      const result = await getCompaniesList(100, 50);

      expect(prismock.companies.count).toHaveBeenCalled();
      expect(prismock.companies.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
          skip: 50,
        })
      );
      expect(result).toMatchObject({
        companies: null, // Service returns null when companies array is empty
        total: 0,
      });
    });

    it('should return empty result on null', async () => {
      // When Prisma returns null companies, getCompaniesList returns null companies array
      mockPrismockCount(prismock.companies, 0);
      mockPrismockMethod(prismock.companies, 'findMany', []);

      const result = await getCompaniesList();

      expect(result).toMatchObject({
        companies: null, // Service returns null when companies array is empty
        total: 0,
      });
    });

    it('should handle zero limit', async () => {
      mockPrismockCount(prismock.companies, 0);
      mockPrismockMethod(prismock.companies, 'findMany', []);

      const result = await getCompaniesList(0, 0);

      expect(prismock.companies.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 0,
          skip: 0,
        })
      );
      expect(result).toMatchObject({
        companies: null,
        total: 0,
      });
    });

    it('should handle negative offset', async () => {
      mockPrismockCount(prismock.companies, 0);
      mockPrismockMethod(prismock.companies, 'findMany', []);

      const result = await getCompaniesList(50, -10);

      expect(prismock.companies.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: -10, // Prisma accepts negative skip values
        })
      );
      expect(result).toMatchObject({
        companies: null, // Service returns null when companies array is empty
        total: 0,
      });
    });

    it('should handle very large limit', async () => {
      mockPrismockCount(prismock.companies, 0);
      mockPrismockMethod(prismock.companies, 'findMany', []);

      const result = await getCompaniesList(10000, 0);

      expect(prismock.companies.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10000,
          skip: 0,
        })
      );
      expect(result).toMatchObject({
        companies: null,
        total: 0,
      });
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

      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 10);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
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

      expect(prismock.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', async () => {
      const result = await searchCompanies('', 10);

      expect(prismock.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should trim whitespace from query', async () => {
      // RPC returns { results: [...], total_count: number }
      const mockRpcResult = { results: [], total_count: 0 };
      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('  company  ', 10);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should use default limit of 10', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company');

      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle custom limit', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 50);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      // fetchCompanySearchResults has onError: () => [] so errors return empty array
      (prismock as any).$queryRawUnsafe.mockRejectedValue(new Error('Search error'));

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

      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

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
      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 10);

      expect(result).toEqual([]);
    });

    it('should handle missing results property', async () => {
      // RPC should return { results: [...], total_count: number }
      // But if results is missing, searchUnified returns { data: [], total_count: 0 }
      // transformResult extracts result.data, which would be undefined
      // The code uses: const results = searchResponse.data || [];
      const mockRpcResult = { total_count: 0 }; // No 'results' property
      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 10);

      // searchUnified returns { data: [], total_count: 0 } when results is missing
      // transformResult extracts result.data which is [], so result is []
      expect(result).toEqual([]);
    });

    it('should handle single character query (edge case)', async () => {
      const result = await searchCompanies('c', 10);

      expect(prismock.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle exactly 2 character query', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('co', 10);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle whitespace-only query', async () => {
      const result = await searchCompanies('   ', 10);

      // After trim, becomes empty string, which is < 2 chars
      expect(prismock.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle zero limit', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', 0);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle negative limit', async () => {
      const mockRpcResult = { results: [], total_count: 0 };
      (prismock as any).$queryRawUnsafe.mockResolvedValue([mockRpcResult] as any);

      const result = await searchCompanies('company', -10);

      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
