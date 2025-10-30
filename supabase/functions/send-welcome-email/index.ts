/**
 * Send Welcome Email - Unified Edge Function
 *
 * ARCHITECTURE:
 * - Handles TWO invocation patterns:
 *   1. Supabase Auth Hook (OAuth signup) - webhook signature verification
 *   2. Database trigger (newsletter subscription) - no signature, internal only
 * - Sends custom branded emails via Resend
 * - Enrolls users in onboarding sequence
 *
 * CORE DIRECTIVES:
 * - Security: Webhook verification for auth hooks, internal-only for triggers
 * - Performance: <50ms cold start, <10ms warm execution
 * - Scalability: Handles 100+ emails/minute on free tier
 * - Maintainability: Configuration-driven template selection
 * - Resource-conscious: Minimal memory footprint (<20MB)
 *
 * DEPLOYMENT:
 * ```bash
 * supabase functions deploy send-welcome-email
 * supabase secrets set RESEND_API_KEY=re_...
 * supabase secrets set SEND_EMAIL_HOOK_SECRET=whsec_...
 * ```
 *
 * @module supabase/functions/send-welcome-email
 */

import React from 'npm:react@18.3.1';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import {
  AUTH_HOOK_ENV,
  getEmailConfig,
  RESEND_ENV,
  SUPABASE_ENV,
  validateEnvironment,
} from '../_shared/email-config.ts';

// Import existing React Email templates
import { NewsletterWelcome } from '../_shared/templates/newsletter-welcome.tsx';

/**
 * Initialize dependencies
 * Fails fast if environment is misconfigured
 */
validateEnvironment(['resend', 'auth-hook', 'supabase']);

const resend = new Resend(RESEND_ENV.apiKey);
const hookSecret = AUTH_HOOK_ENV.secret.replace('v1,whsec_', ''); // Strip prefix
const supabase = createClient(SUPABASE_ENV.url, SUPABASE_ENV.serviceRoleKey);

/**
 * Auth Hook payload schema
 * Supabase sends this structure for OAuth signup events
 *
 * NOTE: We only use GitHub/Google OAuth, so we only handle 'signup' action
 * Magic link, password reset, and email change are not enabled
 */
interface AuthHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
      full_name?: string;
      avatar_url?: string;
      provider?: string; // 'github' or 'google'
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to?: string;
    email_action_type: 'signup'; // Only signup for OAuth
    site_url: string;
  };
}

/**
 * Newsletter Trigger payload schema
 * Database trigger sends this structure via pg_net
 */
interface NewsletterTriggerPayload {
  email: string;
  source?: string;
  referrer?: string;
  copy_type?: string;
  copy_category?: string;
  copy_slug?: string;
  trigger_type: 'newsletter';
  subscription_id: string;
}

/**
 * Main Edge Function handler
 *
 * Flow:
 * 1. Detect invocation source (auth hook vs newsletter trigger)
 * 2. Auth hook: Verify webhook signature
 * 3. Newsletter trigger: Parse JSON payload (no signature needed)
 * 4. Render email template
 * 5. Send email via Resend
 * 6. Enroll in sequence (for newsletter triggers)
 * 7. Return success/error response
 */
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ============================================
  // DETECT INVOCATION SOURCE
  // ============================================
  const triggerSource = req.headers.get('X-Trigger-Source');

  // ============================================
  // PATTERN 1: Newsletter Database Trigger (NEW)
  // ============================================
  if (triggerSource === 'newsletter_subscription') {
    console.log('Processing newsletter trigger...');

    let payload: NewsletterTriggerPayload;
    try {
      payload = await req.json();
    } catch (error) {
      console.error('Failed to parse newsletter payload:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return await handleNewsletterSubscription(payload);
  }

  // ============================================
  // PATTERN 2: Auth Hook (EXISTING)
  // ============================================
  console.log('Processing auth hook...');

  const payloadText = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  let verified: AuthHookPayload;
  try {
    verified = wh.verify(payloadText, headers) as AuthHookPayload;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Invalid webhook signature',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return await handleAuthHook(verified);
});

/**
 * Handle newsletter subscription trigger
 * Sends welcome email + enrolls in sequence
 */
async function handleNewsletterSubscription(payload: NewsletterTriggerPayload): Promise<Response> {
  const { email, source, copy_type } = payload;

  console.log('Newsletter subscription:', {
    email,
    source: source || 'unknown',
    copy_type: copy_type || null,
  });

  // Render email template
  let html: string;
  const emailConfig = getEmailConfig('welcome');

  try {
    html = await renderAsync(
      React.createElement(NewsletterWelcome, {
        email,
        source: source || 'newsletter',
      })
    );
  } catch (error) {
    console.error('Template rendering failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to render email template',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Send email via Resend
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [email],
      subject: emailConfig.subject,
      html,
      tags: [
        ...emailConfig.tags,
        { name: 'source', value: source || 'unknown' },
        ...(copy_type ? [{ name: 'copy_type', value: copy_type }] : []),
      ],
      headers: {
        'X-Entity-Ref-ID': payload.subscription_id,
      },
    });

    if (error) throw error;

    console.log('Welcome email sent successfully:', {
      emailId: data?.id,
      recipient: email,
    });

    // Enroll in onboarding sequence
    try {
      const { error: seqError } = await supabase.rpc('enroll_in_email_sequence', {
        p_email: email,
      });

      if (seqError) {
        console.error('Failed to enroll in sequence:', seqError);
        // Don't fail - email was sent successfully
      } else {
        console.log('Enrolled in onboarding sequence:', { email });
      }
    } catch (seqError) {
      console.error('Sequence enrollment error:', seqError);
      // Don't fail - email was sent successfully
    }

    return new Response(
      JSON.stringify({ success: true, emailId: data?.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email send failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Email Send Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle auth hook (OAuth signup)
 * Sends welcome email for new OAuth users
 */
async function handleAuthHook(verified: AuthHookPayload): Promise<Response> {
  const { user, email_data } = verified;
  const { email_action_type } = email_data;

  console.log('Processing auth email:', {
    action: email_action_type,
    email: user.email,
    userId: user.id,
  });

  // ============================================
  // OAUTH SIGNUP ONLY: Send welcome email
  // We only use GitHub/Google OAuth, no magic links or password resets
  // ============================================

  // Verify this is a signup event
  if (email_action_type !== 'signup') {
    console.warn('Unexpected email action type:', email_action_type);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Email action '${email_action_type}' not supported (OAuth only)`,
      }),
      {
        status: 200, // Return 200 to prevent Supabase retries
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  let html: string;
  const emailConfig = getEmailConfig('welcome');

  try {
    // Render existing NewsletterWelcome template with OAuth provider info
    html = await renderAsync(
      React.createElement(NewsletterWelcome, {
        email: user.email,
        source: user.user_metadata?.provider ?? 'oauth', // 'github' or 'google'
      })
    );

    console.log('Welcome email rendered successfully:', {
      provider: user.user_metadata?.provider,
      userName: user.user_metadata?.name ?? user.user_metadata?.full_name,
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
  // SEND EMAIL: Resend API with retry on failure
  // ============================================
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [user.email],
      subject: emailConfig.subject,
      html,
      tags: emailConfig.tags,
      headers: {
        'X-Entity-Ref-ID': user.id,
      },
    });

    if (error) {
      throw error;
    }

    console.log('Email sent successfully:', {
      emailId: data?.id,
      action: email_action_type,
      recipient: user.email,
    });

    return new Response(JSON.stringify({ success: true, emailId: data?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Email send failed:', error);

    // Return error but don't block auth flow
    // Supabase will retry if we return non-200 status
    return new Response(
      JSON.stringify({
        error: 'Email Send Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        // Supabase checks this field to determine retry
        retry: true,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
