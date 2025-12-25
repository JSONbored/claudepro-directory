import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { JobsService } from './jobs.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '../utils/request-cache.ts';

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

describe('JobsService', () => {
  let service: JobsService;
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Clear request cache for test isolation (each test starts with empty cache)
    clearRequestCache();

    // Prismocker doesn't support $queryRawUnsafe, $queryRaw, etc., so we add them as mock functions
    queryRawUnsafeSpy = jest.fn().mockResolvedValue([]);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;
    (prismocker as any).$queryRaw = jest.fn().mockResolvedValue([]);

    // Ensure Prismocker models are initialized
    void prismocker.jobs;
    void prismocker.payment_plan_catalog;

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
          order: 2, // Higher order = appears first (order: 'desc')
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
          order: 1, // Lower order = appears second (order: 'desc')
          created_at: new Date('2024-01-02T00:00:00Z'),
          updated_at: new Date('2024-01-02T00:00:00Z'),
        },
      ];

      // Use Prismocker's setData to seed test data (proper Prismocker usage)
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', mockJobs);
      }

      const result = await service.getJobs();

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

    it('should cache results on duplicate calls (caching test)', async () => {
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
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', mockJobs);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await service.getJobs();
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call - should hit cache (no database call)
      const result2 = await service.getJobs();
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(1);
    });

    it('returns empty array when no jobs exist', async () => {
      // Use Prismocker's setData to seed empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', []);
      }

      const result = await service.getJobs();

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Database connection failed');

      // Spy on findMany to throw error
      const findManySpy = jest.spyOn(prismocker.jobs, 'findMany');
      findManySpy.mockRejectedValue(mockError);

      await expect(service.getJobs()).rejects.toThrow('Database connection failed');

      findManySpy.mockRestore();
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

      // Use Prismocker's setData to seed test data
      // Note: getJobBySlug uses findUnique with companies relation, so we need both jobs and companies
      // The job needs a company_id foreign key pointing to the company
      const companyId = 'company-1';
      const jobWithCompanyId = {
        ...mockJob,
        company_id: companyId, // Foreign key for companies relation
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', [jobWithCompanyId]);
        (prismocker as any).setData('companies', [
          {
            id: companyId,
            name: 'Test Company',
            slug: 'test-company',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
      }

      const result = await service.getJobBySlug({ p_slug: 'senior-developer' });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('job-1');
      expect(result?.slug).toBe('senior-developer');
      expect(result?.title).toBe('Senior Developer');
      expect(result?.company).toBe('Test Company'); // Transformed from companies.name
      expect(typeof result?.posted_at).toBe('string'); // Dates converted to ISO strings
    });

    it('should cache results on duplicate calls (caching test)', async () => {
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
          id: 'company-1',
          name: 'Test Company',
        },
      };

      // Use Prismocker's setData to seed test data
      const companyId = 'company-1';
      const jobWithCompanyId = {
        ...mockJob,
        company_id: companyId, // Foreign key for companies relation
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', [jobWithCompanyId]);
        (prismocker as any).setData('companies', [
          {
            id: companyId,
            name: 'Test Company',
            slug: 'test-company',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await service.getJobBySlug({ p_slug: 'senior-developer' });
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await service.getJobBySlug({ p_slug: 'senior-developer' });
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).not.toBeNull();
    });

    it('handles job not found', async () => {
      // Use Prismocker's setData to seed empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', []);
      }

      const result = await service.getJobBySlug({ p_slug: 'nonexistent-job' });

      expect(result).toBeNull();
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Job not found');

      // Spy on findUnique to throw error
      const findUniqueSpy = jest.spyOn(prismocker.jobs, 'findUnique');
      findUniqueSpy.mockRejectedValue(mockError);

      await expect(service.getJobBySlug({ p_slug: 'deleted-job' })).rejects.toThrow(
        'Job not found'
      );

      findUniqueSpy.mockRestore();
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

      // Use Prismocker's setData to seed test data
      const companyId = 'company-1';
      const jobWithCompanyId = {
        ...mockJob,
        company_id: companyId, // Foreign key for companies relation
      };

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', [jobWithCompanyId]);
        (prismocker as any).setData('companies', [
          {
            id: companyId,
            name: 'Test Company',
            slug: 'test-company',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
      }

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

      // Use Prismocker's setData to seed test data
      // getFeaturedJobs uses count() and findMany() twice
      // First findMany gets real jobs, second gets placeholders
      // Need to add required fields for the where clause
      const fullMockRealJobs = mockRealJobs.map((job) => ({
        ...job,
        status: 'active' as const,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }));
      const fullMockPlaceholders = mockPlaceholders.map((job) => ({
        ...job,
        status: 'active' as const,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        // Seed real jobs (count will return 2)
        (prismocker as any).setData('jobs', [...fullMockRealJobs, ...fullMockPlaceholders]);
      }

      // Spy on findMany to return different results for the two calls
      const findManySpy = jest.spyOn(prismocker.jobs, 'findMany');
      findManySpy
        .mockResolvedValueOnce(fullMockRealJobs as any)
        .mockResolvedValueOnce(fullMockPlaceholders as any);

      const result = await service.getFeaturedJobs();

      findManySpy.mockRestore();

      expect(result).toHaveLength(3); // 2 real + 1 placeholder
      expect(result[0].is_placeholder).toBe(false);
      expect(result[2].is_placeholder).toBe(true);
    });

    it('should return only real jobs if 6+ exist', async () => {
      // getFeaturedJobs filters by: status='active', active=true, featured=true, is_placeholder=false
      // It also selects specific fields, so we need to include all required fields
      const mockRealJobs = Array.from({ length: 6 }, (_, i) => ({
        id: `job-${i}`,
        slug: `featured-${i}`,
        title: `Featured Job ${i}`,
        company: `Company ${i}`,
        company_logo: `https://example.com/logo-${i}.png`,
        location: 'Remote',
        remote: true,
        type: 'full-time' as const,
        category: 'engineering' as const,
        tags: [],
        posted_at: new Date(),
        link: `https://example.com/job-${i}`,
        tier: 'standard' as const,
        description: `Description ${i}`,
        salary: `$${i * 10}k`,
        status: 'active' as const,
        active: true,
        featured: true,
        is_placeholder: false,
        order: i,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // Use Prismocker's setData to seed test data
      // getFeaturedJobs will count these and find 6, so it won't add placeholders
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', mockRealJobs);
      }

      const result = await service.getFeaturedJobs();

      expect(result).toHaveLength(6);
      expect(result.every((j) => !j.is_placeholder)).toBe(true);
    });
  });

  describe('getJobsByCategory', () => {
    it('should return jobs filtered by category', async () => {
      // getJobsByCategory uses prisma.jobs.findMany with select (14 fields)
      // Need all required fields for the where clause to match
      const mockJobs = [
        {
          id: 'job-1',
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
          status: 'active' as const,
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', mockJobs);
      }

      const result = await service.getJobsByCategory({
        p_category: 'engineering',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'engineering-job',
        title: 'Engineering Job',
        category: 'engineering',
      });
    });
  });

  describe('getJobsCount', () => {
    it('should return count of active jobs', async () => {
      // Use Prismocker's setData to seed test data
      // getJobsCount uses count(), so we need jobs in the store
      const mockJobs = Array.from({ length: 42 }, (_, i) => ({
        id: `job-${i}`,
        slug: `job-${i}`,
        title: `Job ${i}`,
        status: 'active' as const,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', mockJobs);
      }

      const result = await service.getJobsCount();

      expect(result).toBe(42);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockJobs = Array.from({ length: 10 }, (_, i) => ({
        id: `job-${i}`,
        slug: `job-${i}`,
        title: `Job ${i}`,
        status: 'active' as const,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', mockJobs);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await service.getJobsCount();
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call - should hit cache (no database call)
      const result2 = await service.getJobsCount();
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toBe(result2);
      expect(result1).toBe(10);
    });
  });

  describe('getJobStatsById', () => {
    it('should return job stats by ID', async () => {
      const mockJob = {
        id: 'job-123',
        view_count: 100,
        click_count: 50,
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', [mockJob]);
      }

      const result = await service.getJobStatsById('job-123');

      expect(result).toEqual({
        view_count: 100,
        click_count: 50,
        status: 'active',
      });
    });

    it('should return null for non-existent job', async () => {
      // Use Prismocker's setData to seed empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', []);
      }

      const result = await service.getJobStatsById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getJobStatusById', () => {
    it('should return job status by ID', async () => {
      const mockJob = {
        id: 'job-123',
        status: 'active' as const,
        expires_at: new Date('2024-12-31'),
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', [mockJob]);
      }

      const result = await service.getJobStatusById('job-123');

      expect(result).toEqual({
        status: 'active',
        expires_at: new Date('2024-12-31'),
      });
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

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('payment_plan_catalog', mockPlans);
      }

      const result = await service.getPaymentPlanCatalog();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('plan', 'one-time');
      expect(result[0]).toHaveProperty('tier', 'standard');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
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

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('payment_plan_catalog', mockPlans);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await service.getPaymentPlanCatalog();
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call - should hit cache (no database call)
      const result2 = await service.getPaymentPlanCatalog();
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(1);
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

      const queryRawSpy = jest.fn().mockResolvedValue(mockSummaries);
      (prismocker as any).$queryRaw = queryRawSpy;

      // Note: getJobBillingSummaries uses $queryRaw, which is not cached by withSmartCache
      // (RPC calls are not cached)
      const result = await service.getJobBillingSummaries({
        p_job_ids: ['job-1', 'job-2'],
      });

      expect(result).toEqual(mockSummaries);
      expect(queryRawSpy).toHaveBeenCalled();
    });

    it('should return empty array for empty job IDs', async () => {
      // Note: getJobBillingSummaries uses $queryRaw, which is not cached by withSmartCache
      const queryRawSpy = jest.fn().mockResolvedValue([]);
      (prismocker as any).$queryRaw = queryRawSpy;

      const result = await service.getJobBillingSummaries({
        p_job_ids: [],
      });

      expect(result).toEqual([]);
      expect(queryRawSpy).not.toHaveBeenCalled();
    });
  });

  describe('getJobTitleById', () => {
    it('should return job title by ID', async () => {
      const mockJob = {
        id: 'job-123',
        title: 'Senior Developer',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', [mockJob]);
      }

      const result = await service.getJobTitleById({
        p_job_id: 'job-123',
      });

      expect(result).toBe('Senior Developer');
    });

    it('should return null for non-existent job', async () => {
      // Use Prismocker's setData to seed empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', []);
      }

      const result = await service.getJobTitleById({
        p_job_id: 'nonexistent',
      });

      expect(result).toBeNull();
    });
  });

  describe('getActiveJobSlugs', () => {
    it('should return active job slugs', async () => {
      // getActiveJobSlugs orders by created_at: 'desc' (newest first)
      // So job-3 (newest) should be first
      const mockJobs = [
        {
          id: 'job-1',
          slug: 'job-1',
          status: 'active' as const,
          active: true,
          created_at: new Date('2024-01-01T00:00:00Z'), // Oldest
          updated_at: new Date(),
        },
        {
          id: 'job-2',
          slug: 'job-2',
          status: 'active' as const,
          active: true,
          created_at: new Date('2024-01-02T00:00:00Z'), // Middle
          updated_at: new Date(),
        },
        {
          id: 'job-3',
          slug: 'job-3',
          status: 'active' as const,
          active: true,
          created_at: new Date('2024-01-03T00:00:00Z'), // Newest
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', mockJobs);
      }

      const result = await service.getActiveJobSlugs(10);

      // Ordered by created_at: 'desc' (newest first), so job-3 comes first
      expect(result).toEqual(['job-3', 'job-2', 'job-1']);
    });

    it('should respect limit parameter', async () => {
      // Create 10 jobs but limit to 5
      const mockJobs = Array.from({ length: 10 }, (_, i) => ({
        id: `job-${i}`,
        slug: `job-${i}`,
        status: 'active' as const,
        active: true,
        created_at: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        updated_at: new Date(),
      }));

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', mockJobs);
      }

      const result = await service.getActiveJobSlugs(5);

      // Should return only 5 jobs (respecting limit)
      expect(result).toHaveLength(5);
    });
  });
});
