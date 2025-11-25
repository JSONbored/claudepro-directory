/**
 * External Webhook Route
 * POST /webhook - Default route for external webhooks (catches all unmatched POST requests)
 */

import {
  badRequestResponse,
  errorResponse,
  ingestWebhookEvent,
  processPolarWebhook,
  processResendWebhook,
  successResponse,
  unauthorizedResponse,
  WebhookIngestError,
  webhookCorsHeaders,
} from '@heyclaude/edge-runtime';
import {
  createNotificationRouterContext,
  logError,
  logInfo,
  logWarn,
  MAX_BODY_SIZE,
  validateBodySize,
} from '@heyclaude/shared-runtime';

export async function handleExternalWebhook(req: Request): Promise<Response> {
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

    const logContext = createNotificationRouterContext('external-webhook', {
      source: result.source,
    });

    if (result.duplicate) {
      logInfo('Webhook already processed', {
        ...logContext,
        duplicate: result.duplicate,
        received_at: new Date().toISOString(),
      });
    } else {
      logInfo('Webhook routed', {
        ...logContext,
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
        await processPolarWebhook(result);
      } catch (error) {
        logError('Polar webhook processing failed', logContext, error);
        return errorResponse(error, 'flux-station:polar-webhook', corsHeaders, logContext);
      }
    } else if (!result.duplicate && result.source === 'resend') {
      try {
        await processResendWebhook(result);
      } catch (error) {
        logError('Resend webhook processing failed', logContext, error);
        return errorResponse(error, 'flux-station:resend-webhook', corsHeaders, logContext);
      }
    }

    return successResponse(
      { message: 'OK', source: result.source, duplicate: result.duplicate },
      200,
      corsHeaders
    );
  } catch (error) {
    const logContext = createNotificationRouterContext('external-webhook', {
      source: 'unknown',
    });

    if (error instanceof WebhookIngestError) {
      if (error.status === 'unauthorized') {
        logWarn('Unauthorized webhook', logContext);
        return unauthorizedResponse(error.message, webhookCorsHeaders);
      }
      logWarn('Bad webhook payload', logContext);
      return badRequestResponse(error.message, webhookCorsHeaders);
    }

    logError('Unexpected webhook error', logContext, error);
    return errorResponse(error, 'flux-station:webhook', webhookCorsHeaders, logContext);
  }
}
