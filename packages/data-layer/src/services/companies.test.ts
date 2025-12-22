import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CompaniesService } from './companies.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockerClient
// Jest automatically uses __mocks__ directory (no explicit registration needed)

// Mock the RPC error logging utility
jest.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// DON'T mock request cache - use real implementation
// Cache is cleared in beforeEach for test isolation
// This allows us to:
// 1. Test business logic with fresh cache (each test starts with empty cache)
// 2. Test caching behavior by verifying cache stats and duplicate calls

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prismaMock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismaMock = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismaMock && typeof prismaMock.reset === 'function') {
      prismaMock.reset();
    }

    // Clear all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Clear request cache for test isolation (each test starts with empty cache)
    const { clearRequestCache } = await import('../utils/request-cache.ts');
    clearRequestCache();

    // Prismocker supports $queryRawUnsafe as a stub (returns empty array by default)
    // Create a fresh spy for each test AFTER clearing mocks to ensure proper isolation
    queryRawUnsafeSpy = jest.fn().mockImplementation(async () => []);
    (prismaMock as any).$queryRawUnsafe = queryRawUnsafeSpy;

    service = new CompaniesService();
  });

  describe('getCompanyAdminProfile', () => {
    it('returns company admin profile data on success', async () => {
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

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', [mockCompany]);
      }

      const result = await service.getCompanyAdminProfile({ p_company_id: 'company-1' });

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
      // For error testing, we need to mock the method to throw
      const findUniqueSpy = jest.spyOn(prismaMock.companies, 'findUnique');
      findUniqueSpy.mockRejectedValue(new Error('Database error'));

      await expect(service.getCompanyAdminProfile({ p_company_id: 'company-1' })).rejects.toThrow(
        'Database error'
      );

      findUniqueSpy.mockRestore();
    });

    it('handles null data gracefully', async () => {
      // Returns empty array when company not found (matching RPC behavior)
      // Use Prismocker's setData to seed empty test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', []);
      }

      const result = await service.getCompanyAdminProfile({ p_company_id: 'nonexistent' });

      // Returns empty array when not found
      expect(result).toEqual([]);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
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

      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', [mockCompany]);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await service.getCompanyAdminProfile({ p_company_id: 'company-1' });
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await service.getCompanyAdminProfile({ p_company_id: 'company-1' });
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(1);
    });
  });

  describe('getCompanyProfile', () => {
    it('returns company profile data on success', async () => {
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

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', [mockCompany]);
        (prismaMock as any).setData('jobs', []); // No active jobs
      }

      const result = await service.getCompanyProfile({ p_slug: 'test-company' });

      expect(result).toBeDefined();
      expect(result.company).not.toBeNull();
      expect(result.company?.id).toBe('company-1');
      expect(result.active_jobs).toBeNull(); // Empty array becomes null
      expect(result.stats).not.toBeNull();
    });

    it('returns null company when not found', async () => {
      // Use Prismocker's setData to seed empty test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', []);
      }

      const result = await service.getCompanyProfile({ p_slug: 'nonexistent' });

      expect(result).toEqual({
        company: null,
        active_jobs: null,
        stats: null,
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
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

      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', [mockCompany]);
        (prismaMock as any).setData('jobs', []);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await service.getCompanyProfile({ p_slug: 'test-company' });
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await service.getCompanyProfile({ p_slug: 'test-company' });
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1.company?.id).toBe('company-1');
    });
  });

  describe('getCompaniesList', () => {
    it('returns list of companies on success', async () => {
      // getCompaniesList uses prisma.companies.findMany with jobs relation, not $queryRawUnsafe
      // Use Prismocker's setData to seed test data
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
          featured: true, // Featured first (orderBy: featured desc)
          owner_id: 'user123', // Required for where clause
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
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
          owner_id: 'user456', // Required for where clause
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
        },
      ];

      const mockJobs = [
        {
          id: 'job-1',
          company_id: 'company-1',
          status: 'active' as const,
          remote: true,
          view_count: 10,
          click_count: 5,
          posted_at: new Date('2024-01-15'),
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 'job-2',
          company_id: 'company-1',
          status: 'active' as const,
          remote: false,
          view_count: 5,
          click_count: 2,
          posted_at: new Date('2024-01-10'),
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10'),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', mockCompanies);
        (prismaMock as any).setData('jobs', mockJobs);
      }

      const result = await service.getCompaniesList({ p_limit: 10, p_offset: 0 });

      expect(result).toBeDefined();
      expect(result.companies).not.toBeNull();
      expect(result.companies).toHaveLength(2);
      expect(result.total).toBe(2);
      // Verify stats calculation (Prismocker handles the query internally)
      expect(result.companies?.[0].stats).toMatchObject({
        active_jobs: 2,
        total_jobs: 2,
        remote_jobs: 1,
        total_views: 15,
        total_clicks: 7,
      });
    });

    it('returns null companies array when no companies exist', async () => {
      // Use Prismocker's setData to seed empty test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', []);
        (prismaMock as any).setData('jobs', []);
      }

      const result = await service.getCompaniesList({ p_limit: 10, p_offset: 0 });

      expect(result.companies).toBeNull(); // Empty array becomes null
      expect(result.total).toBe(0);
    });

    it('throws error on database failure', async () => {
      // For error testing, we need to spy and mock the method to throw
      const countSpy = jest.spyOn(prismaMock.companies, 'count');
      const mockError = new Error('Connection timeout');
      countSpy.mockRejectedValue(mockError);

      await expect(service.getCompaniesList({ p_limit: 10, p_offset: 0 })).rejects.toThrow(
        'Connection timeout'
      );

      countSpy.mockRestore();
    });

    it('handles pagination correctly', async () => {
      // Create 11 companies to test pagination
      // Order: featured desc, then created_at desc
      // All have featured: false, so ordered by created_at desc (newest first)
      // company-11 (2024-01-11) is newest, company-1 (2024-01-01) is oldest
      const mockCompanies = Array.from({ length: 11 }, (_, i) => ({
        id: `company-${i + 1}`,
        slug: `company-${i + 1}`,
        name: `Company ${i + 1}`,
        logo: null,
        website: null,
        description: null,
        size: null,
        industry: null,
        using_cursor_since: null,
        featured: false,
        owner_id: `user${i + 1}`,
        created_at: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        updated_at: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
      }));

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', mockCompanies);
        (prismaMock as any).setData('jobs', []);
      }

      const result = await service.getCompaniesList({ p_limit: 10, p_offset: 10 });

      expect(result.companies).toHaveLength(1);
      // With offset 10, we skip the first 10 (company-11 through company-2)
      // So we get company-1 (oldest, created 2024-01-01)
      expect(result.companies?.[0].id).toBe('company-1');
      expect(result.total).toBe(11);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
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
          owner_id: 'user123',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('companies', mockCompanies);
        (prismaMock as any).setData('jobs', []);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await service.getCompaniesList({ p_limit: 10, p_offset: 0 });
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await service.getCompaniesList({ p_limit: 10, p_offset: 0 });
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1.companies).toHaveLength(1);
    });
  });
});
