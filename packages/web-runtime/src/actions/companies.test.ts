import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware
vi.mock('./safe-action.ts', () => {
  const createActionMock = (schema: any) => ({
    action: vi.fn((handler) => {
      return async (input: unknown) => {
        const parsed = schema ? schema.parse(input) : input;
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
    rateLimitedAction: {
      inputSchema: vi.fn((schema) => ({
        metadata: vi.fn(() => createActionMock(schema)),
      })),
    },
  };
});

// Mock data layer
vi.mock('../data/companies.ts', () => ({
  searchCompanies: vi.fn(),
  getCompanyAdminProfile: vi.fn(),
}));

// Mock storage
vi.mock('../storage/image-storage.ts', () => ({
  uploadImageToStorage: vi.fn(),
  deleteImageFromStorage: vi.fn(),
}));

// Mock storage utils
vi.mock('../storage/image-utils.ts', () => ({
  validateImageBuffer: vi.fn(),
  extractPathFromUrl: vi.fn(),
  IMAGE_CONFIG: {
    ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  },
}));

// Mock Supabase admin
vi.mock('../supabase/admin.ts', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

// Mock config
vi.mock('../config/static-configs.ts', () => ({
  getTimeoutConfig: vi.fn(() => ({
    'timeout.ui.form_debounce_ms': 300,
  })),
}));

describe('searchCompaniesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      const { searchCompanies } = await import('../data/companies.ts');

      const mockCompanies = [
        { id: '1', name: 'Company 1', slug: 'company-1' },
        { id: '2', name: 'Company 2', slug: 'company-2' },
      ];

      vi.mocked(searchCompanies).mockResolvedValue(mockCompanies as any);

      const result = await searchCompaniesAction({
        query: 'test',
        limit: 10,
      });

      expect(searchCompanies).toHaveBeenCalledWith('test', 10);
      expect(result).toEqual({
        companies: mockCompanies,
        debounceMs: 300,
      });
    });

    it('should default limit to 10', async () => {
      const { searchCompaniesAction } = await import('./companies.ts');
      const { searchCompanies } = await import('../data/companies.ts');

      vi.mocked(searchCompanies).mockResolvedValue([]);

      await searchCompaniesAction({
        query: 'test',
      });

      expect(searchCompanies).toHaveBeenCalledWith('test', 10);
    });
  });

  describe('error handling', () => {
    it('should handle searchCompanies errors', async () => {
      const { searchCompaniesAction } = await import('./companies.ts');
      const { searchCompanies } = await import('../data/companies.ts');
      const { logActionFailure } = await import('../errors.ts');

      const mockError = new Error('Search failed');
      vi.mocked(searchCompanies).mockRejectedValue(mockError);

      await expect(
        searchCompaniesAction({
          query: 'test',
        })
      ).rejects.toThrow();

      expect(logActionFailure).toHaveBeenCalledWith(
        'companies.searchCompanies',
        mockError,
        expect.objectContaining({
          query: 'test',
        })
      );
    });

    it('should handle getTimeoutConfig returning null config', async () => {
      const { searchCompaniesAction } = await import('./companies.ts');
      const { searchCompanies } = await import('../data/companies.ts');
      const { getTimeoutConfig } = await import('../config/static-configs.ts');

      vi.mocked(searchCompanies).mockResolvedValue([]);
      vi.mocked(getTimeoutConfig).mockReturnValue(null as any);

      const result = await searchCompaniesAction({
        query: 'test',
      });

      expect(result.debounceMs).toBe(300); // Should default to 300
    });

    it('should handle missing debounceMs in config', async () => {
      const { searchCompaniesAction } = await import('./companies.ts');
      const { searchCompanies } = await import('../data/companies.ts');
      const { getTimeoutConfig } = await import('../config/static-configs.ts');

      vi.mocked(searchCompanies).mockResolvedValue([]);
      vi.mocked(getTimeoutConfig).mockReturnValue({} as any);

      const result = await searchCompaniesAction({
        query: 'test',
      });

      expect(result.debounceMs).toBe(300); // Should default to 300
    });

    it('should handle searchCompanies returning null', async () => {
      const { searchCompaniesAction } = await import('./companies.ts');
      const { searchCompanies } = await import('../data/companies.ts');

      vi.mocked(searchCompanies).mockResolvedValue(null as any);

      const result = await searchCompaniesAction({
        query: 'test',
      });

      expect(result.companies).toBeNull();
    });

    it('should handle getTimeoutConfig returning null config', async () => {
      const { searchCompaniesAction } = await import('./companies.ts');
      const { searchCompanies } = await import('../data/companies.ts');
      const { getTimeoutConfig } = await import('../config/static-configs.ts');

      vi.mocked(searchCompanies).mockResolvedValue([]);
      vi.mocked(getTimeoutConfig).mockReturnValue(null as any);

      const result = await searchCompaniesAction({
        query: 'test',
      });

      expect(result.debounceMs).toBe(300); // Should default to 300
    });

    it('should handle missing debounceMs in config', async () => {
      const { searchCompaniesAction } = await import('./companies.ts');
      const { searchCompanies } = await import('../data/companies.ts');
      const { getTimeoutConfig } = await import('../config/static-configs.ts');

      vi.mocked(searchCompanies).mockResolvedValue([]);
      vi.mocked(getTimeoutConfig).mockReturnValue({} as any);

      const result = await searchCompaniesAction({
        query: 'test',
      });

      expect(result.debounceMs).toBe(300); // Should default to 300
    });

    it('should handle searchCompanies returning null', async () => {
      const { searchCompaniesAction } = await import('./companies.ts');
      const { searchCompanies } = await import('../data/companies.ts');

      vi.mocked(searchCompanies).mockResolvedValue(null as any);

      const result = await searchCompaniesAction({
        query: 'test',
      });

      expect(result.companies).toBeNull();
    });
  });
});

describe('getCompanyByIdAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      const { getCompanyAdminProfile } = await import('../data/companies.ts');

      const mockProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Company',
        slug: 'test-company',
        logo: 'https://example.com/logo.png',
        website: 'https://example.com',
        description: 'Test description',
      };

      vi.mocked(getCompanyAdminProfile).mockResolvedValue(mockProfile as any);

      const result = await getCompanyByIdAction({
        companyId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(getCompanyAdminProfile).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual({
        id: mockProfile.id,
        name: mockProfile.name,
        slug: mockProfile.slug,
        logo: mockProfile.logo,
        website: mockProfile.website,
        description: mockProfile.description,
      });
    });

    it('should return null when company not found', async () => {
      const { getCompanyByIdAction } = await import('./companies.ts');
      const { getCompanyAdminProfile } = await import('../data/companies.ts');

      vi.mocked(getCompanyAdminProfile).mockResolvedValue(null);

      const result = await getCompanyByIdAction({
        companyId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const { getCompanyByIdAction } = await import('./companies.ts');
      const { getCompanyAdminProfile } = await import('../data/companies.ts');

      vi.mocked(getCompanyAdminProfile).mockRejectedValue(new Error('Database error'));

      const result = await getCompanyByIdAction({
        companyId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result).toBeNull();
    });

    it('should handle profile with null/undefined fields', async () => {
      const { getCompanyByIdAction } = await import('./companies.ts');
      const { getCompanyAdminProfile } = await import('../data/companies.ts');

      const mockProfile = {
        id: null,
        name: undefined,
        slug: '',
        logo: null,
        website: undefined,
        description: null,
      };

      vi.mocked(getCompanyAdminProfile).mockResolvedValue(mockProfile as any);

      const result = await getCompanyByIdAction({
        companyId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result).toEqual({
        id: '',
        name: '',
        slug: '',
        logo: null,
        website: null,
        description: null,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle profile with null/undefined fields', async () => {
      const { getCompanyByIdAction } = await import('./companies.ts');
      const { getCompanyAdminProfile } = await import('../data/companies.ts');

      const mockProfile = {
        id: null,
        name: undefined,
        slug: '',
        logo: null,
        website: undefined,
        description: null,
      };

      vi.mocked(getCompanyAdminProfile).mockResolvedValue(mockProfile as any);

      const result = await getCompanyByIdAction({
        companyId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result).toEqual({
        id: '',
        name: '',
        slug: '',
        logo: null,
        website: null,
        description: null,
      });
    });
  });
});

describe('uploadCompanyLogoAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate image buffer and mime type', async () => {
      const { uploadCompanyLogoAction } = await import('./companies.ts');
      const { validateImageBuffer } = await import('../storage/image-utils.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({
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
      ).rejects.toThrow('Invalid image file');
    });

    it('should validate UUID for companyId when provided', async () => {
      const { uploadCompanyLogoAction } = await import('./companies.ts');
      const { validateImageBuffer } = await import('../storage/image-utils.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });

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
      const { validateImageBuffer } = await import('../storage/image-utils.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });

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
      const { validateImageBuffer } = await import('../storage/image-utils.ts');
      const { getCompanyAdminProfile } = await import('../data/companies.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });
      vi.mocked(getCompanyAdminProfile).mockResolvedValue({
        owner_id: 'different-user-id',
      } as any);

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
      const { validateImageBuffer } = await import('../storage/image-utils.ts');
      const { getCompanyAdminProfile } = await import('../data/companies.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });
      vi.mocked(getCompanyAdminProfile).mockResolvedValue(null);

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
      const { validateImageBuffer } = await import('../storage/image-utils.ts');
      const { uploadImageToStorage } = await import('../storage/image-storage.ts');
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });
      vi.mocked(createSupabaseAdminClient).mockResolvedValue({} as any);
      vi.mocked(uploadImageToStorage).mockResolvedValue({
        success: true,
        publicUrl: 'https://example.com/logo.png',
        path: 'logos/logo.png',
      });

      const result = await uploadCompanyLogoAction({
        fileName: 'logo.png',
        mimeType: 'image/png',
        fileBase64: Buffer.from('test-image').toString('base64'),
      } as any);

      expect(uploadImageToStorage).toHaveBeenCalledWith({
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
      const { validateImageBuffer } = await import('../storage/image-utils.ts');
      const { uploadImageToStorage, deleteImageFromStorage } = await import('../storage/image-storage.ts');
      const { extractPathFromUrl } = await import('../storage/image-utils.ts');
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });
      vi.mocked(createSupabaseAdminClient).mockResolvedValue({} as any);
      vi.mocked(uploadImageToStorage).mockResolvedValue({
        success: true,
        publicUrl: 'https://example.com/new-logo.png',
        path: 'logos/new-logo.png',
      });
      vi.mocked(extractPathFromUrl).mockReturnValue('logos/old-logo.png');

      await uploadCompanyLogoAction({
        fileName: 'new-logo.png',
        mimeType: 'image/png',
        fileBase64: Buffer.from('test-image').toString('base64'),
        oldLogoUrl: 'https://example.com/old-logo.png',
      } as any);

      expect(deleteImageFromStorage).toHaveBeenCalledWith('company-logos', 'logos/old-logo.png', {});
    });

    it('should handle upload errors', async () => {
      const { uploadCompanyLogoAction } = await import('./companies.ts');
      const { validateImageBuffer } = await import('../storage/image-utils.ts');
      const { uploadImageToStorage } = await import('../storage/image-storage.ts');
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      const { logActionFailure } = await import('../errors.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });
      vi.mocked(createSupabaseAdminClient).mockResolvedValue({} as any);
      vi.mocked(uploadImageToStorage).mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });

      await expect(
        uploadCompanyLogoAction({
          fileName: 'logo.png',
          mimeType: 'image/png',
          fileBase64: Buffer.from('test').toString('base64'),
        } as any)
      ).rejects.toThrow('Failed to upload logo');

      expect(logActionFailure).toHaveBeenCalledWith(
        'companies.uploadCompanyLogo',
        expect.any(Error),
        expect.objectContaining({
          userId: 'test-user-id',
        })
      );
    });

    it('should handle invalid base64 in fileBase64', async () => {
      const { uploadCompanyLogoAction } = await import('./companies.ts');
      const { validateImageBuffer } = await import('../storage/image-utils.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });

      // Invalid base64 will cause Buffer.from to potentially fail or create invalid buffer
      await expect(
        uploadCompanyLogoAction({
          fileName: 'logo.png',
          mimeType: 'image/png',
          fileBase64: '!!!invalid-base64!!!',
        } as any)
      ).rejects.toThrow();
    });

    it('should handle extractPathFromUrl returning null', async () => {
      const { uploadCompanyLogoAction } = await import('./companies.ts');
      const { validateImageBuffer } = await import('../storage/image-utils.ts');
      const { uploadImageToStorage } = await import('../storage/image-storage.ts');
      const { extractPathFromUrl } = await import('../storage/image-utils.ts');
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });
      vi.mocked(createSupabaseAdminClient).mockResolvedValue({} as any);
      vi.mocked(uploadImageToStorage).mockResolvedValue({
        success: true,
        publicUrl: 'https://example.com/new-logo.png',
        path: 'logos/new-logo.png',
      });
      vi.mocked(extractPathFromUrl).mockReturnValue(null);

      // Should not throw when extractPathFromUrl returns null (old logo deletion skipped)
      const result = await uploadCompanyLogoAction({
        fileName: 'new-logo.png',
        mimeType: 'image/png',
        fileBase64: Buffer.from('test-image').toString('base64'),
        oldLogoUrl: 'https://example.com/old-logo.png',
      } as any);

      expect(result.success).toBe(true);
      // deleteImageFromStorage should not be called when extractPathFromUrl returns null
    });

    it('should handle createSupabaseAdminClient errors', async () => {
      const { uploadCompanyLogoAction } = await import('./companies.ts');
      const { validateImageBuffer } = await import('../storage/image-utils.ts');
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      const { logActionFailure } = await import('../errors.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });
      vi.mocked(createSupabaseAdminClient).mockRejectedValue(new Error('Admin client error'));

      await expect(
        uploadCompanyLogoAction({
          fileName: 'logo.png',
          mimeType: 'image/png',
          fileBase64: Buffer.from('test').toString('base64'),
        } as any)
      ).rejects.toThrow();

      expect(logActionFailure).toHaveBeenCalled();
    });

    it('should handle uploadImageToStorage returning success=true but publicUrl=null', async () => {
      const { uploadCompanyLogoAction } = await import('./companies.ts');
      const { validateImageBuffer } = await import('../storage/image-utils.ts');
      const { uploadImageToStorage } = await import('../storage/image-storage.ts');
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });
      vi.mocked(createSupabaseAdminClient).mockResolvedValue({} as any);
      vi.mocked(uploadImageToStorage).mockResolvedValue({
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
      const { validateImageBuffer } = await import('../storage/image-utils.ts');
      const { getCompanyAdminProfile } = await import('../data/companies.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({ valid: true });
      vi.mocked(getCompanyAdminProfile).mockResolvedValue({
        owner_id: null,
      } as any);

      // Should throw permission error when owner_id is null
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
      const { validateImageBuffer } = await import('../storage/image-utils.ts');

      vi.mocked(validateImageBuffer).mockReturnValue({
        valid: false,
        error: undefined, // No error message
      });

      await expect(
        uploadCompanyLogoAction({
          fileName: 'logo.png',
          mimeType: 'image/png',
          fileBase64: Buffer.from('test').toString('base64'),
        } as any)
      ).rejects.toThrow('Invalid image file');
    });
  });
});
