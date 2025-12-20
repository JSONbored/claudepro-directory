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

// Mock Supabase client
vi.mock('../supabase/server.ts', () => ({
  createSupabaseServerClient: vi.fn(),
}));

// Mock MFA functions
vi.mock('../auth/mfa.ts', () => ({
  listMFAFactors: vi.fn(),
  enrollTOTPFactor: vi.fn(),
  createMFAChallenge: vi.fn(),
  verifyMFAChallenge: vi.fn(),
  unenrollMFAFactor: vi.fn(),
  getAuthenticatorAssuranceLevel: vi.fn(),
  requiresMFAChallenge: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe.skip('listMFAAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return factors from listMFAFactors', async () => {
    const { listMFAAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { listMFAFactors } = await import('../auth/mfa.ts');

    const mockSupabase = {
      auth: {
        mfa: {
          listFactors: vi.fn(),
        },
      },
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const mockFactors = [
      {
        id: 'factor-1',
        friendly_name: 'My TOTP',
        factor_type: 'totp',
        status: 'verified',
        created_at: '2024-01-01',
      },
    ];

    vi.mocked(listMFAFactors).mockResolvedValue({
      factors: mockFactors,
      error: null,
    });

    const result = await listMFAAction({});

    expect(listMFAFactors).toHaveBeenCalledWith(mockSupabase);
    expect(result).toEqual({ factors: mockFactors });
  });

  it('should throw error when listMFAFactors returns error', async () => {
    const { listMFAAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { listMFAFactors } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const mockError = new Error('Failed to list factors');
    vi.mocked(listMFAFactors).mockResolvedValue({
      factors: [],
      error: mockError,
    });

    await expect(listMFAAction({})).rejects.toThrow('Failed to list factors');
  });
});

describe.skip('enrollTOTPAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return enrollment data from enrollTOTPFactor', async () => {
    const { enrollTOTPAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { enrollTOTPFactor } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const mockEnrollment = {
      id: 'factor-1',
      qr_code: 'data:image/png;base64,...',
      secret: 'JBSWY3DPEHPK3PXP',
      uri: 'otpauth://totp/...',
    };

    vi.mocked(enrollTOTPFactor).mockResolvedValue({
      data: mockEnrollment,
      error: null,
    });

    const result = await enrollTOTPAction({});

    expect(enrollTOTPFactor).toHaveBeenCalledWith(mockSupabase);
    expect(result).toEqual({ enrollment: mockEnrollment });
  });

  it('should throw error when enrollTOTPFactor returns error', async () => {
    const { enrollTOTPAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { enrollTOTPFactor } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const mockError = new Error('Enrollment failed');
    vi.mocked(enrollTOTPFactor).mockResolvedValue({
      data: null,
      error: mockError,
    });

    await expect(enrollTOTPAction({})).rejects.toThrow('Enrollment failed');
  });

  it('should throw error when no data returned', async () => {
    const { enrollTOTPAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { enrollTOTPFactor } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(enrollTOTPFactor).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(enrollTOTPAction({})).rejects.toThrow('TOTP enrollment failed');
  });
});

describe.skip('createMFAChallengeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate UUID for factorId', async () => {
      const { createMFAChallengeAction } = await import('./mfa.ts');

      await expect(
        createMFAChallengeAction({
          factorId: 'invalid-uuid',
        } as any)
      ).rejects.toThrow('Invalid factor ID');
    });
  });

  describe('challenge creation', () => {
    it('should return challenge data from createMFAChallenge', async () => {
      const { createMFAChallengeAction } = await import('./mfa.ts');
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const { createMFAChallenge } = await import('../auth/mfa.ts');

      const mockSupabase = {};
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const mockChallenge = {
        id: 'challenge-1',
        expires_at: '2024-01-01T12:00:00Z',
      };

      vi.mocked(createMFAChallenge).mockResolvedValue({
        data: mockChallenge,
        error: null,
      });

      const result = await createMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(createMFAChallenge).toHaveBeenCalledWith(
        mockSupabase,
        '123e4567-e89b-12d3-a456-426614174000'
      );
      expect(result).toEqual({ challenge: mockChallenge });
    });

    it('should throw error when createMFAChallenge returns error', async () => {
      const { createMFAChallengeAction } = await import('./mfa.ts');
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const { createMFAChallenge } = await import('../auth/mfa.ts');

      const mockSupabase = {};
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const mockError = new Error('Challenge creation failed');
      vi.mocked(createMFAChallenge).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        createMFAChallengeAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow('Challenge creation failed');
    });

    it('should throw error when no data returned', async () => {
      const { createMFAChallengeAction } = await import('./mfa.ts');
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const { createMFAChallenge } = await import('../auth/mfa.ts');

      const mockSupabase = {};
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      vi.mocked(createMFAChallenge).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        createMFAChallengeAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow('MFA challenge creation failed');
    });
  });
});

describe.skip('verifyMFAChallengeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate UUIDs for factorId and challengeId', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');

      await expect(
        verifyMFAChallengeAction({
          factorId: 'invalid-uuid',
          challengeId: '123e4567-e89b-12d3-a456-426614174000',
          code: '123456',
        } as any)
      ).rejects.toThrow('Invalid factor ID');

      await expect(
        verifyMFAChallengeAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
          challengeId: 'invalid-uuid',
          code: '123456',
        } as any)
      ).rejects.toThrow('Invalid challenge ID');
    });

    it('should validate code format (6 digits)', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');

      // Too short
      await expect(
        verifyMFAChallengeAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
          challengeId: '123e4567-e89b-12d3-a456-426614174000',
          code: '12345',
        } as any)
      ).rejects.toThrow();

      // Too long
      await expect(
        verifyMFAChallengeAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
          challengeId: '123e4567-e89b-12d3-a456-426614174000',
          code: '1234567',
        } as any)
      ).rejects.toThrow();

      // Non-numeric
      await expect(
        verifyMFAChallengeAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
          challengeId: '123e4567-e89b-12d3-a456-426614174000',
          code: 'abcdef',
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('verification', () => {
    it('should verify challenge and revalidate paths', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const { verifyMFAChallenge } = await import('../auth/mfa.ts');
      const { revalidatePath } = await import('next/cache');

      const mockSupabase = {
        auth: {
          refreshSession: vi.fn().mockResolvedValue({}),
        },
      };
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      vi.mocked(verifyMFAChallenge).mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await verifyMFAChallengeAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
        challengeId: '123e4567-e89b-12d3-a456-426614174001',
        code: '123456',
      });

      expect(verifyMFAChallenge).toHaveBeenCalledWith(
        mockSupabase,
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        '123456'
      );

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/account/settings');
      expect(revalidatePath).toHaveBeenCalledWith('/account');
      expect(result).toEqual({ success: true });
    });

    it('should throw error when verification fails', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const { verifyMFAChallenge } = await import('../auth/mfa.ts');

      const mockSupabase = {
        auth: {
          refreshSession: vi.fn(),
        },
      };
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const mockError = new Error('Verification failed');
      vi.mocked(verifyMFAChallenge).mockResolvedValue({
        success: false,
        error: mockError,
      });

      await expect(
        verifyMFAChallengeAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
          challengeId: '123e4567-e89b-12d3-a456-426614174001',
          code: '123456',
        })
      ).rejects.toThrow('Verification failed');
    });

    it('should throw error when success is false', async () => {
      const { verifyMFAChallengeAction } = await import('./mfa.ts');
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const { verifyMFAChallenge } = await import('../auth/mfa.ts');

      const mockSupabase = {
        auth: {
          refreshSession: vi.fn(),
        },
      };
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      vi.mocked(verifyMFAChallenge).mockResolvedValue({
        success: false,
        error: null,
      });

      await expect(
        verifyMFAChallengeAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
          challengeId: '123e4567-e89b-12d3-a456-426614174001',
          code: '123456',
        })
      ).rejects.toThrow('MFA verification failed');
    });
  });
});

describe.skip('unenrollMFAAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate UUID for factorId', async () => {
      const { unenrollMFAAction } = await import('./mfa.ts');

      await expect(
        unenrollMFAAction({
          factorId: 'invalid-uuid',
        } as any)
      ).rejects.toThrow('Invalid factor ID');
    });
  });

  describe('unenrollment', () => {
    it('should unenroll factor and revalidate paths', async () => {
      const { unenrollMFAAction } = await import('./mfa.ts');
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const { listMFAFactors, unenrollMFAFactor } = await import('../auth/mfa.ts');
      const { revalidatePath } = await import('next/cache');

      const mockSupabase = {};
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      // Mock multiple factors (so unenrollment is allowed)
      vi.mocked(listMFAFactors).mockResolvedValue({
        factors: [
          { id: 'factor-1', status: 'verified' },
          { id: 'factor-2', status: 'verified' },
        ],
        error: null,
      });

      vi.mocked(unenrollMFAFactor).mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await unenrollMFAAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(listMFAFactors).toHaveBeenCalledWith(mockSupabase);
      expect(unenrollMFAFactor).toHaveBeenCalledWith(
        mockSupabase,
        '123e4567-e89b-12d3-a456-426614174000'
      );
      expect(revalidatePath).toHaveBeenCalledWith('/account/settings');
      expect(revalidatePath).toHaveBeenCalledWith('/account');
      expect(result).toEqual({ success: true });
    });

    it('should prevent unenrolling last factor', async () => {
      const { unenrollMFAAction } = await import('./mfa.ts');
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const { listMFAFactors } = await import('../auth/mfa.ts');

      const mockSupabase = {};
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      // Mock only one verified factor
      vi.mocked(listMFAFactors).mockResolvedValue({
        factors: [{ id: 'factor-1', status: 'verified' }],
        error: null,
      });

      await expect(
        unenrollMFAAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow('Cannot unenroll your last MFA factor');
    });

    it('should throw error when unenrollMFAFactor returns error', async () => {
      const { unenrollMFAAction } = await import('./mfa.ts');
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const { listMFAFactors, unenrollMFAFactor } = await import('../auth/mfa.ts');

      const mockSupabase = {};
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      vi.mocked(listMFAFactors).mockResolvedValue({
        factors: [
          { id: 'factor-1', status: 'verified' },
          { id: 'factor-2', status: 'verified' },
        ],
        error: null,
      });

      const mockError = new Error('Unenrollment failed');
      vi.mocked(unenrollMFAFactor).mockResolvedValue({
        success: false,
        error: mockError,
      });

      await expect(
        unenrollMFAAction({
          factorId: '123e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow('Unenrollment failed');
    });
  });
});

describe.skip('getAALAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return AAL from getAuthenticatorAssuranceLevel', async () => {
    const { getAALAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { getAuthenticatorAssuranceLevel } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const mockAAL = {
      currentLevel: 'aal1',
      nextLevel: 'aal2',
    };

    vi.mocked(getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: mockAAL,
      error: null,
    });

    const result = await getAALAction({});

    expect(getAuthenticatorAssuranceLevel).toHaveBeenCalledWith(mockSupabase);
    expect(result).toEqual({ aal: mockAAL });
  });

  it('should throw error when getAuthenticatorAssuranceLevel returns error', async () => {
    const { getAALAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { getAuthenticatorAssuranceLevel } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const mockError = new Error('Failed to get AAL');
    vi.mocked(getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: null,
      error: mockError,
    });

    await expect(getAALAction({})).rejects.toThrow('Failed to get AAL');
  });

  it('should throw error when no data returned', async () => {
    const { getAALAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { getAuthenticatorAssuranceLevel } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(getAALAction({})).rejects.toThrow('Failed to get AAL');
  });
});

describe.skip('checkMFARequiredAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return requires status from requiresMFAChallenge', async () => {
    const { checkMFARequiredAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { requiresMFAChallenge } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(requiresMFAChallenge).mockResolvedValue({
      requires: true,
      error: null,
    });

    const result = await checkMFARequiredAction({});

    expect(requiresMFAChallenge).toHaveBeenCalledWith(mockSupabase);
    expect(result).toEqual({ requires: true });
  });

  it('should throw error when requiresMFAChallenge returns error', async () => {
    const { checkMFARequiredAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { requiresMFAChallenge } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const mockError = new Error('Failed to check MFA requirement');
    vi.mocked(requiresMFAChallenge).mockResolvedValue({
      requires: false,
      error: mockError,
    });

    await expect(checkMFARequiredAction({})).rejects.toThrow('Failed to check MFA requirement');
  });
});

describe.skip('edge cases', () => {
  it('should handle createSupabaseServerClient errors', async () => {
    const { listMFAAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');

    vi.mocked(createSupabaseServerClient).mockRejectedValue(new Error('Client creation failed'));

    await expect(listMFAAction({})).rejects.toThrow();
  });

  it('should handle listMFAFactors returning null factors', async () => {
    const { listMFAAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { listMFAFactors } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(listMFAFactors).mockResolvedValue({
      factors: null as any,
      error: null,
    });

    const result = await listMFAAction({});

    expect(result.factors).toBeNull();
  });

  it('should handle refreshSession errors in verifyMFAChallengeAction', async () => {
    const { verifyMFAChallengeAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { verifyMFAChallenge } = await import('../auth/mfa.ts');

    const mockSupabase = {
      auth: {
        refreshSession: vi.fn().mockRejectedValue(new Error('Refresh failed')),
      },
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(verifyMFAChallenge).mockResolvedValue({
      success: true,
      error: null,
    });

    // Should still succeed even if refreshSession fails
    const result = await verifyMFAChallengeAction({
      factorId: '123e4567-e89b-12d3-a456-426614174000',
      challengeId: '123e4567-e89b-12d3-a456-426614174001',
      code: '123456',
    });

    expect(result.success).toBe(true);
  });

  it('should handle revalidatePath errors gracefully', async () => {
    const { verifyMFAChallengeAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { verifyMFAChallenge } = await import('../auth/mfa.ts');
    const { revalidatePath } = await import('next/cache');

    const mockSupabase = {
      auth: {
        refreshSession: vi.fn().mockResolvedValue({}),
      },
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(verifyMFAChallenge).mockResolvedValue({
      success: true,
      error: null,
    });

    vi.mocked(revalidatePath).mockImplementation(() => {
      throw new Error('Revalidation failed');
    });

    // Should still succeed even if revalidatePath fails
    const result = await verifyMFAChallengeAction({
      factorId: '123e4567-e89b-12d3-a456-426614174000',
      challengeId: '123e4567-e89b-12d3-a456-426614174001',
      code: '123456',
    });

    expect(result.success).toBe(true);
  });

  it('should handle unenrollMFAAction with factors having null status', async () => {
    const { unenrollMFAAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { listMFAFactors } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(listMFAFactors).mockResolvedValue({
      factors: [
        { id: 'factor-1', status: null as any },
        { id: 'factor-2', status: 'verified' },
      ],
      error: null,
    });

    // Should filter out null status factors
    const { unenrollMFAFactor } = await import('../auth/mfa.ts');
    vi.mocked(unenrollMFAFactor).mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await unenrollMFAAction({
      factorId: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(result.success).toBe(true);
  });

  it('should handle unenrollMFAAction with empty factors array', async () => {
    const { unenrollMFAAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { listMFAFactors } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(listMFAFactors).mockResolvedValue({
      factors: [],
      error: null,
    });

    await expect(
      unenrollMFAAction({
        factorId: '123e4567-e89b-12d3-a456-426614174000',
      })
    ).rejects.toThrow('Cannot unenroll your last MFA factor');
  });

  it('should handle getAALAction with null data but no error', async () => {
    const { getAALAction } = await import('./mfa.ts');
    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const { getAuthenticatorAssuranceLevel } = await import('../auth/mfa.ts');

    const mockSupabase = {};
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(getAALAction({})).rejects.toThrow('Failed to get AAL');
  });
});
