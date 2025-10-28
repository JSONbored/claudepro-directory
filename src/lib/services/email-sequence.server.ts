/**
 * Email Sequence Service - Database-First Architecture
 * PostgreSQL-based email sequence scheduling with auto-generated schemas.
 */

import type { ReactElement } from 'react';
import { logger } from '@/src/lib/logger';
import {
  publicEmailSequenceScheduleInsertSchema,
  publicEmailSequencesInsertSchema,
  publicEmailSequencesRowSchema,
} from '@/src/lib/schemas/generated/db-schemas';
import { resendService } from '@/src/lib/services/resend.server';
import { createClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/src/types/database.types';

export type EmailSequence = Tables<'email_sequences'>;

/**
 * Sequence delays in seconds (converted from days)
 */
const SEQUENCE_DELAYS = {
  step1: 0, // Immediate (welcome email)
  step2: 2 * 86400, // 2 days
  step3: 5 * 86400, // 5 days
  step4: 9 * 86400, // 9 days
  step5: 14 * 86400, // 14 days
} as const;

/**
 * Email template loaders for each step
 */
const TEMPLATE_LOADERS = {
  step1: null, // Welcome email already sent on signup
  step2: () => import('@/src/emails/templates/onboarding-getting-started'),
  step3: () => import('@/src/emails/templates/onboarding-power-tips'),
  step4: () => import('@/src/emails/templates/onboarding-community'),
  step5: () => import('@/src/emails/templates/onboarding-stay-engaged'),
} as const;

/**
 * Email subjects for each step
 */
const STEP_SUBJECTS = {
  step1: '', // Welcome email
  step2: 'Getting Started with ClaudePro Directory',
  step3: 'Power User Tips for Claude',
  step4: 'Join the ClaudePro Community',
  step5: 'Stay Engaged with ClaudePro',
} as const;

/**
 * EmailSequenceService class
 *
 * Singleton service for managing email sequences.
 */
class EmailSequenceService {
  private readonly SEQUENCE_ID = 'onboarding';

  /**
   * Enroll subscriber in onboarding sequence
   */
  async enrollInSequence(email: string): Promise<void> {
    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const sequenceData = publicEmailSequencesInsertSchema.parse({
        sequence_id: this.SEQUENCE_ID,
        email,
        current_step: 1,
        total_steps: 5,
        started_at: now,
        last_sent_at: now,
        status: 'active',
      });

      const { error: sequenceError } = await supabase.from('email_sequences').insert(sequenceData);

      if (sequenceError) {
        logger.error('Failed to create email sequence', new Error(sequenceError.message), {
          email,
        });
        return;
      }

      const dueAt = new Date(Date.now() + SEQUENCE_DELAYS.step2 * 1000).toISOString();
      const scheduleData = publicEmailSequenceScheduleInsertSchema.parse({
        sequence_id: this.SEQUENCE_ID,
        email,
        step: 2,
        due_at: dueAt,
        processed: false,
      });

      const { error: scheduleError } = await supabase
        .from('email_sequence_schedule')
        .insert(scheduleData);

      if (scheduleError) {
        logger.error('Failed to schedule email', new Error(scheduleError.message), { email });
        return;
      }

      logger.info('Enrolled in email sequence', { email, sequenceId: this.SEQUENCE_ID });
    } catch (error) {
      logger.error(
        'Email sequence enrollment error',
        error instanceof Error ? error : new Error(String(error)),
        { email }
      );
    }
  }

  /**
   * Process email sequence queue (called by daily cron)
   */
  async processSequenceQueue(): Promise<{ sent: number; failed: number }> {
    let sentCount = 0;
    let failedCount = 0;

    try {
      const supabase = await createClient();
      const now = new Date().toISOString();

      // Get all due emails (due_at <= now AND processed = false)
      const { data: dueEmails, error } = await supabase
        .from('email_sequence_schedule')
        .select('id, email, step')
        .eq('sequence_id', this.SEQUENCE_ID)
        .eq('processed', false)
        .lte('due_at', now)
        .order('due_at', { ascending: true });

      if (error) {
        logger.error('Failed to fetch due emails', new Error(error.message));
        return { sent: 0, failed: 0 };
      }

      if (!dueEmails || dueEmails.length === 0) {
        return { sent: 0, failed: 0 };
      }

      logger.info('Processing email sequence queue', {
        dueCount: dueEmails.length,
        sequenceId: this.SEQUENCE_ID,
      });

      // Send emails
      for (const { id, email, step } of dueEmails) {
        try {
          await this.sendSequenceEmail(email, step);
          sentCount++;

          // Mark as processed
          await supabase
            .from('email_sequence_schedule')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('id', id);

          // Rate limit: 100ms delay between emails
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          logger.error('Failed to send sequence email', undefined, {
            email,
            step,
            error: error instanceof Error ? error.message : String(error),
          });
          failedCount++;
        }
      }

      logger.info('Email sequence processing completed', {
        sent: sentCount,
        failed: failedCount,
        sequenceId: this.SEQUENCE_ID,
      });

      return { sent: sentCount, failed: failedCount };
    } catch (error) {
      logger.error(
        'Email sequence queue processing failed',
        error instanceof Error ? error : new Error(String(error)),
        { sequenceId: this.SEQUENCE_ID }
      );
      return { sent: sentCount, failed: failedCount };
    }
  }

  /**
   * Send specific sequence email
   */
  private async sendSequenceEmail(email: string, step: number): Promise<void> {
    const supabase = await createClient();

    // Get sequence state
    const { data: sequenceData, error } = await supabase
      .from('email_sequences')
      .select('status, current_step')
      .eq('sequence_id', this.SEQUENCE_ID)
      .eq('email', email)
      .maybeSingle();

    if (error || !sequenceData || sequenceData.status !== 'active') {
      logger.warn('Sequence not active or not found', { email, step });
      return;
    }

    // Get email template for step
    const stepKey = `step${step}` as keyof typeof TEMPLATE_LOADERS;
    const templateLoader = TEMPLATE_LOADERS[stepKey];

    if (!templateLoader) {
      throw new Error(`Invalid sequence step: ${step}`);
    }

    // Load template dynamically (all templates export as default)
    const templateModule = await templateLoader();
    const Template = templateModule.default as
      | ((props: { email: string }) => ReactElement)
      | undefined;

    if (!Template) {
      throw new Error(`Template not found for step: ${step}`);
    }

    // Create React element
    const element = Template({ email });

    // Send email
    const subjectKey = `step${step}` as keyof typeof STEP_SUBJECTS;
    const result = await resendService.sendEmail(email, STEP_SUBJECTS[subjectKey], element, {
      tags: [
        { name: 'template', value: 'onboarding_sequence' },
        { name: 'step', value: step.toString() },
      ],
    });

    if (!result.success) {
      throw new Error(result.error || 'Email send failed');
    }

    // Update sequence state
    await supabase
      .from('email_sequences')
      .update({
        current_step: step,
        last_sent_at: new Date().toISOString(),
        status: step === 5 ? 'completed' : 'active',
      })
      .eq('sequence_id', this.SEQUENCE_ID)
      .eq('email', email);

    // Schedule next step if not complete
    if (step < 5) {
      const nextStep = step + 1;
      const delayKey = `step${nextStep}` as keyof typeof SEQUENCE_DELAYS;
      const delay = SEQUENCE_DELAYS[delayKey];
      const dueAt = new Date(Date.now() + delay * 1000).toISOString();

      await supabase.from('email_sequence_schedule').insert({
        sequence_id: this.SEQUENCE_ID,
        email,
        step: nextStep,
        due_at: dueAt,
        processed: false,
      });
    }

    logger.info('Sequence email sent', {
      email,
      step,
      emailId: result.emailId ?? 'unknown',
      sequenceId: this.SEQUENCE_ID,
    });
  }

  /**
   * Cancel sequence for email (e.g., on unsubscribe)
   */
  async cancelSequence(email: string): Promise<void> {
    try {
      const supabase = await createClient();

      // Update sequence status to cancelled
      await supabase
        .from('email_sequences')
        .update({ status: 'cancelled' })
        .eq('sequence_id', this.SEQUENCE_ID)
        .eq('email', email);

      // Mark all pending scheduled emails as processed (effectively cancelling them)
      await supabase
        .from('email_sequence_schedule')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('sequence_id', this.SEQUENCE_ID)
        .eq('email', email)
        .eq('processed', false);

      logger.info('Sequence cancelled', { email, sequenceId: this.SEQUENCE_ID });
    } catch (error) {
      logger.error(
        'Cancel sequence error',
        error instanceof Error ? error : new Error(String(error)),
        { email }
      );
    }
  }

  /**
   * Get sequence status for an email
   *
   * @param email - Email address
   * @returns Sequence state or null if not enrolled
   */
  async getSequenceStatus(email: string): Promise<EmailSequence | null> {
    try {
      const key = `email_sequence:${this.SEQUENCE_ID}:${email}`;

      // Production-grade: CacheService handles compression, XSS protection, and Zod validation
      return await emailCache.getTyped<EmailSequence>(key, emailSequenceSchema);
    } catch (error) {
      logger.error(
        'Get sequence status error',
        error instanceof Error ? error : new Error(String(error)),
        { email }
      );
      return null;
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
export const emailSequenceService = new EmailSequenceService();
