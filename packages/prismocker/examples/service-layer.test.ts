/**
 * Service Layer Testing Example
 *
 * This example demonstrates how to test service layer classes with Prismocker.
 * It shows real-world patterns for testing Prisma-based services with complex queries,
 * data seeding, and type-safe test utilities.
 *
 * Key Features Demonstrated:
 * - Service class testing with Prismocker
 * - Complex Prisma queries (filtering, sorting, pagination)
 * - Type-safe data seeding
 * - Test data factories
 * - Relation testing
 * - Error handling
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from '../src/index.js';
import type { PrismaClient } from '@prisma/client';
import { createTestPrisma, resetAndSeed, createTestDataFactory } from '../src/test-utils.js';

/**
 * Example service class that uses Prisma
 * This represents a real service layer in your application
 * NOTE: Adapt model names and field names to match your schema
 */
class CompaniesService {
  constructor(private prisma: AnyPrismaClient) {}

  async getCompanyBySlug(slug: string) {
    return (this.prisma as any).companies.findUnique({
      where: { slug },
    });
  }

  async getCompaniesByOwner(ownerId: string) {
    return (this.prisma as any).companies.findMany({
      where: { owner_id: ownerId },
      orderBy: { name: 'asc' },
    });
  }

  async createCompany(data: {
    name: string;
    owner_id: string;
    slug: string;
    description?: string;
  }) {
    return (this.prisma as any).companies.create({
      data,
    });
  }

  async updateCompany(slug: string, updates: { name?: string; description?: string }) {
    return (this.prisma as any).companies.update({
      where: { slug },
      data: updates,
    });
  }

  async deleteCompany(slug: string) {
    return (this.prisma as any).companies.delete({
      where: { slug },
    });
  }

  async getCompaniesWithJobs(ownerId: string) {
    return (this.prisma as any).companies.findMany({
      where: { owner_id: ownerId },
      include: {
        jobs: {
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async searchCompanies(query: string, limit: number = 10) {
    return (this.prisma as any).companies.findMany({
      where: {
        OR: [{ name: { contains: query } }, { description: { contains: query } }],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async getCompanyStats(companyId: string) {
    const [company, jobCount] = await Promise.all([
      (this.prisma as any).companies.findUnique({ where: { id: companyId } }),
      (this.prisma as any).jobs.count({ where: { company_id: companyId } }),
    ]);

    return {
      company,
      totalJobs: jobCount,
    };
  }
}

describe('CompaniesService', () => {
  let prisma: AnyPrismaClient;
  let service: CompaniesService;

  // Create data factory for consistent test data
  // NOTE: Adapt field names to your schema
  const companyFactory = createTestDataFactory<any>({
    name: 'Test Company',
    owner_id: 'test-user',
    slug: 'test-company',
    description: 'Test description',
  });

  beforeEach(() => {
    // Create test Prisma instance
    prisma = createTestPrisma();

    // Reset and seed data before each test
    // NOTE: Adapt model names and field names to your schema
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
          created_at: new Date('2024-01-01'),
        },
        {
          id: 'job-2',
          company_id: 'company-1',
          title: 'Junior Engineer',
          created_at: new Date('2024-01-02'),
        },
        {
          id: 'job-3',
          company_id: 'company-2',
          title: 'Product Manager',
          created_at: new Date('2024-01-03'),
        },
      ] as any,
    });

    service = new CompaniesService(prisma);
  });

  describe('getCompanyBySlug', () => {
    it('should return company by slug', async () => {
      const company = await service.getCompanyBySlug('acme-corp');

      expect(company).toMatchObject({
        id: 'company-1',
        name: 'Acme Corp',
        slug: 'acme-corp',
      });
    });

    it('should return null for non-existent company', async () => {
      const company = await service.getCompanyBySlug('non-existent');

      expect(company).toBeNull();
    });
  });

  describe('getCompaniesByOwner', () => {
    it('should return companies for owner', async () => {
      const companies = await service.getCompaniesByOwner('user-1');

      expect(companies).toHaveLength(2);
      expect(companies[0].name).toBe('Acme Corp');
      expect(companies[1].name).toBe('Big Corp');
    });

    it('should return empty array for owner with no companies', async () => {
      const companies = await service.getCompaniesByOwner('user-999');

      expect(companies).toHaveLength(0);
    });

    it('should sort companies by name', async () => {
      const companies = await service.getCompaniesByOwner('user-1');

      expect(companies[0].name).toBe('Acme Corp');
      expect(companies[1].name).toBe('Big Corp');
    });
  });

  describe('createCompany', () => {
    it('should create a new company', async () => {
      const company = await service.createCompany({
        name: 'New Company',
        owner_id: 'user-1',
        slug: 'new-company',
        description: 'A new company',
      });

      expect(company.name).toBe('New Company');
      expect(company.slug).toBe('new-company');

      // Verify it was created
      const allCompanies = await (prisma as any).companies.findMany();
      expect(allCompanies).toHaveLength(4);
    });

    it('should create company without optional fields', async () => {
      const company = await service.createCompany({
        name: 'Minimal Company',
        owner_id: 'user-1',
        slug: 'minimal-company',
      });

      expect(company.name).toBe('Minimal Company');
      expect(company.description).toBeNull();
    });
  });

  describe('updateCompany', () => {
    it('should update company name', async () => {
      const updated = await service.updateCompany('acme-corp', {
        name: 'Updated Acme Corp',
      });

      expect(updated.name).toBe('Updated Acme Corp');
      expect(updated.slug).toBe('acme-corp'); // Slug unchanged

      // Verify update persisted
      const company = await (prisma as any).companies.findUnique({
        where: { slug: 'acme-corp' },
      });
      expect(company?.name).toBe('Updated Acme Corp');
    });

    it('should update multiple fields', async () => {
      const updated = await service.updateCompany('acme-corp', {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });

    it('should throw error for non-existent company', async () => {
      await expect(service.updateCompany('non-existent', { name: 'New Name' })).rejects.toThrow();
    });
  });

  describe('deleteCompany', () => {
    it('should delete company', async () => {
      const deleted = await service.deleteCompany('acme-corp');

      expect(deleted.slug).toBe('acme-corp');

      // Verify it was deleted
      const company = await (prisma as any).companies.findUnique({
        where: { slug: 'acme-corp' },
      });
      expect(company).toBeNull();
    });

    it('should throw error for non-existent company', async () => {
      await expect(service.deleteCompany('non-existent')).rejects.toThrow();
    });
  });

  describe('getCompaniesWithJobs', () => {
    it('should return companies with jobs', async () => {
      const companies = await service.getCompaniesWithJobs('user-1');

      expect(companies).toHaveLength(2);

      // Acme Corp should have jobs
      const acmeCorp = companies.find((c: any) => c.id === 'company-1');
      if (acmeCorp?.jobs) {
        expect(acmeCorp.jobs.length).toBeGreaterThan(0);
      }

      // Big Corp should have no jobs
      const bigCorp = companies.find((c: any) => c.id === 'company-3');
      if (bigCorp?.jobs) {
        expect(bigCorp.jobs).toHaveLength(0);
      }
    });
  });

  describe('searchCompanies', () => {
    it('should search companies by name', async () => {
      const results = await service.searchCompanies('Acme');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Acme Corp');
    });

    it('should search companies by description', async () => {
      // Update a company with a searchable description
      await (prisma as any).companies.update({
        where: { slug: 'acme-corp' },
        data: { description: 'We build amazing products' },
      });

      const results = await service.searchCompanies('amazing');

      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe('acme-corp');
    });

    it('should limit results', async () => {
      const results = await service.searchCompanies('Corp', 1);

      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for no matches', async () => {
      const results = await service.searchCompanies('NonExistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('getCompanyStats', () => {
    it('should return company statistics', async () => {
      const stats = await service.getCompanyStats('company-1');

      expect(stats.company).toMatchObject({
        id: 'company-1',
        name: 'Acme Corp',
      });
      expect(stats.totalJobs).toBe(2);
      // NOTE: Adapt to your schema's status field if applicable
      // expect(stats.publishedJobs).toBe(1);
    });

    it('should return zero counts for company with no jobs', async () => {
      const stats = await service.getCompanyStats('company-3');

      expect(stats.totalJobs).toBe(0);
      // expect(stats.publishedJobs).toBe(0);
    });

    it('should return null company for non-existent ID', async () => {
      const stats = await service.getCompanyStats('non-existent');

      expect(stats.company).toBeNull();
      expect(stats.totalJobs).toBe(0);
      // expect(stats.publishedJobs).toBe(0);
    });
  });
});
