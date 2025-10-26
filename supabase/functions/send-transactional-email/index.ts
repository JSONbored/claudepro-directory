/**
 * Send Transactional Email - Supabase Database Webhook Edge Function
 *
 * ARCHITECTURE:
 * - Triggered by database webhooks (INSERT/UPDATE/DELETE on tables)
 * - Sends transactional emails for user actions (job posted, collection shared, etc.)
 * - No webhook signature verification needed (internal Supabase trigger)
 * - Configuration-driven template selection
 *
 * CORE DIRECTIVES:
 * - Security: Internal-only (not exposed to public internet)
 * - Performance: <30ms execution time
 * - Scalability: Handles 1000+ events/hour
 * - Maintainability: Add new email types via configuration
 * - Resource-conscious: Minimal memory (<15MB)
 *
 * SUPPORTED EMAIL TYPES:
 * - job_posted: Confirmation when employer posts a job
 * - collection_shared: Notification when user shares a collection
 * - (Future) profile_featured: User profile selected as featured
 * - (Future) bookmark_milestone: User reaches bookmark milestone (10, 50, 100)
 *
 * DEPLOYMENT:
 * ```bash
 * supabase functions deploy send-transactional-email
 * supabase secrets set RESEND_API_KEY=re_...
 * ```
 *
 * @module supabase/functions/send-transactional-email
 */

import React from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { getEmailConfig, RESEND_ENV, validateEnvironment } from '../_shared/email-config.ts';

/**
 * Initialize dependencies
 */
validateEnvironment(['resend']);

const resend = new Resend(RESEND_ENV.apiKey);

/**
 * Database webhook payload schema
 * Supabase sends this structure for table events
 */
interface WebhookPayload<T = Record<string, unknown>> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: T;
  old_record: T | null;
}

/**
 * Email request schema
 * Flexible structure for different email types
 */
interface EmailRequest {
  type: 'job_posted' | 'collection_shared' | 'profile_featured' | 'bookmark_milestone';
  to: string;
  data: Record<string, unknown>;
}

/**
 * Main Edge Function handler
 *
 * Flow:
 * 1. Parse webhook payload
 * 2. Determine email type from payload
 * 3. Extract recipient and template data
 * 4. Render email template
 * 5. Send via Resend
 */
Deno.serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid JSON payload',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.log('Database webhook received:', {
    type: payload.type,
    table: payload.table,
    schema: payload.schema,
  });

  // ============================================
  // EMAIL TYPE DETECTION: Configuration-driven
  // ============================================
  let emailRequest: EmailRequest | null = null;

  try {
    // Job posted webhook (jobs table INSERT)
    if (payload.table === 'jobs' && payload.type === 'INSERT') {
      const job = payload.record as {
        id: string;
        title: string;
        company: string;
        slug: string;
        user_id: string;
      };

      // Get user email from users table
      // NOTE: In production, this would query users table
      // For now, we'll require email in webhook payload or separate query
      emailRequest = {
        type: 'job_posted',
        to: 'placeholder@example.com', // TODO: Query users table
        data: {
          jobTitle: job.title,
          company: job.company,
          jobSlug: job.slug,
        },
      };
    }

    // Collection shared webhook (collections table UPDATE with shared = true)
    else if (payload.table === 'collections' && payload.type === 'UPDATE') {
      const collection = payload.record as {
        id: string;
        name: string;
        slug: string;
        user_id: string;
        shared?: boolean;
      };
      const oldCollection = payload.old_record as typeof collection | null;

      // Only send email if shared status changed to true
      if (collection.shared && !oldCollection?.shared) {
        emailRequest = {
          type: 'collection_shared',
          to: 'placeholder@example.com', // TODO: Query users table
          data: {
            collectionName: collection.name,
            collectionSlug: collection.slug,
          },
        };
      }
    }

    // No email needed for this webhook
    if (!emailRequest) {
      console.log('No email action required for this webhook');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook processed, no email sent',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Failed to process webhook payload:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to process webhook',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // ============================================
  // TEMPLATE RENDERING: Reuse existing templates
  // ============================================
  let html: string;
  const emailConfig = getEmailConfig(emailRequest.type as 'job-posted' | 'collection-shared');

  try {
    // For now, use simple HTML template
    // TODO: Create dedicated React Email templates in /src/emails/templates
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Action Successful!</h1>
    <p>Your action has been completed successfully.</p>
    <pre>${JSON.stringify(emailRequest.data, null, 2)}</pre>
  </div>
</body>
</html>
    `.trim();

    console.log('Transactional email rendered:', {
      type: emailRequest.type,
      recipient: emailRequest.to,
    });
  } catch (error) {
    console.error('Template rendering failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to render email template',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // ============================================
  // SEND EMAIL: Resend API
  // ============================================
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [emailRequest.to],
      subject: emailConfig.subject,
      html,
      tags: emailConfig.tags,
    });

    if (error) {
      throw error;
    }

    console.log('Transactional email sent successfully:', {
      emailId: data?.id,
      type: emailRequest.type,
      recipient: emailRequest.to,
    });

    return new Response(
      JSON.stringify({
        success: true,
        emailId: data?.id,
        type: emailRequest.type,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Email send failed:', error);

    return new Response(
      JSON.stringify({
        error: 'Email Send Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
