import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { CompaniesService } from './companies.ts';

// Mock the prisma singleton with Prismock (async to avoid Node.js TS processing issue)
vi.mock('../prisma/client.ts', async () => {
  const { setupPrismockMockAsync } = await import('../test-utils/prisma-mock.ts');
  return {
    prisma: await setupPrismockMockAsync(),
  };
});

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
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;
    
    // Reset Prismock data before each test
    prismock.reset();
    
    service = new CompaniesService();
  });

  describe('getCompanyAdminProfile', () => {
    it('returns company admin profile data on success', async () => {
      const mockData = {
        id: 'company-1',
        slug: 'test-company',
        name: 'Test Company',
        description: 'A test company',
        website: 'https://test.com',
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock $queryRawUnsafe for RPC call
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.getCompanyAdminProfile({ company_id: 'company-1' });

      expect(result).toEqual(mockData);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_company_admin_profile'),
        'company-1'
      );
    });

    it('throws error when RPC call fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(service.getCompanyAdminProfile({ company_id: 'company-1' })).rejects.toThrow(
        'Database error'
      );
    });

    it('handles null data gracefully', async () => {
      // RPC returns empty array when no data found
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

      const result = await service.getCompanyAdminProfile({ company_id: 'nonexistent' });

      // BasePrismaService unwraps single-element arrays, so empty array becomes undefined
      expect(result).toBeUndefined();
    });
  });

  describe('getCompanyProfile', () => {
    it('returns company profile data on success', async () => {
      const mockData = {
        id: 'company-1',
        slug: 'test-company',
        name: 'Test Company',
        description: 'A test company',
        website: 'https://test.com',
        logo_url: 'https://test.com/logo.png',
        job_count: 5,
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.getCompanyProfile({ company_slug: 'test-company' });

      expect(result).toEqual(mockData);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_company_profile'),
        'test-company'
      );
    });

    it('throws error when company not found', async () => {
      const mockError = new Error('Company not found');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(service.getCompanyProfile({ company_slug: 'nonexistent' })).rejects.toThrow(
        'Company not found'
      );
    });
  });

  describe('getCompaniesList', () => {
    it('returns list of companies on success', async () => {
      const mockData = [
        { id: 'company-1', slug: 'company-1', name: 'Company 1', job_count: 3 },
        { id: 'company-2', slug: 'company-2', name: 'Company 2', job_count: 1 },
      ];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getCompaniesList({ limit_count: 10, offset_count: 0 });

      expect(result).toEqual(mockData);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_companies_list'),
        10,
        0
      );
    });

    it('returns empty array when no companies exist', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

      const result = await service.getCompaniesList({ limit_count: 10, offset_count: 0 });

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Connection timeout');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(
        service.getCompaniesList({ limit_count: 10, offset_count: 0 })
      ).rejects.toThrow('Connection timeout');
    });

    it('handles pagination correctly', async () => {
      const mockData = [{ id: 'company-11', slug: 'company-11', name: 'Company 11' }];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getCompaniesList({ limit_count: 10, offset_count: 10 });

      expect(result).toEqual(mockData);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_companies_list'),
        10,
        10
      );
    });
  });
});