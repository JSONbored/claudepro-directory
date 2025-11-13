/**
 * Jobs Handler - Webhook notification edge function
 * Called by database triggers for Discord notifications
 * User actions (CRUD) now handled via server actions in src/lib/actions/jobs.actions.ts
 */

import type { Database } from '../_shared/database.types.ts';
import { sendDiscordWebhook } from '../_shared/utils/discord.ts';
import { supabaseServiceRole } from '../_shared/utils/supabase-service-role.ts';
import {
  type DatabaseWebhookPayload,
  didStatusChangeTo,
  handleCorsPreflight,
  validateWebhookUrl,
  webhookErrorResponse,
  webhookSkipResponse,
  webhookSuccessResponse,
} from '../_shared/utils/webhook-handler.ts';

type JobRow = Database['public']['Tables']['jobs']['Row'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflight();
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Get action from header (set by database trigger)
  const action = req.headers.get('X-Job-Action');
  if (!action) return new Response('Missing X-Job-Action header', { status: 400 });

  try {
    switch (action) {
      case 'notify-new':
        return await handleNotifyNew(req);
      case 'notify-status-change':
        return await handleNotifyStatusChange(req);
      case 'cleanup-deleted':
        return await handleCleanupDeleted(req);
      case 'notify-expired':
        return await handleNotifyExpired(req);
      default:
        return new Response(`Unknown action: ${action}`, { status: 400 });
    }
  } catch (error) {
    return webhookErrorResponse(error, `jobs-handler:${action}`);
  }
});

/**
 * Notify New - Database webhook handler for new job submissions
 * Triggered when status=pending_review
 */
async function handleNotifyNew(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(
    Deno.env.get('DISCORD_WEBHOOK_JOBS'),
    'DISCORD_WEBHOOK_JOBS'
  );
  if (webhookUrl instanceof Response) return webhookUrl;

  const payload: DatabaseWebhookPayload<JobRow> = await req.json();
  if (payload.type !== 'INSERT' || !payload.record) {
    return webhookSkipResponse('Invalid payload type');
  }

  const job = payload.record;

  // Skip placeholder jobs
  if (job.is_placeholder) return webhookSkipResponse('Placeholder job');

  // Only notify for pending_review jobs
  if (job.status !== 'pending_review') return webhookSkipResponse('Not pending review');

  // Get Discord embed from database function
  const { data: embedData, error: embedError } = await supabaseServiceRole.rpc(
    'build_job_submission_embed',
    { p_job_id: job.id }
  );

  if (embedError || !embedData) {
    console.error('Failed to build embed:', embedError);
    throw new Error('Embed generation failed');
  }

  await sendDiscordWebhook(
    webhookUrl,
    { content: '🆕 **New Job Submission Requires Review**', embeds: [embedData] },
    'job_submission_new',
    job.id
  );

  console.log(`Sent new job notification: ${job.id}`);
  return webhookSuccessResponse({ job_id: job.id });
}

/**
 * Notify Status Change - Database webhook handler for job status changes
 * Triggered when status changes
 */
async function handleNotifyStatusChange(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(
    Deno.env.get('DISCORD_WEBHOOK_JOBS'),
    'DISCORD_WEBHOOK_JOBS'
  );
  if (webhookUrl instanceof Response) return webhookUrl;

  const payload: DatabaseWebhookPayload<JobRow> = await req.json();
  if (payload.type !== 'UPDATE' || !payload.record || !payload.old_record) {
    return webhookSkipResponse('Invalid payload type');
  }

  const job = payload.record;
  const oldJob = payload.old_record;

  // Skip placeholder jobs
  if (job.is_placeholder) return webhookSkipResponse('Placeholder job');

  // Only notify if status actually changed
  if (job.status === oldJob.status) return webhookSkipResponse('Status unchanged');

  // Get Discord embed from database function
  const { data: embedData, error: embedError } = await supabaseServiceRole.rpc(
    'build_job_status_change_embed',
    {
      p_job_id: job.id,
      p_old_status: oldJob.status,
      p_new_status: job.status,
    }
  );

  if (embedError || !embedData) {
    console.error('Failed to build embed:', embedError);
    throw new Error('Embed generation failed');
  }

  await sendDiscordWebhook(
    webhookUrl,
    { content: '🔄 **Job Status Update**', embeds: [embedData] },
    'job_status_change',
    job.id
  );

  console.log(`Sent status change: ${job.id} (${oldJob.status} → ${job.status})`);
  return webhookSuccessResponse({ job_id: job.id });
}

/**
 * Cleanup Deleted - Database webhook handler for soft-deleted jobs
 * Triggered when status='deleted'
 */
async function handleCleanupDeleted(req: Request): Promise<Response> {
  const payload: DatabaseWebhookPayload<JobRow> = await req.json();
  if (!didStatusChangeTo(payload, 'deleted')) {
    return webhookSkipResponse('Status not changed to deleted');
  }

  const job = payload.record;
  const oldJob = payload.old_record;

  console.log(`Cleaning up deleted job: ${job.id} (${job.title})`);

  // Archive job data (log event)
  const archiveData = {
    job_id: job.id,
    title: job.title,
    company: job.company,
    deleted_at: new Date().toISOString(),
    original_status: oldJob?.status,
  };

  console.log('Archived job data:', JSON.stringify(archiveData, null, 2));

  // Optional: Send deletion notification to Discord
  const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_JOBS');
  if (webhookUrl) {
    const { data: embedData, error: embedError } = await supabaseServiceRole.rpc(
      'build_job_deleted_embed',
      {
        p_job_id: job.id,
        p_old_status: oldJob?.status,
      }
    );

    if (!embedError && embedData) {
      try {
        await sendDiscordWebhook(
          webhookUrl,
          { content: '🗑️ **Job Deleted**', embeds: [embedData] },
          'job_deleted',
          job.id
        );
        console.log(`Sent deletion notification: ${job.id}`);
      } catch (error) {
        console.error('Failed to send Discord webhook:', error);
      }
    }
  }

  return webhookSuccessResponse({ archived: archiveData });
}

/**
 * Notify Expired - Database webhook handler for expired jobs
 * Triggered when status changes to 'expired'
 */
async function handleNotifyExpired(req: Request): Promise<Response> {
  const payload: DatabaseWebhookPayload<JobRow> = await req.json();
  if (!didStatusChangeTo(payload, 'expired')) {
    return webhookSkipResponse('Status not changed to expired');
  }

  const job = payload.record;

  // Skip placeholder jobs
  if (job.is_placeholder) return webhookSkipResponse('Placeholder job');

  console.log(`Job expired: ${job.id} (${job.title})`);

  // Send Discord notification
  const webhookUrl = validateWebhookUrl(
    Deno.env.get('DISCORD_WEBHOOK_JOBS'),
    'DISCORD_WEBHOOK_JOBS'
  );
  if (webhookUrl instanceof Response) return webhookUrl;

  const { data: embedData, error: embedError } = await supabaseServiceRole.rpc(
    'build_job_expiration_embed',
    { p_job_id: job.id }
  );

  if (embedError || !embedData) {
    console.error('Failed to build embed:', embedError);
    throw new Error('Embed generation failed');
  }

  await sendDiscordWebhook(
    webhookUrl,
    { content: '⏰ **Job Expired**', embeds: [embedData] },
    'job_expired',
    job.id
  );

  console.log(`Sent expiration notification: ${job.id}`);
  return webhookSuccessResponse({ job_id: job.id });
}
