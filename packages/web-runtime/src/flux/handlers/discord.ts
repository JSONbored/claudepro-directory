/**
 * Discord Handlers
 *
 * Handles Discord-related flux operations:
 * - POST /api/flux/discord/direct - Send direct Discord notifications
 */

import { NextRequest, NextResponse } from 'next/server';

import { getEnvVar, normalizeError } from '@heyclaude/shared-runtime';

import { logger, generateRequestId, createWebAppContextWithId } from '../../logging/server';
import { createErrorResponse } from '../../utils/error-handler';

// CORS headers for Discord routes
const DISCORD_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Discord-Notification-Type',
};

// Max body size (64KB)
const MAX_BODY_SIZE = 65536;

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
  url?: string;
}

interface DiscordPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

/**
 * POST /api/flux/discord/direct
 * Send a direct Discord notification via webhook
 */
export async function handleDiscordDirect(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const notificationType = request.headers.get('X-Discord-Notification-Type');
  
  const logContext = createWebAppContextWithId(
    requestId,
    '/api/flux/discord/direct',
    'handleDiscordDirect'
  );

  // Validate notification type header
  if (!notificationType) {
    return NextResponse.json(
      { error: 'Missing X-Discord-Notification-Type header' },
      { status: 400, headers: DISCORD_CORS_HEADERS }
    );
  }

  // Validate body size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 400, headers: DISCORD_CORS_HEADERS }
    );
  }

  try {
    const body = await request.json() as DiscordPayload;

    // Get appropriate webhook URL based on notification type
    const webhookUrl = getWebhookUrl(notificationType);
    if (!webhookUrl) {
      logger.warn('Discord webhook URL not configured', {
        ...logContext,
        notificationType,
      });
      return NextResponse.json(
        { error: `Webhook not configured for type: ${notificationType}` },
        { status: 400, headers: DISCORD_CORS_HEADERS }
      );
    }

    // Send to Discord with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response: Response;
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.warn('Discord webhook timed out', {
          ...logContext,
          notificationType,
        });
        return NextResponse.json(
          { error: 'Discord webhook timed out' },
          { status: 504, headers: DISCORD_CORS_HEADERS }
        );
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn('Discord webhook failed', {
        ...logContext,
        notificationType,
        status: response.status,
        errorText: errorText.slice(0, 200),
      });
      return NextResponse.json(
        { error: 'Discord webhook failed', status: response.status },
        { status: 502, headers: DISCORD_CORS_HEADERS }
      );
    }

    const durationMs = Date.now() - startTime;
    logger.info('Discord notification sent', {
      ...logContext,
      durationMs,
      notificationType,
    });

    return NextResponse.json(
      { success: true, notificationType },
      { status: 200, headers: DISCORD_CORS_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Discord notification failed');
    logger.error('Discord notification failed', normalized, logContext);

    return createErrorResponse(error, {
      route: '/api/flux/discord/direct',
      operation: 'POST',
      method: 'POST',
      logContext: { requestId },
    });
  }
}

/**
 * Get the appropriate Discord webhook URL based on notification type
 */
function getWebhookUrl(notificationType: string): string | undefined {
  switch (notificationType) {
    case 'jobs':
    case 'job':
      return getEnvVar('DISCORD_JOBS_WEBHOOK_URL');
    case 'submissions':
    case 'submission':
      return getEnvVar('DISCORD_SUBMISSIONS_WEBHOOK_URL');
    case 'announcements':
    case 'announcement':
      return getEnvVar('DISCORD_ANNOUNCEMENTS_WEBHOOK_URL');
    case 'changelog':
      return getEnvVar('DISCORD_CHANGELOG_WEBHOOK_URL');
    case 'general':
    default:
      return getEnvVar('DISCORD_GENERAL_WEBHOOK_URL');
  }
}
