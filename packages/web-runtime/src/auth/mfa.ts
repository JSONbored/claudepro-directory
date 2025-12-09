/**
 * Multi-Factor Authentication (MFA) Utilities
 * Database-first MFA implementation with TOTP support
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { logger, normalizeError } from '../index';

/**
 * MFA Factor Types
 */
export type MFAFactorType = 'totp' | 'phone';

/**
 * MFA Factor Status
 */
export type MFAFactorStatus = 'verified' | 'unverified';

/**
 * Authenticator Assurance Level
 */
export type AuthenticatorAssuranceLevel = 'aal1' | 'aal2';

/**
 * MFA Factor (TOTP)
 */
export interface TOTPFactor {
  id: string;
  friendly_name: string | null;
  factor_type: 'totp';
  status: MFAFactorStatus;
  created_at: string;
}

/**
 * MFA Factor (Phone)
 */
export interface PhoneFactor {
  id: string;
  friendly_name: string | null;
  factor_type: 'phone';
  status: MFAFactorStatus;
  phone: string | null;
  created_at: string;
}

export type MFAFactor = TOTPFactor | PhoneFactor;

/**
 * MFA Enrollment Response
 */
export interface MFAEnrollResponse {
  id: string;
  qr_code: string;
  secret: string;
  uri: string;
}

/**
 * MFA Challenge Response
 */
export interface MFAChallengeResponse {
  id: string;
  expires_at: string;
}

/**
 * Authenticator Assurance Level Response
 */
export interface AALResponse {
  currentLevel: AuthenticatorAssuranceLevel;
  nextLevel: AuthenticatorAssuranceLevel;
}

/**
 * List all MFA factors for the current user
 */
export async function listMFAFactors(
  supabase: SupabaseClient<Database>
): Promise<{ factors: MFAFactor[]; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      const normalized = normalizeError(error, 'Failed to list MFA factors');
      logger.error({ err: normalized }, 'MFA: listFactors failed');
      return { factors: [], error: normalized };
    }

    const factors: MFAFactor[] = [
      ...(data.totp || []).map((f) => ({
        id: f.id,
        friendly_name: f.friendly_name ?? null,
        factor_type: 'totp' as const,
        status: f.status as MFAFactorStatus,
        created_at: f.created_at,
      })),
      ...(data.phone || []).map((f) => {
        // Phone factors may not have phone property in all Supabase versions
        const phoneFactor = f as typeof f & { phone?: string | null };
        return {
          id: f.id,
          friendly_name: f.friendly_name ?? null,
          factor_type: 'phone' as const,
          status: f.status as MFAFactorStatus,
          phone: phoneFactor.phone ?? null,
          created_at: f.created_at,
        };
      }),
    ];

    return { factors, error: null };
  } catch (error) {
    const normalized = normalizeError(error, 'MFA listFactors threw');
    logger.error({ err: normalized }, 'MFA: listFactors threw');
    return { factors: [], error: normalized };
  }
}

/**
 * Enroll a new TOTP factor
 */
export async function enrollTOTPFactor(
  supabase: SupabaseClient<Database>
): Promise<{ data: MFAEnrollResponse | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      const normalized = normalizeError(error, 'Failed to enroll TOTP factor');
      logger.error({ err: normalized }, 'MFA: enroll failed');
      return { data: null, error: normalized };
    }

    if (!data?.totp) {
      return {
        data: null,
        error: new Error('TOTP enrollment data missing from response'),
      };
    }

    // Log successful MFA enrollment (audit trail)
    logger.info({ audit: true, // Structured tag for audit trail filtering
      factorId: data.id,
      operation: 'mfa_enroll', }, 'MFA: TOTP factor enrolled');

    return {
      data: {
        id: data.id,
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      },
      error: null,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'MFA enroll threw');
    logger.error({ err: normalized }, 'MFA: enroll threw');
    return { data: null, error: normalized };
  }
}

/**
 * Create a challenge for MFA verification
 */
export async function createMFAChallenge(
  supabase: SupabaseClient<Database>,
  factorId: string
): Promise<{ data: MFAChallengeResponse | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });

    if (error) {
      const normalized = normalizeError(error, 'Failed to create MFA challenge');
      logger.error({ err: normalized }, 'MFA: challenge failed');
      return { data: null, error: normalized };
    }

    if (!data) {
      return {
        data: null,
        error: new Error('Challenge data missing from response'),
      };
    }

    return {
      data: {
        id: data.id,
        expires_at: typeof data.expires_at === 'string' ? data.expires_at : new Date(data.expires_at * 1000).toISOString(),
      },
      error: null,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'MFA challenge threw');
    logger.error({ err: normalized }, 'MFA: challenge threw');
    return { data: null, error: normalized };
  }
}

/**
 * Verify an MFA challenge code
 */
export async function verifyMFAChallenge(
  supabase: SupabaseClient<Database>,
  factorId: string,
  challengeId: string,
  code: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.trim(),
    });

    if (error) {
      const normalized = normalizeError(error, 'Failed to verify MFA challenge');
      logger.warn({ securityEvent: true, // Structured tag for security event filtering
        factorId,
        challengeId,
        operation: 'mfa_verify_failed',
        error: normalized.message, }, 'MFA: verification failed');
      return { success: false, error: normalized };
    }

    // Log successful MFA verification (audit trail)
    logger.info({ audit: true, // Structured tag for audit trail filtering
      factorId,
      challengeId,
      operation: 'mfa_verify_success', }, 'MFA: verification successful');

    return { success: true, error: null };
  } catch (error) {
    const normalized = normalizeError(error, 'MFA verify threw');
    logger.error({ err: normalized }, 'MFA: verify threw');
    return { success: false, error: normalized };
  }
}

/**
 * Unenroll an MFA factor
 */
export async function unenrollMFAFactor(
  supabase: SupabaseClient<Database>,
  factorId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });

    if (error) {
      const normalized = normalizeError(error, 'Failed to unenroll MFA factor');
      logger.error({ err: normalized }, 'MFA: unenroll failed');
      return { success: false, error: normalized };
    }

    // Log successful MFA unenrollment (audit trail - security-relevant change)
    logger.info({ audit: true, // Structured tag for audit trail filtering
      securityEvent: true, // Also a security event (reducing security level)
      factorId,
      operation: 'mfa_unenroll', }, 'MFA: factor unenrolled');

    return { success: true, error: null };
  } catch (error) {
    const normalized = normalizeError(error, 'MFA unenroll threw');
    logger.error({ err: normalized }, 'MFA: unenroll threw');
    return { success: false, error: normalized };
  }
}

/**
 * Get the current Authenticator Assurance Level
 */
export async function getAuthenticatorAssuranceLevel(
  supabase: SupabaseClient<Database>
): Promise<{ data: AALResponse | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      const normalized = normalizeError(
        error,
        'Failed to get authenticator assurance level'
      );
      logger.error({ err: normalized }, 'MFA: getAuthenticatorAssuranceLevel failed');
      return { data: null, error: normalized };
    }

    if (!data) {
      return {
        data: null,
        error: new Error('AAL data missing from response'),
      };
    }

    return {
      data: {
        currentLevel: data.currentLevel as AuthenticatorAssuranceLevel,
        nextLevel: data.nextLevel as AuthenticatorAssuranceLevel,
      },
      error: null,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'MFA getAuthenticatorAssuranceLevel threw');
    logger.error({ err: normalized }, 'MFA: getAuthenticatorAssuranceLevel threw');
    return { data: null, error: normalized };
  }
}

/**
 * Check if user needs to complete MFA challenge
 * Returns true if currentLevel is aal1 but nextLevel is aal2
 */
export async function requiresMFAChallenge(
  supabase: SupabaseClient<Database>
): Promise<{ requires: boolean; error: Error | null }> {
  try {
    const { data, error } = await getAuthenticatorAssuranceLevel(supabase);

    if (error || !data) {
      return { requires: false, error };
    }

    // User needs MFA if they can upgrade from aal1 to aal2
    const requires = data.currentLevel === 'aal1' && data.nextLevel === 'aal2';

    return { requires, error: null };
  } catch (error) {
    const normalized = normalizeError(error, 'requiresMFAChallenge threw');
    logger.error({ err: normalized }, 'MFA: requiresMFAChallenge threw');
    return { requires: false, error: normalized };
  }
}
