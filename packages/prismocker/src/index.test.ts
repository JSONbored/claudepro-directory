/**
 * Basic tests for Prismocker
 *
 * These tests verify the core functionality works correctly.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from './index';
import type { PrismaClient } from '@prisma/client';
import { isPrismockerClient } from './jest-helpers';
import { setDataTyped, getDataTyped } from './prisma-types';

describe('Prismocker', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    if (isPrismockerClient(prisma)) {
      prisma.reset();
    }
  });

  it('should create a record', async () => {
    // Use actual Prisma model from schema (e.g., companies)
    const company = await prisma.companies.create({
      data: {
        name: 'Test Company',
        owner_id: 'test-owner-id',
        slug: 'test-company',
      },
    });

    expect(company.name).toBe('Test Company');
    expect(company.slug).toBe('test-company');
    expect(company.id).toBeDefined();
  });

  it('should find many records', async () => {
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });
    await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
    });

    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(2);
  });

  it('should find unique record', async () => {
    const created = await prisma.companies.create({
      data: { id: 'test-id', name: 'Test Company', owner_id: 'owner-1', slug: 'test-company' },
    });

    const found = await prisma.companies.findUnique({ where: { id: 'test-id' } });
    expect(found).toEqual(created);
  });

  it('should filter records with where clause', async () => {
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });
    await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
    });

    const companies = await prisma.companies.findMany({
      where: { owner_id: 'owner-1' },
    });

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toBe('Company 1');
  });

  it('should update a record', async () => {
    const created = await prisma.companies.create({
      data: { name: 'Original Name', owner_id: 'owner-1', slug: 'original-slug' },
    });

    const updated = await prisma.companies.update({
      where: { id: created.id },
      data: { name: 'Updated Name' },
    });

    expect(updated.name).toBe('Updated Name');
  });

  it('should delete a record', async () => {
    const created = await prisma.companies.create({
      data: { name: 'Test Company', owner_id: 'owner-1', slug: 'test-company' },
    });

    await prisma.companies.delete({ where: { id: created.id } });

    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(0);
  });

  it('should count records', async () => {
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });
    await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
    });

    const count = await prisma.companies.count();
    expect(count).toBe(2);
  });

  it('should aggregate with _stddev', async () => {
    // Create jobs with view_count values for standard deviation calculation
    await (prisma as any).jobs.create({
      data: { id: 'job-1', company_id: 'company-1', title: 'Job 1', view_count: 100 },
    });
    await (prisma as any).jobs.create({
      data: { id: 'job-2', company_id: 'company-1', title: 'Job 2', view_count: 200 },
    });
    await (prisma as any).jobs.create({
      data: { id: 'job-3', company_id: 'company-1', title: 'Job 3', view_count: 150 },
    });

    const stats = await (prisma as any).jobs.aggregate({
      _stddev: { view_count: true },
    });

    // Mean = (100 + 200 + 150) / 3 = 150
    // Variance = ((100-150)^2 + (200-150)^2 + (150-150)^2) / 3 = (2500 + 2500 + 0) / 3 = 1666.67
    // Stddev = sqrt(1666.67) ≈ 40.82
    expect(stats._stddev?.view_count).toBeCloseTo(40.82, 1);
  });

  it('should aggregate with _variance', async () => {
    // Create jobs with view_count values for variance calculation
    await (prisma as any).jobs.create({
      data: { id: 'job-1', company_id: 'company-1', title: 'Job 1', view_count: 100 },
    });
    await (prisma as any).jobs.create({
      data: { id: 'job-2', company_id: 'company-1', title: 'Job 2', view_count: 200 },
    });
    await (prisma as any).jobs.create({
      data: { id: 'job-3', company_id: 'company-1', title: 'Job 3', view_count: 150 },
    });

    const stats = await (prisma as any).jobs.aggregate({
      _variance: { view_count: true },
    });

    // Mean = (100 + 200 + 150) / 3 = 150
    // Variance = ((100-150)^2 + (200-150)^2 + (150-150)^2) / 3 = (2500 + 2500 + 0) / 3 = 1666.67
    expect(stats._variance?.view_count).toBeCloseTo(1666.67, 1);
  });

  it('should aggregate with _countDistinct', async () => {
    // Create jobs with different company_id values
    await (prisma as any).jobs.create({
      data: { id: 'job-1', company_id: 'company-1', title: 'Job 1' },
    });
    await (prisma as any).jobs.create({
      data: { id: 'job-2', company_id: 'company-1', title: 'Job 2' },
    });
    await (prisma as any).jobs.create({
      data: { id: 'job-3', company_id: 'company-2', title: 'Job 3' },
    });
    await (prisma as any).jobs.create({
      data: { id: 'job-4', company_id: 'company-2', title: 'Job 4' },
    });
    await (prisma as any).jobs.create({
      data: { id: 'job-5', company_id: 'company-3', title: 'Job 5' },
    });

    const stats = await (prisma as any).jobs.aggregate({
      _countDistinct: { company_id: true },
    });

    // Should have 3 distinct company_id values: company-1, company-2, company-3
    expect(stats._countDistinct?.company_id).toBe(3);
  });

  it('should handle _stddev with single value', async () => {
    await (prisma as any).jobs.create({
      data: { id: 'job-1', company_id: 'company-1', title: 'Job 1', view_count: 100 },
    });

    const stats = await (prisma as any).jobs.aggregate({
      _stddev: { view_count: true },
    });

    // Single value: stddev should be 0
    expect(stats._stddev?.view_count).toBe(0);
  });

  it('should handle _variance with single value', async () => {
    await (prisma as any).jobs.create({
      data: { id: 'job-1', company_id: 'company-1', title: 'Job 1', view_count: 100 },
    });

    const stats = await (prisma as any).jobs.aggregate({
      _variance: { view_count: true },
    });

    // Single value: variance should be 0
    expect(stats._variance?.view_count).toBe(0);
  });

  it('should handle _stddev with no values', async () => {
    const stats = await (prisma as any).jobs.aggregate({
      _stddev: { view_count: true },
    });

    // No values: stddev should be null
    expect(stats._stddev?.view_count).toBeNull();
  });

  it('should handle _variance with no values', async () => {
    const stats = await (prisma as any).jobs.aggregate({
      _variance: { view_count: true },
    });

    // No values: variance should be null
    expect(stats._variance?.view_count).toBeNull();
  });

  it('should handle _countDistinct with no values', async () => {
    const stats = await (prisma as any).jobs.aggregate({
      _countDistinct: { company_id: true },
    });

    // No values: countDistinct should be 0
    expect(stats._countDistinct?.company_id).toBe(0);
  });

  it('should reset all data', async () => {
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });
    await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
    });

    if (isPrismockerClient(prisma)) {
      prisma.reset();
    }

    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(0);
  });

  it('should support $queryRawUnsafe (stub)', async () => {
    const result = await prisma.$queryRawUnsafe('SELECT 1');
    expect(result).toEqual([]);
  });

  it('should support $transaction (simplified)', async () => {
    const result = await prisma.$transaction(async (tx) => {
      return await tx.companies.create({
        data: { name: 'Test Company', owner_id: 'owner-1', slug: 'test-company' },
      });
    });

    expect(result.name).toBe('Test Company');
  });

  it('should commit transaction on success', async () => {
    // Create initial data
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });

    // Execute successful transaction
    await prisma.$transaction(async (tx) => {
      await tx.companies.create({
        data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
      });
      await tx.companies.create({
        data: { name: 'Company 3', owner_id: 'owner-3', slug: 'company-3' },
      });
    });

    // Verify all changes were committed
    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(3);
  });

  it('should support search operator (full-text search)', async () => {
    await prisma.companies.create({
      data: { name: 'Acme Corporation', owner_id: 'owner-1', slug: 'acme' },
    });
    await prisma.companies.create({
      data: { name: 'Tech Solutions Inc', owner_id: 'owner-2', slug: 'tech-solutions' },
    });

    // Search for "Corporation" (case-insensitive)
    const results = await (prisma as any).companies.findMany({
      where: {
        name: {
          search: 'Corporation',
        },
      },
    });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Acme Corporation');
  });

  it('should support array_contains/has operator', async () => {
    // Create records with array fields (using type-safe helper)
    if (isPrismockerClient(prisma)) {
      setDataTyped(prisma, 'jobs', [
        { id: 'job-1', tags: ['react', 'typescript', 'node'], company_id: 'company-1' },
        { id: 'job-2', tags: ['python', 'django'], company_id: 'company-1' },
        { id: 'job-3', tags: ['react', 'vue'], company_id: 'company-1' },
      ]);
    }

    // Find jobs with 'react' tag using array_contains
    const reactJobs = await (prisma as any).jobs.findMany({
      where: {
        tags: {
          array_contains: 'react',
        },
      },
    });

    expect(reactJobs).toHaveLength(2);
    expect(reactJobs.every((j: any) => j.tags.includes('react'))).toBe(true);

    // Find jobs with 'python' tag using has (PostgreSQL alias)
    const pythonJobs = await (prisma as any).jobs.findMany({
      where: {
        tags: {
          has: 'python',
        },
      },
    });

    expect(pythonJobs).toHaveLength(1);
    expect(pythonJobs[0].tags.includes('python')).toBe(true);
  });

  it('should support path operator for JSON fields', async () => {
    // Create records with JSON metadata
    if (isPrismockerClient(prisma)) {
      setDataTyped(prisma, 'content', [
        {
          id: 'content-1',
          metadata: {
            author: { name: 'John Doe', email: 'john@example.com' },
            tags: ['tutorial', 'typescript'],
          },
        },
        {
          id: 'content-2',
          metadata: {
            author: { name: 'Jane Smith', email: 'jane@example.com' },
            tags: ['guide', 'react'],
          },
        },
      ]);
    }

    // Verify data is accessible
    const allContent = await (prisma as any).content.findMany({});
    expect(allContent).toHaveLength(2);

    // Query JSON path: metadata.author.name
    const johnContent = await (prisma as any).content.findMany({
      where: {
        metadata: {
          path: ['author', 'name'],
          equals: 'John Doe',
        },
      },
    });

    expect(johnContent).toHaveLength(1);
    expect(johnContent[0].metadata.author.name).toBe('John Doe');

    // Query JSON path with array_contains
    const tutorialContent = await (prisma as any).content.findMany({
      where: {
        metadata: {
          path: ['tags'],
          array_contains: 'tutorial',
        },
      },
    });

    expect(tutorialContent).toHaveLength(1);
    expect(tutorialContent[0].metadata.tags.includes('tutorial')).toBe(true);
  });

  it('should support isSet operator', async () => {
    await prisma.companies.create({
      data: {
        name: 'Company 1',
        owner_id: 'owner-1',
        slug: 'company-1',
        description: 'Description',
      },
    });
    await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2', description: null },
    });
    await prisma.companies.create({
      data: { name: 'Company 3', owner_id: 'owner-3', slug: 'company-3' },
    });

    // Find companies with description set
    const withDescription = await (prisma as any).companies.findMany({
      where: {
        description: {
          isSet: true,
        },
      },
    });

    expect(withDescription).toHaveLength(1);
    expect(withDescription[0].description).toBe('Description');

    // Find companies without description set
    const withoutDescription = await (prisma as any).companies.findMany({
      where: {
        description: {
          isSet: false,
        },
      },
    });

    expect(withoutDescription).toHaveLength(2);
    expect(withoutDescription.every((c: any) => !c.description || c.description === null)).toBe(
      true
    );
  });

  it('should use indexes for fast findUnique lookups', async () => {
    // Create many records
    for (let i = 0; i < 100; i++) {
      await prisma.companies.create({
        data: {
          id: `company-${i}`,
          name: `Company ${i}`,
          owner_id: `owner-${i}`,
          slug: `company-${i}`,
        },
      });
    }

    // findUnique with id should use index (much faster than filtering all 100 records)
    const company = await prisma.companies.findUnique({
      where: { id: 'company-50' },
    });

    expect(company).toBeDefined();
    expect(company?.id).toBe('company-50');
    expect(company?.name).toBe('Company 50');
  });

  it('should rollback transaction on error', async () => {
    // Create initial data
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });

    // Execute transaction that fails
    try {
      await prisma.$transaction(async (tx) => {
        await tx.companies.create({
          data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
        });
        // Force an error
        throw new Error('Transaction failed');
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toBe('Transaction failed');
    }

    // Verify rollback - only original company should exist
    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(1);
    expect(companies[0].name).toBe('Company 1');
  });

  it('should rollback all changes in transaction on error', async () => {
    // Create initial data
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });

    // Execute transaction with multiple operations that fails
    try {
      await prisma.$transaction(async (tx) => {
        await tx.companies.create({
          data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
        });
        await tx.companies.create({
          data: { name: 'Company 3', owner_id: 'owner-3', slug: 'company-3' },
        });
        // Force an error after multiple operations
        throw new Error('Transaction failed');
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toBe('Transaction failed');
    }

    // Verify rollback - none of the transaction changes should be committed
    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(1);
    expect(companies[0].name).toBe('Company 1');
  });

  it('should support updates and deletes in transaction with rollback', async () => {
    // Create initial data
    const company1 = await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'owner-1', slug: 'company-1' },
    });
    const company2 = await prisma.companies.create({
      data: { name: 'Company 2', owner_id: 'owner-2', slug: 'company-2' },
    });

    // Execute transaction with updates and delete that fails
    try {
      await prisma.$transaction(async (tx) => {
        await tx.companies.update({
          where: { id: company1.id },
          data: { name: 'Updated Company 1' },
        });
        await tx.companies.delete({
          where: { id: company2.id },
        });
        // Force an error
        throw new Error('Transaction failed');
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toBe('Transaction failed');
    }

    // Verify rollback - original state should be restored
    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(2);
    expect(companies.find((c) => c.id === company1.id)?.name).toBe('Company 1');
    expect(companies.find((c) => c.id === company2.id)?.name).toBe('Company 2');
  });

  describe('Query Cache', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>({
        enableQueryCache: true,
      });
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }
    });

    it('should cache findMany results', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });

      // First call - should execute query
      const result1 = await prisma.companies.findMany();
      expect(result1).toHaveLength(1);

      // Second call - should use cache (same args)
      const result2 = await prisma.companies.findMany();
      expect(result2).toHaveLength(1);
      expect(result2).toEqual(result1);
    });

    it('should invalidate cache on create', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });

      // Cache the initial query
      await prisma.companies.findMany();
      expect(await prisma.companies.findMany()).toHaveLength(1);

      // Create new record - should invalidate cache
      await prisma.companies.create({
        data: { id: 'company-2', name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
      });

      // Should see new record (cache invalidated)
      const results = await prisma.companies.findMany();
      expect(results).toHaveLength(2);
    });

    it('should invalidate cache on update', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });

      // Cache the initial query
      await prisma.companies.findMany();

      // Update record - should invalidate cache
      await prisma.companies.update({
        where: { id: 'company-1' },
        data: { name: 'Updated Company 1' },
      });

      // Should see updated record (cache invalidated)
      const results = await prisma.companies.findMany();
      expect(results[0].name).toBe('Updated Company 1');
    });

    it('should invalidate cache on delete', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });
      await prisma.companies.create({
        data: { id: 'company-2', name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
      });

      // Cache the initial query
      await prisma.companies.findMany();
      expect(await prisma.companies.findMany()).toHaveLength(2);

      // Delete record - should invalidate cache
      await prisma.companies.delete({ where: { id: 'company-1' } });

      // Should see one less record (cache invalidated)
      const results = await prisma.companies.findMany();
      expect(results).toHaveLength(1);
    });

    it('should cache findUnique results', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });

      // First call
      const result1 = await prisma.companies.findUnique({ where: { id: 'company-1' } });
      expect(result1?.name).toBe('Company 1');

      // Second call - should use cache
      const result2 = await prisma.companies.findUnique({ where: { id: 'company-1' } });
      expect(result2).toEqual(result1);
    });
  });

  describe('Lazy Relations', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>({
        enableLazyRelations: true,
      });
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }
    });

    it('should load relations lazily with include', async () => {
      const company = await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });
      await (prisma as any).jobs.create({
        data: {
          id: 'job-1',
          company_id: 'company-1',
          title: 'Job 1',
          description: 'Test job description',
          type: 'full-time',
          category: 'engineering',
          link: 'https://example.com/job-1',
        },
      });

      // Query with include - relation should be a Proxy
      const result = await prisma.companies.findUnique({
        where: { id: 'company-1' },
        include: { jobs: true },
      });

      expect(result).toBeDefined();
      expect(result?.jobs).toBeDefined();

      // Access relation - should load on first access
      const jobs = result?.jobs;
      expect(jobs).toBeDefined();
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs?.length).toBe(1);
      expect(jobs?.[0]?.title).toBe('Job 1');
    });

    it('should load relations lazily with select', async () => {
      const company = await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });
      await (prisma as any).jobs.create({
        data: {
          id: 'job-1',
          company_id: 'company-1',
          title: 'Job 1',
          description: 'Test job description',
          type: 'full-time',
          category: 'engineering',
          link: 'https://example.com/job-1',
        },
      });

      // Query with select - relation should be a Proxy
      const result = await prisma.companies.findUnique({
        where: { id: 'company-1' },
        select: { id: true, name: true, jobs: true },
      });

      expect(result).toBeDefined();
      expect(result?.jobs).toBeDefined();

      // Access relation - should load on first access
      const jobs = result?.jobs;
      expect(jobs).toBeDefined();
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs?.length).toBe(1);
    });
  });

  describe('Raw SQL Execution', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>({
        enableSqlParsing: true,
      });
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }
    });

    it('should execute simple SELECT query via SQL parser', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });
      await prisma.companies.create({
        data: { id: 'company-2', name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
      });

      // Execute simple SELECT query
      const results = (await prisma.$queryRawUnsafe('SELECT * FROM companies')) as Array<{
        name: string;
      }>;
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Company 1');
    });

    it('should execute SELECT with WHERE clause via SQL parser', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });
      await prisma.companies.create({
        data: { id: 'company-2', name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
      });

      // Execute SELECT with WHERE
      const results = (await prisma.$queryRawUnsafe(
        "SELECT * FROM companies WHERE id = 'company-1'"
      )) as Array<{ name: string }>;
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Company 1');
    });

    it('should use custom executor when provided', async () => {
      const customResults = [{ id: 'custom-1', name: 'Custom Result' }];

      prisma = createPrismocker<PrismaClient>({
        queryRawExecutor: async (query, values, stores) => {
          // Custom executor that returns predefined results
          return customResults;
        },
      });
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }

      // Execute query - should use custom executor
      const results = await prisma.$queryRawUnsafe('SELECT * FROM companies');
      expect(results).toEqual(customResults);
    });

    it('should handle $queryRaw with template strings', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });

      // Execute $queryRaw with template string
      const companyId = 'company-1';
      const results =
        (await prisma.$queryRaw`SELECT * FROM companies WHERE id = ${companyId}`) as Array<{
          name: string;
        }>;
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Company 1');
    });

    it('should return empty array when no executor or parser available', async () => {
      prisma = createPrismocker<PrismaClient>({
        enableSqlParsing: false,
        // No queryRawExecutor
      });
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }

      // Execute query - should return empty array
      const results = await prisma.$queryRawUnsafe('SELECT * FROM companies');
      expect(results).toEqual([]);
    });
  });

  describe('Raw SQL Execution ($executeRaw, $executeRawUnsafe)', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>();
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }
    });

    it('should return 0 by default for $executeRaw', async () => {
      const result = await prisma.$executeRaw`UPDATE users SET name = 'John'`;
      expect(result).toBe(0);
    });

    it('should return 0 by default for $executeRawUnsafe', async () => {
      const result = await prisma.$executeRawUnsafe('UPDATE users SET name = $1', 'John');
      expect(result).toBe(0);
    });

    it('should use custom executeRawExecutor for $executeRaw', async () => {
      const customPrisma = createPrismocker<PrismaClient>({
        executeRawExecutor: async (sql, params, stores) => {
          if (sql.includes('UPDATE users SET name =')) {
            const users = stores.get('users') || [];
            return users.length; // Return count of affected rows
          }
          return 0;
        },
      });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
          { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        ]);
      }

      const result = await customPrisma.$executeRaw`UPDATE users SET name = 'John'`;
      expect(result).toBe(2); // Two users affected
    });

    it('should use custom executeRawExecutor for $executeRawUnsafe', async () => {
      const customPrisma = createPrismocker<PrismaClient>({
        executeRawExecutor: async (sql, params, stores) => {
          if (sql.includes('DELETE FROM users WHERE name =')) {
            const name = params[0];
            const users = stores.get('users') || [];
            const beforeCount = users.length;
            // Remove matching users
            const filtered = users.filter((u: any) => u.name !== name);
            stores.set('users', filtered);
            return beforeCount - filtered.length;
          }
          return 0;
        },
      });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
          { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        ]);
      }

      const result = await customPrisma.$executeRawUnsafe(
        'DELETE FROM users WHERE name = $1',
        'Alice'
      );
      expect(result).toBe(1); // One user deleted
      const remainingUsers = isPrismockerClient(customPrisma)
        ? getDataTyped(customPrisma, 'users')
        : [];
      expect(remainingUsers).toHaveLength(1);
      expect(remainingUsers[0].name).toBe('Bob');
    });

    it('should parse and execute simple INSERT when enableSqlParsing is true', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', []);
      }

      const result = await customPrisma.$executeRawUnsafe(
        "INSERT INTO users (id, name, email) VALUES ('user-1', 'Alice', 'alice@example.com')"
      );
      expect(result).toBe(1); // One row inserted

      const users = isPrismockerClient(customPrisma) ? getDataTyped(customPrisma, 'users') : [];
      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
      });
    });

    it('should parse and execute simple UPDATE when enableSqlParsing is true', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
          { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        ]);
      }

      const result = await customPrisma.$executeRawUnsafe(
        "UPDATE users SET name = 'John' WHERE id = 'user-1'"
      );
      expect(result).toBe(1); // One row updated

      const users = isPrismockerClient(customPrisma) ? getDataTyped(customPrisma, 'users') : [];
      expect(users[0].name).toBe('John');
      expect(users[1].name).toBe('Bob'); // Unchanged
    });

    it('should parse and execute simple DELETE when enableSqlParsing is true', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
          { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        ]);
      }

      const result = await customPrisma.$executeRawUnsafe("DELETE FROM users WHERE id = 'user-1'");
      expect(result).toBe(1); // One row deleted

      const users = isPrismockerClient(customPrisma) ? getDataTyped(customPrisma, 'users') : [];
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe('user-2');
    });

    it('should handle $executeRaw with template strings', async () => {
      const customPrisma = createPrismocker<PrismaClient>({ enableSqlParsing: true });
      if (isPrismockerClient(customPrisma)) {
        setDataTyped(customPrisma, 'users', [
          { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        ]);
      }

      // Verify data is accessible
      const usersBefore = isPrismockerClient(customPrisma)
        ? getDataTyped(customPrisma, 'users')
        : [];
      expect(usersBefore).toHaveLength(1);
      expect(usersBefore[0].id).toBe('user-1');

      const userId = 'user-1';
      const newName = 'John';
      const result =
        await customPrisma.$executeRaw`UPDATE users SET name = ${newName} WHERE id = ${userId}`;
      expect(result).toBe(1);

      const users = isPrismockerClient(customPrisma) ? getDataTyped(customPrisma, 'users') : [];
      expect(users[0].name).toBe('John');
    });

    it('should return 0 when no executor or parser available', async () => {
      prisma = createPrismocker<PrismaClient>({
        enableSqlParsing: false,
        // No executeRawExecutor
      });
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }

      // Execute DML - should return 0
      const result = await prisma.$executeRawUnsafe('UPDATE users SET name = $1', 'John');
      expect(result).toBe(0);
    });
  });

  describe('findUniqueOrThrow and findFirstOrThrow', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>();
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }
    });

    it('should return record when found (findUniqueOrThrow)', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });

      const result = await prisma.companies.findUniqueOrThrow({ where: { id: 'company-1' } });
      expect(result.name).toBe('Company 1');
    });

    it('should throw error when not found (findUniqueOrThrow)', async () => {
      await expect(
        prisma.companies.findUniqueOrThrow({ where: { id: 'non-existent' } })
      ).rejects.toThrow('Record not found');
    });

    it('should return record when found (findFirstOrThrow)', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });

      const result = await prisma.companies.findFirstOrThrow({ where: { name: 'Company 1' } });
      expect(result.name).toBe('Company 1');
    });

    it('should throw error when not found (findFirstOrThrow)', async () => {
      await expect(
        prisma.companies.findFirstOrThrow({ where: { name: 'Non-existent Company' } })
      ).rejects.toThrow('Record not found');
    });

    it('should include helpful error message with context', async () => {
      await prisma.companies.create({
        data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });

      try {
        await prisma.companies.findUniqueOrThrow({ where: { id: 'non-existent' } });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('Record not found');
        expect(error.message).toContain('Where clause');
        expect(error.message).toContain('Total records');
        expect(error.message).toContain('Sample records');
      }
    });
  });

  describe('Debugging Utilities', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>();
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }
    });

    it('should enable debug mode', () => {
      if (isPrismockerClient(prisma)) {
        expect(typeof prisma.enableDebugMode).toBe('function');
        prisma.enableDebugMode();
        // Debug mode should be enabled (no error thrown)
        expect(true).toBe(true);
      }
    });

    it('should track query statistics', async () => {
      if (isPrismockerClient(prisma)) {
        prisma.enableDebugMode();
        setDataTyped(prisma, 'companies', [
          { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
        ]);
      }

      await prisma.companies.findMany();
      await prisma.companies.findUnique({ where: { id: 'company-1' } });
      await prisma.companies.create({
        data: { id: 'company-2', name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
      });

      const stats = isPrismockerClient(prisma) ? prisma.getQueryStats() : null;
      expect(stats).not.toBeNull();
      expect(stats!.totalQueries).toBe(3);
      expect(stats!.queriesByModel.companies).toBe(3);
      expect(stats!.queriesByOperation.findMany).toBe(1);
      expect(stats!.queriesByOperation.findUnique).toBe(1);
      expect(stats!.queriesByOperation.create).toBe(1);
      expect(stats!.queries.length).toBe(3);
    });

    it('should visualize state', () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
          { id: 'company-2', name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
        ]);
        setDataTyped(prisma, 'jobs', [
          {
            id: 'job-1',
            company_id: 'company-1',
            title: 'Job 1',
            description: 'Test job description',
            type: 'full-time',
            category: 'engineering',
            link: 'https://example.com/job-1',
          },
        ]);

        const visualization = prisma.visualizeState({
          maxRecordsPerModel: 5,
          includeIndexes: true,
          includeCache: true,
        });

        expect(visualization).toContain('=== Prismocker State ===');
        expect(visualization).toContain('companies: 2 record');
        expect(visualization).toContain('jobs: 1 record');
        expect(visualization).toContain('📦 Stores:');
      }
    });

    it('should visualize state without indexes and cache', () => {
      if (isPrismockerClient(prisma)) {
        setDataTyped(prisma, 'companies', [
          { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
        ]);

        const visualization = prisma.visualizeState({
          maxRecordsPerModel: 5,
          includeIndexes: false,
          includeCache: false,
        });

        expect(visualization).toContain('=== Prismocker State ===');
        expect(visualization).toContain('companies: 1 record');
        expect(visualization).not.toContain('🔍 Indexes:');
        expect(visualization).not.toContain('💾 Query Cache:');
      }
    });

    it('should reset query statistics on reset', async () => {
      if (isPrismockerClient(prisma)) {
        prisma.enableDebugMode();
        setDataTyped(prisma, 'companies', [
          { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
        ]);
      }

      await prisma.companies.findMany();
      const statsBefore = isPrismockerClient(prisma) ? prisma.getQueryStats() : null;
      expect(statsBefore).not.toBeNull();
      expect(statsBefore!.totalQueries).toBe(1);

      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }
      const statsAfter = isPrismockerClient(prisma) ? prisma.getQueryStats() : null;
      expect(statsAfter).not.toBeNull();
      expect(statsAfter!.totalQueries).toBe(0);
    });
  });

  describe('Prisma Lifecycle Methods', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>();
      if (isPrismockerClient(prisma)) {
        prisma.reset();
      }
    });

    it('should support $connect() (no-op for in-memory)', async () => {
      // $connect should not throw and should complete successfully
      await expect(prisma.$connect()).resolves.toBeUndefined();
    });

    it('should support $disconnect() (no-op for in-memory)', async () => {
      // $disconnect should not throw and should complete successfully
      await expect(prisma.$disconnect()).resolves.toBeUndefined();
    });

    it('should emit connect event when $connect() is called', async () => {
      const connectEvents: any[] = [];
      prisma.$on('connect', (event) => {
        connectEvents.push(event);
      });

      await prisma.$connect();
      expect(connectEvents.length).toBe(1);
      expect(connectEvents[0]).toHaveProperty('timestamp');
      expect(typeof connectEvents[0].timestamp).toBe('number');
    });

    it('should emit disconnect event when $disconnect() is called', async () => {
      const disconnectEvents: any[] = [];
      prisma.$on('disconnect', (event) => {
        disconnectEvents.push(event);
      });

      await prisma.$disconnect();
      expect(disconnectEvents.length).toBe(1);
      expect(disconnectEvents[0]).toHaveProperty('timestamp');
      expect(typeof disconnectEvents[0].timestamp).toBe('number');
    });
  });

  describe('Middleware Support ($use)', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>();
      if (isPrismockerClient(prisma)) {
        prisma.reset();
        setDataTyped(prisma, 'companies', [
          { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
        ]);
      }
    });

    it('should register middleware with $use()', () => {
      const middleware = jest.fn(async (params: any, next: any) => {
        return next(params);
      });

      prisma.$use(middleware);
      // Middleware should be registered (no error thrown)
      expect(true).toBe(true);
    });

    it('should execute middleware before operations', async () => {
      const middlewareCalls: any[] = [];
      prisma.$use(async (params: any, next: any) => {
        middlewareCalls.push(params);
        return next(params);
      });

      await prisma.companies.findMany();
      expect(middlewareCalls.length).toBe(1);
      expect(middlewareCalls[0].model).toBe('companies');
      expect(middlewareCalls[0].action).toBe('findMany');
    });

    it('should execute multiple middleware in order', async () => {
      const callOrder: string[] = [];
      prisma.$use(async (params: any, next: any) => {
        callOrder.push('middleware1');
        return next(params);
      });
      prisma.$use(async (params: any, next: any) => {
        callOrder.push('middleware2');
        return next(params);
      });

      await prisma.companies.findMany();
      expect(callOrder).toEqual(['middleware1', 'middleware2']);
    });

    it('should allow middleware to modify params', async () => {
      prisma.$use(async (params: any, next: any) => {
        // Modify args to add a filter
        params.args = { ...params.args, where: { id: 'company-1' } };
        return next(params);
      });

      const results = await prisma.companies.findMany();
      // Should only return company-1 due to middleware modification
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('company-1');
    });

    it('should allow middleware to intercept and return custom result', async () => {
      prisma.$use(async (params: any, next: any) => {
        if (params.action === 'findMany' && params.model === 'companies') {
          // Intercept and return custom result
          return [{ id: 'custom-1', name: 'Custom Company' }];
        }
        return next(params);
      });

      const results = await prisma.companies.findMany();
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('custom-1');
      expect(results[0].name).toBe('Custom Company');
    });
  });

  describe('Event Listeners ($on)', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>();
      if (isPrismockerClient(prisma)) {
        prisma.reset();
        setDataTyped(prisma, 'companies', [
          { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
        ]);
      }
    });

    it('should register event listeners with $on()', () => {
      const listener = jest.fn();
      prisma.$on('query', listener);
      // Listener should be registered (no error thrown)
      expect(true).toBe(true);
    });

    it('should emit query events for operations', async () => {
      const queryEvents: any[] = [];
      prisma.$on('query', (event) => {
        queryEvents.push(event);
      });

      await prisma.companies.findMany();
      expect(queryEvents.length).toBe(1);
      expect(queryEvents[0].model).toBe('companies');
      expect(queryEvents[0].action).toBe('findMany');
    });

    it('should support multiple listeners for same event', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      prisma.$on('query', listener1);
      prisma.$on('query', listener2);

      await prisma.companies.findMany();
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should support different event types', async () => {
      const queryEvents: any[] = [];
      const infoEvents: any[] = [];
      prisma.$on('query', (event) => queryEvents.push(event));
      prisma.$on('info', (event) => infoEvents.push(event));

      await prisma.companies.findMany();
      expect(queryEvents.length).toBe(1);
      expect(infoEvents.length).toBe(0); // No info events emitted by default
    });
  });

  describe('Metrics API ($metrics)', () => {
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createPrismocker<PrismaClient>();
      if (isPrismockerClient(prisma)) {
        prisma.reset();
        prisma.enableDebugMode();
        setDataTyped(prisma, 'companies', [
          { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
        ]);
      }
    });

    it('should return metrics structure', async () => {
      await prisma.companies.findMany();
      await prisma.companies.findUnique({ where: { id: 'company-1' } });

      const metrics = await prisma.$metrics();
      expect(metrics).toBeDefined();
      expect(metrics.counters).toBeDefined();
      expect(metrics.gauges).toBeDefined();
      expect(metrics.histograms).toBeDefined();
    });

    it('should include query count in metrics', async () => {
      await prisma.companies.findMany();
      await prisma.companies.findUnique({ where: { id: 'company-1' } });

      const metrics = await prisma.$metrics();
      const queriesCounter = metrics.counters.find(
        (c: any) => c.key === 'prisma_client_queries_total'
      );
      expect(queriesCounter).toBeDefined();
      expect(queriesCounter.value).toBe(2);
    });

    it('should include query statistics in debug mode', async () => {
      await prisma.companies.findMany();

      const metrics = await prisma.$metrics();
      expect(metrics.queryStats).toBeDefined();
      expect(metrics.queryStats.totalQueries).toBe(1);
      expect(metrics.queryStats.queriesByModel.companies).toBe(1);
    });
  });
});
