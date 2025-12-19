import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { MockPrismaClient } from '../test-utils/prisma-mock.ts';
import { JobsService } from './jobs.ts';

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

describe('JobsService', () => {
  let service: JobsService;
  let prismock: MockPrismaClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as MockPrismaClient;
    
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

  describe('getFeaturedJobs', () => {
    it('should return featured jobs with placeholders if needed', async () => {
      const mockRealJobs = [
        {
          id: 'job-1',
          slug: 'featured-1',
          featured: true,
          is_placeholder: false,
          order: 1,
        },
        {
          id: 'job-2',
          slug: 'featured-2',
          featured: true,
          is_placeholder: false,
          order: 2,
        },
      ];

      const mockPlaceholders = [
        {
          id: 'placeholder-1',
          slug: 'placeholder-1',
          featured: false,
          is_placeholder: true,
          order: null,
        },
      ];

      vi.mocked(prismock.jobs.count).mockResolvedValue(2);
      vi.mocked(prismock.jobs.findMany)
        .mockResolvedValueOnce(mockRealJobs as any)
        .mockResolvedValueOnce(mockPlaceholders as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getFeaturedJobs();

      expect(prismock.jobs.count).toHaveBeenCalledWith({
        where: {
          status: 'active',
          active: true,
          featured: true,
          is_placeholder: false,
        },
      });
      expect(result).toHaveLength(3); // 2 real + 1 placeholder
      expect(result[0].is_placeholder).toBe(false);
      expect(result[2].is_placeholder).toBe(true);
    });

    it('should return only real jobs if 6+ exist', async () => {
      const mockRealJobs = Array.from({ length: 6 }, (_, i) => ({
        id: `job-${i}`,
        slug: `featured-${i}`,
        featured: true,
        is_placeholder: false,
        order: i,
      }));

      vi.mocked(prismock.jobs.count).mockResolvedValue(6);
      vi.mocked(prismock.jobs.findMany).mockResolvedValueOnce(
        mockRealJobs as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getFeaturedJobs();

      expect(result).toHaveLength(6);
      expect(result.every((j) => !j.is_placeholder)).toBe(true);
    });
  });

  describe('getJobsByCategory', () => {
    it('should return jobs filtered by category', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          slug: 'engineering-job',
          category: 'engineering',
          status: 'active',
          active: true,
        },
      ];

      vi.mocked(prismock.jobs.findMany).mockResolvedValue(mockJobs as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobsByCategory({
        p_category: 'engineering',
      });

      expect(prismock.jobs.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          active: true,
          category: 'engineering',
        },
        orderBy: [
          { featured: 'desc' },
          { order: 'desc' },
          { posted_at: 'desc' },
        ],
      });
      expect(result).toEqual(mockJobs);
    });
  });

  describe('getJobsCount', () => {
    it('should return count of active jobs', async () => {
      vi.mocked(prismock.jobs.count).mockResolvedValue(42);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobsCount();

      expect(prismock.jobs.count).toHaveBeenCalledWith({
        where: {
          status: 'active',
          active: true,
        },
      });
      expect(result).toBe(42);
    });
  });

  describe('getJobStatsById', () => {
    it('should return job stats by ID', async () => {
      const mockJob = {
        view_count: 100,
        click_count: 50,
        status: 'active',
      };

      vi.mocked(prismock.jobs.findUnique).mockResolvedValue(mockJob as any);

      const result = await service.getJobStatsById('job-123');

      expect(prismock.jobs.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        select: {
          view_count: true,
          click_count: true,
          status: true,
        },
      });
      expect(result).toEqual(mockJob);
    });

    it('should return null for non-existent job', async () => {
      vi.mocked(prismock.jobs.findUnique).mockResolvedValue(null);

      const result = await service.getJobStatsById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getJobStatusById', () => {
    it('should return job status by ID', async () => {
      const mockJob = {
        status: 'active',
        expires_at: new Date('2024-12-31'),
      };

      vi.mocked(prismock.jobs.findUnique).mockResolvedValue(mockJob as any);

      const result = await service.getJobStatusById('job-123');

      expect(prismock.jobs.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        select: {
          status: true,
          expires_at: true,
        },
      });
      expect(result).toEqual(mockJob);
    });
  });

  describe('getPaymentPlanCatalog', () => {
    it('should return payment plan catalog', async () => {
      const mockPlans = [
        {
          plan: 'one-time',
          tier: 'standard',
          price_cents: 5000,
          is_subscription: false,
          billing_cycle_days: null,
          job_expiry_days: 30,
          description: 'Standard one-time',
          benefits: { featured: false },
          product_type: 'job_listing',
        },
      ];

      vi.mocked(prismock.payment_plan_catalog.findMany).mockResolvedValue(
        mockPlans as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getPaymentPlanCatalog();

      expect(prismock.payment_plan_catalog.findMany).toHaveBeenCalledWith({
        orderBy: [
          { plan: 'asc' },
          { tier: 'asc' },
        ],
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('plan', 'one-time');
      expect(result[0]).toHaveProperty('tier', 'standard');
    });
  });

  describe('getJobBillingSummaries', () => {
    it('should return job billing summaries', async () => {
      const mockSummaries = [
        {
          job_id: 'job-1',
          plan: 'subscription',
          tier: 'featured',
          price_cents: 10000,
          is_subscription: true,
          billing_cycle_days: 30,
          job_expiry_days: 60,
          last_payment_amount: 10000,
          last_payment_at: '2024-01-01',
          last_payment_status: 'completed',
          subscription_status: 'active',
          subscription_renews_at: '2024-02-01',
        },
      ];

      vi.mocked(prismock.$queryRaw).mockResolvedValue(mockSummaries as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobBillingSummaries({
        p_job_ids: ['job-1', 'job-2'],
      });

      expect(prismock.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(mockSummaries);
    });

    it('should return empty array for empty job IDs', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobBillingSummaries({
        p_job_ids: [],
      });

      expect(result).toEqual([]);
      expect(prismock.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('getJobTitleById', () => {
    it('should return job title by ID', async () => {
      const mockJob = { title: 'Senior Developer' };

      vi.mocked(prismock.jobs.findUnique).mockResolvedValue(mockJob as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobTitleById({
        p_job_id: 'job-123',
      });

      expect(prismock.jobs.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        select: { title: true },
      });
      expect(result).toBe('Senior Developer');
    });

    it('should return null for non-existent job', async () => {
      vi.mocked(prismock.jobs.findUnique).mockResolvedValue(null);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobTitleById({
        p_job_id: 'nonexistent',
      });

      expect(result).toBeNull();
    });
  });

  describe('getActiveJobSlugs', () => {
    it('should return active job slugs', async () => {
      const mockJobs = [
        { slug: 'job-1' },
        { slug: 'job-2' },
        { slug: 'job-3' },
      ];

      vi.mocked(prismock.jobs.findMany).mockResolvedValue(mockJobs as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getActiveJobSlugs(10);

      expect(prismock.jobs.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          active: true,
        },
        select: { slug: true },
        orderBy: { posted_at: 'desc' },
        take: 10,
      });
      expect(result).toEqual(['job-1', 'job-2', 'job-3']);
    });

    it('should respect limit parameter', async () => {
      vi.mocked(prismock.jobs.findMany).mockResolvedValue([]);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await service.getActiveJobSlugs(5);

      expect(prismock.jobs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });
});