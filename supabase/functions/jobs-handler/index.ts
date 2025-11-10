/**
 * Jobs Handler - Unified jobs management edge function
 * Replaces manage_job() RPC with action-based routing
 */

import type { Database } from '../_shared/database.types.ts';
import { sendDiscordWebhook } from '../_shared/utils/discord.ts';
import { createPolarCheckout, getPolarProductPriceId } from '../_shared/utils/polar.ts';
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
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];

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
  const webhookActions = [
    'notify-new',
    'notify-status-change',
    'cleanup-deleted',
    'notify-expired',
  ];
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
      case 'notify-expired':
        return await handleNotifyExpired(req);
      default:
        return badRequestResponse(`Unknown action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error, `jobs-handler:${action}`);
  }
});

/**
 * Generate URL-safe slug from company name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get existing company by name or create new one (auto-linking)
 */
async function getOrCreateCompany(companyName: string, userId: string): Promise<string | null> {
  try {
    const slug = generateSlug(companyName);

    if (!slug || slug.length === 0) {
      console.warn('Invalid company name for slug generation:', companyName);
      return null;
    }

    // Check if company already exists by slug
    const { data: existingCompany } = await supabaseServiceRole
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCompany) {
      return existingCompany.id;
    }

    // Create new company using proper typed insert
    const companyInsert: CompanyInsert = {
      name: companyName.trim(),
      slug,
      owner_id: userId,
      featured: false,
    };

    const { data: newCompany, error } = await supabaseServiceRole
      .from('companies')
      .insert(companyInsert)
      .select('id')
      .single();

    if (error) {
      console.error('Error auto-creating company:', error);
      return null;
    }

    return newCompany.id;
  } catch (error) {
    console.error('Error in getOrCreateCompany:', error);
    return null;
  }
}

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

  // Auto-link company if not already provided
  let companyId = data.company_id || null;
  if (!companyId && data.company) {
    companyId = await getOrCreateCompany(data.company, userId);
  }

  // Determine pricing based on plan and tier
  const plan = data.plan || 'one-time';
  const tier = data.tier || 'standard';

  // Pricing matrix
  const pricing = {
    'one-time': { standard: 79.0, featured: 178.0 },
    subscription: { standard: 59.0, featured: 108.0 },
  };

  const paymentAmount =
    pricing[plan as keyof typeof pricing]?.[tier as keyof (typeof pricing)['one-time']] || 79.0;

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
      company_id: companyId,
      slug,
      tier,
      status: 'pending_payment' as JobStatus,
      payment_amount: paymentAmount,
      payment_status: 'unpaid',
      plan,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create job:', error);
    return errorResponse(error, 'create_job');
  }

  // Get user email for Polar checkout
  const {
    data: { user },
    error: userError,
  } = await supabaseServiceRole.auth.getUser(
    req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  );

  if (userError || !user?.email) {
    console.error('Failed to get user email:', userError);
    return errorResponse({ message: 'User email not found' }, 'get_user_email');
  }

  // Get Polar product price ID
  const productPriceId = getPolarProductPriceId(plan, tier);

  if (!productPriceId) {
    console.error('Polar product price ID not configured for:', { plan, tier });
    return errorResponse({ message: 'Payment product not configured' }, 'polar_product_missing');
  }

  // Create Polar checkout session
  const siteUrl = Deno.env.get('SITE_URL') || 'https://claudepro.directory';
  const checkoutResult = await createPolarCheckout({
    productPriceId,
    jobId: job.id,
    userId,
    customerEmail: user.email,
    customerName: user.user_metadata?.full_name || user.user_metadata?.name,
    successUrl: `${siteUrl}/account/jobs?payment=success&job_id=${job.id}`,
  });

  if ('error' in checkoutResult) {
    console.error('Polar checkout creation failed:', checkoutResult.error);
    return errorResponse({ message: checkoutResult.error }, 'polar_checkout_failed');
  }

  return successResponse(
    {
      success: true,
      job,
      requiresPayment: true,
      checkoutUrl: checkoutResult.url,
      message: 'Job created! Redirecting to payment...',
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

  // Skip placeholder jobs (no notifications)
  if (job.is_placeholder) {
    return successResponse({ success: true, skipped: true, reason: 'placeholder' });
  }

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

  // Skip placeholder jobs (no notifications)
  if (job.is_placeholder) {
    return successResponse({ success: true, skipped: true, reason: 'placeholder' });
  }

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

/**
 * Webhook: Notify Expired Jobs - POST /jobs-handler with X-Job-Action: notify-expired
 * Triggered by database webhook when expire_jobs() updates jobs to 'expired' status
 */
async function handleNotifyExpired(req: Request): Promise<Response> {
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

  // Skip placeholder jobs (no notifications)
  if (job.is_placeholder) {
    return successResponse({ success: true, skipped: true, reason: 'placeholder' });
  }

  // Only process if status changed to 'expired'
  if (job.status !== 'expired' || oldJob?.status === 'expired') {
    return successResponse({ success: true, skipped: true });
  }

  console.log(`Job expired: ${job.id} (${job.title})`);

  // Send Discord notification
  const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_JOBS');
  if (DISCORD_WEBHOOK_URL) {
    const embed = {
      title: `⏰ Job Expired: ${job.title}`,
      description: 'Job listing has reached its expiration date',
      color: 0xffa500, // Orange
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
          name: '📅 Expired At',
          value: job.expires_at ? new Date(job.expires_at).toLocaleDateString() : 'Unknown',
          inline: false,
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
          content: '⏰ **Job Expired**',
          embeds: [embed],
        },
        'job_expired',
        job.id
      );
      console.log(`Sent expiration notification for: ${job.id}`);
      return successResponse({ success: true });
    } catch (error) {
      console.error('Failed to send Discord webhook:', error);
      return errorResponse(error, 'notify_expired_discord');
    }
  }

  return successResponse({ success: true });
}
