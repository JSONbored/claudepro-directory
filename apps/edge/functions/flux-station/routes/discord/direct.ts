/**
 * Direct Discord Notification Route
 * POST /discord - Handle direct Discord notifications (not queue-based)
 */

import {
  badRequestResponse,
  discordCorsHeaders,
  handleDiscordNotification,
} from '@heyclaude/edge-runtime';
import { MAX_BODY_SIZE, validateBodySize } from '@heyclaude/shared-runtime';

export async function handleDiscordDirect(req: Request): Promise<Response> {
  const notificationType = req.headers.get('X-Discord-Notification-Type');

  if (!notificationType) {
    return badRequestResponse('Missing X-Discord-Notification-Type header', discordCorsHeaders);
  }

  // Validate body size before processing
  const contentLength = req.headers.get('content-length');
  const bodySizeValidation = validateBodySize(contentLength, MAX_BODY_SIZE.discord);
  if (!bodySizeValidation.valid) {
    return badRequestResponse(
      bodySizeValidation.error ?? 'Request body too large',
      discordCorsHeaders
    );
  }

  return handleDiscordNotification(req, notificationType);
}
