/**
 * External Webhook Route
 * POST /webhook - Default route for external webhooks (catches all unmatched POST requests)
 */

import {
  badRequestResponse,
  errorResponse,
  initRequestLogging,
  ingestWebhookEvent,
  processPolarWebhook,
  processResendWebhook,
  successResponse,
  traceStep,
  unauthorizedResponse,
  WebhookIngestError,
  webhookCorsHeaders,
} from '@heyclaude/edge-runtime';
import {
  createNotificationRouterContext,
  logError,
  logInfo,
  logWarn,
  logger,
  MAX_BODY_SIZE,
  validateBodySize,
} from '@heyclaude/shared-runtime';

/**
 * Handle an incoming external webhook: validate payload size, ingest and route the event, and return a CORS-enabled HTTP response.
 *
 * @param req - The incoming HTTP request for the external webhook route
 * @returns An HTTP Response indicating the outcome:
 *  `200` with payload `{ message: 'OK', source, duplicate }` on success;
 *  `400` for invalid or oversized payloads;
 *  `401` for unauthorized requests;
 *  or an error response for processing failures. Responses include appropriate CORS headers.
 */
export async function handleExternalWebhook(req: Request): Promise<Response> {
  const logContext = createNotificationRouterContext('external-webhook', {
    source: 'unknown',
  });
  
  // Initialize request logging with trace and bindings (Phase 1 & 2)
  initRequestLogging(logContext);
  traceStep('External webhook request received', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'external-webhook',
    function: typeof logContext['function'] === "string" ? logContext['function'] : "unknown",
  });
  
  try {
    // Validate body size before reading
    const contentLength = req.headers.get('content-length');
    const bodySizeValidation = validateBodySize(contentLength, MAX_BODY_SIZE.webhook);
    if (!bodySizeValidation.valid) {
      return badRequestResponse(
        bodySizeValidation.error ?? 'Request body too large',
        webhookCorsHeaders
      );
    }

    const body = await req.text();
    // Double-check size after reading (in case Content-Length was missing/wrong)
    if (body.length > MAX_BODY_SIZE.webhook) {
      return badRequestResponse(
        `Request body too large (max ${MAX_BODY_SIZE.webhook} bytes)`,
        webhookCorsHeaders
      );
    }
    const result = await ingestWebhookEvent(body, req.headers);
    const cors = result.cors ?? webhookCorsHeaders;

    // Update bindings with source information
    logger.setBindings({
      source: result.source,
    });
    
    const enrichedLogContext = {
      ...logContext,
      source: result.source,
    };

    if (result.duplicate) {
      logInfo('Webhook already processed', {
        ...enrichedLogContext,
        duplicate: result.duplicate,
        received_at: new Date().toISOString(),
      });
    } else {
      logInfo('Webhook routed', {
        ...enrichedLogContext,
        duplicate: result.duplicate,
        received_at: new Date().toISOString(),
      });
    }

    // cors is Record<string, string> from ingestWebhookEvent
    // successResponse expects specific CORS headers structure
    // Validate and construct proper CORS headers object
    const getProperty = (obj: unknown, key: string): unknown => {
      if (typeof obj !== 'object' || obj === null) {
        return undefined;
      }
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      return desc?.value;
    };

    const getStringProperty = (obj: unknown, key: string): string | undefined => {
      const value = getProperty(obj, key);
      return typeof value === 'string' ? value : undefined;
    };

    const corsHeaders = {
      'Access-Control-Allow-Origin': getStringProperty(cors, 'Access-Control-Allow-Origin') ?? '*',
      'Access-Control-Allow-Methods':
        getStringProperty(cors, 'Access-Control-Allow-Methods') ?? 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        getStringProperty(cors, 'Access-Control-Allow-Headers') ?? 'Content-Type',
    };

    if (!result.duplicate && result.source === 'polar') {
      try {
        traceStep('Processing Polar webhook', enrichedLogContext);
        await processPolarWebhook(result);
        traceStep('Polar webhook processed successfully', enrichedLogContext);
      } catch (error) {
        await logError('Polar webhook processing failed', enrichedLogContext, error);
        return await errorResponse(error, 'flux-station:polar-webhook', corsHeaders, enrichedLogContext);
      }
    } else if (!result.duplicate && result.source === 'resend') {
      try {
        traceStep('Processing Resend webhook', enrichedLogContext);
        await processResendWebhook(result);
        traceStep('Resend webhook processed successfully', enrichedLogContext);
      } catch (error) {
        await logError('Resend webhook processing failed', enrichedLogContext, error);
        return await errorResponse(error, 'flux-station:resend-webhook', corsHeaders, enrichedLogContext);
      }
    }

    traceStep('External webhook request completed successfully', enrichedLogContext);
    return successResponse(
      { message: 'OK', source: result.source, duplicate: result.duplicate },
      200,
      corsHeaders
    );
  } catch (error) {
    if (error instanceof WebhookIngestError) {
      if (error.status === 'unauthorized') {
        logWarn('Unauthorized webhook attempt', {
          ...logContext,
          securityEvent: true, // Structured tag for security event filtering
          reason: error.message,
        });
        return unauthorizedResponse(error.message, webhookCorsHeaders);
      }
      logWarn('Bad webhook payload', logContext);
      return badRequestResponse(error.message, webhookCorsHeaders);
    }

    await logError('Unexpected webhook error', logContext, error);
    return await errorResponse(error, 'flux-station:webhook', webhookCorsHeaders, logContext);
  }
}