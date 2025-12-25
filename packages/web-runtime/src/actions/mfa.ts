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
import { normalizeError } from '../errors';
import { logger } from '../logging/server';

/**
 * Helper to revalidate MFA-related pages
 */
async function revalidateMFAPages() {
  revalidatePath('/account/settings');
  revalidatePath('/account');
}

/**
 * List all MFA factors for the current user
 */
export const listMFAAction = authedAction
  .inputSchema(z.void())
  .metadata({ actionName: 'listMFA', category: 'mfa' })
  .action(async () => {
    const supabase = await createSupabaseServerClient();
    const { factors, error } = await listMFAFactors(supabase);
    if (error) throw error;
    return { factors };
  });

/**
 * Enroll a new TOTP factor
 */
export const enrollTOTPAction = authedAction
  .inputSchema(z.void())
  .metadata({ actionName: 'enrollTOTP', category: 'mfa' })
  .action(async () => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await enrollTOTPFactor(supabase);
    if (error) throw error;
    if (!data) throw new Error('TOTP enrollment failed - no data returned');
    return { enrollment: data };
  });

/**
 * Create an MFA challenge
 */
export const createMFAChallengeAction = authedAction
  .inputSchema(z.object({ factorId: z.string().uuid('Invalid factor ID') }))
  .metadata({ actionName: 'createMFAChallenge', category: 'mfa' })
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await createMFAChallenge(supabase, parsedInput.factorId);
    if (error) throw error;
    if (!data) throw new Error('MFA challenge creation failed - no data returned');
    return { challenge: data };
  });

/**
 * Verify an MFA challenge
 */
export const verifyMFAChallengeAction = authedAction
  .inputSchema(
    z.object({
      factorId: z.string().uuid('Invalid factor ID'),
      challengeId: z.string().uuid('Invalid challenge ID'),
      code: z
        .string()
        .length(6, 'Code must be 6 digits')
        .regex(/^\d{6}$/, 'Code must be numeric'),
    })
  )
  .metadata({ actionName: 'verifyMFAChallenge', category: 'mfa' })
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createSupabaseServerClient();

    // Get factor details BEFORE verification (to include in email)
    const { factors: allFactors } = await listMFAFactors(supabase);
    const factor = allFactors.find((f) => f.id === parsedInput.factorId);

    const { success, error } = await verifyMFAChallenge(
      supabase,
      parsedInput.factorId,
      parsedInput.challengeId,
      parsedInput.code
    );
    if (error) throw error;
    if (!success) throw new Error('MFA verification failed');

    // Refresh session to get updated AAL
    await supabase.auth.refreshSession();
    await revalidateMFAPages();

    // Send email notification via Inngest (factor was successfully added/verified)
    if (ctx.userEmail && factor) {
      try {
        const { inngest } = await import('../inngest/client.ts');

        await inngest.send({
          name: 'email/transactional',
          data: {
            type: 'mfa-factor-added',
            email: ctx.userEmail,
            emailData: {
              factorType: factor.factor_type,
              factorName: factor.friendly_name,
              addedAt: new Date().toISOString(),
              userEmail: ctx.userEmail,
            },
          },
        });

        logger.info(
          { factorId: parsedInput.factorId, factorType: factor.factor_type },
          'MFA factor added email event sent to Inngest'
        );
      } catch (emailError) {
        // Log but don't fail the action if email event fails
        const normalized = normalizeError(
          emailError,
          'Failed to send MFA factor added email event'
        );
        logger.warn(
          { err: normalized, factorId: parsedInput.factorId },
          'MFA factor added email event failed'
        );
      }
    }

    return { success: true };
  });

/**
 * Unenroll an MFA factor
 */
export const unenrollMFAAction = authedAction
  .inputSchema(z.object({ factorId: z.string().uuid('Invalid factor ID') }))
  .metadata({ actionName: 'unenrollMFA', category: 'mfa' })
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createSupabaseServerClient();

    // Check how many factors the user has and get factor details BEFORE unenrollment
    const { factors, error: listError } = await listMFAFactors(supabase);
    if (listError) throw listError;

    const verifiedFactors = factors.filter((f) => f.status === 'verified');
    if (verifiedFactors.length <= 1) {
      throw new Error('Cannot unenroll your last MFA factor. Please add another factor first.');
    }

    // Get factor details BEFORE unenrollment (to include in email)
    const factorToRemove = factors.find((f) => f.id === parsedInput.factorId);
    const remainingFactorsCount = verifiedFactors.length - 1; // Count after removal

    const { success, error } = await unenrollMFAFactor(supabase, parsedInput.factorId);
    if (error) throw error;
    if (!success) throw new Error('MFA unenrollment failed');

    await revalidateMFAPages();

    // Send email notification via Inngest (factor was successfully removed)
    if (ctx.userEmail && factorToRemove) {
      try {
        const { inngest } = await import('../inngest/client.ts');

        await inngest.send({
          name: 'email/transactional',
          data: {
            type: 'mfa-factor-removed',
            email: ctx.userEmail,
            emailData: {
              factorType: factorToRemove.factor_type,
              factorName: factorToRemove.friendly_name,
              removedAt: new Date().toISOString(),
              userEmail: ctx.userEmail,
              remainingFactorsCount,
            },
          },
        });

        logger.info(
          { factorId: parsedInput.factorId, factorType: factorToRemove.factor_type },
          'MFA factor removed email event sent to Inngest'
        );
      } catch (emailError) {
        // Log but don't fail the action if email event fails
        const normalized = normalizeError(
          emailError,
          'Failed to send MFA factor removed email event'
        );
        logger.warn(
          { err: normalized, factorId: parsedInput.factorId },
          'MFA factor removed email event failed'
        );
      }
    }

    return { success: true };
  });

/**
 * Get Authenticator Assurance Level
 */
export const getAALAction = authedAction
  .inputSchema(z.void())
  .metadata({ actionName: 'getAAL', category: 'mfa' })
  .action(async () => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await getAuthenticatorAssuranceLevel(supabase);
    if (error) throw error;
    if (!data) throw new Error('Failed to get AAL - no data returned');
    return { aal: data };
  });

/**
 * Check if MFA challenge is required
 */
export const checkMFARequiredAction = authedAction
  .inputSchema(z.void())
  .metadata({ actionName: 'checkMFARequired', category: 'mfa' })
  .action(async () => {
    const supabase = await createSupabaseServerClient();
    const { requires, error } = await requiresMFAChallenge(supabase);
    if (error) throw error;
    return { requires };
  });
