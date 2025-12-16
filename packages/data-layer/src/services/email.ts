/**
 * Email Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table types use Prisma types.
 * RPC function types use postgres-types generator (Prisma doesn't generate RPC types).
 */

import type {
  GetDueSequenceEmailsReturns,
  EnrollInEmailSequenceArgs,
} from '@heyclaude/database-types/postgres-types';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';

// Type helper: Extract model type from Prisma query result
type EmailSequence = Awaited<ReturnType<typeof prisma.email_sequences.findUnique>>;

export class EmailService extends BasePrismaService {
  /**
   * Calls the database RPC: get_due_sequence_emails
   * Returns array of due sequence emails that need to be sent
   *
   * Note: This method is primarily used in Inngest functions where request-scoped
   * caching provides no benefit. Direct RPC call for optimal performance.
   */
  async getDueSequenceEmails(): Promise<GetDueSequenceEmailsReturns> {
    return this.callRpc<GetDueSequenceEmailsReturns>(
      'get_due_sequence_emails',
      {},
      { methodName: 'getDueSequenceEmails', useCache: false }
    );
  }

  /**
   * Claims an email sequence step (idempotent update)
   * Updates current_step only if it matches the expected value (prevents duplicate sends)
   * Returns the updated record if successful, null if already claimed
   */
  async claimEmailSequenceStep(
    sequenceId: string,
    expectedStep: number
  ): Promise<EmailSequence | null> {
    try {
      const result = await prisma.email_sequences.updateMany({
        where: {
          id: sequenceId,
          current_step: expectedStep, // Only update if step hasn't changed (idempotency check)
        },
        data: {
          current_step: expectedStep + 1,
          updated_at: new Date(),
        },
      });

      // If no rows were updated, it means the step was already claimed
      if (result.count === 0) {
        return null;
      }

      // Fetch the updated record
      const updated = await prisma.email_sequences.findUnique({
        where: { id: sequenceId },
      });

      return updated ?? null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates email sequence last_sent_at timestamp
   */
  async updateEmailSequenceLastSent(sequenceId: string): Promise<void> {
    await prisma.email_sequences.update({
      where: { id: sequenceId },
      data: {
        last_sent_at: new Date(),
      },
    });
  }

  /**
   * Enrolls an email address into the onboarding email sequence
   * Uses the database RPC to create/update the email sequence record
   * This is a mutation, so it does NOT use request-scoped caching
   */
  async enrollInEmailSequence(
    args: EnrollInEmailSequenceArgs
  ): Promise<void> {
    await this.callRpc<void>(
      'enroll_in_email_sequence',
      args,
      { methodName: 'enrollInEmailSequence', useCache: false }
    );
  }
}
