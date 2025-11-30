/**
 * Email Sequence Inngest Function
 *
 * Processes and sends due sequence emails (onboarding drips).
 * Runs on a cron schedule (every 2 hours).
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { sendEmail } from '../../../integrations/resend';
import { ONBOARDING_FROM } from '../../../email/config/email-config';
import { logger, generateRequestId, createWebAppContextWithId } from '../../../logging/server';

// Type for sequence email - simplified based on RPC return
interface SequenceEmailItem {
  id: string;
  email: string;
  step: number;
  template_slug?: string | null;
  email_subject?: string | null;
}

/**
 * Email sequence function
 *
 * Cron schedule: Every 2 hours
 * - Fetches all due sequence emails
 * - Sends each email and marks as sent
 */
export const processEmailSequence = inngest.createFunction(
  {
    id: 'email-sequence-processor',
    name: 'Email Sequence Processor',
    retries: 1, // Limited retries for cron jobs
  },
  { cron: '0 */2 * * *' }, // Every 2 hours
  async ({ step }) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const logContext = createWebAppContextWithId(requestId, '/inngest/email/sequence', 'processEmailSequence');

    logger.info('Email sequence processing started', logContext);

    const supabase = createSupabaseAdminClient();

    // Step 1: Fetch due sequence emails
    const dueEmails = await step.run('fetch-due-emails', async (): Promise<SequenceEmailItem[]> => {
      const { data, error } = await supabase.rpc('get_due_sequence_emails');

      if (error) {
        logger.warn('Failed to fetch due sequence emails', {
          ...logContext,
          errorMessage: error.message,
        });
        return [];
      }

      // Map RPC result to our expected type, filtering out nulls
      if (!Array.isArray(data)) return [];
      
      return data
        .filter((item): item is { id: string; email: string; step: number } => 
          item.id !== null && item.email !== null && item.step !== null
        )
        .map((item) => ({
          id: item.id,
          email: item.email,
          step: item.step,
        }));
    });

    if (dueEmails.length === 0) {
      logger.info('No due sequence emails', logContext);
      return { sent: 0, failed: 0 };
    }

    logger.info('Processing sequence emails', {
      ...logContext,
      dueCount: dueEmails.length,
    });

    // Step 2: Process emails in sequence
    let sentCount = 0;
    let failedCount = 0;

    // Process emails with a step per batch to enable resumability
    const batchSize = 5;
    for (let i = 0; i < dueEmails.length; i += batchSize) {
      const batch = dueEmails.slice(i, i + batchSize);
      
      const batchResults = await step.run(`send-batch-${i}`, async (): Promise<{
        sent: number;
        failed: number;
      }> => {
        let batchSent = 0;
        let batchFailed = 0;

        for (const emailItem of batch) {
          try {
            await processSequenceEmail(emailItem, supabase, logContext);
            batchSent++;
          } catch (error) {
            const normalized = normalizeError(error, 'Failed to send sequence email');
            logger.warn('Failed to send sequence email', {
              ...logContext,
              email: emailItem.email, // Auto-hashed by pino redaction
              sequenceId: emailItem.id,
              step: emailItem.step,
              errorMessage: normalized.message,
            });
            batchFailed++;
          }
        }

        return { sent: batchSent, failed: batchFailed };
      });

      sentCount += batchResults.sent;
      failedCount += batchResults.failed;
    }

    const durationMs = Date.now() - startTime;
    logger.info('Email sequence processing completed', {
      ...logContext,
      durationMs,
      sent: sentCount,
      failed: failedCount,
      total: dueEmails.length,
    });

    return { sent: sentCount, failed: failedCount };
  }
);

/**
 * Process a single sequence email
 */
async function processSequenceEmail(
  emailItem: SequenceEmailItem,
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  logContext: ReturnType<typeof createWebAppContextWithId>
): Promise<void> {
  const { email, step, id: sequenceEmailId } = emailItem;

  // Build email content based on step
  const html = buildSequenceEmailHtml(step, email);

  // Send the email
  const { error: sendError } = await sendEmail(
    {
      from: ONBOARDING_FROM,
      to: email,
      subject: getDefaultSubject(step),
      html,
      tags: [
        { name: 'type', value: 'sequence' },
        { name: 'step', value: String(step) },
      ],
    },
    'Resend sequence email send timed out'
  );

  if (sendError) {
    throw new Error(sendError.message);
  }

  // Mark as sent in the email_sequences table
  const { error: updateError } = await supabase
    .from('email_sequences')
    .update({
      last_sent_at: new Date().toISOString(),
      current_step: step + 1,
    })
    .eq('id', sequenceEmailId);

  if (updateError) {
    // Throw on DB update failure to prevent duplicate sends on retry
    // If we don't update the step, the email will be sent again
    throw new Error(`Failed to mark sequence email as sent: ${updateError.message}`);
  }

  logger.info('Sequence email sent', {
    ...logContext,
    email, // Auto-hashed by pino redaction
    sequenceId: sequenceEmailId,
    step,
  });
}

/**
 * Get default subject based on step number
 */
function getDefaultSubject(step: number): string {
  const subjects: Record<number, string> = {
    1: 'Welcome to Claude Pro Directory! 🎉',
    2: 'Getting Started with Claude Pro Directory',
    3: 'Power User Tips for Claude',
    4: 'Join the Claude Pro Community',
    5: 'Stay Engaged with ClaudePro',
  };
  return subjects[step] || `Claude Pro Directory - Email ${step}`;
}

/**
 * Build sequence email HTML based on step number
 */
function buildSequenceEmailHtml(step: number, email: string): string {
  // Simple template based on step number
  const templates: Record<number, { title: string; content: string }> = {
    1: {
      title: 'Welcome to Claude Pro Directory! 🎉',
      content: `
        <p>Thanks for joining! We're excited to have you.</p>
        <p>Claude Pro Directory is the home for Claude builders - discover agents, MCP servers, and workflows created by the community.</p>
        <p><a href="https://claudepro.directory" style="color: #ff6b35;">Start exploring →</a></p>
      `,
    },
    2: {
      title: 'Getting Started',
      content: `
        <p>Ready to dive in? Here are a few ways to get started:</p>
        <ul>
          <li><a href="https://claudepro.directory/agents" style="color: #ff6b35;">Browse Claude Agents</a> - Pre-configured AI assistants</li>
          <li><a href="https://claudepro.directory/mcp" style="color: #ff6b35;">Explore MCP Servers</a> - Extend Claude's capabilities</li>
          <li><a href="https://claudepro.directory/guides" style="color: #ff6b35;">Read our Guides</a> - Learn advanced techniques</li>
        </ul>
      `,
    },
    3: {
      title: 'Power User Tips',
      content: `
        <p>Want to get more out of Claude? Here are some power user tips:</p>
        <ul>
          <li>Use <strong>Collections</strong> to save and organize your favorite tools</li>
          <li>Check the <strong>Trending</strong> page for what's hot this week</li>
          <li>Copy configurations with one click to use in your own projects</li>
        </ul>
      `,
    },
    4: {
      title: 'Join the Community',
      content: `
        <p>Claude Pro Directory is built by the community, for the community.</p>
        <p>Have something to share? <a href="https://claudepro.directory/submit" style="color: #ff6b35;">Submit your own creation</a> and help others!</p>
        <p>Join our <a href="https://discord.gg/claudepro" style="color: #ff6b35;">Discord community</a> to connect with other Claude builders.</p>
      `,
    },
    5: {
      title: 'Stay Engaged',
      content: `
        <p>That's a wrap on our welcome series! Here's how to stay connected:</p>
        <ul>
          <li>📬 Weekly digest emails with new content</li>
          <li>🔔 Bookmark items to save for later</li>
          <li>💬 Rate and review tools you've tried</li>
        </ul>
        <p>Happy building!</p>
      `,
    },
  };

  const template = templates[step] || {
    title: `Claude Pro Directory Update`,
    content: `<p>Thanks for being part of the Claude Pro Directory community!</p>`,
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 24px;">${template.title}</h1>
    
    <div style="color: #333; line-height: 1.6;">
      ${template.content}
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="color: #666; font-size: 14px; margin: 0;">
      — The Claude Pro Directory Team
    </p>
    
    <p style="color: #999; font-size: 12px; margin: 16px 0 0;">
      <a href="https://claudepro.directory/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
