import { describe, expect, it, vi, beforeEach } from 'vitest';
import { company_size } from '@prisma/client';

// Mock safe-action middleware - standardized pattern
// Pattern: authedAction.inputSchema().metadata().action()
vi.mock('./safe-action.ts', async () => {
  // Import mocked logActionFailure
  const { logActionFailure } = await import('../errors.ts');
  
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
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
    metadata: vi.fn((metadata: any) => createMetadataResult(inputSchema)),
    action: createActionHandler(inputSchema),
  });

  return {
    authedAction: {
      inputSchema: vi.fn((schema: any) => createInputSchemaResult(schema)),
    },
  };
});

// Mock runRpc
vi.mock('./run-rpc-instance.ts', () => ({
  runRpc: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock errors
vi.mock('../errors.ts', () => ({
  logActionFailure: vi.fn((actionName, error, context) => {
    const err = error instanceof Error ? error : new Error(String(error));
    err.name = actionName;
    return err;
  }),
  normalizeError: vi.fn((error: unknown, message?: string) => {
    if (error instanceof Error) return error;
    return new Error(message || String(error));
  }),
}));

describe('companies-crud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCompany', () => {
    describe('input validation', () => {
      it('should accept all optional fields', async () => {
        const { createCompany } = await import('./companies-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        const companyId = '123e4567-e89b-12d3-a456-426614174000';
        const validSize = Object.values(company_size)[0];
        // Mock result must match ManageCompanyReturns structure
        vi.mocked(runRpc).mockResolvedValue({
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
        } as any);

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

        expect(runRpc).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });

    describe('RPC call', () => {
      it('should call manage_company RPC with create action', async () => {
        const { createCompany } = await import('./companies-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({
          company: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            owner_id: '223e4567-e89b-12d3-a456-426614174001',
            slug: 'test-company',
            name: 'Test Company',
            logo: null,
            website: null,
            description: null,
            size: Object.values(company_size)[0],
            industry: null,
            using_cursor_since: null,
            featured: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            json_ld: null,
          },
        } as any);

        await createCompany({
          name: 'Test Company',
          slug: 'test-company',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_company',
          expect.objectContaining({
            p_action: 'create',
            p_user_id: 'test-user-id',
            p_create_data: expect.objectContaining({
              name: 'Test Company',
              slug: 'test-company',
            }),
            p_update_data: null,
          }),
          expect.objectContaining({
            action: 'createCompany.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { createCompany } = await import('./companies-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({
          company: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            owner_id: '223e4567-e89b-12d3-a456-426614174001',
            slug: 'test-company',
            name: 'Test Company',
            logo: null,
            website: null,
            description: null,
            size: Object.values(company_size)[0],
            industry: null,
            using_cursor_since: null,
            featured: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            json_ld: null,
          },
        } as any);

        await createCompany({
          name: 'Test Company',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account/companies');
        expect(revalidatePath).toHaveBeenCalledWith('/companies');
        expect(revalidateTag).toHaveBeenCalledWith('company-test-company', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-id-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });

  describe('updateCompany', () => {
    describe('RPC call', () => {
      it('should call manage_company RPC with update action', async () => {
        const { updateCompany } = await import('./companies-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({
          company: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            owner_id: '223e4567-e89b-12d3-a456-426614174001',
            slug: 'test-company',
            name: 'Test Company',
            logo: null,
            website: null,
            description: null,
            size: Object.values(company_size)[0],
            industry: null,
            using_cursor_since: null,
            featured: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            json_ld: null,
          },
        } as any);

        await updateCompany({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Updated Company',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_company',
          expect.objectContaining({
            p_action: 'update',
            p_user_id: 'test-user-id',
            p_create_data: null,
            p_update_data: expect.objectContaining({
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Updated Company',
            }),
          }),
          expect.objectContaining({
            action: 'updateCompany.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { updateCompany } = await import('./companies-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({
          company: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            owner_id: '223e4567-e89b-12d3-a456-426614174001',
            slug: 'test-company',
            name: 'Test Company',
            logo: null,
            website: null,
            description: null,
            size: Object.values(company_size)[0],
            industry: null,
            using_cursor_since: null,
            featured: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            json_ld: null,
          },
        } as any);

        await updateCompany({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Updated Company',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account/companies');
        expect(revalidatePath).toHaveBeenCalledWith('/companies/test-company');
        expect(revalidatePath).toHaveBeenCalledWith('/companies');
        expect(revalidateTag).toHaveBeenCalledWith('company-test-company', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-id-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
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
        const { runRpc } = await import('./run-rpc-instance.ts');

        vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

        await deleteCompany({
          company_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'delete_company',
          {
            p_company_id: '123e4567-e89b-12d3-a456-426614174000',
            p_user_id: 'test-user-id',
          },
          expect.objectContaining({
            action: 'deleteCompany.rpc',
            userId: 'test-user-id',
          })
        );
      });
    });

    describe('cache invalidation', () => {
      it('should revalidate paths and tags', async () => {
        const { deleteCompany } = await import('./companies-crud.ts');
        const { runRpc } = await import('./run-rpc-instance.ts');
        const { revalidatePath, revalidateTag } = await import('next/cache');

        vi.mocked(runRpc).mockResolvedValue({ success: true } as any);

        await deleteCompany({
          company_id: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/companies');
        expect(revalidatePath).toHaveBeenCalledWith('/account/companies');
        expect(revalidateTag).toHaveBeenCalledWith('company-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-id-123e4567-e89b-12d3-a456-426614174000', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });
});
