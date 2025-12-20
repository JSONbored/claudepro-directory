import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CompaniesService } from './companies.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockClient

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Mock request cache
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prismock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;

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

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    prismock = prisma;

    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }

    // Prismock doesn't support $queryRawUnsafe, so we add it as a mock function
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;

      // Ensure Prismock models are initialized
      void prismock.companies;
      void prismock.jobs;

    service = new CompaniesService();
  });

  describe('getCompanyAdminProfile', () => {
    it('returns company admin profile data on success', async () => {
      // getCompanyAdminProfile uses prisma.companies.findUnique, not $queryRawUnsafe
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

      const result = await service.getCompanyAdminProfile({ p_company_id: 'company-1' });

      expect(prismock.companies.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'company-1' },
          select: expect.objectContaining({
            id: true,
            slug: true,
            name: true,
          }),
        })
      );
      // Returns array matching RPC return structure
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'company-1',
        slug: 'test-company',
        name: 'Test Company',
        description: 'A test company',
        website: 'https://test.com',
        featured: true,
      });
      expect(result[0].created_at).toBe(mockCompany.created_at.toISOString());
    });

    it('throws error when database call fails', async () => {
      const mockError = new Error('Database error');

      mockPrismockMethod(prismock.companies, 'findUnique', Promise.reject(mockError));

      await expect(service.getCompanyAdminProfile({ p_company_id: 'company-1' })).rejects.toThrow(
        'Database error'
      );
    });

    it('handles null data gracefully', async () => {
      // Returns empty array when company not found (matching RPC behavior)
      mockPrismockMethod(prismock.companies, 'findUnique', null);

      const result = await service.getCompanyAdminProfile({ p_company_id: 'nonexistent' });

      // Returns empty array when not found
      expect(result).toEqual([]);
    });
  });

  describe('getCompanyProfile', () => {
    it('returns company profile data on success', async () => {
      // getCompanyProfile uses prisma.companies.findFirst, prisma.jobs.findMany, and some $queryRawUnsafe for active jobs
      const mockCompany = {
        id: 'company-1',
        slug: 'test-company',
        name: 'Test Company',
        logo: 'https://test.com/logo.png',
        website: 'https://test.com',
        description: 'A test company',
        size: 'small' as const,
        industry: null,
        using_cursor_since: new Date('2024-01-01'),
        featured: true,
        json_ld: null,
        owner_id: 'user123',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockPrismockMethod(prismock.companies, 'findFirst', mockCompany);
      
      // Mock jobs.findMany for active jobs (migrated from raw SQL to Prisma)
      const findManyMock = vi.fn()
        .mockResolvedValueOnce([]) // activeJobsData
        .mockResolvedValueOnce([]); // allJobs for stats
      prismock.jobs.findMany = findManyMock;
      
      // Mock jobs.count for stats calculation
      const countMock = vi.fn()
        .mockResolvedValueOnce(0) // totalJobs
        .mockResolvedValueOnce(0) // activeJobsCount (migrated from raw SQL)
        .mockResolvedValueOnce(0) // featuredJobs
        .mockResolvedValueOnce(0); // remoteJobs
      prismock.jobs.count = countMock;
      
      // Mock jobs.aggregate
      const aggregateMock = vi.fn()
        .mockResolvedValueOnce({ _sum: { view_count: 0 } })
        .mockResolvedValueOnce({ _sum: { click_count: 0 } });
      prismock.jobs.aggregate = aggregateMock;
      
      mockPrismockMethod(prismock.jobs, 'findFirst', null);

      const result = await service.getCompanyProfile({ p_slug: 'test-company' });

      expect(prismock.companies.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            slug: 'test-company',
            owner_id: { not: null },
          },
          select: expect.objectContaining({
            id: true,
            slug: true,
            name: true,
          }),
        })
      );
      // Verify active jobs query (migrated from raw SQL to Prisma)
      expect(prismock.jobs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            company_id: 'company-1',
            status: 'active',
            active: true,
            expires_at: expect.objectContaining({ gt: expect.any(Date) }),
          }),
        })
      );
      expect(result).toBeDefined();
      expect(result.company).not.toBeNull();
      expect(result.company?.id).toBe('company-1');
      expect(result.active_jobs).toBeNull(); // Empty array becomes null
      expect(result.stats).not.toBeNull();
    });

    it('returns null company when not found', async () => {
      mockPrismockMethod(prismock.companies, 'findFirst', null);

      const result = await service.getCompanyProfile({ p_slug: 'nonexistent' });

      expect(result).toEqual({
        company: null,
        active_jobs: null,
        stats: null,
      });
    });
  });

  describe('getCompaniesList', () => {
    it('returns list of companies on success', async () => {
      // getCompaniesList uses prisma.companies.findMany with jobs relation, not $queryRawUnsafe
      const mockCompanies = [
        {
          id: 'company-1',
          slug: 'company-1',
          name: 'Company 1',
          logo: null,
          website: null,
          description: null,
          size: 'small' as const,
          industry: null,
          using_cursor_since: null,
          featured: false,
          created_at: new Date('2024-01-01'),
          jobs: [
            {
              id: 'job-1',
              status: 'active' as const,
              remote: true,
              view_count: 10,
              click_count: 5,
              posted_at: new Date('2024-01-15'),
              created_at: new Date('2024-01-15'),
            },
            {
              id: 'job-2',
              status: 'active' as const,
              remote: false,
              view_count: 5,
              click_count: 2,
              posted_at: new Date('2024-01-10'),
              created_at: new Date('2024-01-10'),
            },
          ],
        },
        {
          id: 'company-2',
          slug: 'company-2',
          name: 'Company 2',
          logo: null,
          website: null,
          description: null,
          size: null,
          industry: null,
          using_cursor_since: null,
          featured: false,
          created_at: new Date('2024-01-02'),
          jobs: [],
        },
      ];

      mockPrismockMethod(prismock.companies, 'count', 2);
      mockPrismockMethod(prismock.companies, 'findMany', mockCompanies);

      const result = await service.getCompaniesList({ p_limit: 10, p_offset: 0 });

      expect(prismock.companies.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { owner_id: { not: null } },
          select: expect.objectContaining({
            id: true,
            slug: true,
            name: true,
            jobs: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                status: true,
              }),
            }),
          }),
          orderBy: [{ featured: 'desc' }, { created_at: 'desc' }],
          take: 10,
          skip: 0,
          relationLoadStrategy: 'join',
        })
      );
      expect(result).toBeDefined();
      expect(result.companies).not.toBeNull();
      expect(result.companies).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.companies?.[0].stats).toMatchObject({
        active_jobs: 2,
        total_jobs: 2,
        remote_jobs: 1,
        total_views: 15,
        total_clicks: 7,
      });
    });

    it('returns null companies array when no companies exist', async () => {
      mockPrismockMethod(prismock.companies, 'count', 0);
      mockPrismockMethod(prismock.companies, 'findMany', []);

      const result = await service.getCompaniesList({ p_limit: 10, p_offset: 0 });

      expect(result.companies).toBeNull(); // Empty array becomes null
      expect(result.total).toBe(0);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Connection timeout');

      mockPrismockMethod(prismock.companies, 'count', Promise.reject(mockError));

      await expect(service.getCompaniesList({ p_limit: 10, p_offset: 0 })).rejects.toThrow(
        'Connection timeout'
      );
    });

    it('handles pagination correctly', async () => {
      const mockCompany = {
        id: 'company-11',
        slug: 'company-11',
        name: 'Company 11',
        logo: null,
        website: null,
        description: null,
        size: null,
        industry: null,
        using_cursor_since: null,
        featured: false,
        created_at: new Date('2024-01-11'),
        jobs: [],
      };

      mockPrismockMethod(prismock.companies, 'count', 11);
      mockPrismockMethod(prismock.companies, 'findMany', [mockCompany]);

      const result = await service.getCompaniesList({ p_limit: 10, p_offset: 10 });

      expect(prismock.companies.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10,
        })
      );
      expect(result.companies).toHaveLength(1);
      expect(result.companies?.[0].id).toBe('company-11');
    });
  });
});
