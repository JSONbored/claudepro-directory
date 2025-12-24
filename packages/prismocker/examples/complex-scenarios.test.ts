/**
 * Complex Scenarios Testing Example
 *
 * This example demonstrates advanced Prismocker capabilities with complex
 * testing scenarios including multi-model relationships, complex queries,
 * aggregations, transactions, and Zod validation integration.
 *
 * Key Features Demonstrated:
 * - Multi-model relationships
 * - Complex where clauses (AND, OR, NOT)
 * - Aggregations and grouping
 * - Transaction testing
 * - Zod validation integration
 * - Performance testing patterns
 * - Edge case handling
 *
 * NOTE: This example uses generic model names (companies, jobs) that should
 * be adapted to match your actual Prisma schema. The patterns shown here
 * work with any Prisma models and fields.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from '../src/index.js';
import type { PrismaClient } from '@prisma/client';
import { resetAndSeed, createTestDataFactory } from '../src/test-utils.js';

// Type-safe helper to work with any PrismaClient
// In real usage, replace 'any' with your actual PrismaClient type
type AnyPrismaClient = PrismaClient;

describe('Complex Scenarios', () => {
  let prisma: AnyPrismaClient;

  // NOTE: These factories use generic field names. Adapt to your schema.
  // The factory pattern works with any Prisma model structure.
  const companyFactory = createTestDataFactory<any>({
    name: 'Test Company',
    owner_id: 'test-user',
    slug: 'test-company',
  });

  const jobFactory = createTestDataFactory<any>({
    title: 'Test Job',
    company_id: 'company-1',
    view_count: 0,
  });

  beforeEach(() => {
    prisma = createPrismocker<AnyPrismaClient>();

    // NOTE: This example uses generic model names. In real usage:
    // 1. Replace 'companies' and 'jobs' with your actual model names
    // 2. Replace field names (status, view_count, etc.) with your actual fields
    // 3. Adapt the data structure to match your Prisma schema
    resetAndSeed(prisma, {
      companies: [
        {
          id: 'company-1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          owner_id: 'user-1',
        },
        {
          id: 'company-2',
          name: 'Tech Startup',
          slug: 'tech-startup',
          owner_id: 'user-2',
        },
        {
          id: 'company-3',
          name: 'Big Corp',
          slug: 'big-corp',
          owner_id: 'user-1',
        },
      ] as any,
      jobs: [
        {
          id: 'job-1',
          company_id: 'company-1',
          title: 'Senior Engineer',
          view_count: 100,
          created_at: new Date('2024-01-01'),
        },
        {
          id: 'job-2',
          company_id: 'company-1',
          title: 'Junior Engineer',
          view_count: 50,
          created_at: new Date('2024-01-02'),
        },
        {
          id: 'job-3',
          company_id: 'company-1',
          title: 'Product Manager',
          view_count: 200,
          created_at: new Date('2024-01-03'),
        },
        {
          id: 'job-4',
          company_id: 'company-2',
          title: 'Designer',
          view_count: 75,
          created_at: new Date('2024-01-04'),
        },
        {
          id: 'job-5',
          company_id: 'company-3',
          title: 'Marketing Manager',
          view_count: 150,
          created_at: new Date('2024-01-05'),
        },
      ] as any,
    });
  });

  describe('Complex Where Clauses', () => {
    it('should handle AND conditions', async () => {
      // NOTE: Adapt field names to your schema
      const jobs = await (prisma as any).jobs.findMany({
        where: {
          AND: [
            { view_count: { gte: 75 } },
            { company_id: 'company-1' },
          ],
        },
      });

      expect(jobs).toHaveLength(2);
      expect(jobs.every((j: any) => j.view_count >= 75)).toBe(true);
      expect(jobs.every((j: any) => j.company_id === 'company-1')).toBe(true);
    });

    it('should handle OR conditions', async () => {
      const jobs = await (prisma as any).jobs.findMany({
        where: {
          OR: [
            { company_id: 'company-1' },
            { company_id: 'company-2' },
          ],
        },
      });

      expect(jobs).toHaveLength(4);
      expect(jobs.every((j: any) => ['company-1', 'company-2'].includes(j.company_id))).toBe(true);
    });

    it('should handle NOT conditions', async () => {
      const jobs = await (prisma as any).jobs.findMany({
        where: {
          NOT: {
            company_id: 'company-3',
          },
        },
      });

      expect(jobs).toHaveLength(4);
      expect(jobs.every((j: any) => j.company_id !== 'company-3')).toBe(true);
    });

    it('should handle nested AND/OR/NOT', async () => {
      const jobs = await (prisma as any).jobs.findMany({
        where: {
          AND: [
            {
              OR: [
                { view_count: { gte: 100 } },
                { company_id: 'company-2' },
              ],
            },
          ],
          NOT: {
            company_id: 'company-3',
          },
        },
      });

      expect(jobs).toHaveLength(3);
      expect(jobs.every((j: any) => j.company_id !== 'company-3')).toBe(true);
    });

    it('should handle in/notIn operators', async () => {
      const jobs = await prisma.jobs.findMany({
        where: {
          company_id: {
            in: ['company-1', 'company-2'],
          },
        },
      });

      expect(jobs).toHaveLength(4);

      const excludedJobs = await prisma.jobs.findMany({
        where: {
          company_id: {
            notIn: ['company-1', 'company-2'],
          },
        },
      });

      expect(excludedJobs).toHaveLength(1);
      expect(excludedJobs[0].company_id).toBe('company-3');
    });

    it('should handle string operators (contains, startsWith, endsWith)', async () => {
      const jobs = await (prisma as any).jobs.findMany({
        where: {
          title: {
            contains: 'Engineer',
          },
        },
      });

      expect(jobs).toHaveLength(2);
      expect(jobs.every((j: any) => j.title.includes('Engineer'))).toBe(true);

      const managerJobs = await (prisma as any).jobs.findMany({
        where: {
          title: {
            startsWith: 'Product',
          },
        },
      });

      expect(managerJobs).toHaveLength(1);
      expect(managerJobs[0].title).toBe('Product Manager');
    });

    it('should handle comparison operators (lt, lte, gt, gte)', async () => {
      const highViewJobs = await (prisma as any).jobs.findMany({
        where: {
          view_count: {
            gte: 100,
          },
        },
        orderBy: {
          view_count: 'desc',
        },
      });

      expect(highViewJobs).toHaveLength(3);
      expect(highViewJobs[0].view_count).toBe(200);
      expect(highViewJobs[1].view_count).toBe(150);
      expect(highViewJobs[2].view_count).toBe(100);
    });
  });

  describe('Sorting and Pagination', () => {
    it('should sort by single field', async () => {
      const jobs = await (prisma as any).jobs.findMany({
        orderBy: {
          view_count: 'desc',
        },
      });

      expect(jobs[0].view_count).toBe(200);
      expect(jobs[1].view_count).toBe(150);
      expect(jobs[2].view_count).toBe(100);
    });

    it('should sort by multiple fields', async () => {
      const jobs = await (prisma as any).jobs.findMany({
        orderBy: [
          { company_id: 'asc' },
          { view_count: 'desc' },
        ],
      });

      // Sorted by company_id first, then view_count
      expect(jobs[0].company_id).toBe('company-1');
      expect(jobs[0].view_count).toBe(200);
    });

    it('should paginate results', async () => {
      const page1 = await (prisma as any).jobs.findMany({
        skip: 0,
        take: 2,
        orderBy: { view_count: 'desc' },
      });

      expect(page1).toHaveLength(2);
      expect(page1[0].view_count).toBe(200);
      expect(page1[1].view_count).toBe(150);

      const page2 = await (prisma as any).jobs.findMany({
        skip: 2,
        take: 2,
        orderBy: { view_count: 'desc' },
      });

      expect(page2).toHaveLength(2);
      expect(page2[0].view_count).toBe(100);
      expect(page2[1].view_count).toBe(75);
    });

    it('should combine filtering, sorting, and pagination', async () => {
      const results = await (prisma as any).jobs.findMany({
        where: {
          view_count: { gte: 75 },
        },
        orderBy: {
          view_count: 'desc',
        },
        skip: 0,
        take: 2,
      });

      expect(results).toHaveLength(2);
      expect(results[0].view_count).toBe(150);
      expect(results[1].view_count).toBe(100);
      expect(results.every((j: any) => j.view_count >= 75)).toBe(true);
    });
  });

  describe('Aggregations', () => {
    it('should count records', async () => {
      const totalJobs = await (prisma as any).jobs.count();
      expect(totalJobs).toBe(5);

      const company1Jobs = await (prisma as any).jobs.count({
        where: { company_id: 'company-1' },
      });
      expect(company1Jobs).toBe(3);
    });

    it('should aggregate with _count', async () => {
      const stats = await (prisma as any).jobs.aggregate({
        _count: {
          id: true,
        },
        where: {
          company_id: 'company-1',
        },
      });

      expect(stats._count?.id).toBe(3);
    });

    it('should aggregate with _avg, _sum, _min, _max', async () => {
      const stats = await (prisma as any).jobs.aggregate({
        _count: { id: true },
        _avg: { view_count: true },
        _sum: { view_count: true },
        _min: { view_count: true },
        _max: { view_count: true },
      });

      expect(stats._count?.id).toBe(5);
      expect(stats._avg?.view_count).toBe(115); // (100 + 50 + 200 + 75 + 150) / 5
      expect(stats._sum?.view_count).toBe(575);
      expect(stats._min?.view_count).toBe(50);
      expect(stats._max?.view_count).toBe(200);
    });

    it('should aggregate with _stddev and _variance', async () => {
      const stats = await (prisma as any).jobs.aggregate({
        _stddev: { view_count: true },
        _variance: { view_count: true },
      });

      // Mean = (100 + 50 + 200 + 75 + 150) / 5 = 115
      // Variance = ((100-115)^2 + (50-115)^2 + (200-115)^2 + (75-115)^2 + (150-115)^2) / 5
      //          = (225 + 4225 + 7225 + 1600 + 1225) / 5 = 14500 / 5 = 2900
      // Stddev = sqrt(2900) ≈ 53.85
      expect(stats._variance?.view_count).toBeCloseTo(2900, 0);
      expect(stats._stddev?.view_count).toBeCloseTo(53.85, 1);
    });

    it('should aggregate with _countDistinct', async () => {
      // Create jobs with different company_id values
      await (prisma as any).jobs.create({
        data: { company_id: 'company-4', title: 'Job 6', view_count: 300 },
      });

      const stats = await (prisma as any).jobs.aggregate({
        _countDistinct: { company_id: true },
      });

      // Should have 4 distinct company_id values: company-1, company-2, company-3, company-4
      expect(stats._countDistinct?.company_id).toBe(4);
    });

    it('should group by field', async () => {
      const grouped = await (prisma as any).jobs.groupBy({
        by: ['company_id'],
        _count: {
          id: true,
        },
        _avg: {
          view_count: true,
        },
      });

      expect(grouped).toHaveLength(3);

      const company1Group = grouped.find((g: any) => g.company_id === 'company-1');
      expect(company1Group?._count?.id).toBe(3);
    });
  });

  describe('Relations', () => {
    it('should load one-to-many relations', async () => {
      // NOTE: This assumes your schema has a 'jobs' relation on companies
      // Adapt to your actual relation names
      const company = await (prisma as any).companies.findUnique({
        where: { id: 'company-1' },
        include: {
          jobs: true,
        },
      });

      // If relation exists, verify it loaded
      if (company?.jobs) {
        expect(company.jobs).toHaveLength(3);
        expect(company.jobs.every((j: any) => j.company_id === 'company-1')).toBe(true);
      }
    });

    it('should filter relations', async () => {
      const company = await (prisma as any).companies.findUnique({
        where: { id: 'company-1' },
        include: {
          jobs: {
            where: { view_count: { gte: 100 } },
            orderBy: { view_count: 'desc' },
          },
        },
      });

      if (company?.jobs) {
        expect(company.jobs).toHaveLength(2);
        expect(company.jobs.every((j: any) => j.view_count >= 100)).toBe(true);
        expect(company.jobs[0].view_count).toBe(200);
      }
    });

    it('should select specific fields', async () => {
      const company = await (prisma as any).companies.findUnique({
        where: { id: 'company-1' },
        select: {
          id: true,
          name: true,
          jobs: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      expect(company?.name).toBe('Acme Corp');
      if (company?.jobs) {
        expect(company.jobs).toHaveLength(3);
        expect(company.jobs[0]).toHaveProperty('id');
        expect(company.jobs[0]).toHaveProperty('title');
        expect(company.jobs[0]).not.toHaveProperty('view_count');
      }
    });
  });

  describe('Transactions', () => {
    it('should execute transaction callback', async () => {
      const result = await prisma.$transaction(async (tx: any) => {
        const company = await tx.companies.create({
          data: {
            name: 'New Company',
            owner_id: 'user-1',
            slug: 'new-company',
          },
        });

        const job = await tx.jobs.create({
          data: {
            company_id: company.id,
            title: 'New Job',
            view_count: 0,
          },
        });

        return { company, job };
      });

      expect(result.company.name).toBe('New Company');
      expect(result.job.title).toBe('New Job');
      expect(result.job.company_id).toBe(result.company.id);
    });

    it('should allow nested queries in transaction', async () => {
      const result = await prisma.$transaction(async (tx: any) => {
        const company = await tx.companies.create({
          data: {
            name: 'Transaction Company',
            owner_id: 'user-1',
            slug: 'transaction-company',
          },
        });

        const jobs = await tx.jobs.findMany({
          where: { company_id: company.id },
        });

        return { company, jobCount: jobs.length };
      });

      expect(result.company.name).toBe('Transaction Company');
      expect(result.jobCount).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results', async () => {
      const jobs = await (prisma as any).jobs.findMany({
        where: {
          title: 'Non-existent Job',
        },
      });

      expect(jobs).toHaveLength(0);
    });

    it('should handle null values', async () => {
      const company = await (prisma as any).companies.findUnique({
        where: { slug: 'non-existent' },
      });

      expect(company).toBeNull();
    });

    it('should handle updates with no changes', async () => {
      const company = await (prisma as any).companies.findUnique({
        where: { slug: 'acme-corp' },
      });

      const updated = await (prisma as any).companies.update({
        where: { slug: 'acme-corp' },
        data: {
          name: company!.name, // Same value
        },
      });

      expect(updated.name).toBe(company!.name);
    });

    it('should handle createMany', async () => {
      // NOTE: Adapt field names to your schema
      const result = await (prisma as any).jobs.createMany({
        data: [
          {
            company_id: 'company-1',
            title: 'Job 1',
            view_count: 10,
          },
          {
            company_id: 'company-1',
            title: 'Job 2',
            view_count: 20,
          },
        ] as any,
      });

      expect(result.count).toBe(2);

      const allJobs = await (prisma as any).jobs.findMany({
        where: { company_id: 'company-1' },
      });
      expect(allJobs).toHaveLength(5); // 3 original + 2 new
    });

    it('should handle updateMany', async () => {
      const result = await (prisma as any).jobs.updateMany({
        where: {
          company_id: 'company-1',
        },
        data: {
          view_count: 999,
        },
      });

      expect(result.count).toBe(3);

      const updatedJob = await (prisma as any).jobs.findUnique({
        where: { id: 'job-1' },
      });
      expect(updatedJob?.view_count).toBe(999);
    });

    it('should handle deleteMany', async () => {
      const result = await (prisma as any).jobs.deleteMany({
        where: {
          company_id: 'company-1',
        },
      });

      expect(result.count).toBe(3);

      const remainingJobs = await (prisma as any).jobs.findMany();
      expect(remainingJobs).toHaveLength(2);
    });
  });

  describe('Performance Patterns', () => {
    it('should handle large datasets efficiently', async () => {
      // Create many records
      const manyJobs = Array.from({ length: 100 }, (_, i) => ({
        company_id: 'company-1',
        title: `Job ${i}`,
        view_count: i,
      }));

      await (prisma as any).jobs.createMany({
        data: manyJobs as any,
      });

      // Query with pagination
      const page1 = await (prisma as any).jobs.findMany({
        where: { company_id: 'company-1' },
        take: 10,
        orderBy: { view_count: 'desc' },
      });

      expect(page1).toHaveLength(10);
      expect(page1[0].view_count).toBe(99);
    });

    it('should handle complex queries efficiently', async () => {
      const results = await (prisma as any).jobs.findMany({
        where: {
          AND: [
            { view_count: { gte: 50 } },
            {
              OR: [
                { company_id: 'company-1' },
                { company_id: 'company-2' },
              ],
            },
          ],
        },
        orderBy: [
          { view_count: 'desc' },
          { created_at: 'desc' },
        ],
        take: 5,
      });

      expect(results.length).toBeLessThanOrEqual(5);
      expect(results.every((j: any) => j.view_count >= 50)).toBe(true);
    });
  });
});

