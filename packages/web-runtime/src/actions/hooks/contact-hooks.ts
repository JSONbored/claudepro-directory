import { logger } from '../../logging/server.ts';
import { normalizeError } from '../../errors.ts';

/**
 * Post-submission hook for contact form
 * Sends event to Inngest for reliable email delivery
 */
export async function onContactSubmission(
  result: { submission_id: string },
  _ctx: { userId?: string },
  input: { name: string; email: string; category: string; message: string }
) {
  try {
    // Send event to Inngest for durable email processing
    const { inngest } = await import('../../inngest/client.ts');
    
    await inngest.send({
      name: 'email/contact',
      data: {
        submissionId: result.submission_id,
        name: input.name,
        email: input.email,
        category: input.category,
        message: input.message,
      },
    });

    logger.info({ submissionId: result.submission_id,
      category: input.category, }, 'Contact form email event sent to Inngest');
  } catch (error) {
    // Log but don't throw - submission was already saved to database
    const normalized = normalizeError(error, 'Contact form email event failed');
    logger.warn({ err: normalized,
      submissionId: result.submission_id, }, 'Contact form email event failed (submission saved)');
  }
  
  return null;
}
