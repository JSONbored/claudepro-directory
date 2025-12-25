/**
 * Opinionated Tests Example
 *
 * This example demonstrates opinionated testing patterns that provide direct
 * benefit to developers. These patterns enforce best practices, catch common
 * bugs early, and make tests more maintainable and readable.
 *
 * Key Features Demonstrated:
 * - Type-safe test utilities
 * - Data factory patterns
 * - Test isolation best practices
 * - Error scenario testing
 * - Performance testing patterns
 * - Edge case coverage
 * - Real-world testing scenarios
 *
 * These patterns are opinionated because they enforce specific ways of writing
 * tests that have proven to be effective in real-world applications.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from '../src/index.js';
import type { PrismaClient } from '@prisma/client';
import { createTestPrisma, resetAndSeed, createTestDataFactory } from '../src/test-utils.js';
import { setDataTyped, getDataTyped } from '../src/prisma-types.js';
import { isPrismockerClient } from '../src/jest-helpers.js';

// Type-safe helper to work with any PrismaClient
type AnyPrismaClient = PrismaClient;

/**
 * Opinionated Pattern 1: Always use type-safe helpers
 *
 * Using type-safe helpers eliminates `as any` assertions and makes tests
 * more maintainable. This pattern enforces type safety throughout tests.
 */
describe('Opinionated Pattern 1: Type-Safe Helpers', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createTestPrisma();
  });

  it('should use isPrismockerClient type guard', () => {
    // ✅ GOOD: Type guard ensures type safety
    if (isPrismockerClient(prisma)) {
      prisma.reset(); // TypeScript knows reset() exists
      prisma.setData('companies', []); // TypeScript knows setData() exists
      prisma.getData('companies'); // TypeScript knows getData() exists
    }

    // ❌ BAD: Using as any bypasses type safety
    // (prisma as any).reset();
  });

  it('should use setDataTyped and getDataTyped', () => {
    // ✅ GOOD: Type-safe data operations
    if (isPrismockerClient(prisma)) {
      setDataTyped(prisma, 'companies', [
        { id: '1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      ]);

      const data = getDataTyped(prisma, 'companies');
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Company 1');
    }
  });
});

/**
 * Opinionated Pattern 2: Always use data factories
 *
 * Data factories make tests more maintainable by centralizing test data
 * creation. They also make it easy to create variations of test data.
 */
describe('Opinionated Pattern 2: Data Factories', () => {
  let prisma: AnyPrismaClient;

  // ✅ GOOD: Define factories at the top level
  const companyFactory = createTestDataFactory<any>({
    name: 'Test Company',
    owner_id: 'test-user',
    slug: 'test-company',
    description: 'Test description',
  });

  const jobFactory = createTestDataFactory<any>({
    title: 'Test Job',
    company_id: 'company-1',
    view_count: 0,
  });

  beforeEach(() => {
    prisma = createTestPrisma();
  });

  it('should use factories for consistent test data', () => {
    // ✅ GOOD: Use factory for consistent data
    const company = companyFactory({ name: 'Custom Company' });
    expect(company.name).toBe('Custom Company');
    expect(company.owner_id).toBe('test-user'); // Default value
    expect(company.slug).toBe('test-company'); // Default value
  });

  it('should use factories for variations', () => {
    // ✅ GOOD: Create variations easily
    const company1 = companyFactory({ name: 'Company 1' });
    const company2 = companyFactory({ name: 'Company 2', slug: 'custom-slug' });

    expect(company1.name).toBe('Company 1');
    expect(company2.name).toBe('Company 2');
    expect(company2.slug).toBe('custom-slug');
  });

  it('should seed data using factories', () => {
    if (isPrismockerClient(prisma)) {
      // ✅ GOOD: Use factories in resetAndSeed
      resetAndSeed(prisma, {
        companies: [
          companyFactory({ id: '1', name: 'Company 1' }),
          companyFactory({ id: '2', name: 'Company 2' }),
        ] as any,
        jobs: [
          jobFactory({ id: '1', company_id: '1' }),
          jobFactory({ id: '2', company_id: '1', title: 'Senior Engineer' }),
        ] as any,
      });

      const companies = getDataTyped(prisma, 'companies');
      expect(companies).toHaveLength(2);
      expect(companies[0].name).toBe('Company 1');
      expect(companies[1].name).toBe('Company 2');
    }
  });
});

/**
 * Opinionated Pattern 3: Always test error scenarios
 *
 * Testing error scenarios ensures your code handles failures gracefully.
 * This pattern enforces comprehensive error testing.
 */
describe('Opinionated Pattern 3: Error Scenario Testing', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createTestPrisma();

    if (isPrismockerClient(prisma)) {
      resetAndSeed(prisma, {
        companies: [{ id: '1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' }] as any,
      });
    }
  });

  it('should test findUnique with non-existent record', async () => {
    // ✅ GOOD: Always test null/undefined cases
    const company = await (prisma as any).companies.findUnique({
      where: { slug: 'non-existent' },
    });

    expect(company).toBeNull();
  });

  it('should test findUniqueOrThrow with non-existent record', async () => {
    // ✅ GOOD: Test error-throwing methods
    await expect(
      (prisma as any).companies.findUniqueOrThrow({
        where: { slug: 'non-existent' },
      })
    ).rejects.toThrow();
  });

  it('should test update with non-existent record', async () => {
    // ✅ GOOD: Test update failures
    await expect(
      (prisma as any).companies.update({
        where: { slug: 'non-existent' },
        data: { name: 'Updated' },
      })
    ).rejects.toThrow();
  });

  it('should test delete with non-existent record', async () => {
    // ✅ GOOD: Test delete failures
    await expect(
      (prisma as any).companies.delete({
        where: { slug: 'non-existent' },
      })
    ).rejects.toThrow();
  });
});

/**
 * Opinionated Pattern 4: Always test edge cases
 *
 * Edge cases are where bugs often hide. This pattern enforces testing
 * of boundary conditions, empty data, and unusual inputs.
 */
describe('Opinionated Pattern 4: Edge Case Testing', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createTestPrisma();
  });

  it('should handle empty datasets', async () => {
    // ✅ GOOD: Test with no data
    if (isPrismockerClient(prisma)) {
      resetAndSeed(prisma, {
        companies: [] as any,
      });

      const companies = await (prisma as any).companies.findMany();
      expect(companies).toHaveLength(0);
    }
  });

  it('should handle large datasets', async () => {
    // ✅ GOOD: Test with many records
    if (isPrismockerClient(prisma)) {
      const manyCompanies = Array.from({ length: 100 }, (_, i) => ({
        id: `company-${i}`,
        name: `Company ${i}`,
        owner_id: 'user-1',
        slug: `company-${i}`,
      }));

      resetAndSeed(prisma, {
        companies: manyCompanies as any,
      });

      const companies = await (prisma as any).companies.findMany();
      expect(companies).toHaveLength(100);
    }
  });

  it('should handle null and undefined values', async () => {
    // ✅ GOOD: Test nullable fields
    if (isPrismockerClient(prisma)) {
      resetAndSeed(prisma, {
        companies: [
          {
            id: '1',
            name: 'Company 1',
            owner_id: 'user-1',
            slug: 'company-1',
            description: null, // Nullable field
          },
        ] as any,
      });

      const company = await (prisma as any).companies.findUnique({
        where: { slug: 'company-1' },
      });

      expect(company.description).toBeNull();
    }
  });

  it('should handle special characters in data', async () => {
    // ✅ GOOD: Test with special characters
    if (isPrismockerClient(prisma)) {
      resetAndSeed(prisma, {
        companies: [
          {
            id: '1',
            name: 'Company with \'quotes\' and "double quotes"',
            owner_id: 'user-1',
            slug: 'company-with-special-chars',
            description: 'Description with <tags> and & symbols',
          },
        ] as any,
      });

      const company = await (prisma as any).companies.findUnique({
        where: { slug: 'company-with-special-chars' },
      });

      expect(company.name).toContain("'quotes'");
      expect(company.description).toContain('<tags>');
    }
  });
});

/**
 * Opinionated Pattern 5: Always test performance-critical paths
 *
 * Performance testing ensures your code scales well. This pattern enforces
 * testing of queries, aggregations, and data operations that might be slow.
 */
describe('Opinionated Pattern 5: Performance Testing', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createTestPrisma();
  });

  it('should handle complex queries efficiently', async () => {
    // ✅ GOOD: Test complex queries
    if (isPrismockerClient(prisma)) {
      const companies = Array.from({ length: 50 }, (_, i) => ({
        id: `company-${i}`,
        name: `Company ${i}`,
        owner_id: `user-${i % 10}`, // 10 different owners
        slug: `company-${i}`,
      }));

      resetAndSeed(prisma, {
        companies: companies as any,
      });

      const startTime = Date.now();
      const results = await (prisma as any).companies.findMany({
        where: {
          OR: [{ owner_id: 'user-1' }, { owner_id: 'user-2' }, { owner_id: 'user-3' }],
        },
        orderBy: { name: 'asc' },
        take: 10,
      });
      const duration = Date.now() - startTime;

      expect(results.length).toBeLessThanOrEqual(10);
      expect(duration).toBeLessThan(1000); // Should be fast (< 1 second)
    }
  });

  it('should handle aggregations efficiently', async () => {
    // ✅ GOOD: Test aggregation performance
    if (isPrismockerClient(prisma)) {
      const jobs = Array.from({ length: 1000 }, (_, i) => ({
        id: `job-${i}`,
        company_id: `company-${i % 10}`,
        title: `Job ${i}`,
        view_count: i,
      }));

      resetAndSeed(prisma, {
        jobs: jobs as any,
      });

      const startTime = Date.now();
      const stats = await (prisma as any).jobs.aggregate({
        _count: { id: true },
        _avg: { view_count: true },
        _sum: { view_count: true },
        _min: { view_count: true },
        _max: { view_count: true },
      });
      const duration = Date.now() - startTime;

      expect(stats._count?.id).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should be fast
    }
  });
});

/**
 * Opinionated Pattern 6: Always test relations comprehensively
 *
 * Relations are complex and error-prone. This pattern enforces comprehensive
 * testing of relation loading, filtering, and nested queries.
 */
describe('Opinionated Pattern 6: Comprehensive Relation Testing', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createTestPrisma();

    if (isPrismockerClient(prisma)) {
      resetAndSeed(prisma, {
        companies: [
          { id: '1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
          { id: '2', name: 'Company 2', owner_id: 'user-1', slug: 'company-2' },
        ] as any,
        jobs: [
          { id: '1', company_id: '1', title: 'Job 1', view_count: 10 },
          { id: '2', company_id: '1', title: 'Job 2', view_count: 20 },
          { id: '3', company_id: '2', title: 'Job 3', view_count: 30 },
        ] as any,
      });
    }
  });

  it('should load one-to-many relations', async () => {
    // ✅ GOOD: Test relation loading
    const company = await (prisma as any).companies.findUnique({
      where: { id: '1' },
      include: {
        jobs: true,
      },
    });

    if (company?.jobs) {
      expect(company.jobs).toHaveLength(2);
      expect(company.jobs.every((j: any) => j.company_id === '1')).toBe(true);
    }
  });

  it('should filter relations', async () => {
    // ✅ GOOD: Test relation filtering
    const company = await (prisma as any).companies.findUnique({
      where: { id: '1' },
      include: {
        jobs: {
          where: { view_count: { gte: 15 } },
          orderBy: { view_count: 'desc' },
        },
      },
    });

    if (company?.jobs) {
      expect(company.jobs).toHaveLength(1);
      expect(company.jobs[0].view_count).toBe(20);
    }
  });

  it('should select specific relation fields', async () => {
    // ✅ GOOD: Test relation field selection
    const company = await (prisma as any).companies.findUnique({
      where: { id: '1' },
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

    expect(company?.name).toBe('Company 1');
    if (company?.jobs) {
      expect(company.jobs).toHaveLength(2);
      expect(company.jobs[0]).toHaveProperty('id');
      expect(company.jobs[0]).toHaveProperty('title');
      expect(company.jobs[0]).not.toHaveProperty('view_count');
    }
  });
});

/**
 * Opinionated Pattern 7: Always test transactions
 *
 * Transactions are critical for data integrity. This pattern enforces
 * testing of transaction success, rollback, and nested operations.
 */
describe('Opinionated Pattern 7: Transaction Testing', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createTestPrisma();

    if (isPrismockerClient(prisma)) {
      resetAndSeed(prisma, {
        companies: [] as any,
        jobs: [] as any,
      });
    }
  });

  it('should commit successful transactions', async () => {
    // ✅ GOOD: Test successful transactions
    const result = await prisma.$transaction(async (tx: any) => {
      const company = await tx.companies.create({
        data: {
          name: 'Transaction Company',
          owner_id: 'user-1',
          slug: 'transaction-company',
        },
      });

      const job = await tx.jobs.create({
        data: {
          company_id: company.id,
          title: 'Transaction Job',
          view_count: 0,
        },
      });

      return { company, job };
    });

    expect(result.company.name).toBe('Transaction Company');
    expect(result.job.title).toBe('Transaction Job');

    // Verify data was committed
    const company = await (prisma as any).companies.findUnique({
      where: { slug: 'transaction-company' },
    });
    expect(company).toBeTruthy();
  });

  it('should rollback failed transactions', async () => {
    // ✅ GOOD: Test transaction rollback
    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.companies.create({
          data: {
            name: 'Company 1',
            owner_id: 'user-1',
            slug: 'company-1',
          },
        });

        // Force an error
        throw new Error('Transaction failed');
      });
    } catch (error) {
      // Expected error
    }

    // Verify data was rolled back
    const company = await (prisma as any).companies.findUnique({
      where: { slug: 'company-1' },
    });
    expect(company).toBeNull();
  });
});
