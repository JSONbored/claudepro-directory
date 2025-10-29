/**
 * Email Sequence Service - Database-First Architecture
 * ALL logic in PostgreSQL via RPC functions
 * TypeScript: thin wrappers only (337 → 48 lines = 86% reduction!)
 */

import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Enroll subscriber in onboarding sequence
 * Inserts sequence record + schedules step 2 (2 days out)
 */
export async function enrollInSequence(email: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('enroll_in_email_sequence', { p_email: email });

    if (error) {
      logger.error('Failed to enroll in email sequence', new Error(error.message), { email });
      return;
    }

    logger.info('Enrolled in email sequence', { email, sequenceId: 'onboarding' });
  } catch (error) {
    logger.error(
      'Email sequence enrollment error',
      error instanceof Error ? error : new Error(String(error)),
      { email }
    );
  }
}

/**
 * Cancel sequence for email (e.g., on unsubscribe)
 * Sets status=cancelled + marks all pending emails as processed
 */
export async function cancelSequence(email: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('cancel_email_sequence', { p_email: email });

    if (error) {
      logger.error('Failed to cancel email sequence', new Error(error.message), { email });
      return;
    }

    logger.info('Email sequence cancelled', { email, sequenceId: 'onboarding' });
  } catch (error) {
    logger.error(
      'Cancel sequence error',
      error instanceof Error ? error : new Error(String(error)),
      { email }
    );
  }
}
