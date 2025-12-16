import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { JobsService } from './jobs.ts';

// Mock the prisma singleton with Prismock
vi.mock('../prisma/client.ts', () => {
  const { setupPrismockMock } = require('../test-utils/prisma-mock.ts');
  return {
    prisma: setupPrismockMock(),
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

describe('JobsService', () => {
  let service: JobsService;
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;
    
    // Reset Prismock data before each test
    prismock.reset();
    
    service = new JobsService();
  });

  describe('getJobs', () => {
    it('returns list of jobs on success', async () => {
      const mockData = [
        {
          id: 'job-1',
          slug: 'senior-developer',
          title: 'Senior Developer',
          company_name: 'Test Company',
          location: 'Remote',
          salary_range: '$100k-$150k',
          posted_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'job-2',
          slug: 'junior-designer',
          title: 'Junior Designer',
          company_name: 'Design Co',
          location: 'San Francisco',
          salary_range: '$60k-$80k',
          posted_at: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getJobs();

      expect(result).toEqual(mockData);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_jobs_list')
      );
    });

    it('returns empty array when no jobs exist', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

      const result = await service.getJobs();

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Database connection failed');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(service.getJobs()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getJobBySlug', () => {
    it('returns job detail on success', async () => {
      const mockData = {
        id: 'job-1',
        slug: 'senior-developer',
        title: 'Senior Developer',
        description: 'We are looking for a senior developer...',
        company_id: 'company-1',
        company_name: 'Test Company',
        company_logo: 'https://test.com/logo.png',
        location: 'Remote',
        salary_range: '$100k-$150k',
        employment_type: 'full-time',
        skills: ['TypeScript', 'React', 'Node.js'],
        posted_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-02-01T00:00:00Z',
        is_active: true,
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.getJobBySlug({ job_slug: 'senior-developer' });

      expect(result).toEqual(mockData);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_job_detail'),
        'senior-developer'
      );
    });

    it('handles job not found', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

      const result = await service.getJobBySlug({ job_slug: 'nonexistent-job' });

      expect(result).toBeUndefined();
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Job not found');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(service.getJobBySlug({ job_slug: 'deleted-job' })).rejects.toThrow('Job not found');
    });

    it('handles expired jobs', async () => {
      const mockData = {
        id: 'job-expired',
        slug: 'expired-job',
        title: 'Expired Job',
        is_active: false,
        expires_at: '2023-01-01T00:00:00Z',
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.getJobBySlug({ job_slug: 'expired-job' });

      expect(result).toEqual(mockData);
      expect(result?.is_active).toBe(false);
    });
  });
});