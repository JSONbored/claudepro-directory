/**
 * Email Sequence Service
 *
 * Manages automated email sequences (onboarding, drip campaigns, etc.)
 * Uses Redis for state management and scheduling.
 *
 * Features:
 * - 5-email onboarding sequence
 * - Redis-based state storage
 * - Daily cron processing (Vercel free tier compatible)
 * - Automatic enrollment on signup
 * - Graceful unsubscribe handling
 *
 * @module lib/services/email-sequence.service
 */

import type { ReactElement } from 'react';
import { logger } from '@/src/lib/logger';
import { redisClient } from '@/src/lib/redis';
import { resendService } from '@/src/lib/services/resend.service';

/**
 * Email sequence state
 */
export interface EmailSequence {
  sequenceId: string;
  email: string;
  currentStep: number;
  totalSteps: number;
  startedAt: string; // ISO date
  lastSentAt: string | null; // ISO date
  status: 'active' | 'completed' | 'cancelled';
}

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
   *
   * @param email - Subscriber email address
   * @returns Promise that resolves when enrollment is complete
   */
  async enrollInSequence(email: string): Promise<void> {
    try {
      const sequence: EmailSequence = {
        sequenceId: this.SEQUENCE_ID,
        email,
        currentStep: 1, // Welcome email already sent
        totalSteps: 5,
        startedAt: new Date().toISOString(),
        lastSentAt: new Date().toISOString(), // Welcome just sent
        status: 'active',
      };

      const key = `email_sequence:${this.SEQUENCE_ID}:${email}`;

      await redisClient.executeOperation(
        async (redis) => {
          await redis.set(key, JSON.stringify(sequence), {
            ex: 90 * 86400, // 90 days TTL
          });

          // Schedule step 2 (2 days from now)
          const dueAt = Date.now() + SEQUENCE_DELAYS.step2 * 1000;
          await redis.zadd(`email_sequence:due:${this.SEQUENCE_ID}:2`, {
            score: dueAt,
            member: email,
          });
        },
        () => {
          logger.error('Failed to enroll in email sequence', undefined, { email });
        },
        'email_sequence_enroll'
      );

      logger.info('Enrolled in email sequence', {
        email,
        sequenceId: this.SEQUENCE_ID,
      });
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
   *
   * @returns Promise with send results
   */
  async processSequenceQueue(): Promise<{ sent: number; failed: number }> {
    let sentCount = 0;
    let failedCount = 0;

    try {
      // Process each step (2-5, step 1 is welcome email)
      for (let step = 2; step <= 5; step++) {
        const now = Date.now();
        const dueKey = `email_sequence:due:${this.SEQUENCE_ID}:${step}`;

        // Get all emails due for this step
        const dueEmails = await redisClient.executeOperation(
          async (redis) => {
            // Get all emails with score <= now
            return await redis.zrange(dueKey, 0, now, {
              byScore: true,
            });
          },
          () => [],
          'email_sequence_get_due'
        );

        if (dueEmails.length === 0) continue;

        logger.info(`Processing sequence step ${step}`, {
          dueCount: dueEmails.length,
          sequenceId: this.SEQUENCE_ID,
        });

        // Send emails
        for (const email of dueEmails) {
          try {
            await this.sendSequenceEmail(email, step);
            sentCount++;

            // Remove from due queue
            await redisClient.executeOperation(
              async (redis) => {
                await redis.zrem(dueKey, email);
              },
              () => {
                // Silent fallback - already logged in main error handler
              },
              'email_sequence_remove_due'
            );

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
   *
   * @param email - Recipient email address
   * @param step - Step number (2-5)
   */
  private async sendSequenceEmail(email: string, step: number): Promise<void> {
    // Get sequence state
    const key = `email_sequence:${this.SEQUENCE_ID}:${email}`;

    const sequenceData = await redisClient.executeOperation(
      async (redis) => {
        const data = await redis.get(key);
        return data ? (JSON.parse(data as string) as EmailSequence) : null;
      },
      () => null,
      'email_sequence_get'
    );

    if (!sequenceData || sequenceData.status !== 'active') {
      logger.warn('Sequence not active or not found', { email, step });
      return;
    }

    // Get email template for step
    const stepKey = `step${step}` as keyof typeof TEMPLATE_LOADERS;
    const templateLoader = TEMPLATE_LOADERS[stepKey];

    if (!templateLoader) {
      throw new Error(`Invalid sequence step: ${step}`);
    }

    // Load template dynamically
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
    const updatedSequence: EmailSequence = {
      ...sequenceData,
      currentStep: step,
      lastSentAt: new Date().toISOString(),
      status: step === 5 ? 'completed' : 'active',
    };

    await redisClient.executeOperation(
      async (redis) => {
        await redis.set(key, JSON.stringify(updatedSequence), {
          ex: 90 * 86400,
        });

        // Schedule next step if not complete
        if (step < 5) {
          const nextStep = step + 1;
          const delayKey = `step${nextStep}` as keyof typeof SEQUENCE_DELAYS;
          const delay = SEQUENCE_DELAYS[delayKey];
          const dueAt = Date.now() + delay * 1000;

          await redis.zadd(`email_sequence:due:${this.SEQUENCE_ID}:${nextStep}`, {
            score: dueAt,
            member: email,
          });
        }
      },
      () => {
        logger.error('Failed to update sequence state', undefined, { email, step });
      },
      'email_sequence_update'
    );

    logger.info('Sequence email sent', {
      email,
      step,
      emailId: result.emailId ?? 'unknown',
      sequenceId: this.SEQUENCE_ID,
    });
  }

  /**
   * Cancel sequence for email (e.g., on unsubscribe)
   *
   * @param email - Email address to cancel
   */
  async cancelSequence(email: string): Promise<void> {
    try {
      const key = `email_sequence:${this.SEQUENCE_ID}:${email}`;

      await redisClient.executeOperation(
        async (redis) => {
          const data = await redis.get(key);
          if (data) {
            const sequence: EmailSequence = JSON.parse(data as string);
            sequence.status = 'cancelled';
            await redis.set(key, JSON.stringify(sequence), {
              ex: 90 * 86400,
            });
          }

          // Remove from all due queues
          for (let step = 2; step <= 5; step++) {
            await redis.zrem(`email_sequence:due:${this.SEQUENCE_ID}:${step}`, email);
          }
        },
        () => {
          logger.error('Failed to cancel sequence', undefined, { email });
        },
        'email_sequence_cancel'
      );

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

      return await redisClient.executeOperation(
        async (redis) => {
          const data = await redis.get(key);
          return data ? (JSON.parse(data as string) as EmailSequence) : null;
        },
        () => null,
        'email_sequence_get_status'
      );
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
