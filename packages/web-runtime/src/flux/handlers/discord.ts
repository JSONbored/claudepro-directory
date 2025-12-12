/**
 * Discord Handlers
 *
 * Handles Discord-related flux operations:
 * - POST /api/flux/discord/direct - Send direct Discord notifications
 */

import { NextRequest, NextResponse } from 'next/server';

import { normalizeError } from '@heyclaude/shared-runtime';

import { logger, createWebAppContextWithId } from '../../logging/server';
import { createErrorResponse } from '../../utils/error-handler';
import { inngest } from '../../inngest';

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
  const notificationType = request.headers.get('X-Discord-Notification-Type');
  
  const logContext = createWebAppContextWithId(
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

    // Trigger Inngest function to handle Discord notification asynchronously
    // This eliminates blocking external API call from Vercel function (reduces CPU/bandwidth usage)
    try {
      await inngest.send({
        name: 'discord/direct',
        data: {
          notificationType,
          payload: body as Record<string, unknown>,
        },
      });

      logger.info(
        {
          ...logContext,
          notificationType,
        },
        'Discord notification enqueued to Inngest'
      );

      return NextResponse.json(
        { success: true, notificationType, message: 'Notification enqueued' },
        { status: 200, headers: DISCORD_CORS_HEADERS }
      );
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to enqueue Discord notification');
      logger.error(
        {
          err: normalized,
          ...logContext,
          notificationType,
        },
        'Failed to enqueue Discord notification to Inngest'
      );
      return NextResponse.json(
        { error: 'Failed to enqueue Discord notification' },
        { status: 500, headers: DISCORD_CORS_HEADERS }
      );
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Discord notification failed');
    logger.error({ err: normalized, ...logContext }, 'Discord notification failed');

    return createErrorResponse(error, {
      route: '/api/flux/discord/direct',
      operation: 'POST',
      method: 'POST',
      logContext: {},
    });
  }
}

// All Discord webhook URL resolution moved to Inngest function
// This eliminates blocking external API calls from Vercel functions
