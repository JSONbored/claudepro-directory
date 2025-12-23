import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { company_size } from '@prisma/client';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock errors first (needed by safe-action mock)
jest.mock('../errors.ts', () => ({
  logActionFailure: jest.fn((actionName, error, context) => {
    const err = error instanceof Error ? error : new Error(String(error));
    err.name = actionName;
    return err;
  }),
  normalizeError: jest.fn((error: unknown, message?: string) => {
    if (error instanceof Error) return error;
    return new Error(message || String(error));
  }),
}));

// Mock safe-action middleware - standardized pattern
// Pattern: authedAction.inputSchema().metadata().action()
jest.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any) => {
    return jest.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          const result = await handler({
            parsedInput: parsed,
            ctx: { userId: 'test-user-id', userEmail: 'test@example.com', authToken: 'test-token' },
          });
          return result;
        } catch (error) {
          // Simulate middleware error handling - logActionFailure is called by middleware
          const { logActionFailure } = require('../errors.ts');
          logActionFailure('companiesCrud', error, { userId: 'test-user-id' });
          throw error;
        }
      };
    });
  };

  const createMetadataResult = (inputSchema: any) => ({
    action: createActionHandler(inputSchema),
  });

  const createInputSchemaResult = (inputSchema: any) => ({
    metadata: jest.fn((metadata: any) => createMetadataResult(inputSchema)),
    action: createActionHandler(inputSchema),
  });

  return {
    authedAction: {
      inputSchema: jest.fn((schema: any) => createInputSchemaResult(schema)),
    },
  };
});

// DO NOT mock runRpc - use real runRpc which uses Prismocker
// This allows us to test the real RPC flow end-to-end

// Mock next/cache
const mockRevalidatePath = jest.fn();
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: any[]) => mockRevalidateTag(...args),
}));

describe('companies-crud', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test (required for test isolation)
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();

    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    // This is what runRpc → BasePrismaService.callRpc → prisma.$queryRawUnsafe calls
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('createCompany', () => {
    describe('input validation', () => {
      it('should accept all optional fields', async () => {
        const { createCompany } = await import('./companies-crud.ts');

        const companyId = '123e4567-e89b-12d3-a456-426614174000';
        const validSize = Object.values(company_size)[0] as string;
        // Mock result must match ManageCompanyReturns structure
        const mockResult = {
          success: true,
          company: {
            id: companyId,
            owner_id: '223e4567-e89b-12d3-a456-426614174001',
            slug: 'test-company',
            name: 'Test Company',
            logo: 'https://example.com/logo.png',
            website: 'https://example.com',
            description: 'Test description',
            size: validSize,
            industry: 'tech',
            using_cursor_since: '2024-01-01',
            featured: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            json_ld: null,
          },
        };

        // Set up Prismocker to return the RPC result
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        const result = await createCompany({
          name: 'Test Company',
          slug: 'test-company',
          logo: 'https://example.com/logo.png',
          website: 'https://example.com',
          description: 'Test description',
          size: validSize,
          industry: 'tech',
          using_cursor_since: '2024-01-01',
        });

        expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });

    describe('RPC call', () => {
      it('should call manage_company RPC with create action', async () => {
        const { createCompany } = await import('./companies-crud.ts');

        const companyId = '123e4567-e89b-12d3-a456-426614174000';
        const validSize = Object.values(company_size)[0] as string;
        const mockResult = {
          company: {
            id: companyId,
            owner_id: '223e4567-e89b-12d3-a456-426614174001',
            slug: 'test-company',
            name: 'Test Company',
            logo: null,
            website: null,
            description: null,
            size: validSize,
            industry: null,
            using_cursor_since: null,
            featured: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            json_ld: null,
          },
        };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        await createCompany({
          name: 'Test Company',
          slug: 'test-company',
        });

        // Verify RPC was called with correct SQL and parameters
        // BasePrismaService.callRpc formats as: SELECT * FROM function_name(p_param => $1, ...)
        // Args object: { p_action, p_user_id, p_create_data, p_update_data }
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_company'),
          'create', // p_action
          'test-user-id', // p_user_id
          expect.objectContaining({
            name: 'Test Company',
            slug: 'test-company',
          }), // p_create_data
          null // p_update_data
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { createCompany } = await import('./companies-crud.ts');

        const companyId = '123e4567-e89b-12d3-a456-426614174000';
        const validSize = Object.values(company_size)[0] as string;
        const mockResult = {
          company: {
            id: companyId,
            owner_id: '223e4567-e89b-12d3-a456-426614174001',
            slug: 'test-company',
            name: 'Test Company',
            logo: null,
            website: null,
            description: null,
            size: validSize,
            industry: null,
            using_cursor_since: null,
            featured: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            json_ld: null,
          },
        };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        await createCompany({
          name: 'Test Company',
        });

        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/companies');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/companies');
        expect(mockRevalidateTag).toHaveBeenCalledWith('company-test-company', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('company-id-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });

  describe('updateCompany', () => {
    describe('RPC call', () => {
      it('should call manage_company RPC with update action', async () => {
        const { updateCompany } = await import('./companies-crud.ts');

        const companyId = '123e4567-e89b-12d3-a456-426614174000';
        const validSize = Object.values(company_size)[0] as string;
        const mockResult = {
          company: {
            id: companyId,
            owner_id: '223e4567-e89b-12d3-a456-426614174001',
            slug: 'test-company',
            name: 'Test Company',
            logo: null,
            website: null,
            description: null,
            size: validSize,
            industry: null,
            using_cursor_since: null,
            featured: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            json_ld: null,
          },
        };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        await updateCompany({
          id: companyId,
          name: 'Updated Company',
        });

        // Verify RPC was called with correct SQL and parameters
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('manage_company'),
          'update', // p_action
          'test-user-id', // p_user_id
          null, // p_create_data
          expect.objectContaining({
            id: companyId,
            name: 'Updated Company',
          }) // p_update_data
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { updateCompany } = await import('./companies-crud.ts');

        const companyId = '123e4567-e89b-12d3-a456-426614174000';
        const validSize = Object.values(company_size)[0] as string;
        const mockResult = {
          company: {
            id: companyId,
            owner_id: '223e4567-e89b-12d3-a456-426614174001',
            slug: 'test-company',
            name: 'Test Company',
            logo: null,
            website: null,
            description: null,
            size: validSize,
            industry: null,
            using_cursor_since: null,
            featured: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            json_ld: null,
          },
        };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        await updateCompany({
          id: companyId,
          name: 'Updated Company',
        });

        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/companies');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/companies/test-company');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/companies');
        expect(mockRevalidateTag).toHaveBeenCalledWith('company-test-company', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('company-id-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });

  describe('deleteCompany', () => {
    describe('input validation', () => {
      it('should require company_id', async () => {
        const { deleteCompany } = await import('./companies-crud.ts');

        await expect(
          deleteCompany({
            // company_id missing
          } as any)
        ).rejects.toThrow();
      });
    });

    describe('RPC call', () => {
      it('should call delete_company RPC with correct parameters', async () => {
        const { deleteCompany } = await import('./companies-crud.ts');

        const companyId = '123e4567-e89b-12d3-a456-426614174000';
        const mockResult = { success: true };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        await deleteCompany({
          company_id: companyId,
        });

        // Verify RPC was called with correct SQL and parameters
        // Args object: { p_company_id, p_user_id }
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
          expect.stringContaining('delete_company'),
          companyId, // p_company_id
          'test-user-id' // p_user_id
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { deleteCompany } = await import('./companies-crud.ts');

        const companyId = '123e4567-e89b-12d3-a456-426614174000';
        const mockResult = { success: true };

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockResult]);

        await deleteCompany({
          company_id: companyId,
        });

        expect(mockRevalidatePath).toHaveBeenCalledWith('/companies');
        expect(mockRevalidatePath).toHaveBeenCalledWith('/account/companies');
        expect(mockRevalidateTag).toHaveBeenCalledWith('company-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('company-id-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(mockRevalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });
});
