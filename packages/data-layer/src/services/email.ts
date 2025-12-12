/**
 * Email Service
 * 
 * Manually maintained service for email-related operations.
 * Wraps direct database queries with proper error logging.
 */

import { type Database } from '@heyclaude/database-types';
import { type SupabaseClient } from '@supabase/supabase-js';

import { logRpcError } from '../utils/rpc-error-logging.ts';

export class EmailService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Calls the database RPC: get_due_sequence_emails
   * Returns array of due sequence emails that need to be sent
   * 
   * Note: This method is primarily used in Inngest functions where request-scoped
   * caching provides no benefit. Direct RPC call for optimal performance.
   */
  async getDueSequenceEmails(): Promise<
    Database['public']['Functions']['get_due_sequence_emails']['Returns']
  > {
    try {
      const { data, error } = await this.supabase.rpc('get_due_sequence_emails');
      if (error) {
        logRpcError(error, {
          rpcName: 'get_due_sequence_emails',
          operation: 'EmailService.getDueSequenceEmails',
        });
        throw error;
      }
      return data ?? [];
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }

  /**
   * Claims an email sequence step (idempotent update)
   * Updates current_step only if it matches the expected value (prevents duplicate sends)
   * Returns the updated record if successful, null if already claimed
   */
  async claimEmailSequenceStep(
    sequenceId: string,
    expectedStep: number
  ): Promise<Database['public']['Tables']['email_sequences']['Row'] | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_sequences')
        .update({
          current_step: expectedStep + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sequenceId)
        .eq('current_step', expectedStep) // Only update if step hasn't changed (idempotency check)
        .select()
        .single();

      if (error) {
        // PGRST116 = no rows returned (already claimed or not found)
        if (error.code === 'PGRST116') {
          return null; // Already claimed - this is expected
        }
        logRpcError(error, {
          rpcName: 'email_sequences.update',
          operation: 'EmailService.claimEmailSequenceStep',
          args: { sequenceId, expectedStep },
        });
        throw error;
      }

      return data;
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }

  /**
   * Updates email sequence last_sent_at timestamp
   */
  async updateEmailSequenceLastSent(sequenceId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_sequences')
        .update({
          last_sent_at: new Date().toISOString(),
        })
        .eq('id', sequenceId);

      if (error) {
        logRpcError(error, {
          rpcName: 'email_sequences.update',
          operation: 'EmailService.updateEmailSequenceLastSent',
          args: { sequenceId },
        });
        throw error;
      }
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }

  /**
   * Enrolls an email address into the onboarding email sequence
   * Uses the database RPC to create/update the email sequence record
   * This is a mutation, so it does NOT use request-scoped caching
   */
  async enrollInEmailSequence(
    args: Database['public']['Functions']['enroll_in_email_sequence']['Args']
  ): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('enroll_in_email_sequence', args);
      if (error) {
        logRpcError(error, {
          rpcName: 'enroll_in_email_sequence',
          operation: 'EmailService.enrollInEmailSequence',
          args: args,
          isMutation: true, // This is a mutation (creates/updates sequence)
        });
        throw error;
      }
    } catch (error) {
      // Error already logged above
      throw error;
    }
  }
}
