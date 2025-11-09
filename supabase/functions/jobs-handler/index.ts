/**
 * Jobs Handler - Unified jobs management edge function
 * Replaces manage_job() RPC with action-based routing
 */

import type { Database } from '../_shared/database.types.ts';
import { sendDiscordWebhook } from '../_shared/utils/discord.ts';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
  successResponse,
  unauthorizedResponse,
} from '../_shared/utils/response.ts';
import { supabaseServiceRole } from '../_shared/utils/supabase-service-role.ts';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];
type JobStatus = Database['public']['Enums']['job_status'];

Deno.serve(async (req: Request) => {
  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Job-Action',
      },
    });
  }

  if (req.method !== 'POST') {
    return methodNotAllowedResponse('POST');
  }

  // Get action from header
  const action = req.headers.get('X-Job-Action');

  if (!action) {
    return badRequestResponse('Missing X-Job-Action header');
  }

  // Webhook actions don't require JWT (triggered by database)
  const webhookActions = ['notify-new', 'notify-status-change', 'cleanup-deleted'];
  const isWebhookAction = webhookActions.includes(action);

  let userId: string | undefined;

  // Only verify JWT for non-webhook actions
  if (!isWebhookAction) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorizedResponse('Missing or invalid Authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseServiceRole.auth.getUser(jwt);

    if (userError || !userData.user) {
      console.error('Auth verification failed:', userError);
      return unauthorizedResponse('Invalid authentication token');
    }

    userId = userData.user.id;
  }

  try {
    switch (action) {
      // User actions (require auth)
      case 'create':
      case 'update':
      case 'delete':
      case 'toggle': {
        // Ensure userId is defined for user actions
        if (!userId) {
          return unauthorizedResponse('Authentication required for this action');
        }

        // Route to appropriate handler with guaranteed non-null userId
        switch (action) {
          case 'create':
            return await handleCreate(req, userId);
          case 'update':
            return await handleUpdate(req, userId);
          case 'delete':
            return await handleDelete(req, userId);
          case 'toggle':
            return await handleToggleStatus(req, userId);
          default:
            // TypeScript exhaustiveness check
            return badRequestResponse(`Unhandled user action: ${action}`);
        }
      }
      // Webhook actions (triggered by database)
      case 'notify-new':
        return await handleNotifyNew(req);
      case 'notify-status-change':
        return await handleNotifyStatusChange(req);
      case 'cleanup-deleted':
        return await handleCleanupDeleted(req);
      default:
        return badRequestResponse(`Unknown action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error, `jobs-handler:${action}`);
  }
});

/**
 * Create Job - POST /jobs-handler with X-Job-Action: create
 */
async function handleCreate(req: Request, userId: string): Promise<Response> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequestResponse('Valid JSON body required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return badRequestResponse('Valid JSON body required');
  }

  const data = payload as Partial<JobInsert>;

  // Validate required fields
  if (!data.title || typeof data.title !== 'string') {
    return badRequestResponse('title is required');
  }
  if (!data.company || typeof data.company !== 'string') {
    return badRequestResponse('company is required');
  }
  if (!data.description || typeof data.description !== 'string') {
    return badRequestResponse('description is required');
  }
  if (!data.type || typeof data.type !== 'string') {
    return badRequestResponse('type is required');
  }
  if (!data.category || typeof data.category !== 'string') {
    return badRequestResponse('category is required');
  }
  if (!data.link || typeof data.link !== 'string') {
    return badRequestResponse('link is required');
  }

  // Generate slug from title (trigger will handle this, but we set explicitly)
  const slug =
    data.slug ||
    `${data.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;

  // Insert job with business rules
  const { data: job, error } = await supabaseServiceRole
    .from('jobs')
    .insert({
      user_id: userId,
      title: data.title,
      company: data.company,
      description: data.description,
      type: data.type,
      category: data.category,
      link: data.link,
      location: data.location || null,
      salary: data.salary || null,
      remote: data.remote ?? false,
      workplace: data.workplace || null,
      experience: data.experience || null,
      tags: data.tags || [],
      requirements: data.requirements || [],
      benefits: data.benefits || [],
      contact_email: data.contact_email || null,
      company_logo: data.company_logo || null,
      company_id: data.company_id || null,
      slug,
      status: 'pending_review' as JobStatus, // Business rule: all new jobs require review
      payment_amount: 299.0, // Business rule: standard job posting fee
      payment_status: 'unpaid',
      plan: 'standard',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create job:', error);
    return errorResponse(error, 'create_job');
  }

  return successResponse(
    {
      success: true,
      job,
      requiresPayment: true,
      message:
        'Job submitted for review! You will receive payment instructions via email after admin approval.',
    },
    201
  );
}

/**
 * Update Job - POST /jobs-handler with X-Job-Action: update
 */
async function handleUpdate(req: Request, userId: string): Promise<Response> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequestResponse('Valid JSON body required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return badRequestResponse('Valid JSON body required');
  }

  const data = payload as Partial<JobUpdate> & { id: string };

  if (!data.id || typeof data.id !== 'string') {
    return badRequestResponse('Job ID is required');
  }

  // Build update object (only include provided fields)
  const updateData: JobUpdate = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.company !== undefined) updateData.company = data.company;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.link !== undefined) updateData.link = data.link;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.salary !== undefined) updateData.salary = data.salary;
  if (data.remote !== undefined) updateData.remote = data.remote;
  if (data.workplace !== undefined) updateData.workplace = data.workplace;
  if (data.experience !== undefined) updateData.experience = data.experience;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.requirements !== undefined) updateData.requirements = data.requirements;
  if (data.benefits !== undefined) updateData.benefits = data.benefits;
  if (data.contact_email !== undefined) updateData.contact_email = data.contact_email;
  if (data.company_logo !== undefined) updateData.company_logo = data.company_logo;
  if (data.company_id !== undefined) updateData.company_id = data.company_id;

  // Update with ownership verification
  const { data: job, error } = await supabaseServiceRole
    .from('jobs')
    .update(updateData)
    .eq('id', data.id)
    .eq('user_id', userId) // Ownership check
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned = not found or no permission
      return unauthorizedResponse('Job not found or you do not have permission to update it');
    }
    console.error('Failed to update job:', error);
    return errorResponse(error, 'update_job');
  }

  return successResponse({
    success: true,
    job,
  });
}

/**
 * Delete Job - POST /jobs-handler with X-Job-Action: delete
 */
async function handleDelete(req: Request, userId: string): Promise<Response> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequestResponse('Valid JSON body required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return badRequestResponse('Valid JSON body required');
  }

  const data = payload as { id: string };

  if (!data.id || typeof data.id !== 'string') {
    return badRequestResponse('Job ID is required');
  }

  // Soft delete with ownership verification
  const { error } = await supabaseServiceRole
    .from('jobs')
    .update({ status: 'deleted' as JobStatus })
    .eq('id', data.id)
    .eq('user_id', userId); // Ownership check

  if (error) {
    if (error.code === 'PGRST116') {
      return unauthorizedResponse('Job not found or you do not have permission to delete it');
    }
    console.error('Failed to delete job:', error);
    return errorResponse(error, 'delete_job');
  }

  return successResponse({
    success: true,
  });
}

/**
 * Toggle Status - POST /jobs-handler with X-Job-Action: toggle
 */
async function handleToggleStatus(req: Request, userId: string): Promise<Response> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequestResponse('Valid JSON body required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return badRequestResponse('Valid JSON body required');
  }

  const data = payload as { id: string; status: JobStatus };

  if (!data.id || typeof data.id !== 'string') {
    return badRequestResponse('Job ID is required');
  }

  if (!data.status || typeof data.status !== 'string') {
    return badRequestResponse('Status is required');
  }

  // Validate status enum
  const validStatuses: JobStatus[] = [
    'draft',
    'pending_review',
    'active',
    'expired',
    'rejected',
    'deleted',
  ];
  if (!validStatuses.includes(data.status)) {
    return badRequestResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Update status with ownership verification
  // Trigger will auto-set posted_at when status becomes 'active'
  const { data: job, error } = await supabaseServiceRole
    .from('jobs')
    .update({ status: data.status })
    .eq('id', data.id)
    .eq('user_id', userId) // Ownership check
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return unauthorizedResponse('Job not found or you do not have permission to update it');
    }
    console.error('Failed to toggle job status:', error);
    return errorResponse(error, 'toggle_status');
  }

  return successResponse({
    success: true,
    job,
  });
}

/**
 * Notify New - Database webhook handler for new job submissions
 * Triggered when status=pending_review
 */
async function handleNotifyNew(req: Request): Promise<Response> {
  const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_JOBS');

  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_JOBS not configured');
    return successResponse({ success: true, skipped: true });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequestResponse('Valid JSON body required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return badRequestResponse('Valid JSON body required');
  }

  const webhookPayload = payload as { type: string; table: string; record: JobRow };

  if (webhookPayload.type !== 'INSERT' || !webhookPayload.record) {
    return badRequestResponse('Invalid webhook payload');
  }

  const job = webhookPayload.record;

  // Only notify for pending_review jobs
  if (job.status !== 'pending_review') {
    return successResponse({ success: true, skipped: true });
  }

  // Build Discord embed
  const embed = {
    title: `💼 New Job Submission: ${job.title}`,
    description: job.description.slice(0, 300) + (job.description.length > 300 ? '...' : ''),
    color: 0xfee75c, // Yellow
    fields: [
      {
        name: '🏢 Company',
        value: job.company,
        inline: true,
      },
      {
        name: '📍 Location',
        value: job.location || 'Not specified',
        inline: true,
      },
      {
        name: '💰 Salary',
        value: job.salary || 'Not disclosed',
        inline: true,
      },
      {
        name: '📂 Category',
        value: `\`${job.category}\``,
        inline: true,
      },
      {
        name: '🔖 Type',
        value: `\`${job.type}\``,
        inline: true,
      },
      {
        name: '🌐 Remote',
        value: job.remote ? '✅ Yes' : '❌ No',
        inline: true,
      },
      {
        name: '🔗 Apply',
        value: `[View Application](${job.link})`,
        inline: false,
      },
    ],
    footer: {
      text: `Job ID: ${job.id.slice(0, 8)} • Awaiting admin approval`,
    },
    timestamp: new Date().toISOString(),
  };

  // Send to Discord with retry + webhook_events logging
  try {
    await sendDiscordWebhook(
      DISCORD_WEBHOOK_URL,
      {
        content: '🆕 **New Job Submission Requires Review**',
        embeds: [embed],
      },
      'job_submission_new',
      job.id
    );

    console.log(`Sent new job notification for: ${job.id}`);
    return successResponse({ success: true });
  } catch (error) {
    console.error('Failed to send Discord webhook:', error);
    return errorResponse(error, 'notify_new_discord');
  }
}

/**
 * Notify Status Change - Database webhook handler for job status changes
 * Triggered when status changes
 */
async function handleNotifyStatusChange(req: Request): Promise<Response> {
  const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_JOBS');

  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_JOBS not configured');
    return successResponse({ success: true, skipped: true });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequestResponse('Valid JSON body required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return badRequestResponse('Valid JSON body required');
  }

  const webhookPayload = payload as {
    type: string;
    table: string;
    record: JobRow;
    old_record: JobRow;
  };

  if (webhookPayload.type !== 'UPDATE' || !webhookPayload.record) {
    return badRequestResponse('Invalid webhook payload');
  }

  const job = webhookPayload.record;
  const oldJob = webhookPayload.old_record;

  // Only notify if status actually changed
  if (job.status === oldJob?.status) {
    return successResponse({ success: true, skipped: true });
  }

  // Status color mapping
  const statusColors: Record<JobStatus, number> = {
    draft: 0x99aab5, // Gray
    pending_review: 0xfee75c, // Yellow
    active: 0x57f287, // Green
    expired: 0x99aab5, // Gray
    rejected: 0xed4245, // Red
    deleted: 0x5865f2, // Blurple
  };

  const statusEmojis: Record<JobStatus, string> = {
    draft: '📝',
    pending_review: '⏳',
    active: '✅',
    expired: '⏰',
    rejected: '❌',
    deleted: '🗑️',
  };

  const color = statusColors[job.status] || 0x99aab5;
  const emoji = statusEmojis[job.status] || '📄';

  // Build Discord embed
  const embed = {
    title: `${emoji} Job Status Changed: ${job.title}`,
    description: `Status updated from **${oldJob?.status}** → **${job.status}**`,
    color,
    fields: [
      {
        name: '🏢 Company',
        value: job.company,
        inline: true,
      },
      {
        name: '📂 Category',
        value: `\`${job.category}\``,
        inline: true,
      },
      {
        name: '🔗 Link',
        value: `[View Job](https://claudepro.directory/jobs/${job.slug})`,
        inline: false,
      },
    ],
    footer: {
      text: `Job ID: ${job.id.slice(0, 8)}`,
    },
    timestamp: new Date().toISOString(),
  };

  // Send to Discord with retry + webhook_events logging
  try {
    await sendDiscordWebhook(
      DISCORD_WEBHOOK_URL,
      {
        content: '🔄 **Job Status Update**',
        embeds: [embed],
      },
      'job_status_change',
      job.id
    );

    console.log(
      `Sent status change notification for: ${job.id} (${oldJob?.status} → ${job.status})`
    );
    return successResponse({ success: true });
  } catch (error) {
    console.error('Failed to send Discord webhook:', error);
    return errorResponse(error, 'notify_status_discord');
  }
}

/**
 * Cleanup Deleted - Database webhook handler for soft-deleted jobs
 * Triggered when status='deleted'
 */
async function handleCleanupDeleted(req: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequestResponse('Valid JSON body required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return badRequestResponse('Valid JSON body required');
  }

  const webhookPayload = payload as {
    type: string;
    table: string;
    record: JobRow;
    old_record: JobRow;
  };

  if (webhookPayload.type !== 'UPDATE' || !webhookPayload.record) {
    return badRequestResponse('Invalid webhook payload');
  }

  const job = webhookPayload.record;
  const oldJob = webhookPayload.old_record;

  // Only cleanup if status changed to 'deleted'
  if (job.status !== 'deleted' || oldJob?.status === 'deleted') {
    return successResponse({ success: true, skipped: true });
  }

  console.log(`Cleaning up deleted job: ${job.id} (${job.title})`);

  // Archive job data (store in separate archive table if needed)
  // For now, just log the deletion event
  const archiveData = {
    job_id: job.id,
    title: job.title,
    company: job.company,
    deleted_at: new Date().toISOString(),
    original_status: oldJob?.status,
  };

  console.log('Archived job data:', JSON.stringify(archiveData, null, 2));

  // Optional: Send deletion notification to Discord
  const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_JOBS');
  if (DISCORD_WEBHOOK_URL) {
    const embed = {
      title: `Deleted: ${job.title}`,
      description: `Job by ${job.company} has been deleted`,
      color: 0x5865f2, // Blurple
      fields: [
        {
          name: '📂 Category',
          value: `\`${job.category}\``,
          inline: true,
        },
        {
          name: '📅 Previous Status',
          value: `\`${oldJob?.status || 'unknown'}\``,
          inline: true,
        },
      ],
      footer: {
        text: `Job ID: ${job.id.slice(0, 8)}`,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      await sendDiscordWebhook(
        DISCORD_WEBHOOK_URL,
        {
          content: '🗑️ **Job Deleted**',
          embeds: [embed],
        },
        'job_deleted',
        job.id
      );

      console.log(`Sent deletion notification for: ${job.id}`);
    } catch (error) {
      console.error('Failed to send Discord webhook:', error);
    }
  }

  return successResponse({
    success: true,
    archived: archiveData,
  });
}
