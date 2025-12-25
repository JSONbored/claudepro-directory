/**
 * Integration Tests for Prismocker
 *
 * End-to-end tests that verify Prismocker works correctly in real-world scenarios.
 * These tests simulate actual usage patterns and complex query scenarios.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from '../../index.js';
import type { PrismaClient } from '@prisma/client';
import { isPrismockerClient } from '../../jest-helpers.js';
import { setDataTyped, getDataTyped } from '../../prisma-types.js';

describe('Prismocker Integration Tests', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    if (isPrismockerClient(prisma)) {
      prisma.reset();
    }
  });

  describe('Complex Query Scenarios', () => {
    it('should handle complex nested queries with multiple conditions', async () => {
      // Seed data using companies model (from actual schema)
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          {
            id: 'comp-1',
            name: 'Company A',
            owner_id: 'owner-1',
            slug: 'company-a',
            featured: true,
          },
          {
            id: 'comp-2',
            name: 'Company B',
            owner_id: 'owner-2',
            slug: 'company-b',
            featured: true,
          },
          {
            id: 'comp-3',
            name: 'Company C',
            owner_id: 'owner-3',
            slug: 'company-c',
            featured: false,
          },
        ]);
      }

      // Complex query: featured companies owned by specific owners
      const result = await prisma.companies.findMany({
        where: {
          AND: [{ featured: true }, { owner_id: { in: ['owner-1', 'owner-2'] } }],
        },
        orderBy: { name: 'asc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Company A');
      expect(result[1].name).toBe('Company B');
    });

    it('should handle pagination with complex filters', async () => {
      // Seed data using jobs model (from actual schema)
      if (isPrismockerClient(prisma)) {
        setDataTyped(
          prisma,
          'jobs',
          Array.from({ length: 20 }, (_, i) => ({
            id: `job-${i}`,
            title: `Job ${i}`,
            company: `Company ${i}`,
            company_id: `comp-${i}`,
            description: `Description ${i}`,
            link: `https://example.com/job-${i}`,
            type: 'full-time' as const,
            category: 'engineering' as const,
            status: (i % 2 === 0 ? 'published' : 'draft') as const,
            view_count: i * 10,
            slug: `job-${i}`,
          }))
        );
      }

      // Get second page of published jobs, sorted by view_count
      const result = await prisma.jobs.findMany({
        where: { status: 'published' },
        orderBy: { view_count: 'desc' },
        skip: 5,
        take: 5,
      });

      expect(result).toHaveLength(5);
      expect(result.every((j) => j.status === 'published')).toBe(true);
    });
  });

  describe('Transaction Scenarios', () => {
    it('should handle successful transaction with multiple operations', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          {
            id: 'comp-1',
            name: 'Company 1',
            owner_id: 'owner-1',
            slug: 'company-1',
            featured: false,
          },
        ]);
        setDataTyped(prisma, 'jobs', []);
      }

      await prisma.$transaction(async (tx) => {
        await tx.companies.update({
          where: { id: 'comp-1' },
          data: { featured: true },
        });
        await tx.jobs.create({
          data: {
            id: 'job-1',
            title: 'Job 1',
            company: 'Company 1',
            company_id: 'comp-1',
            description: 'Description',
            link: 'https://example.com',
            type: 'full-time',
            category: 'engineering',
            slug: 'job-1',
          },
        });
      });

      const company = await prisma.companies.findUnique({ where: { id: 'comp-1' } });
      expect(company?.featured).toBe(true);
      const jobs = await prisma.jobs.findMany();
      expect(jobs).toHaveLength(1);
    });

    it('should rollback transaction on error', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          {
            id: 'comp-1',
            name: 'Company 1',
            owner_id: 'owner-1',
            slug: 'company-1',
            featured: false,
          },
        ]);
      }

      try {
        await prisma.$transaction(async (tx) => {
          await tx.companies.update({
            where: { id: 'comp-1' },
            data: { featured: true },
          });
          throw new Error('Transaction failed');
        });
      } catch (error) {
        // Expected error
      }

      const company = await prisma.companies.findUnique({ where: { id: 'comp-1' } });
      expect(company?.featured).toBe(false); // Should be unchanged
    });
  });

  describe('Relation Queries', () => {
    it('should handle one-to-many relations with include', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
        ]);
        setDataTyped(prisma, 'jobs', [
          {
            id: 'job-1',
            company_id: 'comp-1',
            title: 'Job 1',
            company: 'Company 1',
            description: 'Description 1',
            link: 'https://example.com',
            type: 'full-time',
            category: 'engineering',
            slug: 'job-1',
          },
          {
            id: 'job-2',
            company_id: 'comp-1',
            title: 'Job 2',
            company: 'Company 1',
            description: 'Description 2',
            link: 'https://example.com',
            type: 'full-time',
            category: 'engineering',
            slug: 'job-2',
          },
        ]);
      }

      const company = await prisma.companies.findUnique({
        where: { id: 'comp-1' },
        include: { jobs: true },
      });

      expect(company).toBeDefined();
      expect(company?.jobs).toHaveLength(2);
    });

    it('should handle relation filters (some, every, none)', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
          { id: 'comp-2', name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
        ]);
        setDataTyped(prisma, 'jobs', [
          {
            id: 'job-1',
            company_id: 'comp-1',
            title: 'Job 1',
            company: 'Company 1',
            description: 'Description',
            link: 'https://example.com',
            type: 'full-time',
            category: 'engineering',
            status: 'published',
            slug: 'job-1',
          },
          {
            id: 'job-2',
            company_id: 'comp-1',
            title: 'Job 2',
            company: 'Company 1',
            description: 'Description',
            link: 'https://example.com',
            type: 'full-time',
            category: 'engineering',
            status: 'draft',
            slug: 'job-2',
          },
          {
            id: 'job-3',
            company_id: 'comp-2',
            title: 'Job 3',
            company: 'Company 2',
            description: 'Description',
            link: 'https://example.com',
            type: 'full-time',
            category: 'engineering',
            status: 'draft',
            slug: 'job-3',
          },
        ]);
      }

      // Companies with at least one published job
      const companiesWithPublishedJobs = await prisma.companies.findMany({
        where: {
          jobs: { some: { status: 'published' } },
        },
      });

      expect(companiesWithPublishedJobs).toHaveLength(1);
      expect(companiesWithPublishedJobs[0].id).toBe('comp-1');
    });
  });

  describe('Performance with Large Datasets', () => {
    it('should handle large datasets efficiently with indexes', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `comp-${i}`,
        name: `Company ${i}`,
        owner_id: `owner-${i}`,
        slug: `company-${i}`,
      }));

      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', largeDataset);
      }

      const start = Date.now();
      const result = await prisma.companies.findUnique({ where: { id: 'comp-500' } });
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(result?.id).toBe('comp-500');
      expect(duration).toBeLessThan(100); // Should be fast with indexes
    });

    it('should handle large filtered queries efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `job-${i}`,
        title: `Job ${i}`,
        company: `Company ${i}`,
        company_id: `comp-${i}`,
        description: `Description ${i}`,
        link: 'https://example.com',
        type: 'full-time' as const,
        category: 'engineering' as const,
        status: (i % 2 === 0 ? 'published' : 'draft') as const,
        view_count: i * 10,
        slug: `job-${i}`,
      }));

      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'jobs', largeDataset);
      }

      const start = Date.now();
      const result = await prisma.jobs.findMany({
        where: { status: 'published', view_count: { gte: 5000 } },
        orderBy: { view_count: 'desc' },
        take: 10,
      });
      const duration = Date.now() - start;

      expect(result).toHaveLength(10);
      expect(duration).toBeLessThan(200); // Should be reasonably fast
    });
  });

  describe('Raw Query Integration', () => {
    it('should handle raw SQL queries with custom executor', async () => {
      const customExecutor = async (query: string, stores: Map<string, any[]>) => {
        if (query.includes('SELECT COUNT(*)')) {
          return [{ count: 5 }];
        }
        return [];
      };

      const customPrisma = createPrismocker<PrismaClient>({
        queryRawExecutor: customExecutor,
      });

      const result = await customPrisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM companies');
      expect(result).toEqual([{ count: 5 }]);
    });

    it('should handle raw SQL execution with parsing', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'companies', [
          { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
          { id: 'comp-2', name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
        ]);
      }

      const result = await customPrisma.$executeRawUnsafe(
        "UPDATE companies SET name = 'Updated Company' WHERE id = 'comp-1'"
      );
      expect(result).toBe(1);

      const company = await customPrisma.companies.findUnique({ where: { id: 'comp-1' } });
      expect(company?.name).toBe('Updated Company');
    });
  });

  describe('Middleware Integration', () => {
    it('should execute middleware before operations', async () => {
      const middlewareCalls: string[] = [];
      prisma.$use(async (params, next) => {
        middlewareCalls.push(params.action);
        return next(params);
      });

      await prisma.companies.findMany();
      await prisma.companies.create({
        data: { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
      });

      expect(middlewareCalls).toContain('findMany');
      expect(middlewareCalls).toContain('create');
    });

    it('should allow middleware to modify params', async () => {
      prisma.$use(async (params, next) => {
        if (params.action === 'create' && params.model === 'companies') {
          params.args.data.name = params.args.data.name.toUpperCase();
        }
        return next(params);
      });

      const company = await prisma.companies.create({
        data: { id: 'comp-1', name: 'company 1', owner_id: 'owner-1', slug: 'company-1' },
      });
      expect(company.name).toBe('COMPANY 1');
    });
  });

  describe('Event Listeners', () => {
    it('should emit query events for operations', async () => {
      const events: any[] = [];
      prisma.$on('query', (event) => {
        events.push(event);
      });

      await prisma.companies.findMany();
      await prisma.companies.create({
        data: { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.action === 'findMany')).toBe(true);
      expect(events.some((e) => e.action === 'create')).toBe(true);
    });
  });

  describe('Lifecycle Methods', () => {
    it('should support $connect() (no-op for in-memory)', async () => {
      // $connect() should not throw and should complete immediately
      await expect(prisma.$connect()).resolves.toBeUndefined();
    });

    it('should support $disconnect() (no-op for in-memory)', async () => {
      // $disconnect() should not throw and should complete immediately
      await expect(prisma.$disconnect()).resolves.toBeUndefined();
    });

    it('should support $metrics() API', async () => {
      // Create a new prisma instance with logQueries enabled to track query stats
      const metricsPrisma = createPrismocker<PrismaClient>({
        logQueries: true, // Enable query logging to track stats
      });

      // Seed some data and perform operations to generate metrics
      if (isPrismockerClient(metricsPrisma)) {
        setDataTyped(metricsPrisma, 'companies', [
          { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
        ]);
      }

      // Perform some operations
      await metricsPrisma.companies.findMany();
      await metricsPrisma.companies.findUnique({ where: { id: 'comp-1' } });

      // Get metrics
      const metrics = await metricsPrisma.$metrics();

      // Verify metrics structure
      expect(metrics).toBeDefined();
      expect(metrics.counters).toBeDefined();
      expect(Array.isArray(metrics.counters)).toBe(true);
      expect(metrics.counters.length).toBeGreaterThan(0);

      // Verify query count counter exists
      const queryCounter = metrics.counters.find(
        (c: any) => c.key === 'prisma_client_queries_total'
      );
      expect(queryCounter).toBeDefined();
      expect(queryCounter.value).toBeGreaterThanOrEqual(2); // At least 2 queries performed
    });
  });

  describe('Error-Throwing Operations', () => {
    it('should throw error when findFirstOrThrow finds no records', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', []);
      }

      await expect(
        prisma.companies.findFirstOrThrow({
          where: { name: 'Non-existent' },
        })
      ).rejects.toThrow();
    });

    it('should return record when findFirstOrThrow finds a match', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          { id: 'comp-1', name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
        ]);
      }

      const result = await prisma.companies.findFirstOrThrow({
        where: { name: 'Company 1' },
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Company 1');
    });
  });

  describe('Upsert Operations', () => {
    it('should create record when upsert finds no match', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', []);
      }

      const result = await prisma.companies.upsert({
        where: { id: 'comp-1' },
        create: {
          id: 'comp-1',
          name: 'New Company',
          owner_id: 'owner-1',
          slug: 'new-company',
        },
        update: {
          name: 'Updated Company',
        },
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('New Company');

      // Verify record was created
      const allCompanies = await prisma.companies.findMany();
      expect(allCompanies).toHaveLength(1);
      expect(allCompanies[0].name).toBe('New Company');
    });

    it('should update record when upsert finds a match', async () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          { id: 'comp-1', name: 'Original Company', owner_id: 'owner-1', slug: 'original-company' },
        ]);
      }

      const result = await prisma.companies.upsert({
        where: { id: 'comp-1' },
        create: {
          id: 'comp-1',
          name: 'New Company',
          owner_id: 'owner-1',
          slug: 'new-company',
        },
        update: {
          name: 'Updated Company',
        },
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Company');

      // Verify record was updated (not duplicated)
      const allCompanies = await prisma.companies.findMany();
      expect(allCompanies).toHaveLength(1);
      expect(allCompanies[0].name).toBe('Updated Company');
    });
  });
});
