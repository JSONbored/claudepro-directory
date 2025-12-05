/**
 * Dynamic Drip Campaign Functions
 *
 * Implements intelligent email sequences that adapt based on user engagement.
 * Uses Inngest's step.waitForEvent to pause workflows until specific
 * Resend events occur (opens, clicks).
 *
 * @see https://www.inngest.com/docs/guides/resend-webhook-events
 * @see https://www.inngest.com/docs/features/inngest-functions/steps-workflows/wait-for-event
 */

import { inngest } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { sendEmail } from '../../../integrations/resend';
import { logger, generateRequestId, createWebAppContextWithId } from '../../../logging/server';
import { getEnvVar, escapeHtml } from '@heyclaude/shared-runtime';

const BASE_URL = getEnvVar('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
const FROM_EMAIL = getEnvVar('RESEND_FROM_EMAIL') || 'Claude Pro Directory <hello@claudepro.directory>';

/**
 * Safely serialize a string value for use in CEL (Common Expression Language) filters.
 * Escapes special characters to prevent injection.
 * Returns a properly quoted CEL string literal.
 */
function toCelString(value: string | undefined | null): string {
  // Guard against undefined/null - return empty string literal
  if (value === undefined || value === null || value === '') {
    return '""';
  }
  // JSON.stringify handles escaping of quotes, backslashes, and special chars
  return JSON.stringify(value);
}

/**
 * Newsletter Signup Drip Campaign
 *
 * When a user signs up for the newsletter:
 * 1. Send welcome email
 * 2. Wait for them to click (up to 3 days)
 * 3. If clicked → send power user tips
 * 4. If not clicked → send engagement nudge
 * 5. After 7 days → send weekly digest preview
 */
export const newsletterDripCampaign = inngest.createFunction(
  {
    id: 'newsletter-drip-campaign',
    name: 'Newsletter Drip Campaign',
    retries: 3,
    // Idempotency: Use email to ensure only one drip campaign per subscriber
    idempotency: 'event.data.email',
  },
  { event: 'email/welcome' },
  async ({ event, step }) => {
    const requestId = generateRequestId();
    const logContext = createWebAppContextWithId(requestId, 'inngest', 'newsletterDripCampaign');

    const { email, triggerSource } = event.data;

    logger.info('Starting newsletter drip campaign', {
      ...logContext,
      email,
      triggerSource,
    });

    // Step 1: Welcome email is already sent by welcome.ts
    // We just note the campaign start time for tracking
    await step.run('record-campaign-start', async () => {
      logger.info('Newsletter drip campaign started', {
        ...logContext,
        email,
        triggerSource,
      });
    });

    // Step 2: Wait up to 3 days for user to click any link in emails
    const clickEvent = await step.waitForEvent('wait-for-engagement', {
      event: 'resend/email.clicked',
      timeout: '3 days',
      // Match on recipient email (safely escaped for CEL)
      if: `async.data.to[0] == ${toCelString(email)}`,
    });

    if (clickEvent) {
      // User is engaged! Send power user tips after 1 day
      logger.info('User engaged with email, scheduling tips', {
        ...logContext,
        email,
        clickedLink: clickEvent.data.click?.link,
      });

      await step.sleep('delay-tips-email', '1 day');

      await step.run('send-power-user-tips', async () => {
        const result = await sendEmail({
          to: email,
          from: FROM_EMAIL,
          subject: '🚀 Pro tips for getting the most out of Claude',
          html: buildPowerUserTipsEmail(),
        });

        if (result.error) {
          logger.warn('Failed to send power user tips email', {
            ...logContext,
            email,
            errorMessage: result.error.message,
          });
        }

        return result.data?.id;
      });
    } else {
      // User didn't click - send a gentle nudge
      logger.info('User not engaged, sending nudge email', {
        ...logContext,
        email,
      });

      await step.run('send-nudge-email', async () => {
        const result = await sendEmail({
          to: email,
          from: FROM_EMAIL,
          subject: 'Did you know? 5 ways to supercharge your Claude experience',
          html: buildNudgeEmail(),
        });

        if (result.error) {
          logger.warn('Failed to send nudge email', {
            ...logContext,
            email,
            errorMessage: result.error.message,
          });
        }

        return result.data?.id;
      });
    }

    // Step 3: After ~8 days total, check if they're still subscribed and send digest preview
    // Timeline: 3 days (wait for engagement) + 1 day (tips/nudge delay) + 4 days = 8 days
    await step.sleep('wait-for-digest', '4 days');

    const stillSubscribed = await step.run('check-subscription', async () => {
      const supabase = createSupabaseAdminClient();
      const { data } = await supabase
        .from('newsletter_subscriptions')
        .select('status')
        .eq('email', email)
        .single();

      // Check if status is a valid active status
      const status = data?.status;
      return status !== 'unsubscribed' && status !== 'bounced' && status !== 'complained';
    });

    if (stillSubscribed) {
      await step.run('send-digest-preview', async () => {
        const result = await sendEmail({
          to: email,
          from: FROM_EMAIL,
          subject: '📬 Your first Claude Pro Directory digest is coming!',
          html: buildDigestPreviewEmail(),
        });

        return result.data?.id;
      });
    }

    logger.info('Newsletter drip campaign completed', {
      ...logContext,
      email,
      engaged: !!clickEvent,
      stillSubscribed,
    });

    return { email, engaged: !!clickEvent, completed: true };
  }
);

/**
 * Job Posting Drip Campaign
 *
 * When an employer publishes a job:
 * 1. Send confirmation email
 * 2. Wait for them to view the posting (click) - up to 2 days
 * 3. If no click → remind them to share
 * 4. At 7 days → send performance report
 * 5. At 25 days → remind about expiration (if 30-day listing)
 */
export const jobPostingDripCampaign = inngest.createFunction(
  {
    id: 'job-posting-drip-campaign',
    name: 'Job Posting Drip Campaign',
    retries: 3,
    // Idempotency: Use jobId to ensure only one drip campaign per job posting
    idempotency: 'event.data.jobId',
  },
  { event: 'job/published' },
  async ({ event, step }) => {
    const requestId = generateRequestId();
    const logContext = createWebAppContextWithId(requestId, 'inngest', 'jobPostingDripCampaign');

    const { jobId, employerEmail, employerName, jobTitle, jobSlug } = event.data;
    const safeJobTitle = escapeHtml(jobTitle);
    const safeName = escapeHtml(employerName || 'there');

    logger.info('Starting job posting drip campaign', {
      ...logContext,
      jobId,
      employerEmail,
    });

    // Step 1: Send confirmation email
    await step.run('send-confirmation', async () => {
      const result = await sendEmail({
        to: employerEmail,
        from: FROM_EMAIL,
        subject: `✅ Your job posting "${safeJobTitle}" is now live!`,
        html: buildJobConfirmationEmail(safeJobTitle, jobSlug, safeName),
      });

      if (result.error) {
        logger.warn('Failed to send job confirmation email', {
          ...logContext,
          jobId,
          errorMessage: result.error.message,
        });
      }

      return result.data?.id;
    });

    // Step 2: Wait for them to click (view their posting)
    const viewedPosting = await step.waitForEvent('wait-for-view', {
      event: 'resend/email.clicked',
      timeout: '2 days',
      // Match on recipient email (safely escaped for CEL)
      if: `async.data.to[0] == ${toCelString(employerEmail)}`,
    });

    if (!viewedPosting) {
      // Remind them to share their posting
      await step.run('send-share-reminder', async () => {
        const result = await sendEmail({
          to: employerEmail,
          from: FROM_EMAIL,
          subject: `📣 Boost visibility for "${safeJobTitle}" - share your posting`,
          html: buildShareReminderEmail(safeJobTitle, jobSlug, safeName),
        });

        return result.data?.id;
      });
    }

    // Step 3: At 7 days, send performance report
    await step.sleep('wait-for-report', '5 days'); // 2 + 5 = 7 days

    const jobStats = await step.run('get-job-stats', async () => {
      const supabase = createSupabaseAdminClient();
      const { data } = await supabase
        .from('jobs')
        .select('view_count, click_count, status')
        .eq('id', jobId)
        .single();

      return data;
    });

    if (jobStats && jobStats.status === 'active') {
      await step.run('send-performance-report', async () => {
        const result = await sendEmail({
          to: employerEmail,
          from: FROM_EMAIL,
          subject: `📊 Your job posting stats: ${jobStats.view_count || 0} views`,
          html: buildPerformanceReportEmail(
            safeJobTitle,
            jobSlug,
            safeName,
            jobStats.view_count || 0,
            jobStats.click_count || 0
          ),
        });

        return result.data?.id;
      });

      // Step 4: At 25 days, remind about expiration
      await step.sleep('wait-for-expiration-reminder', '18 days'); // 7 + 18 = 25 days

      // Check if job is still active
      const stillActive = await step.run('check-job-status', async () => {
        const supabase = createSupabaseAdminClient();
        const { data } = await supabase
          .from('jobs')
          .select('status, expires_at')
          .eq('id', jobId)
          .single();

        return data?.status === 'active';
      });

      if (stillActive) {
        await step.run('send-expiration-reminder', async () => {
          const result = await sendEmail({
            to: employerEmail,
            from: FROM_EMAIL,
            subject: `⏰ Your job posting expires in 5 days - renew now?`,
            html: buildExpirationReminderEmail(safeJobTitle, jobSlug, safeName),
          });

          return result.data?.id;
        });
      }
    }

    logger.info('Job posting drip campaign completed', {
      ...logContext,
      jobId,
      employerEmail,
    });

    return { jobId, employerEmail, completed: true };
  }
);

// ============================================================================
// Email Templates (HTML builders)
// ============================================================================

function buildPowerUserTipsEmail(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="color: #ff6b35; font-size: 24px;">🚀 Pro Tips for Claude Power Users</h1>
  
  <p>Since you're actively exploring Claude Pro Directory, here are some tips to get even more value:</p>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <h3 style="margin-top: 0;">1. Bookmark Your Favorites</h3>
    <p>Save prompts, rules, and MCP servers to your personal library for quick access.</p>
  </div>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <h3 style="margin-top: 0;">2. Explore Categories</h3>
    <p>We have specialized content for coding, writing, analysis, and more.</p>
  </div>
  
  <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <h3 style="margin-top: 0;">3. Submit Your Own Content</h3>
    <p>Share your best prompts and get featured in the community.</p>
  </div>
  
  <p style="margin-top: 30px;">
    <a href="${BASE_URL}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Explore More</a>
  </p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    Happy exploring!<br>
    The Claude Pro Directory Team
  </p>
</body>
</html>`;
}

function buildNudgeEmail(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="color: #ff6b35; font-size: 24px;">Did you know? 5 ways to supercharge your Claude experience</h1>
  
  <p>We noticed you might not have had a chance to explore yet. Here's what you're missing:</p>
  
  <ol style="line-height: 1.8;">
    <li><strong>Curated Prompts</strong> - Expert-crafted prompts for every use case</li>
    <li><strong>MCP Servers</strong> - Extend Claude's capabilities with custom tools</li>
    <li><strong>Cursor Rules</strong> - Optimize your AI-powered coding experience</li>
    <li><strong>Skills Library</strong> - Downloadable skill packs for Claude Desktop</li>
    <li><strong>Community Submissions</strong> - Fresh content added daily</li>
  </ol>
  
  <p style="margin-top: 30px;">
    <a href="${BASE_URL}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Exploring</a>
  </p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    If you have any questions, just reply to this email!<br>
    The Claude Pro Directory Team
  </p>
</body>
</html>`;
}

function buildDigestPreviewEmail(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="color: #ff6b35; font-size: 24px;">📬 Your Weekly Digest is Coming!</h1>
  
  <p>Starting next week, you'll receive our weekly digest featuring:</p>
  
  <ul style="line-height: 1.8;">
    <li>🆕 Trending new prompts and tools</li>
    <li>⭐ Community highlights</li>
    <li>📰 Claude ecosystem news</li>
    <li>💡 Tips and tutorials</li>
  </ul>
  
  <p>The digest arrives every Tuesday morning - keep an eye on your inbox!</p>
  
  <p style="margin-top: 30px;">
    <a href="${BASE_URL}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Browse This Week's Content</a>
  </p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    The Claude Pro Directory Team
  </p>
</body>
</html>`;
}

function buildJobConfirmationEmail(jobTitle: string, jobSlug: string, name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="color: #22c55e; font-size: 24px;">✅ Your Job is Live!</h1>
  
  <p>Hi ${name},</p>
  
  <p>Great news! Your job posting <strong>"${jobTitle}"</strong> is now live on Claude Pro Directory.</p>
  
  <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #22c55e;">
    <p style="margin: 0;"><strong>Next steps to maximize visibility:</strong></p>
    <ul style="margin-top: 10px;">
      <li>Share on LinkedIn, Twitter, and relevant communities</li>
      <li>Add to your company's careers page</li>
      <li>Consider upgrading to Featured for 3x more views</li>
    </ul>
  </div>
  
  <p style="margin-top: 30px;">
    <a href="${BASE_URL}/jobs/${jobSlug}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Posting</a>
  </p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    Questions? Just reply to this email.<br>
    The Claude Pro Directory Team
  </p>
</body>
</html>`;
}

function buildShareReminderEmail(jobTitle: string, jobSlug: string, name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="color: #ff6b35; font-size: 24px;">📣 Boost Your Job Visibility</h1>
  
  <p>Hi ${name},</p>
  
  <p>Your job posting <strong>"${jobTitle}"</strong> is live, but sharing it can significantly increase applications!</p>
  
  <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #f59e0b;">
    <p style="margin: 0;"><strong>📊 Did you know?</strong></p>
    <p style="margin: 10px 0 0 0;">Shared job postings receive 4x more applications on average.</p>
  </div>
  
  <p><strong>Quick share options:</strong></p>
  <ul>
    <li><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${BASE_URL}/jobs/${jobSlug}`)}">Share on LinkedIn</a></li>
    <li><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(`${BASE_URL}/jobs/${jobSlug}`)}&text=${encodeURIComponent(`We're hiring! ${jobTitle}`)}">Share on Twitter/X</a></li>
  </ul>
  
  <p style="margin-top: 30px;">
    <a href="${BASE_URL}/jobs/${jobSlug}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Posting</a>
  </p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    The Claude Pro Directory Team
  </p>
</body>
</html>`;
}

function buildPerformanceReportEmail(
  jobTitle: string,
  jobSlug: string,
  name: string,
  views: number,
  clicks: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="color: #ff6b35; font-size: 24px;">📊 Your Job Posting Performance</h1>
  
  <p>Hi ${name},</p>
  
  <p>Here's how <strong>"${jobTitle}"</strong> is performing after one week:</p>
  
  <div style="display: flex; gap: 20px; margin: 20px 0;">
    <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center; flex: 1;">
      <div style="font-size: 32px; font-weight: bold; color: #22c55e;">${views}</div>
      <div style="color: #666;">Views</div>
    </div>
    <div style="background: #eff6ff; border-radius: 8px; padding: 20px; text-align: center; flex: 1;">
      <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${clicks}</div>
      <div style="color: #666;">Clicks</div>
    </div>
  </div>
  
  ${views < 50 ? `
  <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0;"><strong>💡 Tip:</strong> Consider upgrading to Featured to boost visibility by 3x!</p>
  </div>
  ` : ''}
  
  <p style="margin-top: 30px;">
    <a href="${BASE_URL}/jobs/${jobSlug}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Full Analytics</a>
  </p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    The Claude Pro Directory Team
  </p>
</body>
</html>`;
}

function buildExpirationReminderEmail(jobTitle: string, _jobSlug: string, name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="color: #f59e0b; font-size: 24px;">⏰ Your Job Posting Expires in 5 Days</h1>
  
  <p>Hi ${name},</p>
  
  <p>Your job posting <strong>"${jobTitle}"</strong> will expire in 5 days.</p>
  
  <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #f59e0b;">
    <p style="margin: 0;"><strong>Still hiring?</strong></p>
    <p style="margin: 10px 0 0 0;">Renew your listing to keep it visible to qualified candidates.</p>
  </div>
  
  <p style="margin-top: 30px;">
    <a href="${BASE_URL}/account/jobs" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Your Postings</a>
  </p>
  
  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    The Claude Pro Directory Team
  </p>
</body>
</html>`;
}
