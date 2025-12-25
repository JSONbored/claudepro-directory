/**
 * Zod Validation Integration Example
 *
 * This example demonstrates how to use Prismocker with generated Zod schemas
 * from prisma-zod-generator. It shows how to validate data before database
 * operations and how Prismocker works seamlessly with Zod-validated data.
 *
 * Key Features Demonstrated:
 * - Generated Zod schema validation
 * - Type-safe data creation with Zod
 * - Error handling for invalid data
 * - Integration with Prisma Client Extensions
 * - Custom validation logic
 *
 * Prerequisites:
 * - prisma-zod-generator configured in schema.prisma
 * - Generated Zod schemas available (e.g., @prisma/zod)
 *
 * NOTE: This example uses generic model names (companies, jobs) that should
 * be adapted to match your actual Prisma schema. The patterns shown here
 * work with any Prisma models and fields.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from '../src/index.js';
import type { PrismaClient } from '@prisma/client';
import { resetAndSeed } from '../src/test-utils.js';
import { validateWithZod } from '../src/prisma-ecosystem.js';

// Type-safe helper to work with any PrismaClient
type AnyPrismaClient = PrismaClient;

/**
 * Example: Using Zod schemas for validation
 *
 * In a real application, you would import generated schemas like:
 * import { CompaniesCreateInputSchema, CompaniesUpdateInputSchema } from '@prisma/zod';
 *
 * For this example, we'll create mock schemas to demonstrate the pattern.
 */
import { z } from 'zod';

// Mock Zod schemas (replace with generated schemas in real usage)
const CompanyCreateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  owner_id: z.string().uuid(),
  description: z.string().max(5000).optional(),
});

const CompanyUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
});

const JobCreateSchema = z.object({
  company_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  view_count: z.number().int().min(0).optional(),
});

describe('Zod Validation Integration', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();

    resetAndSeed(prisma, {
      companies: [
        {
          id: 'company-1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          owner_id: '550e8400-e29b-41d4-a716-446655440000',
          description: 'A great company',
        },
      ] as any,
      jobs: [] as any,
    });
  });

  describe('Validating Data Before Creation', () => {
    it('should create record with valid Zod-validated data', async () => {
      // Validate data with Zod before creating
      const validData = CompanyCreateSchema.parse({
        name: 'New Company',
        slug: 'new-company',
        owner_id: '550e8400-e29b-41d4-a716-446655440001',
        description: 'A new company',
      });

      const company = await (prisma as any).companies.create({
        data: validData,
      });

      expect(company.name).toBe('New Company');
      expect(company.slug).toBe('new-company');
    });

    it('should reject invalid data with Zod validation', () => {
      // Invalid: name is too short
      expect(() => {
        CompanyCreateSchema.parse({
          name: '', // Too short
          slug: 'new-company',
          owner_id: '550e8400-e29b-41d4-a716-446655440001',
        });
      }).toThrow();

      // Invalid: slug doesn't match regex
      expect(() => {
        CompanyCreateSchema.parse({
          name: 'New Company',
          slug: 'New Company', // Invalid format (spaces, uppercase)
          owner_id: '550e8400-e29b-41d4-a716-446655440001',
        });
      }).toThrow();

      // Invalid: owner_id is not a UUID
      expect(() => {
        CompanyCreateSchema.parse({
          name: 'New Company',
          slug: 'new-company',
          owner_id: 'not-a-uuid',
        });
      }).toThrow();
    });

    it('should handle optional fields correctly', async () => {
      // Valid: description is optional
      const validData = CompanyCreateSchema.parse({
        name: 'Minimal Company',
        slug: 'minimal-company',
        owner_id: '550e8400-e29b-41d4-a716-446655440001',
        // description is optional, so we can omit it
      });

      const company = await (prisma as any).companies.create({
        data: validData,
      });

      expect(company.name).toBe('Minimal Company');
      expect(company.description).toBeNull();
    });
  });

  describe('Validating Data Before Updates', () => {
    it('should update record with valid Zod-validated data', async () => {
      const validUpdates = CompanyUpdateSchema.parse({
        name: 'Updated Acme Corp',
        description: 'Updated description',
      });

      const updated = await (prisma as any).companies.update({
        where: { slug: 'acme-corp' },
        data: validUpdates,
      });

      expect(updated.name).toBe('Updated Acme Corp');
      expect(updated.description).toBe('Updated description');
    });

    it('should reject invalid updates with Zod validation', () => {
      // Invalid: name is too long
      expect(() => {
        CompanyUpdateSchema.parse({
          name: 'A'.repeat(256), // Too long (max 255)
        });
      }).toThrow();

      // Invalid: description is too long
      expect(() => {
        CompanyUpdateSchema.parse({
          description: 'A'.repeat(5001), // Too long (max 5000)
        });
      }).toThrow();
    });

    it('should allow partial updates', async () => {
      // Valid: only updating name
      const validUpdates = CompanyUpdateSchema.parse({
        name: 'Updated Name Only',
      });

      const updated = await (prisma as any).companies.update({
        where: { slug: 'acme-corp' },
        data: validUpdates,
      });

      expect(updated.name).toBe('Updated Name Only');
      // Description should remain unchanged
      expect(updated.description).toBe('A great company');
    });
  });

  describe('Using validateWithZod Helper', () => {
    it('should validate data using validateWithZod helper', async () => {
      // This helper can be used to validate data before Prisma operations
      const data = {
        name: 'New Company',
        slug: 'new-company',
        owner_id: '550e8400-e29b-41d4-a716-446655440001',
      };

      // In a real application, you would use:
      // const validated = await validateWithZod(CompanyCreateSchema, data);
      // For this example, we'll use Zod directly
      const validated = CompanyCreateSchema.parse(data);

      const company = await (prisma as any).companies.create({
        data: validated,
      });

      expect(company.name).toBe('New Company');
    });

    it('should throw error for invalid data', async () => {
      const invalidData = {
        name: '', // Too short
        slug: 'new-company',
        owner_id: '550e8400-e29b-41d4-a716-446655440001',
      };

      expect(() => {
        CompanyCreateSchema.parse(invalidData);
      }).toThrow();
    });
  });

  describe('Integration with Prisma Client Extensions', () => {
    it('should work with extended Prisma client that uses Zod', async () => {
      // Example: Extended client with Zod validation
      const extendedPrisma = prisma.$extends({
        query: {
          companies: {
            async create({ args, query }) {
              // Validate with Zod before creating
              const validated = CompanyCreateSchema.parse(args.data);
              return query({ ...args, data: validated });
            },
            async update({ args, query }) {
              // Validate with Zod before updating
              if (args.data) {
                const validated = CompanyUpdateSchema.parse(args.data);
                return query({ ...args, data: validated });
              }
              return query(args);
            },
          },
        },
      });

      // Create with extended client
      const company = await extendedPrisma.companies.create({
        data: {
          name: 'Extended Company',
          slug: 'extended-company',
          owner_id: '550e8400-e29b-41d4-a716-446655440001',
        },
      });

      expect(company.name).toBe('Extended Company');
    });
  });

  describe('Error Handling with Zod', () => {
    it('should provide detailed error messages from Zod', () => {
      try {
        CompanyCreateSchema.parse({
          name: '', // Too short
          slug: 'invalid slug', // Invalid format
          owner_id: 'not-a-uuid', // Invalid UUID
        });
      } catch (error: any) {
        // Zod provides detailed error messages
        expect(error.errors).toBeDefined();
        expect(error.errors.length).toBeGreaterThan(0);

        // Check for specific field errors
        const nameError = error.errors.find((e: any) => e.path.includes('name'));
        const slugError = error.errors.find((e: any) => e.path.includes('slug'));
        const ownerIdError = error.errors.find((e: any) => e.path.includes('owner_id'));

        expect(nameError).toBeDefined();
        expect(slugError).toBeDefined();
        expect(ownerIdError).toBeDefined();
      }
    });

    it('should handle Zod validation errors gracefully in service layer', async () => {
      class CompanyService {
        constructor(private prisma: AnyPrismaClient) {}

        async createCompany(data: unknown) {
          try {
            // Validate with Zod
            const validated = CompanyCreateSchema.parse(data);
            return await (this.prisma as any).companies.create({ data: validated });
          } catch (error: any) {
            if (error instanceof z.ZodError) {
              // Return user-friendly error
              throw new Error(
                `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`
              );
            }
            throw error;
          }
        }
      }

      const service = new CompanyService(prisma);

      // Valid data should work
      const company = await service.createCompany({
        name: 'Valid Company',
        slug: 'valid-company',
        owner_id: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(company.name).toBe('Valid Company');

      // Invalid data should throw user-friendly error
      await expect(
        service.createCompany({
          name: '', // Invalid
          slug: 'invalid',
          owner_id: 'not-uuid',
        })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should validate nested relations with Zod', async () => {
      // Example: Creating a company with jobs
      const companyData = CompanyCreateSchema.parse({
        name: 'Company with Jobs',
        slug: 'company-with-jobs',
        owner_id: '550e8400-e29b-41d4-a716-446655440001',
      });

      const jobData = JobCreateSchema.parse({
        company_id: 'company-1',
        title: 'Senior Engineer',
        view_count: 0,
      });

      const company = await (prisma as any).companies.create({
        data: companyData,
      });

      const job = await (prisma as any).jobs.create({
        data: jobData,
      });

      expect(company.name).toBe('Company with Jobs');
      expect(job.title).toBe('Senior Engineer');
    });

    it('should validate arrays with Zod', async () => {
      // Example: Creating multiple jobs with validation
      const jobsData = z.array(JobCreateSchema).parse([
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
      ]);

      const results = await Promise.all(
        jobsData.map((data) => (prisma as any).jobs.create({ data }))
      );

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Job 1');
      expect(results[1].title).toBe('Job 2');
    });
  });
});
