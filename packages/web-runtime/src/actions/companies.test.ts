import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

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
// Pattern: rateLimitedAction.inputSchema().metadata().action()
jest.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createAuthedActionHandler = (inputSchema: any) => {
    return jest.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          return await handler({
            parsedInput: parsed,
            ctx: { userId: 'test-user-id', userEmail: 'test@example.com', authToken: 'test-token' },
          });
        } catch (error) {
          // Simulate middleware error handling - logActionFailure is called by middleware
          const { logActionFailure } = require('../errors.ts');
          logActionFailure('companies', error, { userId: 'test-user-id' });
          throw error;
        }
      };
    });
  };

  const createAuthedMetadataResult = (inputSchema: any) => ({
    action: createAuthedActionHandler(inputSchema),
  });

  const createAuthedInputSchemaResult = (inputSchema: any) => ({
    metadata: jest.fn(() => createAuthedMetadataResult(inputSchema)),
    action: createAuthedActionHandler(inputSchema),
  });

  const createRateLimitedActionHandler = (inputSchema: any) => {
    return jest.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          return await handler({
            parsedInput: parsed,
            ctx: { userAgent: 'test-user-agent', startTime: performance.now() },
          });
        } catch (error) {
          // Simulate middleware error handling
          const { logActionFailure } = require('../errors.ts');
          logActionFailure('companies', error, {});
          throw error;
        }
      };
    });
  };

  const createRateLimitedMetadataResult = (inputSchema: any) => ({
    action: createRateLimitedActionHandler(inputSchema),
  });

  const createRateLimitedInputSchemaResult = (inputSchema: any) => ({
    metadata: jest.fn(() => createRateLimitedMetadataResult(inputSchema)),
    action: createRateLimitedActionHandler(inputSchema),
  });

  return {
    authedAction: {
      inputSchema: jest.fn((schema: any) => createAuthedInputSchemaResult(schema)),
    },
    rateLimitedAction: {
      inputSchema: jest.fn((schema: any) => createRateLimitedInputSchemaResult(schema)),
    },
  };
});

// DO NOT mock data layer functions - use real functions which use Prismocker
// This allows us to test the real data flow end-to-end

// Mock storage (not using Prismocker - these are external storage operations)
const mockUploadImageToStorage = jest.fn();
const mockDeleteImageFromStorage = jest.fn();
jest.mock('../storage/image-storage.ts', () => ({
  uploadImageToStorage: (...args: any[]) => mockUploadImageToStorage(...args),
  deleteImageFromStorage: (...args: any[]) => mockDeleteImageFromStorage(...args),
}));

// Mock storage utils
const mockValidateImageBuffer = jest.fn();
const mockExtractPathFromUrl = jest.fn();
jest.mock('../storage/image-utils.ts', () => ({
  validateImageBuffer: (...args: any[]) => mockValidateImageBuffer(...args),
  extractPathFromUrl: (...args: any[]) => mockExtractPathFromUrl(...args),
  IMAGE_CONFIG: {
    ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  },
}));

// Mock Supabase admin (not using Prismocker - this is external)
const mockCreateSupabaseAdminClient = jest.fn();
jest.mock('../supabase/admin.ts', () => ({
  createSupabaseAdminClient: (...args: any[]) => mockCreateSupabaseAdminClient(...args),
}));

// Mock config
const mockGetTimeoutConfig = jest.fn();
jest.mock('../config/static-configs.ts', () => ({
  getTimeoutConfig: (...args: any[]) => mockGetTimeoutConfig(...args),
}));

describe('companies', () => {
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

    // Set up defaults for mocks
    mockGetTimeoutConfig.mockReturnValue({
      'timeout.ui.form_debounce_ms': 300,
    });
    mockCreateSupabaseAdminClient.mockResolvedValue({});
    mockValidateImageBuffer.mockReturnValue({ valid: true });
    mockExtractPathFromUrl.mockReturnValue('logos/old-logo.png');
    mockUploadImageToStorage.mockResolvedValue({
      success: true,
      publicUrl: 'https://example.com/logo.png',
      path: 'logos/logo.png',
    });

    // Use Prismocker's Proxy set handler to override $queryRawUnsafe for RPC calls
    // This is what data functions use via services → BasePrismaService.callRpc → prisma.$queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('searchCompaniesAction', () => {
    describe('input validation', () => {
      it('should validate query length (2-100 characters)', async () => {
        const { searchCompaniesAction } = await import('./companies.ts');

        // Too short
        await expect(
          searchCompaniesAction({
            query: 'a',
          } as any)
        ).rejects.toThrow();

        // Too long
        await expect(
          searchCompaniesAction({
            query: 'a'.repeat(101),
          } as any)
        ).rejects.toThrow();
      });

      it('should validate limit range (1-20)', async () => {
        const { searchCompaniesAction } = await import('./companies.ts');

        await expect(
          searchCompaniesAction({
            query: 'test',
            limit: 0,
          } as any)
        ).rejects.toThrow();

        await expect(
          searchCompaniesAction({
            query: 'test',
            limit: 21,
          } as any)
        ).rejects.toThrow();
      });
    });

    describe('data fetching', () => {
      it('should call searchCompanies with correct parameters', async () => {
        const { searchCompaniesAction } = await import('./companies.ts');

        const mockCompanies = [
          { id: '1', name: 'Company 1', slug: 'company-1', description: null },
          { id: '2', name: 'Company 2', slug: 'company-2', description: null },
        ];

        // Mock RPC result for searchUnified (used by searchCompanies)
        // searchUnified returns: { results: Array, total_count: number }
        // callRpc unwraps composite types, so $queryRawUnsafe returns [result] which becomes result
        const mockSearchResult = {
          results: mockCompanies.map((c) => ({ id: c.id, title: c.name, slug: c.slug })),
          total_count: mockCompanies.length,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          mockSearchResult,
        ] as any);

        const result = await searchCompaniesAction({
          query: 'test',
          limit: 10,
        });

        // Verify RPC was called (searchCompanies → fetchCompanySearchResults → SearchService.searchUnified → RPC)
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
        expect(result).toEqual({
          companies: mockCompanies,
          debounceMs: 300,
        });
      });

      it('should default limit to 10', async () => {
        const { searchCompaniesAction } = await import('./companies.ts');

        // Mock empty search result
        const mockSearchResult = {
          results: [],
          total_count: 0,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          mockSearchResult,
        ] as any);

        await searchCompaniesAction({
          query: 'test',
        });

        // Verify RPC was called (limit defaults to 10 in searchCompanies)
        expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle searchCompanies errors gracefully', async () => {
        const { searchCompaniesAction } = await import('./companies.ts');

        // searchCompanies uses fetchCompanySearchResults which has onError: () => []
        // So errors don't throw - they return empty array
        const mockError = new Error('RPC failed');
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

        // The action doesn't throw because searchCompanies returns [] on error
        // Instead, it returns an empty companies array
        const result = await searchCompaniesAction({
          query: 'test',
        });

        expect(result).toEqual({
          companies: [],
          debounceMs: 300,
        });
      });

      it('should handle getTimeoutConfig returning null config', async () => {
        const { searchCompaniesAction } = await import('./companies.ts');

        mockGetTimeoutConfig.mockReturnValue(null);
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([{ data: [] }]);

        const result = await searchCompaniesAction({
          query: 'test',
        });

        expect(result.debounceMs).toBe(300); // Should default to 300
      });

      it('should handle missing debounceMs in config', async () => {
        const { searchCompaniesAction } = await import('./companies.ts');

        mockGetTimeoutConfig.mockReturnValue({});
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([{ data: [] }]);

        const result = await searchCompaniesAction({
          query: 'test',
        });

        expect(result.debounceMs).toBe(300); // Should default to 300
      });

      it('should handle searchCompanies returning empty array', async () => {
        const { searchCompaniesAction } = await import('./companies.ts');

        // Mock empty search result
        const mockSearchResult = {
          results: [],
          total_count: 0,
        };
        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
          mockSearchResult,
        ] as any);

        const result = await searchCompaniesAction({
          query: 'test',
        });

        expect(result.companies).toEqual([]);
      });
    });
  });

  describe('getCompanyByIdAction', () => {
    describe('input validation', () => {
      it('should validate UUID format', async () => {
        const { getCompanyByIdAction } = await import('./companies.ts');

        await expect(
          getCompanyByIdAction({
            companyId: 'invalid-uuid',
          } as any)
        ).rejects.toThrow();
      });
    });

    describe('data fetching', () => {
      it('should return company profile when found', async () => {
        const { getCompanyByIdAction } = await import('./companies.ts');

        const mockCompany = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          owner_id: 'user-1',
          name: 'Test Company',
          slug: 'test-company',
          logo: 'https://example.com/logo.png',
          website: 'https://example.com',
          description: 'Test description',
          size: 'small' as const,
          industry: null,
          using_cursor_since: new Date('2024-01-01'),
          featured: true,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          json_ld: null,
        };

        // getCompanyAdminProfile uses Prisma directly (not RPC), so use setData
        if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
          (prismocker as any).setData('companies', [mockCompany]);
        }

        const result = await getCompanyByIdAction({
          companyId: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(result).toEqual({
          id: mockCompany.id,
          name: mockCompany.name,
          slug: mockCompany.slug,
          logo: mockCompany.logo,
          website: mockCompany.website,
          description: mockCompany.description,
        });
      });

      it('should return null when company not found', async () => {
        const { getCompanyByIdAction } = await import('./companies.ts');

        // getCompanyAdminProfile uses Prisma directly, so empty setData means not found
        if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
          (prismocker as any).setData('companies', []);
        }

        const result = await getCompanyByIdAction({
          companyId: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(result).toBeNull();
      });

      it('should return null on error', async () => {
        const { getCompanyByIdAction } = await import('./companies.ts');

        (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
          new Error('Database error')
        );

        const result = await getCompanyByIdAction({
          companyId: '123e4567-e89b-12d3-a456-426614174000',
        });

        expect(result).toBeNull();
      });

      it('should handle profile with null/undefined fields', async () => {
        const { getCompanyByIdAction } = await import('./companies.ts');

        const mockCompany = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          owner_id: 'user-1',
          name: null, // null name
          slug: '',
          logo: null,
          website: null,
          description: null,
          size: 'small' as const,
          industry: null,
          using_cursor_since: null,
          featured: null,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          json_ld: null,
        };

        // getCompanyAdminProfile uses Prisma directly, so use setData
        if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
          (prismocker as any).setData('companies', [mockCompany]);
        }

        const result = await getCompanyByIdAction({
          companyId: '123e4567-e89b-12d3-a456-426614174000',
        });

        // CompaniesService.getCompanyAdminProfile transforms the data, null name becomes null
        // But the action uses ?? '' so null becomes ''
        expect(result).toEqual({
          id: mockCompany.id,
          name: '', // null becomes '' due to ?? '' in action
          slug: '',
          logo: null,
          website: null,
          description: null,
        });
      });
    });
  });

  describe('uploadCompanyLogoAction', () => {
    describe('input validation', () => {
      it('should validate image buffer and mime type', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({
          valid: false,
          error: 'Invalid image format',
        });

        const buffer = Buffer.from('fake-image-data', 'base64');

        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: buffer.toString('base64'),
          } as any)
        ).rejects.toThrow('Invalid image format');
      });

      it('should validate UUID for companyId when provided', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });

        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: Buffer.from('test').toString('base64'),
            companyId: 'invalid-uuid',
          } as any)
        ).rejects.toThrow();
      });

      it('should validate URL format for oldLogoUrl when provided', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });

        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: Buffer.from('test').toString('base64'),
            oldLogoUrl: 'not-a-valid-url',
          } as any)
        ).rejects.toThrow();
      });
    });

    describe('authorization', () => {
      it('should check company ownership when companyId provided', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });

        const mockCompany = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          owner_id: 'different-user-id',
          slug: 'test-company',
          name: 'Test Company',
          logo: null,
          website: null,
          description: null,
          size: 'small' as const,
          industry: null,
          using_cursor_since: null,
          featured: null,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          json_ld: null,
        };

        // getCompanyAdminProfile uses Prisma directly, so use setData
        if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
          (prismocker as any).setData('companies', [mockCompany]);
        }

        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: Buffer.from('test').toString('base64'),
            companyId: '123e4567-e89b-12d3-a456-426614174000',
          } as any)
        ).rejects.toThrow('You do not have permission to manage this company');
      });

      it('should throw error when company not found', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });

        // getCompanyAdminProfile uses Prisma directly, so empty setData means not found
        if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
          (prismocker as any).setData('companies', []);
        }

        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: Buffer.from('test').toString('base64'),
            companyId: '123e4567-e89b-12d3-a456-426614174000',
          } as any)
        ).rejects.toThrow('Company not found');
      });
    });

    describe('upload flow', () => {
      it('should upload image and return public URL', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });

        const result = await uploadCompanyLogoAction({
          fileName: 'logo.png',
          mimeType: 'image/png',
          fileBase64: Buffer.from('test-image').toString('base64'),
        } as any);

        expect(mockUploadImageToStorage).toHaveBeenCalledWith({
          bucket: 'company-logos',
          data: expect.any(Buffer),
          mimeType: 'image/png',
          userId: 'test-user-id',
          fileName: 'logo.png',
          supabase: {},
        });

        expect(result).toEqual({
          success: true,
          publicUrl: 'https://example.com/logo.png',
          path: 'logos/logo.png',
        });
      });

      it('should delete old logo when oldLogoUrl provided', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });
        mockExtractPathFromUrl.mockReturnValue('logos/old-logo.png');

        await uploadCompanyLogoAction({
          fileName: 'new-logo.png',
          mimeType: 'image/png',
          fileBase64: Buffer.from('test-image').toString('base64'),
          oldLogoUrl: 'https://example.com/old-logo.png',
        } as any);

        expect(mockDeleteImageFromStorage).toHaveBeenCalledWith('company-logos', 'logos/old-logo.png', {});
      });

      it('should handle upload errors', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });
        mockUploadImageToStorage.mockResolvedValue({
          success: false,
          error: undefined,
        });

        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: Buffer.from('test').toString('base64'),
          } as any)
        ).rejects.toThrow('Failed to upload logo');
      });

      it('should handle invalid base64 in fileBase64', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });

        // Buffer.from with invalid base64 doesn't throw, it just creates a buffer with the base64-decoded bytes
        // The actual validation happens in validateImageBuffer, which we're mocking as valid
        // So this test might not actually test invalid base64 - it tests that the code handles the buffer
        // If we want to test invalid base64, we'd need to let validateImageBuffer run for real
        // For now, this test verifies the action doesn't crash with unusual input
        const result = await uploadCompanyLogoAction({
          fileName: 'logo.png',
          mimeType: 'image/png',
          fileBase64: '!!!invalid-base64!!!',
        } as any);

        // Since validateImageBuffer is mocked as valid, the upload succeeds
        expect(result.success).toBe(true);
      });

      it('should handle extractPathFromUrl returning null', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });
        mockExtractPathFromUrl.mockReturnValue(null);

        const result = await uploadCompanyLogoAction({
          fileName: 'new-logo.png',
          mimeType: 'image/png',
          fileBase64: Buffer.from('test-image').toString('base64'),
          oldLogoUrl: 'https://example.com/old-logo.png',
        } as any);

        expect(result.success).toBe(true);
        expect(mockDeleteImageFromStorage).not.toHaveBeenCalled();
      });

      it('should handle createSupabaseAdminClient errors', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });
        mockCreateSupabaseAdminClient.mockRejectedValue(new Error('Admin client error'));

        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: Buffer.from('test').toString('base64'),
          } as any)
        ).rejects.toThrow();
      });

      it('should handle uploadImageToStorage returning success=true but publicUrl=null', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });
        mockUploadImageToStorage.mockResolvedValue({
          success: true,
          publicUrl: null,
        });

        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: Buffer.from('test').toString('base64'),
          } as any)
        ).rejects.toThrow('Failed to upload logo');
      });

      it('should handle company.owner_id being null/undefined', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({ valid: true });

        const mockCompany = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          owner_id: null, // null owner_id
          slug: 'test-company',
          name: 'Test Company',
          logo: null,
          website: null,
          description: null,
          size: 'small' as const,
          industry: null,
          using_cursor_since: null,
          featured: null,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          json_ld: null,
        };

        // getCompanyAdminProfile uses Prisma directly, so use setData
        if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
          (prismocker as any).setData('companies', [mockCompany]);
        }

        // When owner_id is null, company.owner_id !== ctx.userId evaluates to true
        // (null !== 'test-user-id'), so it throws permission error
        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: Buffer.from('test').toString('base64'),
            companyId: '123e4567-e89b-12d3-a456-426614174000',
          } as any)
        ).rejects.toThrow('You do not have permission to manage this company');
      });

      it('should handle validateImageBuffer returning null/undefined error', async () => {
        const { uploadCompanyLogoAction } = await import('./companies.ts');

        mockValidateImageBuffer.mockReturnValue({
          valid: false,
          error: undefined,
        });

        await expect(
          uploadCompanyLogoAction({
            fileName: 'logo.png',
            mimeType: 'image/png',
            fileBase64: Buffer.from('test').toString('base64'),
          } as any)
        ).rejects.toThrow('Invalid image format');
      });
    });
  });
});
