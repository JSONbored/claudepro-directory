/**
 * Direct Discord Notification Route
 * POST /discord - Handle direct Discord notifications (not queue-based)
 */

import {
  badRequestResponse,
  discordCorsHeaders,
  handleDiscordNotification,
  initRequestLogging,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import { createUtilityContext, logger, MAX_BODY_SIZE, validateBodySize } from '@heyclaude/shared-runtime';

/**
 * Handle a direct (non-queued) Discord notification POST and forward it to the notification processor.
 *
 * Validates the `X-Discord-Notification-Type` header and request body size, sets up request logging and tracing, delegates processing to the Discord notification handler, and emits a completion trace for successful responses.
 *
 * @returns A Response representing the result of processing: a 400 response if the required header is missing or the body exceeds the allowed size, otherwise the response returned by the notification handler.
 */
export async function handleDiscordDirect(req: Request): Promise<Response> {
  const notificationType = req.headers.get('X-Discord-Notification-Type');

  if (!notificationType) {
    return badRequestResponse('Missing X-Discord-Notification-Type header', discordCorsHeaders);
  }
  
  // Create log context for logging
  const logContext = createUtilityContext('discord', 'direct-notification', {
    notificationType,
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Discord direct notification request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'discord-direct',
    notificationType,
  });

  // Validate body size before processing
  const contentLength = req.headers.get('content-length');
  const bodySizeValidation = validateBodySize(contentLength, MAX_BODY_SIZE.discord);
  if (!bodySizeValidation.valid) {
    return badRequestResponse(
      bodySizeValidation.error ?? 'Request body too large',
      discordCorsHeaders
    );
  }
  
  traceStep(`Processing Discord notification (type: ${notificationType})`, logContext);
  
  // Note: handleDiscordNotification will handle its own logging internally
  // We'll add traceRequestComplete after it returns if needed
  const response = await handleDiscordNotification(req, notificationType);
  
  // Check if response is successful (status 200-299)
  if (response.status >= 200 && response.status < 300) {
    traceRequestComplete(logContext);
  }
  
  return response;
}