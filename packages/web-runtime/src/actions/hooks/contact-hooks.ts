import { logger } from '../../logger';
import { getEnvVar } from '@heyclaude/shared-runtime';
import { normalizeError } from '../../errors.ts';

export async function onContactSubmission(
  result: { submission_id: string },
  _ctx: { userId?: string },
  input: any
) {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');

  if (!supabaseUrl) {
    logger.error(
      'submitContactForm missing NEXT_PUBLIC_SUPABASE_URL env',
      new Error('Missing NEXT_PUBLIC_SUPABASE_URL'),
      {
        action: 'submitContactForm',
        envVar: 'NEXT_PUBLIC_SUPABASE_URL',
        phase: 'validation',
      }
    );
    return null;
  }

  // Trigger emails via edge function
  const response = await fetch(`${supabaseUrl}/functions/v1/email-handler`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Email-Action': 'contact-submission',
    },
    body: JSON.stringify({
      submissionId: result.submission_id,
      name: input.name,
      email: input.email,
      category: input.category,
      message: input.message,
    }),
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  const emailResult = (await response.json()) as { success?: boolean; error?: string };

  if (!(response.ok && emailResult?.success)) {
    const errorMessage = emailResult?.error || response.statusText || 'Email sending failed';
    const normalized = normalizeError(new Error(errorMessage), 'submitContactForm email failed');
    logger.warn('submitContactForm email failed (submission saved)', {
      err: normalized,
      status: response.status,
      submissionId: result.submission_id,
    });
  }
  
  return null;
}
