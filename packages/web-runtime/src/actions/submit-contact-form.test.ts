import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware - standardized pattern
// Pattern: authedAction.inputSchema().metadata().action()
vi.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
      return async (input: unknown) => {
        const parsed = inputSchema ? inputSchema.parse(input) : input;
        return handler({
          parsedInput: parsed,
          ctx: { userId: 'test-user-id', userEmail: 'test@example.com', authToken: 'test-token' },
        });
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
}));

// Mock contact hooks
vi.mock('./hooks/contact-hooks.ts', () => ({
  onContactSubmission: vi.fn(),
}));

describe.skip('submitContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate contact_category enum', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { contact_categorySchema } = await import('../prisma-zod-schemas.ts');
      const validCategories = contact_categorySchema._def.values;

      expect(() => {
        contact_categorySchema.parse(validCategories[0]);
      }).not.toThrow();
    });

    it('should require name, email, category, and message', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');

      // Missing required fields should fail
      await expect(
        submitContactForm({
          // Missing required fields
        } as any)
      ).rejects.toThrow();
    });

    it('should accept optional metadata', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      vi.mocked(runRpc).mockResolvedValue([
        {
          submission_id: 'submission-123',
        },
      ] as any);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
        metadata: { source: 'website' },
      });

      expect(runRpc).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('RPC call', () => {
    it('should call insert_contact_submission RPC with correct parameters', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');

      const mockResult = [
        {
          submission_id: 'submission-123',
        },
      ];
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
        metadata: { source: 'website' },
      });

      expect(runRpc).toHaveBeenCalledWith(
        'insert_contact_submission',
        {
          p_name: 'Test User',
          p_email: 'test@example.com',
          p_category: 'general',
          p_message: 'Test message',
          p_metadata: { source: 'website' },
        },
        {
          action: 'submitContactForm.rpc',
          userId: 'test-user-id',
        }
      );

      // Should return first element of array (returnStyle: 'first_row')
      expect(result).toEqual(mockResult[0]);
    });

    it('should handle RPC errors', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { logActionFailure } = await import('../errors.ts');

      const mockError = new Error('Database error');
      vi.mocked(runRpc).mockRejectedValue(mockError);

      await expect(
        submitContactForm({
          name: 'Test User',
          email: 'test@example.com',
          category: 'general',
          message: 'Test message',
        })
      ).rejects.toThrow();

      expect(logActionFailure).toHaveBeenCalledWith(
        'submitContactForm',
        mockError,
        expect.objectContaining({
          userId: 'test-user-id',
        })
      );
    });
  });

  describe('cache invalidation', () => {
    it('should revalidate paths and tags', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { revalidatePath, revalidateTag } = await import('next/cache');

      vi.mocked(runRpc).mockResolvedValue([
        {
          submission_id: 'submission-123',
        },
      ] as any);

      await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      expect(revalidatePath).toHaveBeenCalledWith('/admin/contact-submissions');
      expect(revalidateTag).toHaveBeenCalledWith('contact-submission-submission-123', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('contact', 'default');
      expect(revalidateTag).toHaveBeenCalledWith('submissions', 'default');
    });
  });

  describe('hooks', () => {
    it('should call onContactSubmission hook when submission_id exists', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { onContactSubmission } = await import('./hooks/contact-hooks.ts');

      const mockResult = [
        {
          submission_id: 'submission-123',
        },
      ];
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);
      vi.mocked(onContactSubmission).mockResolvedValue(undefined);

      await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      expect(onContactSubmission).toHaveBeenCalledWith(
        { submission_id: 'submission-123' },
        { userId: 'test-user-id' },
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
        })
      );
    });

    it('should return hook result if provided', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { onContactSubmission } = await import('./hooks/contact-hooks.ts');

      const mockResult = [
        {
          submission_id: 'submission-123',
        },
      ];
      const hookResult = { modified: true };
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);
      vi.mocked(onContactSubmission).mockResolvedValue(hookResult as any);

      const result = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      expect(result).toEqual(hookResult);
    });

    it('should not call hook when submission_id is missing', async () => {
      const { submitContactForm } = await import('./submit-contact-form.ts');
      const { runRpc } = await import('./run-rpc-instance.ts');
      const { onContactSubmission } = await import('./hooks/contact-hooks.ts');

      const mockResult = [
        {
          // No submission_id
        },
      ];
      vi.mocked(runRpc).mockResolvedValue(mockResult as any);

      await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        category: 'general',
        message: 'Test message',
      });

      expect(onContactSubmission).not.toHaveBeenCalled();
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      const { authedAction } = await import('./safe-action.ts');

      expect(authedAction.metadata).toHaveBeenCalledWith({
        actionName: 'submitContactForm',
        category: 'form',
      });
    });
  });
});
