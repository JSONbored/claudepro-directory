/**
 * Sequence email helper functions and configuration
 * Extracted from email-handler for better organization
 */

import type { FC } from 'npm:react@18.3.1';
import type { Resend } from 'npm:resend@6.5.2';
import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { sendEmail } from '../../utils/integrations/resend.ts';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import { createEmailHandlerContext, logError, logInfo } from '@heyclaude/shared-runtime';
import { renderEmailTemplate } from './base-template.tsx';
import { ONBOARDING_FROM } from './templates/manifest.ts';
import { OnboardingCommunity } from './templates/onboarding-community.tsx';
import { OnboardingGettingStarted } from './templates/onboarding-getting-started.tsx';
import { OnboardingPowerTips } from './templates/onboarding-power-tips.tsx';
import { OnboardingStayEngaged } from './templates/onboarding-stay-engaged.tsx';

export const STEP_SUBJECTS: Record<number, string> = {
  2: 'Getting Started with Claude Pro Directory',
  3: 'Power User Tips for Claude',
  4: 'Join the Claude Pro Community',
  5: 'Stay Engaged with ClaudePro',
};

export const STEP_TEMPLATES: Record<number, FC<{ email: string }>> = {
  2: OnboardingGettingStarted,
  3: OnboardingPowerTips,
  4: OnboardingCommunity,
  5: OnboardingStayEngaged,
};

/**
 * Process a single sequence email: send email, mark as processed, schedule next step
 */
export async function processSequenceEmail(
  resend: Resend,
  item: DatabaseGenerated['public']['CompositeTypes']['due_sequence_email_item'],
  logContext: BaseLogContext
): Promise<void> {
  // Note: PostgreSQL composite types don't support NOT NULL constraints,
  // but the RPC selects from table columns that ARE NOT NULL, so these values
  // are guaranteed to be non-null at runtime. Type assertion is safe here.
  const { id, email, step } = item as {
    id: string;
    email: string;
    step: number;
  };

  const Template = STEP_TEMPLATES[step];
  if (!Template) {
    await logError('Unknown sequence step', logContext, new Error(`Unknown step: ${step}`));
    throw new Error(`Unknown step: ${step}`);
  }

  const html = await renderEmailTemplate(Template, { email });

  const itemLogContext = createEmailHandlerContext('sequence', {
    email, // Use destructured email (non-null after type assertion)
  });

  const subject = STEP_SUBJECTS[step];
  if (!subject) {
    await logError(
      'Unknown sequence step subject',
      logContext,
      new Error(`No subject for step: ${step}`)
    );
    throw new Error(`No subject for step: ${step}`);
  }

  const result = await sendEmail(
    resend,
    {
      from: ONBOARDING_FROM,
      to: email,
      subject,
      html,
      tags: [
        { name: 'template', value: 'onboarding_sequence' },
        { name: 'step', value: step.toString() },
      ],
    },
    itemLogContext,
    'Resend sequence email send timed out'
  );

  if (result.error) {
    await logError('Sequence email send failed', logContext, result.error);
    throw new Error(result.error.message);
  }

  const markProcessedArgs = {
    p_schedule_id: id,
    p_email: email,
    p_step: step,
    p_success: true,
  } satisfies DatabaseGenerated['public']['Functions']['mark_sequence_email_processed']['Args'];
  const { error: markError } = await supabaseServiceRole.rpc('mark_sequence_email_processed', markProcessedArgs);
  
  if (markError) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('Failed to mark sequence email processed', {
      ...logContext,
      dbQuery: {
        rpcName: 'mark_sequence_email_processed',
        args: markProcessedArgs, // Will be redacted by Pino's redact config
      },
    }, markError);
    throw markError;
  }

  const scheduleNextArgs = {
    p_email: email,
    p_current_step: step,
  } satisfies DatabaseGenerated['public']['Functions']['schedule_next_sequence_step']['Args'];
  const { error: scheduleError } = await supabaseServiceRole.rpc('schedule_next_sequence_step', scheduleNextArgs);
  
  if (scheduleError) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('Failed to schedule next sequence step', {
      ...logContext,
      dbQuery: {
        rpcName: 'schedule_next_sequence_step',
        args: scheduleNextArgs, // Will be redacted by Pino's redact config
      },
    }, scheduleError);
    throw scheduleError;
  }

  logInfo('Sequence email processed', {
    ...logContext,
    email,
    step,
    schedule_id: id,
  });
}
