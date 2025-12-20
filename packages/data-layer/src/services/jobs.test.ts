import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JobsService } from './jobs.ts';
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

describe('JobsService', () => {
  let service: JobsService;
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

    // Prismock doesn't support $queryRawUnsafe, $queryRaw, etc., so we add them as mock functions
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;
    (prismock as any).$queryRaw = vi.fn().mockResolvedValue([]);

    // Ensure Prismock models are initialized
    void prismock.jobs;
    void prismock.payment_plan_catalog;

    service = new JobsService();
  });

  describe('getJobs', () => {
    it('returns list of jobs on success', async () => {
      // getJobs uses prisma.jobs.findMany with select and orderBy
      const mockJobs = [
        {
          id: 'job-1',
          slug: 'senior-developer',
          title: 'Senior Developer',
          company: 'Test Company',
          description: 'Test description',
          location: 'Remote',
          remote: true,
          salary: '$100k-$150k',
          type: 'full-time' as const,
          category: 'engineering' as const,
          tags: ['TypeScript', 'React'],
          requirements: ['5+ years'],
          benefits: ['Health insurance'],
          link: 'https://example.com',
          contact_email: 'jobs@example.com',
          posted_at: new Date('2024-01-01T00:00:00Z'),
          expires_at: new Date('2024-02-01T00:00:00Z'),
          active: true,
          status: 'active' as const,
          plan: 'one-time' as const,
          tier: 'standard' as const,
          order: 1,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: 'job-2',
          slug: 'junior-designer',
          title: 'Junior Designer',
          company: 'Design Co',
          description: 'Test description',
          location: 'San Francisco',
          remote: false,
          salary: '$60k-$80k',
          type: 'full-time' as const,
          category: 'design' as const,
          tags: ['Figma', 'Sketch'],
          requirements: ['2+ years'],
          benefits: ['Health insurance'],
          link: 'https://example.com',
          contact_email: 'jobs@example.com',
          posted_at: new Date('2024-01-02T00:00:00Z'),
          expires_at: new Date('2024-02-02T00:00:00Z'),
          active: true,
          status: 'active' as const,
          plan: 'one-time' as const,
          tier: 'standard' as const,
          order: 2,
          created_at: new Date('2024-01-02T00:00:00Z'),
          updated_at: new Date('2024-01-02T00:00:00Z'),
        },
      ];

      mockPrismockMethod(prismock.jobs, 'findMany', mockJobs);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobs();

      expect(prismock.jobs.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          active: true,
        },
        orderBy: [{ order: 'desc' }, { posted_at: 'desc' }],
        select: expect.objectContaining({
          id: true,
          slug: true,
          title: true,
          company: true,
        }),
      });
      
      // Result should have dates converted to ISO strings
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'job-1',
        slug: 'senior-developer',
        title: 'Senior Developer',
        company: 'Test Company',
      });
      expect(typeof result[0].posted_at).toBe('string');
      expect(result[0].posted_at).toBe('2024-01-01T00:00:00.000Z');
    });

    it('returns empty array when no jobs exist', async () => {
      mockPrismockMethod(prismock.jobs, 'findMany', []);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobs();

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Database connection failed');

      mockPrismockMethod(prismock.jobs, 'findMany', Promise.reject(mockError));

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await expect(service.getJobs()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getJobBySlug', () => {
    it('returns job detail on success', async () => {
      // getJobBySlug uses prisma.jobs.findUnique with select and relationLoadStrategy: 'join'
      const mockJob = {
        id: 'job-1',
        slug: 'senior-developer',
        title: 'Senior Developer',
        description: 'We are looking for a senior developer...',
        location: 'Remote',
        remote: true,
        salary: '$100k-$150k',
        type: 'full-time' as const,
        category: 'engineering' as const,
        tags: ['TypeScript', 'React', 'Node.js'],
        requirements: ['5+ years'],
        benefits: ['Health insurance'],
        link: 'https://example.com',
        contact_email: 'jobs@example.com',
        posted_at: new Date('2024-01-01T00:00:00Z'),
        expires_at: new Date('2024-02-01T00:00:00Z'),
        active: true,
        status: 'active' as const,
        plan: 'one-time' as const,
        tier: 'standard' as const,
        order: 1,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        companies: {
          name: 'Test Company',
        },
      };

      mockPrismockMethod(prismock.jobs, 'findUnique', mockJob);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobBySlug({ p_slug: 'senior-developer' });

      expect(prismock.jobs.findUnique).toHaveBeenCalledWith({
        where: { slug: 'senior-developer' },
        select: expect.objectContaining({
          id: true,
          slug: true,
          title: true,
          companies: {
            select: {
              name: true,
            },
          },
        }),
        relationLoadStrategy: 'join',
      });
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('job-1');
      expect(result?.slug).toBe('senior-developer');
      expect(result?.title).toBe('Senior Developer');
      expect(result?.company).toBe('Test Company'); // Transformed from companies.name
      expect(typeof result?.posted_at).toBe('string'); // Dates converted to ISO strings
    });

    it('handles job not found', async () => {
      mockPrismockMethod(prismock.jobs, 'findUnique', null);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobBySlug({ p_slug: 'nonexistent-job' });

      expect(result).toBeNull();
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Job not found');

      mockPrismockMethod(prismock.jobs, 'findUnique', Promise.reject(mockError));

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await expect(service.getJobBySlug({ p_slug: 'deleted-job' })).rejects.toThrow(
        'Job not found'
      );
    });

    it('handles expired jobs', async () => {
      // Expired jobs are still returned, just with expires_at in the past
      const mockJob = {
        id: 'job-expired',
        slug: 'expired-job',
        title: 'Expired Job',
        description: 'Test',
        location: 'Remote',
        remote: true,
        salary: null,
        type: 'full-time' as const,
        category: 'engineering' as const,
        tags: [],
        requirements: null,
        benefits: null,
        link: null,
        contact_email: null,
        posted_at: new Date('2023-01-01T00:00:00Z'),
        expires_at: new Date('2023-01-01T00:00:00Z'),
        active: false,
        status: 'expired' as const,
        plan: 'one-time' as const,
        tier: null,
        order: 0,
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
        companies: {
          name: 'Test Company',
        },
      };

      mockPrismockMethod(prismock.jobs, 'findUnique', mockJob);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getJobBySlug({ p_slug: 'expired-job' });

      expect(result).not.toBeNull();
      expect(result?.expires_at).toBe('2023-01-01T00:00:00.000Z');
      expect(result?.active).toBe(false);
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

      mockPrismockMethod(prismock.jobs, 'count', 2);
      const findManyMock = vi.fn()
        .mockResolvedValueOnce(mockRealJobs)
        .mockResolvedValueOnce(mockPlaceholders);
      prismock.jobs.findMany = findManyMock;

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

      mockPrismockMethod(prismock.jobs, 'count', 6);
      const findManyMock2 = vi.fn().mockResolvedValueOnce(mockRealJobs);
      prismock.jobs.findMany = findManyMock2;

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getFeaturedJobs();

      expect(result).toHaveLength(6);
      expect(result.every((j) => !j.is_placeholder)).toBe(true);
    });
  });

  describe('getJobsByCategory', () => {
    it('should return jobs filtered by category', async () => {
      // getJobsByCategory uses prisma.jobs.findMany with select (14 fields)
      const mockJobs = [
        {
          slug: 'engineering-job',
          title: 'Engineering Job',
          company: 'Test Company',
          company_logo: 'https://example.com/logo.png',
          location: 'Remote',
          remote: true,
          type: 'full-time' as const,
          category: 'engineering' as const,
          tags: ['TypeScript'],
          posted_at: new Date('2024-01-01T00:00:00Z'),
          link: 'https://example.com',
          tier: 'standard' as const,
          description: 'Test description',
          salary: '$100k-$150k',
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
        select: expect.objectContaining({
          slug: true,
          title: true,
          company: true,
          category: true,
        }),
        orderBy: [{ featured: 'desc' }, { order: 'desc' }, { posted_at: 'desc' }],
      });
      expect(result).toEqual(mockJobs);
    });
  });

  describe('getJobsCount', () => {
    it('should return count of active jobs', async () => {
      mockPrismockMethod(prismock.jobs, 'count', 42);

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

      mockPrismockMethod(prismock.jobs, 'findUnique', mockJob);

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
      mockPrismockMethod(prismock.jobs, 'findUnique', null);

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

      mockPrismockMethod(prismock.jobs, 'findUnique', mockJob);

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

      mockPrismockMethod(prismock.payment_plan_catalog, 'findMany', mockPlans);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getPaymentPlanCatalog();

      expect(prismock.payment_plan_catalog.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          plan: true,
          tier: true,
          price_cents: true,
          is_subscription: true,
          billing_cycle_days: true,
          job_expiry_days: true,
          description: true,
          benefits: true,
          product_type: true,
        }),
        orderBy: [{ plan: 'asc' }, { tier: 'asc' }],
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

      const queryRawSpy = vi.fn().mockResolvedValue(mockSummaries);
(prismock as any).$queryRaw = queryRawSpy;

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

      mockPrismockMethod(prismock.jobs, 'findUnique', mockJob);

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
      mockPrismockMethod(prismock.jobs, 'findUnique', null);

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
      const mockJobs = [{ slug: 'job-1' }, { slug: 'job-2' }, { slug: 'job-3' }];

      mockPrismockMethod(prismock.jobs, 'findMany', mockJobs);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getActiveJobSlugs(10);

      expect(prismock.jobs.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          active: true,
        },
        select: { slug: true },
        orderBy: { created_at: 'desc' }, // Implementation uses created_at, not posted_at
        take: 10,
      });
      expect(result).toEqual(['job-1', 'job-2', 'job-3']);
    });

    it('should respect limit parameter', async () => {
      mockPrismockMethod(prismock.jobs, 'findMany', []);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await service.getActiveJobSlugs(5);

      expect(prismock.jobs.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    });
  });
});
