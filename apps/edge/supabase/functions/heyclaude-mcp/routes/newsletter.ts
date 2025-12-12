/**
 * subscribeNewsletter Tool Handler
 *
 * Subscribes a user to the newsletter via Inngest.
 * Sends event to Inngest which handles:
 * - Email validation
 * - Resend audience sync
 * - Database subscription
 * - Welcome email
 * - Drip campaign enrollment
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import { McpErrorCode, createErrorResponse } from '../lib/errors.ts';
import { sanitizeString } from '../lib/utils.ts';
import type { SubscribeNewsletterInput } from '../lib/types.ts';

/**
 * Validates email format
 */
function validateEmail(email: string): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!trimmed) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true, normalized: trimmed };
}

/**
 * Sends newsletter subscription event to Inngest
 * 
 * Uses Inngest HTTP API to send events.
 * For local dev, uses Inngest Dev Server (http://localhost:8288)
 * For production, uses Inngest Cloud API
 */
async function sendInngestEvent(
  email: string,
  source: string,
  referrer?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Get Inngest configuration from environment
  // INNGEST_EVENT_KEY is required for sending events
  // INNGEST_URL is optional (defaults to Inngest Cloud or local dev server)
  const inngestEventKey = Deno.env.get('INNGEST_EVENT_KEY');
  const inngestUrl = Deno.env.get('INNGEST_URL') || Deno.env.get('INNGEST_SIGNING_KEY') 
    ? 'https://api.inngest.com' 
    : 'http://localhost:8288'; // Local dev server
  
  if (!inngestEventKey) {
    // For local dev, event key might not be required
    // But for production, it's required
    if (!inngestUrl.includes('localhost')) {
      throw new Error('INNGEST_EVENT_KEY environment variable is required for production');
    }
  }
  
  const eventData = {
    name: 'email/subscribe',
    data: {
      email,
      source,
      ...(referrer ? { referrer } : {}),
      ...(metadata ? { metadata } : {}),
    },
  };
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization header if event key is available
  if (inngestEventKey) {
    headers['Authorization'] = `Bearer ${inngestEventKey}`;
  }
  
  const response = await fetch(`${inngestUrl}/v1/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(eventData),
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Inngest event send failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

/**
 * Subscribes a user to the newsletter
 *
 * @param supabase - Authenticated Supabase client (not used but kept for consistency)
 * @param input - Tool input with email, source, and optional metadata
 * @returns Success message
 * @throws If email validation fails or Inngest event send fails
 */
export async function handleSubscribeNewsletter(
  supabase: SupabaseClient<Database>,
  input: SubscribeNewsletterInput
) {
  // Sanitize inputs
  const email = sanitizeString(input.email);
  const source = sanitizeString(input.source || 'mcp');
  const referrer = input.referrer ? sanitizeString(input.referrer) : undefined;
  
  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid || !emailValidation.normalized) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_EMAIL,
      emailValidation.error || 'Invalid email address format'
    );
    throw new Error(error.message);
  }
  
  const normalizedEmail = emailValidation.normalized;
  
  // Send event to Inngest
  try {
    await sendInngestEvent(normalizedEmail, source, referrer, input.metadata);
  } catch (error) {
    await logError('Failed to send newsletter subscription event to Inngest', {
      email: normalizedEmail, // Auto-hashed by logger
      source,
      referrer,
    }, error);
    
    // Check if it's an Inngest-specific error
    if (error instanceof Error && error.message.includes('Inngest')) {
      const mcpError = createErrorResponse(
        McpErrorCode.INNGEST_ERROR,
        error.message
      );
      throw new Error(mcpError.message);
    }
    
    throw new Error(`Failed to process subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    content: [
      {
        type: 'text' as const,
        text: `Newsletter subscription request received for ${normalizedEmail}. You will receive a confirmation email shortly.`,
      },
    ],
    _meta: {
      email: normalizedEmail, // Auto-hashed in logs
      source,
      status: 'pending',
      message: 'Subscription request sent to Inngest for processing',
    },
  };
}
