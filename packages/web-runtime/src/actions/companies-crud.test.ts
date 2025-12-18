import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware
vi.mock('./safe-action.ts', () => {
  const createActionMock = (schema: any) => ({
    action: vi.fn((handler) => {
      return async (input: unknown) => {
        const parsed = schema.parse(input);
        return handler({ parsedInput: parsed, ctx: { userId: 'test-user-id' } });
      };
    }),
  });

  return {
    authedAction: {
      metadata: vi.fn(() => ({
        inputSchema: vi.fn((schema) => createActionMock(schema)),
      })),
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

        vi.mocked(runRpc).mockResolvedValue({
          company: { id: 'company-123', slug: 'test-company' },
        } as any);

        const result = await createCompany({
          name: 'Test Company',
          slug: 'test-company',
          logo: 'https://example.com/logo.png',
          website: 'https://example.com',
          description: 'Test description',
          size: 'small',
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
          company: { id: 'company-123', slug: 'test-company' },
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
          company: { id: 'company-123', slug: 'test-company' },
        } as any);

        await createCompany({
          name: 'Test Company',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account/companies');
        expect(revalidatePath).toHaveBeenCalledWith('/companies');
        expect(revalidateTag).toHaveBeenCalledWith('company-test-company', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-id-company-123', 'default');
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
          company: { id: 'company-123', slug: 'test-company' },
        } as any);

        await updateCompany({
          id: 'company-123',
          name: 'Updated Company',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'manage_company',
          expect.objectContaining({
            p_action: 'update',
            p_user_id: 'test-user-id',
            p_create_data: null,
            p_update_data: expect.objectContaining({
              id: 'company-123',
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
          company: { id: 'company-123', slug: 'test-company' },
        } as any);

        await updateCompany({
          id: 'company-123',
          name: 'Updated Company',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/account/companies');
        expect(revalidatePath).toHaveBeenCalledWith('/companies/test-company');
        expect(revalidatePath).toHaveBeenCalledWith('/companies');
        expect(revalidateTag).toHaveBeenCalledWith('company-test-company', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-id-company-123', 'default');
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
          company_id: 'company-123',
        });

        expect(runRpc).toHaveBeenCalledWith(
          'delete_company',
          {
            p_company_id: 'company-123',
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
          company_id: 'company-123',
        });

        expect(revalidatePath).toHaveBeenCalledWith('/companies');
        expect(revalidatePath).toHaveBeenCalledWith('/account/companies');
        expect(revalidateTag).toHaveBeenCalledWith('company-company-123', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('company-id-company-123', 'default');
        expect(revalidateTag).toHaveBeenCalledWith('companies', 'default');
      });
    });
  });
});
