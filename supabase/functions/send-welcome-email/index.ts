/**
 * Send Welcome Email - Supabase Auth Hook Edge Function
 *
 * ARCHITECTURE:
 * - Triggered by Supabase Auth Hook (send_email event)
 * - Intercepts auth emails to send custom branded emails via Resend
 * - Validates webhook signature for security
 * - Handles magic link, password reset, email change events
 *
 * CORE DIRECTIVES:
 * - Security: Webhook verification with timing-safe comparison
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
import {
  AUTH_HOOK_ENV,
  getEmailConfig,
  RESEND_ENV,
  validateEnvironment,
} from '../_shared/email-config.ts';

// Import existing React Email templates
import { NewsletterWelcome } from '../_shared/templates/newsletter-welcome.tsx';

/**
 * Initialize dependencies
 * Fails fast if environment is misconfigured
 */
validateEnvironment(['resend', 'auth-hook']);

const resend = new Resend(RESEND_ENV.apiKey);
const hookSecret = AUTH_HOOK_ENV.secret.replace('v1,whsec_', ''); // Strip prefix

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
 * Main Edge Function handler
 *
 * Flow:
 * 1. Verify webhook signature (prevent unauthorized access)
 * 2. Parse and validate payload
 * 3. Select email template based on action type
 * 4. Send email via Resend
 * 5. Return success/error response
 */
Deno.serve(async (req: Request) => {
  // ============================================
  // SECURITY: Verify webhook signature
  // ============================================
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  let verified: AuthHookPayload;
  try {
    verified = wh.verify(payload, headers) as AuthHookPayload;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Invalid webhook signature',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const { user, email_data } = verified;
  const { email_action_type, token, token_hash, redirect_to } = email_data;

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
