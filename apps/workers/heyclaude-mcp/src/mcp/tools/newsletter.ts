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

import type { SubscribeNewsletterInput } from '../../lib/types';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import { sanitizeString } from '../../lib/utils';
import { validateEmail } from '@heyclaude/shared-runtime';
import { parseEnv } from '@heyclaude/cloudflare-runtime/config/env';
import type { ExtendedEnv } from '@heyclaude/cloudflare-runtime/config/env';
import { normalizeError } from '@heyclaude/cloudflare-runtime/utils/errors';
import type { ToolContext } from './categories';

/**
 * Sends newsletter subscription event to Inngest
 *
 * Uses Inngest HTTP API to send events.
 * For local dev, uses Inngest Dev Server (http://localhost:8288)
 * For production, uses Inngest Cloud API
 *
 * @param email - Email address to subscribe
 * @param source - Source of subscription (e.g., 'mcp')
 * @param env - Cloudflare Workers env object
 * @param referrer - Optional referrer URL
 * @param metadata - Optional metadata
 */
async function sendInngestEvent(
  email: string,
  source: string,
  env: ExtendedEnv,
  referrer?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Get Inngest configuration from Secrets Store (async)
  const config = await parseEnv(env);
  const inngestEventKey = config.inngest.eventKey;
  const inngestSigningKey = config.inngest.signingKey;
  const inngestUrl =
    config.inngest.url ||
    (inngestSigningKey ? 'https://api.inngest.com' : 'http://localhost:8288'); // Default based on signing key presence

  if (!inngestEventKey) {
    // For local dev, event key might not be required
    // But for production, it's required
    if (!inngestUrl.includes('localhost')) {
      throw new Error('INNGEST_EVENT_KEY secret is required for production');
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
    throw new Error(
      `Inngest event send failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }
}

/**
 * Subscribes a user to the newsletter
 *
 * @param input - Tool input with email, source, and optional metadata
 * @param context - Tool handler context
 * @returns Success message
 * @throws If email validation fails or Inngest event send fails
 */
export async function handleSubscribeNewsletter(
  input: SubscribeNewsletterInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    email: string;
    source: string;
    status: string;
    message: string;
  };
}> {
  const { env, logger } = context;
  // env is ExtendedEnv, which includes Secrets Store bindings
  const email = sanitizeString(input.email);
  const source = sanitizeString(input.source || 'mcp');
  const referrer = input.referrer ? sanitizeString(input.referrer) : undefined;
  const startTime = Date.now();

  try {
    // Validate email using shared-runtime utility
    const emailValidation = validateEmail(email, { required: true });
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
      await sendInngestEvent(normalizedEmail, source, env, referrer, input.metadata);
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to send newsletter subscription event to Inngest');
      logger.error(
        {
          error: normalized,
          tool: 'subscribeNewsletter',
          email: normalizedEmail, // Auto-hashed by logger
          source,
          referrer,
        },
        'Failed to send Inngest event'
      );

      // Check if it's an Inngest-specific error
      if (error instanceof Error && error.message.includes('Inngest')) {
        const mcpError = createErrorResponse(McpErrorCode.INNGEST_ERROR, error.message);
        throw new Error(mcpError.message);
      }

      throw normalized;
    }

    logger.info(
      {
        tool: 'subscribeNewsletter',
        duration_ms: Date.now() - startTime,
        source,
        email: normalizedEmail, // Auto-hashed by logger
      },
      'subscribeNewsletter completed successfully'
    );

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
  } catch (error) {
    const normalized = normalizeError(error, 'subscribeNewsletter tool failed');
    logger.error(
      { error: normalized, tool: 'subscribeNewsletter', email, source },
      'subscribeNewsletter tool error'
    );
    throw normalized;
  }
}
