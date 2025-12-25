import { describe, expect, it, jest, beforeEach } from '@jest/globals';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// DO NOT mock next/headers - safemocker handles this automatically
// DO NOT mock Supabase client or auth - safemocker handles auth automatically
// safemocker's __mocks__/next-safe-action.ts provides pre-configured authedAction
// with auth context already injected (test-user-id, test@example.com, test-token)

// Mock logger (used by safe-action middleware and actions)
jest.mock('../logger.ts', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    })),
  },
  toLogContextValue: (val: unknown) => val,
}));

// Mock errors (used by safe-action middleware) - keep real behavior for error normalization
jest.mock('../errors.ts', () => ({
  normalizeError: (error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
  logActionFailure: jest.fn((name, error, context) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock environment (used by safe-action error handling)
jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  const envMock: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    POSTGRES_PRISMA_URL: undefined,
    DIRECT_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    VERCEL: undefined,
    VITEST: undefined,
  };

  return {
    env: new Proxy(envMock, {
      get: (target, prop: string) => {
        if (prop === 'isProduction') {
          return false;
        }
        return target[prop];
      },
    }),
    get isProduction() {
      return false;
    },
  };
});

// DO NOT mock safe-action.ts - use REAL middleware to test SafeActionResult structure
// This ensures we test the complete middleware chain: auth → rate limiting → logging → error handling

// Mock Supabase client (MFA functions need Supabase client)
const mockSupabase = {
  auth: {
    mfa: {
      listFactors: jest.fn(),
      enrollFactor: jest.fn(),
      challengeFactor: jest.fn(),
      verifyChallenge: jest.fn(),
      unenrollFactor: jest.fn(),
    },
    refreshSession: jest.fn().mockResolvedValue({}),
    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
  },
};

jest.mock('../supabase/server.ts', () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue(mockSupabase),
}));

// Mock MFA functions
const mockListMFAFactors = jest.fn();
const mockEnrollTOTPFactor = jest.fn();
const mockCreateMFAChallenge = jest.fn();
const mockVerifyMFAChallenge = jest.fn();
const mockUnenrollMFAFactor = jest.fn();
const mockGetAuthenticatorAssuranceLevel = jest.fn();
const mockRequiresMFAChallenge = jest.fn();

jest.mock('../auth/mfa.ts', () => ({
  listMFAFactors: (...args: any[]) => mockListMFAFactors(...args),
  enrollTOTPFactor: (...args: any[]) => mockEnrollTOTPFactor(...args),
  createMFAChallenge: (...args: any[]) => mockCreateMFAChallenge(...args),
  verifyMFAChallenge: (...args: any[]) => mockVerifyMFAChallenge(...args),
  unenrollMFAFactor: (...args: any[]) => mockUnenrollMFAFactor(...args),
  getAuthenticatorAssuranceLevel: (...args: any[]) => mockGetAuthenticatorAssuranceLevel(...args),
  requiresMFAChallenge: (...args: any[]) => mockRequiresMFAChallenge(...args),
}));

// Mock Inngest client (used by verifyMFAChallengeAction and unenrollMFAAction)
const mockInngestSend = jest.fn().mockResolvedValue(undefined);
jest.mock('../inngest/client.ts', () => ({
  inngest: {
    send: (...args: any[]) => mockInngestSend(...args),
  },
}));

// Mock next/cache
const mockRevalidatePath = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

describe('listMFAAction', () => {
  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Clear all mocks
    jest.clearAllMocks();
  });

  it('should return factors from listMFAFactors', async () => {
    const { listMFAAction } = await import('./mfa.ts');

    const mockFactors = [
      {
        id: 'factor-1',
        friendly_name: 'My TOTP',
        factor_type: 'totp',
        status: 'verified',
        created_at: '2024-01-01',
      },
    ];

    mockListMFAFactors.mockResolvedValue({
      factors: mockFactors,
      error: null,
    });

    const result = await listMFAAction();

    // Verify SafeActionResult structure
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<{ factors: typeof mockFactors }>;
    expect(safeResult.data).toBeDefined();
    expect(safeResult.serverError).toBeUndefined();
    expect(safeResult.fieldErrors).toBeUndefined();

    expect(mockListMFAFactors).toHaveBeenCalledWith(mockSupabase);
    expect(safeResult.data?.factors).toEqual(mockFactors);
  });

  it('should return serverError when listMFAFactors returns error', async () => {
    const { listMFAAction } = await import('./mfa.ts');

    const mockError = new Error('Failed to list factors');
    mockListMFAFactors.mockResolvedValue({
      factors: [],
      error: mockError,
    });

    const result = await listMFAAction();

    // Verify SafeActionResult structure with serverError
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<never>;
    expect(safeResult.serverError).toBeDefined();
    expect(safeResult.data).toBeUndefined();
    expect(safeResult.fieldErrors).toBeUndefined();
  });
});

describe('enrollTOTPAction', () => {
  beforeEach(async () => {
    clearRequestCache();
    jest.clearAllMocks();
  });

  it('should return enrollment data from enrollTOTPFactor', async () => {
    const { enrollTOTPAction } = await import('./mfa.ts');

    const mockEnrollment = {
      id: 'factor-1',
      qr_code: 'data:image/png;base64,...',
      secret: 'JBSWY3DPEHPK3PXP',
      uri: 'otpauth://totp/...',
    };

    mockEnrollTOTPFactor.mockResolvedValue({
      data: mockEnrollment,
      error: null,
    });

    const result = await enrollTOTPAction();

    // Verify SafeActionResult structure
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<{ enrollment: typeof mockEnrollment }>;
    expect(safeResult.data).toBeDefined();
    expect(safeResult.serverError).toBeUndefined();
    expect(safeResult.fieldErrors).toBeUndefined();

    expect(mockEnrollTOTPFactor).toHaveBeenCalledWith(mockSupabase);
    expect(safeResult.data?.enrollment).toEqual(mockEnrollment);
  });

  it('should return serverError when enrollTOTPFactor returns error', async () => {
    const { enrollTOTPAction } = await import('./mfa.ts');

    const mockError = new Error('Enrollment failed');
    mockEnrollTOTPFactor.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const result = await enrollTOTPAction();

    // Verify SafeActionResult structure with serverError
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<never>;
    expect(safeResult.serverError).toBeDefined();
    expect(safeResult.data).toBeUndefined();
  });

  it('should return serverError when no data returned', async () => {
    const { enrollTOTPAction } = await import('./mfa.ts');

    mockEnrollTOTPFactor.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await enrollTOTPAction();

    // Verify SafeActionResult structure with serverError
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<never>;
    expect(safeResult.serverError).toBeDefined();
    expect(safeResult.data).toBeUndefined();
  });
});

describe('createMFAChallengeAction', () => {
  beforeEach(async () => {
    clearRequestCache();
    jest.clearAllMocks();
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid UUID factorId', async () => {
      const { createMFAChallengeAction } = await import('./mfa.ts');

      // Call with invalid UUID
      const result = await createMFAChallengeAction({
        factorId: 'invalid-uuid',
      } as any);

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify field errors for invalid UUID
      expect(safeResult.fieldErrors?.factorId).toBeDefined();
    });
  });

  describe('challenge creation', () => {
    it('should return challenge data from createMFAChallenge', async () => {
      const { createMFAChallengeAction } = await import('./mfa.ts');

      const mockChallenge = {
        id: 'challenge-1',
        expires_at: '2024-01-01T12:00:00Z',
      };

      mockCreateMFAChallenge.mockResolvedValue({
        data: mockChallenge,
        error: null,
      });

      const result = await createMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{ challenge: typeof mockChallenge }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      expect(mockCreateMFAChallenge).toHaveBeenCalledWith(
        mockSupabase,
        '123e4567-e89b-12d3-a456-426614174000'
      );
      expect(safeResult.data?.challenge).toEqual(mockChallenge);
    });

    it('should return serverError when createMFAChallenge returns error', async () => {
      const { createMFAChallengeAction } = await import('./mfa.ts');

      const mockError = new Error('Challenge creation failed');
      mockCreateMFAChallenge.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await createMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Verify SafeActionResult structure with serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
    });

    it('should return serverError when no data returned', async () => {
      const { createMFAChallengeAction } = await import('./mfa.ts');

      mockCreateMFAChallenge.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await createMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Verify SafeActionResult structure with serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
    });
  });
});

describe('verifyMFAChallengeAction', () => {
  beforeEach(async () => {
    clearRequestCache();
    jest.clearAllMocks();
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid UUID factorId', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');

      // Call with invalid UUID
      const result = await verifyMFAChallengeAction({
        factorId: 'invalid-uuid',
        challengeId: '123e4567-e89b-12d3-a456-426614174000',
        code: '123456',
      } as any);

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();

      expect(safeResult.fieldErrors?.factorId).toBeDefined();
    });

    it('should return fieldErrors for invalid UUID challengeId', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');

      // Call with invalid UUID
      const result = await verifyMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
        challengeId: 'invalid-uuid',
        code: '123456',
      } as any);

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.fieldErrors?.challengeId).toBeDefined();
    });

    it('should return fieldErrors for invalid code format', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');

      // Test with too short code
      const result1 = await verifyMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
        challengeId: '123e4567-e89b-12d3-a456-426614174001',
        code: '12345',
      } as any);

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult1 = result1 as SafeActionResult<never>;
      expect(safeResult1.fieldErrors).toBeDefined();
      expect(safeResult1.fieldErrors?.code).toBeDefined();

      // Test with too long code
      const result2 = await verifyMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
        challengeId: '123e4567-e89b-12d3-a456-426614174001',
        code: '1234567',
      } as any);

      const safeResult2 = result2 as SafeActionResult<never>;
      expect(safeResult2.fieldErrors).toBeDefined();
      expect(safeResult2.fieldErrors?.code).toBeDefined();

      // Test with non-numeric code
      const result3 = await verifyMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
        challengeId: '123e4567-e89b-12d3-a456-426614174001',
        code: 'abcdef',
      } as any);

      const safeResult3 = result3 as SafeActionResult<never>;
      expect(safeResult3.fieldErrors).toBeDefined();
      expect(safeResult3.fieldErrors?.code).toBeDefined();
    });
  });

  describe('verification', () => {
    it('should verify challenge and revalidate paths', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');

      const mockFactor = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        friendly_name: 'My TOTP',
        factor_type: 'totp',
        status: 'verified',
        created_at: '2024-01-01',
      };

      mockListMFAFactors.mockResolvedValue({
        factors: [mockFactor],
        error: null,
      });

      mockVerifyMFAChallenge.mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await verifyMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
        challengeId: '123e4567-e89b-12d3-a456-426614174001',
        code: '123456',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{ success: boolean }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      expect(mockVerifyMFAChallenge).toHaveBeenCalledWith(
        mockSupabase,
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        '123456'
      );

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/settings');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
      expect(safeResult.data?.success).toBe(true);

      // Verify Inngest email event was sent
      expect(mockInngestSend).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'email/transactional',
          data: expect.objectContaining({
            type: 'mfa-factor-added',
            email: 'test@example.com',
          }),
        })
      );
    });

    it('should return serverError when verification fails', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');

      mockListMFAFactors.mockResolvedValue({
        factors: [],
        error: null,
      });

      const mockError = new Error('Verification failed');
      mockVerifyMFAChallenge.mockResolvedValue({
        success: false,
        error: mockError,
      });

      const result = await verifyMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
        challengeId: '123e4567-e89b-12d3-a456-426614174001',
        code: '123456',
      });

      // Verify SafeActionResult structure with serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
    });

    it('should return serverError when success is false', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');

      mockListMFAFactors.mockResolvedValue({
        factors: [],
        error: null,
      });

      mockVerifyMFAChallenge.mockResolvedValue({
        success: false,
        error: null,
      });

      const result = await verifyMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
        challengeId: '123e4567-e89b-12d3-a456-426614174001',
        code: '123456',
      });

      // Verify SafeActionResult structure with serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
    });
  });
});

describe('unenrollMFAAction', () => {
  beforeEach(async () => {
    clearRequestCache();
    jest.clearAllMocks();
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid UUID factorId', async () => {
      const { unenrollMFAAction } = await import('./mfa.ts');

      // Call with invalid UUID
      const result = await unenrollMFAAction({
        factorId: 'invalid-uuid',
      } as any);

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();

      expect(safeResult.fieldErrors?.factorId).toBeDefined();
    });
  });

  describe('unenrollment', () => {
    it('should unenroll factor and revalidate paths', async () => {
      const { unenrollMFAAction } = await import('./mfa.ts');

      const mockFactorToRemove = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        friendly_name: 'My TOTP',
        factor_type: 'totp',
        status: 'verified',
        created_at: '2024-01-01',
      };

      // Mock multiple factors (so unenrollment is allowed)
      mockListMFAFactors.mockResolvedValue({
        factors: [{ id: 'factor-1', status: 'verified' }, mockFactorToRemove],
        error: null,
      });

      mockUnenrollMFAFactor.mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await unenrollMFAAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{ success: boolean }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      expect(mockListMFAFactors).toHaveBeenCalledWith(mockSupabase);
      expect(mockUnenrollMFAFactor).toHaveBeenCalledWith(
        mockSupabase,
        '123e4567-e89b-12d3-a456-426614174000'
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account/settings');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/account');
      expect(safeResult.data?.success).toBe(true);

      // Verify Inngest email event was sent
      expect(mockInngestSend).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'email/transactional',
          data: expect.objectContaining({
            type: 'mfa-factor-removed',
            email: 'test@example.com',
          }),
        })
      );
    });

    it('should return serverError when trying to unenroll last factor', async () => {
      const { unenrollMFAAction } = await import('./mfa.ts');

      // Mock only one verified factor
      mockListMFAFactors.mockResolvedValue({
        factors: [{ id: 'factor-1', status: 'verified' }],
        error: null,
      });

      const result = await unenrollMFAAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Verify SafeActionResult structure with serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
    });

    it('should return serverError when unenrollMFAFactor returns error', async () => {
      const { unenrollMFAAction } = await import('./mfa.ts');

      mockListMFAFactors.mockResolvedValue({
        factors: [
          { id: 'factor-1', status: 'verified' },
          { id: 'factor-2', status: 'verified' },
        ],
        error: null,
      });

      const mockError = new Error('Unenrollment failed');
      mockUnenrollMFAFactor.mockResolvedValue({
        success: false,
        error: mockError,
      });

      const result = await unenrollMFAAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Verify SafeActionResult structure with serverError
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
    });
  });
});

describe('getAALAction', () => {
  beforeEach(async () => {
    clearRequestCache();
    jest.clearAllMocks();
  });

  it('should return AAL from getAuthenticatorAssuranceLevel', async () => {
    const { getAALAction } = await import('./mfa.ts');

    const mockAAL = {
      currentLevel: 'aal1',
      nextLevel: 'aal2',
    };

    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: mockAAL,
      error: null,
    });

    const result = await getAALAction();

    // Verify SafeActionResult structure
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<{ aal: typeof mockAAL }>;
    expect(safeResult.data).toBeDefined();
    expect(safeResult.serverError).toBeUndefined();
    expect(safeResult.fieldErrors).toBeUndefined();

    expect(mockGetAuthenticatorAssuranceLevel).toHaveBeenCalledWith(mockSupabase);
    expect(safeResult.data?.aal).toEqual(mockAAL);
  });

  it('should return serverError when getAuthenticatorAssuranceLevel returns error', async () => {
    const { getAALAction } = await import('./mfa.ts');

    const mockError = new Error('Failed to get AAL');
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const result = await getAALAction();

    // Verify SafeActionResult structure with serverError
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<never>;
    expect(safeResult.serverError).toBeDefined();
    expect(safeResult.data).toBeUndefined();
  });

  it('should return serverError when no data returned', async () => {
    const { getAALAction } = await import('./mfa.ts');

    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await getAALAction();

    // Verify SafeActionResult structure with serverError
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<never>;
    expect(safeResult.serverError).toBeDefined();
    expect(safeResult.data).toBeUndefined();
  });
});

describe('checkMFARequiredAction', () => {
  beforeEach(async () => {
    clearRequestCache();
    jest.clearAllMocks();
  });

  it('should return requires status from requiresMFAChallenge', async () => {
    const { checkMFARequiredAction } = await import('./mfa.ts');

    mockRequiresMFAChallenge.mockResolvedValue({
      requires: true,
      error: null,
    });

    const result = await checkMFARequiredAction();

    // Verify SafeActionResult structure
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<{ requires: boolean }>;
    expect(safeResult.data).toBeDefined();
    expect(safeResult.serverError).toBeUndefined();
    expect(safeResult.fieldErrors).toBeUndefined();

    expect(mockRequiresMFAChallenge).toHaveBeenCalledWith(mockSupabase);
    expect(safeResult.data?.requires).toBe(true);
  });

  it('should return serverError when requiresMFAChallenge returns error', async () => {
    const { checkMFARequiredAction } = await import('./mfa.ts');

    const mockError = new Error('Failed to check MFA requirement');
    mockRequiresMFAChallenge.mockResolvedValue({
      requires: false,
      error: mockError,
    });

    const result = await checkMFARequiredAction();

    // Verify SafeActionResult structure with serverError
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<never>;
    expect(safeResult.serverError).toBeDefined();
    expect(safeResult.data).toBeUndefined();
  });
});

describe('authentication', () => {
  beforeEach(async () => {
    clearRequestCache();
    jest.clearAllMocks();
  });

  it('should inject auth context from safemocker', async () => {
    const { listMFAAction } = await import('./mfa.ts');

    const mockFactors = [
      {
        id: 'factor-1',
        friendly_name: 'My TOTP',
        factor_type: 'totp',
        status: 'verified',
        created_at: '2024-01-01',
      },
    ];

    mockListMFAFactors.mockResolvedValue({
      factors: mockFactors,
      error: null,
    });

    const result = await listMFAAction();

    // Verify SafeActionResult structure
    // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
    const safeResult = result as SafeActionResult<{ factors: typeof mockFactors }>;
    expect(safeResult.data).toBeDefined();
    expect(safeResult.serverError).toBeUndefined();
    expect(safeResult.validationErrors).toBeUndefined();

    // Verify auth context was injected (ctx.userId = 'test-user-id' from safemocker)
    // Note: The action doesn't directly use ctx, but safemocker provides it
    // We verify the action works correctly with auth context
    expect(safeResult.data?.factors).toEqual(mockFactors);
  });
});
