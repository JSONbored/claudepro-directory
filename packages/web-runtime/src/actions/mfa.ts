/**
 * MFA Server Actions
 * Database-first MFA operations with proper error handling
 */

'use server';

import { authedAction } from './safe-action.ts';
import { z } from 'zod';
import { createSupabaseServerClient } from '../supabase/server.ts';
import {
  enrollTOTPFactor,
  createMFAChallenge,
  verifyMFAChallenge,
  unenrollMFAFactor,
  listMFAFactors,
  getAuthenticatorAssuranceLevel,
  requiresMFAChallenge,
} from '../auth/mfa.ts';
import { revalidatePath } from 'next/cache';

/**
 * List all MFA factors for the current user
 */
export const listMFAAction = authedAction
  .metadata({ actionName: 'listMFA', category: 'mfa' })
  .inputSchema(z.void())
  .action(async () => {
    const supabase = await createSupabaseServerClient();
    const { factors, error } = await listMFAFactors(supabase);

    if (error) {
      throw error;
    }

    return { factors };
  });

/**
 * Enroll a new TOTP factor
 */
export const enrollTOTPAction = authedAction
  .metadata({ actionName: 'enrollTOTP', category: 'mfa' })
  .inputSchema(z.void())
  .action(async () => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await enrollTOTPFactor(supabase);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('TOTP enrollment failed - no data returned');
    }

    return { enrollment: data };
  });

/**
 * Create an MFA challenge
 */
export const createMFAChallengeAction = authedAction
  .metadata({ actionName: 'createMFAChallenge', category: 'mfa' })
  .inputSchema(
    z.object({
      factorId: z.string().uuid('Invalid factor ID'),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await createMFAChallenge(supabase, parsedInput.factorId);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('MFA challenge creation failed - no data returned');
    }

    return { challenge: data };
  });

/**
 * Verify an MFA challenge
 */
export const verifyMFAChallengeAction = authedAction
  .metadata({ actionName: 'verifyMFAChallenge', category: 'mfa' })
  .inputSchema(
    z.object({
      factorId: z.string().uuid('Invalid factor ID'),
      challengeId: z.string().uuid('Invalid challenge ID'),
      code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseServerClient();
    const { success, error } = await verifyMFAChallenge(
      supabase,
      parsedInput.factorId,
      parsedInput.challengeId,
      parsedInput.code
    );

    if (error) {
      throw error;
    }

    if (!success) {
      throw new Error('MFA verification failed');
    }

    // Refresh session to get updated AAL
    await supabase.auth.refreshSession();

    // Revalidate account pages to show updated MFA status
    revalidatePath('/account/settings');
    revalidatePath('/account');

    return { success: true };
  });

/**
 * Unenroll an MFA factor
 */
export const unenrollMFAAction = authedAction
  .metadata({ actionName: 'unenrollMFA', category: 'mfa' })
  .inputSchema(
    z.object({
      factorId: z.string().uuid('Invalid factor ID'),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseServerClient();

    // Check how many factors the user has
    const { factors, error: listError } = await listMFAFactors(supabase);
    if (listError) {
      throw listError;
    }

    const verifiedFactors = factors.filter((f) => f.status === 'verified');
    if (verifiedFactors.length <= 1) {
      throw new Error('Cannot unenroll your last MFA factor. Please add another factor first.');
    }

    const { success, error } = await unenrollMFAFactor(supabase, parsedInput.factorId);

    if (error) {
      throw error;
    }

    if (!success) {
      throw new Error('MFA unenrollment failed');
    }

    // Revalidate account pages
    revalidatePath('/account/settings');
    revalidatePath('/account');

    return { success: true };
  });

/**
 * Get Authenticator Assurance Level
 */
export const getAALAction = authedAction
  .metadata({ actionName: 'getAAL', category: 'mfa' })
  .inputSchema(z.void())
  .action(async () => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await getAuthenticatorAssuranceLevel(supabase);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to get AAL - no data returned');
    }

    return { aal: data };
  });

/**
 * Check if MFA challenge is required
 */
export const checkMFARequiredAction = authedAction
  .metadata({ actionName: 'checkMFARequired', category: 'mfa' })
  .inputSchema(z.void())
  .action(async () => {
    const supabase = await createSupabaseServerClient();
    const { requires, error } = await requiresMFAChallenge(supabase);

    if (error) {
      throw error;
    }

    return { requires };
  });
